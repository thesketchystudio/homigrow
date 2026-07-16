// app/(client)/profile/notifications/page.tsx
// Notifications tab placeholder — full content lands in a later task.

import { Bell } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function NotificationsPage() {
  return <EmptyState icon={Bell} title="Notifications" body="Notification preferences will live here." />;
}
