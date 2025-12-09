import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react';
import { getApiUrl, fixAssetUrl } from '../lib/api';
import AIColorDesigner from '../components/design/AIColorDesigner';
import { ManualColorPicker } from '../components/design/ManualColorPicker';
import { FontDesigner } from '../components/design/FontDesigner';
import { AICoverGenerator } from '../components/design/AICoverGenerator';
import { ProposalPreview } from '../components/preview';

const API_BASE_URL = getApiUrl();

// Helper to convert relative URLs to absolute
const toAbsoluteUrl = (url: string) => {
  if (!url) return '';

  // Fix: Strip out old localhost:4000 references (legacy data)
  if (url.includes('localhost:4000')) {
    url = url.replace(/https?:\/\/localhost:4000/, '');
  }

  // If already has http/https protocol (and not localhost), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For relative paths starting with /, return as-is to use Vite proxy in dev
  // In production, it will use the current origin
  if (url.startsWith('/')) {
    return url;
  }

  return url;
};

export function ProposalDesigner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai-colors' | 'manual-colors' | 'fonts' | 'ai-cover'>('ai-cover');
  const [previewZoom, setPreviewZoom] = useState(50); // 50% default zoom

  useEffect(() => {
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/proposals/${id}`);
      const proposalData = response.data.proposal;

      console.log('Loaded proposal data:', proposalData);

      // Ensure proposal has required structure
      if (!proposalData) {
        throw new Error('No proposal data received');
      }

      setProposal(proposalData);
    } catch (err: any) {
      console.error('Failed to load proposal:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyColors = async (colorScheme: any) => {
    try {
      setSaving(true);

      // Apply colors to proposal branding
      const updatedBranding = {
        ...proposal.branding,
        primaryColor: colorScheme.primary,
        secondaryColor: colorScheme.secondary,
        accentColor: colorScheme.accent,
        successColor: colorScheme.success,
        warningColor: colorScheme.warning,
        errorColor: colorScheme.error,
        // Also update background colors
        backgroundColor: colorScheme.background,
        surfaceColor: colorScheme.surface,
      };

      console.log('Applying colors:', updatedBranding);

      await axios.put(`${API_BASE_URL}/api/proposals/${id}/branding`, updatedBranding);

      // Reload proposal to ensure we have the latest data
      const response = await axios.get(`${API_BASE_URL}/api/proposals/${id}`);
      const updatedProposal = response.data.proposal;

      // Force update with new branding
      setProposal({
        ...updatedProposal,
        branding: updatedBranding,
      });

      alert('Color scheme applied successfully! Preview updated.');
    } catch (err: any) {
      console.error('Failed to apply colors:', err);
      alert('Failed to apply colors. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyFonts = async (fonts: any) => {
    try {
      setSaving(true);

      const updatedBranding = {
        ...proposal.branding,
        headingFont: fonts.headingFont,
        fontFamily: fonts.bodyFont, // bodyFont maps to fontFamily
      };

      console.log('Applying fonts:', updatedBranding);

      await axios.put(`${API_BASE_URL}/api/proposals/${id}/branding`, updatedBranding);

      // Reload proposal
      const response = await axios.get(`${API_BASE_URL}/api/proposals/${id}`);
      const updatedProposal = response.data.proposal;

      setProposal({
        ...updatedProposal,
        branding: updatedBranding,
      });

      alert('Fonts applied successfully! Preview updated.');
    } catch (err: any) {
      console.error('Failed to apply fonts:', err);
      alert('Failed to apply fonts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAICoverDesign = async (design: any) => {
    try {
      setSaving(true);

      // Map AI cover design to branding format
      const updatedBranding = {
        ...proposal.branding,
        primaryColor: design.colors.primary,
        secondaryColor: design.colors.secondary,
        accentColor: design.colors.accent,
        backgroundColor: design.colors.background,
        textColor: design.colors.text,
        headingFont: design.fonts.heading,
        fontFamily: design.fonts.body,
        coverTemplate: design.templateId,
        coverTemplateCategory: design.category,
        coverBackground: design.background,
        coverZones: design.zones,
        coverTextSizes: design.textSizes,
      };

      console.log('Applying AI cover design:', updatedBranding);

      await axios.put(`${API_BASE_URL}/api/proposals/${id}/branding`, updatedBranding);

      // Reload proposal
      const response = await axios.get(`${API_BASE_URL}/api/proposals/${id}`);
      const updatedProposal = response.data.proposal;

      setProposal({
        ...updatedProposal,
        branding: updatedBranding,
      });

      alert('AI cover design applied successfully! Preview updated.');
    } catch (err: any) {
      console.error('Failed to apply AI cover design:', err);
      alert('Failed to apply AI cover design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Proposal</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/proposal/${id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Proposal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/proposal/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Design System
                </h1>
                <p className="text-sm text-gray-500">{proposal.title || 'Untitled Proposal'}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/proposal/${id}`)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Done
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Designer Tools */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 grid grid-cols-4 gap-2">
              <button
                onClick={() => setActiveTab('ai-cover')}
                className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'ai-cover'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✨ AI Cover
              </button>
              <button
                onClick={() => setActiveTab('ai-colors')}
                className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'ai-colors'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎨 AI Colors
              </button>
              <button
                onClick={() => setActiveTab('manual-colors')}
                className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'manual-colors'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎨 Manual
              </button>
              <button
                onClick={() => setActiveTab('fonts')}
                className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'fonts'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✍️ Fonts
              </button>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'ai-cover' && (
                <AICoverGenerator
                  proposalId={id || ''}
                  projectTitle={proposal.projectTitle || proposal.title || ''}
                  company={proposal.companyName || ''}
                  industry={proposal.extractedData?.industry || 'Technology'}
                  clientName={proposal.clientName}
                  existingCompanyLogo={proposal.branding?.companyLogo}
                  existingClientLogo={proposal.branding?.clientLogo}
                  onSelectDesign={handleSelectAICoverDesign}
                />
              )}
              {activeTab === 'ai-colors' && (
                <AIColorDesigner
                  onApplyColors={handleApplyColors}
                  initialPrompt={proposal.title || ''}
                />
              )}
              {activeTab === 'manual-colors' && (
                <ManualColorPicker
                  initialColors={proposal.branding}
                  onApplyColors={handleApplyColors}
                />
              )}
              {activeTab === 'fonts' && (
                <FontDesigner
                  initialFonts={{
                    headingFont: proposal.branding?.headingFont,
                    bodyFont: proposal.branding?.fontFamily,
                  }}
                  onApplyFonts={handleApplyFonts}
                />
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      Live Preview
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Changes apply in real-time
                    </p>
                  </div>
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewZoom(Math.max(30, previewZoom - 10))}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-700"
                      title="Zoom Out"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                      {previewZoom}%
                    </span>
                    <button
                      onClick={() => setPreviewZoom(Math.min(100, previewZoom + 10))}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-700"
                      title="Zoom In"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPreviewZoom(50)}
                      className="px-2 py-1 text-xs hover:bg-white rounded transition-colors text-gray-600"
                      title="Reset Zoom"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-gray-100 overflow-y-auto flex items-start justify-center" style={{padding: '1rem 0'}}>
                <div style={{transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease'}}>
                {proposal && (
                  <ProposalPreview
                    proposal={{
                      id: proposal.id,
                      title: proposal.projectTitle || proposal.title || 'Untitled Proposal',
                      clientName: proposal.clientName,
                      clientCompany: proposal.clientCompany,
                      companyName: proposal.companyName,
                      date: proposal.createdAt || new Date().toISOString(),
                      sections: (() => {
                        const baseSections = Array.isArray(proposal.sections)
                          ? proposal.sections
                          : Object.entries(proposal.generatedContent?.sections || {}).map(([id, data]: [string, any], index) => ({
                              id,
                              type: data.type || 'general',
                              title: data.title,
                              content: data.content,
                              data: {
                                ...data.data,
                                visualizations: data.visualizations || [], // Include AI-generated visualizations
                              },
                              order: index + 2, // Start from 2 to make room for cover page
                            }));

                        // Prepend cover page if it doesn't exist
                        const hasCoverPage = baseSections.some(s => s.type === 'cover_page');
                        if (!hasCoverPage) {
                          return [
                            {
                              id: 'cover-page',
                              type: 'cover_page',
                              title: proposal.projectTitle || proposal.title || 'Proposal',
                              content: '',
                              data: {},
                              order: 0,
                            },
                            ...baseSections,
                          ];
                        }
                        return baseSections;
                      })(),
                      branding: {
                        ...(proposal.branding || {
                          primaryColor: '#3b82f6',
                          secondaryColor: '#10b981',
                          accentColor: '#FFB347',
                        }),
                        // Convert logo URLs using dynamic asset URL fixer
                        companyLogo: fixAssetUrl(proposal.branding?.companyLogo),
                        clientLogo: fixAssetUrl(proposal.branding?.clientLogo),
                        coverImage: fixAssetUrl(proposal.branding?.coverImage),
                      },
                      extractedData: proposal.extractedData || {},
                    }}
                  />
                )}
                {!proposal && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No proposal data available</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
