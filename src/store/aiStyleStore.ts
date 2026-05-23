import { create } from 'zustand';
import { BUNDLED_STYLES, type StyleReference } from '../engine/StyleTransfer';

type ProcessingState = 'idle' | 'processing' | 'done' | 'error';

interface AIStyleState {
  styles: StyleReference[];
  selectedStyleId: string | null;
  intensity: number;
  processingState: ProcessingState;

  selectStyle: (id: string | null) => void;
  setIntensity: (value: number) => void;
  setProcessingState: (state: ProcessingState) => void;
  reset: () => void;
}

export const useAIStyleStore = create<AIStyleState>((set) => ({
  styles: BUNDLED_STYLES,
  selectedStyleId: null,
  intensity: 100,
  processingState: 'idle',

  selectStyle: (id) => set({ selectedStyleId: id, processingState: id ? 'processing' : 'idle' }),
  setIntensity: (value) => set({ intensity: value }),
  setProcessingState: (state) => set({ processingState: state }),
  reset: () => set({ selectedStyleId: null, intensity: 100, processingState: 'idle' }),
}));
