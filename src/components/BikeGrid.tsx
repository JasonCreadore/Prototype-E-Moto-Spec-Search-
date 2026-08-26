import React, { useState } from 'react';
import { LayoutGrid, List, Table as TableIcon, ArrowUpDown, SlidersHorizontal, Sparkles, AlertCircle } from 'lucide-react';
import { EMotoBike, FilterState } from '../types';
import { BikeCard } from './BikeCard';

interface BikeGridProps {
  bikes: EMotoBike[];
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  onOpenDetails: (bike: EMotoBike) => void;
  aiReferencedIds: string[];
  comparedBikes: EMotoBike[];
  onToggleCompare: (bike: EMotoBike) => void;
  onResetFilters: () => void;
}

export const BikeGrid: React.FC<BikeGridProps> = ({
  bikes,
  filters,
  onFilterChange,
  onOpenDetails,
  aiReferencedIds,
  comparedBikes,
  onToggleCompare,
  onResetFilters
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'compact'>('grid');

  return (
    <div className="flex-1 space-y-4">
      {/* View & Sort Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white font-mono">{bikes.length}</strong> specifications
          </span>
          {aiReferencedIds.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
              <Sparkles className="w-3 h-3" />
              {aiReferencedIds.length} AI picks pinned to top
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="sort-by-select"
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
              className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:border-orange-500 outline-none cursor-pointer"
            >
              <option value="relevance">Sort: Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="power_desc">Power: High to Low</option>
              <option value="battery_desc">Battery: Largest (kWh)</option>
              <option value="range_desc">Range: Longest (mi)</option>
              <option value="weight_asc">Weight: Lightest (lbs)</option>
            </select>
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="view-mode-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-orange-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-compact"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'compact' ? 'bg-orange-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-orange-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Data Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {bikes.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No e-motos matched your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your price range, clearing manufacturer selections, or loosening battery requirements.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && bikes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bikes.map((bike) => {
            const isAiRecommended = aiReferencedIds.includes(bike.id);
            const isCompared = comparedBikes.some(b => b.id === bike.id);
            return (
              <BikeCard
                key={bike.id}
                bike={bike}
                isAiRecommended={isAiRecommended}
                onOpenDetails={onOpenDetails}
                isCompared={isCompared}
                onToggleCompare={onToggleCompare}
              />
            );
          })}
        </div>
      )}

      {/* Compact List View */}
      {viewMode === 'compact' && bikes.length > 0 && (
        <div className="space-y-2">
          {bikes.map((bike) => {
            const isAiRecommended = aiReferencedIds.includes(bike.id);
            const isCompared = comparedBikes.some(b => b.id === bike.id);
            return (
              <div
                key={bike.id}
                id={`compact-bike-${bike.id}`}
                className={`p-4 rounded-xl bg-slate-900 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isAiRecommended
                    ? 'border-orange-500 bg-orange-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400">{bike.make}</span>
                    <h4 className="text-sm font-bold text-white">{bike.model}</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {bike.category}
                    </span>
                    {isAiRecommended && (
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/30">
                        AI Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1">{bike.semantic_summary}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-400 text-base">${bike.price_usd.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-400">{bike.battery_kwh} kWh • {bike.peak_power_kw} kW • {bike.weight_lbs} lbs</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleCompare(bike)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isCompared
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isCompared ? 'Comparing' : 'Compare'}
                    </button>
                    <button
                      onClick={() => onOpenDetails(bike)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Table View */}
      {viewMode === 'table' && bikes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3 pl-4">Model & Make</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Battery</th>
                  <th className="p-3">Power</th>
                  <th className="p-3">Top Speed</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Skill</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bikes.map((bike) => {
                  const isAiRecommended = aiReferencedIds.includes(bike.id);
                  const isCompared = comparedBikes.some(b => b.id === bike.id);
                  return (
                    <tr
                      key={bike.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isAiRecommended ? 'bg-orange-950/20' : ''
                      }`}
                    >
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{bike.model}</span>
                          {isAiRecommended && (
                            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/30">
                              AI Pick
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-orange-400 font-medium">{bike.make}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                          {bike.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        ${bike.price_usd.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-amber-300">
                        {bike.battery_kwh} kWh <span className="text-[10px] text-slate-500">({bike.voltage_v}V)</span>
                      </td>
                      <td className="p-3 font-mono text-orange-300">
                        {bike.peak_power_kw} kW
                      </td>
                      <td className="p-3 font-mono text-cyan-300">
                        {bike.top_speed_mph} mph
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {bike.weight_lbs} lbs
                      </td>
                      <td className="p-3 text-slate-300">
                        {bike.skill_level}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onToggleCompare(bike)}
                            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isCompared
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Compare"
                          >
                            {isCompared ? '✓' : '+'}
                          </button>
                          <button
                            onClick={() => onOpenDetails(bike)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
