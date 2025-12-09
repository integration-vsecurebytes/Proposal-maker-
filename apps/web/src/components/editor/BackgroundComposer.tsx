'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Image as ImageIcon, Sparkles, Plus, Trash2, Copy } from 'lucide-react';
import AIBackgroundGenerator from '../ai/AIBackgroundGenerator';

export type BackgroundType = 'solid' | 'gradient' | 'pattern' | 'image';
export type GradientType = 'linear' | 'radial' | 'conic';

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface BackgroundConfig {
  type: BackgroundType;
  solidColor?: string;
  gradient?: {
    type: GradientType;
    angle?: number; // 0-360 for linear
    stops: GradientStop[];
  };
  patternUrl?: string;
  imageUrl?: string;
  opacity: number; // 0-1
  blendMode?: string;
}

interface BackgroundComposerProps {
  background: BackgroundConfig;
  onChange: (background: BackgroundConfig) => void;
}

const PRESET_GRADIENTS = [
  {
    name: 'Ocean Blue',
    stops: [
      { color: '#00B4DB', position: 0 },
      { color: '#0083B0', position: 100 },
    ],
  },
  {
    name: 'Sunset',
    stops: [
      { color: '#FF512F', position: 0 },
      { color: '#DD2476', position: 100 },
    ],
  },
  {
    name: 'Purple Dream',
    stops: [
      { color: '#C471F5', position: 0 },
      { color: '#FA71CD', position: 100 },
    ],
  },
  {
    name: 'Green Forest',
    stops: [
      { color: '#134E5E', position: 0 },
      { color: '#71B280', position: 100 },
    ],
  },
  {
    name: 'Warm Flame',
    stops: [
      { color: '#FF9A56', position: 0 },
      { color: '#FF6A00', position: 100 },
    ],
  },
  {
    name: 'Cool Blues',
    stops: [
      { color: '#2193b0', position: 0 },
      { color: '#6dd5ed', position: 100 },
    ],
  },
];

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'soft-light',
  'hard-light',
];

export default function BackgroundComposer({
  background,
  onChange,
}: BackgroundComposerProps) {
  const [activeTab, setActiveTab] = useState<BackgroundType | 'ai'>(background.type);

  const handleTypeChange = (type: BackgroundType) => {
    setActiveTab(type);
    onChange({ ...background, type });
  };

  const handleSolidColorChange = (color: string) => {
    onChange({ ...background, solidColor: color });
  };

  const handleGradientTypeChange = (type: GradientType) => {
    onChange({
      ...background,
      gradient: {
        ...background.gradient!,
        type,
      },
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    onChange({
      ...background,
      gradient: {
        ...background.gradient!,
        angle,
      },
    });
  };

  const handleAddGradientStop = () => {
    const stops = background.gradient?.stops || [];
    const newStop: GradientStop = {
      color: '#3B82F6',
      position: 50,
    };
    onChange({
      ...background,
      gradient: {
        ...background.gradient!,
        stops: [...stops, newStop],
      },
    });
  };

  const handleUpdateGradientStop = (index: number, stop: Partial<GradientStop>) => {
    const stops = [...(background.gradient?.stops || [])];
    stops[index] = { ...stops[index], ...stop };
    onChange({
      ...background,
      gradient: {
        ...background.gradient!,
        stops,
      },
    });
  };

  const handleRemoveGradientStop = (index: number) => {
    const stops = background.gradient?.stops.filter((_, i) => i !== index) || [];
    onChange({
      ...background,
      gradient: {
        ...background.gradient!,
        stops,
      },
    });
  };

  const handleApplyPreset = (preset: typeof PRESET_GRADIENTS[0]) => {
    onChange({
      ...background,
      gradient: {
        type: 'linear',
        angle: 135,
        stops: preset.stops,
      },
    });
  };

  const handleOpacityChange = (opacity: number) => {
    onChange({ ...background, opacity });
  };

  const handleBlendModeChange = (blendMode: string) => {
    onChange({ ...background, blendMode });
  };

  const generateGradientCSS = (): string => {
    if (!background.gradient) return '';

    const { type, angle = 135, stops } = background.gradient;
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const colorStops = sortedStops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${colorStops})`;
    } else if (type === 'radial') {
      return `radial-gradient(circle, ${colorStops})`;
    } else {
      return `conic-gradient(from ${angle}deg, ${colorStops})`;
    }
  };

  const getBackgroundPreview = (): string => {
    switch (background.type) {
      case 'solid':
        return background.solidColor || '#FFFFFF';
      case 'gradient':
        return generateGradientCSS();
      case 'pattern':
        return background.patternUrl
          ? `url(${background.patternUrl})`
          : '#F3F4F6';
      case 'image':
        return background.imageUrl
          ? `url(${background.imageUrl})`
          : '#F3F4F6';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Background Composer
        </h3>
        <p className="text-xs text-gray-500">
          Create custom backgrounds with gradients and patterns
        </p>
      </div>

      {/* Background Type Tabs */}
      <div className="flex-shrink-0 flex gap-1 bg-gray-100 p-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          AI
        </button>
        <button
          onClick={() => handleTypeChange('solid')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeTab === 'solid'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Palette className="h-4 w-4" />
          Solid
        </button>
        <button
          onClick={() => handleTypeChange('gradient')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeTab === 'gradient'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-base">∿</span>
          Gradient
        </button>
        <button
          onClick={() => handleTypeChange('pattern')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeTab === 'pattern'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-base">◈</span>
          Pattern
        </button>
        <button
          onClick={() => handleTypeChange('image')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeTab === 'image'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Tab Content */}
        {activeTab === 'ai' && (
          <AIBackgroundGenerator
            industry="technology"
            tone="professional"
            onGenerate={(bg) => onChange(bg)}
          />
        )}

        {/* Live Preview (show for all tabs except AI) */}
        {activeTab !== 'ai' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Live Preview</label>
            <div
              className="w-full h-40 rounded-lg border-2 border-gray-200 shadow-sm"
              style={{
                background: getBackgroundPreview(),
                opacity: background.opacity,
                mixBlendMode: background.blendMode as any,
              }}
            />
          </div>
        )}

        {/* Solid Color Controls */}
        {activeTab === 'solid' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background.solidColor || '#FFFFFF'}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={background.solidColor || '#FFFFFF'}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        )}

        {/* Gradient Controls */}
        {activeTab === 'gradient' && (
          <div className="space-y-4">
            {/* Gradient Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Gradient Type
              </label>
              <div className="flex gap-2">
                {(['linear', 'radial', 'conic'] as GradientType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleGradientTypeChange(type)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded border transition-colors ${
                      background.gradient?.type === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Angle Control */}
            {(background.gradient?.type === 'linear' ||
              background.gradient?.type === 'conic') && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Angle: {background.gradient?.angle || 135}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={background.gradient?.angle || 135}
                  onChange={(e) => handleGradientAngleChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Preset Gradients */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Preset Gradients
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_GRADIENTS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset)}
                    className="relative h-16 rounded border-2 border-gray-200 hover:border-blue-400 transition-colors overflow-hidden group"
                    style={{
                      background: `linear-gradient(135deg, ${preset.stops
                        .map((s) => `${s.color} ${s.position}%`)
                        .join(', ')})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Stops */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Color Stops ({background.gradient?.stops.length || 0})
                </label>
                <button
                  onClick={handleAddGradientStop}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Stop
                </button>
              </div>
              <div className="space-y-2">
                {background.gradient?.stops.map((stop, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) =>
                        handleUpdateGradientStop(index, { color: e.target.value })
                      }
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) =>
                          handleUpdateGradientStop(index, {
                            position: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Position: {stop.position}%
                      </div>
                    </div>
                    {background.gradient!.stops.length > 2 && (
                      <button
                        onClick={() => handleRemoveGradientStop(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pattern Controls */}
        {activeTab === 'pattern' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Pattern support coming soon. For now, use the Pattern Library in the
              main editor.
            </p>
          </div>
        )}

        {/* Image Controls */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Background Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  SVG, PNG, JPG or GIF (max. 5MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Controls */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          {/* Opacity */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Opacity: {Math.round(background.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={background.opacity * 100}
              onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
              className="w-full"
            />
          </div>

          {/* Blend Mode */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Blend Mode
            </label>
            <select
              value={background.blendMode || 'normal'}
              onChange={(e) => handleBlendModeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Copy CSS */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              const css = getBackgroundPreview();
              navigator.clipboard.writeText(`background: ${css};`);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy CSS
          </button>
        </div>
      </div>
    </div>
  );
}
