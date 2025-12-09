'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  FileText,
  Brain,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface GenerationProgress {
  totalSections: number;
  completedSections: number;
  currentSection: string;
  percentage: number;
}

interface ProposalGenerationProgressProps {
  progress: GenerationProgress | null;
  isComplete: boolean;
  error?: string;
}

export default function ProposalGenerationProgress({
  progress,
  isComplete,
  error,
}: ProposalGenerationProgressProps) {
  const percentage = progress?.percentage || 0;
  const completedCount = progress?.completedSections || 0;
  const totalCount = progress?.totalSections || 0;

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="max-w-2xl w-full px-4">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              {isComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
              ) : error ? (
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xl">✕</span>
                </div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin" />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {isComplete
                    ? 'Proposal Generated!'
                    : error
                    ? 'Generation Failed'
                    : 'Generating Your Proposal'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isComplete
                    ? 'Your professional proposal is ready'
                    : error
                    ? 'An error occurred during generation'
                    : 'AI is crafting professional content based on your requirements'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Content */}
          <div className="p-6">
            {error ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-3xl">⚠️</span>
                </div>
                <p className="text-red-600 font-medium mb-2">Error</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {isComplete ? 'Completed' : 'In Progress'}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {completedCount} / {totalCount} sections
                    </span>
                  </div>

                  {/* Progress bar with gradient */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                    >
                      {/* Animated shimmer effect */}
                      <motion.div
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                    </motion.div>
                  </div>

                  {/* Percentage */}
                  <div className="mt-2 text-center">
                    <motion.span
                      key={percentage}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                    >
                      {percentage}%
                    </motion.span>
                  </div>
                </div>

                {/* Current Section */}
                {!isComplete && progress && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={progress.currentSection}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg p-4 mb-6 border border-blue-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-600 mb-1">
                            Currently Generating
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {progress.currentSection}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600">
                              Analyzing similar proposals and crafting content...
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Feature Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 mb-1">AI-Powered</p>
                    <p className="text-xs text-gray-600">GPT-4o</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 mb-1">RAG Enhanced</p>
                    <p className="text-xs text-gray-600">Context-aware</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-5 w-5 text-pink-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 mb-1">Professional</p>
                    <p className="text-xs text-gray-600">Enterprise-grade</p>
                  </motion.div>
                </div>

                {/* Tips Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 mb-1">
                        What's Happening?
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Analyzing your requirements and industry context</li>
                        <li>✓ Retrieving similar successful proposals via RAG</li>
                        <li>✓ Crafting professional, persuasive content</li>
                        <li>✓ Generating relevant visualizations and data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with animation */}
          {!error && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </motion.div>
                <span>
                  {isComplete
                    ? 'Generation complete! Redirecting...'
                    : 'This may take 1-2 minutes depending on proposal complexity'}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Completed Sections List */}
        {!isComplete && progress && progress.completedSections > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <p className="text-xs text-gray-500">
              Completed sections will be available for editing once generation is finished
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
