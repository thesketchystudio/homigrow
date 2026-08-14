// features/auth/SignupWizard.tsx
// Orchestrates the full signup flow as local component state rather than
// separate routes — the Figma design treats it as one continuous flow
// sharing a single progress bar, and no step after the first needs to be
// independently linkable or refreshable. Two distinct post-verification
// paths branch on role: a client enters the 6-screen buyer-preference
// wizard (budget -> ... -> situation); a broker enters document upload
// -> pending-review instead — the buyer-preference screens don't apply
// to a broker at all, so they must never be reached for that role.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UserRole } from "@/lib/enums";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/lib/stores/auth";
import type { TokenResponse } from "@/lib/api/endpoints/auth";
import { getMe, updateMe } from "@/lib/api/endpoints/users";
import { RoleSelectStep } from "@/features/auth/RoleSelectStep";
import { SignupFormStep } from "@/features/auth/SignupFormStep";
import { OtpVerifyStep } from "@/features/auth/OtpVerifyStep";
import { BrokerDocumentUploadStep } from "@/features/auth/BrokerDocumentUploadStep";
import { BrokerPendingStep } from "@/features/auth/BrokerPendingStep";
import { BudgetLocationStep } from "@/features/auth/preferences/BudgetLocationStep";
import { PropertyTypeStep } from "@/features/auth/preferences/PropertyTypeStep";
import { InvestmentGoalStep } from "@/features/auth/preferences/InvestmentGoalStep";
import { ExitStrategyStep } from "@/features/auth/preferences/ExitStrategyStep";
import { DevelopmentStageStep } from "@/features/auth/preferences/DevelopmentStageStep";
import { CurrentSituationStep } from "@/features/auth/preferences/CurrentSituationStep";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

type WizardStep =
  | "role"
  | "form"
  | "verify"
  | "documents"
  | "pending"
  | "budget"
  | "property"
  | "goal"
  | "exit"
  | "development"
  | "situation";

const PREFERENCE_STEP_ORDER: WizardStep[] = ["budget", "property", "goal", "exit", "development", "situation"];

export function SignupWizard() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState<WizardStep>("role");
  const [role, setRole] = useState<Exclude<UserRole, "admin"> | null>(null);
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<BuyerPreferences>({});

  const goToLogin = () => router.push("/login");

  const finishSignup = () => {
    toast.success("Welcome to Homigrow!");
    router.push("/");
  };

  // Buyer preferences are optional profiling data, not required for a
  // valid account — a failed save shouldn't strand the user mid-signup.
  const saveMutation = useMutation({
    mutationFn: async () => {
      const me = await getMe();
      return updateMe({ preferences: { ...me.preferences, buyer_preferences: preferences } });
    },
    onSettled: (_data, error) => {
      if (error) toast.error("Couldn't save your preferences, but your account is ready.");
      finishSignup();
    },
  });

  const handleAuthenticated = (session: TokenResponse) => {
    setAuth(session.user, session.access_token);
    // A broker has no buyer-preference wizard to fill out — goes
    // straight to document upload instead. Both paths need the Bearer
    // token setAuth just attached (getMe/updateMe for a client,
    // the verification-documents upload for a broker).
    setStep(role === UserRole.broker ? "documents" : "budget");
  };

  const updatePreferences = (patch: Partial<BuyerPreferences>) => setPreferences((prev) => ({ ...prev, ...patch }));
  const goToPreferenceStep = (target: WizardStep) => setStep(target);
  const skipPreferences = () => finishSignup();

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

  if (step === "verify") {
    return (
      <OtpVerifyStep
        email={email}
        onVerified={handleAuthenticated}
        totalSteps={role === UserRole.broker ? 4 : 3}
      />
    );
  }

  if (step === "documents") {
    return (
      <BrokerDocumentUploadStep onSubmitted={() => setStep("pending")} onExit={() => router.push("/")} />
    );
  }

  if (step === "pending") {
    return <BrokerPendingStep />;
  }

  if (step === "budget") {
    return (
      <BudgetLocationStep
        preferences={preferences}
        onChange={updatePreferences}
        onSkip={skipPreferences}
        onContinue={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[1])}
      />
    );
  }

  if (step === "property") {
    return (
      <PropertyTypeStep
        preferences={preferences}
        onChange={updatePreferences}
        onBack={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[0])}
        onSkip={skipPreferences}
        onContinue={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[2])}
      />
    );
  }

  if (step === "goal") {
    return (
      <InvestmentGoalStep
        preferences={preferences}
        onChange={updatePreferences}
        onBack={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[1])}
        onSkip={skipPreferences}
        onContinue={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[3])}
      />
    );
  }

  if (step === "exit") {
    return (
      <ExitStrategyStep
        preferences={preferences}
        onChange={updatePreferences}
        onBack={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[2])}
        onSkip={skipPreferences}
        onContinue={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[4])}
      />
    );
  }

  if (step === "development") {
    return (
      <DevelopmentStageStep
        preferences={preferences}
        onChange={updatePreferences}
        onBack={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[3])}
        onSkip={skipPreferences}
        onContinue={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[5])}
      />
    );
  }

  return (
    <CurrentSituationStep
      preferences={preferences}
      onChange={updatePreferences}
      onBack={() => goToPreferenceStep(PREFERENCE_STEP_ORDER[4])}
      onSkip={skipPreferences}
      onFinish={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
    />
  );
}
