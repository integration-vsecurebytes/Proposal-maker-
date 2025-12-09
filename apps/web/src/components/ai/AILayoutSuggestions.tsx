'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Loader2, Sparkles, Grid, Columns, Square, Layers } from 'lucide-react';

interface LayoutSuggestion {
  layout: 'single-column' | 'two-column' | 'grid' | 'card-based';
  visualElements: Array<{
    type: 'chart' | 'icon' | 'image' | 'diagram';
    placement: 'top' | 'side' | 'inline';
    reasoning: string;
  }>;
  spacing: 'compact' | 'comfortable' | 'spacious';
  hierarchy: {
    primary: string;
    secondary: string;
  };
  reasoning: string;
}

interface AILayoutSuggestionsProps {
  content: string;
  contentType?: string;
  visualDensity?: string;
  onApplySuggestion?: (suggestion: LayoutSuggestion) => void;
}

export default function AILayoutSuggestions({
  content,
  contentType = 'general',
  visualDensity = '40-60%',
  onApplySuggestion,
}: AILayoutSuggestionsProps) {
  const [suggestion, setSuggestion] = useState<LayoutSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('gemini');

  const analyzeLayout = async () => {
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-design/layout-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          contentType,
          visualDensity,
          provider: 'gemini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get layout suggestions');
      }

      const data = await response.json();
      setSuggestion(data.suggestions);
      setProvider(data.provider);

      if (data.fallbackUsed) {
        console.log(`Fell back to ${data.provider} from ${data.originalProvider}`);
      }
    } catch (err: any) {
      console.error('Error analyzing layout:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'single-column':
        return <Layout className="h-5 w-5" />;
      case 'two-column':
        return <Columns className="h-5 w-5" />;
      case 'grid':
        return <Grid className="h-5 w-5" />;
      case 'card-based':
        return <Square className="h-5 w-5" />;
      default:
        return <Layers className="h-5 w-5" />;
    }
  };

  const getSpacingColor = (spacing: string) => {
    switch (spacing) {
      case 'compact':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'comfortable':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'spacious':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-600" />
          AI Layout Suggestions
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Get AI-powered layout recommendations for your content
        </p>
      </div>

      {/* Analyze Button */}
      {!suggestion && (
        <button
          onClick={analyzeLayout}
          disabled={isAnalyzing || !content.trim()}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing content...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Analyze Layout
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

      {/* Suggestions */}
      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Layout Type */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  {getLayoutIcon(suggestion.layout)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Recommended Layout</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {suggestion.layout.replace('-', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Elements */}
            {suggestion.visualElements.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-gray-900">Suggested Visual Elements</h5>
                <div className="space-y-2">
                  {suggestion.visualElements.map((element, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">
                            {element.type === 'chart' && '📊'}
                            {element.type === 'icon' && '✦'}
                            {element.type === 'image' && '🖼️'}
                            {element.type === 'diagram' && '📐'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {element.type}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                              {element.placement}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{element.reasoning}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Spacing & Hierarchy */}
            <div className="grid grid-cols-2 gap-3">
              {/* Spacing */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Spacing</p>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full border ${getSpacingColor(
                    suggestion.spacing
                  )}`}
                >
                  {suggestion.spacing.charAt(0).toUpperCase() + suggestion.spacing.slice(1)}
                </span>
              </div>

              {/* Hierarchy */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Hierarchy</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-800">
                    <strong>1°:</strong> {suggestion.hierarchy.primary}
                  </p>
                  <p className="text-xs text-gray-800">
                    <strong>2°:</strong> {suggestion.hierarchy.secondary}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-2">AI Reasoning</p>
              <p className="text-sm text-gray-700">{suggestion.reasoning}</p>
            </div>

            {/* Apply Button */}
            {onApplySuggestion && (
              <button
                onClick={() => onApplySuggestion(suggestion)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply This Layout
              </button>
            )}

            {/* Re-analyze Button */}
            <button
              onClick={analyzeLayout}
              disabled={isAnalyzing}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Get New Suggestion
                </>
              )}
            </button>

            {/* Provider Info */}
            <div className="text-xs text-gray-500 text-center">
              Analyzed by{' '}
              {provider === 'gemini'
                ? 'Google Gemini 2.0 Flash'
                : provider === 'gpt'
                ? 'OpenAI GPT-4 Turbo'
                : provider.toUpperCase()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
