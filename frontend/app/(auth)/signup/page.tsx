// app/(auth)/signup/page.tsx
// Signup route — renders the 3-step wizard inside the shared (auth)
// layout shell.

import { SignupWizard } from "@/features/auth/SignupWizard";

export default function SignupPage() {
  return <SignupWizard />;
}
