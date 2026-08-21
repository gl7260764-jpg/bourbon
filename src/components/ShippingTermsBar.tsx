import Link from "next/link";
import {
  FREE_SHIPPING_THRESHOLD,
  MIN_ORDER_TOTAL,
} from "@/lib/commerce";

/**
 * Site-wide terms strip, rendered inside the fixed header.
 *
 * It is tied to the header's own background state rather than shown
 * unconditionally: over the transparent homepage hero a solid gold band cuts
 * the image in half and competes with the headline, so it collapses away and
 * returns the moment the header goes solid — on scroll, or on any page that is
 * not the homepage.
 *
 * SiteChrome renders a matching spacer on non-home pages, where the bar is
 * always open. The homepage needs none: its hero deliberately sits under the
 * fixed header, and by the time the bar appears the hero has scrolled past.
 */
export const TERMS_BAR_HEIGHT = "h-7";

export default function ShippingTermsBar({ show }: { show: boolean }) {
  return (
    /* Animated on grid-rows rather than height: the same trick the mobile menu
       uses, and it avoids transitioning to `height: auto`. Duration matches the
       header's own 500ms background fade so the two move as one. */
    <div
      aria-hidden={!show}
      className={`grid overflow-hidden transition-all duration-500 ease-out ${
        show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className={`${TERMS_BAR_HEIGHT} bg-bourbon-gold flex items-center justify-center px-4`}>
          <p className="text-bourbon-deep text-[10px] sm:text-[11px] tracking-wider text-center truncate">
            <span className="font-bold">${MIN_ORDER_TOTAL} minimum order</span>
            <span className="mx-2 opacity-50">·</span>
            <span className="font-bold">Free shipping over ${FREE_SHIPPING_THRESHOLD}</span>
            <Link
              href="/shipping"
              tabIndex={show ? undefined : -1}
              className="ml-2 underline underline-offset-2 hover:opacity-70 transition-opacity hidden sm:inline"
            >
              Details
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
