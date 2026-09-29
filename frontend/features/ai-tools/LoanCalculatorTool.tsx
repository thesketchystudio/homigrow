// features/ai-tools/LoanCalculatorTool.tsx
// Loan Calculator tool screen (Figma node 735:1495/1496) — near-duplicate
// of EmiCalculatorTool.tsx's math (both use lib/finance.ts's calculateEmi)
// but with a principal/interest "Breakup" bar instead of an amortisation
// schedule, per the design. "Download report" has no backing PDF
// generation, so it surfaces a toast, matching PropertyLoanCalculator's
// "coming soon" treatment for its own unbuilt actions.

"use client";

import { useMemo, useState } from "react";

import { calculateEmi, formatRupees } from "@/lib/finance";
import { toast } from "@/lib/toast";

import { ResultCard } from "./ResultCard";
import { ToolPageShell } from "./ToolPageShell";
import { ToolSlider } from "./ToolSlider";

export function LoanCalculatorTool() {
  const [amount, setAmount] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const { emi, totalPayment, totalInterest } = useMemo(() => calculateEmi(amount, rate, tenure), [amount, rate, tenure]);
  const principalPct = totalPayment > 0 ? (amount / totalPayment) * 100 : 0;

  return (
    <ToolPageShell category="Finance & Yield" title="Loan Calculator">
      <div className="flex flex-col items-end gap-4">
        <button
          type="button"
          onClick={() => toast.info("Report download isn't available yet — check back soon.")}
          className="rounded bg-brand-primary-800 px-8 py-3.5 font-heading text-[16px] font-bold text-brand-secondary-100"
        >
          Download report
        </button>

        <div className="flex w-full flex-col gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:p-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-6">
              <ToolSlider
                label="Loan Amount"
                value={amount}
                min={500000}
                max={50000000}
                step={50000}
                display={formatRupees(amount)}
                minLabel="5,00,000"
                maxLabel="5,00,00,000"
                onChange={setAmount}
              />
              <ToolSlider label="Annual Interest Rate" value={rate} min={5} max={20} step={0.1} display={`${rate.toFixed(1)}%`} onChange={setRate} />
              <ToolSlider label="Loan Tenure" value={tenure} min={1} max={30} step={1} display={`${tenure} yrs`} onChange={setTenure} />
            </div>
            <div className="flex flex-col gap-4">
              <ResultCard label="Monthly EMI" value={formatRupees(emi)} accent />
              <ResultCard label="Total Amount Payable" value={formatRupees(totalPayment)} />
              <ResultCard label="Total Interest Payable" value={formatRupees(totalInterest)} />

              <div className="flex flex-col gap-3 rounded-xl border border-brand-secondary-500 bg-brand-secondary-400 p-5">
                <span className="font-heading text-[14px] font-bold text-brand-primary-500">Breakup</span>
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  <div className="h-full bg-brand-primary-600" style={{ width: `${principalPct}%` }} />
                  <div className="h-full flex-1 bg-brand-green-300" />
                </div>
                <div className="flex flex-wrap gap-6">
                  <span className="flex items-center gap-2 font-body text-[12px] text-brand-primary-100">
                    <span className="size-3 rounded-[4px] bg-brand-primary-600" />
                    Principal <span className="font-heading font-bold text-brand-primary-500">{formatRupees(amount)}</span>
                  </span>
                  <span className="flex items-center gap-2 font-body text-[12px] text-brand-primary-100">
                    <span className="size-3 rounded-[4px] border border-brand-secondary-500 bg-brand-green-200" />
                    Interest <span className="font-heading font-bold text-brand-primary-500">{formatRupees(totalInterest)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
