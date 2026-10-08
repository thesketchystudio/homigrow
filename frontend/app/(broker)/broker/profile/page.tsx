// app/(broker)/broker/profile/page.tsx
// Route entry for the Broker Profile page (Figma node 177:2805) — the
// shared BrokerLayout already supplies the app-shell/AppSidebar chrome, so
// this file just mounts the page's real content.

import { BrokerProfilePage } from "@/features/broker/profile/BrokerProfilePage";

export default function Page() {
  return <BrokerProfilePage />;
}
