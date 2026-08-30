// app/(auth)/signup/page.tsx
// Signup route — renders the full signup wizard (role select, form,
// OTP verify, then a role-specific continuation: buyer-preference
// screens for a client, document upload + pending review for a broker)
// inside the shared (auth) layout shell.

import { SignupWizard } from "@/features/auth/SignupWizard";

export default function SignupPage() {
  return <SignupWizard />;
}
