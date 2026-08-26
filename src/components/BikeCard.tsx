import React, { useState } from 'react';
import { Battery, Gauge, Zap, Compass, Weight, ChevronDown, ChevronUp, Check, ExternalLink, Sparkles, Scale } from 'lucide-react';
import { EMotoBike } from '../types';

interface BikeCardProps {
  bike: EMotoBike;
  isAiRecommended?: boolean;
  onOpenDetails: (bike: EMotoBike) => void;
  isCompared: boolean;
  onToggleCompare: (bike: EMotoBike) => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({
  bike,
  isAiRecommended,
  onOpenDetails,
  isCompared,
  onToggleCompare
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      id={`bike-card-${bike.id}`}
      className={`group rounded-2xl bg-slate-900 border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
        isAiRecommended
          ? 'border-orange-500 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-orange-950/20'
          : 'border-slate-800/90 hover:border-slate-700 shadow-md hover:shadow-xl'
      }`}
    >
      {/* AI Recommendation Highlight Ribbon */}
      {isAiRecommended && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-[11px] font-bold text-slate-950 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            AI Query Grounded Match
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-950/20 px-1.5 py-0.5 rounded">
            Top Pick
          </span>
        </div>
      )}

      {/* Card Header & Brand */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{bike.make}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {bike.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-orange-300 transition-colors mt-1">
              {bike.model}
            </h3>
          </div>

          <div className="text-right">
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              ${bike.price_usd.toLocaleString()}
            </div>
            {bike.badge && (
              <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {bike.badge}
              </span>
            )}
          </div>
        </div>

        {/* Semantic Summary */}
        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mt-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
          {bike.semantic_summary}
        </p>

        {/* Spec Grid Matrix */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          {/* Battery */}
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Battery className="w-3.5 h-3.5 text-amber-400" />
              <span>Battery</span>
            </div>
            <div className="font-bold text-slate-100 mt-1 font-mono">
              {bike.battery_kwh} <span className="text-[10px] font-normal text-slate-400">kWh</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{bike.voltage_v}V pack</div>
          </div>

          {/* Peak Power */}
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Power</span>
            </div>
            <div className="font-bold text-slate-100 mt-1 font-mono">
              {bike.peak_power_kw} <span className="text-[10px] font-normal text-slate-400">kW</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">~{Math.round(bike.peak_power_kw * 1.341)} HP</div>
          </div>

          {/* Top Speed */}
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Top Speed</span>
            </div>
            <div className="font-bold text-slate-100 mt-1 font-mono">
              {bike.top_speed_mph} <span className="text-[10px] font-normal text-slate-400">mph</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{bike.range_miles} mi range</div>
          </div>
        </div>

        {/* Secondary Specs Row */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 px-1">
          <span className="flex items-center gap-1">
            <Weight className="w-3 h-3 text-slate-400" />
            <span>Weight: <strong className="text-slate-200">{bike.weight_lbs} lbs</strong></span>
          </span>
          <span>
            Rider: <strong className="text-slate-200">{bike.skill_level}</strong>
          </span>
        </div>

        {/* Expanded Specs Details */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs space-y-2.5 animate-fadeIn">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Highlights:</span>
              <ul className="mt-1 space-y-1 text-slate-300">
                {bike.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-orange-400 shrink-0">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
              <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                <span className="font-semibold text-emerald-400">Pros:</span>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {bike.pros.slice(0, 2).map((p, i) => (
                    <li key={i}>+ {p}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                <span className="font-semibold text-rose-400">Cons:</span>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {bike.cons.slice(0, 2).map((c, i) => (
                    <li key={i}>- {c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
              <span>Wheel size: <strong className="text-slate-200">{bike.wheel_size}</strong></span>
              <span>Charge: <strong className="text-slate-200">{bike.charge_time_hours} hrs</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          id={`toggle-compare-${bike.id}`}
          onClick={() => onToggleCompare(bike)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            isCompared
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Add to side-by-side comparison"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id={`toggle-expand-${bike.id}`}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? 'Less' : 'More'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            id={`view-details-${bike.id}`}
            onClick={() => onOpenDetails(bike)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-slate-950 font-semibold text-xs text-slate-200 transition-all cursor-pointer"
          >
            <span>Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
