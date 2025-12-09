'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/stores/editor';
import { useAssetsStore } from '@/stores/assets';
import { Proposal } from '@shared/types';
import ProposalPreview from '../preview/ProposalPreview';
import IllustrationBrowser from '../graphics/IllustrationBrowser';
import IconBrowser from '../graphics/IconBrowser';
import PatternLibrary from '../graphics/PatternLibrary';
import FavoritesPanel from '../graphics/FavoritesPanel';

interface VisualProposalEditorProps {
  proposal: Proposal;
  onSave?: (data: any) => Promise<void>;
}

type AssetTab = 'favorites' | 'illustrations' | 'icons' | 'patterns';

export default function VisualProposalEditor({
  proposal,
  onSave,
}: VisualProposalEditorProps) {
  const [leftPaneWidth, setLeftPaneWidth] = useState(40); // 40% default
  const [isResizing, setIsResizing] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState<AssetTab>('illustrations');

  const mode = useEditorStore((state) => state.mode);
  const setMode = useEditorStore((state) => state.setMode);
  const isDirty = useEditorStore((state) => state.isDirty);
  const isSaving = useEditorStore((state) => state.isSaving);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const showAssetBrowser = useEditorStore((state) => state.showAssetBrowser);
  const toggleAssetBrowser = useEditorStore((state) => state.toggleAssetBrowser);
  const reset = useEditorStore((state) => state.reset);

  useEffect(() => {
    // Load existing assets when editor mounts
    // TODO: Fetch graphics from API
    return () => {
      // Cleanup: Reset editor state when unmounting
      if (!isDirty) {
        reset();
      }
    };
  }, []);

  const handleToggleEditMode = () => {
    if (mode === 'edit') {
      // Ask for confirmation if there are unsaved changes
      if (isDirty) {
        const confirmed = window.confirm(
          'You have unsaved changes. Do you want to exit edit mode?'
        );
        if (!confirmed) return;
      }
      setMode('view');
    } else {
      setMode('edit');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      const placedAssets = useEditorStore.getState().placedAssets;
      await onSave({ placedAssets });
      useEditorStore.getState().markClean();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;

    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 20% and 60%
    if (newWidth >= 20 && newWidth <= 60) {
      setLeftPaneWidth(newWidth);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mouseup', handleMouseUp as any);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp as any);
      };
    }
  }, [isResizing]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {proposal.title}
          </h2>
          {isDirty && (
            <span className="text-sm text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          {mode === 'edit' && (
            <>
              <button
                onClick={undo}
                disabled={!canUndo}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                ↷ Redo
              </button>
              <div className="h-6 w-px bg-gray-300 mx-2" />
            </>
          )}

          {/* Asset Browser Toggle */}
          {mode === 'edit' && (
            <button
              onClick={toggleAssetBrowser}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                showAssetBrowser
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showAssetBrowser ? 'Hide' : 'Show'} Assets
            </button>
          )}

          {/* Save Button */}
          {mode === 'edit' && isDirty && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}

          {/* Edit Mode Toggle */}
          <button
            onClick={handleToggleEditMode}
            className={`px-4 py-1.5 text-sm font-medium rounded-md ${
              mode === 'edit'
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {mode === 'edit' ? 'Exit Edit Mode' : 'Edit Design'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Left Pane - Editor Controls */}
        {mode === 'edit' && (
          <>
            <div
              className="bg-white border-r border-gray-200 overflow-y-auto"
              style={{ width: `${leftPaneWidth}%` }}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Design Tools
                </h3>

                {showAssetBrowser ? (
                  <div className="space-y-4">
                    {/* Asset Type Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setActiveAssetTab('favorites')}
                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          activeAssetTab === 'favorites'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        ⭐ Favorites
                      </button>
                      <button
                        onClick={() => setActiveAssetTab('illustrations')}
                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          activeAssetTab === 'illustrations'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        🎨 Graphics
                      </button>
                      <button
                        onClick={() => setActiveAssetTab('icons')}
                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          activeAssetTab === 'icons'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        ✦ Icons
                      </button>
                      <button
                        onClick={() => setActiveAssetTab('patterns')}
                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          activeAssetTab === 'patterns'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        ◈ Patterns
                      </button>
                    </div>

                    {/* Asset Browser Content */}
                    <div className="h-[calc(100vh-300px)] border border-gray-200 rounded-lg overflow-hidden">
                      {activeAssetTab === 'favorites' && <FavoritesPanel />}
                      {activeAssetTab === 'illustrations' && <IllustrationBrowser />}
                      {activeAssetTab === 'icons' && <IconBrowser />}
                      {activeAssetTab === 'patterns' && <PatternLibrary />}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <button className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100">
                          Customize Cover Page
                        </button>
                        <button className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100">
                          Add Header/Footer
                        </button>
                        <button className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100">
                          Apply Color Palette
                        </button>
                        <button className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100">
                          Choose Fonts
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Grid & Snap
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useEditorStore.getState().gridEnabled}
                            onChange={() =>
                              useEditorStore.getState().toggleGrid()
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            Show Grid
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useEditorStore.getState().snapEnabled}
                            onChange={() =>
                              useEditorStore.getState().toggleSnap()
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            Snap to Grid
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Layers
                      </h4>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500 text-center">
                          No assets placed yet
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resizable Divider */}
            <div
              className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors"
              onMouseDown={handleMouseDown}
            />
          </>
        )}

        {/* Right Pane - Preview */}
        <div
          className="flex-1 overflow-auto bg-gray-100"
          style={
            mode === 'edit'
              ? { width: `${100 - leftPaneWidth}%` }
              : { width: '100%' }
          }
        >
          <div className="p-6">
            <ProposalPreview proposal={proposal} mode={mode} />
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {mode === 'edit' && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600 print:hidden">
          <span className="font-medium">Shortcuts:</span>{' '}
          <kbd className="px-1 bg-white border border-gray-300 rounded">
            Ctrl+Z
          </kbd>{' '}
          Undo,{' '}
          <kbd className="px-1 bg-white border border-gray-300 rounded">
            Ctrl+Y
          </kbd>{' '}
          Redo,{' '}
          <kbd className="px-1 bg-white border border-gray-300 rounded">
            Ctrl+S
          </kbd>{' '}
          Save
        </div>
      )}
    </div>
  );
}
