/**
 * PaletteSelector Component
 * Browse and apply 50 curated color palettes with live preview
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Check,
  Download,
  Eye,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  colorPalettes,
  getPalettesByCategory,
  getPalettesByUseCase,
  type ColorPalette,
  type PaletteCategory,
  paletteCategories,
} from '@/data/colorPalettes';

interface PaletteSelectorProps {
  onApplyPalette: (palette: ColorPalette) => void;
  currentPaletteId?: string;
  showPreview?: boolean;
}

export default function PaletteSelector({
  onApplyPalette,
  currentPaletteId,
  showPreview = true,
}: PaletteSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Filter palettes
  const filteredPalettes = colorPalettes.filter((palette) => {
    const matchesCategory = selectedCategory === 'all' || palette.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      palette.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      palette.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      palette.useCases.some((uc) => uc.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleApply = (palette: ColorPalette) => {
    onApplyPalette(palette);
    setSelectedPalette(palette);
  };

  const exportPalette = (palette: ColorPalette) => {
    const data = JSON.stringify(palette, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${palette.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-8 h-8 text-indigo-600" />
            Color Palettes
          </h2>
          <p className="text-gray-600 mt-1">50 professional palettes for your proposals</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>All palettes are WCAG AA compliant</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search palettes by name, description, or use case..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({colorPalettes.length})
          </button>
          {paletteCategories.map((category) => {
            const count = getPalettesByCategory(category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={category.description}
              >
                {category.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredPalettes.length === colorPalettes.length
          ? `Showing all ${colorPalettes.length} palettes`
          : `Found ${filteredPalettes.length} palette${filteredPalettes.length !== 1 ? 's' : ''}`}
      </div>

      {/* Palette Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPalettes.map((palette) => (
            <motion.div
              key={palette.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                currentPaletteId === palette.id
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Color Swatches */}
              <div className="grid grid-cols-5 h-20">
                <div
                  style={{ backgroundColor: palette.primary }}
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleCopyColor(palette.primary)}
                  title={`Primary: ${palette.primary}`}
                />
                <div
                  style={{ backgroundColor: palette.secondary }}
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleCopyColor(palette.secondary)}
                  title={`Secondary: ${palette.secondary}`}
                />
                <div
                  style={{ backgroundColor: palette.accent }}
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleCopyColor(palette.accent)}
                  title={`Accent: ${palette.accent}`}
                />
                <div
                  style={{ backgroundColor: palette.success }}
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleCopyColor(palette.success)}
                  title={`Success: ${palette.success}`}
                />
                <div
                  style={{ backgroundColor: palette.warning }}
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleCopyColor(palette.warning)}
                  title={`Warning: ${palette.warning}`}
                />
              </div>

              {/* Palette Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{palette.name}</h3>
                    <span className="text-xs text-gray-500 capitalize">{palette.category}</span>
                  </div>
                  {currentPaletteId === palette.id && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{palette.description}</p>

                {/* Use Cases */}
                <div className="flex flex-wrap gap-1">
                  {palette.useCases.slice(0, 3).map((useCase) => (
                    <span
                      key={useCase}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {useCase}
                    </span>
                  ))}
                  {palette.useCases.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{palette.useCases.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApply(palette)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <Check className="w-4 h-4" />
                    {currentPaletteId === palette.id ? 'Applied' : 'Apply'}
                  </button>
                  <button
                    onClick={() => setSelectedPalette(palette)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportPalette(palette)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Export JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredPalettes.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No palettes found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or search query
          </p>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedPalette(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Preview Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPalette.name}</h3>
                  <button
                    onClick={() => setSelectedPalette(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600">{selectedPalette.description}</p>
              </div>

              {/* Full Color Grid */}
              <div className="p-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Complete Color Palette</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Primary', color: selectedPalette.primary },
                    { label: 'Secondary', color: selectedPalette.secondary },
                    { label: 'Accent', color: selectedPalette.accent },
                    { label: 'Success', color: selectedPalette.success },
                    { label: 'Warning', color: selectedPalette.warning },
                    { label: 'Error', color: selectedPalette.error },
                    { label: 'Background', color: selectedPalette.background },
                    { label: 'Surface', color: selectedPalette.surface },
                    { label: 'Text', color: selectedPalette.text },
                    { label: 'Text Secondary', color: selectedPalette.textSecondary },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: color }}
                        className="w-16 h-16 rounded-lg shadow-md cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => handleCopyColor(color)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{label}</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-600">{color}</code>
                          {copiedColor === color ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <button
                              onClick={() => handleCopyColor(color)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Preview */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Live Proposal Preview</h4>
                  <div
                    style={{
                      backgroundColor: selectedPalette.background,
                      color: selectedPalette.text,
                    }}
                    className="rounded-lg border-2 border-gray-200 overflow-hidden"
                  >
                    {/* Header */}
                    <div
                      style={{ backgroundColor: selectedPalette.primary }}
                      className="p-6 text-white"
                    >
                      <h2 className="text-3xl font-bold mb-2">Your Proposal Title</h2>
                      <p className="opacity-90">Professional business proposal design</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div
                        style={{
                          backgroundColor: selectedPalette.surface,
                          color: selectedPalette.text,
                        }}
                        className="p-4 rounded-lg"
                      >
                        <h3 className="text-xl font-semibold mb-2">Section Title</h3>
                        <p style={{ color: selectedPalette.textSecondary }}>
                          This is how your proposal content will look with this color palette. The
                          text remains readable and the design stays professional.
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <button
                          style={{ backgroundColor: selectedPalette.primary }}
                          className="px-6 py-2 text-white rounded-lg font-medium"
                        >
                          Primary Action
                        </button>
                        <button
                          style={{
                            backgroundColor: selectedPalette.secondary,
                            color: '#FFFFFF',
                          }}
                          className="px-6 py-2 rounded-lg font-medium"
                        >
                          Secondary
                        </button>
                        <button
                          style={{
                            backgroundColor: selectedPalette.accent,
                            color: '#FFFFFF',
                          }}
                          className="px-6 py-2 rounded-lg font-medium"
                        >
                          Accent
                        </button>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            style={{ backgroundColor: selectedPalette.success }}
                            className="w-3 h-3 rounded-full"
                          />
                          <span className="text-sm">Success</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            style={{ backgroundColor: selectedPalette.warning }}
                            className="w-3 h-3 rounded-full"
                          />
                          <span className="text-sm">Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            style={{ backgroundColor: selectedPalette.error }}
                            className="w-3 h-3 rounded-full"
                          />
                          <span className="text-sm">Error</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => {
                    handleApply(selectedPalette);
                    setSelectedPalette(null);
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                >
                  Apply This Palette
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Notification */}
      <AnimatePresence>
        {copiedColor && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span>
              Copied <code className="font-mono">{copiedColor}</code> to clipboard
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
