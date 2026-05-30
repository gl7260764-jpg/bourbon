"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import Image from "next/image";

interface Toast {
  id: number;
  name: string;
  image: string;
  price: number;
}

interface ToastContextType {
  showToast: (name: string, image: string, price: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (name: string, image: string, price: number) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, name, image, price }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[90] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-pop-in pointer-events-auto flex items-center gap-3 bg-bourbon-deep border border-bourbon-gold/30 p-3 pr-4 sm:pr-5 shadow-xl shadow-black/20 w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm"
          >
            <div className="relative w-12 h-12 shrink-0 overflow-hidden">
              <Image src={toast.image} alt={toast.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-bourbon-cream text-sm font-medium truncate">{toast.name}</p>
              <p className="text-bourbon-gold text-xs">
                Added to cart &middot; ${toast.price.toFixed(2)}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-green-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
