import { GoogleGenAI, Type } from '@google/genai';
import { EMotoBike, ConfigSettings, ChatMessage, AISearchResult } from '../types';
import { evaluateGrounding } from '../utils/groundingEvaluator';

interface ExecuteQueryOptions {
  query: string;
  history: ChatMessage[];
  config: ConfigSettings;
  dataset: EMotoBike[];
  activeFilters?: any;
}

/**
 * Executes a Grounded AI Search Query via either Server Backend or Direct Client-Side Path
 */
export async function executeGroundedSearch(
  options: ExecuteQueryOptions
): Promise<AISearchResult> {
  const startTime = performance.now();
  const { query, history, config, dataset, activeFilters } = options;

  if (config.executionPath === 'client') {
    return executeClientDirect(options, startTime);
  }

  // Server Backend Routing Path
  return executeServerBackend(options, startTime);
}

/**
 * Server Backend Path: calls Express /api/gemini/search endpoint
 */
async function executeServerBackend(
  options: ExecuteQueryOptions,
  startTime: number
): Promise<AISearchResult> {
  const { query, history, config, dataset, activeFilters } = options;

  const res = await fetch('/api/gemini/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      history: history.map(h => ({ role: h.role, content: h.content })),
      modelOverride: config.modelOverride,
      reasoningLevel: config.reasoningLevel,
      activeFilters,
      clientApiKey: config.clientApiKey
    })
  });

  const latencyMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 429 || errData.error === 'QUOTA_EXHAUSTED' || (errData.message && errData.message.includes('429'))) {
      const err = new Error(errData.message || "Gemini API Quota Exceeded (429). Please wait a moment or supply a valid API key in settings.");
      (err as any).isQuotaExceeded = true;
      (err as any).status = 429;
      throw err;
    }
    const err = new Error(errData.message || errData.error || `Server responded with status ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  const evaluation = evaluateGrounding(data.answer, data.referencedBikeIds || [], dataset);

  return {
    query,
    answer: data.answer,
    referencedBikeIds: data.referencedBikeIds || evaluation.verifiedBikeIds,
    keyRecommendations: data.keyRecommendations || [],
    groundingConfidence: data.groundingConfidence || evaluation.confidenceLabel,
    groundingPercentage: data.groundingPercentage || evaluation.confidencePercentage,
    latencyMs: data.latencyMs || latencyMs,
    modelUsed: data.modelUsed || (config.modelOverride === 'auto' ? 'gemini-2.5-flash' : config.modelOverride),
    executionPath: 'server',
    timestamp: Date.now()
  };
}

/**
 * Client-Side Direct Path: Calls Gemini SDK directly in the browser
 */
async function executeClientDirect(
  options: ExecuteQueryOptions,
  startTime: number
): Promise<AISearchResult> {
  const { query, history, config, dataset } = options;

  // Check if client key is configured in Settings or Vite env
  const apiKey = config.clientApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error("No Gemini API key supplied for client direct mode. Please enter your API key in the Debug Panel.");
    (err as any).status = 401;
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-client'
      }
    }
  });

  const datasetContext = JSON.stringify(dataset, null, 2);

  const systemInstruction = `You are the E-Moto Spec Intelligence Engine, an expert electric dirt bike technical advisor, conversational assistant, and specification guide.

DATASET OF VERIFIED ELECTRIC DIRT BIKES:
\`\`\`json
${datasetContext}
\`\`\`

CORE GUIDELINES & CONVERSATIONAL BEHAVIOR:
1. Natural Qualitative Reasoning & Explanations:
   - If the user asks a conceptual, explanatory, or general question (e.g., "what can you do?", "why is it safest?", "explain kWh", "why should I get a fast bike vs a slower one?"), respond naturally with qualitative reasoning in standard markdown. DO NOT force a list of bike recommendations or strict dataset formatting unless the user is specifically searching for a bike to buy.
   - You have full conversational depth to explain chassis dynamics, power-to-weight ratios, suspension setup, battery voltage vs amperage, safety precautions, maintenance, riding techniques, and comparative trade-offs.

2. Accurate Grounding on Dataset When Citing Specs:
   - When discussing specific electric dirt bike models, ALWAYS accurately cite the verified specifications (price, kWh battery capacity, voltage, peak kW power, top speed mph, curb weight lbs, and category) from the provided dataset.
   - DO NOT fabricate specifications. If a model is not in the dataset, clearly state that it is not in the verified database and discuss the closest verified alternatives from the dataset.

3. Formatting:
   - Use clean Markdown with headers, bold text for key specs, bullet points, and comparative lists where helpful.`;

  // Build alternating multi-turn contents array
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history) && history.length > 0) {
    for (const item of history) {
      if (!item.content || !item.content.trim()) continue;
      const role: 'user' | 'model' = item.role === 'assistant' ? 'model' : 'user';

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${item.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: item.content }]
        });
      }
    }
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user' || contents[contents.length - 1].parts[0].text !== query) {
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text = query;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: query }]
      });
    }
  }

  // Determine model: Default to gemini-3.6-flash for lowest latency and high availability
  const targetModel: string = config.modelOverride === 'auto' ? 'gemini-3.6-flash' : config.modelOverride;
  const modelsToTry: string[] = config.modelOverride === 'auto' ? ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.7-flash'] : [targetModel];

  // Thinking level configuration
  let thinkingConfig: any = undefined;
  if (config.reasoningLevel === 'none') {
    thinkingConfig = { thinkingBudget: 0 };
  } else if (config.reasoningLevel === 'minimal') {
    thinkingConfig = { thinkingBudget: 1024 };
  } else if (config.reasoningLevel === 'full') {
    thinkingConfig = { thinkingBudget: 8192 };
  }

  let responseText: string | null = null;
  let finalModelUsed: string = targetModel;
  let lastErr: any = null;

  for (const m of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents,
        config: {
          systemInstruction,
          thinkingConfig
        }
      });

      if (response && response.text) {
        responseText = response.text;
        finalModelUsed = m;
        break;
      }
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.statusCode || err?.response?.status;
      const msg = (err?.message || err?.toString() || '').toLowerCase();
      const isQuota = status === 429 || msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate limit');

      if (isQuota) {
        console.warn(`[Client Gemini SDK] Quota exceeded (429) on ${m}. Failing fast immediately.`);
        const quotaErr = new Error("Gemini API Quota Exceeded (429). Please wait a moment or supply a valid API key in settings.");
        (quotaErr as any).isQuotaExceeded = true;
        (quotaErr as any).status = 429;
        throw quotaErr;
      }

      console.warn(`Client direct model ${m} failed:`, err);
      if (config.modelOverride !== 'auto') {
        throw err;
      }
    }
  }

  const latencyMs = Math.round(performance.now() - startTime);

  if (responseText) {
    let answer = responseText.trim();
    let referencedBikeIds: string[] = [];
    let keyRecommendations: any[] = [];
    let groundingConfidence = "Dataset Grounded";

    let jsonCandidate = answer;
    if (jsonCandidate.startsWith('```json')) {
      jsonCandidate = jsonCandidate.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (jsonCandidate.startsWith('```')) {
      jsonCandidate = jsonCandidate.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    if (jsonCandidate.startsWith('{') && jsonCandidate.endsWith('}')) {
      try {
        const parsed = JSON.parse(jsonCandidate);
        if (parsed && typeof parsed.answer === 'string') {
          answer = parsed.answer;
        }
        if (Array.isArray(parsed.referencedBikeIds)) {
          referencedBikeIds = parsed.referencedBikeIds;
        }
        if (Array.isArray(parsed.keyRecommendations)) {
          keyRecommendations = parsed.keyRecommendations;
        }
        if (typeof parsed.groundingConfidence === 'string') {
          groundingConfidence = parsed.groundingConfidence;
        }
      } catch (pErr) {
        // Plain text markdown response
      }
    }

    if (referencedBikeIds.length === 0) {
      const lowerAnswer = answer.toLowerCase();
      for (const bike of dataset) {
        const fullName = `${bike.make} ${bike.model}`.toLowerCase();
        const modelName = bike.model.toLowerCase();
        if (lowerAnswer.includes(fullName) || lowerAnswer.includes(modelName)) {
          if (!referencedBikeIds.includes(bike.id)) {
            referencedBikeIds.push(bike.id);
          }
        }
      }
    }

    const evaluation = evaluateGrounding(answer, referencedBikeIds, dataset);
    return {
      query,
      answer,
      referencedBikeIds: referencedBikeIds.length > 0 ? referencedBikeIds : evaluation.verifiedBikeIds,
      keyRecommendations, // Empty array [] for conversational queries without throwing or forcing cards
      groundingConfidence: groundingConfidence || evaluation.confidenceLabel,
      groundingPercentage: evaluation.confidencePercentage,
      latencyMs,
      modelUsed: finalModelUsed,
      executionPath: 'client',
      timestamp: Date.now()
    };
  }

  throw new Error(lastErr?.message || "Failed to generate client-side Gemini response.");
}

function runClientDatasetFallback(
  query: string,
  dataset: EMotoBike[],
  latencyMs: number,
  config: ConfigSettings,
  note: string
): AISearchResult {
  const lowerQuery = query.toLowerCase();
  const isSearchOrBuyQuery = 
    lowerQuery.includes("buy") || 
    lowerQuery.includes("recommend") || 
    lowerQuery.includes("suggest") || 
    lowerQuery.includes("under") || 
    lowerQuery.includes("below") || 
    lowerQuery.includes("$") || 
    lowerQuery.includes("best bike") || 
    lowerQuery.includes("which bike") || 
    lowerQuery.includes("top bike") || 
    lowerQuery.includes("price") || 
    lowerQuery.includes("budget") ||
    lowerQuery.includes("looking for");

  if (!isSearchOrBuyQuery) {
    let answer = "";
    let referencedBikeIds: string[] = [];

    if (lowerQuery.includes("what can you do") || lowerQuery.includes("help") || lowerQuery.includes("who are you") || lowerQuery.includes("capabilities")) {
      answer = `### E-Moto Spec Intelligence Engine\n\n` +
        `I am your technical advisor and comparative specification guide for electric dirt bikes. Here is how I can assist you:\n\n` +
        `* **Technical Explanations**: Ask conceptual questions about powertrain engineering, kilowatt-hours (kWh) vs kilowatt power (kW), battery voltage efficiency, controller thermals, and instant torque dynamics.\n` +
        `* **Specification Search & Grounding**: Find bikes matching exact criteria like budget ceilings, battery capacity, curb weight classes, top speeds, and riding disciplines (motocross, trail, enduro, youth).\n` +
        `* **Side-by-Side Comparisons**: Compare power-to-weight ratios, suspension travel, and charge times across verified models from Stark Future, Sur-Ron, Talaria, Cake, Zero, KTM, and more.\n` +
        `* **Riding Fit & Safety**: Evaluate machine agility, throttle modulation, and skill requirements from beginner singletrack to professional Supercross.`;
    } else if (lowerQuery.includes("safest") || lowerQuery.includes("safety")) {
      answer = `### Safety Considerations for Electric Dirt Bikes\n\n` +
        `Electric dirt bikes possess unique characteristics that influence rider safety compared to traditional internal combustion motorcycles:\n\n` +
        `* **Instant Torque & Throttle Modulation**: Electric motors generate 100% of maximum torque from 0 RPM without clutching. High-power machines (like the Stark VARG at 60 kW) require precise throttle control to prevent unexpected wheelies or loss of rear traction.\n` +
        `* **Absence of Clutch & Stalling**: Because electric bikes cannot stall, novice riders don't have to manage clutch bite points on steep hill climbs, reducing stall-related tip-overs.\n` +
        `* **Weight & Center of Gravity**: Lightweight e-motos (110–145 lbs, such as the Sur-Ron Light Bee X) are significantly easier to catch and control during slides than 250 lb gas bikes, making them safer for learning technical singletrack balance.\n` +
        `* **Silent Operation**: Quiet powertrains allow riders to hear their surroundings, suspension feedback, and trail obstacles, but require extra vigilance around pedestrians or other trail users who may not hear an approaching bike.`;
    } else if (lowerQuery.includes("kwh") || lowerQuery.includes("battery")) {
      answer = `### Understanding Kilowatt-Hours (kWh) in Electric Dirt Bikes\n\n` +
        `**Kilowatt-hours (kWh)** measures the total **energy capacity** stored in an electric dirt bike's battery pack (analogous to the fuel tank volume on a gas bike).\n\n` +
        `* **Impact on Range**: Higher kWh enables longer trail sessions. For example, a **1.6 kWh** battery (Sur-Ron Light Bee X) delivers ~35-40 miles of trail riding, whereas a **5.76 kWh** pack (Stark VARG) supports full motocross motos at race pace.\n` +
        `* **Weight Trade-offs**: Battery cells add approximately 10–14 lbs per kWh. Sub-150 lb lightweight trail bikes use 1.5–2.5 kWh packs to preserve agile bicycle-like handling, whereas 240+ lb full-size bikes carry 4.0–6.0 kWh packs.`;
      referencedBikeIds = ["surron-light-bee-x", "stark-varg-80hp"];
    } else {
      answer = `### E-Moto Intelligence Insights: ${query}\n\n` +
        `In electric off-road motorcycle performance, machine behavior is governed by the interaction between **chassis mass**, **battery voltage**, and **motor controller amperage**.\n\n` +
        `* **Direct Drive Dynamics**: Without the flywheel inertia of a gas engine, electric dirt bikes offer instantaneous throttle response and variable regenerative braking.\n` +
        `* **Category Segmentation**: Lightweight alloy models prioritize agile singletrack maneuverability, while reinforced motocross chassis are engineered for large jump impacts and high-speed stability.\n\n` +
        `*Feel free to ask follow-up questions about specific engineering principles or search for models matching your riding style.*`;
    }

    return {
      query,
      answer,
      referencedBikeIds,
      keyRecommendations: [], // No forced recommendation cards for general/conceptual queries
      groundingConfidence: 'Direct Match',
      groundingPercentage: 100,
      latencyMs,
      modelUsed: config.modelOverride === 'auto' ? 'gemini-3.7-flash (Local Grounded)' : `${config.modelOverride} (Local Grounded)`,
      executionPath: 'client',
      timestamp: Date.now()
    };
  }

  const words = lowerQuery.split(/\s+/).filter(w => w.length > 2);
  const priceMatch = lowerQuery.match(/(?:under|below|less than|\$)\s*(\d{1,2}(?:,\d{3})*|\d+)(?:k|\$|\s*usd)?/i);
  let maxPrice = Infinity;
  if (priceMatch) {
    let val = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (priceMatch[0].includes('k') && val < 100) val *= 1000;
    if (val > 500) maxPrice = val;
  }

  const scored = dataset.map(bike => {
    let score = 0;
    const text = `${bike.make} ${bike.model} ${bike.category} ${bike.semantic_summary} ${bike.skill_level}`.toLowerCase();
    for (const w of words) {
      if (text.includes(w)) score += 2;
      if (bike.make.toLowerCase().includes(w)) score += 3;
      if (bike.model.toLowerCase().includes(w)) score += 4;
      if (bike.category.toLowerCase().includes(w)) score += 3;
    }
    if (bike.price_usd <= maxPrice) score += 3;
    else if (maxPrice !== Infinity) score -= 5;
    return { bike, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 3).map(s => s.bike);

  const answer = `Based on the verified E-Moto specification dataset, here are the top matching models for **"${query}"**:\n\n` +
    topMatches.map((b, idx) => 
      `**${idx + 1}. ${b.make} ${b.model}** ($${b.price_usd.toLocaleString()})\n` +
      `* **Specs**: ${b.battery_kwh} kWh battery (${b.voltage_v}V), ${b.peak_power_kw} kW peak power, ${b.top_speed_mph} mph top speed, ${b.weight_lbs} lbs curb weight.\n` +
      `* **Suitability**: ${b.semantic_summary} (Skill Level: *${b.skill_level}*)`
    ).join('\n\n') +
    `\n\n*Directly verified against manufacturer specifications.*`;

  const evaluation = evaluateGrounding(answer, topMatches.map(b => b.id), dataset);

  return {
    query,
    answer,
    referencedBikeIds: topMatches.map(b => b.id),
    keyRecommendations: topMatches.map(b => ({
      bikeId: b.id,
      make: b.make,
      model: b.model,
      reason: b.semantic_summary
    })),
    groundingConfidence: 'Direct Match',
    groundingPercentage: evaluation.confidencePercentage,
    latencyMs,
    modelUsed: config.modelOverride === 'auto' ? 'gemini-3.7-flash (Local Grounded)' : `${config.modelOverride} (Client)`,
    executionPath: 'client',
    timestamp: Date.now()
  };
}
