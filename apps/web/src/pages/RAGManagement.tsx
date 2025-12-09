import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WinningProposalUploader } from '../components/rag/WinningProposalUploader';
import { RAGDashboard } from '../components/rag/RAGDashboard';
import { Button } from '../components/ui/button';
import { ArrowLeft, Upload, BarChart3 } from 'lucide-react';

export function RAGManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('dashboard');

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
              Back to Home
            </Button>
            <div>
              <h1 className="text-xl font-bold">RAG System Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage winning proposals and indexed content for better AI generation
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard & Search
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Winning Proposal
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'dashboard' && <RAGDashboard />}
          {activeTab === 'upload' && <WinningProposalUploader />}
        </div>
      </main>
    </div>
  );
}
