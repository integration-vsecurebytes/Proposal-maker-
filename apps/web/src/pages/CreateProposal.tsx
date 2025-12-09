import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProposalChat } from '../components/chat/ProposalChat';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { proposalApi, conversationApi, getApiUrl } from '../lib/api';
import ProposalGenerationProgress from '../components/proposal/ProposalGenerationProgress';

interface GenerationProgress {
  totalSections: number;
  completedSections: number;
  currentSection: string;
  percentage: number;
}

export function CreateProposal() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!templateId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">Please select a template to continue</p>
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleComplete = async (conversationId: string) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      setProgress(null);

      // Get conversation to find proposal ID
      const conversation = await conversationApi.get(conversationId);
      const proposalId = conversation.proposalId;

      if (!proposalId) {
        throw new Error('Proposal ID not found');
      }

      // Connect to SSE endpoint for real-time progress
      // Use getApiUrl() for consistent URL construction (respects Vite proxy in dev)
      const apiUrl = getApiUrl();
      const eventSource = new EventSource(
        `${apiUrl}/api/proposals/${proposalId}/generate?stream=true`,
        { withCredentials: false }
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('Connected to generation stream:', data.message);
              break;

            case 'progress':
              setProgress({
                totalSections: data.totalSections,
                completedSections: data.completedSections,
                currentSection: data.currentSection,
                percentage: data.percentage,
              });
              break;

            case 'complete':
              console.log('Generation complete:', data.message);
              setGeneratedProposalId(proposalId);
              setGenerationComplete(true);
              setIsGenerating(false);
              eventSource.close();

              // Auto-redirect after 2 seconds
              setTimeout(() => {
                navigate(`/proposal/${proposalId}`);
              }, 2000);
              break;

            case 'error':
              console.error('Generation error:', data.message);
              setGenerationError(data.message);
              setIsGenerating(false);
              eventSource.close();
              break;
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setGenerationError('Connection lost. Please try again.');
        setIsGenerating(false);
        eventSource.close();
      };

      // Store event source for cleanup
      (window as any).__generationEventSource = eventSource;
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to generate proposal. Please try again.'
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-xl font-bold">Create New Proposal</h1>
              <p className="text-sm text-muted-foreground">
                Let's gather the information needed for your proposal
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isGenerating || generationComplete ? (
          <ProposalGenerationProgress
            progress={progress}
            isComplete={generationComplete}
            error={generationError || undefined}
          />
        ) : (
          <ProposalChat templateId={templateId} onComplete={handleComplete} />
        )}
      </main>
    </div>
  );
}
