"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CAMPAIGN_LIMITS,
  TYPED_CONFIRM_THRESHOLD,
  type CampaignFields,
} from "@/lib/campaign-constants";
import SendProgress, { useSendLoop } from "./SendProgress";

interface Bottle {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
}

interface PickerResult extends Bottle {
  distillery: string;
  availability: string;
}

interface Preview {
  html: string;
  problems: string[];
  recipients: number;
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-bourbon-deep/15 text-sm text-bourbon-deep placeholder:text-bourbon-stone/50 focus:outline-none focus:border-bourbon-gold";
const labelCls = "block text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold mb-1.5";
const cardCls = "bg-white border border-bourbon-deep/10 p-5 sm:p-6";
const cardTitleCls = "font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep mb-4";

async function post<T>(campaignId: string, payload: Record<string, unknown>, signal?: AbortSignal) {
  const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  // Tolerate an empty or non-JSON body, so a crashed request shows its status
  // instead of "Unexpected end of JSON input".
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

export default function CampaignComposer({
  campaignId,
  initialFields,
  initialBottle,
  initialPreview,
  subscribers,
  mailer,
}: {
  campaignId: string;
  initialFields: CampaignFields;
  initialBottle: Bottle | null;
  initialPreview: Preview;
  subscribers: { email: string; location: string | null }[];
  mailer: { ready: boolean; missing: string[]; from: string | null };
}) {
  const router = useRouter();
  const [fields, setFields] = useState<CampaignFields>(initialFields);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialFields));
  const fieldsJson = JSON.stringify(fields);
  const dirty = fieldsJson !== savedJson;

  const [bottle, setBottle] = useState<Bottle | null>(initialBottle);
  const [preview, setPreview] = useState<Preview>(initialPreview);
  /* Which fields the preview on screen was rendered from. The server renders
     the first one, so nothing is fetched until something changes. The nonce
     forces a refresh without an edit — after a send was refused because the
     recipient count moved, say. */
  const [previewNonce, setPreviewNonce] = useState(0);
  const [previewedKey, setPreviewedKey] = useState(() => `${JSON.stringify(initialFields)}#0`);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");

  const [saveState, setSaveState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const [testTo, setTestTo] = useState("");
  const [testState, setTestState] = useState<{ busy: boolean; message: string | null; error: string | null }>({
    busy: false,
    message: null,
    error: null,
  });

  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [sendStarted, setSendStarted] = useState(false);
  const loop = useSendLoop(campaignId, null);

  const set = <K extends keyof CampaignFields>(key: K, value: CampaignFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  /* Live preview. Rendered by the server through the same code a real send
     uses, debounced so typing does not fire a request per keystroke. */
  const previewKey = `${fieldsJson}#${previewNonce}`;
  useEffect(() => {
    if (previewKey === previewedKey) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const r = await post<Preview>(campaignId, { action: "preview", fields: JSON.parse(fieldsJson) }, ctrl.signal);
        if (!r.ok) {
          setPreviewError(r.data.error ?? `Preview failed (${r.status}).`);
          return;
        }
        setPreview({ html: r.data.html, problems: r.data.problems, recipients: r.data.recipients });
        setPreviewedKey(previewKey);
        setPreviewError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setPreviewError("Couldn't refresh the preview.");
      } finally {
        if (!ctrl.signal.aborted) setPreviewBusy(false);
      }
    }, 400);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [campaignId, fieldsJson, previewKey, previewedKey]);

  // Unsaved edits survive a stray back-swipe only if the browser asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(): Promise<boolean> {
    setSaveState({ busy: true, error: null });
    const r = await post<{ ok: boolean; errors: string[] }>(campaignId, { action: "save", fields }).catch(() => null);
    if (!r || !r.ok) {
      setSaveState({ busy: false, error: r?.data.error ?? "Couldn't save. Check your connection and try again." });
      return false;
    }
    setSavedJson(fieldsJson);
    setSaveState({ busy: false, error: null });
    return true;
  }

  async function sendTestEmail() {
    setTestState({ busy: true, message: null, error: null });
    const r = await post<{ sent: string[]; failed: { email: string; error: string }[] }>(campaignId, {
      action: "test",
      fields,
      to: testTo,
    }).catch(() => null);
    if (!r || !r.ok) {
      setTestState({ busy: false, message: null, error: r?.data.error ?? "Network error. The test wasn't sent." });
      return;
    }
    // The server saves before it sends a test.
    setSavedJson(fieldsJson);
    const { sent, failed } = r.data;
    setTestState({
      busy: false,
      message: sent.length ? `Test sent to ${sent.join(", ")}. Check the inbox — and the spam folder.` : null,
      error: failed.length ? failed.map((f) => `${f.email}: ${f.error}`).join(" ") : null,
    });
  }

  async function deleteDraft() {
    if (!window.confirm("Delete this draft? This can't be undone.")) return;
    const r = await post<{ ok: boolean }>(campaignId, { action: "delete" }).catch(() => null);
    if (!r || !r.ok) {
      setSaveState({ busy: false, error: r?.data.error ?? "Couldn't delete the draft." });
      return;
    }
    setSavedJson(fieldsJson); // nothing to warn about on the way out
    router.push("/admin/campaigns");
  }

  async function startSend() {
    setConfirming(false);
    setConfirmText("");
    setSendStarted(true);
    setSavedJson(fieldsJson);
    await loop.run({ fields, confirmCount: preview.recipients });
  }

  const recipients = preview.recipients;
  const needsTyped = recipients > TYPED_CONFIRM_THRESHOLD;
  const blockers = [
    ...(!mailer.ready ? ["Connect Brevo before sending."] : []),
    ...preview.problems,
    ...(recipients === 0 ? ["There is nobody to send this to."] : []),
  ];
  const locked = sendStarted || loop.running;

  return (
    <>
      <Link href="/admin/campaigns" className="text-xs tracking-widest uppercase text-bourbon-stone hover:text-bourbon-gold">
        ← Campaigns
      </Link>

      <div className="mt-3 mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">Draft</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep break-words">
            {fields.subject || "Untitled campaign"}
          </h1>
          <p className="text-sm mt-1 text-bourbon-stone" aria-live="polite">
            {saveState.busy ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
          </p>
        </div>
        {!locked && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteDraft}
              className="min-h-11 px-4 border border-bourbon-deep/15 text-rose-700 text-xs tracking-widest uppercase font-semibold hover:border-rose-300 cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saveState.busy || !dirty}
              className="min-h-11 px-5 bg-bourbon-deep text-bourbon-cream text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              Save draft
            </button>
          </div>
        )}
      </div>

      {saveState.error && <p className="mb-4 text-sm text-rose-700" role="alert">{saveState.error}</p>}

      {!mailer.ready && (
        <div className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Brevo isn&apos;t connected yet.</strong> Write and preview freely; test and
          send unlock once <code className="text-xs">{mailer.missing.join(", ")}</code>{" "}
          {mailer.missing.length === 1 ? "is" : "are"} set.
        </div>
      )}

      {/* Mobile order is form → preview → send; on lg the preview sits beside
          both, sticky, so it stays in view while the long form scrolls. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <fieldset disabled={locked} className="space-y-6 min-w-0 disabled:opacity-60">
          <section className={cardCls}>
            <h2 className={cardTitleCls}>Message</h2>
            <div className="space-y-4">
              <Field label="Subject line" count={fields.subject.length} soft={60} max={CAMPAIGN_LIMITS.subject}>
                <input
                  className={inputCls}
                  value={fields.subject}
                  maxLength={CAMPAIGN_LIMITS.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="A new allocation just landed"
                />
              </Field>
              <Field
                label="Preview text"
                hint="Shown after the subject in the inbox. Not visible in the email itself."
                count={fields.preheader.length}
                soft={90}
                max={CAMPAIGN_LIMITS.preheader}
              >
                <input
                  className={inputCls}
                  value={fields.preheader}
                  maxLength={CAMPAIGN_LIMITS.preheader}
                  onChange={(e) => set("preheader", e.target.value)}
                  placeholder="Limited bottles, first come first served"
                />
              </Field>
            </div>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitleCls}>Featured bottle <span className="font-sans text-xs font-normal text-bourbon-stone">optional</span></h2>
            <BottlePicker
              bottle={bottle}
              onPick={(b) => {
                setBottle(b);
                set("productId", b?.id ?? null);
              }}
            />
          </section>

          <section className={cardCls}>
            <h2 className={cardTitleCls}>Content</h2>
            {bottle && (
              <p className="-mt-2 mb-4 text-xs text-bourbon-stone">
                Fields left blank fill in from {bottle.name}. Anything you type takes priority.
              </p>
            )}
            <div className="space-y-4">
              <Field label="Eyebrow" hint="A few words above the heading, e.g. New arrival.">
                <input className={inputCls} value={fields.eyebrow} maxLength={CAMPAIGN_LIMITS.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
              </Field>
              <Field label="Heading">
                <input
                  className={inputCls}
                  value={fields.heading}
                  maxLength={CAMPAIGN_LIMITS.heading}
                  onChange={(e) => set("heading", e.target.value)}
                  placeholder={bottle?.name ?? ""}
                />
              </Field>
              <Field label="Body" hint="Blank line starts a paragraph · **bold** · links become clickable.">
                <textarea
                  className={`${inputCls} min-h-44 leading-relaxed`}
                  value={fields.body}
                  maxLength={CAMPAIGN_LIMITS.body}
                  onChange={(e) => set("body", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price">
                  <input
                    className={inputCls}
                    value={fields.priceOverride}
                    maxLength={CAMPAIGN_LIMITS.price}
                    onChange={(e) => set("priceOverride", e.target.value)}
                    placeholder={bottle?.price ?? "$89.99"}
                  />
                </Field>
                <Field label="Was (crossed out)">
                  <input
                    className={inputCls}
                    value={fields.compareAtOverride}
                    maxLength={CAMPAIGN_LIMITS.price}
                    onChange={(e) => set("compareAtOverride", e.target.value)}
                    placeholder="$109.99"
                  />
                </Field>
              </div>
              <Field label="Urgency line" hint="Only if it's true, e.g. 12 bottles left.">
                <input className={inputCls} value={fields.urgency} maxLength={CAMPAIGN_LIMITS.urgency} onChange={(e) => set("urgency", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Button label">
                  <input
                    className={inputCls}
                    value={fields.ctaLabel}
                    maxLength={CAMPAIGN_LIMITS.ctaLabel}
                    onChange={(e) => set("ctaLabel", e.target.value)}
                    placeholder={bottle ? "Shop this bottle" : "Shop now"}
                  />
                </Field>
                <Field label="Button link">
                  <input
                    className={inputCls}
                    value={fields.ctaUrl}
                    maxLength={CAMPAIGN_LIMITS.ctaUrl}
                    onChange={(e) => set("ctaUrl", e.target.value)}
                    placeholder={bottle ? "The bottle's page" : "https:// or /shop"}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className={cardCls}>
            <h2 className={cardTitleCls}>Recipients</h2>
            <Recipients
              fields={fields}
              subscribers={subscribers}
              onAudience={(a) => set("audience", a)}
              onSelected={(emails) => set("selectedEmails", emails)}
            />
          </section>
        </fieldset>

        <section className={`${cardCls} lg:row-span-2 lg:sticky lg:top-6 min-w-0`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold">
              Preview {previewBusy && <span className="normal-case tracking-normal font-normal">· updating…</span>}
            </h2>
            <div className="flex border border-bourbon-deep/15 text-[10px] tracking-widest uppercase font-semibold">
              {(["desktop", "mobile"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPreviewWidth(w)}
                  aria-pressed={previewWidth === w}
                  className={`px-3 py-1.5 cursor-pointer ${previewWidth === w ? "bg-bourbon-deep text-bourbon-cream" : "text-bourbon-deep"}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          {previewError && <p className="mb-2 text-xs text-rose-700">{previewError}</p>}
          <div className="bg-[#F4F1EC] border border-bourbon-deep/10 flex justify-center overflow-hidden">
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={preview.html}
              className="h-[70vh] lg:h-[calc(100vh-11rem)] min-h-[32rem] bg-white transition-[width] duration-300"
              style={{ width: previewWidth === "mobile" ? "375px" : "100%", maxWidth: "100%" }}
            />
          </div>
        </section>

        <section className={`${cardCls} min-w-0`}>
          {sendStarted ? (
            <SendProgress loop={loop} />
          ) : (
            <>
              <h2 className={cardTitleCls}>Test &amp; send</h2>

              <label className={labelCls} htmlFor="test-to">Send a test to</label>
              <div className="flex gap-2">
                <input
                  id="test-to"
                  type="text"
                  inputMode="email"
                  className={inputCls}
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="you@example.com"
                />
                <button
                  type="button"
                  onClick={sendTestEmail}
                  disabled={!mailer.ready || testState.busy || !testTo.trim() || preview.problems.length > 0}
                  className="shrink-0 min-h-11 px-4 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase font-semibold hover:border-bourbon-gold hover:text-bourbon-gold disabled:opacity-50 cursor-pointer disabled:cursor-default"
                >
                  {testState.busy ? "Sending…" : "Send test"}
                </button>
              </div>
              {testState.message && <p className="mt-2 text-sm text-emerald-700">{testState.message}</p>}
              {testState.error && <p className="mt-2 text-sm text-rose-700" role="alert">{testState.error}</p>}

              <div className="mt-6 pt-6 border-t border-bourbon-deep/10">
                {blockers.length > 0 && (
                  <ul className="mb-4 space-y-1 text-sm text-amber-800">
                    {blockers.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                )}

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    disabled={blockers.length > 0 || previewBusy}
                    className="w-full min-h-12 px-5 bg-bourbon-gold text-bourbon-deep text-sm tracking-widest uppercase font-bold hover:bg-bourbon-gold/85 disabled:opacity-50 cursor-pointer disabled:cursor-default"
                  >
                    Send to {recipients} {recipients === 1 ? "subscriber" : "subscribers"}
                  </button>
                ) : (
                  <div className="border border-bourbon-gold/50 bg-amber-50/60 p-4">
                    <p className="text-sm text-bourbon-deep">
                      Send <strong>&ldquo;{fields.subject}&rdquo;</strong> to{" "}
                      <strong className="tabular-nums">{recipients}</strong> {recipients === 1 ? "subscriber" : "subscribers"}{" "}
                      from <strong>{mailer.from}</strong>? This can&apos;t be undone.
                    </p>
                    {needsTyped && (
                      <>
                        <label className={`${labelCls} mt-4`} htmlFor="confirm-count">
                          Type {recipients} to confirm
                        </label>
                        <input
                          id="confirm-count"
                          className={inputCls}
                          inputMode="numeric"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          autoFocus
                        />
                      </>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={startSend}
                        disabled={needsTyped && confirmText.trim() !== String(recipients)}
                        className="flex-1 min-h-11 px-4 bg-bourbon-deep text-bourbon-cream text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-gold hover:text-bourbon-deep disabled:opacity-50 cursor-pointer disabled:cursor-default"
                      >
                        Yes, send now
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(false);
                          setConfirmText("");
                        }}
                        className="min-h-11 px-4 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {sendStarted && loop.error && !loop.summary && (
            <p className="mt-3 text-sm text-rose-700" role="alert">
              {loop.error}{" "}
              <button
                type="button"
                className="underline cursor-pointer"
                onClick={() => {
                  setSendStarted(false);
                  setPreviewNonce((n) => n + 1);
                }}
              >
                Back to the draft
              </button>
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Field({
  label,
  hint,
  count,
  soft,
  max,
  children,
}: {
  label: string;
  hint?: string;
  count?: number;
  soft?: number;
  max?: number;
  children: React.ReactNode;
}) {
  // A wrapping <label> ties the text to the control without threading ids.
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className={labelCls}>{label}</span>
        {count !== undefined && max !== undefined && (
          <span aria-hidden="true" className={`text-[10px] tabular-nums ${soft && count > soft ? "text-amber-700" : "text-bourbon-stone/60"}`}>
            {count}/{max}
          </span>
        )}
      </span>
      {children}
      {hint && <span className="block mt-1 text-xs text-bourbon-stone/80">{hint}</span>}
    </label>
  );
}

function BottlePicker({ bottle, onPick }: { bottle: Bottle | null; onPick: (b: Bottle | null) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PickerResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/campaigns/products?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json().catch(() => ({}))) as { products?: PickerResult[] };
        setResults(data.products ?? []);
      } catch {
        /* aborted by the next keystroke, or offline — the old list stays */
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [q, open]);

  if (bottle) {
    return (
      <div className="flex items-center gap-3 border border-bourbon-deep/10 p-3">
        {bottle.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bottle.imageUrl} alt="" className="w-12 h-12 object-contain bg-[#F4F1EC] shrink-0" />
        ) : (
          <div className="w-12 h-12 bg-[#F4F1EC] shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-bourbon-deep truncate">{bottle.name}</p>
          <p className="text-xs text-bourbon-stone tabular-nums">{bottle.price}</p>
        </div>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="min-h-11 px-3 text-xs tracking-widest uppercase font-semibold text-bourbon-stone hover:text-rose-700 cursor-pointer"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        className={inputCls}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search bottles by name, distillery or SKU"
        aria-label="Search bottles"
      />
      {open && (
        <ul className="mt-2 max-h-72 overflow-y-auto border border-bourbon-deep/10 divide-y divide-bourbon-deep/5">
          {busy && results.length === 0 && <li className="px-3 py-3 text-sm text-bourbon-stone">Searching…</li>}
          {!busy && results.length === 0 && <li className="px-3 py-3 text-sm text-bourbon-stone">No bottles match.</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onPick({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl });
                  setOpen(false);
                  setQ("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-bourbon-deep/[0.03] cursor-pointer"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-10 h-10 object-contain bg-[#F4F1EC] shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-[#F4F1EC] shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-bourbon-deep truncate">{p.name}</span>
                  <span className="block text-xs text-bourbon-stone truncate">
                    {p.distillery} · {p.price}
                    {p.availability === "SOLD_OUT" && <span className="text-rose-700"> · sold out</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Recipients({
  fields,
  subscribers,
  onAudience,
  onSelected,
}: {
  fields: CampaignFields;
  subscribers: { email: string; location: string | null }[];
  onAudience: (a: CampaignFields["audience"]) => void;
  onSelected: (emails: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const selected = useMemo(() => new Set(fields.selectedEmails), [fields.selectedEmails]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle
      ? subscribers.filter((s) => s.email.includes(needle) || (s.location ?? "").toLowerCase().includes(needle))
      : subscribers;
  }, [q, subscribers]);

  const toggle = (email: string) => {
    const next = new Set(selected);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    onSelected([...next]);
  };

  return (
    <div>
      <div className="space-y-2">
        <label className="flex items-center gap-3 text-sm text-bourbon-deep cursor-pointer min-h-11">
          <input type="radio" name="audience" checked={fields.audience === "ALL"} onChange={() => onAudience("ALL")} className="accent-bourbon-gold" />
          <span>
            All active subscribers <span className="text-bourbon-stone tabular-nums">({subscribers.length})</span>
            <span className="block text-xs text-bourbon-stone">Counted when you send, so anyone who joins before then is included.</span>
          </span>
        </label>
        <label className="flex items-center gap-3 text-sm text-bourbon-deep cursor-pointer min-h-11">
          <input type="radio" name="audience" checked={fields.audience === "SELECTED"} onChange={() => onAudience("SELECTED")} className="accent-bourbon-gold" />
          <span>
            Selected subscribers{" "}
            {fields.audience === "SELECTED" && <span className="text-bourbon-stone tabular-nums">({selected.size} chosen)</span>}
          </span>
        </label>
      </div>

      {fields.audience === "SELECTED" && (
        <div className="mt-4">
          <input
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by email or location"
            aria-label="Filter subscribers"
          />
          <div className="mt-2 flex gap-3 text-xs">
            <button
              type="button"
              className="underline text-bourbon-deep cursor-pointer"
              onClick={() => onSelected([...new Set([...selected, ...shown.map((s) => s.email)])])}
            >
              Select {q ? "all shown" : "everyone"} ({shown.length})
            </button>
            <button type="button" className="underline text-bourbon-stone cursor-pointer" onClick={() => onSelected([])}>
              Clear
            </button>
          </div>
          <ul className="mt-2 max-h-72 overflow-y-auto border border-bourbon-deep/10 divide-y divide-bourbon-deep/5">
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-bourbon-stone">No subscribers match.</li>}
            {shown.map((s) => (
              <li key={s.email}>
                <label className="flex items-center gap-3 px-3 py-2 min-h-11 cursor-pointer hover:bg-bourbon-deep/[0.03]">
                  <input
                    type="checkbox"
                    checked={selected.has(s.email)}
                    onChange={() => toggle(s.email)}
                    className="accent-bourbon-gold"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-bourbon-deep break-all">{s.email}</span>
                    {s.location && <span className="block text-xs text-bourbon-stone">{s.location}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
