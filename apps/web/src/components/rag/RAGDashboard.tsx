import { useState, useEffect } from 'react';
import { ragApi } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Search, Database, TrendingUp, FileText, Loader2 } from 'lucide-react';

export function RAGDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ragApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await ragApi.search(searchQuery, { topK: 5 });
      setSearchResults(response.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Indexed Chunks</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChunks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Document sections indexed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Winning Proposals</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWinningProposals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              High-quality examples
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Industries */}
      {stats?.topIndustries && stats.topIndustries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Most common industries in indexed proposals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topIndustries.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.industry}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Project Types */}
      {stats?.topProjectTypes && stats.topProjectTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Project Types</CardTitle>
            <CardDescription>Most common project types in indexed proposals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topProjectTypes.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.projectType}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Search RAG Index</CardTitle>
          <CardDescription>
            Find similar content from indexed proposals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for similar proposals..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-sm font-medium">
                Found {searchResults.length} similar results:
              </p>
              {searchResults.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {result.source.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary">
                        {(result.similarity * 100).toFixed(1)}% match
                      </span>
                    </div>

                    {result.metadata?.title && (
                      <h4 className="font-medium text-sm mb-2">{result.metadata.title}</h4>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {result.content}
                    </p>

                    {result.metadata && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {result.metadata.industry && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {result.metadata.industry}
                          </span>
                        )}
                        {result.metadata.projectType && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            {result.metadata.projectType}
                          </span>
                        )}
                        {result.metadata.winRate && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {result.metadata.winRate}% win rate
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results found. Try a different search query.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
