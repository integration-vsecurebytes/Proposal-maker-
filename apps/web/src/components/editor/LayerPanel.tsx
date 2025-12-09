'use client';

import { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Image,
  Type,
  Square,
  Circle,
} from 'lucide-react';

export interface Layer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape' | 'background';
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
}

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId?: string;
  onLayersChange: (layers: Layer[]) => void;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
}

export default function LayerPanel({
  layers,
  selectedLayerId,
  onLayersChange,
  onSelectLayer,
  onDeleteLayer,
}: LayerPanelProps) {
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'shape':
        return <Square className="h-4 w-4" />;
      case 'background':
        return <Circle className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const toggleVisibility = (layerId: string) => {
    const updatedLayers = layers.map((layer) =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    onLayersChange(updatedLayers);
  };

  const toggleLock = (layerId: string) => {
    const updatedLayers = layers.map((layer) =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    );
    onLayersChange(updatedLayers);
  };

  const updateOpacity = (layerId: string, opacity: number) => {
    const updatedLayers = layers.map((layer) =>
      layer.id === layerId ? { ...layer, opacity } : layer
    );
    onLayersChange(updatedLayers);
  };

  const moveLayerUp = (layerId: string) => {
    const layerIndex = layers.findIndex((l) => l.id === layerId);
    if (layerIndex > 0) {
      const newLayers = [...layers];
      [newLayers[layerIndex], newLayers[layerIndex - 1]] = [
        newLayers[layerIndex - 1],
        newLayers[layerIndex],
      ];
      // Update z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = newLayers.length - index;
      });
      onLayersChange(newLayers);
    }
  };

  const moveLayerDown = (layerId: string) => {
    const layerIndex = layers.findIndex((l) => l.id === layerId);
    if (layerIndex < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[layerIndex], newLayers[layerIndex + 1]] = [
        newLayers[layerIndex + 1],
        newLayers[layerIndex],
      ];
      // Update z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = newLayers.length - index;
      });
      onLayersChange(newLayers);
    }
  };

  const handleReorder = (newLayers: Layer[]) => {
    // Update z-index based on position in array
    const updatedLayers = newLayers.map((layer, index) => ({
      ...layer,
      zIndex: newLayers.length - index,
    }));
    onLayersChange(updatedLayers);
  };

  // Sort layers by z-index (highest first)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
          <span className="text-xs text-gray-500">({layers.length})</span>
        </div>
      </div>

      {/* Layers List */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No layers yet</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={sortedLayers}
            onReorder={handleReorder}
            className="space-y-1"
          >
            <AnimatePresence>
              {sortedLayers.map((layer) => (
                <Reorder.Item key={layer.id} value={layer} className="list-none">
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`group relative rounded-lg border transition-all ${
                      selectedLayerId === layer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Main Layer Row */}
                    <div className="flex items-center gap-2 p-2">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </div>

                      {/* Layer Icon */}
                      <div
                        className={`flex-shrink-0 ${
                          layer.visible ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      >
                        {getLayerIcon(layer.type)}
                      </div>

                      {/* Layer Name */}
                      <button
                        onClick={() => onSelectLayer(layer.id)}
                        className="flex-1 text-left"
                      >
                        <span
                          className={`text-sm font-medium ${
                            layer.visible ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {layer.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">z-index: {layer.zIndex}</span>
                          {layer.opacity < 100 && (
                            <span className="text-xs text-gray-500">{layer.opacity}%</span>
                          )}
                        </div>
                      </button>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Move Up/Down */}
                        <button
                          onClick={() => moveLayerUp(layer.id)}
                          disabled={sortedLayers[0].id === layer.id}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => moveLayerDown(layer.id)}
                          disabled={sortedLayers[sortedLayers.length - 1].id === layer.id}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3 text-gray-600" />
                        </button>

                        {/* Visibility Toggle */}
                        <button
                          onClick={() => toggleVisibility(layer.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={layer.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {layer.visible ? (
                            <Eye className="h-3 w-3 text-gray-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          )}
                        </button>

                        {/* Lock Toggle */}
                        <button
                          onClick={() => toggleLock(layer.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                        >
                          {layer.locked ? (
                            <Lock className="h-3 w-3 text-orange-600" />
                          ) : (
                            <Unlock className="h-3 w-3 text-gray-600" />
                          )}
                        </button>

                        {/* Expand/Collapse */}
                        <button
                          onClick={() =>
                            setExpandedLayerId(expandedLayerId === layer.id ? null : layer.id)
                          }
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Layer settings"
                        >
                          <svg
                            className={`h-3 w-3 text-gray-600 transition-transform ${
                              expandedLayerId === layer.id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteLayer(layer.id)}
                          className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete layer"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Settings */}
                    <AnimatePresence>
                      {expandedLayerId === layer.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200 overflow-hidden"
                        >
                          <div className="p-3 space-y-3">
                            {/* Opacity Slider */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-gray-700">
                                  Opacity
                                </label>
                                <span className="text-xs text-gray-500">{layer.opacity}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={layer.opacity}
                                onChange={(e) => updateOpacity(layer.id, parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                disabled={layer.locked}
                              />
                            </div>

                            {/* Layer Info */}
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Type:</span>
                                <span className="font-medium capitalize">{layer.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span className="font-medium">
                                  {layer.locked ? 'Locked' : 'Unlocked'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* Footer Actions */}
      {layers.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <button
              onClick={() => {
                const updatedLayers = layers.map((layer) => ({ ...layer, visible: true }));
                onLayersChange(updatedLayers);
              }}
              className="hover:text-gray-900 px-2 py-1 hover:bg-gray-200 rounded"
            >
              Show All
            </button>
            <button
              onClick={() => {
                const updatedLayers = layers.map((layer) => ({ ...layer, locked: false }));
                onLayersChange(updatedLayers);
              }}
              className="hover:text-gray-900 px-2 py-1 hover:bg-gray-200 rounded"
            >
              Unlock All
            </button>
            <button
              onClick={() => {
                const updatedLayers = layers.map((layer) => ({ ...layer, opacity: 100 }));
                onLayersChange(updatedLayers);
              }}
              className="hover:text-gray-900 px-2 py-1 hover:bg-gray-200 rounded"
            >
              Reset Opacity
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
