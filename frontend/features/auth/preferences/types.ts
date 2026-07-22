// features/auth/preferences/types.ts
// Shape of the buyer-preference wizard's answers (Figma: "Client - Sign
// up" Phase B, nodes 418:994-457:1317). Stored nested under
// preferences.buyer_preferences on save, not as flat top-level keys, to
// avoid colliding with the Account tab's existing budget_range/
// property_type/preferred_location/buyer_intent keys in the same JSONB
// blob. All fields optional and unvalidated on the backend, matching
// that same existing precedent.

export type BuyerPreferences = {
  budget_min?: number;
  budget_max?: number;
  preferred_cities?: string[];
  property_types?: string[];
  bedroom_preference?: string[];
  investment_goals?: string[];
  buy_timeline?: string;
  exit_strategies?: string[];
  target_hold_period?: string;
  target_roi?: string;
  risk_tolerance?: string;
  notify_market_timing?: boolean;
  development_stage?: string[];
  amenities?: string[];
  current_situation?: string[];
};
