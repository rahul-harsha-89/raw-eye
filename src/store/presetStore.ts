import { create } from 'zustand';
import {
  PRESET_LIBRARY,
  PRESET_CATEGORIES,
  getPresetById,
  type FilmPreset,
  type PresetCategory,
} from '../engine/presets';

interface PresetState {
  presets: FilmPreset[];
  categories: PresetCategory[];
  selectedPresetId: string | null;
  selectedPreset: FilmPreset | null;
  intensity: number;
  activeCategory: PresetCategory;

  selectPreset: (id: string | null) => void;
  setIntensity: (value: number) => void;
  setActiveCategory: (category: PresetCategory) => void;
  reset: () => void;
}

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: PRESET_LIBRARY,
  categories: PRESET_CATEGORIES,
  selectedPresetId: null,
  selectedPreset: null,
  intensity: 100,
  activeCategory: 'Film Emulation',

  selectPreset: (id) => {
    const preset = id ? getPresetById(id) ?? null : null;
    set({ selectedPresetId: id, selectedPreset: preset });
  },
  setIntensity: (value) => set({ intensity: value }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  reset: () => set({ selectedPresetId: null, selectedPreset: null, intensity: 100 }),
}));
