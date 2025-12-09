'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Award, TrendingUp } from 'lucide-react';
import { getTemplateById, type CoverTemplate } from '@/data/coverTemplates';

interface TemplateRecommendation {
  templateId: string;
  score: number;
  reasoning: string;
  bestFor: string[];
}

interface AITemplateRecommenderProps {
  proposal: {
    title: string;
    industry?: string;
    tone?: string;
    sections?: any[];
    hasMetrics?: boolean;
    targetAudience?: string;
  };
  onSelectTemplate: (template: CoverTemplate) => void;
  autoLoad?: boolean;
}

export default function AITemplateRecommender({
  proposal,
  onSelectTemplate,
  autoLoad = false,
}: AITemplateRecommenderProps) {
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('gemini');

  useEffect(() => {
    if (autoLoad) {
      getRecommendations();
    }
  }, [autoLoad]);

  const getRecommendations = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-design/recommend-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposal.title,
          industry: proposal.industry || 'general',
          tone: proposal.tone || 'professional',
          contentLength: proposal.sections?.length || 5,
          hasMetrics: proposal.hasMetrics || false,
          targetAudience: proposal.targetAudience || 'executives',
          provider: 'gemini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setProvider(data.provider);

      if (data.fallbackUsed) {
        console.log(`Fell back to ${data.provider} from ${data.originalProvider}`);
      }
    } catch (err: any) {
      console.error('Error getting recommendations:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectTemplate = (rec: TemplateRecommendation) => {
    const template = getTemplateById(rec.templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 8) return 'text-blue-600';
    if (score >= 7) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 8) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 7) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {!autoLoad && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Template Recommender
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Let AI suggest the best templates for your proposal
          </p>
        </div>
      )}

      {/* Get Recommendations Button */}
      {!autoLoad && recommendations.length === 0 && (
        <button
          onClick={getRecommendations}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing proposal...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Get AI Recommendations
            </>
          )}
        </button>
      )}

      {/* Loading State for Auto-load */}
      {autoLoad && isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm text-gray-600">Analyzing your proposal...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Recommendations */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Info Banner */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Award className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    AI Recommendations for "{proposal.title}"
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Based on your industry, tone, and content analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Template Cards */}
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const template = getTemplateById(rec.templateId);
                if (!template) return null;

                return (
                  <motion.div
                    key={rec.templateId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Best Match Badge */}
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Best Match
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleSelectTemplate(rec)}
                      className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {template.name}
                          </h5>
                          <p className="text-xs text-gray-500 capitalize">
                            {template.category} • {template.description}
                          </p>
                        </div>
                        <div
                          className={`ml-3 px-3 py-1 text-sm font-bold rounded-full border ${getScoreBadge(
                            rec.score
                          )}`}
                        >
                          {rec.score.toFixed(1)}/10
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-3">
                        <p className="text-xs font-medium text-blue-900 mb-1">
                          Why this template?
                        </p>
                        <p className="text-sm text-gray-700">{rec.reasoning}</p>
                      </div>

                      {/* Best For Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-600 font-medium">Best for:</span>
                        {rec.bestFor.map((use, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300"
                          >
                            {use}
                          </span>
                        ))}
                      </div>

                      {/* Template Preview Thumbnail */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div
                          className="w-full h-32 rounded border border-gray-200"
                          style={{
                            background:
                              template.background.type === 'solid'
                                ? template.background.value
                                : template.background.type === 'gradient'
                                ? `linear-gradient(${
                                    template.background.gradient?.angle || 45
                                  }deg, ${template.background.gradient?.colors.join(', ')})`
                                : '#FFFFFF',
                          }}
                        >
                          {/* Simplified zone visualization */}
                          <div className="relative h-full p-2">
                            {/* Title zone indicator */}
                            <div
                              className="absolute bg-purple-500 bg-opacity-20 border border-purple-400 border-dashed rounded"
                              style={{
                                left: `${template.zones.title.x}%`,
                                top: `${template.zones.title.y}%`,
                                width: `${Math.min(template.zones.title.width, 80)}%`,
                                height: `${Math.min(template.zones.title.height, 30)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Select Button */}
                      <div className="mt-3">
                        <div className="w-full py-2 text-center text-sm font-medium text-purple-600 bg-purple-50 rounded border border-purple-200">
                          Click to select this template
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Get New Recommendations */}
            {!autoLoad && (
              <button
                onClick={getRecommendations}
                disabled={isAnalyzing}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting new recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get New Recommendations
                  </>
                )}
              </button>
            )}

            {/* Provider Info */}
            <div className="text-xs text-gray-500 text-center">
              Recommended by{' '}
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
