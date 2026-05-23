import { create } from 'zustand';
import {
  EditRecipe,
  createDefaultRecipe,
  LightParams,
  ColorParams,
  DetailParams,
  OpticsParams,
  GeometryParams,
  AIStyleParams,
  PresetParams,
} from '../engine/EditRecipe';

export type EditorTab = 'light' | 'color' | 'detail' | 'optics' | 'geometry';
export type BottomNavTab = 'edit' | 'presets' | 'aiStyle' | 'tools';

const MAX_UNDO_STEPS = 30;

interface EditorState {
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;

  recipe: EditRecipe;
  undoStack: EditRecipe[];
  redoStack: EditRecipe[];

  activeTab: EditorTab;
  activeBottomNav: BottomNavTab;
  compareMode: boolean;

  loadImage: (uri: string, width: number, height: number) => void;

  // Push current state to undo stack (call BEFORE making changes)
  pushUndo: () => void;

  // Live update methods — no undo push (caller manages undo timing)
  updateLight: (key: keyof LightParams, value: number) => void;
  updateColor: (key: keyof ColorParams, value: number) => void;
  updateDetail: (key: keyof DetailParams, value: number) => void;
  updateOptics: <K extends keyof OpticsParams>(key: K, value: OpticsParams[K]) => void;
  updateGeometry: <K extends keyof GeometryParams>(key: K, value: GeometryParams[K]) => void;

  // Generic field update (for slider flow: pushUndo once, then updateField many times)
  updateField: (group: string, key: string, value: number) => void;

  // Discrete actions — push undo internally
  setAIStyle: (style: AIStyleParams | null) => void;
  setPreset: (preset: PresetParams | null) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setActiveTab: (tab: EditorTab) => void;
  setActiveBottomNav: (tab: BottomNavTab) => void;
  setCompareMode: (on: boolean) => void;
  resetAdjustments: () => void;
  resetEditor: () => void;
  // Update image source without resetting recipe (used by upscale)
  updateImageSource: (uri: string, width: number, height: number) => void;
}

function cloneRecipe(recipe: EditRecipe): EditRecipe {
  return JSON.parse(JSON.stringify(recipe));
}

export const useEditorStore = create<EditorState>((set, get) => ({
  imageUri: null,
  imageWidth: 0,
  imageHeight: 0,

  recipe: createDefaultRecipe(),
  undoStack: [],
  redoStack: [],

  activeTab: 'light',
  activeBottomNav: 'edit',
  compareMode: false,

  loadImage: (uri, width, height) => set({
    imageUri: uri,
    imageWidth: width,
    imageHeight: height,
    recipe: createDefaultRecipe(),
    undoStack: [],
    redoStack: [],
  }),

  pushUndo: () => {
    const { recipe, undoStack } = get();
    const newStack = [...undoStack, cloneRecipe(recipe)];
    if (newStack.length > MAX_UNDO_STEPS) newStack.shift();
    set({ undoStack: newStack, redoStack: [] });
  },

  // Live update — no undo push
  updateLight: (key, value) => {
    set((s) => ({
      recipe: { ...s.recipe, light: { ...s.recipe.light, [key]: value } },
    }));
  },

  updateColor: (key, value) => {
    set((s) => ({
      recipe: { ...s.recipe, color: { ...s.recipe.color, [key]: value } },
    }));
  },

  updateDetail: (key, value) => {
    set((s) => ({
      recipe: { ...s.recipe, detail: { ...s.recipe.detail, [key]: value } },
    }));
  },

  updateOptics: (key, value) => {
    set((s) => ({
      recipe: { ...s.recipe, optics: { ...s.recipe.optics, [key]: value } },
    }));
  },

  updateGeometry: (key, value) => {
    set((s) => ({
      recipe: { ...s.recipe, geometry: { ...s.recipe.geometry, [key]: value } },
    }));
  },

  // Generic field update for slider flow
  updateField: (group, key, value) => {
    set((s) => ({
      recipe: {
        ...s.recipe,
        [group]: { ...(s.recipe[group as keyof EditRecipe] as Record<string, any>), [key]: value },
      },
    }));
  },

  // Preset and AI style push undo internally (discrete actions)
  setAIStyle: (style) => {
    get().pushUndo();
    set((s) => ({ recipe: { ...s.recipe, aiStyle: style } }));
  },

  setPreset: (preset) => {
    get().pushUndo();
    set((s) => ({ recipe: { ...s.recipe, preset: preset } }));
  },

  undo: () => {
    const { undoStack, recipe } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, cloneRecipe(recipe)],
      recipe: prev,
    });
  },

  redo: () => {
    const { redoStack, recipe } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, cloneRecipe(recipe)],
      recipe: next,
    });
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveBottomNav: (tab) => set({ activeBottomNav: tab }),
  setCompareMode: (on) => set({ compareMode: on }),

  resetAdjustments: () => {
    const { pushUndo } = get();
    pushUndo();
    set({ recipe: createDefaultRecipe() });
  },

  updateImageSource: (uri, width, height) => set({ imageUri: uri, imageWidth: width, imageHeight: height }),

  resetEditor: () => set({
    imageUri: null,
    imageWidth: 0,
    imageHeight: 0,
    recipe: createDefaultRecipe(),
    undoStack: [],
    redoStack: [],
    activeTab: 'light',
    activeBottomNav: 'edit',
  }),
}));
