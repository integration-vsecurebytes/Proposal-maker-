'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { useEditorStore, PlacedAsset } from '@/stores/editor';
import { motion, AnimatePresence } from 'framer-motion';

export type DropZoneType = 'cover' | 'header' | 'footer' | 'section';

interface AssetDropZoneProps {
  zone: DropZoneType;
  sectionIndex?: number;
  children: ReactNode;
  className?: string;
  showOverlay?: boolean;
}

export default function AssetDropZone({
  zone,
  sectionIndex,
  children,
  className = '',
  showOverlay = true,
}: AssetDropZoneProps) {
  const mode = useEditorStore((state) => state.mode);
  const placedAssets = useEditorStore((state) => state.placedAssets);
  const addAsset = useEditorStore((state) => state.addAsset);
  const updateAsset = useEditorStore((state) => state.updateAsset);
  const selectedAssetId = useEditorStore((state) => state.selectedAssetId);

  const dropZoneId = sectionIndex !== undefined ? `${zone}-${sectionIndex}` : zone;

  const { isOver, setNodeRef } = useDroppable({
    id: dropZoneId,
    data: {
      zone,
      sectionIndex,
    },
  });

  // Find assets placed in this zone
  const zoneAssets = placedAssets.filter((asset) => {
    if (sectionIndex !== undefined) {
      return asset.zone === zone && asset.sectionIndex === sectionIndex;
    }
    return asset.zone === zone;
  });

  // Only show drop zone in edit mode
  if (mode !== 'edit') {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      className={`relative ${className}`}
      data-drop-zone={dropZoneId}
    >
      {children}

      {/* Drop Zone Overlay */}
      {showOverlay && (
        <AnimatePresence>
          {isOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none z-50"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                  Drop asset here
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Edit Mode Indicator - Always visible border when in edit mode */}
      <div
        className={`absolute inset-0 border-2 border-dashed rounded-lg pointer-events-none transition-colors z-40 ${
          isOver
            ? 'border-blue-500'
            : zoneAssets.length > 0
            ? 'border-green-400'
            : 'border-gray-300 opacity-50'
        }`}
      />

      {/* Zone Label */}
      {showOverlay && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 text-xs font-medium text-gray-700 px-2 py-1 rounded shadow-sm z-40">
          {zone === 'cover' && 'Cover Page'}
          {zone === 'header' && 'Header'}
          {zone === 'footer' && 'Footer'}
          {zone === 'section' &&
            `Section ${sectionIndex !== undefined ? sectionIndex + 1 : ''}`}
          {zoneAssets.length > 0 && (
            <span className="ml-1 text-green-600">
              ({zoneAssets.length} asset{zoneAssets.length > 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}

      {/* Placed Assets Preview */}
      {zoneAssets.length > 0 && (
        <div className="absolute top-2 right-2 flex gap-1 z-40">
          {zoneAssets.slice(0, 3).map((asset) => (
            <div
              key={asset.id}
              className={`w-6 h-6 bg-white rounded border-2 shadow-sm cursor-pointer transition-all ${
                selectedAssetId === asset.id
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => useEditorStore.getState().selectAsset(asset.id)}
              title={`Asset ${asset.id.slice(0, 8)}`}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 rounded opacity-75" />
            </div>
          ))}
          {zoneAssets.length > 3 && (
            <div className="w-6 h-6 bg-gray-100 rounded border-2 border-gray-300 flex items-center justify-center text-xs text-gray-600">
              +{zoneAssets.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions on Hover */}
      {zoneAssets.length === 0 && showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-40 pointer-events-none">
          <div className="bg-white shadow-lg rounded-lg p-3 space-y-2 pointer-events-auto">
            <button
              className="w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              onClick={() => {
                // TODO: Open asset browser
                useEditorStore.getState().toggleAssetBrowser();
              }}
            >
              Add Asset
            </button>
            {zone === 'cover' && (
              <button
                className="w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                onClick={() => {
                  // TODO: Open cover page designer
                  alert('Cover page designer coming soon');
                }}
              >
                Design Cover
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
