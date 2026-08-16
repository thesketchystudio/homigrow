// app/(client)/profile/page.tsx
// Bare /profile redirects to the default tab.

import { redirect } from "next/navigation";

export default function ProfileIndexPage() {
  redirect("/profile/account");
}
