"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { countryFlag } from "@/lib/geo";
import { useRouter, useSearchParams } from "next/navigation";

const LIST_POLL_MS = 4000;
const THREAD_POLL_MS = 3000;

interface ConversationSummary {
  id: string;
  lastMessageAt: string;
  lastMessageFrom: "VISITOR" | "ADMIN";
  adminUnread: number;
  preview: string;
  /** Set once the person has identified themselves; null for a bare device. */
  email: string | null;
  name: string | null;
  codename: string;
  location: string | null;
  countryCode: string | null;
}

interface ChatMessage {
  id: string;
  body: string;
  sender: "VISITOR" | "ADMIN";
  createdAt: string;
  kind?: "TEXT" | "IMAGE" | "VOICE";
  /** Signed and short-lived — never a permanent URL. */
  mediaUrl?: string | null;
  mediaDurationMs?: number | null;
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
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="shrink-0 text-base leading-none" title={c.location ?? undefined} aria-hidden="true">
                          {c.countryCode ? countryFlag(c.countryCode) : "🌐"}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium text-bourbon-deep">
                          {c.name || c.email || c.codename}
                        </span>
                      </span>
                      {c.adminUnread > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                          {c.adminUnread}
                        </span>
                      )}
                    </div>
                    {/* Second line: the address when the first line used a
                        name, the codename when it used an address, plus where
                        they are. Never repeats what is already above it. */}
                    <span className="truncate text-[11px] text-bourbon-deep/45">
                      {[
                        c.name && c.email ? c.email : null,
                        c.name || c.email ? c.codename : null,
                        c.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
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
  const [autoReply, setAutoReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/admin/chat/greeting", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { greeting?: string; autoReply?: string };
        setValue(data.greeting ?? "");
        setAutoReply(data.autoReply ?? "");
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
        body: JSON.stringify({ greeting: text, autoReply: autoReply.trim() }),
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
          Chat messages
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
          <p className="mb-2 text-xs font-medium text-bourbon-deep">Opening line</p>
          <p className="mb-2 text-xs text-bourbon-deep/55">
            Shown under &ldquo;Start the conversation&rdquo; before anyone has
            typed. Not a message — nothing is sent.
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
          <p className="mt-4 mb-2 text-xs font-medium text-bourbon-deep">
            Automatic first reply
          </p>
          <p className="mb-2 text-xs text-bourbon-deep/55">
            Posted into the thread once, straight after someone&rsquo;s first
            message, so they know it landed. Never sent again, and never after
            you have replied yourself. Leave empty to send nothing.
          </p>
          <textarea
            value={autoReply}
            onChange={(e) => {
              setAutoReply(e.target.value);
              setSaved(false);
            }}
            rows={3}
            maxLength={500}
            placeholder="Leave empty to send no automatic reply"
            className="w-full resize-none rounded-lg border border-bourbon-deep/15 bg-white px-3 py-2 text-sm text-bourbon-deep focus:border-bourbon-gold focus:outline-none"
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={save}
              disabled={!value.trim() || saving}
              className="rounded-lg bg-bourbon-gold px-4 py-2 text-sm font-medium text-bourbon-deep hover:bg-bourbon-amber disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <span className="text-sm text-green-600">Saved ✓</span>}
            <span className="ml-auto text-xs text-bourbon-deep/40">
              {value.length}/500 · {autoReply.length}/500
            </span>
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
  /* Who you are talking to. Shown above the thread so you never have to guess
     from the message body which customer this is. */
  const [who, setWho] = useState<{
    email: string | null;
    name: string | null;
    codename: string | null;
  }>({ email: null, name: null, codename: null });
  /* When the customer last opened this thread. Anything you sent before it
     has been read — that is the second tick. */
  const [readAt, setReadAt] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
        const data = (await res.json()) as {
          messages: ChatMessage[];
          email?: string | null;
          name?: string | null;
          codename?: string | null;
          customerLastReadAt?: string | null;
        };
        setMessages(data.messages);
        setWho({
          email: data.email ?? null,
          name: data.name ?? null,
          codename: data.codename ?? null,
        });
        setReadAt(data.customerLastReadAt ?? null);
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

  const sendFile = async (file: File) => {
    if (sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (draft.trim()) fd.append("message", draft.trim());
      const res = await fetch(`/api/admin/chat/${conversationId}`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: ChatMessage;
        error?: string;
      };
      if (!res.ok) {
        setUploadError(data.error ?? "Could not send that file.");
        return;
      }
      setUploadError(null);
      setDraft("");
      if (data.message) {
        setMessages((prev) => [...prev, data.message!]);
        lastIdRef.current = data.message.id;
      }
      onActivity();
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

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
      {/* Identity bar. An email is a mailto so you can reply outside the chat
          without copying it out by hand. */}
      <div className="shrink-0 border-b border-bourbon-deep/10 px-4 py-3">
        <p className="truncate text-sm font-semibold text-bourbon-deep">
          {who.name || who.email || who.codename || "Unidentified visitor"}
        </p>
        {who.email ? (
          <a
            href={`mailto:${who.email}`}
            className="truncate text-xs text-bourbon-deep/55 hover:text-bourbon-gold transition-colors"
          >
            {who.email}
          </a>
        ) : (
          <p className="text-xs text-bourbon-deep/45">
            {who.codename ? `${who.codename} · ` : ""}no email yet
          </p>
        )}
      </div>

      <div ref={scrollRef} className="chat-canvas flex-1 space-y-1.5 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "ADMIN" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-[0_1px_1px_rgba(12,10,9,0.12)] ${
                m.sender === "ADMIN"
                  ? "rounded-br-none bg-[#FBEFC8] text-bourbon-deep"
                  : "rounded-bl-none bg-white text-bourbon-deep"
              }`}
            >
              {m.kind === "IMAGE" && m.mediaUrl && (
                /* Plain <img>: the source is a signed, short-lived Cloudinary
                   URL, which next/image cannot cache or re-sign. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.mediaUrl}
                  alt={m.body || "Attachment"}
                  className="mb-1 max-h-56 w-full rounded-lg object-cover"
                />
              )}
              {m.kind === "VOICE" && m.mediaUrl && (
                <audio src={m.mediaUrl} controls className="mb-1 w-56 max-w-full" />
              )}
              {m.body && <span className="whitespace-pre-wrap">{m.body}</span>}
              <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] tabular-nums text-bourbon-deep/50">
                {new Date(m.createdAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {/* One tick sent, two once they have opened the thread. Only
                    ever here — the customer is not shown ticks on ours. */}
                {m.sender === "ADMIN" && (
                  <Ticks
                    read={Boolean(
                      readAt &&
                        new Date(readAt).getTime() >= new Date(m.createdAt).getTime(),
                    )}
                  />
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-bourbon-deep/10 p-3">
        {uploadError && (
          <p className="mb-2 text-xs text-red-600" role="alert">
            {uploadError}
          </p>
        )}
        <div className="flex items-end gap-2">
          {/* Same media rules as the customer side: images and voice notes,
              stored as Cloudinary authenticated assets. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void sendFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            aria-label="Attach a file"
            title="Attach an image or voice note"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-bourbon-deep/15 text-bourbon-deep/60 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                d="M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.2-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
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

/** WhatsApp-style delivery ticks: one for sent, two once it has been read. */
function Ticks({ read }: { read: boolean }) {
  return (
    <span
      title={read ? "Read" : "Sent"}
      aria-label={read ? "Read" : "Sent"}
      className={read ? "text-sky-600" : "text-bourbon-deep/45"}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 7.5l3.6 3.6L11.5 4" />
        {read && <path strokeLinecap="round" strokeLinejoin="round" d="M7.6 10.6l1 1L18.5 2" />}
      </svg>
    </span>
  );
}
