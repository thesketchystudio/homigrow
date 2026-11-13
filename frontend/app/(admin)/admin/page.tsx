// app/(admin)/admin/page.tsx
// Bare /admin has no screen of its own; it forwards to the dashboard,
// whose guard then decides between the dashboard and the sign-in page.

import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
