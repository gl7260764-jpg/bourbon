import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_PILL,
  asCampaignStatus,
} from "@/lib/campaign-constants";
import { sendProblems, type CampaignContent } from "@/lib/campaign-template";
import { campaignMailerConfig } from "@/lib/campaign-mailer";
import {
  countRemaining,
  fieldsOf,
  loadFeaturedBottle,
  renderPreview,
  resolveContent,
  sendSummary,
} from "@/lib/campaigns";
import CampaignComposer from "./CampaignComposer";
import SentCampaign from "./SentCampaign";

export const metadata = { title: "Campaign | Admin" };
export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const status = asCampaignStatus(campaign.status);
  const mailer = campaignMailerConfig();

  if (status === "DRAFT") {
    const fields = fieldsOf(campaign);
    const [subscribers, bottle, content, recipients] = await Promise.all([
      prisma.subscriber.findMany({
        where: { status: "SUBSCRIBED" },
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: { email: true, visitor: { select: { city: true, country: true } } },
      }),
      loadFeaturedBottle(campaign.productId),
      resolveContent(fields),
      countRemaining(campaign),
    ]);

    return (
      <CampaignComposer
        campaignId={campaign.id}
        initialFields={fields}
        initialBottle={
          bottle && campaign.productId
            ? { id: campaign.productId, name: bottle.name, price: bottle.price, imageUrl: bottle.imageUrl }
            : null
        }
        initialPreview={{
          html: renderPreview(content).html,
          problems: sendProblems(content),
          recipients,
        }}
        subscribers={subscribers.map((s) => ({
          email: s.email,
          location: [s.visitor?.city, s.visitor?.country].filter(Boolean).join(", ") || null,
        }))}
        mailer={{ ready: mailer.ready, missing: mailer.missing, from: mailer.from }}
      />
    );
  }

  // Sent or sending: show exactly what went out, and how it went.
  const summary = await sendSummary(campaign.id);
  const snapshot = campaign.snapshot as unknown as CampaignContent | null;

  return (
    <>
      <Link href="/admin/campaigns" className="text-xs tracking-widest uppercase text-bourbon-stone hover:text-bourbon-gold">
        ← Campaigns
      </Link>
      <div className="mt-3 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep break-words">
            {campaign.subject || "Untitled campaign"}
          </h1>
          <p className="text-bourbon-stone text-sm mt-1">
            {campaign.audience === "SELECTED" ? "Selected subscribers" : "All subscribers"}
            {campaign.sentAt
              ? ` · finished ${campaign.sentAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`
              : campaign.sendStartedAt
                ? ` · started ${campaign.sendStartedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`
                : ""}
          </p>
        </div>
        <span className={`px-3 py-1 border rounded-full text-xs font-semibold ${CAMPAIGN_STATUS_PILL[status]}`}>
          {CAMPAIGN_STATUS_LABEL[status]}
        </span>
      </div>
      <SentCampaign
        campaignId={campaign.id}
        summary={summary}
        html={snapshot ? renderPreview(snapshot).html : null}
      />
    </>
  );
}
