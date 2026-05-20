"use client";

export function VisaLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-white border border-bourbon-deep/10 rounded-sm`}>
      <span className="font-bold italic tracking-tight text-[#1A1F71] text-sm leading-none">VISA</span>
    </span>
  );
}

export function MastercardLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-1.5 bg-white border border-bourbon-deep/10 rounded-sm`}>
      <svg viewBox="0 0 32 20" className="h-4 w-auto" aria-hidden>
        <circle cx="12" cy="10" r="8" fill="#EB001B" />
        <circle cx="20" cy="10" r="8" fill="#F79E1B" />
        <path d="M16 4.2a8 8 0 010 11.6 8 8 0 010-11.6z" fill="#FF5F00" />
      </svg>
    </span>
  );
}

export function AmexLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-[#2E77BB] rounded-sm`}>
      <span className="font-bold tracking-tight text-white text-[10px] leading-none">AMEX</span>
    </span>
  );
}

export function PaypalLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-white border border-bourbon-deep/10 rounded-sm`}>
      <span className="font-bold italic tracking-tight text-sm leading-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#0070BA]">Pal</span>
      </span>
    </span>
  );
}

export function ApplePayLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center gap-0.5 px-2 bg-black rounded-sm text-white`}>
      <svg viewBox="0 0 384 512" className="h-3 w-auto fill-current" aria-hidden>
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span className="font-medium text-xs leading-none">Pay</span>
    </span>
  );
}

export function BitcoinLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-full bg-[#F7931A] text-white`}>
      <span className="font-bold text-sm leading-none">₿</span>
    </span>
  );
}

export function ChimeLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-[#1EC677] rounded-sm`}>
      <span className="font-extrabold tracking-tight text-white text-sm leading-none">
        Chime
      </span>
    </span>
  );
}

export function EthereumLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-full bg-[#627EEA]`}>
      <svg viewBox="0 0 24 24" className="h-4 w-auto" aria-hidden>
        <path fill="#FFFFFF" d="M12 2L5 12.5l7 4 7-4z" opacity=".7" />
        <path fill="#FFFFFF" d="M12 22l7-9-7 4-7-4z" opacity=".9" />
      </svg>
    </span>
  );
}

export function UpsLogo({ className = "h-7" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-[#341B14] rounded-sm`}>
      <span className="font-extrabold italic tracking-tight text-[#FFB500] text-sm leading-none">UPS</span>
    </span>
  );
}

export function FedexLogo({ className = "h-7" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-white border border-bourbon-deep/10 rounded-sm`}>
      <span className="font-extrabold tracking-tight text-sm leading-none">
        <span className="text-[#4D148C]">Fed</span>
        <span className="text-[#FF6600]">Ex</span>
      </span>
    </span>
  );
}

export function UspsLogo({ className = "h-7" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-white border border-bourbon-deep/10 rounded-sm`}>
      <span className="font-bold italic tracking-tight text-[#004B87] text-[10px] leading-none">USPS</span>
    </span>
  );
}

export function DhlLogo({ className = "h-7" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex items-center justify-center px-2 bg-[#FFCC00] rounded-sm`}>
      <span className="font-extrabold italic tracking-tight text-[#D40511] text-sm leading-none">DHL</span>
    </span>
  );
}
