import { Suspense } from "react";
import ChatClient from "./ChatClient";

export const metadata = { title: "Live Chat | Admin" };
export const dynamic = "force-dynamic";

export default function AdminChatPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep">
          Live Chat
        </h1>
        <p className="text-sm text-bourbon-deep/60 mt-1">
          Reply to visitors in real time. Enable notifications to get pinged on this device.
        </p>
      </header>
      <Suspense fallback={null}>
        <ChatClient vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      </Suspense>
    </div>
  );
}
