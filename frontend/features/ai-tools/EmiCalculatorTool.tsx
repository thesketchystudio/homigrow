// features/ai-tools/EmiCalculatorTool.tsx
// EMI Calculator tool screen (Figma node 735:1816/1817). Uses the shared
// EMI math in lib/finance.ts (calculateEmi/buildAmortizationSchedule) —
// the same functions the homepage EMI section and property details loan
// calculator use — so all three surfaces stay numerically identical.

"use client";

import { useMemo, useState } from "react";

import { buildAmortizationSchedule, calculateEmi, formatRupees } from "@/lib/finance";

import { ResultCard } from "./ResultCard";
import { ToolPageShell } from "./ToolPageShell";
import { ToolSlider } from "./ToolSlider";

export function EmiCalculatorTool() {
  const [amount, setAmount] = useState(3500000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(15);
  const [showSchedule, setShowSchedule] = useState(true);

  const { emi, totalPayment, totalInterest } = useMemo(() => calculateEmi(amount, rate, tenure), [amount, rate, tenure]);
  const schedule = useMemo(() => buildAmortizationSchedule(amount, rate, tenure, 12), [amount, rate, tenure]);

  return (
    <ToolPageShell category="Finance & Yield" title="EMI Calculator">
      <div className="flex flex-col gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:p-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ToolSlider
              label="Loan Amount"
              value={amount}
              min={100000}
              max={50000000}
              step={50000}
              display={formatRupees(amount)}
              minLabel="1,00,000"
              maxLabel="5,00,00,000"
              onChange={setAmount}
            />
            <ToolSlider label="Annual Rate of Interest" value={rate} min={5} max={20} step={0.1} display={`${rate.toFixed(1)}%`} onChange={setRate} />
            <ToolSlider label="Loan Tenure (Years)" value={tenure} min={1} max={30} step={1} display={`${tenure} yrs`} onChange={setTenure} />
          </div>
          <div className="flex flex-col gap-4">
            <ResultCard label="Monthly EMI" value={formatRupees(emi)} accent />
            <ResultCard label="Total Principal" value={formatRupees(amount)} />
            <ResultCard label="Total Interest" value={formatRupees(totalInterest)} />
            <ResultCard label="Total Payment" value={formatRupees(totalPayment)} />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-brand-secondary-500">
          <button
            type="button"
            onClick={() => setShowSchedule((s) => !s)}
            className="flex w-full items-center justify-between bg-brand-secondary-400 px-6 py-4"
          >
            <span className="font-heading text-[14px] font-bold text-brand-primary-500">Amortisation Schedule (first 12 months)</span>
            <span className="font-body text-[14px] text-brand-primary-100">{showSchedule ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showSchedule && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="bg-brand-primary-800">
                    {["Month", "EMI", "Principal", "Interest", "Balance"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 font-heading text-[12px] font-bold text-brand-secondary-100 ${i === 0 ? "text-left" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.month} className={row.month % 2 === 0 ? "bg-brand-secondary-400" : "bg-brand-secondary-100"}>
                      <td className="px-4 py-3 font-body text-[14px] text-brand-primary-500">{row.month}</td>
                      <td className="px-4 py-3 text-right font-body text-[14px] text-brand-primary-600/80">{formatRupees(emi)}</td>
                      <td className="px-4 py-3 text-right font-body text-[14px] text-brand-primary-600/80">{formatRupees(row.principal)}</td>
                      <td className="px-4 py-3 text-right font-body text-[14px] text-brand-primary-600/80">{formatRupees(row.interest)}</td>
                      <td className="px-4 py-3 text-right font-body text-[14px] text-brand-primary-600/80">{formatRupees(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
