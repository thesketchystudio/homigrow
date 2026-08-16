// app/forgot-password/page.tsx
// "Forgot password?" route, reached from LoginForm's "Forgot password?"
// link, using the same split-screen AuthSplitShell as login/reset.

import { AuthSplitShell } from "@/features/auth/AuthSplitShell";
import { ForgotPasswordFlow } from "@/features/auth/ForgotPasswordFlow";

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell>
      <ForgotPasswordFlow />
    </AuthSplitShell>
  );
}
