// lib/finance.ts
// Pure loan-math functions shared by every EMI-based calculator in the
// app (homepage EMI section, property details loan calculator, and the
// AI Tools calculators) so the amortization formula has one source of
// truth instead of being copy-pasted per component. Implements
// docs/architecture/18_Decision_Framework_And_Hard_Logic.md §2.4,
// including the r=0 edge case (0% promotional loan schemes are a real
// input, not a validation reject) and deriving totals from the unrounded
// EMI rather than re-summing a rounded schedule.

export interface EmiResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
}

/**
 * Standard reducing-balance EMI. `principal` and `tenureYears` must be
 * positive; a non-positive principal or a down payment that meets or
 * exceeds the loan amount both collapse to the zero result rather than
 * throwing, since the calculators feed this from live sliders that can
 * transiently pass such values while being dragged.
 */
export function calculateEmi(principal: number, annualRatePct: number, tenureYears: number): EmiResult {
  const n = Math.round(tenureYears * 12);
  if (principal <= 0 || n <= 0) {
    return { emi: 0, totalPayment: 0, totalInterest: 0 };
  }
  const r = annualRatePct / 1200;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;
  return { emi, totalPayment, totalInterest };
}

export interface AmortizationMonth {
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Month-by-month principal/interest/balance breakdown. `monthLimit`
 * caps how many rows are returned (e.g. "first 12 months") without
 * changing the underlying EMI — the full tenure is still amortized
 * internally so the balance at row `monthLimit` is correct, only the
 * returned slice is capped.
 */
export function buildAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  tenureYears: number,
  monthLimit?: number,
): AmortizationMonth[] {
  const n = Math.round(tenureYears * 12);
  const { emi } = calculateEmi(principal, annualRatePct, tenureYears);
  if (emi <= 0) return [];
  const r = annualRatePct / 1200;
  const limit = Math.min(monthLimit ?? n, n);
  const rows: AmortizationMonth[] = [];
  let balance = principal;
  for (let month = 1; month <= limit; month++) {
    const interest = balance * r;
    const principalPaid = emi - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month, principal: principalPaid, interest, balance });
  }
  return rows;
}

/**
 * Inverse of calculateEmi: the loan principal a lender would approve
 * given a maximum affordable monthly EMI (used by the Home Loan
 * Eligibility tool's FOIR-based eligibility calc).
 */
export function principalForEmi(maxEmi: number, annualRatePct: number, tenureYears: number): number {
  const n = Math.round(tenureYears * 12);
  if (maxEmi <= 0 || n <= 0) return 0;
  const r = annualRatePct / 1200;
  if (r === 0) return maxEmi * n;
  const f = Math.pow(1 + r, n);
  return (maxEmi * (f - 1)) / (r * f);
}

// Flat stamp-duty + registration assumption for the Rent vs Buy
// calculator's buy-scenario outflow — a common India-wide ballpark
// (actual rates are state-specific, typically 5-7%); not user-adjustable
// since the reference design has no control for it.
const STAMP_DUTY_REGISTRATION_PCT = 7;

export interface RentVsBuyResult {
  downPayment: number;
  loanAmount: number;
  emi: number;
  stampDutyAndRegistration: number;
  totalOutflow: number;
  finalPropertyValue: number;
  /** totalOutflow - finalPropertyValue. Negative means buying nets a gain. */
  netCostBuy: number;
  totalRentPaid: number;
  /** totalRentPaid - netCostBuy. Positive means buying is the cheaper option. */
  saving: number;
}

/**
 * Compares the long-term cost of buying (loan repayment + down payment +
 * stamp duty/registration, net of the property's appreciated value) against
 * renting (monthly rent compounding at an annual growth rate) over the
 * loan's tenure.
 */
export function calculateRentVsBuy(params: {
  propertyValue: number;
  downPaymentPct: number;
  loanRatePct: number;
  loanTenureYears: number;
  appreciationPct: number;
  monthlyRent: number;
  rentGrowthPct: number;
}): RentVsBuyResult {
  const { propertyValue, downPaymentPct, loanRatePct, loanTenureYears, appreciationPct, monthlyRent, rentGrowthPct } = params;

  const downPayment = propertyValue * (downPaymentPct / 100);
  const loanAmount = propertyValue - downPayment;
  const { emi, totalPayment } = calculateEmi(loanAmount, loanRatePct, loanTenureYears);
  const stampDutyAndRegistration = propertyValue * (STAMP_DUTY_REGISTRATION_PCT / 100);
  const totalOutflow = totalPayment + downPayment + stampDutyAndRegistration;
  const finalPropertyValue = propertyValue * Math.pow(1 + appreciationPct / 100, loanTenureYears);
  const netCostBuy = totalOutflow - finalPropertyValue;

  const g = rentGrowthPct / 100;
  const totalRentPaid = g === 0 ? 12 * monthlyRent * loanTenureYears : 12 * monthlyRent * ((Math.pow(1 + g, loanTenureYears) - 1) / g);

  return { downPayment, loanAmount, emi, stampDutyAndRegistration, totalOutflow, finalPropertyValue, netCostBuy, totalRentPaid, saving: totalRentPaid - netCostBuy };
}

// Full Indian digit-grouped rupee amount (e.g. 3500000 -> "₹35,00,000"),
// matching the AI Tools calculators' result displays — unlike
// lib/utils.ts's formatINR, this never switches to L/Cr short-scale, since
// the Figma design and reference build both show the full grouped figure.
export function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
