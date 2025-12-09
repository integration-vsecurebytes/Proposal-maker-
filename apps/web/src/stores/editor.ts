import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type EditorMode = 'view' | 'edit';

export interface PlacedAsset {
  id: string;
  assetId: string;
  zone: 'cover' | 'header' | 'footer' | 'section';
  sectionIndex?: number;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation?: number;
  opacity?: number;
  zIndex: number;
}

export interface EditorHistory {
  past: PlacedAsset[][];
  present: PlacedAsset[];
  future: PlacedAsset[][];
}

export interface EditorState {
  // Editor mode
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;

  // Asset selection
  selectedAssetId: string | null;
  selectAsset: (id: string | null) => void;

  // Placed assets
  placedAssets: PlacedAsset[];
  addAsset: (asset: PlacedAsset) => void;
  updateAsset: (id: string, updates: Partial<PlacedAsset>) => void;
  removeAsset: (id: string) => void;
  reorderAsset: (id: string, direction: 'up' | 'down') => void;

  // History for undo/redo
  history: EditorHistory;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Toolbar state
  activeTool: 'select' | 'drag' | 'resize' | 'rotate' | null;
  setActiveTool: (tool: 'select' | 'drag' | 'resize' | 'rotate' | null) => void;

  // Sidebar panels
  showAssetBrowser: boolean;
  showDesignPanel: boolean;
  showLayerPanel: boolean;
  toggleAssetBrowser: () => void;
  toggleDesignPanel: () => void;
  toggleLayerPanel: () => void;

  // Saving state
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  markDirty: () => void;
  markClean: () => void;
  setSaving: (saving: boolean) => void;

  // Grid and snap
  gridEnabled: boolean;
  snapEnabled: boolean;
  gridSize: number;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  mode: 'view' as EditorMode,
  selectedAssetId: null,
  placedAssets: [],
  history: {
    past: [],
    present: [],
    future: [],
  },
  activeTool: null,
  showAssetBrowser: false,
  showDesignPanel: false,
  showLayerPanel: false,
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  gridEnabled: true,
  snapEnabled: true,
  gridSize: 8,
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    ...initialState,
    canUndo: false,
    canRedo: false,

    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
        if (mode === 'view') {
          state.selectedAssetId = null;
          state.activeTool = null;
        }
      }),

    selectAsset: (id) =>
      set((state) => {
        state.selectedAssetId = id;
        state.activeTool = id ? 'select' : null;
      }),

    addAsset: (asset) =>
      set((state) => {
        // Save current state to history
        state.history.past.push([...state.placedAssets]);
        state.history.future = [];

        state.placedAssets.push(asset);
        state.history.present = [...state.placedAssets];
        state.isDirty = true;
        state.canUndo = state.history.past.length > 0;
        state.canRedo = false;
      }),

    updateAsset: (id, updates) =>
      set((state) => {
        const index = state.placedAssets.findIndex((a) => a.id === id);
        if (index !== -1) {
          // Save current state to history
          state.history.past.push([...state.placedAssets]);
          state.history.future = [];

          Object.assign(state.placedAssets[index], updates);
          state.history.present = [...state.placedAssets];
          state.isDirty = true;
          state.canUndo = state.history.past.length > 0;
          state.canRedo = false;
        }
      }),

    removeAsset: (id) =>
      set((state) => {
        // Save current state to history
        state.history.past.push([...state.placedAssets]);
        state.history.future = [];

        state.placedAssets = state.placedAssets.filter((a) => a.id !== id);
        state.history.present = [...state.placedAssets];
        state.isDirty = true;
        state.canUndo = state.history.past.length > 0;
        state.canRedo = false;

        if (state.selectedAssetId === id) {
          state.selectedAssetId = null;
        }
      }),

    reorderAsset: (id, direction) =>
      set((state) => {
        const index = state.placedAssets.findIndex((a) => a.id === id);
        if (index === -1) return;

        // Save current state to history
        state.history.past.push([...state.placedAssets]);
        state.history.future = [];

        const asset = state.placedAssets[index];
        if (direction === 'up' && asset.zIndex < 100) {
          asset.zIndex++;
        } else if (direction === 'down' && asset.zIndex > 0) {
          asset.zIndex--;
        }

        state.history.present = [...state.placedAssets];
        state.isDirty = true;
        state.canUndo = state.history.past.length > 0;
        state.canRedo = false;
      }),

    undo: () =>
      set((state) => {
        if (state.history.past.length === 0) return;

        const previous = state.history.past.pop()!;
        state.history.future.unshift([...state.placedAssets]);
        state.placedAssets = previous;
        state.history.present = previous;
        state.canUndo = state.history.past.length > 0;
        state.canRedo = true;
        state.isDirty = true;
      }),

    redo: () =>
      set((state) => {
        if (state.history.future.length === 0) return;

        const next = state.history.future.shift()!;
        state.history.past.push([...state.placedAssets]);
        state.placedAssets = next;
        state.history.present = next;
        state.canUndo = true;
        state.canRedo = state.history.future.length > 0;
        state.isDirty = true;
      }),

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
      }),

    toggleAssetBrowser: () =>
      set((state) => {
        state.showAssetBrowser = !state.showAssetBrowser;
      }),

    toggleDesignPanel: () =>
      set((state) => {
        state.showDesignPanel = !state.showDesignPanel;
      }),

    toggleLayerPanel: () =>
      set((state) => {
        state.showLayerPanel = !state.showLayerPanel;
      }),

    markDirty: () =>
      set((state) => {
        state.isDirty = true;
      }),

    markClean: () =>
      set((state) => {
        state.isDirty = false;
        state.lastSaved = new Date();
      }),

    setSaving: (saving) =>
      set((state) => {
        state.isSaving = saving;
      }),

    toggleGrid: () =>
      set((state) => {
        state.gridEnabled = !state.gridEnabled;
      }),

    toggleSnap: () =>
      set((state) => {
        state.snapEnabled = !state.snapEnabled;
      }),

    setGridSize: (size) =>
      set((state) => {
        state.gridSize = size;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, {
          ...initialState,
          canUndo: false,
          canRedo: false,
        });
      }),
  }))
);
