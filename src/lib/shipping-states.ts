/**
 * Where we may legally ship a bottle of spirits.
 *
 * This is the single source of truth. It used to be a display-only array on
 * the shipping page listing eight prohibited states, which implied we ship to
 * the other forty-two — and nothing anywhere enforced even that. Checkout took
 * the state as free text and the order API checked only that the country was
 * US, so an order from a prohibited state was accepted without complaint.
 *
 * The forty-two figure came from reading a WINE map. Wine direct-to-consumer
 * shipping is legal in nearly every state; distilled spirits is a different and
 * far narrower regime, and for a licensed RETAILER shipping to a consumer it is
 * currently four jurisdictions. That distinction is the single most expensive
 * mistake available here, so the type below is named `retailer` rather than
 * anything vaguer: producer/distillery DtC reaches more states (DC, KY, NE, NH,
 * ND outright, plus narrow programmes in AK, AZ, CA, NY, RI, VT, WV) and none
 * of that helps a bottle shop.
 *
 * Kentucky is the one that surprises people: KRS 243.027(2) makes the direct
 * shipper licence available to manufacturers, not retailers, so our own home
 * state is closed to us on this licence. Intrastate delivery as a quota retail
 * package licensee under KRS 243.240 is a separate question and is not modelled
 * here.
 *
 * NOT LEGAL ADVICE, and deliberately not presented as settled. Three further
 * gates sit on top of anything this file says:
 *   - A destination-state shipper licence must be in hand first (NH, NE and ND
 *     each require one; ND also wants a sales and use tax permit), with their
 *     own fees and monthly or annual reporting.
 *   - Common carriers are a separate veto. FedEx and UPS move alcohol only
 *     under a signed agreement with adult-signature service, and in practice
 *     restrict spirits from retailers even where a state permits it. USPS
 *     cannot carry alcohol at all (18 U.S.C. 1716(f)). A state "yes" is worth
 *     nothing without a carrier "yes".
 *   - Local option still bites inside permitted states — New Hampshire's dry
 *     towns, and local rules in Nebraska and North Dakota.
 *
 * DC is the weakest of the four and is flagged in its own entry: the authority
 * is an exemption from an import prohibition rather than an affirmative shipper
 * licence, and the regulator guidance behind it is dated and speaks of
 * "suppliers" rather than retailers. Confirm with ABCA before relying on it.
 *
 * Re-check annually, and sooner for: California (AB 1246's spirits pilot lapses
 * 1/1/2027 unless extended) and Iowa, Colorado and Missouri, which all had
 * spirits DtC bills in play without enactment.
 */

/** Whether an out-of-state licensed retailer may ship spirits to a consumer. */
export type RetailerDtc = "allowed" | "prohibited";

export interface ShippingState {
  /** USPS two-letter code. The value stored on an order. */
  code: string;
  name: string;
  retailer: RetailerDtc;
  /** Why we cannot ship there. Shown to the customer, so it stays short. */
  note?: string;
  /** Conditions we must honour where we can ship. Operational, not cosmetic. */
  limit?: string;
}

/** Position as researched. Shown on the shipping page so the date is public. */
export const DTC_RESEARCH_AS_OF = "October 2026";

export const SHIPPING_STATES: ShippingState[] = [
  {
    code: "AL",
    name: "Alabama",
    retailer: "prohibited",
    note: "Ala. Code 28-4-110 / 28-4-111 make it unlawful for any carrier or person to bring or deliver prohibited liquors into the state. 2021 SB 126 created only an in-state…",
  },
  {
    code: "AK",
    name: "Alaska",
    retailer: "prohibited",
    note: "SB 9 (Title 4 rewrite, effective 1/1/2024) ended out-of-state RETAILER shipping into Alaska. Producers only: Manufacturer Direct Shipment license (~$200/2 yrs)…",
  },
  {
    code: "AZ",
    name: "Arizona",
    retailer: "prohibited",
    note: "Only holders of an Out-of-State Craft Distillery license (Series 02D) may sell/deliver spirits to Arizona consumers ordering by phone, mail, fax, catalogue or…",
  },
  {
    code: "AR",
    name: "Arkansas",
    retailer: "prohibited",
    note: "No DtC shipping of spirits by producers or retailers; Arkansas has no spirits direct-shipper license and does not permit out-of-state retailer shipments.",
  },
  {
    code: "CA",
    name: "California",
    retailer: "prohibited",
    note: "AB 1246 (signed 10/3/2025) created the Type 94 Distilled Spirits Direct Shipper Permit effective 1/1/2026, open to California craft distillers AND qualifying…",
  },
  {
    code: "CO",
    name: "Colorado",
    retailer: "prohibited",
    note: "Colorado permits DtC wine shipping only; there is no spirits direct-shipper permit and no out-of-state retailer DtC. Spirits DtC legislation is flagged as likely to…",
  },
  {
    code: "CT",
    name: "Connecticut",
    retailer: "prohibited",
    note: "Connecticut's Retailer Wine Shipper's Permit ($600/yr, 5 gal per person per two months) covers WINE only. Out-of-state spirits manufacturers may not ship DtC. A…",
  },
  {
    code: "DE",
    name: "Delaware",
    retailer: "prohibited",
    note: "Delaware enacted its first DtC WINE shipping law in 2025. Spirits are not included, and there is no out-of-state retailer DtC channel.",
  },
  {
    code: "DC",
    name: "District of Columbia",
    retailer: "allowed",
    limit: "12 bottles per resident per calendar month.",
  },
  {
    code: "FL",
    name: "Florida",
    retailer: "prohibited",
    note: "Fla. Stat. 561.545 / 561.54 bar out-of-state sellers and carriers from shipping alcohol to anyone in Florida other than a licensed manufacturer, distributor…",
  },
  {
    code: "GA",
    name: "Georgia",
    retailer: "prohibited",
    note: "Georgia permits DtC wine shipping only; no spirits direct-shipper license and no out-of-state retailer DtC.",
  },
  {
    code: "HI",
    name: "Hawaii",
    retailer: "prohibited",
    note: "No spirits DtC channel. Hawaii introduced a spirits DtC bill in the 2026 session and WSWA's July 2026 review reports no shipping bills were enacted in 2026, which…",
  },
  {
    code: "ID",
    name: "Idaho",
    retailer: "prohibited",
    note: "Control state for spirits (Idaho State Liquor Division). Wine DtC only; no spirits direct-shipper permit and no out-of-state retailer DtC.",
  },
  {
    code: "IL",
    name: "Illinois",
    retailer: "prohibited",
    note: "Illinois' winery shipper's license covers wine only. Spirits DtC bills (e.g. SB 532) have been introduced repeatedly but not enacted; no out-of-state retailer DtC.",
  },
  {
    code: "IN",
    name: "Indiana",
    retailer: "prohibited",
    note: "Indiana's direct wine seller's permit covers wine only (and requires an in-person initial purchase for some shippers). No spirits DtC and no out-of-state retailer…",
  },
  {
    code: "IA",
    name: "Iowa",
    retailer: "prohibited",
    note: "Control state for spirits. Wine DtC only. DISCUS/American Distilling Institute ran a 'Ship My Spirits' campaign in 2026 backing HF 2354 / SF 245 to allow spirits…",
  },
  {
    code: "KS",
    name: "Kansas",
    retailer: "prohibited",
    note: "Kansas permits DtC wine shipping only; no spirits direct-shipper permit and no out-of-state retailer DtC.",
  },
  {
    code: "KY",
    name: "Kentucky",
    retailer: "prohibited",
    note: "KRS 243.027(2) limits the Kentucky direct shipper license to a manufacturer located in Kentucky or any other state, a cannabis-infused beverage manufacturer, or a…",
  },
  {
    code: "LA",
    name: "Louisiana",
    retailer: "prohibited",
    note: "Louisiana's two retailer shipping credentials (Authority to Make Direct Shipments of Wine from the Dept. of Revenue and the ATC Direct Wine Shipper Permit, $1,000…",
  },
  {
    code: "ME",
    name: "Maine",
    retailer: "prohibited",
    note: "Control state for spirits. Wine DtC only. A spirits direct-shipper bill (LD 1358) was introduced but not enacted; no out-of-state retailer DtC.",
  },
  {
    code: "MD",
    name: "Maryland",
    retailer: "prohibited",
    note: "Maryland's direct wine shipper's permit covers wine only. No spirits DtC and no out-of-state retailer DtC.",
  },
  {
    code: "MA",
    name: "Massachusetts",
    retailer: "prohibited",
    note: "Massachusetts' direct wine shipper license covers wine only. No spirits DtC and no out-of-state retailer DtC. A common-carrier reporting bill remains pending in…",
  },
  {
    code: "MI",
    name: "Michigan",
    retailer: "prohibited",
    note: "Control state for spirits (MLCC is the wholesaler of record). Michigan's direct shipper license covers wine (and beer via in-state licensees) and the Sixth Circuit…",
  },
  {
    code: "MN",
    name: "Minnesota",
    retailer: "prohibited",
    note: "Minnesota's direct ship license covers wine only. No spirits DtC and no out-of-state retailer DtC.",
  },
  {
    code: "MS",
    name: "Mississippi",
    retailer: "prohibited",
    note: "Control state. Mississippi enacted DtC WINE shipping in 2025 only. A spirits DtC bill was introduced in 2026 but, per WSWA's July 2026 review, no shipping bills…",
  },
  {
    code: "MO",
    name: "Missouri",
    retailer: "prohibited",
    note: "Missouri's wine direct shipper license covers wine only. A 2026 spirits DtC bill failed (WSWA testified against it); Missouri is flagged as likely to reintroduce.…",
  },
  {
    code: "MT",
    name: "Montana",
    retailer: "prohibited",
    note: "Control state for spirits. Montana's connoisseur's license / winery direct shipping covers wine only. No spirits DtC and no out-of-state retailer DtC.",
  },
  {
    code: "NE",
    name: "Nebraska",
    retailer: "allowed",
    limit:
      "108 L per person per year, all drink categories combined. S1 shipper licence, $500/yr.",
  },
  {
    code: "NV",
    name: "Nevada",
    retailer: "prohibited",
    note: "SB 307 amended NRS 369.490 effective 7/1/2021 to end DtC shipping by breweries, distilleries and retailers (in-state and out-of-state). The Nevada Dept. of…",
  },
  {
    code: "NH",
    name: "New Hampshire",
    retailer: "allowed",
    limit:
      "60 containers of 1 L or less per consumer per calendar year. Direct shipper permit, $500. No dry towns.",
  },
  {
    code: "NJ",
    name: "New Jersey",
    retailer: "prohibited",
    note: "New Jersey's out-of-state winery license covers wine (and cider/mead) only. Craft distillery DtC bills (A 3167, S 3020) and a 2026 spirits DtC bill were introduced…",
  },
  {
    code: "NM",
    name: "New Mexico",
    retailer: "prohibited",
    note: "New Mexico's out-of-state retailer DtC channel is WINE only and reciprocal (only California and New Mexico retailers), 2 cases of wine per person per month.…",
  },
  {
    code: "NY",
    name: "New York",
    retailer: "prohibited",
    note: "S.2852A / A.3132A, signed August 2024 and effective November 2024, created an out-of-state direct shipper's license for small distillers (ABC Law 68 / 79-c…",
  },
  {
    code: "NC",
    name: "North Carolina",
    retailer: "prohibited",
    note: "N.C.G.S. 18B-102.1 prohibits direct shipments from out of state to NC residents, and 18B-109 limits direct shipment to wine under a wine shipper permit. Control…",
  },
  {
    code: "ND",
    name: "North Dakota",
    retailer: "allowed",
    limit:
      "9 L per person per month. Direct shipping licence ($50/yr) plus a sales and use tax permit.",
  },
  {
    code: "OH",
    name: "Ohio",
    retailer: "prohibited",
    note: "Control state for spirits (Ohio Division of Liquor Control / OHLQ). The S-1 and S-2 direct shipping permits cover WINE (and beer) only; out-of-state spirits…",
  },
  {
    code: "OK",
    name: "Oklahoma",
    retailer: "prohibited",
    note: "Oklahoma's direct wine shipper permit covers wine only. A 2026 bill that would have expressly prohibited out-of-state retail alcohol shipments stalled, but no DtC…",
  },
  {
    code: "OR",
    name: "Oregon",
    retailer: "prohibited",
    note: "Control state for spirits. The OLCC Direct Shipper Permit ($50/yr plus $1,000 bond) covers malt beverages, wine and cider - not spirits - and Sovos lists…",
  },
  {
    code: "PA",
    name: "Pennsylvania",
    retailer: "prohibited",
    note: "Control state. The PLCB direct wine shipper license covers wine only. For spirits, a consumer must place a Special Liquor Order, which is shipped to a PLCB-operated…",
  },
  {
    code: "RI",
    name: "Rhode Island",
    retailer: "prohibited",
    note: "A Rhode Island distiller may ship spirits to a consumer ONLY where the consumer was physically present on the distillery's licensed premises when the order was…",
  },
  {
    code: "SC",
    name: "South Carolina",
    retailer: "prohibited",
    note: "South Carolina permits DtC wine shipping only; no spirits direct-shipper permit and no out-of-state retailer DtC.",
  },
  {
    code: "SD",
    name: "South Dakota",
    retailer: "prohibited",
    note: "Wine DtC only. A 2026 spirits DtC bill (with carrier reporting) stalled and, per WSWA's July 2026 review, no shipping bills were enacted in 2026. No out-of-state…",
  },
  {
    code: "TN",
    name: "Tennessee",
    retailer: "prohibited",
    note: "Tennessee's winery direct shipper license covers wine only. No spirits DtC and no out-of-state retailer DtC.",
  },
  {
    code: "TX",
    name: "Texas",
    retailer: "prohibited",
    note: "Texas' out-of-state winery direct shipper's permit covers wine only. No spirits DtC and no out-of-state retailer DtC.",
  },
  {
    code: "UT",
    name: "Utah",
    retailer: "prohibited",
    note: "Control state. Utah prohibits ALL direct-to-consumer alcohol shipping - wine, beer, cider and spirits alike - by producers and retailers. The strictest jurisdiction…",
  },
  {
    code: "VT",
    name: "Vermont",
    retailer: "prohibited",
    note: "Control state. 7 V.S.A. 277 (Malt, vinous, and ready-to-drink spirits beverage consumer shipping license) permits DtC shipping only of ready-to-drink spirits…",
  },
  {
    code: "VA",
    name: "Virginia",
    retailer: "prohibited",
    note: "Control state for spirits. The Virginia ABC Wine and/or Beer Shipper's License ($230/yr) covers beer, cider and wine only - not spirits - at 2 cases per person per…",
  },
  {
    code: "WA",
    name: "Washington",
    retailer: "prohibited",
    note: "Washington permits DtC wine and beer shipping only; a spirits DtC bill (HB 1432) was introduced but not enacted. No out-of-state retailer DtC. Individual…",
  },
  {
    code: "WV",
    name: "West Virginia",
    retailer: "prohibited",
    note: "Control state. W. Va. Code 60-4-3c lets a distillery, mini-distillery or micro-distillery obtain a private direct shipper license, but shipments to a purchaser must…",
  },
  {
    code: "WI",
    name: "Wisconsin",
    retailer: "prohibited",
    note: "Wisconsin's out-of-state shipper permit covers wine (and cider) only. No spirits DtC and no out-of-state retailer DtC.",
  },
  {
    code: "WY",
    name: "Wyoming",
    retailer: "prohibited",
    note: "Control state. Wyoming's Out-of-State Wine Shipper license ($50/yr, 36 L per household per year) is WINE only, and wines the state control board lists for sale may…",
  },
];

const BY_CODE = new Map(SHIPPING_STATES.map((s) => [s.code, s]));

export function stateByCode(code: string): ShippingState | undefined {
  return BY_CODE.get(code.trim().toUpperCase());
}

/** The gate. An unknown code is refused rather than waved through. */
export function canShipTo(code: string | null | undefined): boolean {
  if (!code) return false;
  return stateByCode(code)?.retailer === "allowed";
}

/** Jurisdictions we can ship to, for the checkout selector and the page. */
export const SHIPPABLE_STATES: ShippingState[] = SHIPPING_STATES.filter(
  (s) => s.retailer === "allowed",
);

/** Everywhere we cannot, for the "why isn't my state here" list. */
export const RESTRICTED_STATES: ShippingState[] = SHIPPING_STATES.filter(
  (s) => s.retailer !== "allowed",
);

/** One wording for the refusal, so the form and the API cannot drift apart. */
export function cannotShipMessage(code: string | null | undefined): string {
  const s = code ? stateByCode(code) : undefined;
  const where = s ? s.name : "that state";
  return `We cannot ship spirits to ${where}. Direct-to-consumer spirits shipping by a retailer is not permitted there.`;
}
