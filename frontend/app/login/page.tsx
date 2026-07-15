// app/login/page.tsx
// Login route, using the split-screen AuthSplitShell (Figma: "Client -
// Log in", node 423:3651) — distinct from the (auth) group's simpler
// layout used by the signup wizard.

import { AuthSplitShell } from "@/features/auth/AuthSplitShell";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthSplitShell>
      <LoginForm />
    </AuthSplitShell>
  );
}
