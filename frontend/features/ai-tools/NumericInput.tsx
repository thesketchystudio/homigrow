// features/ai-tools/NumericInput.tsx
// Numeric text input for the AI tool calculators. It keeps the raw text the
// user is typing separate from the parsed number the calculator consumes, so
// clearing the field leaves it empty (instead of snapping to "0" and turning
// the next keystroke into "02015") while the calculator still sees 0.

"use client";

import { useState } from "react";

type NumericInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  // Allows a single decimal point (e.g. area in acres); integers only otherwise.
  allowDecimal?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function NumericInput({ value, onValueChange, allowDecimal = false, className, "aria-label": ariaLabel }: NumericInputProps) {
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  // If the parent changes the value from elsewhere (not from typing here),
  // show it; typed text that already parses to the same number is left alone.
  if (value !== lastValue) {
    setLastValue(value);
    if ((Number(text) || 0) !== value) setText(String(value));
  }

  const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;

  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      aria-label={ariaLabel}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        if (!pattern.test(next)) return;
        setText(next);
        onValueChange(Number(next) || 0);
      }}
      className={className}
    />
  );
}
