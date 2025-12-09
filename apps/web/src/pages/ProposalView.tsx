import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proposalApi, getApiUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, FileDown, Loader2, RefreshCw, Plus, Eye, Edit, Settings, Palette, Sparkles } from 'lucide-react';
import { VisualizationPanel } from '../components/visualizations/VisualizationPanel';
import { ChartPreview } from '../components/visualizations/ChartPreview';
import { DiagramPreview } from '../components/visualizations/DiagramPreview';
import { ProposalPreview } from '../components/preview';
import { BrandingEditor } from '../components/branding/BrandingEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const API_BASE_URL = getApiUrl();

// Helper to convert relative URLs to absolute
const toAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    const baseUrl = API_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}${url}`;
  }
  return url;
};

export function ProposalView() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [visualizations, setVisualizations] = useState<any[]>([]);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    if (!proposalId) return;

    try {
      setLoading(true);
      const data = await proposalApi.get(proposalId);
      setProposal(data);

      // Load template to get styles and assets
      if (data.templateId) {
        try {
          const response = await fetch(`/api/templates/${data.templateId}`);
          const templateData = await response.json();
          setTemplate(templateData);
        } catch (err) {
          console.error('Failed to load template:', err);
        }
      }

      await loadVisualizations();
    } catch (error) {
      console.error('Failed to load proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVisualizations = async () => {
    if (!proposalId) return;

    try {
      const response = await fetch(
        `/api/visualizations/proposal/${proposalId}`
      );
      const data = await response.json();

      if (data.success) {
        setVisualizations(data.visualizations || []);
      }
    } catch (error) {
      console.error('Failed to load visualizations:', error);
    }
  };

  const handleVisualizationCreated = (visualization: any) => {
    setVisualizations([...visualizations, visualization]);
    setAddingToSection(null);
  };

  const handleRegenerateSection = async (sectionId: string) => {
    if (!proposalId) return;

    try {
      setRegenerating(sectionId);
      await proposalApi.regenerateSection(proposalId, sectionId);
      await loadProposal();
    } catch (error) {
      console.error('Failed to regenerate section:', error);
      alert('Failed to regenerate section. Please try again.');
    } finally {
      setRegenerating(null);
    }
  };

  const handleBrandingSave = async (branding: any) => {
    if (!proposalId) return;

    try {
      // Update proposal branding
      await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding }),
      });

      // Also update template if it exists
      if (template?.id) {
        await fetch(`/api/templates/${template.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema: {
              ...template.schema,
              branding: {
                primary_color: branding.primaryColor,
                secondary_color: branding.secondaryColor,
                accent_color: branding.accentColor,
                body_font: branding.fontFamily,
                heading_font: branding.headingFont,
              },
            },
            assets: {
              ...template.assets,
              company_logo: branding.companyLogo,
              client_logo: branding.clientLogo,
            },
          }),
        });
      }

      // Reload proposal to reflect changes
      await loadProposal();
      setBrandingDialogOpen(false);
      alert('Branding updated successfully!');
    } catch (error) {
      console.error('Failed to update branding:', error);
      alert('Failed to update branding. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Proposal Not Found</h2>
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const generatedContent = proposal.generatedContent || {};
  const sections = generatedContent.sections || {};

  // Transform proposal data for ProposalPreview
  const transformedProposal = {
    id: proposal.id,
    title: proposal.projectTitle || 'Untitled Proposal',
    clientName: proposal.clientName,
    clientCompany: proposal.clientCompany,
    companyName: proposal.companyName || 'Your Company',
    date: proposal.createdAt,
    sections: Object.entries(sections).map(([id, data]: [string, any], index) => ({
      id,
      type: data.type || 'general',
      title: data.title,
      content: data.content,
      data: {
        ...data.data,
        visualizations: data.visualizations || [], // Include AI-generated visualizations
      },
      order: index + 1,
    })),
    branding: {
      // Extract from template.schema.branding
      primaryColor: template?.schema?.branding?.primary_color || '#3b82f6',
      secondaryColor: template?.schema?.branding?.secondary_color || '#10b981',
      accentColor: template?.schema?.branding?.accent_color || '#FFB347',
      successColor: template?.schema?.branding?.success_color || '#4ECDC4',
      warningColor: template?.schema?.branding?.warning_color || '#FF6B6B',
      fontFamily: template?.schema?.branding?.body_font || 'Inter, system-ui, sans-serif',
      headingFont: template?.schema?.branding?.heading_font || 'Arial',
      // Convert logo URLs to absolute
      companyLogo: toAbsoluteUrl(template?.assets?.company_logo || proposal.branding?.companyLogo || ''),
      clientLogo: toAbsoluteUrl(template?.assets?.client_logo || proposal.branding?.clientLogo || ''),
      coverImage: toAbsoluteUrl(template?.assets?.cover_image || ''),
      // Header and Footer configuration
      header: {
        enabled: true,
        logo: toAbsoluteUrl(template?.assets?.company_logo || proposal.branding?.companyLogo || ''),
        text: proposal.companyName || 'Your Company',
        logoPosition: 'left',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      },
      footer: {
        enabled: true,
        logo: toAbsoluteUrl(template?.assets?.company_logo || proposal.branding?.companyLogo || ''),
        companyInfo: proposal.companyName || 'Your Company',
        email: proposal.extractedData?.contactEmail || '',
        phone: proposal.extractedData?.contactPhone || '',
        website: proposal.extractedData?.website || '',
        logoPosition: 'left',
        backgroundColor: '#f9fafb',
      },
      // Include any other branding properties from proposal
      ...proposal.branding,
    },
    extractedData: proposal,
    template: template, // Pass full template for layout
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">{proposal.projectTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {proposal.clientCompany} - Generated Proposal
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* View mode toggle */}
              <div className="flex border border-gray-300 rounded-lg p-1">
                <Button
                  variant={viewMode === 'edit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('edit')}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </div>

              {/* AI Designer Button */}
              <Button
                onClick={() => navigate(`/proposals/${proposalId}/design`)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                title="AI Design System - Colors, Fonts, Branding"
              >
                <Palette className="w-4 h-4" />
                <Sparkles className="w-3 h-3" />
                AI Designer
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  window.open(`/api/export/${proposalId}/docx`, '_blank');
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export DOCX
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </Button>

              {/* Branding Customization Button */}
              <Dialog open={brandingDialogOpen} onOpenChange={setBrandingDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Customize Branding
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Customize Branding & Logos</DialogTitle>
                  </DialogHeader>
                  <BrandingEditor
                    proposalId={proposalId || ''}
                    currentBranding={transformedProposal.branding}
                    onSave={handleBrandingSave}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {viewMode === 'preview' ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <ProposalPreview proposal={transformedProposal} />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(sections).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No content generated yet. Please complete the conversation to generate content.
                  </p>
                </CardContent>
              </Card>
            ) : (
            Object.entries(sections).map(([sectionId, sectionData]: [string, any]) => {
              const sectionVisualizations = visualizations.filter(
                (v) => v.sectionId === sectionId
              );

              return (
                <Card key={sectionId} className="group">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{sectionData.title}</CardTitle>
                    <div className="flex gap-2">
                      <Dialog
                        open={addingToSection === sectionId}
                        onOpenChange={(open) => setAddingToSection(open ? sectionId : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Chart/Diagram
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Visualization to {sectionData.title}</DialogTitle>
                          </DialogHeader>
                          <VisualizationPanel
                            proposalId={proposalId!}
                            sectionId={sectionId}
                            onVisualizationCreated={handleVisualizationCreated}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateSection(sectionId)}
                        disabled={regenerating === sectionId}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {regenerating === sectionId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Content */}
                    <div className="prose prose-sm max-w-none">
                      {sectionData.contentType === 'bullets' ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {sectionData.content
                            .split('\n')
                            .filter((line: string) => line.trim() && !line.trim().startsWith('{'))
                            .map((line: string, idx: number) => (
                              <li key={idx}>{line.replace(/^[•\-\*]\s*/, '')}</li>
                            ))}
                        </ul>
                      ) : sectionData.contentType === 'table' ? (
                        <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded">
                          {sectionData.content}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {sectionData.content
                            .split('\n')
                            .filter((line: string) => !line.trim().startsWith('{') && !line.trim().startsWith('```json'))
                            .filter((line: string) => line.trim() !== '```')
                            .join('\n')}
                        </div>
                      )}
                    </div>

                    {/* AI-Generated Visualizations */}
                    {sectionData.visualizations && sectionData.visualizations.length > 0 && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700">Visual Elements</h4>
                        {sectionData.visualizations.map((viz: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                            <div className="text-xs text-gray-500 mb-2">Type: {viz.type}</div>
                            <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-40">
                              {JSON.stringify(viz.data, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Database visualizations (manually added) */}
                    {sectionVisualizations.length > 0 && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700">Custom Visualizations</h4>
                        {sectionVisualizations.map((viz) => (
                          <div key={viz.id}>
                            {viz.type === 'chart' ? (
                              <ChartPreview config={viz.config} height={350} />
                            ) : (
                              <DiagramPreview config={viz.config} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {sectionData.edited && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Edited manually on {new Date(sectionData.editedAt).toLocaleString()}
                      </p>
                    )}

                    {!sectionData.edited && sectionData.generatedAt && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Generated on {new Date(sectionData.generatedAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
