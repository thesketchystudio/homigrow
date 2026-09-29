// lib/areaUnits.ts
// Land-area conversion factors for the Area Unit Converter tool. Each
// factor is the number of square feet in one unit (the standard,
// widely-published Indian land-measurement definitions — e.g. 1 acre =
// 43,560 sq ft, 1 Marla (Punjab) = 272.25 sq ft, 1 Ankanam = 72 sq ft —
// not figures specific to this app). Regional units (Bigha, Marla, Kanal,
// Ground, Ankanam, Guntha) vary by state in informal use; these use each
// unit's single most commonly cited standard value.

export interface AreaUnit {
  id: string;
  label: string;
  sqFtPerUnit: number;
}

export const AREA_UNITS: AreaUnit[] = [
  { id: "sqft", label: "Square Feet (sq ft)", sqFtPerUnit: 1 },
  { id: "sqm", label: "Square Metres (sq m)", sqFtPerUnit: 1 / 0.09290304 },
  { id: "sqyd", label: "Square Yards (sq yd)", sqFtPerUnit: 9 },
  { id: "acre", label: "Acres", sqFtPerUnit: 43560 },
  { id: "hectare", label: "Hectares", sqFtPerUnit: 10000 / 0.09290304 },
  { id: "cent", label: "Cents", sqFtPerUnit: 435.6 },
  { id: "guntha", label: "Guntas (Guntha)", sqFtPerUnit: 1089 },
  { id: "bigha_up", label: "Bigha (Uttar Pradesh)", sqFtPerUnit: 27000 },
  { id: "marla", label: "Marla (Punjab)", sqFtPerUnit: 272.25 },
  { id: "kanal", label: "Kanal", sqFtPerUnit: 5445 },
  { id: "ground", label: "Ground (Tamil Nadu)", sqFtPerUnit: 2400 },
  { id: "ankanam", label: "Ankanam (Andhra)", sqFtPerUnit: 72 },
];

export function convertArea(value: number, fromId: string, toId: string): number {
  const from = AREA_UNITS.find((u) => u.id === fromId);
  const to = AREA_UNITS.find((u) => u.id === toId);
  if (!from || !to) return 0;
  return (value * from.sqFtPerUnit) / to.sqFtPerUnit;
}
