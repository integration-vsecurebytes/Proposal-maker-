'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Copy, Check } from 'lucide-react';
import AIPaletteGenerator from '../ai/AIPaletteGenerator';

interface AIColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  logoColors?: string[];
  industry?: string;
  tone?: string;
  showAIOption?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Deep Orange
];

export default function AIColorPicker({
  value,
  onChange,
  label = 'Color',
  logoColors = ['#3B82F6'],
  industry = 'technology',
  tone = 'professional',
  showAIOption = true,
}: AIColorPickerProps) {
  const [showAIPalettes, setShowAIPalettes] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Current Color Display */}
      <div className="flex items-center gap-3">
        {/* Color Swatch */}
        <div className="relative">
          <div
            className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
            style={{ backgroundColor: value }}
            onClick={() => document.getElementById('color-input')?.click()}
          />
          <input
            id="color-input"
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {/* Color Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="#3B82F6"
            />
            <button
              onClick={() => handleCopyColor(value)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy color code"
            >
              {copiedColor === value ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <p className="text-xs text-gray-600 mb-2">Quick Colors</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                value === color
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* AI Palette Generator Toggle */}
      {showAIOption && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={() => setShowAIPalettes(!showAIPalettes)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">
                Generate AI Color Palettes
              </span>
            </div>
            <span className="text-xs text-purple-600">
              {showAIPalettes ? 'Hide' : 'Show'}
            </span>
          </button>

          {/* AI Palette Generator */}
          <AnimatePresence>
            {showAIPalettes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <AIPaletteGenerator
                    logoColors={logoColors}
                    industry={industry}
                    tone={tone}
                    onSelectPalette={(palette) => {
                      // Apply primary color from palette
                      onChange(palette.primary);
                      setShowAIPalettes(false);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
