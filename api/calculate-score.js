function weightedMean(deposits = []) {
  if (!deposits || deposits.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const { amount, daysAgo } of deposits) {
    const weight = 1 / (daysAgo + 1);
    weightedSum += (amount || 0) * weight;
    totalWeight += weight;
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

function meanAbsoluteDeviation(deposits = []) {
  if (!deposits || deposits.length === 0) return 0;
  const amounts = deposits.map((d) => d.amount || 0);
  const mean = amounts.reduce((acc, v) => acc + v, 0) / amounts.length;
  return amounts.reduce((acc, v) => acc + Math.abs(v - mean), 0) / amounts.length;
}

function computeScoreAndTier(wMean, mad, n) {
  let score = 0;
  if (wMean > 0 && mad <= wMean) {
    score = (wMean * (1 - mad / wMean)) * Math.log(n + 1);
  }

  let tier = 0;
  let tierName = "Bronce";

  if (score >= 1000) { tier = 4; tierName = "Platino"; } 
  else if (score >= 500) { tier = 3; tierName = "Diamante"; } 
  else if (score >= 150) { tier = 2; tierName = "Oro"; } 
  else if (score >= 50) { tier = 1; tierName = "Plata"; }

  return { score: parseFloat(score.toFixed(4)), tier, tierName };
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { deposits } = req.body;
  const wMean = weightedMean(deposits);
  const mad = meanAbsoluteDeviation(deposits);
  res.json(computeScoreAndTier(wMean, mad, (deposits || []).length));
}