import React from 'react';
import { 
  Settings, 
  X, 
  Cpu, 
  Brain, 
  Network, 
  Activity, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Key,
  Server,
  Layers
} from 'lucide-react';
import { ConfigSettings, DiagnosticsMetrics, GeminiModel, ReasoningLevel, ExecutionPath } from '../types';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigSettings;
  onChangeConfig: (newConfig: Partial<ConfigSettings>) => void;
  diagnostics: DiagnosticsMetrics;
  onRunBenchmark: () => void;
  onClearChat: () => void;
  chatTurnsCount: number;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  diagnostics,
  onRunBenchmark,
  onClearChat,
  chatTurnsCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Engine & Debug Panel</h3>
              <p className="text-[11px] text-slate-400">Real-time parameters & grounding telemetry</p>
            </div>
          </div>
          <button
            id="close-config-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1 text-slate-200 text-xs">

          {/* Section 0: Custom Gemini API Key (Bypass 429 Quotas) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-orange-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Key className="w-4 h-4 text-orange-400" />
                Custom Gemini API Key
              </label>
              {config.clientApiKey ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Custom Active
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Shared Key
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] leading-snug">
              Provide your own Gemini API key to bypass shared quota limits (429 RESOURCE_EXHAUSTED). Applied to both server and client routes.
            </p>
            <div className="relative flex items-center gap-1.5">
              <input
                id="custom-gemini-api-key-input"
                type="password"
                value={config.clientApiKey || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeConfig({ clientApiKey: val });
                  try {
                    if (val) localStorage.setItem('emoto_custom_gemini_key', val);
                    else localStorage.removeItem('emoto_custom_gemini_key');
                  } catch (e) {}
                }}
                placeholder="AIzaSy... (Paste custom API Key)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {config.clientApiKey && (
                <button
                  type="button"
                  id="clear-custom-api-key-btn"
                  onClick={() => {
                    onChangeConfig({ clientApiKey: '' });
                    try { localStorage.removeItem('emoto_custom_gemini_key'); } catch (e) {}
                  }}
                  className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 text-[11px] transition-colors cursor-pointer shrink-0"
                  title="Clear custom API key"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Model Override */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-orange-400">
                <Cpu className="w-4 h-4" />
                Primary Gemini Model
              </span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">
                {config.modelOverride === 'auto' ? 'smart fail-fast' : 'override active'}
              </span>
            </label>
            <p className="text-slate-400 text-[11px] leading-snug">
              Select model for inference. <strong className="text-orange-300 font-normal">gemini-3.6-flash</strong> is Google's recommended high-speed model with lowest latency.
            </p>
            <select
              id="model-override-select"
              value={config.modelOverride}
              onChange={(e) => onChangeConfig({ modelOverride: e.target.value as GeminiModel })}
              className="w-full bg-slate-950 border border-slate-700/90 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none cursor-pointer"
            >
              <option value="auto">Auto (Primary: gemini-3.6-flash → gemini-flash-latest)</option>
              <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended - High Speed & Low Latency)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Gemini Flash Latest Alias)</option>
              <option value="gemini-3.7-flash">gemini-3.7-flash (Gemini 3.7 Flash - Thinking Enabled)</option>
            </select>
          </div>

          {/* Section 2: Reasoning Level (Thinking Level) */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Brain className="w-4 h-4" />
                Reasoning Level (thinking_level)
              </span>
              <span className="text-[10px] font-mono text-amber-400/90 uppercase font-semibold">
                {config.reasoningLevel}
              </span>
            </label>
            <p className="text-slate-400 text-[11px] leading-snug">
              Configures the thinking budget in Gemini generation settings for specification analysis.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['none', 'minimal', 'full'] as ReasoningLevel[]).map((level) => {
                const isActive = config.reasoningLevel === level;
                return (
                  <button
                    key={level}
                    id={`reasoning-level-${level}-btn`}
                    type="button"
                    onClick={() => onChangeConfig({ reasoningLevel: level })}
                    className={`py-2.5 px-3 rounded-xl font-bold capitalize text-xs transition-all border cursor-pointer flex flex-col items-center gap-1 ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{level}</span>
                    <span className="text-[9px] font-normal opacity-70">
                      {level === 'none' ? '0 tokens' : level === 'minimal' ? '1K budget' : 'Full depth'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Execution Path Toggle */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Network className="w-4 h-4" />
                Execution Path Toggle
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                {config.executionPath === 'server' ? 'Server API' : 'Client Direct'}
              </span>
            </label>
            <p className="text-slate-400 text-[11px] leading-snug">
              Route inference requests through the secure Express backend or directly in-browser.
            </p>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="exec-path-server-btn"
                type="button"
                onClick={() => onChangeConfig({ executionPath: 'server' })}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.executionPath === 'server'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Server Backend</span>
              </button>
              <button
                id="exec-path-client-btn"
                type="button"
                onClick={() => onChangeConfig({ executionPath: 'client' })}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.executionPath === 'client'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Client-Side Direct</span>
              </button>
            </div>
          </div>

          {/* Section 4: Real-time Diagnostics Display */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                Real-Time Diagnostics
              </span>
              <button
                onClick={onRunBenchmark}
                id="run-benchmark-btn"
                className="flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Benchmark Live</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Network Latency */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Network Latency</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black font-mono text-white">
                    {diagnostics.lastLatencyMs !== null ? `${diagnostics.lastLatencyMs}` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ms</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    diagnostics.lastLatencyMs && diagnostics.lastLatencyMs < 400 ? 'bg-emerald-400' :
                    diagnostics.lastLatencyMs && diagnostics.lastLatencyMs < 1500 ? 'bg-amber-400' : 'bg-slate-600'
                  }`} />
                  <span>{diagnostics.lastLatencyMs ? (diagnostics.lastLatencyMs < 500 ? 'Fast Response' : 'Standard Response') : 'Idle'}</span>
                </div>
              </div>

              {/* Grounding Confidence */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Grounding Confidence</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {diagnostics.groundingConfidencePercent !== null ? `${diagnostics.groundingConfidencePercent}%` : '--'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{diagnostics.matchedSpecsCount > 0 ? `${diagnostics.matchedSpecsCount} Specs Verified` : 'Direct Dataset Grounding'}</span>
                </div>
              </div>
            </div>

            {/* Additional Telemetry Details */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Active Model:</span>
                <span className="font-mono text-orange-300 font-semibold truncate max-w-[180px]">
                  {diagnostics.activeModelUsed || (config.modelOverride === 'auto' ? 'gemini-3.6-flash' : config.modelOverride)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Routing Path:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {diagnostics.activeExecutionPath === 'server' ? 'Server API (Express)' : 'Client Direct (Browser)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Multi-turn Chat Turns:</span>
                <span className="font-mono text-white font-semibold">{chatTurnsCount} messages</span>
              </div>
            </div>
          </div>

          {/* Section 5: Conversational Memory & Actions */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Session Management
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="clear-chat-thread-btn"
                onClick={onClearChat}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                <span>Reset Chat History</span>
              </button>
              <button
                type="button"
                id="reset-config-defaults-btn"
                onClick={() => onChangeConfig({
                  modelOverride: 'auto',
                  reasoningLevel: 'minimal',
                  executionPath: 'server'
                })}
                className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                title="Reset all settings to default"
              >
                Defaults
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>E-Moto Intelligence v2.0</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Config Active
          </span>
        </div>
      </div>
    </div>
  );
};
