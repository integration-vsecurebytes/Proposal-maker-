'use client';

import { useState } from 'react';
import { coverTemplates, CoverTemplate, getTemplatesByCategory } from '@/data/coverTemplates';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Layout, Palette, Type, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp, Brain, X } from 'lucide-react';
import AITemplateRecommender from '../ai/AITemplateRecommender';
import AIDesignCritic from '../ai/AIDesignCritic';

interface CoverPageDesignerProps {
  onTemplateSelect: (template: CoverTemplate) => void;
  currentTemplate?: CoverTemplate;
  currentBackground?: any;
  proposal?: {
    title: string;
    industry?: string;
    tone?: string;
    sections?: any[];
    hasMetrics?: boolean;
    targetAudience?: string;
  };
  primaryColor?: string;
  backgroundColor?: string;
  showAIRecommendations?: boolean;
}

export default function CoverPageDesigner({
  onTemplateSelect,
  currentTemplate,
  currentBackground,
  proposal,
  primaryColor = '#3B82F6',
  backgroundColor = '#FFFFFF',
  showAIRecommendations = true,
}: CoverPageDesignerProps) {
  const [selectedCategory, setSelectedCategory] = useState<CoverTemplate['category'] | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<CoverTemplate | null>(null);
  const [showAISection, setShowAISection] = useState(showAIRecommendations);
  const [showCritiqueModal, setShowCritiqueModal] = useState(false);

  const filteredTemplates =
    selectedCategory === 'all'
      ? coverTemplates
      : getTemplatesByCategory(selectedCategory);

  const categories = [
    { value: 'all' as const, label: 'All', icon: Layout, count: coverTemplates.length },
    { value: 'minimal' as const, label: 'Minimal', icon: Type, count: getTemplatesByCategory('minimal').length },
    { value: 'professional' as const, label: 'Professional', icon: Palette, count: getTemplatesByCategory('professional').length },
    { value: 'modern' as const, label: 'Modern', icon: ImageIcon, count: getTemplatesByCategory('modern').length },
    { value: 'creative' as const, label: 'Creative', icon: ImageIcon, count: getTemplatesByCategory('creative').length },
  ];

  const handleSelectTemplate = (template: CoverTemplate) => {
    onTemplateSelect(template);
    setPreviewTemplate(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cover Page Designer</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose a professional template</p>
          </div>
          <div className="flex items-center gap-2">
            {currentTemplate && (
              <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                Current: <span className="font-medium">{currentTemplate.name}</span>
              </div>
            )}
            {currentTemplate && (
              <button
                onClick={() => setShowCritiqueModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Brain className="h-4 w-4" />
                AI Critique
              </button>
            )}
          </div>
        </div>

        {/* AI Recommendations Toggle */}
        {proposal && showAIRecommendations && (
          <button
            onClick={() => setShowAISection(!showAISection)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">
                AI Template Recommendations
              </span>
            </div>
            {showAISection ? (
              <ChevronUp className="h-4 w-4 text-purple-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-purple-600" />
            )}
          </button>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(({ value, label, icon: Icon, count }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(value)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                selectedCategory === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span className={`text-xs ${selectedCategory === value ? 'text-blue-200' : 'text-gray-500'}`}>
                ({count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Recommendations Section */}
      {proposal && showAISection && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-purple-50/30 to-blue-50/30 p-4">
          <AITemplateRecommender
            proposal={proposal}
            onSelectTemplate={handleSelectTemplate}
            autoLoad={true}
          />
        </div>
      )}

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const isSelected = currentTemplate?.id === template.id;
            const isPreviewing = previewTemplate?.id === template.id;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <button
                  onClick={() => handleSelectTemplate(template)}
                  onMouseEnter={() => setPreviewTemplate(template)}
                  onMouseLeave={() => setPreviewTemplate(null)}
                  className={`relative w-full aspect-[210/297] rounded-lg border-2 overflow-hidden transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                      : isPreviewing
                      ? 'border-blue-400 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Template Preview - A4 aspect ratio */}
                  <div
                    className="w-full h-full p-4 flex flex-col justify-center items-center text-center relative"
                    style={{
                      background:
                        template.background.type === 'solid'
                          ? template.background.value
                          : template.background.type === 'gradient'
                          ? `linear-gradient(${template.background.gradient?.angle || 45}deg, ${template.background.gradient?.colors.join(', ')})`
                          : '#FFFFFF',
                    }}
                  >
                    {/* Template Layout Visualization */}
                    <div className="absolute inset-0 p-4">
                      {/* Logo Zone */}
                      {template.zones.logo && (
                        <div
                          className="absolute bg-blue-500 bg-opacity-20 border-2 border-blue-400 border-dashed rounded flex items-center justify-center"
                          style={{
                            left: `${template.zones.logo.x}%`,
                            top: `${template.zones.logo.y}%`,
                            width: `${template.zones.logo.width}%`,
                            height: `${template.zones.logo.height}%`,
                          }}
                        >
                          <span className="text-xs text-blue-600 font-medium">Logo</span>
                        </div>
                      )}

                      {/* Title Zone */}
                      <div
                        className="absolute bg-purple-500 bg-opacity-20 border-2 border-purple-400 border-dashed rounded flex items-center justify-center"
                        style={{
                          left: `${template.zones.title.x}%`,
                          top: `${template.zones.title.y}%`,
                          width: `${template.zones.title.width}%`,
                          height: `${template.zones.title.height}%`,
                        }}
                      >
                        <span className="text-xs text-purple-600 font-medium">Title</span>
                      </div>

                      {/* Subtitle Zone */}
                      {template.zones.subtitle && (
                        <div
                          className="absolute bg-green-500 bg-opacity-20 border-2 border-green-400 border-dashed rounded flex items-center justify-center"
                          style={{
                            left: `${template.zones.subtitle.x}%`,
                            top: `${template.zones.subtitle.y}%`,
                            width: `${template.zones.subtitle.width}%`,
                            height: `${template.zones.subtitle.height}%`,
                          }}
                        >
                          <span className="text-xs text-green-600 font-medium">Subtitle</span>
                        </div>
                      )}

                      {/* Decorative Zones */}
                      {template.zones.decorative?.map((zone, index) => (
                        <div
                          key={index}
                          className="absolute bg-gray-500 bg-opacity-10 border border-gray-400 border-dashed rounded"
                          style={{
                            left: `${zone.x}%`,
                            top: `${zone.y}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-0.5 rounded text-xs font-medium text-gray-700 capitalize">
                      {template.category}
                    </div>
                  </div>
                </button>

                {/* Template Info */}
                <div className="mt-2">
                  <h4 className="text-sm font-semibold text-gray-900">{template.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layout className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-700 font-medium">No templates found</p>
            <p className="text-xs text-gray-500 mt-1">Try selecting a different category</p>
          </div>
        )}
      </div>

      {/* Preview Tooltip */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-2xl max-w-xs z-50"
          >
            <p className="text-sm font-medium">{previewTemplate.name}</p>
            <p className="text-xs text-gray-300 mt-0.5">{previewTemplate.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Tip:</span> Click a template to apply it to your cover page.
          All elements will be positioned automatically.
        </p>
      </div>

      {/* AI Design Critic Modal */}
      <AnimatePresence>
        {showCritiqueModal && currentTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCritiqueModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Design Critique
                </h3>
                <button
                  onClick={() => setShowCritiqueModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <AIDesignCritic
                  coverPage={{
                    background: currentBackground || { type: 'solid', solidColor: '#FFFFFF' },
                    template: currentTemplate,
                    primaryColor,
                    backgroundColor,
                  }}
                  industry={proposal?.industry || 'technology'}
                  hasLogo={true}
                  title={proposal?.title || 'Business Proposal'}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
