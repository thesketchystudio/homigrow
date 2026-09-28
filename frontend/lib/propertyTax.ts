// lib/propertyTax.ts
// Indicative ARV-based property tax model for the Property Tax
// Calculator tool (the design's own disclaimer: "indicative... actual
// liability is determined by your municipal corporation"). Every factor
// below was reverse-derived from the reference build (toolshomigrow.figma.site)
// by holding all other inputs fixed and varying one at a time, and each
// matches it exactly in that single-variable form. The one exception:
// combining a non-Bengaluru city with a non-Residential type in the
// reference build produces a result inconsistent with a clean
// city x type multiplicative model (verified — Delhi+Commercial=3.5x
// base and Delhi+Industrial=2.5x base, when 1.5x city x {2.5x,2.0x} type
// would multiply to 3.75x/3.0x) — most likely an internal inconsistency
// in the AI-generated reference tool itself, not a real formula worth
// reproducing. This uses the straightforward multiplicative combination
// instead, which is exact for every single-variable case.

export type PropertyTaxCity = "bengaluru" | "mumbai" | "delhi" | "hyderabad" | "chennai";
export type PropertyTaxType = "residential" | "commercial" | "industrial";
export type PropertyTaxOccupancy = "self" | "rented";

export const PROPERTY_TAX_CITIES: { id: PropertyTaxCity; label: string; rateMultiplier: number }[] = [
  { id: "bengaluru", label: "Bengaluru (BBMP)", rateMultiplier: 1.0 },
  { id: "mumbai", label: "Mumbai (BMC)", rateMultiplier: 1.25 },
  { id: "delhi", label: "Delhi (NDMC)", rateMultiplier: 1.5 },
  { id: "hyderabad", label: "Hyderabad (GHMC)", rateMultiplier: 0.75 },
  { id: "chennai", label: "Chennai (GCC)", rateMultiplier: 1.0 },
];

export const PROPERTY_TAX_TYPES: { id: PropertyTaxType; label: string; rateMultiplier: number }[] = [
  { id: "residential", label: "Residential", rateMultiplier: 1.0 },
  { id: "commercial", label: "Commercial", rateMultiplier: 2.5 },
  { id: "industrial", label: "Industrial", rateMultiplier: 2.0 },
];

export const PROPERTY_TAX_OCCUPANCIES: { id: PropertyTaxOccupancy; label: string; rateMultiplier: number }[] = [
  { id: "self", label: "Self-occupied", rateMultiplier: 1.0 },
  { id: "rented", label: "Rented / Tenanted", rateMultiplier: 1.1 },
];

// Rupees/sqft/year assumed rental value, flat across every city and
// property type (verified — the reference build's displayed ARV never
// changes when only city or type is varied).
const ARV_RATE_PER_SQFT_YEAR = 240;

// Base annual tax rate applied to ARV for a Bengaluru/Chennai residential
// self-occupied property with no age depreciation.
const BASE_TAX_RATE = 0.002;

const DEPRECIATION_PER_YEAR = 0.01;
const MAX_DEPRECIATION = 0.25;

export interface PropertyTaxResult {
  estimatedAnnualRentalValue: number;
  annualTax: number;
  halfYearlyInstalment: number;
}

export function calculatePropertyTax(params: {
  city: PropertyTaxCity;
  type: PropertyTaxType;
  occupancy: PropertyTaxOccupancy;
  builtUpAreaSqft: number;
  yearOfConstruction: number;
  currentYear?: number;
}): PropertyTaxResult {
  const { city, type, occupancy, builtUpAreaSqft, yearOfConstruction, currentYear = new Date().getFullYear() } = params;

  const estimatedAnnualRentalValue = builtUpAreaSqft * ARV_RATE_PER_SQFT_YEAR;

  const cityMultiplier = PROPERTY_TAX_CITIES.find((c) => c.id === city)!.rateMultiplier;
  const typeMultiplier = PROPERTY_TAX_TYPES.find((t) => t.id === type)!.rateMultiplier;
  const occupancyMultiplier = PROPERTY_TAX_OCCUPANCIES.find((o) => o.id === occupancy)!.rateMultiplier;

  const age = Math.max(0, currentYear - yearOfConstruction);
  const depreciationFactor = 1 - Math.min(MAX_DEPRECIATION, DEPRECIATION_PER_YEAR * age);

  const effectiveRate = BASE_TAX_RATE * cityMultiplier * typeMultiplier * occupancyMultiplier * depreciationFactor;
  const annualTax = estimatedAnnualRentalValue * effectiveRate;

  return { estimatedAnnualRentalValue, annualTax, halfYearlyInstalment: annualTax / 2 };
}
