import { useState, useEffect } from 'react';
import { Type, Sparkles, Check, RefreshCw } from 'lucide-react';

interface FontDesignerProps {
  initialFonts?: {
    headingFont?: string;
    bodyFont?: string;
  };
  onApplyFonts?: (fonts: any) => void;
}

// Popular Google Fonts organized by category
const FONT_PAIRINGS = [
  {
    name: 'Modern Professional',
    heading: 'Poppins',
    body: 'Inter',
    description: 'Clean, modern look for tech and startups',
    category: 'sans-serif',
  },
  {
    name: 'Classic Elegant',
    heading: 'Playfair Display',
    body: 'Source Sans Pro',
    description: 'Sophisticated serif for luxury brands',
    category: 'serif',
  },
  {
    name: 'Bold & Dynamic',
    heading: 'Montserrat',
    body: 'Open Sans',
    description: 'Strong presence for marketing and sales',
    category: 'sans-serif',
  },
  {
    name: 'Friendly & Approachable',
    heading: 'Quicksand',
    body: 'Lato',
    description: 'Warm and welcoming for services',
    category: 'sans-serif',
  },
  {
    name: 'Corporate Traditional',
    heading: 'Merriweather',
    body: 'Roboto',
    description: 'Professional for finance and legal',
    category: 'serif',
  },
  {
    name: 'Creative & Modern',
    heading: 'Space Grotesk',
    body: 'Work Sans',
    description: 'Contemporary for creative agencies',
    category: 'sans-serif',
  },
  {
    name: 'Editorial Style',
    heading: 'Libre Baskerville',
    body: 'Crimson Text',
    description: 'Publishing quality for reports',
    category: 'serif',
  },
  {
    name: 'Tech Minimalist',
    heading: 'IBM Plex Sans',
    body: 'IBM Plex Sans',
    description: 'Consistent monospace feel',
    category: 'monospace',
  },
];

const HEADING_FONTS = [
  'Poppins', 'Montserrat', 'Playfair Display', 'Merriweather',
  'Raleway', 'Oswald', 'Bebas Neue', 'Space Grotesk',
  'Libre Baskerville', 'Quicksand', 'IBM Plex Sans', 'Archivo Black'
];

const BODY_FONTS = [
  'Inter', 'Open Sans', 'Roboto', 'Lato', 'Source Sans Pro',
  'Work Sans', 'Nunito', 'PT Sans', 'Crimson Text', 'IBM Plex Sans'
];

export function FontDesigner({ initialFonts, onApplyFonts }: FontDesignerProps) {
  const [selectedPairing, setSelectedPairing] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [headingFont, setHeadingFont] = useState(initialFonts?.headingFont || 'Poppins');
  const [bodyFont, setBodyFont] = useState(initialFonts?.bodyFont || 'Inter');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    // Get all unique fonts
    const allFonts = new Set([
      ...FONT_PAIRINGS.map(p => p.heading),
      ...FONT_PAIRINGS.map(p => p.body),
      ...HEADING_FONTS,
      ...BODY_FONTS,
    ]);

    // Create link element for Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${Array.from(allFonts)
      .map(font => `family=${font.replace(/ /g, '+')}:wght@400;600;700`)
      .join('&')}&display=swap`;

    document.head.appendChild(link);

    link.onload = () => setFontsLoaded(true);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleSelectPairing = (index: number) => {
    setSelectedPairing(index);
    setCustomMode(false);
    const pairing = FONT_PAIRINGS[index];
    setHeadingFont(pairing.heading);
    setBodyFont(pairing.body);
  };

  const handleCustomFont = () => {
    setCustomMode(true);
  };

  const handleApply = () => {
    if (onApplyFonts) {
      onApplyFonts({
        headingFont,
        bodyFont,
      });
    }
  };

  const currentPairing = customMode ? null : FONT_PAIRINGS[selectedPairing];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Font Designer</h2>
        <p className="text-gray-600">Choose the perfect font pairing for your proposal</p>
      </div>

      {/* Font Pairings Grid */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Pairings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {FONT_PAIRINGS.map((pairing, index) => (
            <button
              key={index}
              onClick={() => handleSelectPairing(index)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedPairing === index && !customMode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{pairing.name}</h4>
                {selectedPairing === index && !customMode && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="space-y-1 mb-2">
                <p
                  className="text-xl font-bold"
                  style={{ fontFamily: fontsLoaded ? pairing.heading : 'inherit' }}
                >
                  Heading
                </p>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: fontsLoaded ? pairing.body : 'inherit' }}
                >
                  Body text example with this font pairing
                </p>
              </div>
              <p className="text-xs text-gray-500">{pairing.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Font Selection */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Custom Fonts</h3>
            <button
              onClick={handleCustomFont}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                customMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Customize
            </button>
          </div>

          {customMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Heading Font
                </label>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontFamily: fontsLoaded ? headingFont : 'inherit' }}
                >
                  {HEADING_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Body Font
                </label>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontFamily: fontsLoaded ? bodyFont : 'inherit' }}
                >
                  {BODY_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={handleApply}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Type className="h-5 w-5" />
            Apply Fonts to Proposal
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Font Preview
        </h4>

        <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border">
          {/* Heading Examples */}
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: fontsLoaded ? headingFont : 'inherit' }}
            >
              Your Proposal Title
            </h1>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: fontsLoaded ? headingFont : 'inherit' }}
            >
              Section Heading
            </h2>
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ fontFamily: fontsLoaded ? headingFont : 'inherit' }}
            >
              Subsection Heading
            </h3>
          </div>

          {/* Body Text Example */}
          <div style={{ fontFamily: fontsLoaded ? bodyFont : 'inherit' }}>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              This is how your body text will appear in the proposal. The body font should be
              highly readable and comfortable for extended reading. It will be used for all
              paragraphs, lists, and general content throughout your document.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              A good font pairing creates visual hierarchy and ensures your proposal is both
              professional and easy to read. The heading font draws attention to important
              sections, while the body font provides clarity and readability.
            </p>
          </div>

          {/* Font Info */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Heading: </span>
                <span className="font-semibold text-gray-900">{headingFont}</span>
              </div>
              <div>
                <span className="text-gray-600">Body: </span>
                <span className="font-semibold text-gray-900">{bodyFont}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Font Pairing Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Serif headings + Sans-serif body = Classic professional look</li>
          <li>• Sans-serif throughout = Modern, clean appearance</li>
          <li>• Keep it simple - 2 fonts maximum for consistency</li>
          <li>• Ensure good contrast between heading and body fonts</li>
        </ul>
      </div>
    </div>
  );
}
