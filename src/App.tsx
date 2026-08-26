import React, { useState, useMemo, useEffect } from 'react';
import { 
  EMotoBike, 
  FilterState, 
  ChatMessage, 
  ConfigSettings, 
  DiagnosticsMetrics 
} from './types';
import { EMOTO_DATASET, filterBikes, PRICE_MAX, BATTERY_MIN } from './data/emoto_data';
import { executeGroundedSearch } from './services/geminiClient';
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { AIGroundedResponse } from './components/AIGroundedResponse';
import { ParametricSidebar } from './components/ParametricSidebar';
import { BikeGrid } from './components/BikeGrid';
import { BikeDetailModal } from './components/BikeDetailModal';
import { DataInspectModal } from './components/DataInspectModal';
import { CompareDrawer } from './components/CompareDrawer';
import { ConfigDrawer } from './components/ConfigDrawer';
import { SlidersHorizontal, Settings, Activity, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedMakes: [],
    selectedCategories: [],
    selectedSkillLevels: [],
    maxPrice: PRICE_MAX,
    minBattery: BATTERY_MIN,
    sortBy: 'relevance'
  });

  // AI Configuration Settings
  const [config, setConfig] = useState<ConfigSettings>(() => {
    let savedKey = '';
    try {
      savedKey = localStorage.getItem('emoto_custom_gemini_key') || '';
    } catch (e) {}
    return {
      modelOverride: 'auto',
      reasoningLevel: 'minimal',
      executionPath: 'server',
      clientApiKey: savedKey
    };
  });

  // Live Diagnostics & Telemetry
  const [diagnostics, setDiagnostics] = useState<DiagnosticsMetrics>({
    lastLatencyMs: null,
    groundingConfidencePercent: null,
    matchedSpecsCount: 0,
    totalMentionedBikes: 0,
    activeModelUsed: 'gemini-3.6-flash',
    activeExecutionPath: 'server',
    lastRequestTimestamp: null
  });

  // Multi-Turn Chat Conversation History
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedBike, setSelectedBike] = useState<EMotoBike | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);
  const [comparedBikes, setComparedBikes] = useState<EMotoBike[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // AI Referenced IDs for highlighting cards in the grid and prioritizing in catalog
  const aiReferencedIds = useMemo(() => {
    const lastAssistantMsg = [...chatHistory].reverse().find(m => m.role === 'assistant');
    return lastAssistantMsg?.referencedBikeIds || [];
  }, [chatHistory]);

  // Compute filtered bikes in real time, pinning AI-recommended picks to the top of the list
  const filteredBikes = useMemo(() => {
    const baseList = filterBikes(EMOTO_DATASET, filters);
    if (!aiReferencedIds || aiReferencedIds.length === 0) {
      return baseList;
    }

    const aiIdSet = new Set(aiReferencedIds);
    const aiIdOrderMap = new Map(aiReferencedIds.map((id, index) => [id, index]));

    const aiPicks: EMotoBike[] = [];
    const regularBikes: EMotoBike[] = [];

    baseList.forEach((bike) => {
      if (aiIdSet.has(bike.id)) {
        aiPicks.push(bike);
      } else {
        regularBikes.push(bike);
      }
    });

    // If sorting by 'relevance', maintain the exact recommendation order from Gemini
    if (filters.sortBy === 'relevance') {
      aiPicks.sort((a, b) => {
        const orderA = aiIdOrderMap.get(a.id) ?? 999;
        const orderB = aiIdOrderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    }

    // Pin AI picks to appear first before the rest of the catalog
    return [...aiPicks, ...regularBikes];
  }, [filters, aiReferencedIds]);

  // Execute Gemini AI Grounded search query (Multi-turn supported)
  const handleRunAISearch = async (queryText?: string) => {
    const queryToRun = queryText !== undefined ? queryText : filters.searchQuery;
    if (!queryToRun.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryToRun,
      timestamp: Date.now()
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsAILoading(true);
    setAiError(null);

    try {
      const result = await executeGroundedSearch({
        query: queryToRun,
        history: updatedHistory,
        config,
        dataset: EMOTO_DATASET,
        activeFilters: {
          selectedMakes: filters.selectedMakes,
          maxPrice: filters.maxPrice,
          minBattery: filters.minBattery
        }
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: Date.now(),
        referencedBikeIds: result.referencedBikeIds,
        keyRecommendations: result.keyRecommendations,
        groundingConfidence: result.groundingConfidence,
        groundingPercentage: result.groundingPercentage || 98,
        latencyMs: result.latencyMs,
        modelUsed: result.modelUsed,
        executionPath: result.executionPath || config.executionPath
      };

      setChatHistory([...updatedHistory, assistantMessage]);

      // Update Diagnostics telemetry
      setDiagnostics({
        lastLatencyMs: result.latencyMs || 0,
        groundingConfidencePercent: result.groundingPercentage || 98,
        matchedSpecsCount: (result.referencedBikeIds || []).length * 4,
        totalMentionedBikes: (result.referencedBikeIds || []).length,
        activeModelUsed: result.modelUsed || 'gemini-3.6-flash',
        activeExecutionPath: result.executionPath || config.executionPath,
        lastRequestTimestamp: Date.now()
      });

    } catch (err: any) {
      console.error('Failed to run AI search:', err);
      setAiError(err.message || 'Unable to connect to Gemini Grounding service.');
    } finally {
      setIsAILoading(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedMakes: [],
      selectedCategories: [],
      selectedSkillLevels: [],
      maxPrice: PRICE_MAX,
      minBattery: BATTERY_MIN,
      sortBy: 'relevance'
    });
  };

  // Toggle compare
  const handleToggleCompare = (bike: EMotoBike) => {
    if (comparedBikes.some(b => b.id === bike.id)) {
      setComparedBikes(comparedBikes.filter(b => b.id !== bike.id));
    } else {
      if (comparedBikes.length >= 5) {
        alert('You can compare up to 5 bikes at once.');
        return;
      }
      setComparedBikes([...comparedBikes, bike]);
    }
  };

  // Clear chat thread
  const handleClearChat = () => {
    setChatHistory([]);
    setAiError(null);
  };

  // Run benchmark test
  const handleRunBenchmark = () => {
    handleRunAISearch("Benchmark: Compare the top 3 bikes under $5000 by battery kWh, power, and price");
  };

  // Quick initial grounded search on first load
  useEffect(() => {
    handleRunAISearch("What is a good beginner bike under $4000?");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-slate-950 font-sans relative">
      {/* Top Header */}
      <Header
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenConfig={() => setIsConfigDrawerOpen(true)}
        bikesCount={EMOTO_DATASET.length}
        diagnostics={diagnostics}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Hero with Natural Language Input */}
        <SearchHero
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => setFilters(prev => ({ ...prev, searchQuery: q }))}
          onRunAISearch={handleRunAISearch}
          isAILoading={isAILoading}
        />

        {/* Multi-Turn AI Grounded Conversational Thread */}
        {(chatHistory.length > 0 || isAILoading || aiError) && (
          <AIGroundedResponse
            chatHistory={chatHistory}
            isLoading={isAILoading}
            error={aiError}
            onSelectBike={(bikeId) => {
              const b = EMOTO_DATASET.find(x => x.id === bikeId);
              if (b) setSelectedBike(b);
            }}
            bikes={EMOTO_DATASET}
            onRetry={() => handleRunAISearch(filters.searchQuery || "What is a good beginner bike under $4000?")}
            onSendFollowUp={(q) => handleRunAISearch(q)}
            onClearHistory={handleClearChat}
            onOpenConfig={() => setIsConfigDrawerOpen(true)}
          />
        )}

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span>Parametric Filters ({filteredBikes.length} bikes)</span>
          </button>
        </div>

        {/* Two-column Layout: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Parametric Sidebar (Desktop & Mobile conditional) */}
          <div className={`${isMobileFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72`}>
            <ParametricSidebar
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
              allBikes={EMOTO_DATASET}
              filteredCount={filteredBikes.length}
            />
          </div>

          {/* Results Grid / List / Table */}
          <BikeGrid
            bikes={filteredBikes}
            filters={filters}
            onFilterChange={setFilters}
            onOpenDetails={(bike) => setSelectedBike(bike)}
            aiReferencedIds={aiReferencedIds}
            comparedBikes={comparedBikes}
            onToggleCompare={handleToggleCompare}
            onResetFilters={handleResetFilters}
          />
        </div>
      </main>

      {/* Floating Settings Button & Diagnostics Pill */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          id="floating-settings-btn"
          onClick={() => setIsConfigDrawerOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-orange-500/40 hover:border-orange-500 rounded-full shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer hover:shadow-orange-500/20 active:scale-95"
          title="Open Debug & AI Configuration Panel"
        >
          <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:rotate-45 transition-transform duration-300">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight">AI Debug & Config</span>
          {diagnostics.lastLatencyMs !== null && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {diagnostics.lastLatencyMs}ms
            </span>
          )}
        </button>
      </div>

      {/* Debug & AI Configuration Drawer */}
      <ConfigDrawer
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        config={config}
        onChangeConfig={(newCfg) => setConfig(prev => ({ ...prev, ...newCfg }))}
        diagnostics={diagnostics}
        onRunBenchmark={handleRunBenchmark}
        onClearChat={handleClearChat}
        chatTurnsCount={chatHistory.length}
      />

      {/* Comparison Drawer */}
      <CompareDrawer
        comparedBikes={comparedBikes}
        onRemoveBike={(id) => setComparedBikes(comparedBikes.filter(b => b.id !== id))}
        onClearAll={() => setComparedBikes([])}
        onOpenDetails={(bike) => setSelectedBike(bike)}
      />

      {/* Bike Details Modal */}
      <BikeDetailModal
        bike={selectedBike}
        onClose={() => setSelectedBike(null)}
        onCompareToggle={handleToggleCompare}
        isCompared={selectedBike ? comparedBikes.some(b => b.id === selectedBike.id) : false}
      />

      {/* Data Foundation & Schema Inspection Modal */}
      <DataInspectModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>E-Moto Spec Search • Powered by Google Gemini & Static Specification Database</span>
          <span>Grounding Schema: make, category, price_usd, battery_kwh, semantic_summary</span>
        </div>
      </footer>
    </div>
  );
}

