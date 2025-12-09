import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateSelector } from '../components/templates/TemplateSelector';
import { TemplateUploader } from '../components/templates/TemplateUploader';
import { Button } from '../components/ui/button';
import { Plus, FileText, Database } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const [showUploader, setShowUploader] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Proposal Generator</h1>
              <p className="text-muted-foreground text-sm">AI-Powered Proposal Creation System</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/proposals')} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                My Proposals
              </Button>
              <Button onClick={() => navigate('/rag')} variant="outline">
                <Database className="w-4 h-4 mr-2" />
                RAG Management
              </Button>
              <Button onClick={() => setShowUploader(!showUploader)} variant="outline">
                {showUploader ? (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    View Templates
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showUploader ? (
          <div className="max-w-2xl mx-auto">
            <TemplateUploader />
          </div>
        ) : (
          <TemplateSelector />
        )}
      </main>
    </div>
  );
}
