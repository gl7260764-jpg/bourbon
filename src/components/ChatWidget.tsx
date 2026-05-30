"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CHAT_GREETING } from "@/lib/chat-constants";

const POLL_INTERVAL_MS = 4000;

interface ChatMessage {
  id: string;
  body: string;
  sender: "VISITOR" | "ADMIN";
  createdAt: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  // The greeting types itself out on first open. "" = still showing the
  // typing-dots indicator; fills up to the full GREETING as it "types".
  const [typedGreeting, setTypedGreeting] = useState("");

  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Once the visitor opens/closes the widget themselves, stop auto-opening it.
  const userInteractedRef = useRef(false);
  const greetingRanRef = useRef(false);
  // Admin-customizable greeting, fetched on mount; defaults until it loads.
  const greetingRef = useRef(DEFAULT_CHAT_GREETING);

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh];
    });
    lastIdRef.current = incoming[incoming.length - 1].id;
  }, []);

  // Poll for new messages while the widget is open and the tab is visible.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const poll = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const after = lastIdRef.current;
        const url = after ? `/api/chat/poll?after=${after}` : "/api/chat/poll";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (data.messages?.length) {
          mergeMessages(data.messages);
          if (data.messages.some((m) => m.sender === "ADMIN")) setHasNew(false);
        }
      } catch {
        // network blip — try again next tick
      }
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, mergeMessages]);

  // Background poll (closed widget) so the bubble can show an unread dot when
  // the admin replies. Lighter cadence, only after a conversation exists.
  useEffect(() => {
    if (open || !lastIdRef.current) return;
    const timer = setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch(`/api/chat/poll?after=${lastIdRef.current}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (data.messages?.length) {
          mergeMessages(data.messages);
          if (data.messages.some((m) => m.sender === "ADMIN")) setHasNew(true);
        }
      } catch {
        /* ignore */
      }
    }, POLL_INTERVAL_MS * 2);
    return () => clearInterval(timer);
  }, [open, mergeMessages]);

  // Keep the latest message in view (also while the greeting types itself out).
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, typedGreeting]);

  // Auto-open once after the visitor has spent ~5s on the site — unless they've
  // already opened it themselves. Guarded per session so it doesn't re-pop.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("bol_chat_autoopened")) return;
    } catch {
      /* storage blocked — just skip auto-open */
    }
    const timer = setTimeout(() => {
      if (userInteractedRef.current) return;
      try {
        sessionStorage.setItem("bol_chat_autoopened", "1");
      } catch {
        /* ignore */
      }
      setOpen(true);
      setHasNew(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch the admin-customizable greeting once on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/greeting", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { greeting?: string } | null) => {
        if (!cancelled && data?.greeting && !greetingRanRef.current) {
          greetingRef.current = data.greeting;
        }
      })
      .catch(() => {
        /* keep default greeting */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // On first open, play a "typing…" indicator then typewrite the greeting.
  // All state updates happen inside timers (never synchronously in the effect
  // body) so a partial reopen never restarts a finished animation.
  useEffect(() => {
    if (!open || greetingRanRef.current) return;
    greetingRanRef.current = true;
    const text = greetingRef.current;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startTimer = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i += 1;
        setTypedGreeting(text.slice(0, i));
        if (i >= text.length && intervalId) clearInterval(intervalId);
      }, 22);
    }, 1100); // dots show for ~1.1s before the text starts
    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [open]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");

    // Optimistic echo so the visitor sees their message instantly.
    const optimistic: ChatMessage = {
      id: `local-${messages.length}-${text.length}`,
      body: text,
      sender: "VISITOR",
      createdAt: new Date(0).toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: ChatMessage };
        // Swap the optimistic row for the server's persisted one.
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m)),
        );
        lastIdRef.current = data.message.id;
      }
    } catch {
      /* leave the optimistic message; next poll will reconcile */
    } finally {
      setSending(false);
    }
  };

  const openWidget = () => {
    userInteractedRef.current = true;
    setOpen(true);
    setHasNew(false);
  };

  const closeWidget = () => {
    userInteractedRef.current = true;
    setOpen(false);
  };

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          onClick={openWidget}
          aria-label="Open chat"
          className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-bourbon-gold text-bourbon-deep shadow-lg shadow-black/30 transition-transform hover:scale-105 cursor-pointer"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-3.6-7.2L21 3l-1.2 3.4A8.96 8.96 0 0121 12z"
            />
          </svg>
          {hasNew && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-bourbon-deep" />
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[90] flex h-[min(34rem,calc(100vh-2.5rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-bourbon-gold/30 bg-bourbon-dark shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between bg-bourbon-deep px-4 py-3">
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-base font-bold text-bourbon-cream">
                Bourbon & Oak
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-bourbon-cream/60">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                We typically reply in a few minutes
              </p>
            </div>
            <button
              onClick={closeWidget}
              aria-label="Close chat"
              className="text-bourbon-cream/60 hover:text-bourbon-gold cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {/* Greeting is client-side only — it never pings the admin. It shows
                a typing indicator first, then types itself out. */}
            {typedGreeting === "" ? (
              <TypingIndicator />
            ) : (
              <Bubble sender="ADMIN" body={typedGreeting} />
            )}
            {messages.map((m) => (
              <Bubble key={m.id} sender={m.sender} body={m.body} />
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-bourbon-gold/15 bg-bourbon-dark p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Type a message…"
                className="max-h-28 flex-1 resize-none rounded-lg bg-bourbon-deep px-3 py-2 text-sm text-bourbon-cream placeholder:text-bourbon-cream/40 focus:outline-none focus:ring-1 focus:ring-bourbon-gold/50"
              />
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bourbon-gold text-bourbon-deep transition-opacity hover:bg-bourbon-amber disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-bourbon-deep px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-bourbon-cream/60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function Bubble({ sender, body }: { sender: "VISITOR" | "ADMIN"; body: string }) {
  const isVisitor = sender === "VISITOR";
  return (
    <div className={`flex ${isVisitor ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isVisitor
            ? "rounded-br-sm bg-bourbon-gold text-bourbon-deep"
            : "rounded-bl-sm bg-bourbon-deep text-bourbon-cream"
        }`}
      >
        {body}
      </div>
    </div>
  );
}
