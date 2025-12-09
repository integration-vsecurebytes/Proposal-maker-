import { create } from 'zustand';
import {
  Message,
  ConversationPhase,
  ExtractedData,
} from '@proposal-gen/shared';

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  extractedData: ExtractedData;
  currentPhase: ConversationPhase | null;
  isComplete: boolean;
  progress: number;
  phaseDescription: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConversationId: (id: string) => void;
  addMessage: (message: Message) => void;
  setExtractedData: (data: ExtractedData) => void;
  setCurrentPhase: (phase: ConversationPhase) => void;
  setProgress: (progress: number) => void;
  setPhaseDescription: (description: string) => void;
  setIsComplete: (isComplete: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  conversationId: null,
  messages: [],
  extractedData: {},
  currentPhase: null,
  isComplete: false,
  progress: 0,
  phaseDescription: '',
  isLoading: false,
  error: null,
};

export const useConversationStore = create<ConversationState>((set) => ({
  ...initialState,

  setConversationId: (id) => set({ conversationId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setExtractedData: (data) => set({ extractedData: data }),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  setProgress: (progress) => set({ progress }),

  setPhaseDescription: (description) => set({ phaseDescription: description }),

  setIsComplete: (isComplete) => set({ isComplete }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
