// lib/utils.ts
// Merges Tailwind classes safely, resolving conflicting utility classes
// in favor of the last one applied. Used by every component in
// components/ui.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
