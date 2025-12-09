import React, { useState } from 'react';
import { Upload, Sparkles, Loader2, CheckCircle2, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import axios from 'axios';
import { fixAssetUrl } from '../../lib/api';

// Use relative URLs to go through Vite proxy in development
// In production, axios will use the current origin
const API_BASE_URL = '';

interface CoverDesignVariation {
  id: string;
  name: string;
  description: string;
  templateId: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  zones: any;
  background: {
    type: 'solid' | 'gradient' | 'pattern' | 'image';
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      colors: string[];
      angle?: number;
    };
    opacity: number;
  };
  textSizes: {
    title: string;
    subtitle: string;
    date: string;
  };
  mood: string;
  industryFit: number;
}

interface ImageAnalysis {
  dominantColors: string[];
  colorPalette: string[];
  mood: string;
  style: string;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedCategories: string[];
  colorTemperature: 'warm' | 'cool' | 'neutral';
  brightness: 'dark' | 'light' | 'balanced';
}

interface AICoverGeneratorProps {
  proposalId: string;
  projectTitle: string;
  company: string;
  industry: string;
  clientName?: string;
  existingCompanyLogo?: string;
  existingClientLogo?: string;
  onSelectDesign: (design: CoverDesignVariation) => void;
}

export const AICoverGenerator: React.FC<AICoverGeneratorProps> = ({
  proposalId,
  projectTitle,
  company,
  industry,
  clientName,
  existingCompanyLogo,
  existingClientLogo,
  onSelectDesign,
}) => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<CoverDesignVariation[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // Logo uploads - initialize with existing logos from proposal
  const [companyLogo, setCompanyLogo] = useState<string | null>(existingCompanyLogo || null);
  const [clientLogo, setClientLogo] = useState<string | null>(existingClientLogo || null);
  const [uploadingLogo, setUploadingLogo] = useState<'company' | 'client' | null>(null);

  // Update local state when props change
  React.useEffect(() => {
    if (existingCompanyLogo && !companyLogo) {
      setCompanyLogo(existingCompanyLogo);
    }
    if (existingClientLogo && !clientLogo) {
      setClientLogo(existingClientLogo);
    }
  }, [existingCompanyLogo, existingClientLogo]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setUploadedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    await uploadImage(file);
  };

  // Upload image to server
  const uploadImage = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('proposalId', proposalId);
      formData.append('fileType', 'cover_image');

      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImagePath(response.data.filePath);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI cover designs
  const handleGenerateCovers = async () => {
    if (!imagePath) {
      setError('Please upload an image first');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-design/generate-covers`, {
        imagePath,
        projectTitle,
        company,
        industry,
        clientName,
        count: 6,
        provider: 'gemini',
      });

      setVariations(response.data.variations);
      setImageAnalysis(response.data.analysis);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate cover designs');
    } finally {
      setGenerating(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'company' | 'client') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Logo size must be less than 10MB');
      return;
    }

    setUploadingLogo(type);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('proposalId', proposalId);
      formData.append('fileType', type === 'company' ? 'company_logo' : 'client_logo');

      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const logoPath = response.data.filePath;

      // Update branding in backend
      const brandingUpdate = type === 'company'
        ? { companyLogo: logoPath }
        : { clientLogo: logoPath };

      await axios.put(`${API_BASE_URL}/api/proposals/${proposalId}/branding`, brandingUpdate);

      // Update local state
      if (type === 'company') {
        setCompanyLogo(logoPath);
      } else {
        setClientLogo(logoPath);
      }

      alert(`${type === 'company' ? 'Company' : 'Client'} logo uploaded successfully!`);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setError(err.response?.data?.error || `Failed to upload ${type} logo`);
    } finally {
      setUploadingLogo(null);
    }
  };

  // Select and apply design
  const handleSelectDesign = (variation: CoverDesignVariation) => {
    setSelectedVariation(variation.id);
    onSelectDesign(variation);
  };

  // Regenerate specific design with modifications
  const handleRegenerateDesign = async (variation: CoverDesignVariation) => {
    if (!imageAnalysis || !customPrompt) {
      setError('Please provide modifications');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-design/regenerate-cover`, {
        currentDesign: variation,
        modifications: customPrompt,
        imageAnalysis,
        provider: 'gemini',
      });

      // Replace the old variation with the new one
      setVariations((prev) =>
        prev.map((v) => (v.id === variation.id ? response.data.design : v))
      );
      setCustomPrompt('');
    } catch (err: any) {
      console.error('Regeneration error:', err);
      setError(err.response?.data?.error || 'Failed to regenerate design');
    } finally {
      setLoading(false);
    }
  };

  // Render background preview
  const renderBackgroundPreview = (bg: CoverDesignVariation['background'], colors: any) => {
    if (bg.type === 'solid') {
      return { backgroundColor: colors.background };
    }

    if (bg.type === 'gradient' && bg.gradient) {
      const { type, colors: gradColors, angle } = bg.gradient;
      if (type === 'linear') {
        return {
          background: `linear-gradient(${angle}deg, ${gradColors.join(', ')})`,
          opacity: bg.opacity,
        };
      }
      if (type === 'radial') {
        return {
          background: `radial-gradient(circle, ${gradColors.join(', ')})`,
          opacity: bg.opacity,
        };
      }
    }

    return { backgroundColor: colors.background };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wand2 className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold">AI Cover Page Generator</h2>
      </div>

      {/* Image Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cover-image">Upload Cover Image</Label>
            <p className="text-sm text-gray-500 mb-3">
              Upload an image (logo, photo, or graphic) and AI will generate professional cover
              designs
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <input
                id="cover-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="cover-image" className="cursor-pointer">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-48 rounded-lg object-contain"
                    />
                    <p className="text-sm text-gray-600">{uploadedImage?.name}</p>
                    <Button variant="outline" size="sm" asChild>
                      <span>Change Image</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG up to 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading image...</span>
            </div>
          )}

          {imagePath && !generating && (
            <Button
              onClick={handleGenerateCovers}
              disabled={generating || loading}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating AI Designs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Cover Designs
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Logo Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Logos</h3>
        <p className="text-sm text-gray-600 mb-4">
          AI will position your logos perfectly on the cover page
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Logo Upload */}
          <div>
            <Label htmlFor="company-logo">Your Company Logo</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
              <input
                id="company-logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, 'company')}
                className="hidden"
                disabled={uploadingLogo === 'company'}
              />
              <label htmlFor="company-logo" className="cursor-pointer">
                {companyLogo ? (
                  <div className="space-y-2">
                    <img
                      src={fixAssetUrl(companyLogo)}
                      alt="Company Logo"
                      className="mx-auto max-h-20 object-contain"
                      onError={(e) => {
                        console.error('Failed to load company logo:', companyLogo);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploadingLogo === 'company'}>
                      <span>{uploadingLogo === 'company' ? 'Uploading...' : 'Change Logo'}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      {uploadingLogo === 'company' ? 'Uploading...' : 'Click to upload'}
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Client Logo Upload */}
          <div>
            <Label htmlFor="client-logo">Client Logo (Optional)</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
              <input
                id="client-logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, 'client')}
                className="hidden"
                disabled={uploadingLogo === 'client'}
              />
              <label htmlFor="client-logo" className="cursor-pointer">
                {clientLogo ? (
                  <div className="space-y-2">
                    <img
                      src={fixAssetUrl(clientLogo)}
                      alt="Client Logo"
                      className="mx-auto max-h-20 object-contain"
                      onError={(e) => {
                        console.error('Failed to load client logo:', clientLogo);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploadingLogo === 'client'}>
                      <span>{uploadingLogo === 'client' ? 'Uploading...' : 'Change Logo'}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      {uploadingLogo === 'client' ? 'Uploading...' : 'Click to upload'}
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Analysis Results */}
      {imageAnalysis && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <h3 className="font-semibold mb-2 text-purple-900">Image Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Mood</p>
              <Badge variant="secondary">{imageAnalysis.mood}</Badge>
            </div>
            <div>
              <p className="text-gray-600">Style</p>
              <Badge variant="secondary">{imageAnalysis.style}</Badge>
            </div>
            <div>
              <p className="text-gray-600">Temperature</p>
              <Badge variant="secondary">{imageAnalysis.colorTemperature}</Badge>
            </div>
            <div>
              <p className="text-gray-600">Brightness</p>
              <Badge variant="secondary">{imageAnalysis.brightness}</Badge>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-gray-600 text-sm mb-2">Color Palette</p>
            <div className="flex gap-2">
              {imageAnalysis.colorPalette.slice(0, 6).map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Generated Variations */}
      {generating && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-medium">AI is creating your cover designs...</p>
          <p className="text-sm text-gray-500">This may take 10-20 seconds</p>
        </div>
      )}

      {variations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            {variations.length} AI-Generated Designs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variations.map((variation) => (
              <Card
                key={variation.id}
                className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  selectedVariation === variation.id ? 'ring-4 ring-purple-500' : ''
                }`}
                onClick={() => handleSelectDesign(variation)}
              >
                {/* Preview */}
                <div
                  className="h-48 p-6 relative"
                  style={renderBackgroundPreview(variation.background, variation.colors)}
                >
                  <div className="relative h-full flex flex-col justify-between">
                    <div style={{ color: variation.colors.text, fontFamily: variation.fonts.heading }}>
                      <p className="text-xs opacity-75">{company}</p>
                      <h4 className="text-xl font-bold mt-2">{projectTitle}</h4>
                    </div>
                    <div className="flex gap-2">
                      {variation.colors.primary && (
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: variation.colors.primary }}
                        />
                      )}
                      {variation.colors.accent && (
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: variation.colors.accent }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{variation.name}</h4>
                      <p className="text-xs text-gray-500">{variation.description}</p>
                    </div>
                    {selectedVariation === variation.id && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {variation.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {variation.mood}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {variation.industryFit}% fit
                    </Badge>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    <p>
                      <span className="font-medium">Fonts:</span> {variation.fonts.heading} /{' '}
                      {variation.fonts.body}
                    </p>
                    <p>
                      <span className="font-medium">Background:</span> {variation.background.type}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDesign(variation);
                    }}
                  >
                    {selectedVariation === variation.id ? 'Selected' : 'Select Design'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Regeneration Section */}
          {selectedVariation && (
            <Card className="p-6">
              <h4 className="font-semibold mb-3">Customize Selected Design</h4>
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe modifications (e.g., 'Make it more modern', 'Use darker colors', 'Change layout to center-aligned')"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => {
                    const selected = variations.find((v) => v.id === selectedVariation);
                    if (selected) handleRegenerateDesign(selected);
                  }}
                  disabled={!customPrompt || loading}
                  variant="secondary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Design
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AICoverGenerator;
