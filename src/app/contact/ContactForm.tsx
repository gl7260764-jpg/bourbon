"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendMessage, type ContactFormState } from "./actions";

const initialState: ContactFormState = { ok: false };

/* One input treatment, so every field focuses and fails the same way. The
   ring is drawn with box-shadow rather than `ring-*` so it sits outside the
   1px border instead of replacing it. */
const FIELD_BASE =
  "w-full bg-white border px-3.5 py-3 text-bourbon-deep text-sm placeholder:text-bourbon-stone/75 " +
  "transition-[border-color,box-shadow] outline-none " +
  "focus:border-bourbon-gold focus:shadow-[0_0_0_3px_rgba(202,138,4,0.16)]";

function fieldClass(invalid?: string): string {
  return `${FIELD_BASE} ${
    invalid
      ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.16)]"
      : "border-bourbon-deep/15 hover:border-bourbon-deep/30"
  }`;
}

function FieldLabel({
  children,
  htmlFor,
  optional,
}: {
  children: React.ReactNode;
  htmlFor: string;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline justify-between gap-2 text-bourbon-stone text-[10px] tracking-[0.2em] uppercase mb-2"
    >
      <span>{children}</span>
      {optional && (
        <span className="text-bourbon-stone/50 tracking-normal normal-case text-xs">
          optional
        </span>
      )}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-red-600 text-xs" role="alert">
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-9 py-4 font-semibold tracking-[0.15em] uppercase text-xs transition-colors ${
        pending
          ? "bg-bourbon-deep/10 text-bourbon-deep/45 cursor-not-allowed"
          : "bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber cursor-pointer"
      }`}
    >
      {pending && (
        <svg
          className="w-3.5 h-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {pending ? "Sending" : "Send message"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendMessage, initialState);

  if (state.ok) {
    return (
      <div className="border border-bourbon-gold/40 bg-bourbon-warm/40 p-6 sm:p-8">
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-bourbon-gold/20 mb-4">
          <svg
            className="w-5 h-5 text-bourbon-gold"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep">
          Your note is with us
        </h3>
        <p className="text-bourbon-stone leading-relaxed mt-2">
          We reply within one business day — check the inbox you gave us, and
          your spam folder if it is quiet.
        </p>
        <Link
          href="/shop"
          className="inline-block mt-5 text-bourbon-gold font-semibold text-sm hover:text-bourbon-amber transition-colors"
        >
          Browse the cellar while you wait
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Jane Carter"
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
            className={fieldClass(state.fieldErrors?.name)}
          />
          <FieldError id="name-error" message={state.fieldErrors?.name} />
        </div>
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? "email-error" : undefined
            }
            className={fieldClass(state.fieldErrors?.email)}
          />
          <FieldError id="email-error" message={state.fieldErrors?.email} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="subject" optional>
          Subject
        </FieldLabel>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="Allocated bottle, shipping, a tour…"
          className={fieldClass()}
        />
      </div>

      <div>
        <FieldLabel htmlFor="body">Message</FieldLabel>
        <textarea
          id="body"
          name="body"
          rows={7}
          required
          minLength={10}
          placeholder="Tell us what you are after — an order number helps if this is about a delivery."
          aria-invalid={Boolean(state.fieldErrors?.body)}
          aria-describedby={state.fieldErrors?.body ? "body-error" : undefined}
          className={`${fieldClass(state.fieldErrors?.body)} resize-y min-h-[9rem]`}
        />
        <FieldError id="body-error" message={state.fieldErrors?.body} />
      </div>

      {state.error && (
        <div
          role="alert"
          className="flex gap-3 p-4 bg-red-50 border border-red-200 text-red-800 text-sm"
        >
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.2v.3" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <div className="pt-1">
        <SubmitButton />
        <p className="text-bourbon-stone/85 text-xs mt-3">
          We use your address to answer you, and nothing else.
        </p>
      </div>
    </form>
  );
}
