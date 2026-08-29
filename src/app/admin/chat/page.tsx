import { Suspense } from "react";
import ChatClient from "./ChatClient";

export const metadata = { title: "Live Chat | Admin" };
export const dynamic = "force-dynamic";

export default function AdminChatPage() {
  return (
    <div>
      {/* The heading moved into ChatClient: on a phone it has to disappear
          when a conversation is open, and only the client knows whether one
          is. */}
      <Suspense fallback={null}>
        <ChatClient vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      </Suspense>
    </div>
  );
}
