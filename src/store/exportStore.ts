import { create } from 'zustand';
import type { SkImage } from '@shopify/react-native-skia';

export type ExportFormat = 'jpeg' | 'png';
export type ExportResolution = string;
export type ExportState = 'idle' | 'rendering' | 'saving' | 'done' | 'error';

interface ExportStoreState {
  format: ExportFormat;
  quality: number;
  resolution: ExportResolution;
  targetWidth: number;
  targetHeight: number;
  keepMetadata: boolean;
  exportState: ExportState;
  progress: number;
  /** Snapshot captured eagerly in EditorScreen BEFORE navigation — avoids detached canvas crash */
  capturedSnapshot: SkImage | null;
  errorMessage: string | null;

  setFormat: (format: ExportFormat) => void;
  setQuality: (quality: number) => void;
  setResolution: (key: ExportResolution, targetWidth: number, targetHeight: number) => void;
  setKeepMetadata: (keep: boolean) => void;
  setExportState: (state: ExportState) => void;
  setProgress: (progress: number) => void;
  setCapturedSnapshot: (snapshot: SkImage | null) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
}

export const useExportStore = create<ExportStoreState>((set) => ({
  format: 'jpeg',
  quality: 98,
  resolution: 'original',
  targetWidth: 0,
  targetHeight: 0,
  keepMetadata: true,
  exportState: 'idle',
  progress: 0,
  capturedSnapshot: null,
  errorMessage: null,

  setFormat: (format) => set({ format }),
  setQuality: (quality) => set({ quality }),
  setResolution: (key, targetWidth, targetHeight) => set({ resolution: key, targetWidth, targetHeight }),
  setKeepMetadata: (keep) => set({ keepMetadata: keep }),
  setExportState: (state) => set({ exportState: state }),
  setProgress: (progress) => set({ progress }),
  setCapturedSnapshot: (snapshot) => set({ capturedSnapshot: snapshot }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  reset: () => set({ exportState: 'idle', progress: 0, errorMessage: null, capturedSnapshot: null }),
}));
