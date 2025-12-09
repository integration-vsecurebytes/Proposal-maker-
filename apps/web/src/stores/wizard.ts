import { create } from 'zustand';
import axios from 'axios';
import { getApiUrl } from '../lib/api';

const API_BASE_URL = getApiUrl();

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  required: string[];
}

export interface WizardState {
  sessionId: string | null;
  currentStep: number;
  completedSteps: number[];
  data: Record<string, any>;
  errors?: Record<string, string>;
  steps: WizardStep[];
  loading: boolean;
}

interface WizardStore extends WizardState {
  // Actions
  initializeWizard: () => Promise<void>;
  fetchSteps: () => Promise<void>;
  nextStep: (stepData: Record<string, any>) => Promise<void>;
  previousStep: () => Promise<void>;
  goToStep: (stepIndex: number) => Promise<void>;
  updateData: (data: Record<string, any>) => void;
  completeWizard: () => Promise<string>;
  cancelWizard: () => Promise<void>;
  searchClients: (query: string) => Promise<any[]>;
  autofillClient: (clientName: string, clientCompany: string) => Promise<void>;
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  // Initial state
  sessionId: null,
  currentStep: 0,
  completedSteps: [],
  data: {},
  errors: undefined,
  steps: [],
  loading: false,

  // Fetch wizard steps definition
  fetchSteps: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wizard/steps`);
      set({ steps: response.data.steps });
    } catch (error) {
      console.error('Failed to fetch wizard steps:', error);
    }
  },

  // Initialize new wizard session
  initializeWizard: async () => {
    set({ loading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wizard/init`);
      set({
        sessionId: response.data.sessionId,
        currentStep: response.data.state.currentStep,
        completedSteps: response.data.state.completedSteps,
        data: response.data.state.data,
        errors: undefined,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to initialize wizard:', error);
      set({ loading: false });
    }
  },

  // Move to next step
  nextStep: async (stepData: Record<string, any>) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ loading: true });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wizard/${sessionId}/next`,
        stepData
      );

      set({
        currentStep: response.data.state.currentStep,
        completedSteps: response.data.state.completedSteps,
        data: response.data.state.data,
        errors: response.data.state.errors,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to move to next step:', error);
      set({ loading: false });
    }
  },

  // Move to previous step
  previousStep: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ loading: true });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wizard/${sessionId}/previous`
      );

      set({
        currentStep: response.data.state.currentStep,
        completedSteps: response.data.state.completedSteps,
        data: response.data.state.data,
        errors: undefined,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to move to previous step:', error);
      set({ loading: false });
    }
  },

  // Jump to specific step
  goToStep: async (stepIndex: number) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ loading: true });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wizard/${sessionId}/goto/${stepIndex}`
      );

      set({
        currentStep: response.data.state.currentStep,
        completedSteps: response.data.state.completedSteps,
        data: response.data.state.data,
        errors: undefined,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to jump to step:', error);
      set({ loading: false });
    }
  },

  // Update wizard data without moving to next step
  updateData: (newData: Record<string, any>) => {
    set((state) => ({
      data: { ...state.data, ...newData },
    }));
  },

  // Complete wizard and create proposal
  completeWizard: async (): Promise<string> => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No active wizard session');

    set({ loading: true });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wizard/${sessionId}/complete`
      );

      set({ loading: false });
      return response.data.proposalId;
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      set({ loading: false });
      throw error;
    }
  },

  // Cancel wizard and clean up
  cancelWizard: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/wizard/${sessionId}`);
      set({
        sessionId: null,
        currentStep: 0,
        completedSteps: [],
        data: {},
        errors: undefined,
      });
    } catch (error) {
      console.error('Failed to cancel wizard:', error);
    }
  },

  // Search for existing clients
  searchClients: async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/wizard/clients/search`,
        { params: { q: query } }
      );
      return response.data.clients;
    } catch (error) {
      console.error('Failed to search clients:', error);
      return [];
    }
  },

  // Auto-fill client details
  autofillClient: async (clientName: string, clientCompany: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wizard/clients/autofill`,
        { clientName, clientCompany }
      );

      if (response.data.clientData) {
        set((state) => ({
          data: { ...state.data, ...response.data.clientData },
        }));
      }
    } catch (error) {
      console.error('Failed to autofill client:', error);
    }
  },
}));
