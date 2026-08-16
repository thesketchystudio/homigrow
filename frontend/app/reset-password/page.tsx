// app/reset-password/page.tsx
// Reset-password route, landed on from the emailed reset link
// (?token=...). Wrapped in Suspense since ResetPasswordForm reads the
// token via useSearchParams, which Next.js requires for static rendering.

import { Suspense } from "react";
import { AuthSplitShell } from "@/features/auth/AuthSplitShell";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthSplitShell>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitShell>
  );
}
