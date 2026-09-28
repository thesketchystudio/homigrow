// features/ai-tools/InteriorCostEstimatorTool.tsx
// Home Interior Cost Estimator tool screen (Figma node 737:3534/3535).
// Uses lib/interiorCost.ts's per-room cost model.

"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { calculateInteriorCost, FINISH_GRADES, INTERIOR_ROOMS, type FinishGrade } from "@/lib/interiorCost";
import { formatRupees } from "@/lib/finance";

import { ToolPageShell } from "./ToolPageShell";

export function InteriorCostEstimatorTool() {
  const [grade, setGrade] = useState<FinishGrade>("midrange");
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INTERIOR_ROOMS.map((r) => [r.id, r.defaultChecked])),
  );
  const [areas, setAreas] = useState<Record<string, number>>(() =>
    Object.fromEntries(INTERIOR_ROOMS.filter((r) => r.defaultArea !== undefined).map((r) => [r.id, r.defaultArea!])),
  );

  const result = useMemo(() => calculateInteriorCost(grade, areas, checked), [grade, areas, checked]);

  const toggleRoom = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <ToolPageShell category="3D Curation" title="Home Interior Cost Estimator">
      <div className="flex flex-col gap-8 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-3">
          <span className="font-heading text-[14px] font-bold text-brand-primary-500">Finish Grade</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FINISH_GRADES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGrade(g.id)}
                className={`flex flex-col items-center rounded-xl border px-4 py-3 ${
                  grade === g.id ? "border-brand-primary-800 bg-brand-primary-800" : "border-brand-secondary-500 bg-brand-secondary-400"
                }`}
              >
                <span className={`font-heading text-[14px] font-bold ${grade === g.id ? "text-brand-secondary-100" : "text-brand-primary-500"}`}>
                  {g.label}
                </span>
                <span className={`font-body text-[12px] ${grade === g.id ? "text-brand-secondary-100/60" : "text-brand-primary-100"}`}>
                  ₹{g.ratePerSqft.toLocaleString("en-IN")}/sqft
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="font-heading text-[14px] font-bold text-brand-primary-500">Rooms to Include</span>
            <div className="flex flex-col gap-2">
              {INTERIOR_ROOMS.map((room) => {
                const isChecked = checked[room.id];
                return (
                  <div
                    key={room.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      isChecked ? "border-brand-primary-600 bg-brand-secondary-400" : "border-brand-secondary-500 bg-white"
                    }`}
                  >
                    <button type="button" onClick={() => toggleRoom(room.id)} className="flex items-center gap-3">
                      <span
                        className={`flex size-4 items-center justify-center rounded ${
                          isChecked ? "border border-brand-primary-600 bg-brand-primary-600" : "border border-brand-secondary-500"
                        }`}
                      >
                        {isChecked && <Check className="size-2.5 text-brand-secondary-100" strokeWidth={3} />}
                      </span>
                      <span className="font-body text-[14px] text-brand-primary-500">{room.label}</span>
                    </button>
                    {isChecked && room.defaultArea !== undefined && (
                      <label className="flex items-center gap-1">
                        <input
                          type="number"
                          value={areas[room.id] ?? room.defaultArea}
                          onChange={(e) => setAreas((prev) => ({ ...prev, [room.id]: Number(e.target.value) || 0 }))}
                          className="w-16 rounded border border-brand-secondary-500 px-2 py-1 text-right font-heading text-[12px] font-bold text-brand-primary-500"
                        />
                        <span className="font-body text-[12px] text-brand-primary-100">sqft</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-heading text-[14px] font-bold text-brand-primary-500">Cost Breakdown</span>
            <div className="overflow-hidden rounded-xl border border-brand-secondary-500">
              {result.lines.map((line, i) => (
                <div key={line.id} className={`flex items-center justify-between border-b border-brand-secondary-500 px-4 py-3 ${i % 2 === 0 ? "bg-brand-secondary-100" : "bg-brand-secondary-400"}`}>
                  <span className="font-body text-[14px] text-brand-primary-600/80">{line.label}</span>
                  <span className="font-heading text-[14px] font-bold text-brand-primary-500">{formatRupees(line.cost)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-b border-brand-secondary-500 bg-brand-secondary-100 px-4 py-3">
                <span className="font-body text-[14px] text-brand-primary-600/80">Professional Fees (12%)</span>
                <span className="font-heading text-[14px] font-bold text-brand-primary-500">{formatRupees(result.professionalFees)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-brand-secondary-500 bg-brand-secondary-400 px-4 py-3">
                <span className="font-body text-[14px] text-brand-primary-600/80">Miscellaneous (8%)</span>
                <span className="font-heading text-[14px] font-bold text-brand-primary-500">{formatRupees(result.miscellaneous)}</span>
              </div>
              <div className="flex items-center justify-between bg-brand-primary-800 px-4 py-4">
                <span className="font-body text-[14px] text-brand-secondary-100/70">Total Estimated Cost</span>
                <span className="font-heading text-[18px] font-bold text-brand-secondary-100">{formatRupees(result.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
