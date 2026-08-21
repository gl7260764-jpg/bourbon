"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* WhatsApp-shaped thread for one order. Text, images and voice notes; no
   calls. Used by both the customer dashboard and the admin order page — the
   only difference is `endpoint` and which side counts as "me", so the bubble
   layout and the composer never drift between the two. */

export type ChatMessage = {
  id: string;
  sender: "VISITOR" | "ADMIN";
  kind: "TEXT" | "IMAGE" | "VOICE";
  body: string;
  createdAt: string;
  mediaUrl: string | null;
  mediaDurationMs: number | null;
};

/* Realtime is the delivery path; this interval is only the safety net for a
   dropped socket or a browser that blocked the connection. It is deliberately
   slow — with Pusher connected it should almost never be the thing that
   surfaces a message. */
const FALLBACK_POLL_MS = 20000;
const MAX_VOICE_MS = 3 * 60 * 1000;

function clock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayOf(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return "Today";
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function OrderChat({
  endpoint,
  me,
  orderNumber,
  emptyHint,
}: {
  endpoint: string;
  me: "VISITOR" | "ADMIN";
  /** Drives the private Pusher channel for this thread. */
  orderNumber: string;
  emptyHint?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Voice
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const cancelledRef = useRef(false);
  const tickRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: ChatMessage[] };
      setMessages(data.messages ?? []);
    } catch {
      /* a dropped poll is not worth surfacing; the next one covers it */
    } finally {
      setLoaded(true);
    }
  }, [endpoint]);

  useEffect(() => {
    /* The first fetch is deferred a tick rather than called straight from the
       effect body: `load` sets state, and calling it synchronously here
       triggers the cascading-render lint rule this repo enforces. */
    const first = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => {
      // Don't poll a tab nobody is looking at.
      if (document.visibilityState === "visible") void load();
    }, FALLBACK_POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [load]);

  /* Live delivery over Pusher. Loaded dynamically so the ~40KB client is only
     fetched by someone who actually opens a thread, rather than by every
     visitor who loads the dashboard. */
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      try {
        const { default: Pusher } = await import("pusher-js");
        if (cancelled) return;
        const socket = new Pusher(key, {
          cluster,
          authEndpoint: "/api/realtime/auth",
        });
        const channel = socket.subscribe(`private-order-${orderNumber}`);
        channel.bind("chat:message", (incoming: ChatMessage) => {
          setMessages((prev) =>
            /* The sender already appended this optimistically, and a dropped
               socket can redeliver — dedupe on id so neither doubles up. */
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        });
        cleanup = () => {
          channel.unbind_all();
          socket.unsubscribe(`private-order-${orderNumber}`);
          socket.disconnect();
        };
      } catch {
        /* Realtime is an enhancement. If it fails to load or authorise, the
           fallback poll above still delivers. */
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [orderNumber]);

  // Stick to the bottom as messages arrive.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  /* Release the microphone on unmount. Without this the browser keeps showing
     the recording indicator after the panel closes. */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    };
  }, []);

  async function send(payload: { body?: string; file?: File; durationMs?: number }) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      if (payload.body) fd.set("body", payload.body);
      if (payload.file) fd.set("file", payload.file);
      if (payload.durationMs) fd.set("durationMs", String(payload.durationMs));

      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        message?: ChatMessage;
        error?: string;
      };
      if (!res.ok || !data.message) {
        setError(data.error ?? "Could not send.");
        return false;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === data.message!.id) ? prev : [...prev, data.message!],
      );
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    const ok = await send({ body });
    if (ok) setText("");
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await send({ file });
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (tickRef.current) window.clearInterval(tickRef.current);
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    tickRef.current = null;
    autoStopRef.current = null;
  }

  async function startRecording() {
    setError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice notes aren't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;

      /* Chrome and Firefox give webm/opus, Safari mp4/aac. Letting the browser
         pick its own default is what makes this work on all three. */
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        const durationMs = Date.now() - startedAtRef.current;
        stopStream();
        setRecording(false);
        setElapsed(0);
        if (cancelledRef.current) return;
        // Anything shorter than this is a mis-tap, not a message.
        if (durationMs < 600) return;
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        const ext = (rec.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        await send({
          file: new File([blob], `voice-note.${ext}`, { type: blob.type }),
          durationMs,
        });
      };

      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
      tickRef.current = window.setInterval(
        () => setElapsed(Date.now() - startedAtRef.current),
        200,
      );
      // Hard ceiling, so a forgotten recorder cannot run for an hour.
      autoStopRef.current = window.setTimeout(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }, MAX_VOICE_MS);
    } catch {
      setError("Microphone permission was denied.");
      stopStream();
      setRecording(false);
    }
  }

  function stopRecording(cancel: boolean) {
    cancelledRef.current = cancel;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else {
      stopStream();
      setRecording(false);
      setElapsed(0);
    }
  }

  let lastDay = "";

  return (
    <div className="flex flex-col h-[26rem] sm:h-[30rem] border border-bourbon-deep/10 bg-[#F6F1E7] overflow-hidden">
      {/* ---- Messages ---- */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!loaded ? (
          <p className="text-bourbon-stone text-sm text-center py-8">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-bourbon-stone text-sm text-center py-8 px-6 leading-relaxed">
            {emptyHint ?? "No messages yet."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === me;
            const day = dayOf(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={m.id}>
                {showDay && (
                  <p className="text-center my-3">
                    <span className="text-bourbon-stone text-[10px] tracking-widest uppercase bg-white/70 px-2.5 py-1">
                      {day}
                    </span>
                  </p>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-2.5 py-2 shadow-sm ${
                      mine
                        ? "bg-bourbon-gold/25 border border-bourbon-gold/40"
                        : "bg-white border border-bourbon-deep/10"
                    }`}
                  >
                    {m.kind === "IMAGE" && m.mediaUrl && (
                      /* Signed, short-lived Cloudinary URL. next/image would
                         proxy and cache it, which defeats an expiring link and
                         would leave payment screenshots in a shared cache. */
                      <a href={m.mediaUrl} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.mediaUrl}
                          alt={m.body || "Attachment"}
                          className="max-h-64 w-auto mb-1"
                        />
                      </a>
                    )}

                    {m.kind === "VOICE" && m.mediaUrl && (
                      <div className="flex items-center gap-2 min-w-[13rem]">
                        <audio controls src={m.mediaUrl} className="h-9 max-w-[15rem]" />
                        {m.mediaDurationMs != null && (
                          <span className="text-bourbon-stone text-[10px] tabular-nums">
                            {clock(m.mediaDurationMs)}
                          </span>
                        )}
                      </div>
                    )}

                    {m.body && (
                      <p className="text-bourbon-deep text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {m.body}
                      </p>
                    )}

                    <p className="text-bourbon-stone/70 text-[10px] text-right mt-0.5 tabular-nums">
                      {timeOf(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs px-3 py-2 bg-red-50 border-t border-red-200" role="alert">
          {error}
        </p>
      )}

      {/* ---- Composer ---- */}
      <div className="border-t border-bourbon-deep/10 bg-white p-2">
        {recording ? (
          <div className="flex items-center gap-3 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
            <span className="text-bourbon-deep text-sm tabular-nums">
              {clock(elapsed)}
            </span>
            <span className="text-bourbon-stone text-xs flex-1">Recording…</span>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="px-3 py-2 text-bourbon-stone text-xs font-semibold tracking-wider uppercase hover:text-bourbon-deep cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="px-4 py-2 bg-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-wider uppercase hover:bg-bourbon-amber cursor-pointer"
            >
              Send
            </button>
          </div>
        ) : (
          <form onSubmit={sendText} className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              aria-label="Attach an image"
              className="shrink-0 p-2 text-bourbon-stone hover:text-bourbon-deep transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.82-2.83l8.49-8.48" />
              </svg>
            </button>

            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter makes a new line — the messaging
                // convention people already have in their fingers.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendText(e);
                }
              }}
              placeholder="Type a message"
              disabled={busy}
              className="flex-1 resize-none max-h-28 px-3 py-2.5 bg-bourbon-cream border border-bourbon-deep/10 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors disabled:opacity-60"
            />

            {text.trim() ? (
              <button
                type="submit"
                disabled={busy}
                aria-label="Send message"
                className="shrink-0 p-2.5 bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M4.5 19.5l15-7.5-15-7.5v6l9 1.5-9 1.5v6z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={busy}
                aria-label="Record a voice note"
                className="shrink-0 p-2.5 bg-bourbon-deep text-bourbon-gold hover:bg-bourbon-dark transition-colors cursor-pointer disabled:opacity-60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 18v3" />
                </svg>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
