// features/auth/preferences/options.ts
// Shared value/label option lists for every buyer-preference field,
// reused by both the signup wizard's 6 Phase B step screens and the
// Profile & Settings Preferences tab (view-mode chip labels + edit-mode
// controls) — one source of truth instead of each surface defining its
// own copy.

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

export type BedroomOption = { value: string; label: string };

export const BEDROOM_OPTIONS: BedroomOption[] = [
  { value: "studio", label: "Studio" },
  { value: "1_bhk", label: "1 BHK" },
  { value: "1_rk", label: "1 RK" },
  { value: "2_bhk", label: "2 BHK" },
  { value: "3_bhk", label: "3 BHK" },
  { value: "4_bhk", label: "4 BHK" },
  { value: "5_plus_bhk", label: "5+ BHK" },
  { value: "villa_entire_floor", label: "Villa / Entire Floor" },
];

export type BuyTimelineOption = { value: string; label: string; sublabel: string };

export const BUY_TIMELINE_OPTIONS: BuyTimelineOption[] = [
  { value: "immediately", label: "Immediately", sublabel: "Within 3 months" },
  { value: "6_months", label: "6 Months", sublabel: "Mid-term search" },
  { value: "1_year", label: "~1 Year", sublabel: "Planned acquisition" },
  { value: "3_plus_years", label: "3+ Years", sublabel: "Long-horizon planning" },
];

export type ExitStrategyOption = { value: string; label: string; sublabel: string };

export const EXIT_STRATEGY_OPTIONS: ExitStrategyOption[] = [
  { value: "hold_and_appreciate", label: "Hold & Appreciate", sublabel: "Ride capital growth long-term" },
  { value: "rental_yield_exit", label: "Rental Yield Exit", sublabel: "Optimise recurring income, then sell" },
  { value: "quick_flip", label: "Quick Flip", sublabel: "Buy → renovate → resell within 2 yrs" },
  { value: "portfolio_rebalancing", label: "Portfolio Rebalancing", sublabel: "Exit one asset to fund the next" },
  { value: "nri_repatriation", label: "NRI Repatriation", sublabel: "Repatriate funds to home currency" },
  { value: "inheritance_estate", label: "Inheritance / Estate", sublabel: "Transfer wealth to next generation" },
];

export type HoldPeriodOption = { value: string; label: string; sublabel: string };

export const HOLD_PERIOD_OPTIONS: HoldPeriodOption[] = [
  { value: "under_2_years", label: "< 2 Years", sublabel: "Short-term flip" },
  { value: "2_to_5_years", label: "2 – 5 Years", sublabel: "Medium hold" },
  { value: "5_to_10_years", label: "5 – 10 Years", sublabel: "Growth horizon" },
  { value: "10_plus_years", label: "10+ Years", sublabel: "Generational hold" },
];

export type RoiOption = { value: string; label: string };

export const ROI_OPTIONS: RoiOption[] = [
  { value: "under_10", label: "< 10% p.a." },
  { value: "10_to_20", label: "10 – 20% p.a." },
  { value: "20_to_30", label: "20 – 30% p.a." },
  { value: "30_plus", label: "30%+ p.a." },
];

export type RiskToleranceOption = { value: string; label: string; sublabel: string };

export const RISK_TOLERANCE_OPTIONS: RiskToleranceOption[] = [
  { value: "conservative", label: "Conservative", sublabel: "Ready-to-move, tier-1 only" },
  { value: "moderate", label: "Moderate", sublabel: "Mix of ready & under-construction" },
  { value: "aggressive", label: "Aggressive", sublabel: "Pre-launch & emerging micro-markets" },
];

export type DevelopmentStageOption = { value: string; label: string; sublabel: string };

export const DEVELOPMENT_STAGE_OPTIONS: DevelopmentStageOption[] = [
  { value: "ready_to_move", label: "Prioritize Ready-to-Move", sublabel: "High Maintenance Score" },
  { value: "under_construction", label: "Prioritize Under Construction", sublabel: "Growth Potential" },
  { value: "pre_launch", label: "Include Pre-Launch Opportunities", sublabel: "Early-Bird Pricing" },
];

export type AmenityOption = { value: string; label: string };

export const AMENITY_OPTIONS: AmenityOption[] = [
  { value: "swimming_pool", label: "Swimming Pool" },
  { value: "24_7_security", label: "24/7 Security" },
  { value: "gymnasium", label: "Gymnasium" },
  { value: "clubhouse", label: "Clubhouse" },
  { value: "underground_parking", label: "Underground Parking" },
  { value: "ev_charging", label: "EV Charging" },
  { value: "concierge_service", label: "Concierge Service" },
  { value: "green_spaces_parks", label: "Green Spaces / Parks" },
  { value: "school_proximity", label: "School Proximity" },
  { value: "hospital_access", label: "Hospital Access" },
  { value: "metro_connectivity", label: "Metro Connectivity" },
  { value: "smart_home", label: "Smart Home" },
];

export type CurrentSituationOption = { value: string; label: string; sublabel: string };

export const CURRENT_SITUATION_OPTIONS: CurrentSituationOption[] = [
  { value: "currently_renting", label: "I am currently renting", sublabel: "Enable EMI vs. Rent comparison" },
  { value: "own_property_wants_management", label: "I own property & want management", sublabel: "Property management services" },
  { value: "requires_nri_management", label: "I require NRI Property Management", sublabel: "Remote management & digital collection" },
  { value: "first_time_buyer", label: "First-time buyer, no existing property", sublabel: "Full buyer-journey guidance" },
];
