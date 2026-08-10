// features/auth/preferences/options.ts
// Shared value/label option lists for buyer-preference selections, reused
// by the signup wizard's dedicated preference screens (PropertyTypeCardGrid,
// InvestmentGoalStep) and the Account tab's compact chip-based editor.
// Wizard-only display fields (e.g. InvestmentGoalStep's card `eyebrow`)
// live here too, since the Account tab simply doesn't render them.

export type PropertyTypeOption = { value: string; label: string };

export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: "modernist_villas", label: "Modernist Villas" },
  { value: "luxury_penthouses", label: "Luxury Penthouses" },
  { value: "estates_mansions", label: "Estates & Mansions" },
  { value: "studio_lofts", label: "Studio Lofts" },
  { value: "serviced_apartments", label: "Serviced Apartments" },
  { value: "plots_land", label: "Plots & Land" },
  { value: "commercial_spaces", label: "Commercial Spaces" },
  { value: "farmhouses", label: "Farmhouses" },
];

export type InvestmentGoalOption = { value: string; eyebrow: string; label: string };

export const INVESTMENT_GOAL_OPTIONS: InvestmentGoalOption[] = [
  { value: "rent_to_ownership", eyebrow: "First Home", label: "Rent to Ownership" },
  { value: "long_term_investment", eyebrow: "Wealth Asset", label: "Long-term Investment" },
  { value: "joint_investment_projects", eyebrow: "Family Legacy", label: "Joint-investment Projects" },
  { value: "capital_appreciation_play", eyebrow: "Flip / Resale", label: "Capital Appreciation Play" },
  { value: "steady_yield_generation", eyebrow: "Rental Income", label: "Steady Yield Generation" },
  { value: "business_infrastructure", eyebrow: "Commercial / Office", label: "Business Infrastructure" },
];
