// lib/priceSummary.ts
// Pure arithmetic behind the Post Property wizard's Price Summary card.
// Each percentage-based charge is rounded to whole rupees before it is
// summed, so the lines the broker sees always add up exactly to the total.

export type PriceSummaryInput = {
  isRent: boolean;
  price: number;
  tokenAmount?: number;
  deposit?: number;
  maintenanceMonthly?: number;
  stampDutyPercent?: number;
  registrationFeePercent?: number;
  brokerageIncluded: boolean;
  brokeragePercent?: number;
};

export type PriceSummary = {
  basePrice: number;
  stampDuty: number;
  registrationFee: number;
  // Commission amount; only part of `total` when it is not already inside the listing price.
  brokerage: number;
  brokerageAddedToTotal: boolean;
  deposit: number;
  // One-time amount payable by the buyer/tenant. Token is an advance against
  // the base price and maintenance recurs monthly, so neither is included.
  total: number;
};

function percentOf(amount: number, percent: number | undefined): number {
  return Math.round((amount * (percent ?? 0)) / 100);
}

export function computePriceSummary(input: PriceSummaryInput): PriceSummary {
  const basePrice = input.price || 0;
  // Stamp duty and registration are transfer charges on a sale; a rental has no such purchase.
  const stampDuty = input.isRent ? 0 : percentOf(basePrice, input.stampDutyPercent);
  const registrationFee = input.isRent ? 0 : percentOf(basePrice, input.registrationFeePercent);
  const brokerage = percentOf(basePrice, input.brokeragePercent);
  const brokerageAddedToTotal = !input.brokerageIncluded && brokerage > 0;
  const deposit = input.isRent ? Math.round(input.deposit ?? 0) : 0;

  const total = basePrice + stampDuty + registrationFee + deposit + (brokerageAddedToTotal ? brokerage : 0);
  return { basePrice, stampDuty, registrationFee, brokerage, brokerageAddedToTotal, deposit, total };
}
