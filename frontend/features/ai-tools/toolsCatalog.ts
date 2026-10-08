// features/ai-tools/toolsCatalog.ts
// Single source of truth for the AI Tools: hub cards and each tool page's
// "Explore more tools" row read from here. `related` lists the three most
// relevant other tools in left-to-right display order.

import { LayoutGrid, MapPin, Scale, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export interface ToolCard {
  slug: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  related: [string, string, string];
}

export const TOOLS: ToolCard[] = [
  {
    slug: "loan-calculator",
    title: "Loan Calculator",
    category: "Finance & Yield",
    description:
      "Calculate total loan costs including principal, interest, and fees. Compare loan scenarios side-by-side to choose the best financing option for your property.",
    icon: TrendingUp,
    related: ["emi-calculator", "home-loan-eligibility", "rent-vs-buy-calculator"],
  },
  {
    slug: "home-loan-eligibility",
    title: "Home Loan Eligibility",
    category: "Finance & Yield",
    description:
      "Estimate the maximum home loan amount you qualify for based on income, existing obligations, and lender norms across major Indian banks.",
    icon: ShieldCheck,
    related: ["emi-calculator", "loan-calculator", "rent-vs-buy-calculator"],
  },
  {
    slug: "emi-calculator",
    title: "EMI Calculator",
    category: "Finance & Yield",
    description:
      "Break down your monthly EMI into principal and interest components with an amortisation schedule across the full loan tenure.",
    icon: Sparkles,
    related: ["loan-calculator", "home-loan-eligibility", "rent-vs-buy-calculator"],
  },
  {
    slug: "property-tax-calculator",
    title: "Property Tax Calculator",
    category: "Due Diligence",
    description:
      "Compute annual municipal property tax liability for residential and commercial properties across Bengaluru, Mumbai, and Delhi NCR.",
    icon: Scale,
    related: ["rent-vs-buy-calculator", "loan-calculator", "area-unit-converter"],
  },
  {
    slug: "area-unit-converter",
    title: "Area Unit Converter",
    category: "Measurement",
    description: "Convert between sq ft, sq m, sq yard, acres, cents, guntas, and more. Handles all regional Indian land measurement units accurately.",
    icon: LayoutGrid,
    related: ["property-tax-calculator", "interior-cost-estimator", "rent-vs-buy-calculator"],
  },
  {
    slug: "rent-vs-buy-calculator",
    title: "Rent vs Buy Calculator",
    category: "Finance & Yield",
    description:
      "Model the long-term financial outcome of renting versus buying, accounting for appreciation, tax benefits, opportunity cost, and maintenance.",
    icon: MapPin,
    related: ["emi-calculator", "loan-calculator", "property-tax-calculator"],
  },
  {
    slug: "interior-cost-estimator",
    title: "Home Interior Cost Estimator",
    category: "Home Improvement",
    description: "Estimate interior fit-out budgets by room, material grade, and finish level. Get itemised breakdowns for modular kitchens, flooring, and more.",
    icon: ShieldCheck,
    related: ["area-unit-converter", "rent-vs-buy-calculator", "loan-calculator"],
  },
];

export function getTool(slug: string): ToolCard | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
