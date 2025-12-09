import { create } from 'zustand';
import type { Template } from '@proposal-gen/shared';

interface TemplateStore {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  error: string | null;
  setTemplates: (templates: Template[]) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
