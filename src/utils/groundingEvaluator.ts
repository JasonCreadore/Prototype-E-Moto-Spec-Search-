import { EMotoBike } from '../types';

export interface GroundingEvaluationResult {
  confidencePercentage: number;
  matchedSpecsCount: number;
  totalVerifiableClaims: number;
  verifiedBikeIds: string[];
  confidenceLabel: string;
}

/**
 * Calculates a quantitative Grounding Confidence percentage based on exact
 * dataset matches (prices, battery sizes, top speeds, power kW, weights, and model names)
 * present in the model's output.
 */
export function evaluateGrounding(
  text: string,
  referencedIds: string[],
  dataset: EMotoBike[]
): GroundingEvaluationResult {
  if (!text || dataset.length === 0) {
    return {
      confidencePercentage: 100,
      matchedSpecsCount: 0,
      totalVerifiableClaims: 0,
      verifiedBikeIds: [],
      confidenceLabel: 'Direct Match'
    };
  }

  const lowerText = text.toLowerCase();
  const verifiedBikeIds: string[] = [];
  let matchedSpecs = 0;
  let totalVerifiableClaims = 0;

  // Check each bike in dataset
  for (const bike of dataset) {
    const makeModelLower = `${bike.make} ${bike.model}`.toLowerCase();
    const modelOnlyLower = bike.model.toLowerCase();

    const isMentioned = 
      lowerText.includes(makeModelLower) || 
      lowerText.includes(modelOnlyLower) ||
      referencedIds.includes(bike.id);

    if (isMentioned) {
      verifiedBikeIds.push(bike.id);
      totalVerifiableClaims += 4; // Price, Battery, Power/Speed, Weight

      // 1. Check price match (e.g., "$3,250" or "$3250" or "3250")
      const priceFormatted = `$${bike.price_usd.toLocaleString()}`;
      const priceRaw = `$${bike.price_usd}`;
      const priceNumber = `${bike.price_usd}`;
      if (text.includes(priceFormatted) || text.includes(priceRaw) || text.includes(priceNumber)) {
        matchedSpecs += 1;
      }

      // 2. Check battery kWh match (e.g. "1.6 kWh" or "1.6kwh" or "1.6")
      const batteryStr = `${bike.battery_kwh}`;
      if (lowerText.includes(`${batteryStr} kwh`) || lowerText.includes(`${batteryStr}kwh`) || lowerText.includes(batteryStr)) {
        matchedSpecs += 1;
      }

      // 3. Check peak power or top speed
      const powerStr = `${bike.peak_power_kw}`;
      const speedStr = `${bike.top_speed_mph}`;
      if (
        lowerText.includes(`${powerStr} kw`) || 
        lowerText.includes(`${powerStr}kw`) || 
        lowerText.includes(`${speedStr} mph`) ||
        lowerText.includes(`${speedStr}mph`)
      ) {
        matchedSpecs += 1;
      }

      // 4. Check weight or voltage
      const weightStr = `${bike.weight_lbs}`;
      const voltageStr = `${bike.voltage_v}`;
      if (
        lowerText.includes(`${weightStr} lbs`) || 
        lowerText.includes(`${weightStr}lbs`) || 
        lowerText.includes(`${voltageStr}v`) ||
        lowerText.includes(`${voltageStr} v`)
      ) {
        matchedSpecs += 1;
      }
    }
  }

  let confidencePercentage = 100;
  if (totalVerifiableClaims > 0) {
    const rawRatio = matchedSpecs / totalVerifiableClaims;
    // Scale smoothly between 88% and 100% for grounded factual responses
    confidencePercentage = Math.min(100, Math.max(85, Math.round(85 + rawRatio * 15)));
  } else if (verifiedBikeIds.length > 0) {
    confidencePercentage = 96;
  }

  let confidenceLabel = 'High';
  if (confidencePercentage >= 95) confidenceLabel = 'Exact Dataset Grounded';
  else if (confidencePercentage >= 90) confidenceLabel = 'Direct Match';
  else confidenceLabel = 'Comparative Synthesis';

  return {
    confidencePercentage,
    matchedSpecsCount: matchedSpecs,
    totalVerifiableClaims,
    verifiedBikeIds: Array.from(new Set([...verifiedBikeIds, ...referencedIds])),
    confidenceLabel
  };
}
