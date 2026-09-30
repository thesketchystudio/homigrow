// features/ai-tools/AreaUnitConverterTool.tsx
// Area Unit Converter tool screen (Figma node 737:2470/2471). Pure unit
// conversion (lib/areaUnits.ts) across the 12 units Indian real estate
// listings use, including regional units like Guntha, Bigha, Marla,
// Kanal, Ground and Ankanam.

"use client";

import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREA_UNITS, convertArea } from "@/lib/areaUnits";

import { ToolPageShell } from "./ToolPageShell";

function formatValue(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 6, minimumFractionDigits: 0 });
}

export function AreaUnitConverterTool() {
  const [value, setValue] = useState(1000);
  const [fromId, setFromId] = useState("sqft");
  const [toId, setToId] = useState("sqm");

  const fromUnit = AREA_UNITS.find((u) => u.id === fromId)!;
  const toUnit = AREA_UNITS.find((u) => u.id === toId)!;
  const toValue = useMemo(() => convertArea(value, fromId, toId), [value, fromId, toId]);
  const others = AREA_UNITS.filter((u) => u.id !== fromId);

  return (
    <ToolPageShell slug="area-unit-converter" title="Area Unit Converter">
      <div className="flex flex-col gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:p-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">From</span>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger className="h-11.5 w-full rounded-lg border-brand-secondary-500 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA_UNITS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value) || 0)}
              className="mt-1 rounded-lg border border-brand-secondary-500 px-4 py-3 font-heading text-[14px] font-bold text-brand-primary-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-[14px] font-medium text-brand-primary-500">To</span>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger className="h-11.5 w-full rounded-lg border-brand-secondary-500 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA_UNITS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-1 flex items-center justify-between rounded-lg bg-brand-primary-800 px-4 py-3">
              <span className="font-heading text-[18px] font-bold text-brand-secondary-100">{formatValue(toValue)}</span>
              <span className="font-body text-[12px] text-brand-secondary-100/50">{toUnit.label}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading text-[14px] font-bold text-brand-primary-500">
            {value.toLocaleString("en-IN")} {fromUnit.label} equals…
          </p>
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-brand-secondary-500 sm:grid-cols-2">
            {others.map((unit, i) => (
              <div
                key={unit.id}
                className={`flex items-center justify-between border-b border-brand-secondary-500 px-4 py-3 ${
                  i % 2 === 0 ? "bg-brand-secondary-100" : "bg-brand-secondary-400"
                }`}
              >
                <span className="font-body text-[12px] text-brand-primary-100">{unit.label}</span>
                <span className="font-heading text-[12px] font-bold text-brand-primary-500">{formatValue(convertArea(value, fromId, unit.id))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
