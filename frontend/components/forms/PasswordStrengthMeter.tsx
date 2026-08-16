// components/forms/PasswordStrengthMeter.tsx
// 3-bar strength meter matching the Figma signup form. zxcvbn is loaded
// lazily (it's a sizeable library) since this only renders on password
// fields, and only after the user has typed something. The backend's
// zxcvbn score (MIN_PASSWORD_STRENGTH_SCORE) is the real gate — this is
// UX feedback only, not a validation source of truth.

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MIN_PASSWORD_STRENGTH_SCORE } from "@/lib/validation/auth";

const LABELS = ["Weak", "Weak", "Medium", "Strong", "Strong"];
const BAR_COLOR = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-brand-green-600", "bg-brand-green-600"];
const TEXT_COLOR = ["text-destructive", "text-destructive", "text-amber-500", "text-brand-green-600", "text-brand-green-600"];
const FILLED_BARS = [1, 1, 2, 3, 3];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    import("zxcvbn").then(({ default: zxcvbn }) => {
      if (!cancelled) setScore(zxcvbn(password).score);
    });
    return () => {
      cancelled = true;
    };
  }, [password]);

  if (!password || score === null) return null;

  const filled = FILLED_BARS[score];

  return (
    <div className="flex flex-col gap-[6px] pt-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((bar) => (
          <div
            key={bar}
            className={cn("h-[3px] flex-1 rounded-full", bar < filled ? BAR_COLOR[score] : "bg-black/10")}
          />
        ))}
      </div>
      <p className={cn("text-[11px] leading-[16.5px]", TEXT_COLOR[score])}>
        {LABELS[score]}
        {score < MIN_PASSWORD_STRENGTH_SCORE && " — needs to be stronger"}
      </p>
    </div>
  );
}
