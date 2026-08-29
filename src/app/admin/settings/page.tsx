import { getPopupSettings, getPushPromptSettings } from "@/lib/settings";
import PopupSettingsForm from "./PopupSettingsForm";
import PushPromptSettingsForm from "./PushPromptSettingsForm";

export const metadata = { title: "Settings | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [popup, pushPrompt] = await Promise.all([
    getPopupSettings(),
    getPushPromptSettings(),
  ]);

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          Configuration
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Settings
        </h1>
        <p className="text-bourbon-stone text-sm mt-2">
          Storefront behaviour you can change without a redeploy.
        </p>
      </div>

      <PopupSettingsForm initial={popup} />
      <PushPromptSettingsForm initial={pushPrompt} />
    </>
  );
}
