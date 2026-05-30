"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const LIST_POLL_MS = 4000;
const THREAD_POLL_MS = 3000;

interface ConversationSummary {
  id: string;
  lastMessageAt: string;
  lastMessageFrom: "VISITOR" | "ADMIN";
  adminUnread: number;
  preview: string;
  location: string | null;
  countryCode: string | null;
}

interface ChatMessage {
  id: string;
  body: string;
  sender: "VISITOR" | "ADMIN";
  createdAt: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function ChatClient({ vapidPublicKey }: { vapidPublicKey: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The URL is the source of truth for the open thread (?c=<id>), so a push
  // notification click (which navigates here) opens the right conversation.
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [notifyState, setNotifyState] = useState<
    "idle" | "enabling" | "on" | "error"
  >("idle");

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: ConversationSummary[] };
      setConversations(data.conversations);
    } catch {
      /* ignore — try again next tick */
    }
  }, []);

  // Poll the inbox list.
  useEffect(() => {
    const run = async () => {
      if (document.visibilityState === "hidden") return;
      await loadList();
    };
    run();
    const timer = setInterval(run, LIST_POLL_MS);
    return () => clearInterval(timer);
  }, [loadList]);

  const openConversation = (id: string) => {
    router.replace(`/admin/chat?c=${id}`, { scroll: false });
  };

  const enableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
      setNotifyState("error");
      return;
    }
    setNotifyState("enabling");
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration("/")) ??
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifyState("error");
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const json = sub.toJSON();
      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      setNotifyState(res.ok ? "on" : "error");
    } catch {
      setNotifyState("error");
    }
  };

  return (
    <div>
      <GreetingEditor />

      <div className="mb-4">
        <button
          onClick={enableNotifications}
          disabled={notifyState === "enabling" || notifyState === "on"}
          className="inline-flex items-center gap-2 rounded-lg bg-bourbon-deep px-4 py-2 text-sm font-medium text-bourbon-cream hover:bg-bourbon-deep/90 disabled:opacity-60 cursor-pointer disabled:cursor-default"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifyState === "on"
            ? "Notifications enabled ✓"
            : notifyState === "enabling"
              ? "Enabling…"
              : "Enable notifications on this device"}
        </button>
        {notifyState === "error" && (
          <p className="mt-2 text-xs text-red-600">
            Couldn&apos;t enable notifications. Allow them in your browser, then try again.
          </p>
        )}
      </div>

      <div className="grid h-[calc(100vh-16rem)] min-h-[28rem] grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]">
        {/* Inbox */}
        <aside className="overflow-y-auto rounded-xl border border-bourbon-deep/10 bg-white">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-bourbon-deep/50">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-bourbon-deep/5">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openConversation(c.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      activeId === c.id ? "bg-bourbon-gold/10" : "hover:bg-bourbon-deep/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-bourbon-deep">
                        {c.location ?? "Visitor"}
                      </span>
                      {c.adminUnread > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                          {c.adminUnread}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-bourbon-deep/55">
                      {c.lastMessageFrom === "ADMIN" ? "You: " : ""}
                      {c.preview || "…"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Thread — keyed so switching conversations remounts with fresh state. */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-bourbon-deep/10 bg-white">
          {activeId ? (
            <Thread key={activeId} conversationId={activeId} onActivity={loadList} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-bourbon-deep/40">
              Select a conversation to start chatting.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function GreetingEditor() {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/admin/chat/greeting", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { greeting?: string };
        setValue(data.greeting ?? "");
      } catch {
        /* ignore */
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    const text = value.trim();
    if (!text || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/chat/greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greeting: text }),
      });
      if (res.ok) setSaved(true);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-bourbon-deep/10 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-bourbon-deep">
          Greeting message
        </span>
        <svg
          className={`h-4 w-4 text-bourbon-deep/50 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-bourbon-deep/10 p-4">
          <p className="mb-2 text-xs text-bourbon-deep/55">
            The first message visitors see when the chat opens. It types itself out — keep it warm and short.
          </p>
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-bourbon-deep/15 bg-white px-3 py-2 text-sm text-bourbon-deep focus:border-bourbon-gold focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={save}
              disabled={!value.trim() || saving}
              className="rounded-lg bg-bourbon-gold px-4 py-2 text-sm font-medium text-bourbon-deep hover:bg-bourbon-amber disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {saving ? "Saving…" : "Save greeting"}
            </button>
            {saved && <span className="text-sm text-green-600">Saved ✓</span>}
            <span className="ml-auto text-xs text-bourbon-deep/40">{value.length}/500</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Thread({
  conversationId,
  onActivity,
}: {
  conversationId: string;
  onActivity: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Full load on mount (component is keyed by conversationId).
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/admin/chat/${conversationId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        setMessages(data.messages);
        lastIdRef.current = data.messages.at(-1)?.id ?? null;
        onActivity(); // refresh list (clears unread badge)
      } catch {
        /* ignore */
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [conversationId, onActivity]);

  // Incrementally poll for new messages.
  useEffect(() => {
    const run = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const after = lastIdRef.current;
        const url = after
          ? `/api/admin/chat/${conversationId}?after=${after}`
          : `/api/admin/chat/${conversationId}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (data.messages?.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m) => !seen.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          lastIdRef.current = data.messages.at(-1)?.id ?? after;
        }
      } catch {
        /* ignore */
      }
    };
    const timer = setInterval(run, THREAD_POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  // Keep the latest message in view.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const reply = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");

    const optimistic: ChatMessage = {
      id: `local-${messages.length}`,
      body: text,
      sender: "ADMIN",
      createdAt: new Date(0).toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/admin/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: ChatMessage };
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
        lastIdRef.current = data.message.id;
        onActivity();
      }
    } catch {
      /* keep optimistic; next poll reconciles */
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "ADMIN" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.sender === "ADMIN"
                  ? "rounded-br-sm bg-bourbon-gold text-bourbon-deep"
                  : "rounded-bl-sm bg-bourbon-deep/5 text-bourbon-deep"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-bourbon-deep/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                reply();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Type your reply…"
            className="max-h-28 flex-1 resize-none rounded-lg border border-bourbon-deep/15 bg-white px-3 py-2 text-sm text-bourbon-deep placeholder:text-bourbon-deep/40 focus:border-bourbon-gold focus:outline-none"
          />
          <button
            onClick={reply}
            disabled={!draft.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send reply"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
