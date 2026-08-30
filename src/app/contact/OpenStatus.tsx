"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the cellar is staffed right now, in Eastern time.
 *
 * The server sits in UTC and the visitor could be anywhere, so this is a value
 * that genuinely differs between server and client — which is what
 * useSyncExternalStore is for. It renders nothing during SSR and hydration,
 * then swaps in the real answer, with no mismatch and no setState in an effect.
 */

/** [openHour, closeHour) in ET, or null for closed. Index is getDay(). */
const HOURS: ([number, number] | null)[] = [
  null, // Sunday
  [9, 18],
  [9, 18],
  [9, 18],
  [9, 18],
  [9, 18],
  [10, 16], // Saturday
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function hour12(h: number): string {
  const suffix = h >= 12 ? "pm" : "am";
  return `${h % 12 === 0 ? 12 : h % 12}${suffix}`;
}

/** The visitor's instant, expressed as an Eastern-time weekday and clock. */
function easternNow(): { day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: DAY_NAMES.findIndex((d) => d.startsWith(get("weekday"))),
    // hourCycle h23 can report midnight as "24"; fold it back to 0.
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

/* A primitive snapshot, so referential equality holds and the store does not
   re-render on every check. It only changes when the displayed minute does. */
function getSnapshot(): string {
  const { day, hour, minute } = easternNow();
  return `${day}:${hour}:${minute}`;
}

/** Nothing to show until we are on the client and know the visitor's clock. */
function getServerSnapshot(): null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

function describe(key: string): { open: boolean; label: string; detail: string } {
  const [day, hour, minute] = key.split(":").map(Number);
  const today = HOURS[day];
  const nowMinutes = hour * 60 + minute;

  if (today && nowMinutes >= today[0] * 60 && nowMinutes < today[1] * 60) {
    return { open: true, label: "Open now", detail: `Until ${hour12(today[1])} ET` };
  }

  // Opening later today counts before we go looking at tomorrow.
  if (today && nowMinutes < today[0] * 60) {
    return { open: false, label: "Closed", detail: `Opens at ${hour12(today[0])} ET` };
  }

  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7;
    const slot = HOURS[next];
    if (!slot) continue;
    return {
      open: false,
      label: "Closed",
      detail: `Opens ${ahead === 1 ? "tomorrow" : DAY_NAMES[next]} at ${hour12(slot[0])} ET`,
    };
  }

  return { open: false, label: "Closed", detail: "" };
}

export default function OpenStatus() {
  const key = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Hold the line's height so the rail does not jump when it resolves.
  if (!key) return <span className="block h-5" aria-hidden="true" />;

  const status = describe(key);

  return (
    <span className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          status.open ? "bg-emerald-600" : "bg-bourbon-stone/40"
        }`}
      />
      <span
        className={status.open ? "text-emerald-700 font-semibold" : "text-bourbon-stone"}
      >
        {status.label}
      </span>
      {status.detail && (
        <>
          <span aria-hidden="true" className="text-bourbon-stone/35">
            ·
          </span>
          <span className="text-bourbon-stone">{status.detail}</span>
        </>
      )}
    </span>
  );
}
