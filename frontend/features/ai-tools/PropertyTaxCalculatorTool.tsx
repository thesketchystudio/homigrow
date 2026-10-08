// features/ai-tools/PropertyTaxCalculatorTool.tsx
// Property Tax Calculator tool screen (Figma node 736:2245/2246). Uses
// lib/propertyTax.ts's indicative ARV-based model — see that file for
// which factors are exact vs. a defensible approximation.

"use client";

import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupees } from "@/lib/finance";
import {
  calculatePropertyTax,
  PROPERTY_TAX_CITIES,
  PROPERTY_TAX_OCCUPANCIES,
  PROPERTY_TAX_TYPES,
  type PropertyTaxCity,
  type PropertyTaxOccupancy,
  type PropertyTaxType,
} from "@/lib/propertyTax";

import { ResultCard } from "./ResultCard";
import { ToolPageShell } from "./ToolPageShell";

export function PropertyTaxCalculatorTool() {
  const [city, setCity] = useState<PropertyTaxCity>("bengaluru");
  const [type, setType] = useState<PropertyTaxType>("residential");
  const [occupancy, setOccupancy] = useState<PropertyTaxOccupancy>("self");
  const [area, setArea] = useState(1200);
  const [yearBuilt, setYearBuilt] = useState(2010);

  const result = useMemo(
    () => calculatePropertyTax({ city, type, occupancy, builtUpAreaSqft: area, yearOfConstruction: yearBuilt }),
    [city, type, occupancy, area, yearBuilt],
  );

  return (
    <ToolPageShell slug="property-tax-calculator" title="Property Tax Calculator">
      <div className="grid grid-cols-1 gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:grid-cols-2 sm:p-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">City / Municipal Authority</span>
            <Select value={city} onValueChange={(v) => setCity(v as PropertyTaxCity)}>
              <SelectTrigger className="h-11.5 w-full rounded-lg border-brand-secondary-500 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TAX_CITIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">Property Type</span>
            <Select value={type} onValueChange={(v) => setType(v as PropertyTaxType)}>
              <SelectTrigger className="h-11.5 w-full rounded-lg border-brand-secondary-500 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TAX_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">Occupancy</span>
            <Select value={occupancy} onValueChange={(v) => setOccupancy(v as PropertyTaxOccupancy)}>
              <SelectTrigger className="h-11.5 w-full rounded-lg border-brand-secondary-500 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TAX_OCCUPANCIES.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">Built-up Area (sq ft)</span>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(Number(e.target.value) || 0)}
              className="rounded-lg border border-brand-secondary-500 px-4 py-3 font-body text-[14px] text-brand-primary-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">Year of Construction</span>
            <input
              type="number"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(Number(e.target.value) || 0)}
              className="rounded-lg border border-brand-secondary-500 px-4 py-3 font-body text-[14px] text-brand-primary-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ResultCard label="Annual Tax Payable" value={formatRupees(result.annualTax)} accent />
          <ResultCard label="Half-yearly Instalment" value={formatRupees(result.halfYearlyInstalment)} />
          <ResultCard label="Estimated Annual Rental Value" value={formatRupees(result.estimatedAnnualRentalValue)} />
        </div>
      </div>
    </ToolPageShell>
  );
}
