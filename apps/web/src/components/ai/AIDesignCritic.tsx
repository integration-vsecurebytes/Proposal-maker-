'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, CheckCircle, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import type { CoverTemplate } from '@/data/coverTemplates';

interface DesignCritique {
  score: number;
  strengths: string[];
  improvements: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
    autoFix?: any;
  }>;
  accessibility: {
    contrastRatio: number;
    wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
    issues: string[];
  };
}

interface AIDesignCriticProps {
  coverPage: {
    background: any;
    template: CoverTemplate;
    primaryColor?: string;
    backgroundColor?: string;
  };
  industry?: string;
  hasLogo?: boolean;
  title?: string;
  onApplyAutoFix?: (fix: any) => void;
}

export default function AIDesignCritic({
  coverPage,
  industry = 'technology',
  hasLogo = true,
  title = 'Business Proposal',
  onApplyAutoFix,
}: AIDesignCriticProps) {
  const [critique, setCritique] = useState<DesignCritique | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('gemini');

  const analyzeDesign = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-design/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          background: coverPage.background,
          template: coverPage.template.id,
          industry,
          hasLogo,
          titleLength: title.length,
          primaryColor: coverPage.primaryColor || '#3B82F6',
          backgroundColor: coverPage.backgroundColor || '#FFFFFF',
          provider: 'gemini',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze design');
      }

      const data = await response.json();
      setCritique(data.critique);
      setProvider(data.provider);

      if (data.fallbackUsed) {
        console.log(`Fell back to ${data.provider} from ${data.originalProvider}`);
      }
    } catch (err: any) {
      console.error('Error analyzing design:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      case 'low':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    return 'Needs Work';
  };

  const getWCAGBadge = (level: string) => {
    const colors: Record<string, string> = {
      AAA: 'bg-green-100 text-green-800 border-green-300',
      AA: 'bg-blue-100 text-blue-800 border-blue-300',
      A: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Fail: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[level] || colors.Fail;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Design Critic
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Get professional feedback on your cover page design
        </p>
      </div>

      {/* Analyze Button */}
      {!critique && (
        <button
          onClick={analyzeDesign}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing design...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              Analyze My Design
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

      {/* Critique Results */}
      <AnimatePresence>
        {critique && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Design Score */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Overall Design Score</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getScoreLabel(critique.score)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold ${getScoreColor(critique.score)}`}>
                    {critique.score.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">out of 10</p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {critique.strengths.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Strengths
                </h5>
                <div className="space-y-2">
                  {critique.strengths.map((strength, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="pl-4 py-2 border-l-4 border-green-500 bg-green-50 rounded-r"
                    >
                      <p className="text-sm text-gray-700">✓ {strength}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {critique.improvements.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Suggested Improvements
                </h5>
                <div className="space-y-3">
                  {critique.improvements.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 border rounded-lg ${getSeverityColor(item.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(item.severity)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {item.issue}
                          </p>
                          <p className="text-xs text-gray-600">{item.suggestion}</p>
                          {item.autoFix && onApplyAutoFix && (
                            <button
                              onClick={() => onApplyAutoFix(item.autoFix)}
                              className="mt-2 flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              <Zap className="h-3 w-3" />
                              Apply Auto-Fix
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessibility */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-lg">♿</span>
                Accessibility Analysis
              </h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Contrast Ratio:</span>
                  <span className="font-semibold text-gray-900">
                    {critique.accessibility.contrastRatio.toFixed(1)}:1
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">WCAG Level:</span>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded border ${getWCAGBadge(
                      critique.accessibility.wcagLevel
                    )}`}
                  >
                    {critique.accessibility.wcagLevel}
                  </span>
                </div>
                {critique.accessibility.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {critique.accessibility.issues.map((issue, index) => (
                      <div key={index} className="text-xs text-blue-700 flex items-start gap-1">
                        <span>⚠</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Re-analyze Button */}
            <button
              onClick={analyzeDesign}
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
                  <Brain className="h-4 w-4" />
                  Re-analyze Design
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
