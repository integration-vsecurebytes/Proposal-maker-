import { useState } from 'react';
import { ragApi } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function WinningProposalUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [projectType, setProjectType] = useState('');
  const [winRate, setWinRate] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        const name = selectedFile.name.replace(/\.(docx|txt)$/, '').replace(/[-_]/g, ' ');
        setTitle(name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('File and title are required');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      await ragApi.uploadWinningProposal({
        file,
        title: title.trim(),
        industry: industry.trim() || undefined,
        projectType: projectType.trim() || undefined,
        winRate: winRate ? parseInt(winRate) : undefined,
        companySize: companySize.trim() || undefined,
        dealValue: dealValue.trim() || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
      });

      setSuccess(true);
      // Reset form
      setFile(null);
      setTitle('');
      setIndustry('');
      setProjectType('');
      setWinRate('');
      setCompanySize('');
      setDealValue('');
      setTags('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload winning proposal');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <CardTitle className="text-green-900">Winning Proposal Indexed!</CardTitle>
              <CardDescription className="text-green-700">
                The proposal has been processed and is now available for RAG context retrieval
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Upload Another Proposal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Winning Proposal</CardTitle>
        <CardDescription>
          Add successful proposals to improve AI-generated content quality through RAG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Proposal File</label>
          {file ? (
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload DOCX or TXT file
              </p>
              <input
                type="file"
                accept=".docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-2 block">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., SharePoint Migration for Manufacturing"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Industry */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Manufacturing"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Project Type</label>
            <input
              type="text"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g., SharePoint Migration"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Win Rate & Company Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Win Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={winRate}
              onChange={(e) => setWinRate(e.target.value)}
              placeholder="e.g., 85"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select...</option>
              <option value="SMB">SMB (Small/Medium Business)</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Deal Value */}
        <div>
          <label className="text-sm font-medium mb-2 block">Deal Value</label>
          <input
            type="text"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            placeholder="e.g., $50,000 - $100,000"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., cloud, migration, enterprise"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || !title.trim() || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Index Proposal
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
