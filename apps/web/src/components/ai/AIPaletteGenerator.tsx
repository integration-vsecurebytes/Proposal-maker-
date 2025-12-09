'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Copy, Loader2 } from 'lucide-react';

interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  reasoning: string;
}

interface AIPaletteGeneratorProps {
  logoColors?: string[];
  industry?: string;
  tone?: string;
  onSelectPalette: (palette: ColorPalette) => void;
}

export default function AIPaletteGenerator({
  logoColors = ['#3B82F6'],
  industry = 'technology',
  tone = 'professional',
  onSelectPalette,
}: AIPaletteGeneratorProps) {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [provider, setProvider] = useState<string>('gemini');
  const [error, setError] = useState<string | null>(null);

  const generatePalettes = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-design/palettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoColors,
          industry,
          tone,
          provider: 'gemini', // Default to Gemini, falls back to GPT
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate palettes');
      }

      const data = await response.json();
      setPalettes(data.palettes);
      setProvider(data.provider);

      if (data.fallbackUsed) {
        console.log(`Fell back to ${data.provider} from ${data.originalProvider}`);
      }
    } catch (err: any) {
      console.error('Error generating palettes:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    setSelectedPalette(palette);
    onSelectPalette(palette);
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">AI Color Palette Generator</h4>
          <p className="text-xs text-gray-500 mt-1">
            Powered by {provider === 'gemini' ? 'Google Gemini' : provider === 'gpt' ? 'ChatGPT' : 'AI'}
          </p>
        </div>
      </div>

      {/* Generate Button */}
      {palettes.length === 0 && (
        <button
          onClick={generatePalettes}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating palettes...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate AI Palettes
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Generated Palettes */}
      <AnimatePresence>
        {palettes.length > 0 && (
          <div className="space-y-3">
            {palettes.map((palette, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPalette?.name === palette.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
                onClick={() => handleSelectPalette(palette)}
              >
                {/* Palette Name */}
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">{palette.name}</h5>
                  {selectedPalette?.name === palette.name && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                {/* Color Swatches */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[
                    { name: 'Primary', color: palette.primary },
                    { name: 'Secondary', color: palette.secondary },
                    { name: 'Accent', color: palette.accent },
                    { name: 'Background', color: palette.background },
                    { name: 'Text', color: palette.text },
                  ].map((item) => (
                    <div key={item.name} className="text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyColor(item.color);
                        }}
                        className="w-full h-16 rounded border-2 border-gray-300 hover:border-blue-400 transition-colors relative group"
                        style={{ backgroundColor: item.color }}
                        title={`Click to copy ${item.color}`}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                          <Copy className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      <p className="text-xs text-gray-600 mt-1 font-medium">{item.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.color}</p>
                    </div>
                  ))}
                </div>

                {/* Reasoning */}
                <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <strong>AI Reasoning:</strong> {palette.reasoning}
                </div>
              </motion.div>
            ))}

            {/* Regenerate Button */}
            <button
              onClick={generatePalettes}
              disabled={isGenerating}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate New Palettes
                </>
              )}
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Provider Info */}
      {palettes.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Generated by {provider === 'gemini' ? 'Google Gemini 2.0 Flash' : provider === 'gpt' ? 'OpenAI GPT-4 Turbo' : provider.toUpperCase()}
        </div>
      )}
    </div>
  );
}
