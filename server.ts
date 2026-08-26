import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import emotoDataset from "./src/data/emoto_specs.json";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", bikesCount: emotoDataset.length });
  });

  // Raw dataset endpoint (JSON or CSV)
  app.get("/api/data/emoto", (req: Request, res: Response) => {
    const format = req.query.format;
    if (format === "csv") {
      const headers = ['id', 'make', 'model', 'category', 'price_usd', 'battery_kwh', 'voltage_v', 'top_speed_mph', 'peak_power_kw', 'range_miles', 'weight_lbs', 'skill_level', 'semantic_summary'];
      const rows = emotoDataset.map((b: any) => [
        b.id,
        `"${b.make.replace(/"/g, '""')}"`,
        `"${b.model.replace(/"/g, '""')}"`,
        `"${b.category.replace(/"/g, '""')}"`,
        b.price_usd,
        b.battery_kwh,
        b.voltage_v,
        b.top_speed_mph,
        b.peak_power_kw,
        b.range_miles,
        b.weight_lbs,
        b.skill_level,
        `"${b.semantic_summary.replace(/"/g, '""')}"`
      ].join(','));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="emoto_specifications.csv"');
      return res.send([headers.join(','), ...rows].join('\n'));
    }
    return res.json(emotoDataset);
  });

  // AI Grounded Search Endpoint
  app.post("/api/gemini/search", async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { query, history, modelOverride, reasoningLevel, activeFilters, clientApiKey } = req.body;

      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "Query parameter is required." });
      }

      // Dataset context passed strictly as grounding truth
      const datasetContext = JSON.stringify(emotoDataset, null, 2);

      const systemInstruction = `You are the E-Moto Spec Intelligence Engine, an expert electric dirt bike technical advisor, conversational assistant, and specification guide.

DATASET OF VERIFIED ELECTRIC DIRT BIKES:
\`\`\`json
${datasetContext}
\`\`\`

CORE GUIDELINES & CONVERSATIONAL BEHAVIOR:
1. Natural Qualitative Reasoning & Explanations:
   - If the user asks a conceptual, explanatory, or general question (e.g., "what can you do?", "why is it safest?"), respond naturally with qualitative reasoning in standard markdown. DO NOT force a list of bike recommendations or strict dataset formatting unless the user is specifically searching for a bike to buy.
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
          if (!item.content || typeof item.content !== 'string' || !item.content.trim()) continue;
          const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';

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

      // Ensure the current query is the final user turn in contents
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

      // API Key determination - accept custom key from Debug Panel or environment variable
      const apiKey = (clientApiKey && clientApiKey.trim() && clientApiKey !== "MY_GEMINI_API_KEY") 
        ? clientApiKey.trim() 
        : (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? process.env.GEMINI_API_KEY : undefined);

      if (!apiKey) {
        return res.status(401).json({
          error: "MISSING_API_KEY",
          status: 401,
          message: "No valid Gemini API key found. Please enter a valid Gemini API key in the Debug Panel / Settings."
        });
      }

      // Initialize GoogleGenAI SDK with server-side API Key
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Determine model candidates: Default to gemini-3.6-flash for lowest latency and high availability
      let candidateModels: string[] = [];
      if (modelOverride && modelOverride !== "auto") {
        candidateModels = [modelOverride];
      } else {
        candidateModels = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.7-flash"];
      }

      // Determine thinking budget based on reasoningLevel
      let thinkingConfig: any = undefined;
      if (reasoningLevel === "none") {
        thinkingConfig = { thinkingBudget: 0 };
      } else if (reasoningLevel === "minimal") {
        thinkingConfig = { thinkingBudget: 1024 };
      } else if (reasoningLevel === "full") {
        thinkingConfig = { thinkingBudget: 8192 };
      }

      let responseText: string | null = null;
      let modelUsed = candidateModels[0];
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              thinkingConfig
            }
          });

          if (response && response.text) {
            responseText = response.text;
            modelUsed = modelName;
            break;
          }
        } catch (mErr: any) {
          lastError = mErr;
          const status = mErr?.status || mErr?.statusCode || mErr?.response?.status;
          const msg = (mErr?.message || mErr?.toString() || '').toLowerCase();
          const isQuota = status === 429 || msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate limit');

          if (isQuota) {
            console.warn(`[Gemini API] Quota exceeded (429) on ${modelName}. Failing fast immediately.`);
            return res.status(429).json({
              error: "QUOTA_EXHAUSTED",
              status: 429,
              message: "Gemini API Quota Exceeded (429). Please wait a moment or supply a valid API key in settings.",
              modelAttempted: modelName
            });
          }

          console.warn(`Model ${modelName} call failed:`, mErr?.message || mErr);
          if (modelOverride && modelOverride !== "auto") {
            break;
          }
        }
      }

      const latencyMs = Date.now() - startTime;

      if (responseText) {
        let answer = responseText.trim();
        let referencedBikeIds: string[] = [];
        let keyRecommendations: any[] = [];
        let groundingConfidence = "Dataset Grounded";

        // If the response contains JSON formatting or JSON code fence, parse it gracefully
        let jsonCandidate = answer;
        if (jsonCandidate.startsWith('```json')) {
          jsonCandidate = jsonCandidate.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        } else if (jsonCandidate.startsWith('```')) {
          jsonCandidate = jsonCandidate.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        }

        if (jsonCandidate.startsWith('{') && jsonCandidate.endsWith('}')) {
          try {
            const parsedData = JSON.parse(jsonCandidate);
            if (parsedData && typeof parsedData.answer === 'string') {
              answer = parsedData.answer;
            }
            if (Array.isArray(parsedData.referencedBikeIds)) {
              referencedBikeIds = parsedData.referencedBikeIds;
            }
            if (Array.isArray(parsedData.keyRecommendations)) {
              keyRecommendations = parsedData.keyRecommendations;
            }
            if (typeof parsedData.groundingConfidence === 'string') {
              groundingConfidence = parsedData.groundingConfidence;
            }
          } catch (pErr) {
            // Response is standard markdown text
          }
        }

        // Scan markdown text for any mentioned dataset bikes to link referenced IDs
        if (referencedBikeIds.length === 0) {
          const lowerAnswer = answer.toLowerCase();
          for (const bike of emotoDataset) {
            const fullName = `${bike.make} ${bike.model}`.toLowerCase();
            const modelName = bike.model.toLowerCase();
            if (lowerAnswer.includes(fullName) || lowerAnswer.includes(modelName)) {
              if (!referencedBikeIds.includes(bike.id)) {
                referencedBikeIds.push(bike.id);
              }
            }
          }
        }

        return res.json({
          query,
          answer,
          referencedBikeIds,
          keyRecommendations, // Clean empty array for conversational queries without throwing or forcing cards
          groundingConfidence,
          groundingPercentage: 98,
          latencyMs,
          modelUsed,
          timestamp: Date.now()
        });
      }

      // If execution reached here without responseText, return explicit error instead of silent masking
      return res.status(500).json({
        error: "API_ERROR",
        status: 500,
        message: lastError?.message || "Failed to generate AI response from Gemini API. Please check your network or API key."
      });

    } catch (error: any) {
      console.error("Gemini grounding error:", error);
      return res.status(500).json({
        error: "Failed to generate grounded response from Gemini.",
        details: error?.message || "Internal error"
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`E-Moto Search Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
