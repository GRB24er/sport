// ═══════════════════════════════════════════
// VIRTUALBET CONSTANTS
// ═══════════════════════════════════════════

export const GHS_TO_USD = 0.077;
export const SIGNUP_FEE_GHS = 50;
export const REFERRAL_BONUS_GHS = 10;

export const fmtGHS = (v) => `GH₵${Number(v).toLocaleString()}`;
export const fmtUSD = (v) => `$${(Number(v) * GHS_TO_USD).toFixed(2)}`;
export const fmtBoth = (v) => `GH₵${Number(v).toLocaleString()} (≈ $${(Number(v) * GHS_TO_USD).toFixed(2)})`;

// ── SUBSCRIPTION PACKAGES ──
// Gold     → 1 prediction  → locked → must upgrade to Platinum
// Platinum → 2 predictions → locked → must upgrade to Diamond
// Diamond  → 4 predictions → locked → must renew Diamond
export const PACKAGES = [
  {
    id: "gold",
    name: "Gold",
    odds: "3–5 Odds",
    tag: "Starter",
    priceGHS: 200,
    color: "#D4AF37",
    icon: "🥇",
    maxPredictions: 1,
    nextPackage: "platinum",
    features: ["1 AI Prediction", "3–5 Odds Range", "Basic Support", "SportyBet Integration"],
  },
  {
    id: "platinum",
    name: "Platinum",
    odds: "5–15 Odds",
    tag: "Pro",
    priceGHS: 500,
    color: "#94A7BD",
    icon: "🥈",
    maxPredictions: 2,
    nextPackage: "diamond",
    features: ["2 AI Predictions", "5–15 Odds Range", "Priority Support", "SportyBet Integration", "Weekly Tips"],
  },
  {
    id: "diamond",
    name: "Diamond",
    odds: "15–50 Odds",
    tag: "Elite",
    priceGHS: 1000,
    color: "#7DD3E8",
    icon: "💎",
    maxPredictions: 4,
    nextPackage: null,
    features: ["4 AI Predictions", "15–50 Odds Range", "24/7 Premium Support", "SportyBet Integration", "Daily Accumulators", "Exclusive Mega Odds"],
  },
];

// Virtual Teams for AI Predictions
export const VIRTUAL_TEAMS = [
  "FC Barcelona VR", "Manchester City VR", "Bayern Munich VR", "PSG Virtual",
  "Real Madrid VR", "Liverpool VR", "Juventus VR", "AC Milan VR",
  "Chelsea VR", "Arsenal VR", "Dortmund VR", "Inter Milan VR",
  "Atletico VR", "Napoli VR", "Ajax VR", "Porto VR",
];

// Prediction Markets
export const PREDICTION_MARKETS = [
  { name: "Match Result", options: ["Home Win", "Draw", "Away Win"] },
  { name: "Over/Under 2.5", options: ["Over 2.5", "Under 2.5"] },
  { name: "Both Teams Score", options: ["Yes", "No"] },
  { name: "Correct Score", options: ["1-0", "2-1", "2-0", "1-1", "0-0", "3-1", "2-2", "0-1", "1-2"] },
  { name: "First Half Result", options: ["Home", "Draw", "Away"] },
  { name: "Total Goals", options: ["0-1", "2-3", "4-5", "6+"] },
  { name: "HT/FT", options: ["Home/Home", "Draw/Home", "Home/Draw", "Draw/Draw", "Away/Away"] },
];

export const USER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};
