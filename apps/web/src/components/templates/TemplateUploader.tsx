import { useState, useCallback } from 'react';
import { useTemplateStore } from '../../stores/template';
import { templateApi } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function TemplateUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { setTemplates } = useTemplateStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.docx')) {
      setFile(droppedFile);
      // Auto-generate name from filename
      const name = droppedFile.name.replace('.docx', '').replace(/[-_]/g, ' ');
      setTemplateName(name);
      setError(null);
    } else {
      setError('Please upload a .docx file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
      const name = selectedFile.name.replace('.docx', '').replace(/[-_]/g, ' ');
      setTemplateName(name);
      setError(null);
    } else {
      setError('Please select a .docx file');
    }
  };

  const handleUpload = async () => {
    if (!file || !templateName.trim()) {
      setError('Please provide both file and template name');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const result = await templateApi.upload(file, templateName, useAI, (prog) => {
        setProgress(prog);
      });

      setUploadResult(result);

      // Reload templates
      const templates = await templateApi.list();
      setTemplates(templates);

      // Reset form
      setFile(null);
      setTemplateName('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload template');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTemplateName('');
    setUploadResult(null);
    setError(null);
  };

  if (uploadResult) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <CardTitle className="text-green-900">Template Uploaded Successfully!</CardTitle>
              <CardDescription className="text-green-700">
                {uploadResult.template.name} has been extracted and saved
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Basic Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-900">Sections Extracted</p>
                <p className="text-green-700">{uploadResult.extracted.sectionsCount}</p>
              </div>
              <div>
                <p className="font-medium text-green-900">Images Found</p>
                <p className="text-green-700">{uploadResult.extracted.imagesCount}</p>
              </div>
              {uploadResult.extracted.industry && (
                <div>
                  <p className="font-medium text-green-900">Industry</p>
                  <p className="text-green-700">{uploadResult.extracted.industry}</p>
                </div>
              )}
              {uploadResult.extracted.colors?.primary && (
                <div>
                  <p className="font-medium text-green-900">Primary Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: uploadResult.extracted.colors.primary }}
                    />
                    <p className="text-green-700">{uploadResult.extracted.colors.primary}</p>
                  </div>
                </div>
              )}
              {uploadResult.extracted.fonts?.heading && (
                <div>
                  <p className="font-medium text-green-900">Heading Font</p>
                  <p className="text-green-700">{uploadResult.extracted.fonts.heading}</p>
                </div>
              )}
            </div>

            {/* Image Placements */}
            {uploadResult.extracted.placements && Object.keys(uploadResult.extracted.placements).length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-3">
                  📍 Image Placements Detected
                </p>
                <div className="space-y-2 text-xs text-green-700">
                  {uploadResult.extracted.placements.companyLogo && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[100px]">Company Logo:</span>
                      <span>
                        {uploadResult.extracted.placements.companyLogo.location} @{' '}
                        {uploadResult.extracted.placements.companyLogo.position}
                      </span>
                    </div>
                  )}
                  {uploadResult.extracted.placements.headerLogo && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[100px]">Header Logo:</span>
                      <span>
                        {uploadResult.extracted.placements.headerLogo.location} @{' '}
                        {uploadResult.extracted.placements.headerLogo.position}
                        {uploadResult.extracted.placements.headerLogo.repeatsOnPages && (
                          <span className="text-green-600">
                            {' '}(repeats on {uploadResult.extracted.placements.headerLogo.repeatsOnPages} pages)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {uploadResult.extracted.placements.footerLogo && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[100px]">Footer Logo:</span>
                      <span>
                        {uploadResult.extracted.placements.footerLogo.location} @{' '}
                        {uploadResult.extracted.placements.footerLogo.position}
                        {uploadResult.extracted.placements.footerLogo.repeatsOnPages && (
                          <span className="text-green-600">
                            {' '}(repeats on {uploadResult.extracted.placements.footerLogo.repeatsOnPages} pages)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {uploadResult.extracted.placements.coverImage && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[100px]">Cover Image:</span>
                      <span>
                        {uploadResult.extracted.placements.coverImage.location} @{' '}
                        {uploadResult.extracted.placements.coverImage.position}
                      </span>
                    </div>
                  )}
                  {uploadResult.extracted.placements.thankYouSlide && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[100px]">Thank You Slide:</span>
                      <span>
                        {uploadResult.extracted.placements.thankYouSlide.location} (full page)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Results */}
          {uploadResult.extracted.aiPowered && uploadResult.extracted.confidence && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                🤖 AI Extraction Analysis
              </p>
              <div className="space-y-1 text-sm text-blue-700">
                <p>✓ Confidence Score: <span className="font-medium">{uploadResult.extracted.confidence}%</span></p>
                <p>✓ Models Used: Gemini 2.0 Flash (images) + GPT-4o (structure)</p>
                {uploadResult.extracted.designStyle && (
                  <p>✓ Style: <span className="font-medium">{uploadResult.extracted.designStyle.tone || 'Professional'}</span></p>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleReset} variant="outline" className="w-full">
            Upload Another Template
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Template</CardTitle>
        <CardDescription>
          Upload a DOCX file to automatically extract structure, styles, and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary/50'
          }`}
        >
          {file ? (
            <div className="space-y-3">
              <FileText className="w-12 h-12 mx-auto text-primary" />
              <div>
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
            <div className="space-y-3">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">Drop your DOCX file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".docx"
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

        {/* Template Name Input */}
        {file && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., My Company Proposal"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* AI Extraction Toggle */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="use-ai"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="use-ai" className="text-sm font-medium text-blue-900 cursor-pointer">
                  🤖 Use AI-Powered Extraction (Recommended)
                </label>
                <p className="text-xs text-blue-700 mt-1">
                  Uses Gemini 2.0 Flash + GPT-4o to intelligently identify logos, extract colors, and analyze document structure for better accuracy
                </p>
              </div>
            </div>
          </>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading and extracting...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

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
          disabled={!file || !templateName.trim() || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Extract Template
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Supported format: .docx (Microsoft Word 2007+)
        </p>
      </CardContent>
    </Card>
  );
}
