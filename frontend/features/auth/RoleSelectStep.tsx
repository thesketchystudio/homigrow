// features/auth/RoleSelectStep.tsx
// Step 1 of 3 — "Who are you?" role cards (Figma: RoleSelectScreen,
// node 416:623). Selecting a card commits the role and advances.

import { Briefcase, Check, Home } from "lucide-react";
import { UserRole } from "@/lib/enums";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { cn } from "@/lib/utils";

const ROLE_CARDS = [
  {
    role: UserRole.client,
    icon: Home,
    title: "I'm looking for property",
    description: "Browse listings, save favourites, and connect with verified brokers.",
  },
  {
    role: UserRole.broker,
    icon: Briefcase,
    title: "I'm a broker / agent",
    description: "List properties, manage leads, and grow your real estate business.",
  },
] as const;

type RoleSelectStepProps = {
  role: Exclude<UserRole, "admin"> | null;
  onSelectRole: (role: Exclude<UserRole, "admin">) => void;
  onContinue: () => void;
  onGoToLogin: () => void;
};

export function RoleSelectStep({ role, onSelectRole, onContinue, onGoToLogin }: RoleSelectStepProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      <AuthProgressBar step={1} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[16px] font-medium text-foreground">Who are you?</h1>
          <p className="font-body text-[16px] leading-[26px] text-brand-primary-100">
            Select your role to personalise your experience.
          </p>
        </div>

        <div className="flex flex-col gap-[10px] sm:flex-row">
          {ROLE_CARDS.map(({ role: cardRole, icon: Icon, title, description }) => {
            const selected = role === cardRole;
            return (
              <button
                key={cardRole}
                type="button"
                onClick={() => onSelectRole(cardRole)}
                className={cn(
                  "flex flex-1 flex-col items-start gap-[14px] rounded-lg border-2 p-[30px] text-left transition-colors",
                  selected ? "border-foreground bg-foreground" : "border-brand-secondary-500 bg-background",
                )}
              >
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded",
                    selected ? "bg-brand-green-600" : "bg-brand-green-200",
                  )}
                >
                  <Icon size={20} className={selected ? "text-foreground" : "text-brand-green-800"} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className={cn("font-heading text-[16px] font-medium", selected ? "text-background" : "text-foreground")}>
                    {title}
                  </p>
                  <p className={cn("font-body text-[16px] leading-[26px]", selected ? "text-brand-primary-100" : "text-brand-primary-200")}>
                    {description}
                  </p>
                </div>
                {selected && (
                  <div className="flex items-center gap-[6px]">
                    <Check size={16} className="text-brand-green-600" />
                    <span className="font-heading text-[12px] text-brand-green-600">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        <p className="font-heading text-[16px] text-brand-secondary-800">
          {"Have an account? "}
          <button type="button" onClick={onGoToLogin} className="font-bold text-foreground">
            Log in →
          </button>
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={!role}
          className="flex items-center gap-3 rounded-lg bg-brand-primary-500 px-12 py-4 font-heading text-[16px] font-bold text-background disabled:opacity-40"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
