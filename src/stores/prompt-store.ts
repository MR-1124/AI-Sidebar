import { create } from 'zustand';
import { promptRepo, type PromptTemplate } from '../db/repositories/prompt-repo';

interface PromptState {
  prompts: PromptTemplate[];
  loaded: boolean;

  loadPrompts: () => Promise<void>;
  createPrompt: (data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  searchPrompts: (query: string) => Promise<PromptTemplate[]>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  loaded: false,

  loadPrompts: async () => {
    try {
      const prompts = await promptRepo.list();
      set({ prompts, loaded: true });
    } catch (e) {
      console.warn('Failed to load prompts:', e);
      set({ loaded: true });
    }
  },

  createPrompt: async (data) => {
    const prompt = await promptRepo.create(data);
    set((s) => ({
      prompts: [prompt, ...s.prompts].sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  },

  updatePrompt: async (id, updates) => {
    await promptRepo.update(id, updates);
    set((s) => ({
      prompts: s.prompts.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      ).sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  },

  deletePrompt: async (id) => {
    await promptRepo.delete(id);
    set((s) => ({
      prompts: s.prompts.filter(p => p.id !== id),
    }));
  },

  searchPrompts: async (query) => {
    return promptRepo.search(query);
  },
}));
