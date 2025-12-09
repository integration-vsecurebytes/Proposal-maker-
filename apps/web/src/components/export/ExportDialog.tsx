/**
 * Export Dialog Component
 * User interface for PDF generation with method selection and options
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Settings,
  Check,
  X,
  Clock,
  Zap,
  FileCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';

export type PDFMethod = 'puppeteer' | 'libreoffice' | 'auto';
export type PDFQuality = 'draft' | 'standard' | 'high';

export interface ExportOptions {
  method: PDFMethod;
  includeTOC: boolean;
  includePageNumbers: boolean;
  quality: PDFQuality;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerFooter: boolean;
  landscape: boolean;
}

export interface ExportDialogProps {
  proposalId: string;
  isOpen: boolean;
  onClose: () => void;
  proposalTitle?: string;
}

interface JobStatus {
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  progress?: number;
  filePath?: string;
  fileSize?: number;
  method?: PDFMethod;
  error?: string;
  estimatedTime?: number;
}

export default function ExportDialog({
  proposalId,
  isOpen,
  onClose,
  proposalTitle = 'Proposal',
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    method: 'auto',
    includeTOC: true,
    includePageNumbers: true,
    quality: 'standard',
    margins: {
      top: 20,
      right: 25,
      bottom: 20,
      left: 25,
    },
    headerFooter: true,
    landscape: false,
  });

  const [jobStatus, setJobStatus] = useState<JobStatus>({ status: 'idle' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Method capabilities
  const methodCapabilities = {
    puppeteer: {
      name: 'Puppeteer (Modern)',
      description: 'HTML to PDF using headless Chrome. Best for complex layouts, charts, and modern designs.',
      pros: ['Perfect CSS rendering', 'Full chart/diagram support', 'Custom fonts', 'Modern layouts'],
      cons: ['Slightly slower', 'Higher memory usage'],
      estimatedTime: '5-10 seconds',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
    },
    libreoffice: {
      name: 'LibreOffice (Compatible)',
      description: 'DOCX to PDF conversion. Maximum compatibility and fastest for text-heavy proposals.',
      pros: ['Fast generation', 'Low memory usage', 'Maximum compatibility', 'Excellent for text'],
      cons: ['Limited chart support', 'Basic layout only', 'Fewer design features'],
      estimatedTime: '2-5 seconds',
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
    },
    auto: {
      name: 'Auto (Recommended)',
      description: 'Automatically selects the best method based on proposal content and complexity.',
      pros: ['Optimal performance', 'Best quality for content', 'No manual selection', 'Smart fallback'],
      cons: ['Less predictable timing'],
      estimatedTime: '2-10 seconds',
      icon: Check,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
  };

  // Start export
  const handleExport = async () => {
    try {
      setJobStatus({ status: 'queued', progress: 0 });

      // Call API to start PDF generation
      const response = await fetch(`/api/proposals/${proposalId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start PDF generation');
      }

      // Start polling for status
      setJobStatus({
        status: 'queued',
        jobId: data.jobId,
        method: data.method,
        estimatedTime: data.estimatedTime,
      });

      pollJobStatus(data.jobId);
    } catch (error) {
      console.error('Export error:', error);
      setJobStatus({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/export/status?jobId=${jobId}`);
        const data = await response.json();

        setJobStatus(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress || prev.progress,
          filePath: data.filePath,
          fileSize: data.fileSize,
          method: data.method,
          error: data.error,
        }));

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status poll error:', error);
        clearInterval(interval);
        setJobStatus(prev => ({
          ...prev,
          status: 'failed',
          error: 'Failed to check status',
        }));
      }
    }, 1000); // Poll every second
  };

  // Download PDF
  const handleDownload = async () => {
    if (!jobStatus.jobId) return;

    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/export/download?jobId=${jobStatus.jobId}`
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposalTitle.replace(/[^a-z0-9_\-]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF');
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setJobStatus({ status: 'idle' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMethod = methodCapabilities[options.method];
  const MethodIcon = selectedMethod.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Export to PDF</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Display */}
          {jobStatus.status !== 'idle' && (
            <div className="mb-6">
              <AnimatePresence mode="wait">
                {jobStatus.status === 'queued' && (
                  <motion.div
                    key="queued"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <div className="font-semibold text-blue-900">PDF generation queued</div>
                      <div className="text-sm text-blue-700">
                        Estimated time: {jobStatus.estimatedTime ? `${Math.round(jobStatus.estimatedTime / 1000)}s` : '5-10s'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {jobStatus.status === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <div className="font-semibold text-blue-900">Generating PDF...</div>
                    </div>
                    {jobStatus.progress !== undefined && (
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${jobStatus.progress}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {jobStatus.status === 'completed' && (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <Check className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-900">PDF generated successfully!</div>
                      <div className="text-sm text-green-700">
                        Size: {jobStatus.fileSize ? `${(jobStatus.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                        {' • '}
                        Method: {jobStatus.method}
                      </div>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </motion.div>
                )}

                {jobStatus.status === 'failed' && (
                  <motion.div
                    key="failed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-semibold text-red-900">PDF generation failed</div>
                      <div className="text-sm text-red-700">{jobStatus.error || 'Unknown error'}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              PDF Generation Method
            </label>
            <div className="space-y-3">
              {(Object.keys(methodCapabilities) as PDFMethod[]).map((method) => {
                const capability = methodCapabilities[method];
                const Icon = capability.icon;
                const isSelected = options.method === method;

                return (
                  <button
                    key={method}
                    onClick={() => setOptions({ ...options, method })}
                    disabled={jobStatus.status !== 'idle'}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${capability.borderColor} ${capability.bgColor}`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${jobStatus.status !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-6 h-6 ${isSelected ? capability.color : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{capability.name}</div>
                        <div className="text-sm text-gray-600 mb-2">{capability.description}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {capability.pros.slice(0, 2).map((pro, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded"
                            >
                              ✓ {pro}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className={`w-5 h-5 ${capability.color}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Options */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeTOC}
                onChange={(e) => setOptions({ ...options, includeTOC: e.target.checked })}
                disabled={jobStatus.status !== 'idle'}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Include Table of Contents</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includePageNumbers}
                onChange={(e) => setOptions({ ...options, includePageNumbers: e.target.checked })}
                disabled={jobStatus.status !== 'idle'}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Include Page Numbers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.headerFooter}
                onChange={(e) => setOptions({ ...options, headerFooter: e.target.checked })}
                disabled={jobStatus.status !== 'idle'}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Header & Footer</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.landscape}
                onChange={(e) => setOptions({ ...options, landscape: e.target.checked })}
                disabled={jobStatus.status !== 'idle'}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Landscape Mode</span>
            </label>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quality
            </label>
            <div className="flex gap-2">
              {(['draft', 'standard', 'high'] as PDFQuality[]).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setOptions({ ...options, quality })}
                  disabled={jobStatus.status !== 'idle'}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    options.quality === quality
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  } ${jobStatus.status !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Advanced Options
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="grid grid-cols-4 gap-3">
                    {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                      <div key={side}>
                        <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                          {side} (mm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={options.margins[side]}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              margins: {
                                ...options.margins,
                                [side]: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          disabled={jobStatus.status !== 'idle'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>Tip:</strong> The "Auto" method automatically selects Puppeteer for complex
              proposals with charts and diagrams, and LibreOffice for text-heavy proposals.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={jobStatus.status !== 'idle'}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              jobStatus.status === 'idle'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {jobStatus.status === 'idle' ? (
              <>
                <Download className="w-4 h-4" />
                Generate PDF
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
