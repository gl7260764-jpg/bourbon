"use client";

const KEY = "bourbon:profile";
const VERSION = 1;

export interface SavedProfile {
  contact: { email: string; phone: string };
  address: {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
}

interface StoredShape extends SavedProfile {
  v: number;
  savedAt: string;
}

export function loadProfile(): SavedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredShape;
    if (data.v !== VERSION) return null;
    return { contact: data.contact, address: data.address };
  } catch {
    return null;
  }
}

export function saveProfile(profile: SavedProfile): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredShape = {
      v: VERSION,
      savedAt: new Date().toISOString(),
      ...profile,
    };
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
