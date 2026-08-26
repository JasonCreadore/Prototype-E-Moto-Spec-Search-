import React from 'react';
import { X, Battery, Zap, Gauge, Compass, Weight, Clock, ShieldAlert, Award, Sparkles, Scale, CheckCircle2 } from 'lucide-react';
import { EMotoBike } from '../types';

interface BikeDetailModalProps {
  bike: EMotoBike | null;
  onClose: () => void;
  onCompareToggle: (bike: EMotoBike) => void;
  isCompared: boolean;
}

export const BikeDetailModal: React.FC<BikeDetailModalProps> = ({
  bike,
  onClose,
  onCompareToggle,
  isCompared
}) => {
  if (!bike) return null;

  const powerToWeightRatio = (bike.peak_power_kw / (bike.weight_lbs * 0.453592)).toFixed(3); // kW per kg

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{bike.make}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {bike.category}
              </span>
              {bike.badge && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {bike.badge}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1">{bike.model}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ${bike.price_usd.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">MSRP USD</span>
            </div>
            <button
              id="close-bike-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Semantic Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Semantic Summary & Overview</h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {bike.semantic_summary}
            </p>
          </div>

          {/* Core Spec Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Technical Specifications</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Battery className="w-3.5 h-3.5 text-amber-400" /> Battery</span>
                <p className="text-base font-bold text-white font-mono mt-1">{bike.battery_kwh} kWh</p>
                <span className="text-[11px] text-slate-500">{bike.voltage_v}V Architecture</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-orange-400" /> Peak Power</span>
                <p className="text-base font-bold text-white font-mono mt-1">{bike.peak_power_kw} kW</p>
                <span className="text-[11px] text-slate-500">~{Math.round(bike.peak_power_kw * 1.341)} HP</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-cyan-400" /> Top Speed</span>
                <p className="text-base font-bold text-white font-mono mt-1">{bike.top_speed_mph} mph</p>
                <span className="text-[11px] text-slate-500">Factory Geared</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-emerald-400" /> Est. Range</span>
                <p className="text-base font-bold text-white font-mono mt-1">{bike.range_miles} mi</p>
                <span className="text-[11px] text-slate-500">Mixed trail riding</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Weight className="w-3.5 h-3.5 text-slate-400" /> Curb Weight</span>
                <p className="text-base font-bold text-white font-mono mt-1">{bike.weight_lbs} lbs</p>
                <span className="text-[11px] text-slate-500">Ready to ride</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-400" /> Charge Time</span>
                <p className="text-base font-bold text-white font-mono mt-1">{bike.charge_time_hours} hrs</p>
                <span className="text-[11px] text-slate-500">Standard wall charger</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Wheel Sizes</span>
                <p className="text-xs font-bold text-white mt-1">{bike.wheel_size}</p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Power / Weight</span>
                <p className="text-xs font-bold text-orange-400 font-mono mt-1">{powerToWeightRatio} kW/kg</p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Highlights</h4>
            <div className="space-y-1.5">
              {bike.highlights.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl">
              <h5 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <span>Advantages & Strengths</span>
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                {bike.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">+</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl">
              <h5 className="font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                <span>Considerations & Trade-offs</span>
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                {bike.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">-</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            id="modal-toggle-compare-btn"
            onClick={() => onCompareToggle(bike)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isCompared
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{isCompared ? 'In Compare Drawer' : 'Add to Compare'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
