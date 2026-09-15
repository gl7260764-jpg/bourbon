import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_PILL,
  asCampaignStatus,
} from "@/lib/campaign-constants";
import { campaignMailerConfig } from "@/lib/campaign-mailer";
import NewCampaignButton from "./NewCampaignButton";

export const metadata = { title: "Campaigns | Admin" };
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function CampaignsPage() {
  const [campaigns, subscribed] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        subject: true,
        status: true,
        audience: true,
        sentAt: true,
        updatedAt: true,
      },
    }),
    prisma.subscriber.count({ where: { status: "SUBSCRIBED" } }),
  ]);

  // Delivery counts for every listed campaign in one query, not one per row.
  const grouped = campaigns.length
    ? await prisma.campaignSend.groupBy({
        by: ["campaignId", "status"],
        where: { campaignId: { in: campaigns.map((c) => c.id) } },
        _count: { _all: true },
      })
    : [];
  const countOf = (id: string, status: string) =>
    grouped.find((g) => g.campaignId === id && g.status === status)?._count._all ?? 0;

  const rows = campaigns.map((c) => {
    const status = asCampaignStatus(c.status);
    return {
      ...c,
      status,
      title: c.subject || "Untitled campaign",
      sent: countOf(c.id, "SENT"),
      failed: countOf(c.id, "FAILED"),
      when: c.sentAt ? `Sent ${formatDate(c.sentAt)}` : `Edited ${formatDate(c.updatedAt)}`,
    };
  });

  const mailer = campaignMailerConfig();

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">Inner Circle</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
            Campaigns
          </h1>
          <p className="text-bourbon-stone text-sm mt-2">
            {subscribed} active {subscribed === 1 ? "subscriber" : "subscribers"} · sent through Brevo
          </p>
        </div>
        <NewCampaignButton />
      </div>

      {!mailer.ready && (
        <div className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Brevo isn&apos;t connected yet.</strong> You can write and
          preview campaigns, but not send them. Missing:{" "}
          <code className="text-xs">{mailer.missing.join(", ")}</code>.
        </div>
      )}

      <section className="bg-white border border-bourbon-deep/10 overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-[family-name:var(--font-playfair)] text-xl text-bourbon-deep">No campaigns yet</p>
            <p className="text-bourbon-stone text-sm mt-2 mb-6">
              Write one to your {subscribed} {subscribed === 1 ? "subscriber" : "subscribers"} — preview it and
              send yourself a test before it goes out.
            </p>
            <div className="inline-flex">
              <NewCampaignButton label="Write your first campaign" />
            </div>
          </div>
        ) : (
          <>
            {/* lg+: table */}
            <table className="hidden lg:table w-full text-sm">
              <thead>
                <tr className="border-b border-bourbon-deep/10 text-left">
                  {["Campaign", "Status", "Audience", "Delivered", "Failed", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bourbon-deep/5">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-bourbon-deep/[0.02]">
                    <td className="px-5 py-4">
                      <Link href={`/admin/campaigns/${c.id}`} className="font-medium text-bourbon-deep hover:text-bourbon-gold">
                        {c.title}
                      </Link>
                      <p className="text-xs text-bourbon-stone mt-0.5">{c.when}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 border rounded-full text-[11px] font-semibold ${CAMPAIGN_STATUS_PILL[c.status]}`}>
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-bourbon-stone">
                      {c.audience === "SELECTED" ? "Selected" : "All subscribers"}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-bourbon-deep">{c.status === "DRAFT" ? "—" : c.sent}</td>
                    <td className={`px-5 py-4 tabular-nums ${c.failed ? "text-rose-700 font-semibold" : "text-bourbon-stone"}`}>
                      {c.status === "DRAFT" ? "—" : c.failed}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/campaigns/${c.id}`}
                        className="text-xs tracking-widest uppercase font-semibold text-bourbon-deep hover:text-bourbon-gold"
                      >
                        {c.status === "DRAFT" ? "Edit" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* < lg: cards */}
            <ul className="lg:hidden divide-y divide-bourbon-deep/10">
              {rows.map((c) => (
                <li key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-bourbon-deep break-words">{c.title}</p>
                    <span className={`shrink-0 px-2.5 py-1 border rounded-full text-[11px] font-semibold ${CAMPAIGN_STATUS_PILL[c.status]}`}>
                      {CAMPAIGN_STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <p className="text-xs text-bourbon-stone mt-1">{c.when}</p>
                  {c.status !== "DRAFT" && (
                    <p className="text-sm mt-2 tabular-nums text-bourbon-deep">
                      {c.sent} delivered
                      {c.failed > 0 && <span className="text-rose-700 font-semibold"> · {c.failed} failed</span>}
                    </p>
                  )}
                  <Link
                    href={`/admin/campaigns/${c.id}`}
                    className="mt-3 flex min-h-11 items-center justify-center border border-bourbon-deep/15 text-xs tracking-widest uppercase font-semibold text-bourbon-deep hover:border-bourbon-gold hover:text-bourbon-gold"
                  >
                    {c.status === "DRAFT" ? "Edit" : "View"}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
