"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendMessage, type ContactFormState } from "./actions";

const initialState: ContactFormState = { ok: false };

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5"
    >
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-red-600 text-xs">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full sm:w-auto px-8 py-4 font-semibold tracking-widest uppercase text-xs transition-colors ${
        pending
          ? "bg-bourbon-deep/10 text-bourbon-deep/40 cursor-not-allowed"
          : "bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber cursor-pointer"
      }`}
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendMessage, initialState);

  if (state.ok) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-bourbon-gold/15">
            <svg
              className="w-5 h-5 text-bourbon-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep">
            Message received
          </h3>
        </div>
        <p className="text-bourbon-stone leading-relaxed">
          Thanks — we&apos;ll get back to you within 1 business day. In the
          meantime, feel free to browse the cellar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="subject">Subject (optional)</FieldLabel>
        <input
          id="subject"
          name="subject"
          type="text"
          className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
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
          className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors resize-y"
        />
        <FieldError message={state.fieldErrors?.body} />
      </div>

      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
