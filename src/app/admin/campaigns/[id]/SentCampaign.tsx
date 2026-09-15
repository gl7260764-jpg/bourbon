"use client";

import type { SendSummary } from "@/lib/campaigns";
import SendProgress, { useSendLoop } from "./SendProgress";

export default function SentCampaign({
  campaignId,
  summary,
  html,
}: {
  campaignId: string;
  summary: SendSummary;
  html: string | null;
}) {
  const loop = useSendLoop(campaignId, summary);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <SendProgress loop={loop} />
      <section className="bg-white border border-bourbon-deep/10 p-4">
        <h2 className="text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold mb-3">
          What was sent
        </h2>
        {html ? (
          <iframe
            title="The email as sent"
            sandbox=""
            srcDoc={html}
            className="w-full h-[70vh] min-h-[32rem] border border-bourbon-deep/10 bg-white"
          />
        ) : (
          <p className="text-sm text-bourbon-stone">No frozen copy of this email was kept.</p>
        )}
      </section>
    </div>
  );
}
