import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EditRecipe } from '../engine/EditRecipe';
import { createDefaultRecipe } from '../engine/EditRecipe';

const PROJECTS_KEY = '@raw_eye_projects';

export interface Project {
  id: string;
  imageUri: string;
  thumbnailUri?: string;
  recipe: EditRecipe;
  createdAt: number;
  updatedAt: number;
}

interface ProjectStoreState {
  projects: Project[];
  isLoaded: boolean;

  loadProjects: () => Promise<void>;
  saveProject: (imageUri: string, recipe: EditRecipe) => Promise<string>;
  updateProject: (id: string, recipe: EditRecipe) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  isLoaded: false,

  loadProjects: async () => {
    try {
      const stored = await AsyncStorage.getItem(PROJECTS_KEY);
      if (stored) {
        const projects: Project[] = JSON.parse(stored);
        // Sort by most recently updated
        projects.sort((a, b) => b.updatedAt - a.updatedAt);
        set({ projects, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  saveProject: async (imageUri: string, recipe: EditRecipe) => {
    const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const project: Project = {
      id,
      imageUri,
      recipe,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [project, ...get().projects];
    set({ projects: updated });
    await persistProjects(updated);
    return id;
  },

  updateProject: async (id: string, recipe: EditRecipe) => {
    const updated = get().projects.map((p) =>
      p.id === id ? { ...p, recipe, updatedAt: Date.now() } : p,
    );
    set({ projects: updated });
    await persistProjects(updated);
  },

  deleteProject: async (id: string) => {
    const updated = get().projects.filter((p) => p.id !== id);
    set({ projects: updated });
    await persistProjects(updated);
  },

  getProject: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },
}));

async function persistProjects(projects: Project[]): Promise<void> {
  try {
    // Keep max 50 recent projects to avoid storage bloat
    const trimmed = projects.slice(0, 50);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail — non-critical persistence
  }
}
