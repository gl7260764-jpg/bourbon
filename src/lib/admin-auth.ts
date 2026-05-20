export const ADMIN_COOKIE = "bourbon-admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// SHA-256 via Web Crypto so this runs in middleware (edge) and server actions (node).
export async function sha256(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedTokenForCurrentPassword(): Promise<string | null> {
  const password = process.env.BOURBON_ADMIN_PASSWORD;
  if (!password) return null;
  return sha256(password);
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};
