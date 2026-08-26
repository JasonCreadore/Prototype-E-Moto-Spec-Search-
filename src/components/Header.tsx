import React from 'react';
import { Zap, Sparkles, Database, Download, FileJson, Settings, Activity } from 'lucide-react';
import { DiagnosticsMetrics } from '../types';

interface HeaderProps {
  onOpenDataModal: () => void;
  onOpenConfig: () => void;
  bikesCount: number;
  diagnostics: DiagnosticsMetrics;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenDataModal, 
  onOpenConfig, 
  bikesCount,
  diagnostics 
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">E-Moto Spec Search</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">
                Gemini Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Natural Language & Parametric Electric Dirt Bike Explorer
            </p>
          </div>
        </div>

        {/* Actions & Dataset Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {diagnostics.lastLatencyMs !== null && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{diagnostics.lastLatencyMs}ms</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">{diagnostics.groundingConfidencePercent}% Grounded</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-orange-400" />
            <span><strong className="text-white">{bikesCount}</strong> E-Motos</span>
          </div>

          <button
            id="open-data-modal-btn"
            onClick={onOpenDataModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="Inspect & download underlying JSON/CSV dataset"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Dataset Schema</span>
          </button>

          <button
            id="header-config-btn"
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold transition-colors cursor-pointer"
            title="Open Debug & AI Configuration Panel"
          >
            <Settings className="w-3.5 h-3.5 text-orange-400" />
            <span>AI Config</span>
          </button>
        </div>
      </div>
    </header>
  );
};

