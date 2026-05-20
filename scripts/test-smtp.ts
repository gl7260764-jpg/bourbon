import { loadEnvConfig } from "@next/env";
import nodemailer from "nodemailer";

loadEnvConfig(process.cwd());

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS ?? "";

const masked =
  pass.length <= 2
    ? "*".repeat(pass.length)
    : pass[0] + "*".repeat(Math.max(0, pass.length - 2)) + pass[pass.length - 1];

console.log("[test-smtp] config:", {
  host,
  port,
  user,
  passLength: pass.length,
  passMasked: masked,
  passStartsWith: pass.slice(0, 2),
  passEndsWith: pass.slice(-2),
});

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

(async () => {
  try {
    await transporter.verify();
    console.log("[test-smtp] ✓ SMTP login succeeded.");
  } catch (err) {
    console.error("[test-smtp] ✗ SMTP login failed:", err);
    process.exit(1);
  }
})();
