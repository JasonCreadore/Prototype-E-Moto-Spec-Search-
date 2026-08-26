import React from 'react';
import { X, Scale, Battery, Zap, Gauge, Compass, Weight, Trash2, ArrowRight } from 'lucide-react';
import { EMotoBike } from '../types';

interface CompareDrawerProps {
  comparedBikes: EMotoBike[];
  onRemoveBike: (bikeId: string) => void;
  onClearAll: () => void;
  onOpenDetails: (bike: EMotoBike) => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  comparedBikes,
  onRemoveBike,
  onClearAll,
  onOpenDetails
}) => {
  if (comparedBikes.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 border-t-2 border-orange-500 shadow-2xl backdrop-blur-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Side-by-Side Comparison ({comparedBikes.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 overflow-x-auto">
          {comparedBikes.map((bike) => (
            <div
              key={bike.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 relative group flex flex-col justify-between"
            >
              <button
                onClick={() => onRemoveBike(bike.id)}
                className="absolute top-2 right-2 p-1 rounded-md bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Remove from comparison"
              >
                <X className="w-3 h-3" />
              </button>

              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase">{bike.make}</span>
                <h4 className="text-xs font-bold text-white truncate pr-5">{bike.model}</h4>
                <div className="text-sm font-extrabold text-emerald-400 font-mono mt-1">
                  ${bike.price_usd.toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-slate-300 font-mono">
                  <div className="bg-slate-900 p-1 rounded">
                    <span className="text-slate-500 block">Battery</span>
                    <strong>{bike.battery_kwh} kWh</strong>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <span className="text-slate-500 block">Power</span>
                    <strong>{bike.peak_power_kw} kW</strong>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <span className="text-slate-500 block">Speed</span>
                    <strong>{bike.top_speed_mph} mph</strong>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <span className="text-slate-500 block">Weight</span>
                    <strong>{bike.weight_lbs} lbs</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenDetails(bike)}
                className="mt-2.5 w-full py-1 text-[11px] font-medium text-slate-300 hover:text-orange-400 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span>Full Specs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
