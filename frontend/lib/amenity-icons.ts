// lib/amenity-icons.ts
// Maps a free-form amenity label (Property.amenities is a plain string
// list with no fixed vocabulary) to a lucide icon by keyword, falling back
// to a generic check mark so an unrecognised amenity still renders a tile.

import {
  ArrowUpDown,
  Baby,
  Car,
  CheckCircle2,
  CookingPot,
  Dog,
  Drama,
  Droplets,
  Dumbbell,
  Flame,
  Fuel,
  Landmark,
  Lightbulb,
  Lock,
  Sun,
  TreePine,
  TrainFront,
  Trees,
  Tv,
  Waves,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Order matters: the first matching pattern wins, so more specific labels
// (e.g. "ev charging") sit above broader ones (e.g. "parking").
const AMENITY_ICON_RULES: { pattern: RegExp; icon: LucideIcon }[] = [
  { pattern: /pool|swim/i, icon: Waves },
  { pattern: /cinema|theat|drama/i, icon: Drama },
  { pattern: /\btv\b|television/i, icon: Tv },
  { pattern: /smart|automation|ecosystem/i, icon: Lightbulb },
  { pattern: /zen|garden|landscap/i, icon: TreePine },
  { pattern: /park(?!ing)|play|green|lawn/i, icon: Trees },
  { pattern: /metro|station|train/i, icon: TrainFront },
  { pattern: /kitchen|chef/i, icon: CookingPot },
  { pattern: /biometric|security|cctv|guard|lock/i, icon: Lock },
  { pattern: /gym|fitness|studio|yoga/i, icon: Dumbbell },
  { pattern: /\bev\b|charging|electric vehicle/i, icon: Fuel },
  { pattern: /lift|elevator/i, icon: ArrowUpDown },
  { pattern: /wi-?fi|internet|broadband/i, icon: Wifi },
  { pattern: /parking|garage/i, icon: Car },
  { pattern: /power|backup|generator/i, icon: Zap },
  { pattern: /club|community|hall/i, icon: Landmark },
  { pattern: /child|kids|creche/i, icon: Baby },
  { pattern: /pet/i, icon: Dog },
  { pattern: /solar|terrace|rooftop/i, icon: Sun },
  { pattern: /water|rain/i, icon: Droplets },
  { pattern: /fire/i, icon: Flame },
  { pattern: /air|ventilat|\bac\b|conditioning/i, icon: Wind },
];

export function amenityIcon(label: string): LucideIcon {
  return AMENITY_ICON_RULES.find((rule) => rule.pattern.test(label))?.icon ?? CheckCircle2;
}
