import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Loader2, Eye, Trash2, Calendar } from 'lucide-react';
import { proposalApi } from '../lib/api';

export function ProposalsList() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals');
      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProposal = async (proposalId: string, proposalTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${proposalTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload proposals list
        loadProposals();
      } else {
        const error = await response.json();
        alert(`Failed to delete proposal: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete proposal:', error);
      alert('Failed to delete proposal');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      generated: 'bg-green-100 text-green-800',
      reviewed: 'bg-purple-100 text-purple-800',
      sent: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Your Proposals</h1>
              <p className="text-muted-foreground text-sm">
                View and manage all generated proposals
              </p>
            </div>
            <Button onClick={() => navigate('/')}>
              Create New Proposal
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first proposal to get started
              </p>
              <Button onClick={() => navigate('/')}>
                Create Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {proposal.projectTitle || 'Untitled Proposal'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {proposal.clientCompany}
                      </p>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Info */}
                    <div className="text-sm space-y-1">
                      {proposal.budget && (
                        <p className="text-muted-foreground">
                          Budget: <span className="font-medium text-foreground">{proposal.budget}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Progress */}
                    {proposal.status === 'in_progress' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Generation progress</span>
                          <span className="font-medium">
                            {proposal.generatedContent?.sections ?
                              Object.keys(proposal.generatedContent.sections).length : 0} sections
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{
                              width: `${proposal.generatedContent?.sections ?
                                (Object.keys(proposal.generatedContent.sections).length / 9) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/proposal/${proposal.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {proposal.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/proposal/${proposal.id}?resume=true`)}
                        >
                          Continue
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProposal(proposal.id, proposal.projectTitle || 'Untitled Proposal');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
