'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import type { BackgroundConfig } from '../editor/BackgroundComposer';

interface AIBackgroundGeneratorProps {
  industry?: string;
  tone?: string;
  onGenerate: (background: BackgroundConfig) => void;
}

export default function AIBackgroundGenerator({
  industry = 'technology',
  tone = 'professional',
  onGenerate,
}: AIBackgroundGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState(industry);
  const [selectedTone, setSelectedTone] = useState(tone);
  const [selectedStyle, setSelectedStyle] = useState<'gradient' | 'solid'>('gradient');
  const [generatedBackground, setGeneratedBackground] = useState<BackgroundConfig | null>(null);
  const [reasoning, setReasoning] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('gemini');

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Consulting',
    'Creative Agency',
    'Real Estate',
    'Legal',
    'Manufacturing',
  ];

  const tones = [
    'Professional & Trustworthy',
    'Modern & Innovative',
    'Elegant & Sophisticated',
    'Bold & Energetic',
    'Calm & Reliable',
    'Creative & Playful',
    'Minimalist & Clean',
  ];

  const generateBackground = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-design/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: selectedIndustry,
          tone: selectedTone,
          style: selectedStyle,
          provider: 'gemini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate background');
      }

      const data = await response.json();
      const bg = data.background;

      // Convert to BackgroundConfig format
      const backgroundConfig: BackgroundConfig = {
        type: bg.type,
        solidColor: bg.solidColor,
        gradient: bg.gradient,
        opacity: bg.opacity,
        blendMode: 'normal',
      };

      setGeneratedBackground(backgroundConfig);
      setReasoning(bg.reasoning);
      setProvider(data.provider);
      onGenerate(backgroundConfig);

      if (data.fallbackUsed) {
        console.log(`Fell back to ${data.provider} from ${data.originalProvider}`);
      }
    } catch (err: any) {
      console.error('Error generating background:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBackgroundPreview = (bg: BackgroundConfig): string => {
    if (bg.type === 'solid') {
      return bg.solidColor || '#3B82F6';
    } else if (bg.type === 'gradient' && bg.gradient) {
      const { type, angle = 135, stops } = bg.gradient;
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
    }
    return '#FFFFFF';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI Background Designer
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Let AI design the perfect background for your proposal
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Industry Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind.toLowerCase()}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Tone Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone & Style
          </label>
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tones.map((t) => (
              <option key={t} value={t.toLowerCase()}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Style Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Style
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStyle('gradient')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                selectedStyle === 'gradient'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              Gradient
            </button>
            <button
              onClick={() => setSelectedStyle('solid')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                selectedStyle === 'solid'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              Solid Color
            </button>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateBackground}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating with AI...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate Background
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Generated Background Preview */}
      {generatedBackground && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Generated Preview
            </label>
            <div
              className="w-full h-32 rounded-lg border-2 border-gray-200 shadow-sm"
              style={{
                background: getBackgroundPreview(generatedBackground),
                opacity: generatedBackground.opacity,
              }}
            />
          </div>

          {/* Reasoning */}
          {reasoning && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-1">
                AI Recommendation:
              </p>
              <p className="text-sm text-gray-700">{reasoning}</p>
            </div>
          )}

          {/* Provider Info */}
          <div className="text-xs text-gray-500 text-center">
            Generated by{' '}
            {provider === 'gemini'
              ? 'Google Gemini 2.0 Flash'
              : provider === 'gpt'
              ? 'OpenAI GPT-4 Turbo'
              : provider.toUpperCase()}
          </div>
        </motion.div>
      )}
    </div>
  );
}
