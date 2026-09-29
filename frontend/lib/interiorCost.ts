// lib/interiorCost.ts
// Cost model for the Home Interior Cost Estimator tool. Most rooms cost
// `area (sqft) × the selected grade's rate/sqft`; Modular Kitchen is the
// one exception — its cost is a flat per-grade package price rather than
// area-based (verified against the reference build across all 4 grades:
// the ratio to rate isn't constant, so it isn't an area×rate formula).
// Professional fees (12%) and miscellaneous (8%) are added on top of the
// sum of included rooms.

export type FinishGrade = "economy" | "midrange" | "premium" | "ultra";

export const FINISH_GRADES: { id: FinishGrade; label: string; ratePerSqft: number }[] = [
  { id: "economy", label: "Economy", ratePerSqft: 750 },
  { id: "midrange", label: "Mid-range", ratePerSqft: 1500 },
  { id: "premium", label: "Premium", ratePerSqft: 3000 },
  { id: "ultra", label: "Ultra-luxury", ratePerSqft: 6500 },
];

const MODULAR_KITCHEN_COST: Record<FinishGrade, number> = {
  economy: 120000,
  midrange: 250000,
  premium: 600000,
  ultra: 1500000,
};

export interface RoomDef {
  id: string;
  label: string;
  /** Default sqft if area-based; undefined for the flat-fee kitchen. */
  defaultArea?: number;
  defaultChecked: boolean;
}

export const INTERIOR_ROOMS: RoomDef[] = [
  { id: "living_room", label: "Living Room", defaultArea: 300, defaultChecked: true },
  { id: "master_bedroom", label: "Master Bedroom", defaultArea: 200, defaultChecked: true },
  { id: "bedroom_2", label: "Bedroom 2", defaultArea: 150, defaultChecked: true },
  { id: "bedroom_3", label: "Bedroom 3", defaultArea: 130, defaultChecked: true },
  { id: "modular_kitchen", label: "Modular Kitchen", defaultChecked: true },
  { id: "bathrooms", label: "Bathrooms", defaultArea: 80, defaultChecked: true },
  { id: "dining_area", label: "Dining Area", defaultArea: 150, defaultChecked: false },
  { id: "foyer", label: "Foyer / Entrance", defaultArea: 80, defaultChecked: false },
  { id: "study", label: "Study / Home Office", defaultArea: 120, defaultChecked: false },
  { id: "balcony", label: "Balcony / Outdoor", defaultArea: 120, defaultChecked: false },
];

const PROFESSIONAL_FEES_PCT = 12;
const MISCELLANEOUS_PCT = 8;

export interface InteriorCostLine {
  id: string;
  label: string;
  cost: number;
}

export interface InteriorCostResult {
  lines: InteriorCostLine[];
  base: number;
  professionalFees: number;
  miscellaneous: number;
  total: number;
}

export function calculateInteriorCost(grade: FinishGrade, areas: Record<string, number>, checked: Record<string, boolean>): InteriorCostResult {
  const rate = FINISH_GRADES.find((g) => g.id === grade)!.ratePerSqft;

  const lines: InteriorCostLine[] = INTERIOR_ROOMS.filter((room) => checked[room.id]).map((room) => ({
    id: room.id,
    label: room.label,
    cost: room.id === "modular_kitchen" ? MODULAR_KITCHEN_COST[grade] : (areas[room.id] ?? room.defaultArea ?? 0) * rate,
  }));

  const base = lines.reduce((sum, line) => sum + line.cost, 0);
  const professionalFees = base * (PROFESSIONAL_FEES_PCT / 100);
  const miscellaneous = base * (MISCELLANEOUS_PCT / 100);

  return { lines, base, professionalFees, miscellaneous, total: base + professionalFees + miscellaneous };
}
