// app/welcome/page.tsx
// Welcome/chooser route — the entry point before signup and login, using
// the split-screen AuthSplitShell (distinct from the (auth) group's
// simpler layout used by the signup wizard).

import { AuthSplitShell } from "@/features/auth/AuthSplitShell";
import { WelcomeScreen } from "@/features/auth/WelcomeScreen";

export default function WelcomePage() {
  return (
    <AuthSplitShell>
      <WelcomeScreen />
    </AuthSplitShell>
  );
}
