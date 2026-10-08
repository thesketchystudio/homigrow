// features/properties/PropertyLoanCalculator.tsx
// Home loan calculator seeded with the property's own price (Figma node
// 133:2563, "LoanCalculator"). Reuses the same amortization math as the
// homepage's EmiCalculatorSection (features/homepage/EmiCalculator.tsx)
// but adapted to this screen's own controls (down-payment %, tenure
// chips) and light-card visual language. "Apply for Loan" / "Get
// Pre-Approved" have no backend (loan applications are a separate,
// unbuilt Profile tab) — both just surface a toast. The card sits on a
// translucent grey wash so it reads as a distinct panel against the page
// background, with a symmetric 48px side inset.

"use client";

import { useMemo, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { calculateEmi } from "@/lib/finance";
import { toast } from "@/lib/toast";

const TENURE_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

function formatCr(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function LightDonut({ principalPct }: { principalPct: number }) {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;
  const pDash = principalPct * circ;
  const iDash = (1 - principalPct) * circ;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dfe0e1" strokeWidth="22" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#92f574"
        strokeWidth="22"
        strokeDasharray={`${pDash} ${iDash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
    </svg>
  );
}

const sliderTrack =
  "**:data-[slot=slider-track]:h-[3px] **:data-[slot=slider-track]:rounded-full **:data-[slot=slider-track]:bg-[rgba(86,94,116,0.15)] **:data-[slot=slider-range]:rounded-full **:data-[slot=slider-range]:bg-[#565e74] **:data-[slot=slider-thumb]:size-[18px] **:data-[slot=slider-thumb]:border-[1.6px] **:data-[slot=slider-thumb]:border-[#565e74] **:data-[slot=slider-thumb]:bg-brand-secondary-100";

const fieldLabel = "font-heading text-[12px] uppercase leading-4 tracking-[1.2px] text-brand-primary-600/80";
const valueChip =
  "flex h-[31px] items-center rounded-md border-[0.8px] border-[rgba(86,94,116,0.25)] bg-brand-secondary-100 px-3 font-heading text-[16px] font-bold leading-6";

type SliderFieldProps = {
  label: string;
  chips: React.ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
};

// One labelled slider row: title + value chip(s) above, track, then the
// min/max captions — spacing (10px between each) follows the Figma frame.
function SliderField({ label, chips, min, max, step, value, minLabel, maxLabel, onChange }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className={fieldLabel}>{label}</span>
        {chips}
      </div>
      <div className="flex h-5 items-center">
        <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className={sliderTrack} />
      </div>
      <div className="flex justify-between font-heading text-[16px] leading-[17px] text-brand-secondary-700">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export function PropertyLoanCalculator({ propertyPrice }: { propertyPrice: number }) {
  const [price, setPrice] = useState(Math.round(propertyPrice));
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState<(typeof TENURE_OPTIONS)[number]>(20);

  const calc = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    const { emi, totalPayment, totalInterest } = calculateEmi(loanAmount, rate, tenure);
    const monthlyIncomeNeeded = emi / 0.4;
    return { downPayment, loanAmount, emi, total: totalPayment, interest: totalInterest, monthlyIncomeNeeded };
  }, [price, downPaymentPct, rate, tenure]);

  const principalPct = calc.loanAmount / calc.total;

  const handleDeferred = (action: string) => toast.info(`${action} isn't available yet — check back soon.`);

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-[rgba(223,224,225,0.24)] px-6 pt-16 pb-12 sm:px-12 sm:pb-22">
      <div className="flex flex-col gap-2">
        <p className="font-heading text-[12px] uppercase leading-4 tracking-[1.2px] text-[#565e74]">Plan your purchase</p>
        <h2 className="font-heading text-[28px] font-bold leading-9 text-brand-primary-400">Home loan calculator</h2>
        <p className="font-body max-w-[480px] text-[14px] leading-[22px] text-[rgba(9,9,9,0.65)]">
          Estimate your monthly EMI, total interest payout and plan your budget before you make an offer.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SliderField
            label="Property Price"
            chips={<span className={`${valueChip} text-brand-primary-600`}>{formatCr(price)}</span>}
            min={10_00_000}
            max={10_00_00_000}
            step={1_00_000}
            value={price}
            minLabel="₹10 L"
            maxLabel="₹10 Cr"
            onChange={setPrice}
          />

          <SliderField
            label="Down Payment"
            chips={
              <div className="flex items-center gap-2">
                <span className={`${valueChip} text-[#565e74]`}>{downPaymentPct}%</span>
                <span className="flex h-[31px] items-center rounded-md border-[0.8px] border-[rgba(86,94,116,0.15)] bg-brand-secondary-100 px-3 font-heading text-[16px] leading-6 text-brand-primary-600/80">
                  {formatCr(calc.downPayment)}
                </span>
              </div>
            }
            min={5}
            max={80}
            step={1}
            value={downPaymentPct}
            minLabel="5%"
            maxLabel="80%"
            onChange={setDownPaymentPct}
          />

          <SliderField
            label="Interest Rate (p.a.)"
            chips={<span className={`${valueChip} text-brand-primary-600`}>{rate.toFixed(1)}%</span>}
            min={5}
            max={20}
            step={0.1}
            value={rate}
            minLabel="5%"
            maxLabel="20%"
            onChange={setRate}
          />

          <div className="flex flex-col gap-3">
            <span className={fieldLabel}>Loan Tenure</span>
            <div className="flex flex-wrap gap-2">
              {TENURE_OPTIONS.map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setTenure(years)}
                  className={`rounded-md border-[0.8px] px-4 py-1 font-heading text-[16px] font-bold leading-6 ${
                    tenure === years
                      ? "border-[#262626] bg-brand-primary-400 text-brand-secondary-100"
                      : "border-[rgba(86,94,116,0.25)] bg-brand-secondary-100 text-brand-primary-600/80"
                  }`}
                >
                  {years}Y
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[74px] items-stretch justify-between gap-4 rounded-[10px] bg-[rgba(86,94,116,0.08)] px-5 py-3.5">
            <div className="flex flex-col gap-0.5">
              <span className={fieldLabel}>Loan Amount</span>
              <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{formatCr(calc.loanAmount)}</span>
            </div>
            <div className="w-px bg-[rgba(86,94,116,0.15)]" />
            <div className="flex flex-col items-center gap-0.5">
              <span className={fieldLabel}>Tenure</span>
              <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{tenure} Years</span>
            </div>
            <div className="w-px bg-[rgba(86,94,116,0.15)]" />
            <div className="flex flex-col items-end gap-0.5">
              <span className={fieldLabel}>Rate</span>
              <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{rate.toFixed(1)}% p.a.</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[340px] lg:shrink-0">
          <div className="flex flex-col rounded-[14px] bg-brand-primary-400 p-7">
            <p className={`${fieldLabel} text-brand-secondary-100/65`}>Monthly EMI</p>
            <p className="mt-1.5 font-heading text-[36px] font-bold leading-[44px] text-brand-secondary-100">{formatCr(Math.round(calc.emi))}</p>
            <p className="mt-2.5 font-body text-[12px] leading-[18px] text-brand-secondary-100/55">
              for {tenure * 12} months @ {rate.toFixed(1)}% p.a.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-[14px] bg-brand-secondary-100 p-6">
            <p className={fieldLabel}>Repayment Breakdown</p>
            <div className="relative mx-auto">
              <LightDonut principalPct={principalPct} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-[10px] uppercase leading-[14px] tracking-[1px] text-brand-secondary-700">Total</span>
                <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{formatCr(calc.total)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-body text-[12px] leading-[18px] text-brand-primary-600/80">
                  <span className="size-2.5 rounded-full bg-brand-green-400" /> Principal
                </span>
                <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{formatCr(calc.loanAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-body text-[12px] leading-[18px] text-brand-primary-600/80">
                  <span className="size-2.5 rounded-full border-[0.8px] border-[#b3b1b4] bg-brand-secondary-500" /> Total Interest
                </span>
                <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{formatCr(calc.interest)}</span>
              </div>
              <div className="h-px bg-[rgba(186,187,188,0.3)]" />
              <div className="flex items-center justify-between">
                <span className="font-heading text-[12px] font-bold uppercase leading-4 tracking-[1.2px] text-brand-primary-400">Total Payable</span>
                <span className="font-heading text-[16px] font-bold leading-6 text-[#565e74]">{formatCr(calc.total)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-h-[108px] flex-col gap-1 rounded-[10px] bg-brand-secondary-100 py-3.5 pr-3 pl-4">
              <p className="font-heading text-[10px] font-medium uppercase leading-[14px] tracking-[1px] text-brand-primary-400">Interest Saved (↑ Down Pmt)</p>
              <p className="font-body text-[12px] leading-[18px] text-[rgba(9,9,9,0.65)]">Increase down payment to reduce interest outgo</p>
            </div>
            <div className="flex min-h-[108px] flex-col gap-1 rounded-[10px] bg-brand-secondary-100 py-3.5 pr-3 pl-4">
              <p className="font-heading text-[10px] font-medium uppercase leading-[14px] tracking-[1px] text-brand-primary-400">Monthly Income Needed</p>
              <p className="font-body text-[12px] leading-[18px] text-[rgba(9,9,9,0.65)]">
                EMI should be ≤ 40% of your net monthly income — approx {formatCr(calc.monthlyIncomeNeeded)}/mo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDeferred("Loan applications")}
              className="rounded-lg bg-brand-primary-400 px-4 py-2 font-heading text-[16px] font-bold leading-6 text-brand-secondary-100"
            >
              Apply for Loan
            </button>
            <button
              type="button"
              onClick={() => handleDeferred("Pre-approval")}
              className="whitespace-nowrap rounded-lg border-[0.8px] border-black px-2 py-2 text-center font-heading text-[16px] font-bold leading-6 text-brand-primary-400"
            >
              Get Pre-Approved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
