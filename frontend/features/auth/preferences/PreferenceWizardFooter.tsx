// features/auth/preferences/PreferenceWizardFooter.tsx
// Back / Skip / Continue row repeated identically across all 6 Phase B
// Figma frames (nodes 418:994-457:1317's "TertiaryButton" + outlined
// "Skip" + gradient "Continue"). onBack is intentionally omitted on the
// first Phase B screen (nothing useful to go back to — re-showing the
// already-completed OTP-verify screen wouldn't help the user) — Skip
// keeps the same fixed width it has everywhere else (169px) but sits
// flush against the left edge instead of leaving Back's usual space empty.

import { cn } from "@/lib/utils";

type PreferenceWizardFooterProps = {
  onBack?: () => void;
  onSkip: () => void;
  onContinue: () => void;
  continueLabel?: string;
  isSaving?: boolean;
};

export function PreferenceWizardFooter({ onBack, onSkip, onContinue, continueLabel = "Continue", isSaving }: PreferenceWizardFooterProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex w-[256px] items-center gap-4">
        {onBack && (
          <button type="button" onClick={onBack} className="flex h-[33px] shrink-0 items-center justify-center px-[16px]">
            <span className="w-[39px] border-b border-brand-secondary-800 text-center font-heading text-[16px] font-bold text-brand-primary-800">
              Back
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            "flex items-center justify-center rounded border border-brand-primary-100 bg-background p-[17px] font-heading text-[16px] font-bold text-brand-primary-400",
            onBack ? "flex-1" : "w-[169px]",
          )}
        >
          Skip
        </button>
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={isSaving}
        className="flex items-center justify-center rounded py-4 px-12 font-heading text-[16px] font-bold text-background disabled:opacity-60"
        style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
      >
        {isSaving ? "Saving…" : continueLabel}
      </button>
    </div>
  );
}
