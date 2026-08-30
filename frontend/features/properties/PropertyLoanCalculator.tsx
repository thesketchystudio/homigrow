// features/properties/PropertyLoanCalculator.tsx
// Home loan calculator seeded with the property's own price (Figma node
// 133:2563, "LoanCalculator"). Reuses the same amortization math as the
// homepage's EmiCalculatorSection (features/homepage/EmiCalculator.tsx)
// but adapted to this screen's own controls (down-payment %, tenure
// chips) and light-card visual language. "Apply for Loan" / "Get
// Pre-Approved" have no backend (loan applications are a separate,
// unbuilt Profile tab) — both just surface a toast. Card padding is
// symmetric (px-6 sm:px-12) to match Figma's equal 48px left/right inset —
// content sits inside the card, not flush against its left edge.

"use client";

import { useMemo, useState } from "react";

import { Slider } from "@/components/ui/slider";
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
  "**:data-[slot=slider-track]:h-[3px] **:data-[slot=slider-track]:rounded-full **:data-[slot=slider-track]:bg-[rgba(86,94,116,0.15)] **:data-[slot=slider-range]:rounded-full **:data-[slot=slider-range]:bg-brand-secondary-900 **:data-[slot=slider-thumb]:size-[18px] **:data-[slot=slider-thumb]:border-[1.6px] **:data-[slot=slider-thumb]:border-brand-secondary-900 **:data-[slot=slider-thumb]:bg-brand-secondary-100";

export function PropertyLoanCalculator({ propertyPrice }: { propertyPrice: number }) {
  const [price, setPrice] = useState(Math.round(propertyPrice));
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState<(typeof TENURE_OPTIONS)[number]>(20);

  const calc = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    const r = rate / 12 / 100;
    const n = tenure * 12;
    const emi = r === 0 ? loanAmount / n : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - loanAmount;
    const monthlyIncomeNeeded = emi / 0.4;
    return { downPayment, loanAmount, emi, total, interest, monthlyIncomeNeeded };
  }, [price, downPaymentPct, rate, tenure]);

  const principalPct = calc.loanAmount / calc.total;

  const handleDeferred = (action: string) => toast.info(`${action} isn't available yet — check back soon.`);

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-brand-secondary-400 pt-16 pb-8 px-6 sm:px-12">
      <div className="flex flex-col gap-2">
        <p className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-secondary-900">Plan your purchase</p>
        <h2 className="font-heading text-[28px] font-bold text-brand-primary-400">Home loan calculator</h2>
        <p className="font-body max-w-[480px] text-[14px] text-brand-primary-600/65">
          Estimate your monthly EMI, total interest payout and plan your budget before you make an offer.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Property Price</span>
              <span className="rounded-md border-[0.8px] border-[rgba(86,94,116,0.25)] bg-brand-secondary-100 px-3 py-1.5 font-heading text-[16px] font-bold text-brand-primary-600">
                {formatCr(price)}
              </span>
            </div>
            <Slider min={10_00_000} max={10_00_00_000} step={1_00_000} value={[price]} onValueChange={([v]) => setPrice(v)} className={sliderTrack} />
            <div className="flex justify-between font-body text-[14px] text-brand-secondary-700">
              <span>₹10 L</span>
              <span>₹10 Cr</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Down Payment</span>
              <div className="flex items-center gap-2">
                <span className="rounded-md border-[0.8px] border-[rgba(86,94,116,0.25)] bg-brand-secondary-100 px-3 py-1.5 font-heading text-[16px] font-bold text-brand-secondary-900">
                  {downPaymentPct}%
                </span>
                <span className="rounded-md border-[0.8px] border-[rgba(86,94,116,0.15)] bg-brand-secondary-100 px-3 py-1.5 font-body text-[16px] text-brand-primary-600/80">
                  {formatCr(calc.downPayment)}
                </span>
              </div>
            </div>
            <Slider min={5} max={80} step={1} value={[downPaymentPct]} onValueChange={([v]) => setDownPaymentPct(v)} className={sliderTrack} />
            <div className="flex justify-between font-body text-[14px] text-brand-secondary-700">
              <span>5%</span>
              <span>80%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Interest Rate (p.a.)</span>
              <span className="rounded-md border-[0.8px] border-[rgba(86,94,116,0.25)] bg-brand-secondary-100 px-3 py-1.5 font-heading text-[16px] font-bold text-brand-primary-600">
                {rate.toFixed(1)}%
              </span>
            </div>
            <Slider min={5} max={20} step={0.1} value={[rate]} onValueChange={([v]) => setRate(v)} className={sliderTrack} />
            <div className="flex justify-between font-body text-[14px] text-brand-secondary-700">
              <span>5%</span>
              <span>20%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Loan Tenure</span>
            <div className="flex flex-wrap gap-2">
              {TENURE_OPTIONS.map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setTenure(years)}
                  className={`rounded-md border-[0.8px] px-4 py-2 font-heading text-[16px] font-bold ${
                    tenure === years
                      ? "border-brand-primary-500 bg-brand-primary-400 text-brand-secondary-100"
                      : "border-[rgba(86,94,116,0.25)] bg-brand-secondary-100 text-brand-primary-600/80"
                  }`}
                >
                  {years}Y
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[10px] bg-[rgba(86,94,116,0.08)] px-5 py-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Loan Amount</span>
              <span className="font-heading text-[16px] font-bold text-brand-primary-600">{formatCr(calc.loanAmount)}</span>
            </div>
            <div className="h-full w-px bg-[rgba(86,94,116,0.15)]" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Tenure</span>
              <span className="font-heading text-[16px] font-bold text-brand-primary-600">{tenure} Years</span>
            </div>
            <div className="h-full w-px bg-[rgba(86,94,116,0.15)]" />
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Rate</span>
              <span className="font-heading text-[16px] font-bold text-brand-primary-600">{rate.toFixed(1)}% p.a.</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[340px]">
          <div className="rounded-[14px] bg-brand-primary-400 p-7">
            <p className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-secondary-100/65">Monthly EMI</p>
            <p className="font-heading text-[36px] font-bold text-brand-secondary-100">{formatCr(Math.round(calc.emi))}</p>
            <p className="font-body text-[12px] text-brand-secondary-100/55">
              for {tenure * 12} months @ {rate.toFixed(1)}% p.a.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-[14px] bg-brand-secondary-100 p-6">
            <p className="font-heading text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Repayment Breakdown</p>
            <div className="relative mx-auto">
              <LightDonut principalPct={principalPct} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-body text-[10px] uppercase tracking-[1px] text-brand-secondary-700">Total</span>
                <span className="font-heading text-[16px] font-bold text-brand-primary-600">{formatCr(calc.total)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-body text-[12px] text-brand-primary-600/80">
                  <span className="size-2.5 rounded-full bg-brand-green-400" /> Principal
                </span>
                <span className="font-heading text-[16px] font-bold text-brand-primary-600">{formatCr(calc.loanAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-body text-[12px] text-brand-primary-600/80">
                  <span className="size-2.5 rounded-full border-[0.8px] border-brand-secondary-700 bg-brand-secondary-500" /> Total Interest
                </span>
                <span className="font-heading text-[16px] font-bold text-brand-primary-600">{formatCr(calc.interest)}</span>
              </div>
              <div className="h-px bg-brand-secondary-700/30" />
              <div className="flex items-center justify-between">
                <span className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-400">Total Payable</span>
                <span className="font-heading text-[16px] font-bold text-brand-secondary-900">{formatCr(calc.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1 rounded-[10px] bg-brand-secondary-100 p-3.5">
              <p className="font-heading text-[10px] font-medium uppercase tracking-[1px] text-brand-primary-400">Interest Saved</p>
              <p className="font-body text-[12px] text-brand-primary-600/65">Increase down payment to reduce interest outgo</p>
            </div>
            <div className="flex flex-1 flex-col gap-1 rounded-[10px] bg-brand-secondary-100 p-3.5">
              <p className="font-heading text-[10px] font-medium uppercase tracking-[1px] text-brand-primary-400">Income Needed</p>
              <p className="font-body text-[12px] text-brand-primary-600/65">EMI should be ≤ 40% of income — approx {formatCr(calc.monthlyIncomeNeeded)}/mo</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleDeferred("Loan applications")}
              className="flex-1 rounded-lg bg-brand-primary-400 py-2.5 font-heading text-[16px] font-bold text-brand-secondary-100"
            >
              Apply for Loan
            </button>
            <button
              type="button"
              onClick={() => handleDeferred("Pre-approval")}
              className="flex-1 rounded-lg border-[0.8px] border-black px-4 py-2.5 font-heading text-[16px] font-bold text-brand-primary-400"
            >
              Get Pre-Approved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
