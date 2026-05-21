// Resolve a request's approximate country/region/city.
//
// Strategy:
//   1. Read free, header-injected geo metadata from Vercel or Cloudflare.
//      (Both populate these for every request in production — zero latency.)
//   2. If neither is present (e.g. local dev), fall back to a lightweight
//      lookup via ipapi.co. Wrapped in try/catch so failure never blocks the
//      response.

export interface GeoInfo {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  ip: string | null;
}

function pickHeader(headers: Headers, ...names: string[]): string | null {
  for (const name of names) {
    const v = headers.get(name);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function extractIp(headers: Headers): string | null {
  const fwd = pickHeader(headers, "x-forwarded-for");
  if (fwd) {
    // First IP in the chain is the original client.
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return pickHeader(headers, "x-real-ip", "cf-connecting-ip");
}

export async function geoFromRequest(headers: Headers): Promise<GeoInfo> {
  const countryCode = pickHeader(
    headers,
    "x-vercel-ip-country",
    "cf-ipcountry",
  );
  const region = pickHeader(
    headers,
    "x-vercel-ip-country-region",
    "cf-region-code",
    "cf-region",
  );
  const city = pickHeader(headers, "x-vercel-ip-city", "cf-ipcity");
  const ip = extractIp(headers);

  if (countryCode) {
    return {
      countryCode,
      country: countryName(countryCode) ?? countryCode,
      region: region ? decodeURIComponent(region) : null,
      city: city ? decodeURIComponent(city) : null,
      ip,
    };
  }

  // Dev fallback. Production should never hit this branch.
  if (ip && ip !== "::1" && !ip.startsWith("127.") && !ip.startsWith("10.")) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          country_code?: string;
          country_name?: string;
          region?: string;
          city?: string;
        };
        if (data?.country_code) {
          return {
            countryCode: data.country_code,
            country: data.country_name ?? null,
            region: data.region ?? null,
            city: data.city ?? null,
            ip,
          };
        }
      }
    } catch {
      // network or timeout — silently fall through
    }
  }

  return { country: null, countryCode: null, region: null, city: null, ip };
}

// Minimal ISO-3166-1 alpha-2 → display name mapping. We only need to
// resolve names for countries we actually see in traffic; anything missing
// just shows the code, which is still readable.
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  NZ: "New Zealand", IE: "Ireland", DE: "Germany", FR: "France", IT: "Italy",
  ES: "Spain", PT: "Portugal", NL: "Netherlands", BE: "Belgium", CH: "Switzerland",
  AT: "Austria", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", CZ: "Czechia", HU: "Hungary", GR: "Greece", RO: "Romania",
  BG: "Bulgaria", JP: "Japan", KR: "South Korea", CN: "China", HK: "Hong Kong",
  TW: "Taiwan", SG: "Singapore", MY: "Malaysia", TH: "Thailand", PH: "Philippines",
  ID: "Indonesia", VN: "Vietnam", IN: "India", PK: "Pakistan", BD: "Bangladesh",
  LK: "Sri Lanka", AE: "United Arab Emirates", SA: "Saudi Arabia", IL: "Israel",
  TR: "Turkey", EG: "Egypt", NG: "Nigeria", KE: "Kenya", ZA: "South Africa",
  GH: "Ghana", CI: "Côte d'Ivoire", CM: "Cameroon", MA: "Morocco", DZ: "Algeria",
  TN: "Tunisia", MX: "Mexico", BR: "Brazil", AR: "Argentina", CL: "Chile",
  CO: "Colombia", PE: "Peru", VE: "Venezuela", UY: "Uruguay", PY: "Paraguay",
  BO: "Bolivia", EC: "Ecuador", CR: "Costa Rica", PA: "Panama", DO: "Dominican Republic",
  CU: "Cuba", PR: "Puerto Rico", RU: "Russia", UA: "Ukraine", BY: "Belarus",
};

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRY_NAMES[code.toUpperCase()] ?? null;
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🌍";
  const upper = code.toUpperCase();
  const base = 0x1f1e6 - "A".charCodeAt(0);
  return (
    String.fromCodePoint(upper.charCodeAt(0) + base) +
    String.fromCodePoint(upper.charCodeAt(1) + base)
  );
}
