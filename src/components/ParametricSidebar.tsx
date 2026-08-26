import React from 'react';
import { Filter, RotateCcw, DollarSign, Battery, Tag, Layers, Award, Check } from 'lucide-react';
import { FilterState, EMotoBike } from '../types';
import { ALL_MAKES, ALL_CATEGORIES, ALL_SKILL_LEVELS, PRICE_MIN, PRICE_MAX, BATTERY_MIN, BATTERY_MAX } from '../data/emoto_data';

interface ParametricSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  allBikes: EMotoBike[];
  filteredCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const ParametricSidebar: React.FC<ParametricSidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  allBikes,
  filteredCount,
  isMobileOpen,
  onCloseMobile
}) => {
  const handleMakeToggle = (make: string) => {
    const updated = filters.selectedMakes.includes(make)
      ? filters.selectedMakes.filter(m => m !== make)
      : [...filters.selectedMakes, make];
    onFilterChange({ ...filters, selectedMakes: updated });
  };

  const handleCategoryToggle = (category: string) => {
    const updated = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];
    onFilterChange({ ...filters, selectedCategories: updated });
  };

  const handleSkillLevelToggle = (skill: string) => {
    const updated = filters.selectedSkillLevels.includes(skill)
      ? filters.selectedSkillLevels.filter(s => s !== skill)
      : [...filters.selectedSkillLevels, skill];
    onFilterChange({ ...filters, selectedSkillLevels: updated });
  };

  const hasActiveFilters =
    filters.selectedMakes.length > 0 ||
    filters.selectedCategories.length > 0 ||
    filters.selectedSkillLevels.length > 0 ||
    filters.maxPrice < PRICE_MAX ||
    filters.minBattery > BATTERY_MIN ||
    Boolean(filters.searchQuery);

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Parametric Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              id="reset-filters-btn"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="py-3 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 my-4 flex items-center justify-between text-xs">
          <span className="text-slate-400">Matching Models:</span>
          <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
            {filteredCount} of {allBikes.length}
          </span>
        </div>

        {/* Price Range Slider (Parametric Requirement) */}
        <div className="space-y-3 pb-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Max Price (USD)
            </span>
            <span className="text-emerald-400 font-mono font-bold">
              ${filters.maxPrice.toLocaleString()}
            </span>
          </div>
          <input
            id="price-range-slider"
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={250}
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>${PRICE_MIN.toLocaleString()}</span>
            <span>${PRICE_MAX.toLocaleString()}</span>
          </div>
        </div>

        {/* Minimum Battery Capacity (kWh) */}
        <div className="space-y-3 py-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-amber-400" />
              Min Battery (kWh)
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {filters.minBattery.toFixed(1)} kWh
            </span>
          </div>
          <input
            id="battery-range-slider"
            type="range"
            min={BATTERY_MIN}
            max={BATTERY_MAX}
            step={0.2}
            value={filters.minBattery}
            onChange={(e) => onFilterChange({ ...filters, minBattery: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>{BATTERY_MIN.toFixed(1)} kWh</span>
            <span>{BATTERY_MAX.toFixed(1)} kWh</span>
          </div>
        </div>

        {/* Make Filter (Parametric Checkboxes Requirement) */}
        <div className="space-y-3 py-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-orange-400" />
              Manufacturer / Make
            </span>
            {filters.selectedMakes.length > 0 && (
              <span className="text-[11px] text-orange-400 font-normal">
                {filters.selectedMakes.length} selected
              </span>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {ALL_MAKES.map((make) => {
              const count = allBikes.filter(b => b.make === make).length;
              const isChecked = filters.selectedMakes.includes(make);
              return (
                <label
                  key={make}
                  id={`filter-make-${make.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMakeToggle(make)}
                      className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500/20 focus:ring-offset-0 cursor-pointer accent-orange-500"
                    />
                    <span className={`font-medium ${isChecked ? 'text-orange-400 font-semibold' : 'text-slate-300 group-hover:text-slate-100'}`}>
                      {make}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/80">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-3 py-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Riding Category
            </span>
          </div>
          <div className="space-y-1.5">
            {ALL_CATEGORIES.map((cat) => {
              const count = allBikes.filter(b => b.category === cat).length;
              const isChecked = filters.selectedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  id={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(cat)}
                      className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500/20 cursor-pointer accent-orange-500"
                    />
                    <span className={`truncate max-w-[140px] font-medium ${isChecked ? 'text-orange-400 font-semibold' : 'text-slate-300 group-hover:text-slate-100'}`}>
                      {cat}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/80">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Skill Level Filter */}
        <div className="space-y-3 pt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Rider Skill Level
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_SKILL_LEVELS.map((skill) => {
              const isChecked = filters.selectedSkillLevels.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  id={`filter-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => handleSkillLevelToggle(skill)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
