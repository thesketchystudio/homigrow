// features/ai-tools/HomeLoanEligibilityTool.tsx
// Home Loan Eligibility tool screen (Figma node 735:1719/1720). Applies
// the standard FOIR (Fixed Obligation to Income Ratio) lending rule —
// lenders cap total EMI obligations at 50% of monthly income — then
// reverse-solves lib/finance.ts's EMI formula (principalForEmi) for the
// loan principal that maximum affordable EMI would support.

"use client";

import { useMemo, useState } from "react";

import { formatRupees, principalForEmi } from "@/lib/finance";

import { ResultCard } from "./ResultCard";
import { ToolPageShell } from "./ToolPageShell";
import { ToolSlider } from "./ToolSlider";

const FOIR_PCT = 50;

export function HomeLoanEligibilityTool() {
  const [income, setIncome] = useState(150000);
  const [existingEmis, setExistingEmis] = useState(0);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const { maxEmi, eligibleAmount } = useMemo(() => {
    const maxEmi = Math.max(0, income * (FOIR_PCT / 100) - existingEmis);
    return { maxEmi, eligibleAmount: principalForEmi(maxEmi, rate, tenure) };
  }, [income, existingEmis, rate, tenure]);

  return (
    <ToolPageShell slug="home-loan-eligibility" title="Home Loan Eligibility">
      <div className="grid grid-cols-1 gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:grid-cols-2 sm:p-10">
        <div className="flex flex-col gap-6">
          <ToolSlider
            label="Monthly Net Income"
            value={income}
            min={30000}
            max={1000000}
            step={5000}
            display={formatRupees(income)}
            minLabel="30,000"
            maxLabel="10,00,000"
            onChange={setIncome}
          />
          <ToolSlider
            label="Existing EMIs"
            value={existingEmis}
            min={0}
            max={200000}
            step={1000}
            display={formatRupees(existingEmis)}
            minLabel="0"
            maxLabel="2,00,000"
            onChange={setExistingEmis}
          />
          <ToolSlider label="Expected Interest Rate" value={rate} min={6} max={20} step={0.1} display={`${rate.toFixed(1)}%`} onChange={setRate} />
          <ToolSlider label="Desired Tenure" value={tenure} min={5} max={30} step={1} display={`${tenure} yrs`} onChange={setTenure} />
        </div>

        <div className="flex flex-col gap-4">
          <ResultCard label="Eligible Loan Amount" value={formatRupees(eligibleAmount)} accent />
          <ResultCard label="Max Monthly EMI" value={formatRupees(maxEmi)} />

          <div className="flex flex-col gap-3 rounded-xl border border-brand-secondary-500 bg-brand-secondary-400 p-5">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[14px] font-bold text-brand-primary-500">FOIR (Fixed Obligation to Income)</span>
              <span className="rounded-md bg-brand-green-200 px-2 py-1 font-heading text-[14px] font-bold text-brand-green-900">{FOIR_PCT}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-brand-secondary-500">
              <div className="h-full rounded-full bg-brand-primary-600" style={{ width: `${FOIR_PCT}%` }} />
            </div>
            <p className="font-body text-[12px] text-brand-primary-100">Lenders typically approve up to 50% FOIR. Keep your total EMIs within this threshold.</p>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-brand-secondary-500 bg-brand-green-200 p-5">
            <span className="font-heading text-[14px] font-bold text-brand-primary-500">Tip</span>
            <p className="font-body text-[12px] text-brand-primary-600/80">
              Adding a co-applicant with independent income can significantly increase your eligibility. Joint home loans also attract additional tax
              deductions under Section 24(b).
            </p>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
