import nodemailer, { Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;
let configLogged = false;

interface SmtpErrorLike {
  message?: string;
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
}

function logSmtpError(label: string, err: unknown) {
  const e = err as SmtpErrorLike;
  console.error(`[mailer] ${label}:`, {
    message: e?.message,
    code: e?.code,
    command: e?.command,
    response: e?.response,
    responseCode: e?.responseCode,
  });
}

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!configLogged) {
    configLogged = true;
    console.log("[mailer] SMTP config detected:", {
      host: host ?? "(missing)",
      port,
      user: user ?? "(missing)",
      passLength: pass ? pass.length : 0,
      from: process.env.SMTP_FROM ?? "(missing)",
    });
  }

  if (!host || !user || !pass) {
    console.warn(
      "[mailer] SMTP env vars missing — emails will not be sent. Required: SMTP_HOST, SMTP_USER, SMTP_PASS.",
    );
    return null;
  }

  try {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } catch (err) {
    logSmtpError("createTransport failed", err);
    return null;
  }

  return cachedTransporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;

  try {
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    console.log("[mailer] sent:", {
      to: input.to,
      subject: input.subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return true;
  } catch (err) {
    logSmtpError(`sendMail to=${input.to} failed`, err);
    return false;
  }
}
