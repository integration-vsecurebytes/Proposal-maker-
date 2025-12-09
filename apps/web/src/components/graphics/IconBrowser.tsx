'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Search, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_SETS = [
  { value: 'lucide', label: 'Lucide', count: '1000+' },
  { value: 'heroicons', label: 'Heroicons', count: '300+' },
  { value: 'mdi', label: 'Material Design', count: '7000+' },
  { value: 'ph', label: 'Phosphor', count: '7000+' },
  { value: 'fa6-solid', label: 'Font Awesome', count: '2000+' },
  { value: 'bi', label: 'Bootstrap Icons', count: '2000+' },
  { value: 'solar', label: 'Solar', count: '1000+' },
  { value: 'tabler', label: 'Tabler', count: '4000+' },
];

// Popular icons for each category
const ICON_CATEGORIES = {
  business: [
    'briefcase', 'users', 'chart', 'trending-up', 'target', 'award',
    'dollar-sign', 'percent', 'pie-chart', 'bar-chart', 'calendar', 'file-text',
  ],
  communication: [
    'mail', 'message-square', 'phone', 'video', 'mic', 'headphones',
    'speaker', 'volume', 'bell', 'at-sign', 'message-circle', 'send',
  ],
  media: [
    'image', 'camera', 'video', 'film', 'music', 'play',
    'pause', 'stop', 'skip-forward', 'skip-back', 'volume-2', 'mic',
  ],
  ui: [
    'home', 'search', 'settings', 'menu', 'x', 'check',
    'plus', 'minus', 'edit', 'trash', 'eye', 'eye-off',
  ],
  arrows: [
    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
    'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
    'corner-down-right', 'external-link', 'link', 'move',
  ],
  files: [
    'file', 'folder', 'file-text', 'download', 'upload', 'save',
    'archive', 'copy', 'clipboard', 'paperclip', 'book', 'bookmark',
  ],
};

export default function IconBrowser() {
  const [selectedSet, setSelectedSet] = useState('lucide');
  const [selectedCategory, setSelectedCategory] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [iconSize, setIconSize] = useState(24);
  const [iconColor, setIconColor] = useState('#3B82F6');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const currentIcons = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] || [];

  const filteredIcons = searchQuery
    ? currentIcons.filter((icon) => icon.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentIcons;

  const handleCopyIcon = (icon: string) => {
    const iconName = `${selectedSet}:${icon}`;
    navigator.clipboard.writeText(iconName);
    setCopiedIcon(iconName);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Icon Library</h3>
          <span className="text-xs text-gray-500">200,000+ icons</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search icons..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Icon Set Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Icon Set
          </label>
          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ICON_SETS.map((set) => (
              <option key={set.value} value={set.value}>
                {set.label} ({set.count})
              </option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.keys(ICON_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredIcons.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">🔍</div>
              <p className="text-sm text-gray-700 font-medium">No icons found</p>
              <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-3">
            {filteredIcons.map((icon) => {
              const iconName = `${selectedSet}:${icon}`;
              const isSelected = selectedIcon === iconName;
              const isCopied = copiedIcon === iconName;

              return (
                <motion.button
                  key={iconName}
                  onClick={() => setSelectedIcon(isSelected ? null : iconName)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all group ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400 bg-white'
                  }`}
                >
                  <Icon icon={iconName} width={32} height={32} style={{ color: isSelected ? iconColor : '#6B7280' }} />
                  <p className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                    {icon}
                  </p>

                  {/* Copy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyIcon(icon);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-600" />
                    )}
                  </button>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customization Panel */}
      {selectedIcon && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Customize Icon
            </h4>
            <button
              onClick={() => setSelectedIcon(null)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center p-6 bg-white rounded-lg border-2 border-gray-300">
            <Icon icon={selectedIcon} width={iconSize} height={iconSize} style={{ color: iconColor }} />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Size Slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Size: {iconSize}px
            </label>
            <input
              type="range"
              min="16"
              max="96"
              step="4"
              value={iconSize}
              onChange={(e) => setIconSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCopyIcon(selectedIcon.split(':')[1])}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              {copiedIcon === selectedIcon ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Name
                </>
              )}
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                // TODO: Add icon to proposal
                alert('Icon placement will be implemented in the next phase');
              }}
            >
              Add to Proposal
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-white text-xs text-gray-600">
        <span className="font-medium">Powered by Iconify</span> • 200K+ icons from 150+ icon sets
      </div>
    </div>
  );
}
