import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';

interface SearchHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRunAISearch: (prompt?: string) => void;
  isAILoading: boolean;
}

const PRESET_QUERIES = [
  "What can you do?",
  "Why is it safest or best for trails?",
  "What is kWh and how does battery capacity work?",
  "What is a good beginner bike under $4000?",
  "Fastest 72V trail bike with high peak power"
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  searchQuery,
  onSearchChange,
  onRunAISearch,
  isAILoading
}) => {
  const [localInput, setLocalInput] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localInput);
    if (localInput.trim()) {
      onRunAISearch(localInput);
    }
  };

  const handleChipClick = (query: string) => {
    setLocalInput(query);
    onSearchChange(query);
    onRunAISearch(query);
  };

  const handleClear = () => {
    setLocalInput('');
    onSearchChange('');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="natural-language-search-input"
              type="text"
              value={localInput}
              onChange={(e) => {
                setLocalInput(e.target.value);
                onSearchChange(e.target.value);
              }}
              placeholder="Ask anything or filter: 'What is a good beginner bike under $4000?'"
              className="w-full pl-11 pr-10 py-3.5 bg-slate-950/80 border border-slate-700/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-slate-100 placeholder-slate-500 text-sm md:text-base outline-none transition-all shadow-inner"
            />
            {localInput && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            id="ask-gemini-btn"
            disabled={isAILoading || !localInput.trim()}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap cursor-pointer"
          >
            {isAILoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Grounding with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Ask Gemini AI</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Quick Chips */}
      <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-400" />
          Example queries:
        </span>
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            type="button"
            id={`preset-query-btn-${idx}`}
            onClick={() => handleChipClick(q)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 hover:text-orange-300 transition-colors text-left truncate max-w-xs cursor-pointer"
          >
            "{q}"
          </button>
        ))}
      </div>
    </div>
  );
};
