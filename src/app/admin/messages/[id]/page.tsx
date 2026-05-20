import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { markMessageStatus, deleteMessage } from "./actions";

export const metadata = { title: "Message | Admin" };

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) notFound();

  // Auto-mark as READ on open (inline so local state stays consistent)
  if (message.status === "UNREAD") {
    try {
      await prisma.contactMessage.update({
        where: { id },
        data: { status: "READ" },
      });
      message.status = "READ";
      revalidatePath("/admin/messages");
      revalidatePath("/admin");
    } catch (err) {
      console.error("Failed to auto-mark message as read", err);
    }
  }

  const isArchived = message.status === "ARCHIVED";
  const isUnread = message.status === "UNREAD";

  const mailtoSubject = message.subject
    ? `Re: ${message.subject}`
    : "Re: Your message to Bourbon & Oak";
  const mailtoBody = `\n\n— Original message —\n${message.body}`;
  const mailtoHref = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    mailtoSubject
  )}&body=${encodeURIComponent(mailtoBody)}`;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/messages"
          className="inline-flex items-center gap-2 text-bourbon-stone hover:text-bourbon-deep text-xs tracking-widest uppercase transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to inbox
        </Link>
      </div>

      <article className="bg-white border border-bourbon-deep/10">
        {/* Header */}
        <header className="px-5 sm:px-8 py-6 border-b border-bourbon-deep/10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div className="min-w-0">
              <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
                {isArchived ? "Archived" : isUnread ? "Unread" : "Read"}
              </p>
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep leading-tight">
                {message.subject ?? "(no subject)"}
              </h1>
            </div>
            <p className="text-bourbon-stone text-xs whitespace-nowrap">
              {formatDateTime(message.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-sm">
            <span className="text-bourbon-deep font-semibold">{message.name}</span>
            <span className="text-bourbon-stone">·</span>
            <a
              href={`mailto:${message.email}`}
              className="text-bourbon-stone hover:text-bourbon-gold transition-colors underline underline-offset-2"
            >
              {message.email}
            </a>
          </div>
        </header>

        {/* Body */}
        <div className="px-5 sm:px-8 py-7">
          <p className="text-bourbon-deep text-base leading-relaxed whitespace-pre-wrap">
            {message.body}
          </p>
        </div>

        {/* Action bar */}
        <footer className="px-5 sm:px-8 py-5 border-t border-bourbon-deep/10 bg-bourbon-cream/40 flex flex-wrap items-center gap-2">
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-bourbon-gold hover:bg-bourbon-amber text-bourbon-deep font-semibold tracking-widest uppercase text-xs transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Reply by email
          </a>

          <form
            action={async () => {
              "use server";
              await markMessageStatus(
                id,
                message.status === "READ" ? "UNREAD" : "READ"
              );
            }}
          >
            <button
              type="submit"
              className="px-4 py-2.5 text-[10px] tracking-widest uppercase text-bourbon-deep border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer font-semibold"
            >
              {message.status === "READ" ? "Mark unread" : "Mark as read"}
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await markMessageStatus(
                id,
                isArchived ? "READ" : "ARCHIVED"
              );
            }}
          >
            <button
              type="submit"
              className="px-4 py-2.5 text-[10px] tracking-widest uppercase text-bourbon-deep border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer font-semibold"
            >
              {isArchived ? "Restore" : "Archive"}
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await deleteMessage(id);
            }}
            className="ml-auto"
          >
            <button
              type="submit"
              className="px-4 py-2.5 text-[10px] tracking-widest uppercase text-red-700 border border-red-700/30 hover:bg-red-700 hover:text-white transition-colors cursor-pointer font-semibold"
            >
              Delete
            </button>
          </form>
        </footer>
      </article>
    </>
  );
}
