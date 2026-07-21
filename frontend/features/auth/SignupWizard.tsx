// features/auth/SignupWizard.tsx
// Orchestrates the 3-step signup flow (role -> form -> OTP verify) as
// local component state rather than separate routes — the Figma design
// treats it as one continuous flow sharing a single progress bar, and no
// step after the first needs to be independently linkable or refreshable.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/enums";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/lib/stores/auth";
import type { TokenResponse } from "@/lib/api/endpoints/auth";
import { RoleSelectStep } from "@/features/auth/RoleSelectStep";
import { SignupFormStep } from "@/features/auth/SignupFormStep";
import { OtpVerifyStep } from "@/features/auth/OtpVerifyStep";

type WizardStep = "role" | "form" | "verify";

export function SignupWizard() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState<WizardStep>("role");
  const [role, setRole] = useState<Exclude<UserRole, "admin"> | null>(null);
  const [email, setEmail] = useState("");

  const goToLogin = () => router.push("/login");

  const handleAuthenticated = (session: TokenResponse) => {
    setAuth(session.user, session.access_token);
    toast.success(session.user.full_name ? `Welcome, ${session.user.full_name}!` : "Welcome to Homigrow!");
    router.push("/");
  };

  if (step === "role") {
    return (
      <RoleSelectStep
        role={role}
        onSelectRole={setRole}
        onContinue={() => role && setStep("form")}
        onGoToLogin={goToLogin}
      />
    );
  }

  if (step === "form" && role) {
    return (
      <SignupFormStep
        role={role}
        onSuccess={(signedUpEmail) => {
          setEmail(signedUpEmail);
          setStep("verify");
        }}
        onGoogleAuthSuccess={handleAuthenticated}
        onBack={() => setStep("role")}
      />
    );
  }

  return <OtpVerifyStep email={email} onVerified={handleAuthenticated} />;
}
