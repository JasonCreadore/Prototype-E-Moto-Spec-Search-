import { EMotoBike } from '../types';
import emotoRawData from './emoto_specs.json';

export const EMOTO_DATASET: EMotoBike[] = emotoRawData as EMotoBike[];

export const ALL_MAKES = Array.from(new Set(EMOTO_DATASET.map(b => b.make))).sort();
export const ALL_CATEGORIES = Array.from(new Set(EMOTO_DATASET.map(b => b.category))).sort();
export const ALL_SKILL_LEVELS = ['Beginner', 'All Levels', 'Intermediate', 'Expert'] as const;

export const PRICE_MIN = Math.min(...EMOTO_DATASET.map(b => b.price_usd));
export const PRICE_MAX = Math.max(...EMOTO_DATASET.map(b => b.price_usd));
export const BATTERY_MIN = Math.min(...EMOTO_DATASET.map(b => b.battery_kwh));
export const BATTERY_MAX = Math.max(...EMOTO_DATASET.map(b => b.battery_kwh));

export function getDatasetAsCSV(): string {
  const headers = ['id', 'make', 'model', 'category', 'price_usd', 'battery_kwh', 'voltage_v', 'top_speed_mph', 'peak_power_kw', 'range_miles', 'weight_lbs', 'skill_level', 'semantic_summary'];
  const rows = EMOTO_DATASET.map(bike => {
    return [
      bike.id,
      `"${bike.make.replace(/"/g, '""')}"`,
      `"${bike.model.replace(/"/g, '""')}"`,
      `"${bike.category.replace(/"/g, '""')}"`,
      bike.price_usd,
      bike.battery_kwh,
      bike.voltage_v,
      bike.top_speed_mph,
      bike.peak_power_kw,
      bike.range_miles,
      bike.weight_lbs,
      bike.skill_level,
      `"${bike.semantic_summary.replace(/"/g, '""')}"`
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function filterBikes(
  bikes: EMotoBike[],
  options: {
    searchQuery: string;
    selectedMakes: string[];
    selectedCategories: string[];
    selectedSkillLevels: string[];
    maxPrice: number;
    minBattery: number;
    sortBy: string;
  }
): EMotoBike[] {
  const query = options.searchQuery.toLowerCase().trim();

  let filtered = bikes.filter(bike => {
    // Make filter
    if (options.selectedMakes.length > 0 && !options.selectedMakes.includes(bike.make)) {
      return false;
    }

    // Category filter
    if (options.selectedCategories.length > 0 && !options.selectedCategories.includes(bike.category)) {
      return false;
    }

    // Skill level filter
    if (options.selectedSkillLevels.length > 0 && !options.selectedSkillLevels.includes(bike.skill_level)) {
      return false;
    }

    // Price filter
    if (bike.price_usd > options.maxPrice) {
      return false;
    }

    // Battery filter
    if (bike.battery_kwh < options.minBattery) {
      return false;
    }

    // Search query match across make, model, summary, highlights, pros, category
    if (query) {
      const matchText = [
        bike.make,
        bike.model,
        bike.category,
        bike.semantic_summary,
        bike.skill_level,
        bike.wheel_size,
        ...(bike.highlights || []),
        ...(bike.pros || []),
        `${bike.voltage_v}v`,
        `${bike.price_usd}`,
        `${bike.peak_power_kw}kw`,
        `${bike.battery_kwh}kwh`
      ].join(' ').toLowerCase();

      const terms = query.split(/\s+/).filter(Boolean);
      // Check if all or most terms match
      const matchesAll = terms.every(term => matchText.includes(term));
      if (!matchesAll) {
        // partial match check
        const matchCount = terms.filter(term => matchText.includes(term)).length;
        if (matchCount === 0) return false;
      }
    }

    return true;
  });

  // Sorting
  switch (options.sortBy) {
    case 'price_asc':
      filtered.sort((a, b) => a.price_usd - b.price_usd);
      break;
    case 'price_desc':
      filtered.sort((a, b) => b.price_usd - a.price_usd);
      break;
    case 'power_desc':
      filtered.sort((a, b) => b.peak_power_kw - a.peak_power_kw);
      break;
    case 'battery_desc':
      filtered.sort((a, b) => b.battery_kwh - a.battery_kwh);
      break;
    case 'weight_asc':
      filtered.sort((a, b) => a.weight_lbs - b.weight_lbs);
      break;
    case 'range_desc':
      filtered.sort((a, b) => b.range_miles - a.range_miles);
      break;
    case 'relevance':
    default:
      // Keep natural order or query relevance
      break;
  }

  return filtered;
}
