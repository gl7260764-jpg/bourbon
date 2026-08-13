# ADMIN-BLUEPRINT.md — Bourbon & Oak

Discovery output. Every admin-panel prompt reads this file before writing code.
Generated 2026-08-11 against commit `5649b4b` (branch `main`).

---

## 1. Codebase facts

| Concern | Finding | Evidence |
|---|---|---|
| Framework | Next.js 16.2.6, App Router, React 19, TypeScript | `package.json`, `src/app/` |
| Rendering | RSC by default; admin pages are server components with `export const dynamic = "force-dynamic"` | `src/app/admin/analytics/page.tsx:8` |
| Data layer | Prisma 6.19.3 → Neon Postgres (pooled + `directUrl`) | `prisma/schema.prisma:6-12` |
| Migrations | **None.** No `prisma/migrations/`; schema is applied with `prisma db push` | `prisma/` contains only `schema.prisma`, `seed.ts` |
| Build | `prisma generate && next build` — does **not** run migrations | `package.json` scripts |
| Auth | Single shared password → SHA-256 → cookie `bourbon-admin`. **No user table, no roles.** | `src/lib/admin-auth.ts`, `src/middleware.ts` |
| Route guard | Edge middleware on `/admin/:path*` and `/api/admin/:path*` | `src/middleware.ts:44-46` |
| Styling | Tailwind v4 (PostCSS), custom `bourbon-*` tokens, Playfair Display + Inter | `src/app/globals.css`, `src/app/layout.tsx` |
| Icons | Inline SVG path strings, no icon library | `src/app/admin/AdminSidebar.tsx` (`iconPath`) |
| Validation | **None.** No zod/yup/valibot — hand-rolled `if` checks per handler | `package.json`, `src/app/api/orders/route.ts:88-105` |
| File storage | Cloudinary | `src/lib/cloudinary.ts`, `src/app/api/admin/upload/route.ts` |
| Email | Nodemailer over SMTP | `src/lib/mailer.ts`, `src/lib/emails/orderEmails.ts` |
| Push | `web-push` (VAPID) | `src/lib/push.ts`, `src/app/api/admin/notifications/send/route.ts` |
| Jobs/queues/cron | **None.** All work is request-scoped | — |
| Caching | `revalidatePath` in server actions only | `src/app/admin/orders/[id]/actions.ts:27-29` |
| Toast | `useToast()` from a client `ToastProvider` — **storefront only, not mounted in admin** | `src/components/CartToast.tsx:25`, `src/components/SiteChrome.tsx:18-20` |

### Already built (15 admin routes)

`/admin` · `/admin/analytics` · `/admin/categories` · `/admin/chat` · `/admin/login` ·
`/admin/messages` · `/admin/messages/[id]` · `/admin/notifications` · `/admin/orders` ·
`/admin/orders/[id]` · `/admin/products` · `/admin/products/[id]` · `/admin/products/new` ·
`/admin/settings` · `/admin/subscribers`

This is **not** a greenfield build. The work is hardening and filling gaps, not scaffolding.

---

## 2. What this system is

**Product.** A direct-to-consumer storefront for allocated and rare Kentucky bourbon,
trading as Bourbon & Oak at `bourbonoaklover.com`. Visitors browse a 27-bottle catalogue,
place orders for delivery, subscribe to a release list, and talk to staff via live chat.
It also runs distillery tours and an editorial journal. Single-operator business —
one person is merchandiser, fulfiller, and support.

**Actors.**

| Actor | Exists as | Notes |
|---|---|---|
| Customer | No account model. Identity = `Order.email` + `Visitor.email` | Guest checkout only |
| Anonymous visitor | `Visitor` (cookie `bol_vid`) | Full journey tracking |
| Subscriber | `Subscriber` | Newsletter/popup capture |
| Operator/admin | Shared password, no record | **One undifferentiated role** |

### 3. Unit of value and how it is confirmed — the keystone

**Unit of value:** one `Order`.

**Confirmation is MANUAL, and it is the single most important fact about this system.**

There is no payment processor anywhere in the dependency tree — no Stripe, no PayPal SDK,
no Square (`package.json`). `POST /api/orders` writes `status: "PENDING"`
(`src/app/api/orders/route.ts:115`) and charges nothing. The customer is shown payment
instructions at checkout and pays out of band (Chime, crypto, card-by-arrangement).

Value is confirmed when a human opens the order and flips the status to `PAID` via
`updateOrderStatus()` (`src/app/admin/orders/[id]/actions.ts:16`).

That server action is the cash register, and today it has **no controls**:

- **No transition guard.** Any status → any status. `REFUNDED` → `PENDING` is legal.
- **No payment reference.** No field anywhere records *what* was received — no txid, no
  Chime confirmation, no screenshot, no amount-received. The `Order` model has no such
  column (`prisma/schema.prisma:173-212`).
- **No audit trail.** Nothing records who changed a status or when. `updatedAt` is the
  only trace and it is overwritten by the next edit.
- **No idempotency.** Double-confirmation is invisible.

**Everything in Phase 1 below exists to fix this.** This is module 12, and in this system
it is not an optional extra — it is the core business loop.

### 4. Money model

Decimal(10,2), USD, stored on `Order` as a `subtotal`/`discount`/`tax`/`total` snapshot plus
`shippingCost` and a `discountRate` Decimal(4,3). `OrderItem` snapshots `unitPrice`,
`productName`, `productImage` at order time. No payouts, no multi-currency, no refund
amounts (only a `REFUNDED` status).

> **✅ FIXED 2026-08-12 — this finding is closed.** Kept for the record; see the
> "Server-side total recomputation" entry under Progress.
>
> **Finding (as discovered) — totals were client-supplied and never re-verified.**
> `src/app/api/orders/route.ts:124-141` writes `shippingCost`, `discountRate`, `subtotal`,
> `discount`, `tax`, `total` and every `unitPrice` straight from the request body. The
> server never reads the product's real price from the database. A crafted POST can create
> an order for a $750 bottle at any price it likes. Discounts are equally unchecked —
> `payment.discountRate` is trusted verbatim.
> This is a live vulnerability, not a style issue. It also means the operator confirming
> payment has no way to know a total was tampered with. Recomputing totals server-side is
> **P1 work**, listed in Phase 1 below.

### 5. Lifecycle of the primary object

`OrderStatus` (`prisma/schema.prisma:149-156`): `PENDING → PAID → SHIPPED → DELIVERED`,
with `CANCELLED` and `REFUNDED` as terminal exits.

Intended legal transitions (**not currently enforced anywhere**):

```
PENDING   → PAID | CANCELLED
PAID      → SHIPPED | REFUNDED | CANCELLED
SHIPPED   → DELIVERED | REFUNDED
DELIVERED → REFUNDED
CANCELLED → (terminal)
REFUNDED  → (terminal)
```

**Stock is never decremented.** `POST /api/orders` does not touch `Product.stockBottles`
or `stockCases`. Overselling an allocated bottle is currently possible and invisible.

### 6. Compliance and safety constraints

- **Age gate (21+)** — localStorage-based modal, `src/components/AgeVerification.tsx`.
  Alcohol e-commerce; shipping legality varies by US state and is **not** enforced anywhere.
- **PII** — orders carry full name, address, phone, email in plain columns. No retention
  policy, no redaction, no export-on-request tooling.
- **Behavioural tracking** — `Visitor`/`PageView` store IP-derived geo, user agent, and a
  full page-by-page journey, now joinable to an email address via `Visitor.email`
  (`prisma/schema.prisma:345-372`). The privacy policy does not currently disclose this
  linkage (`src/app/privacy/page.tsx`).
- **Secrets** — `BOURBON_ADMIN_PASSWORD` is a single shared credential; it is the only
  thing standing between the internet and every customer's address.

---

## 3. Entity map

| Archetype | Meaning | This system's model(s) |
|---|---|---|
| CORE ENTITY | The bottle being sold | `Product`, `ProductImage`, `Award` |
| TAXONOMY | How bottles are grouped | `Category` |
| TRANSACTION | The exchange, carries state + money | `Order`, `OrderItem` |
| ACTOR | People with accounts | **— none.** Guest checkout; no `User` model |
| IDENTITY/VISITOR | Pre-account presence | `Visitor`, `VisitDay` |
| EVENT STREAM | Append-only behavioural log | `PageView` |
| CONTENT | Editorial surfaces | **Code-side only** — `src/lib/blog.ts` (`BLOG_POSTS`), `src/lib/product-seo.ts` |
| CHANNEL | Outbound reach | `Subscriber`, `PushSubscription`, `Conversation` + `ChatMessage`, `ContactMessage` |
| CONFIG | Operator-tunable settings | `Setting` (key-value) |

---

## 4. Module set — 25 verdicts

| # | Module | Verdict | Name here | Justification |
|---|---|---|---|---|
| 1 | Auth & role gate | **ADAPTED** | Admin access | Guard exists (`src/middleware.ts`) but one shared password, zero roles, no lockout |
| 2 | Admin shell / nav | **BUILT** | — | `src/app/admin/AdminSidebar.tsx` + `layout.tsx`, mobile drawer present |
| 3 | Design-system primitives | **APPLICABLE** | — | Only one shared admin component exists; five pages each declare their own formatter (`formatCurrency`, `formatPrice`, `formatMoney`, `formatDate`, `formatDateTime`) |
| 4 | API + data conventions | **APPLICABLE** | — | Envelope is inconsistent (`{error}`, `{ok:true}`, bare object); no validation library |
| 5 | Loading / error states | **APPLICABLE** | — | No `loading.tsx` or `error.tsx` anywhere under `/admin` |
| 6 | Dashboard overview | **BUILT** | Dashboard | `src/app/admin/page.tsx` |
| 7 | Analytics | **BUILT** | Analytics | `src/app/admin/analytics/page.tsx` — KPIs, new vs returning, top pages, journeys |
| 8 | Core entity CRUD | **BUILT** | Bottles | `products/`, `products/new`, `products/[id]` + `ProductForm.tsx` |
| 9 | Taxonomy | **BUILT** | Collections | `src/app/admin/categories/page.tsx` |
| 10 | Transaction list | **BUILT** | Orders | `src/app/admin/orders/page.tsx` |
| 11 | Transaction detail | **BUILT** | Order detail | `src/app/admin/orders/[id]/page.tsx` |
| 12 | **Manual value-confirmation** | **APPLICABLE — CRITICAL** | Payment confirmation | No proof field, no transition guard, no audit. See §2.3 |
| 13 | Payment/settlement config | **APPLICABLE** | Payment methods | Options + discount rates are hardcoded in a **client** component (`src/app/checkout/CheckoutClient.tsx:29,129`) |
| 14 | Actor management | **ADAPTED** | Customers | No accounts; derive from `Order.email` + `Visitor.email`. Read-only profile, not CRUD |
| 15 | Discounts / promotions | **ADAPTED** | Payment discounts | No `Coupon` model. Only a payment-method rate, and it's client-supplied (§2.4) |
| 16 | Event stream viewer | **APPLICABLE** | Activity | `PageView` is captured but has no dedicated viewer beyond the journeys panel |
| 17 | Identity / visitor CRM | **APPLICABLE** | Visitors | `Visitor` now carries `email`/`emailCapturedAt`; no per-visitor page exists |
| 18 | Content CMS | **ADAPTED** | Journal | Posts live in `src/lib/blog.ts` as code, not the DB. Either migrate to a model or leave as a developer surface — **decide before building** |
| 19 | Broadcast + push | **BUILT** | Notifications | `src/app/admin/notifications/page.tsx` |
| 20 | Device registry | **APPLICABLE** | Push devices | `PushSubscription` exists with no listing UI and no 410-pruning |
| 21 | Mailing list | **BUILT** | Subscribers | `subscribers/` + filter-aware CSV export |
| 22 | Campaign composer | **SKIP (Phase 3)** | — | No campaign model. Nodemailer exists, so it's feasible later; nothing depends on it now |
| 23 | Tracked links & attribution | **SKIP (Phase 3)** | — | No model, no `/r/` route. Worth revisiting — active SEO work makes channel attribution valuable |
| 24 | Referral partners | **SKIP** | — | No model and no evidence the business has partners |
| 25 | Settings & secrets | **BUILT (thin)** | Settings | `Setting` KV + `/admin/settings` currently holds only the email-popup config |

**Extra module not in the reference list:** Live chat console (`/admin/chat`,
`Conversation`/`ChatMessage`) and Contact messages (`/admin/messages`) — both built.

---

## 5. Information architecture

```
OVERVIEW
  Dashboard              /admin
  Analytics              /admin/analytics

SELLING
  Orders                 /admin/orders
  Payment confirmation   /admin/orders?status=pending   (queue view — to build)
  Bottles                /admin/products
  Collections            /admin/categories

PEOPLE
  Customers              /admin/customers               (to build)
  Visitors               /admin/visitors                (to build)
  Subscribers            /admin/subscribers
  Messages               /admin/messages
  Live chat              /admin/chat

REACH
  Notifications          /admin/notifications
  Push devices           /admin/devices                 (to build)

SYSTEM
  Settings               /admin/settings
  Audit log              /admin/audit                   (to build)
```

Current sidebar order (`AdminSidebar.tsx`) is flat and ungrouped: Dashboard, Products,
Categories, Orders, Messages, Chat, Subscribers, Notifications, Analytics, Settings.
Grouping is a P2 change.

---

## 6. Role matrix

The system has **no roles**. Everyone with the password is a superuser. Minimum proposed set,
carried by a new `AdminUser.role` column (there is no user table to extend today):

| Module | OWNER | MANAGER | SUPPORT |
|---|---|---|---|
| Dashboard / Analytics | R | R | R |
| Orders — view | R | R | R |
| Orders — confirm payment | RW | RW | — |
| Orders — refund / cancel | RW | — | — |
| Bottles / Collections | RWD | RW | R |
| Customers / Visitors | R | R | R |
| Subscribers — export | RW | RW | — |
| Messages / Chat | RW | RW | RW |
| Notifications — send | RW | RW | — |
| Settings / Payment config | RWD | — | — |
| Audit log | R | R | — |

Until `AdminUser` exists, every prompt must assume a single OWNER and must **not** invent a
role check that silently passes.

---

## 7. Conventions contract

Follow these exactly. Do not introduce a parallel stack.

- **Admin pages** → `src/app/admin/<module>/page.tsx` (server component, `export const dynamic = "force-dynamic"`).
- **Admin client components** → colocated in the module folder (e.g. `ProductForm.tsx`), `"use client"` at top.
- **Shared admin components** → `src/components/admin/`.
- **Mutations** → prefer a colocated `actions.ts` with `"use server"` (as `orders/[id]/actions.ts` does), not an API route.
- **Admin API handlers** → `src/app/api/admin/<module>/route.ts`.
- **Auth guard** → edge middleware already covers `/admin/*` and `/api/admin/*`
  (`src/middleware.ts`). Handlers may assume an authenticated admin and must say so in a
  comment, matching `src/app/api/admin/chat/greeting/route.ts:8`. **Server actions are NOT
  covered by the matcher path in the same way — treat any new action as needing its own check.**
- **API envelope** → success `NextResponse.json(data)`; error `NextResponse.json({ error: string }, { status })`.
  Standardise on this; it is the dominant existing shape.
- **Validation** → no library. Validate explicitly at the top of the handler and return
  `{ error }` with 400. Normalise/clamp in a pure module (pattern: `src/lib/popup-constants.ts` `normalizePopupSettings`).
- **Cache** → call `revalidatePath()` for every affected route after a write
  (`orders/[id]/actions.ts:27-29` revalidates list, detail, and dashboard).
- **Settings** → `getSetting`/`setSetting` in `src/lib/settings.ts`; keys are constants in a
  client-safe `*-constants.ts` module.
- **Toast** → `useToast()` exists but `ToastProvider` is storefront-only. Admin currently has
  no toast; either mount the provider in the admin layout or use inline status text
  (`PopupSettingsForm.tsx` does the latter). **Pick one in P3 and apply everywhere.**
- **Formatting** → **no shared helpers exist yet.** Five separate declarations:
  `formatCurrency` (`admin/page.tsx:6`), `formatPrice` (`admin/products/page.tsx:11`),
  `formatMoney` (`admin/analytics/page.tsx:17`), `formatDate` (`admin/subscribers/page.tsx:16`),
  `formatDateTime` (`admin/messages/[id]/page.tsx:9`). Three of those five format money,
  each slightly differently. Consolidate into `src/lib/format.ts` and refactor callers —
  do not add a sixth.
- **Geo/visitor helpers** → `src/lib/geo.ts` (`countryFlag`, `countryName`),
  `src/lib/visitor.ts` (`visitorLabel`, `deviceLabel`).
- **Design tokens** → `bourbon-deep`, `bourbon-gold`, `bourbon-stone`, `bourbon-cream`,
  `bourbon-dark`, `bourbon-amber`. Admin surface is `bg-[#F4F1EC]`; cards are
  `bg-white border border-bourbon-deep/10`; headings use `font-[family-name:var(--font-playfair)]`.

---

## 8. Priority order

### Phase 1 — must ship (the business is exposed without these)

1. **P12 Payment confirmation workflow** — transition guard, payment-reference capture
   (method, txid/handle, amount received, confirmed-by, confirmed-at), and a PENDING queue.
2. **Server-side total recomputation** — stop trusting client prices/discounts (§2.4).
   Strictly a storefront-API fix, but the admin cannot be trusted until it lands.
3. **P30 Audit log** — who changed what, when. Required to make status changes accountable.
4. **P01 Auth hardening** — real admin users + roles, login rate limiting.

### Phase 2 — operational leverage

5. **Stock decrement on order** (and oversell protection for allocated bottles).
6. **P04 API contract** + explicit validation on every write path.
7. **P13 Payment-method config** — move options and discount rates out of the client bundle.
8. **P14 Customers** — order history and lifetime value by email.
9. **P05 Loading/error states**; **P03 design-system + `src/lib/format.ts` consolidation**.

### Phase 3 — growth and polish

10. **P17 Visitors CRM** + **P16 activity stream** (data already exists, no UI).
11. **P20 Push device registry** with 410-pruning.
12. **P02 nav grouping**, **P25 list state**, **P28 export**, **P26 cache**.
13. **P18 Journal CMS** — only if blog posts move from code to the database.
14. **P23 attribution** — pairs well with the ongoing SEO work.

---

## Open questions

1. **Blog: code or database?** `BLOG_POSTS` is a typed literal in `src/lib/blog.ts`. Moving it
   to the DB unlocks P18 but loses type-safe structured content. Which do you want?
2. **Payment reference fields** — what does a Chime/crypto confirmation actually look like in
   practice? The schema needs the real fields, not guessed ones.
3. **Multiple admins?** The role matrix assumes yes eventually. If it's permanently one
   person, P01 shrinks to rate limiting + a stronger secret, and roles are dead weight.
4. **State shipping restrictions** — should the panel block orders to states where bourbon
   shipment is illegal? Currently nothing checks.
5. **PII retention** — is there a required deletion window for order addresses?
6. **`prisma db push` with no migrations** — acceptable long-term? Phase-1 schema changes
   (payment reference, audit log) are the moment to decide.

---

## Progress

- [x] **P00 Discovery** — completed 2026-08-11. Output: this file. No feature code written.
- [x] **P13 Payment methods config** — built 2026-08-11 (pulled forward from Phase 2 at the
      operator's request, since the order email depends on it).
      Files: `prisma/schema.prisma` (`PaymentOption` model, `PaymentMethod.OTHER`,
      `Order.paymentOptionKey/paymentLabel/paymentInstructions`),
      `src/lib/payment-options.ts`, `src/app/api/payment-options/route.ts`,
      `src/app/admin/payment-methods/{page,PaymentMethodsClient,actions}.tsx|ts`,
      `src/app/admin/AdminSidebar.tsx`, `src/app/api/orders/route.ts`,
      `src/app/api/orders/[orderNumber]/route.ts`, `src/lib/emails/orderEmails.ts`,
      `src/app/checkout/CheckoutClient.tsx`,
      `src/app/checkout/confirmation/ConfirmationClient.tsx`,
      `scripts/seed-payment-options.ts`.
      Notes: rails are now DB-driven and operator-editable; account details are
      snapshotted onto the order and delivered in the email + confirmation page.
      **Closed part of the §2.4 vulnerability** — `discountRate` is now resolved from
      the `PaymentOption` row instead of the request body (verified: a client-sent
      0.99 was stored as the configured 0.1). Tax removed from new orders (always 0);
      historical tax still renders. Line-item prices are STILL client-supplied —
      that remains open below.
- [x] **P12 Payment confirmation workflow** — built 2026-08-12.
      Files: `prisma/schema.prisma` (`SettlementState` enum + `Order.settlementState`,
      `paymentReference`, `amountReceived`, `settlementNote`, `settlementUpdatedAt/By`),
      `src/lib/order-status.ts` (NEW — legal transition map, labels, badges),
      `src/app/admin/orders/[id]/actions.ts` (rewritten: guarded `updateOrderStatus`,
      new `updateSettlement`), `src/app/admin/orders/[id]/SettlementPanel.tsx` (NEW),
      `src/app/admin/orders/[id]/page.tsx`, `src/app/admin/orders/page.tsx`
      (verification queue).
      **Adaptations from the reference prompt, and why:**
      - `AWAITING_DETAILS → DETAILS_SENT` collapsed into `AWAITING_PAYMENT`. P13 emails
        the rail's instructions automatically at order time, so no order ever waits for a
        human to send details, and the prompt's `post-details` action has nothing to do.
      - Customer proof-upload, QR upload and customer push **not built**: there is no
        customer account, session, or storefront upload surface, and push is admin-only
        broadcast. The operator instead records the reference the buyer replies with.
        Consequently the prompt's "proof images are not publicly guessable" item is N/A —
        no images are stored.
      - Server actions, not a single `action`-discriminated API route, per the
        Conventions contract. The discriminator moved onto the action's FormData.
      **The real fix:** the legal-transition map previously existed only in the order
      detail UI (it chose which buttons to render) while the server action accepted any
      status. It is now enforced server-side and the UI derives buttons from the same
      constant.
      Verified through the real admin UI over CDP: record-reference → confirm payment
      produced `status=PAID`, `settlementState=PAID`, reference and amount stored,
      attributed to `admin`; panel then goes read-only. Guards verified directly:
      PENDING→DELIVERED refused, PAID→PENDING refused, same-status re-submit is a no-op,
      record-proof without a reference and reject without a reason both refused.
- [x] **Server-side total recomputation** — built 2026-08-12. Closes the §2.4
      vulnerability in full.
      Files: `src/app/api/orders/route.ts`.
      The client now sends only WHICH product and HOW MANY. `unitPrice`,
      `productName`, `subtotal`, `discount` and `total` are all derived from the
      catalogue; the request's `totals` and `price` fields are ignored (a mismatch
      is logged as a warning, since it means the buyer saw a different price than
      they're charged).
      Two latent bugs fixed on the way: cart ids carry a `::case` suffix for case
      purchases, which was being stored verbatim as `OrderItem.productId` (a
      non-existent product id), and `isCase` was hardcoded `false` so every case
      order was recorded as a bottle. Case lines now resolve `casePrice`, set
      `isCase: true`, and store a clean product id.
      Verified: ordering a $750 bottle with `price: 1, total: 1` now stores
      $750 — and the forged product name was replaced with the catalogue name.
      Legitimate crypto order (2 × $750, 10% off) computed $1500/$150/$1350
      exactly; a case line resolved to the $1500 case price with `isCase: true`;
      unknown product ids and empty carts are rejected.
      **Still open:** stock is not decremented and availability is not enforced,
      so an ARCHIVED or SOLD_OUT bottle can still be ordered *(Phase 2)*.
- [x] **Customer proof-of-payment upload** — built 2026-08-12 at the operator's
      request. This is the part of P12 originally marked "not built" for lack of a
      customer surface; that gap is now closed.
      Files: `prisma/schema.prisma` (`Order.paymentProofPublicId`,
      `paymentProofUploadedAt`), `src/lib/cloudinary.ts` (`uploadPaymentProof`,
      `signedProofUrl`, `deletePaymentProof`),
      `src/app/api/orders/[orderNumber]/proof/route.ts` (NEW),
      `src/app/checkout/confirmation/PaymentProofUpload.tsx` (NEW),
      `src/app/checkout/confirmation/ConfirmationClient.tsx`,
      `src/lib/order-snapshot.ts`, `src/app/admin/orders/[id]/SettlementPanel.tsx`,
      `src/app/admin/orders/[id]/page.tsx`.
      **Privacy decision:** proofs are stored as Cloudinary `authenticated`
      assets, not public ones. A payment screenshot routinely shows a bank
      balance or an account number, so only the public id is stored and the admin
      page signs a 15-minute URL at render time. Verified: signed URL returns 200,
      the same URL with the signature stripped returns **401**.
      Uploading sets `settlementState = PROOF_SUBMITTED`, so the order lands in
      the existing verification queue automatically (confirmed: the queue tile
      read "1 Payment awaiting verification").
      Guards: only PENDING orders accept an upload; images only (8 MB cap);
      unknown order → 404; re-upload replaces and deletes the previous asset.
      **Residual risk:** there is no customer login, so possession of the order
      number is the only credential for uploading, and there is no rate limiting
      (no infrastructure for it in this codebase). An attacker who knew an order
      number could attach an image to it. Bounded by: PENDING-only, image-only,
      size-capped, one-per-order, and nothing about the order is returned.
- [x] **Customer accounts (P14, storefront half)** — built 2026-08-12.
      Files: `prisma/schema.prisma` (`Customer`, `CustomerSession`,
      `Order.customerId`), `src/lib/customer-auth.ts` (NEW),
      `src/app/api/account/login/route.ts`, `src/app/api/account/logout/route.ts`,
      `src/app/account/{page,actions}.tsx|ts`, `src/app/account/AccountClient.tsx`,
      `src/app/account/login/{page,LoginForm}.tsx`,
      `src/app/api/orders/route.ts`, `src/components/Navbar.tsx`,
      `scripts/backfill-customers.ts`.
      An account is created automatically on a first order; later orders refresh
      the prefill details. Signed-in customers see their order history, upload a
      payment receipt against any pending order, and edit their delivery details.
      Backfill linked all 11 pre-existing orders to 4 accounts.
      Sessions are opaque random tokens in `CustomerSession` — revocable, and
      nothing about the customer is derivable from the cookie.
      **⚠ SECURITY, ACCEPTED BY THE OPERATOR:** sign-in takes an email address
      with **no verification**. Anyone who knows a customer's email can read that
      person's home address, phone and order history. `lib/customer-auth.ts` is
      deliberately ignorant of how a session is granted, so adding a magic link
      or OTP later changes only `api/account/login/route.ts`.
      This partly supersedes the residual risk noted under the proof-upload
      entry: a signed-in customer no longer needs the order number to attach a
      receipt, though the order-number path still exists for guests.
      **Note:** this is the customer-facing half of P14. The admin-facing
      "Customers" view (order history and lifetime value per account) is still
      unbuilt and remains a Phase 2 item.
- [x] **P10/P11 Orders list + detail — finished** 2026-08-13. Both were marked
      BUILT at discovery, but an audit against `patterns.md` found real gaps.
      Files: `src/app/admin/orders/page.tsx` (rewritten),
      `src/app/admin/orders/[id]/page.tsx`.
      Fixed on the list: **silent 100-order cap** (there was no way to reach
      order 101) replaced with 25-per-page pagination; **no search** → search by
      order number, name, email or phone; **status chips had no counts** → each
      chip carries its own, computed with the status dimension stripped so a tab
      doesn't report the size of the tab you're on; **raw enums on screen**
      (`PENDING`) → human labels from `lib/order-status`; **table-only with a
      760px min-width** (sideways scroll on a phone) → table at `lg+`, cards
      below, per the responsive law; settlement state and a receipt marker now
      show inline on pending rows. `buildHref` merges params so search, status,
      queue and page can't drop each other.
      Added on the detail page: clickable mailto (pre-filled subject) and tel
      links, repeat-customer count linking to that customer's other orders, and
      lifetime value — **counting only PAID/SHIPPED/DELIVERED**, since money in
      PENDING is not revenue.
      Verified live: search 12 → 2 → 3 → 0 across queries; pagination rendered
      "Page 1 of 2 · showing 1–25 of 32" with a working Older link (tested by
      inserting 20 throwaway orders, since 12 fit on one page); chip counts
      correct; no raw enum in visible text; detail page showed "6 orders from
      this customer".
- [ ] P30 Audit log *(Phase 1)*
- [ ] P01 Auth hardening — admin users, roles, rate limiting *(Phase 1)*
- [ ] Stock decrement + oversell protection *(Phase 2)*
- [ ] P04 API contract + validation *(Phase 2)*
- [ ] P13 Payment-method config *(Phase 2)*
- [ ] P14 Customers *(Phase 2)*
- [ ] P05 Loading/error states *(Phase 2)*
- [ ] P03 Design system + `src/lib/format.ts` *(Phase 2)*
- [ ] P17 Visitors CRM *(Phase 3)*
- [ ] P16 Activity stream *(Phase 3)*
- [ ] P20 Push device registry *(Phase 3)*
- [ ] P02 Nav grouping *(Phase 3)*
- [ ] P25 List state · P26 Cache · P28 Export *(Phase 3)*
- [ ] P18 Journal CMS *(Phase 3 — blocked on Open Question 1)*
- [ ] P23 Attribution *(Phase 3)*

Built before this blueprint existed (verified, not re-scaffolded): shell/nav, dashboard,
analytics, bottles CRUD, collections, orders list + detail, messages, live chat,
subscribers, notifications, settings.
