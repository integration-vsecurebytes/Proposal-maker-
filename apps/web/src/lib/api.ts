import axios from 'axios';
import type { Template } from '@proposal-gen/shared';

// Dynamically detect API URL based on environment
const API_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  : ''; // Empty string for dev - uses Vite proxy to backend on :3001

/**
 * Get the base API URL for direct requests (like EventSource)
 * This ensures consistent URL construction across the app
 */
export const getApiUrl = () => API_URL;

/**
 * Fix asset URLs to work dynamically
 * Removes old localhost:4000 references and ensures proper path format
 */
export const fixAssetUrl = (url: string | undefined): string => {
  if (!url) return '';

  // Strip out old localhost:4000 references (legacy data)
  let fixedUrl = url.replace(/https?:\/\/localhost:4000/g, '');

  // If URL starts with http/https (external URL), return as-is
  if (fixedUrl.startsWith('http://') || fixedUrl.startsWith('https://')) {
    return fixedUrl;
  }

  // Ensure it starts with / for proper path
  if (!fixedUrl.startsWith('/')) {
    fixedUrl = '/' + fixedUrl;
  }

  // In development, use Vite proxy (empty string + path)
  // In production, use configured API URL
  return `${API_URL}${fixedUrl}`;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Template API
export const templateApi = {
  list: async (): Promise<Template[]> => {
    const response = await api.get('/api/templates');
    return response.data;
  },

  get: async (slug: string): Promise<Template> => {
    const response = await api.get(`/api/templates/${slug}`);
    return response.data;
  },

  create: async (data: any): Promise<Template> => {
    const response = await api.post('/api/templates', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Template> => {
    const response = await api.put(`/api/templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/templates/${id}`);
  },

  upload: async (file: File, name: string, useAI: boolean = false, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('useAI', useAI.toString());

    const response = await api.post(`/api/upload/template?useAI=${useAI}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  reExtract: async (id: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/api/upload/template/${id}/re-extract`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },
};

// Conversation API
export const conversationApi = {
  start: async (templateId: string) => {
    const response = await api.post('/api/conversations/start', { templateId });
    return response.data;
  },

  chat: async (conversationId: string, message: string) => {
    const response = await api.post(`/api/conversations/${conversationId}/chat`, { message });
    return response.data;
  },

  get: async (conversationId: string) => {
    const response = await api.get(`/api/conversations/${conversationId}`);
    return response.data.conversation;
  },
};

// Proposal API
export const proposalApi = {
  generate: async (proposalId: string) => {
    const response = await api.post(`/api/proposals/${proposalId}/generate`);
    return response.data;
  },

  get: async (proposalId: string) => {
    const response = await api.get(`/api/proposals/${proposalId}`);
    return response.data.proposal;
  },

  regenerateSection: async (proposalId: string, sectionId: string, options?: { includeImages?: boolean; includeCharts?: boolean; includeDiagrams?: boolean }) => {
    const response = await api.post(`/api/proposals/${proposalId}/sections/${sectionId}/regenerate`, options);
    return response.data;
  },

  updateSection: async (proposalId: string, sectionId: string, content: string) => {
    const response = await api.put(`/api/proposals/${proposalId}/sections/${sectionId}`, { content });
    return response.data;
  },
};

// RAG API
export const ragApi = {
  indexProposal: async (proposalId: string, sections: any[], metadata?: any) => {
    const response = await api.post('/api/rag/index-proposal', {
      proposalId,
      sections,
      metadata,
    });
    return response.data;
  },

  uploadWinningProposal: async (data: {
    file?: File;
    title: string;
    content?: string;
    industry?: string;
    projectType?: string;
    winRate?: number;
    companySize?: string;
    dealValue?: string;
    tags?: string[];
  }) => {
    const formData = new FormData();

    if (data.file) {
      formData.append('file', data.file);
    }

    formData.append('title', data.title);

    if (data.content) formData.append('content', data.content);
    if (data.industry) formData.append('industry', data.industry);
    if (data.projectType) formData.append('projectType', data.projectType);
    if (data.winRate) formData.append('winRate', data.winRate.toString());
    if (data.companySize) formData.append('companySize', data.companySize);
    if (data.dealValue) formData.append('dealValue', data.dealValue);
    if (data.tags) formData.append('tags', data.tags.join(','));

    const response = await api.post('/api/rag/winning-proposal', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  search: async (query: string, options?: {
    topK?: number;
    filters?: any;
    sources?: string[];
    minSimilarity?: number;
  }) => {
    const response = await api.post('/api/rag/search', {
      query,
      ...options,
    });
    return response.data;
  },

  getContext: async (query: string, topK?: number, filters?: any) => {
    const response = await api.post('/api/rag/context', {
      query,
      topK,
      filters,
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/rag/stats');
    return response.data.stats;
  },
};

// Add request/response interceptors for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
