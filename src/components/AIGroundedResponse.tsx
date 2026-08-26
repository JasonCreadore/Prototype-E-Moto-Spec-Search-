import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  AlertTriangle,
  Key,
  User, 
  Bot, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  Trash2,
  ChevronDown,
  Layers,
  Server
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, EMotoBike } from '../types';

interface AIGroundedResponseProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSelectBike: (bikeId: string) => void;
  bikes: EMotoBike[];
  onRetry: () => void;
  onSendFollowUp: (queryText: string) => void;
  onClearHistory: () => void;
  onOpenConfig: () => void;
}

const FOLLOW_UP_SUGGESTIONS = [
  "Why is it safest or most controllable on singletrack?",
  "What is the difference in battery kWh across these?",
  "Which of these has the largest battery capacity?",
  "Compare their top speeds and curb weights side-by-side"
];

export const AIGroundedResponse: React.FC<AIGroundedResponseProps> = ({
  chatHistory,
  isLoading,
  error,
  onSelectBike,
  bikes,
  onRetry,
  onSendFollowUp,
  onClearHistory,
  onOpenConfig
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inlineInput, setInlineInput] = useState('');
  const chatMessagesBoxRef = useRef<HTMLDivElement>(null);

  // Keep only the internal chat box scrolled to bottom on multi-turn conversations without moving or jumping the page/viewport
  useEffect(() => {
    if (chatMessagesBoxRef.current) {
      chatMessagesBoxRef.current.scrollTop = chatMessagesBoxRef.current.scrollHeight;
    }
  }, [chatHistory.length, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineInput.trim() && !isLoading) {
      onSendFollowUp(inlineInput.trim());
      setInlineInput('');
    }
  };

  if (chatHistory.length === 0 && !isLoading && !error) {
    return null;
  }

  return (
    <div id="ai-grounding-chat-container" className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden">
      {/* Top Thread Header */}
      <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Gemini Conversational Grounding Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Multi-Turn Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Conversational context retained across follow-up queries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Configure model, thinking level, and routing"
          >
            <Cpu className="w-3.5 h-3.5 text-orange-400" />
            <span>AI Config</span>
          </button>
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
            title="Start new thread"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Topic</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div 
        ref={chatMessagesBoxRef} 
        className="p-4 sm:p-6 space-y-6 max-h-[600px] overflow-y-auto divide-y divide-slate-800/50 scroll-smooth"
      >
        {chatHistory.map((msg, index) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex items-start gap-3 justify-end pt-4 first:pt-0">
                <div className="max-w-2xl bg-orange-500/15 border border-orange-500/30 rounded-2xl rounded-tr-sm p-3.5 sm:px-4.5 text-slate-100 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-1 text-[11px] text-orange-300/80">
                    <span className="font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-orange-400" />
                      You
                    </span>
                    <span className="text-[10px] opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{msg.content}</p>
                </div>
              </div>
            );
          }

          // Assistant / Model Grounded Response Turn
          return (
            <div key={msg.id} className="flex items-start gap-3 pt-6 first:pt-0">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-orange-400" />
              </div>

              <div className="flex-1 space-y-4 min-w-0">
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      Gemini Grounded Intelligence
                    </span>
                    {msg.modelUsed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-orange-300 font-mono text-[10px] border border-slate-700">
                        <Cpu className="w-3 h-3 text-orange-400" />
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.executionPath && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                        {msg.executionPath === 'server' ? <Server className="w-3 h-3 text-cyan-400" /> : <Layers className="w-3 h-3 text-cyan-400" />}
                        {msg.executionPath === 'server' ? 'Server API' : 'Client Direct'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {msg.latencyMs !== undefined && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {msg.latencyMs} ms
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {msg.groundingPercentage || 100}% Grounded
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Formatted Grounded Markdown Answer */}
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed [&>p]:mb-3 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>li]:mb-1.5 [&>strong]:text-orange-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Model Recommendation Cards */}
                {msg.keyRecommendations && msg.keyRecommendations.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      Direct Dataset Matches:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {msg.keyRecommendations.map((rec) => {
                        const matchedBike = bikes.find(b => b.id === rec.bikeId || (b.make === rec.make && b.model === rec.model));
                        return (
                          <div
                            key={rec.bikeId}
                            id={`ai-rec-card-${rec.bikeId}`}
                            onClick={() => matchedBike && onSelectBike(matchedBike.id)}
                            className="group p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all duration-200 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300">
                                {rec.make} {rec.model}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                            {matchedBike && (
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span className="font-semibold text-emerald-400">${matchedBike.price_usd.toLocaleString()}</span>
                                <span>•</span>
                                <span>{matchedBike.battery_kwh} kWh</span>
                                <span>•</span>
                                <span>{matchedBike.peak_power_kw} kW</span>
                              </div>
                            )}
                            <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-snug">
                              {rec.reason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking / Loading Animation Turn */}
        {isLoading && (
          <div className="flex items-start gap-3 pt-6">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mt-1 animate-pulse">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 bg-slate-950/40 border border-orange-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-400">Gemini Thinking & Grounding</span>
                <span className="text-[11px] text-slate-400">Cross-referencing dataset specifications...</span>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-3.5 bg-slate-800 rounded-md w-3/4"></div>
                <div className="h-3.5 bg-slate-800 rounded-md w-full"></div>
                <div className="h-3.5 bg-slate-800 rounded-md w-5/6"></div>
              </div>
            </div>
          </div>
        )}

        {/* Explicit Error Banner / Quota Limit Notification */}
        {error && (
          <div
            id="ai-error-banner"
            className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 border transition-all ${
              error.includes('429') || error.toLowerCase().includes('quota') || error.includes('RESOURCE_EXHAUSTED')
                ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-950/30 text-slate-200'
                : 'bg-red-950/40 border-red-800/60 shadow-lg shadow-red-950/30 text-slate-200'
            }`}
          >
            {error.includes('429') || error.toLowerCase().includes('quota') || error.includes('RESOURCE_EXHAUSTED') ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {error.includes('429') || error.toLowerCase().includes('quota') || error.includes('RESOURCE_EXHAUSTED')
                    ? 'Gemini API Quota Exceeded (429)'
                    : 'AI Grounding Service Notice'}
                </h4>
                {error.includes('429') && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                    HTTP 429 Quota
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {error.includes('429') || error.toLowerCase().includes('quota')
                  ? 'Gemini API Quota Exceeded (429). The shared project quota is currently rate-limited. Please wait a few seconds or supply a valid custom API key in settings to bypass project limits.'
                  : error}
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  id="error-open-settings-btn"
                  onClick={onOpenConfig}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Enter Custom API Key</span>
                </button>
                <button
                  type="button"
                  id="retry-ai-btn"
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Query Again</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Follow-up Chips & Inline Input Bar */}
      <div className="p-4 sm:px-6 bg-slate-950/90 border-t border-slate-800 space-y-3">
        {/* Quick follow-up chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 shrink-0 text-[11px] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" />
            Follow up:
          </span>
          {FOLLOW_UP_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              id={`followup-chip-${idx}`}
              onClick={() => onSendFollowUp(suggestion)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-orange-300 text-xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              "{suggestion}"
            </button>
          ))}
        </div>

        {/* Inline Follow-up Input */}
        <form onSubmit={handleInlineSubmit} className="relative flex items-center gap-2">
          <input
            id="chat-inline-followup-input"
            type="text"
            value={inlineInput}
            onChange={(e) => setInlineInput(e.target.value)}
            placeholder="Ask a follow-up question in this thread (e.g., 'Which has faster acceleration?')..."
            disabled={isLoading}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            id="chat-inline-send-btn"
            disabled={isLoading || !inlineInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-md shadow-orange-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
