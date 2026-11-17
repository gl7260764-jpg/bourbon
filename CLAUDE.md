# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run check:sitemap` — Assert the sitemap covers every indexable route

## Sitemap

`src/app/sitemap.ts` is generated from `src/lib/blog.ts`, `src/lib/locations.ts`
and the product table, so content enrols itself. Run `npm run check:sitemap`
after adding, renaming or removing any public page — it fails if an indexable
route is missing from the sitemap or a sitemap URL has no route. A page that
should stay out declares `index: false` in its static `export const metadata`.

## Order follow-ups

`/admin/follow-ups` drafts one message per stalled order and sends nothing
until an operator presses send. There is no scheduler, by design.

The message is chosen by **track**, not by "they haven't paid" — most stalled
orders here are waiting on *us*, and only `PAYMENT_DUE` chases money. The
rules live in `src/lib/order-follow-up.ts`; the client-safe labels and
thresholds in `src/lib/follow-up-constants.ts`.

- `npm run preview:follow-ups` prints the drafts against real orders,
  read-only. Run it after editing any of the copy — these go to customers.
- Follow-ups are transactional, so they omit `List-Unsubscribe`. Everything
  else through `campaign-mailer.ts` must keep passing `unsubscribeUrl`.
- No payment details ever go in the email, only a one-click sign-in link to
  the order. Same rule as `paymentDetailsEmail.ts`.

## Analytics traffic filter

`/admin/analytics` has a **Real users / Bots / All traffic** filter that
rescopes every visitor-derived query, not just the table. Real users is the
default. Rules live in `src/lib/visitor-traffic.ts`.

- `isLikelyBot()` in `visitor.ts` runs at write time and catches whatever
  names itself. Against real data that is **1 visitor in 2994** — do not
  rebuild this filter on it. What gets through sends a genuine Chrome user
  agent, so the rules read the *shape* of the traffic: agents that are not
  browsers, visitors that never requested a page, and clusters of 8+ cookies
  sharing one byte-identical agent with no engagement anywhere in the group.
- **An email address or any measured dwell time outranks every other rule.**
  Counting a bot overstates a number; dropping a customer deletes a real
  person from the numbers. Two live visitors send a user agent of `"pc"` and
  `"android"` and then stayed ~10s — the not-a-browser rule had them as
  robots until engagement was made to override it. Keep that precedence.
- Orders, revenue and subscriber sources are never filtered: they come from
  checkout and signup forms, not from tracking.
- Anything merely unproven stays counted as human and is disclosed in the
  "How a bot is spotted" panel rather than quietly folded in.

## Architecture

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (via PostCSS plugin)
- **Path alias**: `@/*` maps to `./src/*`
- **Source structure**: All app code lives under `src/`
  - `src/app/` — App Router routes (layouts, pages, API routes)
