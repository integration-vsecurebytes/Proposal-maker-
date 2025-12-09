/**
 * FontExplorer Component
 * Browse and apply 30 curated Google Font pairings with live preview
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Check,
  Download,
  Eye,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  fontPairings,
  getFontPairingsByStyle,
  type FontPairing,
  type FontStyle,
  fontStyles,
} from '@/data/fontPairings';
import { preloadFonts } from '@/utils/typography';

interface FontExplorerProps {
  onApplyFont: (pairing: FontPairing) => void;
  currentFontId?: string;
  showPreview?: boolean;
}

export default function FontExplorer({
  onApplyFont,
  currentFontId,
  showPreview = true,
}: FontExplorerProps) {
  const [selectedStyle, setSelectedStyle] = useState<FontStyle | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairing, setSelectedPairing] = useState<FontPairing | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter font pairings
  const filteredPairings = fontPairings.filter((pairing) => {
    const matchesStyle = selectedStyle === 'all' || pairing.style === selectedStyle;
    const matchesSearch =
      searchQuery === '' ||
      pairing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pairing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pairing.heading.font.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pairing.body.font.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pairing.useCases.some((uc) => uc.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStyle && matchesSearch;
  });

  // Load font on hover
  const handleFontHover = async (pairing: FontPairing) => {
    const fontKey = `${pairing.heading.font}-${pairing.body.font}`;
    if (loadedFonts.has(fontKey)) return;

    try {
      await preloadFonts([pairing.heading.googleFontUrl, pairing.body.googleFontUrl]);
      setLoadedFonts((prev) => new Set(prev).add(fontKey));
    } catch (error) {
      console.error('Failed to load fonts:', error);
    }
  };

  const handleCopyCSS = (pairing: FontPairing) => {
    const css = `
/* ${pairing.name} - ${pairing.style} */
@import url('${pairing.heading.googleFontUrl}');
@import url('${pairing.body.googleFontUrl}');

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: '${pairing.heading.font}', ${pairing.heading.fallback};
  font-weight: ${pairing.heading.weights[0]};
}

/* Body text */
body, p {
  font-family: '${pairing.body.font}', ${pairing.body.fallback};
  font-weight: ${pairing.body.weights[0]};
}
`.trim();

    navigator.clipboard.writeText(css);
    setCopiedText(pairing.id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApply = (pairing: FontPairing) => {
    onApplyFont(pairing);
    setSelectedPairing(pairing);
  };

  const exportPairing = (pairing: FontPairing) => {
    const data = JSON.stringify(pairing, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pairing.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Type className="w-8 h-8 text-purple-600" />
            Font Pairings
          </h2>
          <p className="text-gray-600 mt-1">30 professional Google Font combinations</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>All fonts load from Google Fonts CDN</span>
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
            placeholder="Search by name, font family, or use case..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Style Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStyle('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedStyle === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({fontPairings.length})
          </button>
          {fontStyles.map((style) => {
            const count = getFontPairingsByStyle(style.id).length;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedStyle === style.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={style.description}
              >
                {style.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredPairings.length === fontPairings.length
          ? `Showing all ${fontPairings.length} font pairings`
          : `Found ${filteredPairings.length} pairing${filteredPairings.length !== 1 ? 's' : ''}`}
      </div>

      {/* Font Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPairings.map((pairing) => {
            const fontKey = `${pairing.heading.font}-${pairing.body.font}`;
            const isLoaded = loadedFonts.has(fontKey);

            return (
              <motion.div
                key={pairing.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => handleFontHover(pairing)}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                  currentFontId === pairing.id
                    ? 'border-purple-500 ring-2 ring-purple-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Font Preview */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[200px] flex flex-col justify-center">
                  <div
                    style={{
                      fontFamily: isLoaded
                        ? `'${pairing.heading.font}', ${pairing.heading.fallback}`
                        : pairing.heading.fallback,
                      fontWeight: pairing.heading.weights[0],
                      fontSize: '32px',
                      lineHeight: 1.2,
                    }}
                    className="text-gray-900 mb-3"
                  >
                    {pairing.preview.headingSample}
                  </div>
                  <div
                    style={{
                      fontFamily: isLoaded
                        ? `'${pairing.body.font}', ${pairing.body.fallback}`
                        : pairing.body.fallback,
                      fontWeight: pairing.body.weights[0],
                      fontSize: '16px',
                      lineHeight: 1.5,
                    }}
                    className="text-gray-600"
                  >
                    {pairing.preview.bodySample}
                  </div>
                </div>

                {/* Pairing Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{pairing.name}</h3>
                      <span className="text-xs text-gray-500 capitalize">{pairing.style}</span>
                    </div>
                    {currentFontId === pairing.id && (
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{pairing.description}</p>

                  {/* Font Details */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Heading:</span>
                      <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {pairing.heading.font}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Body:</span>
                      <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {pairing.body.font}
                      </code>
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="flex flex-wrap gap-1">
                    {pairing.useCases.slice(0, 3).map((useCase) => (
                      <span
                        key={useCase}
                        className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded"
                      >
                        {useCase}
                      </span>
                    ))}
                    {pairing.useCases.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded">
                        +{pairing.useCases.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApply(pairing)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Check className="w-4 h-4" />
                      {currentFontId === pairing.id ? 'Applied' : 'Apply'}
                    </button>
                    <button
                      onClick={() => setSelectedPairing(pairing)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopyCSS(pairing)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Copy CSS"
                    >
                      {copiedText === pairing.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredPairings.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No font pairings found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedPairing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedPairing(null)}
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
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPairing.name}</h3>
                  <button
                    onClick={() => setSelectedPairing(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600">{selectedPairing.description}</p>
              </div>

              {/* Font Details */}
              <div className="p-6 space-y-6">
                {/* Heading Font */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    Heading Font
                    <a
                      href={selectedPairing.heading.googleFontUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-lg font-mono">{selectedPairing.heading.font}</code>
                      <div className="text-sm text-gray-600">
                        Weights: {selectedPairing.heading.weights.join(', ')}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: `'${selectedPairing.heading.font}', ${selectedPairing.heading.fallback}`,
                        fontWeight: selectedPairing.heading.weights[0],
                      }}
                    >
                      <div className="text-5xl mb-3">The Quick Brown Fox</div>
                      <div className="text-3xl mb-3">Jumps Over the Lazy Dog</div>
                      <div className="text-xl">
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Font */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    Body Font
                    <a
                      href={selectedPairing.body.googleFontUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-lg font-mono">{selectedPairing.body.font}</code>
                      <div className="text-sm text-gray-600">
                        Weights: {selectedPairing.body.weights.join(', ')}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: `'${selectedPairing.body.font}', ${selectedPairing.body.fallback}`,
                        fontWeight: selectedPairing.body.weights[0],
                      }}
                    >
                      <p className="text-lg mb-3">
                        The quick brown fox jumps over the lazy dog. Pack my box with five dozen
                        liquor jugs. How vexingly quick daft zebras jump!
                      </p>
                      <p className="text-base">
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%^&*()
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Proposal Preview */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Live Proposal Preview</h4>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
                    <h1
                      style={{
                        fontFamily: `'${selectedPairing.heading.font}', ${selectedPairing.heading.fallback}`,
                        fontWeight: selectedPairing.heading.weights[1] || selectedPairing.heading.weights[0],
                        fontSize: '48px',
                        lineHeight: 1.2,
                      }}
                      className="text-gray-900 mb-4"
                    >
                      Your Proposal Title
                    </h1>
                    <h2
                      style={{
                        fontFamily: `'${selectedPairing.heading.font}', ${selectedPairing.heading.fallback}`,
                        fontWeight: selectedPairing.heading.weights[0],
                        fontSize: '32px',
                        lineHeight: 1.3,
                      }}
                      className="text-gray-800 mb-3"
                    >
                      Section Heading
                    </h2>
                    <p
                      style={{
                        fontFamily: `'${selectedPairing.body.font}', ${selectedPairing.body.fallback}`,
                        fontWeight: selectedPairing.body.weights[0],
                        fontSize: '16px',
                        lineHeight: 1.6,
                      }}
                      className="text-gray-600 mb-4"
                    >
                      This is how your proposal body text will look. The typography creates a clear
                      hierarchy and ensures excellent readability. Professional font pairings make
                      your content more engaging and easier to scan.
                    </p>
                    <h3
                      style={{
                        fontFamily: `'${selectedPairing.heading.font}', ${selectedPairing.heading.fallback}`,
                        fontWeight: selectedPairing.heading.weights[0],
                        fontSize: '24px',
                        lineHeight: 1.4,
                      }}
                      className="text-gray-800 mb-2"
                    >
                      Subsection Title
                    </h3>
                    <p
                      style={{
                        fontFamily: `'${selectedPairing.body.font}', ${selectedPairing.body.fallback}`,
                        fontWeight: selectedPairing.body.weights[0],
                        fontSize: '16px',
                        lineHeight: 1.6,
                      }}
                      className="text-gray-600"
                    >
                      Consistent typography throughout your proposal builds trust and
                      professionalism. The contrast between headings and body text guides readers
                      naturally through your content.
                    </p>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => {
                    handleApply(selectedPairing);
                    setSelectedPairing(null);
                  }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
                >
                  Apply This Font Pairing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Notification */}
      <AnimatePresence>
        {copiedText && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span>CSS copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
