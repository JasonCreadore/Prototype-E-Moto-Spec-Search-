export interface EMotoBike {
  id: string;
  make: string;
  model: string;
  category: string;
  price_usd: number;
  battery_kwh: number;
  voltage_v: number;
  top_speed_mph: number;
  peak_power_kw: number;
  range_miles: number;
  weight_lbs: number;
  charge_time_hours: number;
  skill_level: 'Beginner' | 'Intermediate' | 'Expert' | 'All Levels';
  wheel_size: string;
  semantic_summary: string;
  highlights: string[];
  pros: string[];
  cons: string[];
  badge?: string;
  image_query?: string;
}

export interface FilterState {
  searchQuery: string;
  selectedMakes: string[];
  selectedCategories: string[];
  selectedSkillLevels: string[];
  maxPrice: number;
  minBattery: number;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'power_desc' | 'battery_desc' | 'weight_asc' | 'range_desc';
}

export type GeminiModel = 'auto' | 'gemini-3.6-flash' | 'gemini-flash-latest' | 'gemini-3.7-flash';
export type ReasoningLevel = 'none' | 'minimal' | 'full';
export type ExecutionPath = 'server' | 'client';

export interface ConfigSettings {
  modelOverride: GeminiModel;
  reasoningLevel: ReasoningLevel;
  executionPath: ExecutionPath;
  clientApiKey?: string;
}

export interface DiagnosticsMetrics {
  lastLatencyMs: number | null;
  groundingConfidencePercent: number | null;
  matchedSpecsCount: number;
  totalMentionedBikes: number;
  activeModelUsed: string;
  activeExecutionPath: ExecutionPath;
  lastRequestTimestamp: number | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  referencedBikeIds?: string[];
  keyRecommendations?: {
    bikeId: string;
    model: string;
    make: string;
    reason: string;
  }[];
  groundingConfidence?: string;
  groundingPercentage?: number;
  latencyMs?: number;
  modelUsed?: string;
  executionPath?: ExecutionPath;
}

export interface AISearchResult {
  query: string;
  answer: string;
  referencedBikeIds: string[];
  keyRecommendations: {
    bikeId: string;
    model: string;
    make: string;
    reason: string;
  }[];
  groundingConfidence: string;
  groundingPercentage?: number;
  latencyMs?: number;
  modelUsed?: string;
  executionPath?: ExecutionPath;
  timestamp: number;
}
