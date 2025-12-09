'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Pattern {
  id: string;
  name: string;
  svg: string;
  category: 'geometric' | 'organic' | 'tech' | 'abstract' | 'minimal';
}

// Sample patterns (in production, these would come from API)
const PATTERNS: Pattern[] = [
  {
    id: 'dots-1',
    name: 'Polka Dots',
    category: 'minimal',
    svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.3"/></svg>`,
  },
  {
    id: 'grid-1',
    name: 'Grid Lines',
    category: 'geometric',
    svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 0 20 M 20 0 L 20 20 M 0 0 L 20 0 M 0 20 L 20 20" stroke="currentColor" stroke-width="0.5" opacity="0.2" fill="none"/></svg>`,
  },
  {
    id: 'diagonal-1',
    name: 'Diagonal Stripes',
    category: 'geometric',
    svg: `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="currentColor" stroke-width="1" opacity="0.1"/></svg>`,
  },
  {
    id: 'hexagon-1',
    name: 'Hexagons',
    category: 'geometric',
    svg: `<svg width="28" height="49" xmlns="http://www.w3.org/2000/svg"><path d="M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z" fill="currentColor" opacity="0.15"/></svg>`,
  },
  {
    id: 'waves-1',
    name: 'Waves',
    category: 'organic',
    svg: `<svg width="100" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10" stroke="currentColor" fill="none" opacity="0.2"/></svg>`,
  },
  {
    id: 'circuit-1',
    name: 'Circuit',
    category: 'tech',
    svg: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.3"/><line x1="5" y1="5" x2="35" y2="35" stroke="currentColor" opacity="0.2"/><circle cx="35" cy="35" r="2" fill="currentColor" opacity="0.3"/></svg>`,
  },
];

// Generate more patterns programmatically
const generatePatterns = (): Pattern[] => {
  const basePatterns = [...PATTERNS];

  // Add variations
  for (let i = 0; i < 44; i++) {
    const basePattern = PATTERNS[i % PATTERNS.length];
    basePatterns.push({
      ...basePattern,
      id: `${basePattern.id}-var${i}`,
      name: `${basePattern.name} ${i + 2}`,
    });
  }

  return basePatterns;
};

const ALL_PATTERNS = generatePatterns();

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'organic', label: 'Organic' },
  { value: 'tech', label: 'Tech' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'minimal', label: 'Minimal' },
];

export default function PatternLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternColor, setPatternColor] = useState('#3B82F6');
  const [patternOpacity, setPatternOpacity] = useState(0.3);
  const [patternScale, setPatternScale] = useState(1);

  const filteredPatterns =
    selectedCategory === 'all'
      ? ALL_PATTERNS
      : ALL_PATTERNS.filter((p) => p.category === selectedCategory);

  const generatePatternDataURL = (pattern: Pattern) => {
    const svg = pattern.svg.replace(/currentColor/g, patternColor);
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Pattern Library</h3>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-600">
          {filteredPatterns.length} patterns available
        </p>
      </div>

      {/* Pattern Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-3">
          {filteredPatterns.map((pattern) => (
            <motion.button
              key={pattern.id}
              onClick={() => setSelectedPattern(pattern)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                selectedPattern?.id === pattern.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-400'
              }`}
              style={{
                backgroundImage: `url("${generatePatternDataURL(pattern)}")`,
                backgroundSize: `${20 * patternScale}px`,
                backgroundRepeat: 'repeat',
                opacity: patternOpacity,
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-end">
                <div className="w-full p-1.5 bg-white bg-opacity-90">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {pattern.name}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Customization Panel */}
      {selectedPattern && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Customize: {selectedPattern.name}
            </h4>
            <button
              onClick={() => setSelectedPattern(null)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>

          {/* Preview */}
          <div
            className="w-full h-24 rounded-lg border-2 border-gray-300"
            style={{
              backgroundImage: `url("${generatePatternDataURL(selectedPattern)}")`,
              backgroundSize: `${20 * patternScale}px`,
              backgroundRepeat: 'repeat',
              opacity: patternOpacity,
            }}
          />

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={patternColor}
                onChange={(e) => setPatternColor(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={patternColor}
                onChange={(e) => setPatternColor(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Opacity: {Math.round(patternOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={patternOpacity}
              onChange={(e) => setPatternOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Scale Slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Scale: {patternScale}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={patternScale}
              onChange={(e) => setPatternScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Apply Button */}
          <button
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              // TODO: Apply pattern to selected drop zone
              alert('Pattern application will be implemented in the next phase');
            }}
          >
            Apply Pattern
          </button>
        </div>
      )}
    </div>
  );
}
