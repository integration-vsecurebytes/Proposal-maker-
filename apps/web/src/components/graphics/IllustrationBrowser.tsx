'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAssetsStore, GraphicAsset } from '@/stores/assets';
import AssetDragItem from './AssetDragItem';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CategoryType = 'all' | 'illustration' | 'icon' | 'pattern' | 'decorative';
type StyleType = 'all' | 'flat' | 'isometric' | 'line' | '3d' | 'hand-drawn';

const CATEGORIES: { value: CategoryType; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '🎨' },
  { value: 'illustration', label: 'Illustrations', icon: '🖼️' },
  { value: 'icon', label: 'Icons', icon: '✦' },
  { value: 'pattern', label: 'Patterns', icon: '◈' },
  { value: 'decorative', label: 'Decorative', icon: '✿' },
];

const STYLES: { value: StyleType; label: string }[] = [
  { value: 'all', label: 'All Styles' },
  { value: 'flat', label: 'Flat' },
  { value: 'isometric', label: 'Isometric' },
  { value: 'line', label: 'Line Art' },
  { value: '3d', label: '3D' },
  { value: 'hand-drawn', label: 'Hand Drawn' },
];

const INDUSTRIES = [
  'technology',
  'finance',
  'healthcare',
  'education',
  'marketing',
  'business',
  'ecommerce',
  'real-estate',
];

export default function IllustrationBrowser() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const graphics = useAssetsStore((state) => state.graphics);
  const isLoading = useAssetsStore((state) => state.isLoading);
  const error = useAssetsStore((state) => state.error);
  const searchQuery = useAssetsStore((state) => state.searchQuery);
  const setSearchQuery = useAssetsStore((state) => state.setSearchQuery);
  const setFilters = useAssetsStore((state) => state.setFilters);
  const clearFilters = useAssetsStore((state) => state.clearFilters);
  const getFilteredGraphics = useAssetsStore((state) => state.getFilteredGraphics);
  const currentPage = useAssetsStore((state) => state.currentPage);
  const itemsPerPage = useAssetsStore((state) => state.itemsPerPage);
  const setCurrentPage = useAssetsStore((state) => state.setCurrentPage);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Apply filters when selection changes
  useEffect(() => {
    setFilters({
      category: selectedCategory === 'all' ? null : selectedCategory,
      style: selectedStyle === 'all' ? null : selectedStyle,
      industry: selectedIndustry === 'all' ? null : selectedIndustry,
    });
  }, [selectedCategory, selectedStyle, selectedIndustry, setFilters]);

  const filteredGraphics = useMemo(() => {
    return getFilteredGraphics();
  }, [getFilteredGraphics, searchQuery, selectedCategory, selectedStyle, selectedIndustry]);

  // Pagination
  const paginatedGraphics = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGraphics.slice(start, start + itemsPerPage);
  }, [filteredGraphics, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredGraphics.length / itemsPerPage);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedStyle('all');
    setSelectedIndustry('all');
    setLocalSearch('');
    clearFilters();
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedStyle !== 'all' ||
    selectedIndustry !== 'all' ||
    searchQuery !== '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 p-4 border-b border-gray-200 bg-white">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search graphics..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
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
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        {/* Filter Toggle & Active Filters */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Style Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as StyleType)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Industry
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Industries</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {filteredGraphics.length} {filteredGraphics.length === 1 ? 'asset' : 'assets'} found
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Graphics Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading graphics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-sm text-gray-700 font-medium">Error loading graphics</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        ) : filteredGraphics.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">🔍</div>
              <p className="text-sm text-gray-700 font-medium">No graphics found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try adjusting your filters or search query
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              {paginatedGraphics.map((asset) => (
                <AssetDragItem key={asset.id} asset={asset} showName={true} size="md" />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Tips */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <span className="font-medium">Tip:</span> Drag assets onto the preview to place them, or{' '}
        <kbd className="px-1 bg-white border border-gray-300 rounded">Ctrl+Click</kbd> to favorite
      </div>
    </div>
  );
}
