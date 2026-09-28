// features/ai-tools/RentVsBuyCalculatorTool.tsx
// Rent vs Buy Calculator tool screen (Figma node 737:2787/2788). Formula
// reverse-derived from the reference build (toolshomigrow.figma.site) to
// match its numbers exactly — see lib/finance.ts's calculateRentVsBuy for
// the buy/rent cost model.

"use client";

import { useMemo, useState } from "react";

import { calculateRentVsBuy, formatRupees } from "@/lib/finance";

import { ToolPageShell } from "./ToolPageShell";
import { ToolSlider } from "./ToolSlider";

export function RentVsBuyCalculatorTool() {
  const [propertyValue, setPropertyValue] = useState(8000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRatePct, setLoanRatePct] = useState(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState(20);
  const [appreciationPct, setAppreciationPct] = useState(7);
  const [monthlyRent, setMonthlyRent] = useState(25000);
  const [rentGrowthPct, setRentGrowthPct] = useState(5);

  const result = useMemo(
    () => calculateRentVsBuy({ propertyValue, downPaymentPct, loanRatePct, loanTenureYears, appreciationPct, monthlyRent, rentGrowthPct }),
    [propertyValue, downPaymentPct, loanRatePct, loanTenureYears, appreciationPct, monthlyRent, rentGrowthPct],
  );

  const buyingIsCheaper = result.saving > 0;

  return (
    <ToolPageShell category="Finance & Yield" title="Rent vs Buy Calculator">
      <div className="grid grid-cols-1 gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:grid-cols-2 sm:p-10">
        <div className="flex flex-col gap-5">
          <p className="font-heading text-[12px] font-bold tracking-[1.2px] text-brand-primary-200 uppercase">Buying</p>
          <ToolSlider
            label="Property Value"
            value={propertyValue}
            min={1000000}
            max={100000000}
            step={100000}
            display={formatRupees(propertyValue)}
            minLabel="10,00,000"
            maxLabel="10,00,00,000"
            onChange={setPropertyValue}
          />
          <ToolSlider label="Down Payment %" value={downPaymentPct} min={10} max={50} step={1} display={`${downPaymentPct}%`} onChange={setDownPaymentPct} />
          <ToolSlider label="Home Loan Rate" value={loanRatePct} min={6} max={18} step={0.1} display={`${loanRatePct.toFixed(1)}%`} onChange={setLoanRatePct} />
          <ToolSlider label="Loan Tenure" value={loanTenureYears} min={5} max={30} step={1} display={`${loanTenureYears} yrs`} onChange={setLoanTenureYears} />
          <ToolSlider
            label="Annual Appreciation"
            value={appreciationPct}
            min={1}
            max={20}
            step={0.5}
            display={`${appreciationPct}%`}
            onChange={setAppreciationPct}
          />

          <p className="font-heading text-[12px] font-bold tracking-[1.2px] text-brand-primary-200 uppercase">Renting</p>
          <ToolSlider
            label="Monthly Rent"
            value={monthlyRent}
            min={5000}
            max={500000}
            step={1000}
            display={formatRupees(monthlyRent)}
            minLabel="5,000"
            maxLabel="5,00,000"
            onChange={setMonthlyRent}
          />
          <ToolSlider
            label="Annual Rent Growth"
            value={rentGrowthPct}
            min={0}
            max={15}
            step={0.5}
            display={`${rentGrowthPct}%`}
            onChange={setRentGrowthPct}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-xl bg-brand-primary-800 p-5">
            <span className="font-body text-[12px] text-brand-secondary-100/60">Verdict after {loanTenureYears} years</span>
            <span className="font-heading text-[20px] font-bold text-brand-secondary-100">
              {buyingIsCheaper ? "Buying appears more cost-effective" : "Renting appears more cost-effective"}
            </span>
            <span className="font-body text-[14px] text-brand-secondary-100/70">Saving: {formatRupees(Math.abs(result.saving))}</span>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-brand-secondary-500 bg-brand-secondary-400 p-5">
            <span className="font-heading text-[14px] font-bold text-brand-primary-500">Buy scenario</span>
            <div className="flex flex-col gap-2">
              {[
                ["Monthly EMI", formatRupees(result.emi)],
                ["Total outflow (loan + DP + tax/reg)", formatRupees(result.totalOutflow)],
                [`Property value after ${loanTenureYears} yrs`, formatRupees(result.finalPropertyValue)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-brand-secondary-500 py-1">
                  <span className="font-body text-[12px] text-brand-primary-100">{label}</span>
                  <span className="font-body text-[12px] text-brand-primary-600/80">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[12px] text-brand-primary-100">Net cost (outflow − final value)</span>
                <span className="font-heading text-[12px] font-bold text-brand-primary-500">{formatRupees(Math.abs(result.netCostBuy))}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-brand-secondary-500 bg-brand-secondary-400 p-5">
            <span className="font-heading text-[14px] font-bold text-brand-primary-500">Rent scenario</span>
            <div className="flex items-center justify-between pt-2">
              <span className="font-body text-[12px] text-brand-primary-100">Total rent paid over {loanTenureYears} yrs</span>
              <span className="font-heading text-[12px] font-bold text-brand-primary-500">{formatRupees(result.totalRentPaid)}</span>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
