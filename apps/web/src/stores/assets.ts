import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface GraphicAsset {
  id: string;
  name: string;
  category: 'illustration' | 'icon' | 'pattern' | 'decorative';
  style: 'flat' | 'isometric' | 'line' | '3d' | 'hand-drawn';
  tags: string[];
  file_path: string;
  preview_url?: string;
  color_palette?: Array<{ color: string; percentage: number }>;
  industry_tags: string[];
  usage_count: number;
  created_at: Date;
}

export interface AssetFilters {
  category?: 'illustration' | 'icon' | 'pattern' | 'decorative' | null;
  style?: 'flat' | 'isometric' | 'line' | '3d' | 'hand-drawn' | null;
  industry?: string | null;
  colorFilter?: string | null;
}

export interface AssetsState {
  // Graphics library
  graphics: GraphicAsset[];
  isLoading: boolean;
  error: string | null;

  // Search and filters
  searchQuery: string;
  filters: AssetFilters;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<AssetFilters>) => void;
  clearFilters: () => void;

  // Favorites and recents
  favorites: string[]; // Asset IDs
  recents: string[]; // Asset IDs
  addToFavorites: (assetId: string) => void;
  removeFromFavorites: (assetId: string) => void;
  addToRecents: (assetId: string) => void;

  // Asset operations
  loadGraphics: (graphics: GraphicAsset[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Filtered results
  getFilteredGraphics: () => GraphicAsset[];
  getFavoriteGraphics: () => GraphicAsset[];
  getRecentGraphics: () => GraphicAsset[];

  // Selected asset for preview
  selectedAsset: GraphicAsset | null;
  setSelectedAsset: (asset: GraphicAsset | null) => void;

  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
}

const MAX_RECENTS = 20;

export const useAssetsStore = create<AssetsState>()(
  immer((set, get) => ({
    graphics: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    filters: {},
    favorites: [],
    recents: [],
    selectedAsset: null,
    isUploading: false,
    uploadProgress: 0,
    currentPage: 1,
    itemsPerPage: 24,
    totalItems: 0,

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
        state.currentPage = 1; // Reset to first page on search
      }),

    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters);
        state.currentPage = 1; // Reset to first page on filter change
      }),

    clearFilters: () =>
      set((state) => {
        state.filters = {};
        state.searchQuery = '';
        state.currentPage = 1;
      }),

    addToFavorites: (assetId) =>
      set((state) => {
        if (!state.favorites.includes(assetId)) {
          state.favorites.push(assetId);
        }
      }),

    removeFromFavorites: (assetId) =>
      set((state) => {
        state.favorites = state.favorites.filter((id) => id !== assetId);
      }),

    addToRecents: (assetId) =>
      set((state) => {
        // Remove if already exists
        state.recents = state.recents.filter((id) => id !== assetId);
        // Add to beginning
        state.recents.unshift(assetId);
        // Keep only MAX_RECENTS items
        if (state.recents.length > MAX_RECENTS) {
          state.recents = state.recents.slice(0, MAX_RECENTS);
        }
      }),

    loadGraphics: (graphics) =>
      set((state) => {
        state.graphics = graphics;
        state.isLoading = false;
        state.error = null;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
        state.isLoading = false;
      }),

    getFilteredGraphics: () => {
      const state = get();
      let filtered = [...state.graphics];

      // Apply search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (asset) =>
            asset.name.toLowerCase().includes(query) ||
            asset.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            asset.industry_tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      // Apply category filter
      if (state.filters.category) {
        filtered = filtered.filter(
          (asset) => asset.category === state.filters.category
        );
      }

      // Apply style filter
      if (state.filters.style) {
        filtered = filtered.filter(
          (asset) => asset.style === state.filters.style
        );
      }

      // Apply industry filter
      if (state.filters.industry) {
        filtered = filtered.filter((asset) =>
          asset.industry_tags.includes(state.filters.industry!)
        );
      }

      // Apply color filter
      if (state.filters.colorFilter) {
        filtered = filtered.filter(
          (asset) =>
            asset.color_palette &&
            asset.color_palette.some((c) =>
              c.color.toLowerCase().includes(state.filters.colorFilter!.toLowerCase())
            )
        );
      }

      // Sort by usage count (most used first)
      filtered.sort((a, b) => b.usage_count - a.usage_count);

      return filtered;
    },

    getFavoriteGraphics: () => {
      const state = get();
      return state.graphics.filter((asset) =>
        state.favorites.includes(asset.id)
      );
    },

    getRecentGraphics: () => {
      const state = get();
      return state.recents
        .map((id) => state.graphics.find((asset) => asset.id === id))
        .filter(Boolean) as GraphicAsset[];
    },

    setSelectedAsset: (asset) =>
      set((state) => {
        state.selectedAsset = asset;
        if (asset) {
          // Add to recents when previewing
          if (!state.recents.includes(asset.id)) {
            state.recents.unshift(asset.id);
            if (state.recents.length > MAX_RECENTS) {
              state.recents = state.recents.slice(0, MAX_RECENTS);
            }
          }
        }
      }),

    setUploading: (uploading) =>
      set((state) => {
        state.isUploading = uploading;
        if (!uploading) {
          state.uploadProgress = 0;
        }
      }),

    setUploadProgress: (progress) =>
      set((state) => {
        state.uploadProgress = progress;
      }),

    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
      }),

    setItemsPerPage: (items) =>
      set((state) => {
        state.itemsPerPage = items;
        state.currentPage = 1; // Reset to first page
      }),

    setTotalItems: (total) =>
      set((state) => {
        state.totalItems = total;
      }),
  }))
);
