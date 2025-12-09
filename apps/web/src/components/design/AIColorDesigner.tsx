'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  Palette,
  Image,
  Type,
  Eye,
  Download,
} from 'lucide-react';

interface ColorScheme {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  harmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic';
  reasoning: string;
  useCases: string[];
  accessibility: {
    wcagCompliant: boolean;
    contrastRatios: {
      primaryOnBackground: number;
      textOnBackground: number;
    };
  };
}

interface AIColorDesignerProps {
  onApplyColors?: (scheme: ColorScheme) => void;
  initialPrompt?: string;
}

export default function AIColorDesigner({
  onApplyColors,
  initialPrompt = '',
}: AIColorDesignerProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [industry, setIndustry] = useState('');
  const [mood, setMood] = useState('');
  const [schemes, setSchemes] = useState<ColorScheme[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [selectedSchemeIndex, setSelectedSchemeIndex] = useState(0);

  // Dynamic options from AI
  const [industries, setIndustries] = useState<any[]>([]);
  const [moods, setMoods] = useState<any[]>([]);
  const [quickPrompts, setQuickPrompts] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch dynamic options on mount
  useEffect(() => {
    fetchColorOptions();
  }, []);

  const fetchColorOptions = async () => {
    try {
      setLoadingOptions(true);
      const response = await fetch('/api/ai-design/color-options?provider=gemini');

      if (!response.ok) {
        throw new Error('Failed to fetch color options');
      }

      const data = await response.json();

      setIndustries(data.industries || []);
      setMoods(data.moods || []);
      setQuickPrompts(data.quickPrompts || []);

      // Set default selections
      if (data.industries && data.industries.length > 0) {
        setIndustry(data.industries[0].id);
      }
      if (data.moods && data.moods.length > 0) {
        setMood(data.moods[0].id);
      }
    } catch (err) {
      console.error('Error fetching color options:', err);
      // Fallback to minimal options
      setIndustries([{ id: 'general', label: 'General', description: 'General business' }]);
      setMoods([{ id: 'professional', label: 'Professional', description: 'Professional style' }]);
      setQuickPrompts([{ text: 'Professional business', industry: 'general', mood: 'professional' }]);
      setIndustry('general');
      setMood('professional');
    } finally {
      setLoadingOptions(false);
    }
  };

  const generateColors = async () => {
    if (!prompt.trim() && !industry) {
      setError('Please provide a description or select an industry');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-design/generate-color-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || `${mood} color scheme for ${industry} industry`,
          industry,
          mood,
          provider: 'gemini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate color schemes');
      }

      const data = await response.json();
      setSchemes(data.schemes || []);
      setSelectedSchemeIndex(0);
    } catch (err: any) {
      console.error('Error generating colors:', err);
      setError(err.message || 'Failed to generate colors. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyColor = (color: string) => {
    // Fallback for when Clipboard API is not available (non-HTTPS contexts, IP addresses)
    // Updated: Fixed clipboard access for non-localhost environments
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(color);
    } else {
      // Fallback method for non-HTTPS contexts
      const textArea = document.createElement('textarea');
      textArea.value = color;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.error('Failed to copy color:', err);
        textArea.remove();
        return;
      }
    }

    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const downloadPalette = (scheme: ColorScheme) => {
    const paletteData = {
      name: scheme.name,
      colors: {
        primary: scheme.primary,
        secondary: scheme.secondary,
        accent: scheme.accent,
        success: scheme.success,
        warning: scheme.warning,
        error: scheme.error,
        background: scheme.background,
        surface: scheme.surface,
        text: scheme.text,
        textSecondary: scheme.textSecondary,
      },
    };

    const blob = new Blob([JSON.stringify(paletteData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scheme.name.toLowerCase().replace(/\s+/g, '-')}-palette.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedScheme = schemes[selectedSchemeIndex];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
          AI Color Designer
        </h2>
        <p className="text-gray-600">
          Describe your brand or project, and AI will generate professional color schemes
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <div className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Brand or Project
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Modern tech startup focused on AI innovation and sustainability..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Quick Prompts */}
          {!loadingOptions && quickPrompts.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((qp, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(qp.text || qp)}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 border border-gray-300 hover:border-purple-300 rounded-full transition-colors"
                    title={qp.industry ? `Industry: ${qp.industry}, Mood: ${qp.mood}` : ''}
                  >
                    {qp.text || qp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Industry & Mood */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
                {loadingOptions && (
                  <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                )}
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={loadingOptions}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  industries.find((i) => i.id === industry)?.description ||
                  'Select an industry'
                }
              >
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.id} title={ind.description}>
                    {ind.label}
                    {ind.examples && ind.examples.length > 0
                      ? ` (${ind.examples.slice(0, 2).join(', ')})`
                      : ''}
                  </option>
                ))}
              </select>
              {!loadingOptions && industries.find((i) => i.id === industry)?.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {industries.find((i) => i.id === industry)?.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood/Tone
                {loadingOptions && (
                  <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                )}
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                disabled={loadingOptions}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                title={moods.find((m) => m.id === mood)?.description || 'Select a mood'}
              >
                {moods.map((m) => (
                  <option key={m.id} value={m.id} title={m.description}>
                    {m.label}
                    {m.colorHints && m.colorHints.length > 0
                      ? ` (${m.colorHints.slice(0, 2).join(', ')})`
                      : ''}
                  </option>
                ))}
              </select>
              {!loadingOptions && moods.find((m) => m.id === mood)?.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {moods.find((m) => m.id === mood)?.description}
                </p>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateColors}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Color Schemes...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Generate AI Color Schemes
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Schemes */}
      <AnimatePresence>
        {schemes.length > 0 && selectedScheme && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Scheme Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Color Schemes ({schemes.length})
                </h3>
                <button
                  onClick={generateColors}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {schemes.map((scheme, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSchemeIndex(index)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSchemeIndex === index
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: scheme.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: scheme.secondary }}
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: scheme.accent }}
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-900 text-left">{scheme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Scheme Details */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
              {/* Header */}
              <div
                className="p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${selectedScheme.primary}, ${selectedScheme.secondary})`,
                }}
              >
                <h3 className="text-2xl font-bold mb-1">{selectedScheme.name}</h3>
                <p className="text-white/90 text-sm">{selectedScheme.description}</p>
              </div>

              {/* Color Swatches */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Color Palette</h4>
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {[
                    { name: 'Primary', color: selectedScheme.primary },
                    { name: 'Secondary', color: selectedScheme.secondary },
                    { name: 'Accent', color: selectedScheme.accent },
                    { name: 'Success', color: selectedScheme.success },
                    { name: 'Warning', color: selectedScheme.warning },
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div
                        className="h-20 rounded-lg border-2 border-gray-200 relative group cursor-pointer"
                        style={{ backgroundColor: item.color }}
                        onClick={() => copyColor(item.color)}
                      >
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          {copiedColor === item.color ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <Copy className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{item.color}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Colors */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { name: 'Error', color: selectedScheme.error },
                    { name: 'Background', color: selectedScheme.background },
                    { name: 'Surface', color: selectedScheme.surface },
                    { name: 'Text', color: selectedScheme.text },
                    { name: 'Text Secondary', color: selectedScheme.textSecondary },
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div
                        className="h-16 rounded-lg border-2 border-gray-200 relative group cursor-pointer"
                        style={{ backgroundColor: item.color }}
                        onClick={() => copyColor(item.color)}
                      >
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          {copiedColor === item.color ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <Copy className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{item.color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-purple-900 mb-1">
                        AI Color Analysis
                      </p>
                      <p className="text-sm text-gray-700">{selectedScheme.reasoning}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Color Harmony</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {selectedScheme.harmony}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Accessibility</p>
                  <p
                    className={`text-sm font-semibold ${
                      selectedScheme.accessibility.wcagCompliant
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }`}
                  >
                    {selectedScheme.accessibility.wcagCompliant ? 'WCAG AA ✓' : 'Check Needed'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Use Cases</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedScheme.useCases.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                {onApplyColors && (
                  <button
                    onClick={() => onApplyColors(selectedScheme)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Palette className="h-4 w-4" />
                    Apply to Proposal
                  </button>
                )}
                <button
                  onClick={() => downloadPalette(selectedScheme)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </h4>

              <div
                className="rounded-lg overflow-hidden border-2 border-gray-200"
                style={{ backgroundColor: selectedScheme.background }}
              >
                {/* Preview Header */}
                <div
                  className="p-6 text-white"
                  style={{ backgroundColor: selectedScheme.primary }}
                >
                  <h3 className="text-2xl font-bold mb-1">Your Proposal Title</h3>
                  <p className="text-white/90">Professional Business Solutions</p>
                </div>

                {/* Preview Content */}
                <div className="p-6 space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: selectedScheme.surface }}
                  >
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: selectedScheme.primary }}
                    >
                      Executive Summary
                    </h4>
                    <p style={{ color: selectedScheme.text }} className="text-sm">
                      This is how your content will look with the selected color scheme.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 rounded text-white font-medium"
                      style={{ backgroundColor: selectedScheme.primary }}
                    >
                      Primary Action
                    </button>
                    <button
                      className="px-4 py-2 rounded font-medium"
                      style={{
                        backgroundColor: selectedScheme.surface,
                        color: selectedScheme.primary,
                      }}
                    >
                      Secondary Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {schemes.length === 0 && !isGenerating && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Create Amazing Colors
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Describe your brand or project above, and AI will generate professional color schemes
            tailored to your needs.
          </p>
        </div>
      )}
    </div>
  );
}
