import { VIRTUAL_TEAMS, PREDICTION_MARKETS, PACKAGES } from "./constants";

// Generate referral code from phone
export function generateReferralCode(phone) {
  const suffix = phone.slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VG-${suffix}-${random}`;
}

// Generate SportyBet ID from phone
export function generateSportyBetId(phone) {
  return `SB-${phone}`;
}

// Time ago formatter
export function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// AI Prediction Generator
// In production, replace this with actual OpenAI Vision API call
export function generateAIPrediction(imageBase64 = null) {
  const homeIdx = Math.floor(Math.random() * VIRTUAL_TEAMS.length);
  let awayIdx = Math.floor(Math.random() * VIRTUAL_TEAMS.length);
  while (awayIdx === homeIdx) {
    awayIdx = Math.floor(Math.random() * VIRTUAL_TEAMS.length);
  }

  const homeTeam = VIRTUAL_TEAMS[homeIdx];
  const awayTeam = VIRTUAL_TEAMS[awayIdx];
  const predictions = [];

  PREDICTION_MARKETS.forEach((market) => {
    const pick = market.options[Math.floor(Math.random() * market.options.length)];
    const confidence = Math.floor(Math.random() * 35) + 60;
    const odd = parseFloat((Math.random() * 8 + 1.1).toFixed(2));

    predictions.push({
      market: market.name,
      pick,
      confidence,
      odd,
    });
  });

  const totalOdd = parseFloat(
    predictions.slice(0, 4).reduce((acc, p) => acc * p.odd, 1).toFixed(2)
  );

  const overallConfidence = Math.floor(Math.random() * 20) + 72;

  const analysis = `Based on AI analysis of the SportyBet Instant Football match, ${homeTeam} shows strong attacking metrics with consistent virtual form. ${awayTeam} has shown defensive vulnerabilities in recent virtual fixtures. Historical data suggests a high-scoring match with ${homeTeam} likely to dominate possession. The over 2.5 goals market is highly favored based on both teams' scoring patterns.`;

  return {
    type: "ai",
    homeTeam,
    awayTeam,
    match: `${homeTeam} vs ${awayTeam}`,
    predictions,
    totalOdd,
    confidence: overallConfidence,
    analysis,
    status: "delivered",
  };
}

// Validate phone number (Ghana format)
export function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 && cleaned.startsWith("0");
}

// Get package by ID
export function getPackageById(packageId) {
  return PACKAGES.find((p) => p.id === packageId);
}

// Sanitize user for client (remove password)
export function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

// Check if user can make predictions today
export function canMakePrediction(user, todayCount, maxPredictions) {
  if (user.status !== "approved") return false;
  if (maxPredictions === 999) return true; // Diamond = unlimited
  return todayCount < maxPredictions;
}
