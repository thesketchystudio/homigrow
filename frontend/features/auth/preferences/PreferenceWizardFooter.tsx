// features/auth/preferences/PreferenceWizardFooter.tsx
// Back / Skip / Continue row repeated identically across all 6 Phase B
// Figma frames (nodes 418:994-457:1317's "TertiaryButton" + outlined
// "Skip" + gradient "Continue"). onBack is omitted on the first Phase B
// screen, matching RoleSelectStep's existing no-back-on-step-1 precedent.

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
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="border-b border-brand-secondary-800 font-heading text-[16px] font-bold text-brand-primary-800"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="rounded border border-brand-primary-100 bg-background p-[17px] font-heading text-[16px] font-bold text-brand-primary-400"
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
