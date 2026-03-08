import { VIRTUAL_TEAMS, PREDICTION_MARKETS, PACKAGES } from "./constants";

export function generateReferralCode(phone) {
  const suffix = phone.slice(-4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VG-${suffix}-${rand}`;
}

export function generateSportyBetId(phone) {
  return `SB-${phone}`;
}

export function getPackageById(id) {
  return PACKAGES.find((p) => p.id === id);
}

// Check if user has exceeded their subscription prediction limit
export function isSubscriptionLocked(user) {
  const pkg = getPackageById(user.package);
  if (!pkg) return true;
  return user.predictionsUsed >= pkg.maxPredictions;
}

// Get next upgrade package
export function getNextPackage(currentPkgId) {
  const pkg = getPackageById(currentPkgId);
  if (!pkg || !pkg.nextPackage) return null;
  return getPackageById(pkg.nextPackage);
}

// AI Prediction Generator (replace with OpenAI Vision API in production)
export function generateAIPrediction() {
  const homeIdx = Math.floor(Math.random() * VIRTUAL_TEAMS.length);
  let awayIdx = Math.floor(Math.random() * VIRTUAL_TEAMS.length);
  while (awayIdx === homeIdx) awayIdx = Math.floor(Math.random() * VIRTUAL_TEAMS.length);

  const homeTeam = VIRTUAL_TEAMS[homeIdx];
  const awayTeam = VIRTUAL_TEAMS[awayIdx];
  const predictions = [];

  PREDICTION_MARKETS.forEach((market) => {
    const pick = market.options[Math.floor(Math.random() * market.options.length)];
    const confidence = Math.floor(Math.random() * 35) + 60;
    const odd = parseFloat((Math.random() * 8 + 1.1).toFixed(2));
    predictions.push({ market: market.name, pick, confidence, odd });
  });

  const totalOdd = parseFloat(predictions.slice(0, 4).reduce((a, p) => a * p.odd, 1).toFixed(2));
  const overallConfidence = Math.floor(Math.random() * 20) + 72;

  return {
    type: "ai",
    homeTeam,
    awayTeam,
    match: `${homeTeam} vs ${awayTeam}`,
    predictions,
    totalOdd,
    confidence: overallConfidence,
    analysis: `AI analysis: ${homeTeam} shows strong attacking metrics. ${awayTeam} has defensive vulnerabilities. Historical data suggests a high-scoring match with ${homeTeam} likely to dominate.`,
    status: "delivered",
  };
}

export function timeAgo(dateString) {
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
