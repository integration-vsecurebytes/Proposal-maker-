import { useState } from 'react';
import { Upload, Image as ImageIcon, X, Palette, Layout, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../../lib/api';

const API_BASE_URL = getApiUrl();

interface CoverPageCustomizerProps {
  proposalId: string;
  initialBranding?: any;
  onApplyBranding?: (branding: any) => void;
}

const COVER_LAYOUTS = [
  {
    id: 'centered',
    name: 'Centered Classic',
    description: 'Logo and title centered',
    preview: '📄',
  },
  {
    id: 'left-aligned',
    name: 'Left Aligned',
    description: 'Content aligned to left',
    preview: '📋',
  },
  {
    id: 'split',
    name: 'Split Design',
    description: 'Logo left, content right',
    preview: '📑',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, simple layout',
    preview: '📃',
  },
];

const BACKGROUND_STYLES = [
  { id: 'gradient', name: 'Gradient', value: 'gradient' },
  { id: 'solid', name: 'Solid Color', value: 'solid' },
  { id: 'pattern', name: 'Pattern', value: 'pattern' },
  { id: 'image', name: 'Custom Image', value: 'image' },
];

export function CoverPageCustomizer({
  proposalId,
  initialBranding,
  onApplyBranding,
}: CoverPageCustomizerProps) {
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

  const [branding, setBranding] = useState({
    companyLogo: toAbsoluteUrl(initialBranding?.companyLogo || ''),
    clientLogo: toAbsoluteUrl(initialBranding?.clientLogo || ''),
    coverImage: toAbsoluteUrl(initialBranding?.coverImage || ''),
    coverLayout: initialBranding?.coverLayout || 'centered',
    backgroundStyle: initialBranding?.backgroundStyle || 'gradient',
    backgroundColor: initialBranding?.backgroundColor || '#ffffff',
    showClientLogo: initialBranding?.showClientLogo !== false,
    showDate: initialBranding?.showDate !== false,
  });

  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (file: File, type: 'companyLogo' | 'clientLogo' | 'coverImage') => {
    try {
      setUploading(type);

      // Validate file
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG, JPG, etc.)');
        setUploading(null);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        setUploading(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('proposalId', proposalId);

      console.log('Uploading file:', file.name, 'Type:', type, 'Size:', file.size);

      const response = await axios.post(`${API_BASE_URL}/api/assets/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Upload response:', response.data);

      // The API returns { success: true, asset: { url, ... } }
      let assetUrl = response.data.asset?.url || response.data.url;

      if (!assetUrl) {
        throw new Error('No URL returned from upload');
      }

      // If URL is relative, prepend the API base URL
      if (assetUrl.startsWith('/')) {
        // In dev mode, API_BASE_URL might be empty (using Vite proxy)
        // For static assets, we need the actual API server URL
        const baseUrl = API_BASE_URL || 'http://localhost:4000';
        assetUrl = `${baseUrl}${assetUrl}`;
      }

      console.log('Final asset URL:', assetUrl);

      setBranding((prev) => ({
        ...prev,
        [type]: assetUrl,
      }));

      alert('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload image';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = (type: 'companyLogo' | 'clientLogo' | 'coverImage') => {
    setBranding((prev) => ({
      ...prev,
      [type]: '',
    }));
  };

  const handleApply = () => {
    if (onApplyBranding) {
      onApplyBranding(branding);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Cover Page Customizer</h2>
        <p className="text-gray-600">Design your proposal cover page</p>
      </div>

      {/* Layout Selection */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Cover Layout
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COVER_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => setBranding((prev) => ({ ...prev, coverLayout: layout.id }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                branding.coverLayout === layout.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-4xl mb-2">{layout.preview}</div>
              <h4 className="font-semibold text-sm text-gray-900">{layout.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{layout.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Logo Uploads */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logos & Images
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Company Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
              {branding.companyLogo ? (
                <div className="relative">
                  <img
                    src={branding.companyLogo}
                    alt="Company Logo"
                    className="w-full h-32 object-contain"
                  />
                  <button
                    onClick={() => handleRemoveImage('companyLogo')}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : uploading === 'companyLogo' ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-xs text-blue-600">Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to Upload</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG (Max 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'companyLogo');
                      e.target.value = ''; // Reset input
                    }}
                    disabled={uploading === 'companyLogo'}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Client Logo */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-900 mb-2">
              <span>Client Logo</span>
              <input
                type="checkbox"
                checked={branding.showClientLogo}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, showClientLogo: e.target.checked }))
                }
                className="rounded"
              />
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
              {branding.clientLogo ? (
                <div className="relative">
                  <img
                    src={branding.clientLogo}
                    alt="Client Logo"
                    className="w-full h-32 object-contain"
                  />
                  <button
                    onClick={() => handleRemoveImage('clientLogo')}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : uploading === 'clientLogo' ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-xs text-blue-600">Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to Upload</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG (Max 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'clientLogo');
                      e.target.value = ''; // Reset input
                    }}
                    disabled={uploading === 'clientLogo'}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Cover Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Background Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
              {branding.coverImage ? (
                <div className="relative">
                  <img
                    src={branding.coverImage}
                    alt="Cover Background"
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => handleRemoveImage('coverImage')}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : uploading === 'coverImage' ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-xs text-blue-600">Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to Upload</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG (Max 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'coverImage');
                      e.target.value = ''; // Reset input
                    }}
                    disabled={uploading === 'coverImage'}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Background Style */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Background Style
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {BACKGROUND_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setBranding((prev) => ({ ...prev, backgroundStyle: style.value }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                branding.backgroundStyle === style.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-sm">{style.name}</p>
            </button>
          ))}
        </div>

        {branding.backgroundStyle === 'solid' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.backgroundColor}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, backgroundColor: e.target.value }))
                }
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.backgroundColor}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, backgroundColor: e.target.value }))
                }
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={branding.showDate}
              onChange={(e) => setBranding((prev) => ({ ...prev, showDate: e.target.checked }))}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm text-gray-700">Show Date on Cover Page</span>
          </label>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
        <div
          className="relative min-h-[400px] rounded-lg overflow-hidden border-2 border-gray-200 flex flex-col items-center justify-center p-8"
          style={{
            ...(branding.backgroundStyle === 'gradient'
              ? {
                  backgroundImage: 'linear-gradient(135deg, #3b82f615 0%, #10b98110 50%, #FFB34715 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : branding.backgroundStyle === 'solid'
              ? {
                  backgroundColor: branding.backgroundColor,
                }
              : branding.backgroundStyle === 'image' && branding.coverImage
              ? {
                  backgroundImage: `url(${branding.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  backgroundColor: '#ffffff',
                }),
          }}
        >
          {/* Company Logo */}
          {branding.companyLogo && (
            <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
              <img
                src={branding.companyLogo}
                alt="Company Logo"
                className="h-24 w-auto object-contain max-w-[200px]"
                onError={(e) => {
                  console.error('Logo failed to load:', branding.companyLogo);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Your Proposal Title
          </h1>

          {/* Subtitle */}
          <div className="w-24 h-1 bg-blue-600 rounded-full mb-6"></div>

          {/* Client Info */}
          <div className="text-center space-y-2 mb-8">
            <p className="text-lg text-gray-700">
              <span className="font-semibold">Client Company</span>
            </p>
            <p className="text-gray-600">Client Name</p>
            {branding.showDate && (
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Client Logo */}
          {branding.showClientLogo && branding.clientLogo && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              <img
                src={branding.clientLogo}
                alt="Client Logo"
                className="h-16 w-auto object-contain max-w-[150px]"
                onError={(e) => {
                  console.error('Client logo failed to load:', branding.clientLogo);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Layout Badge */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
            {COVER_LAYOUTS.find((l) => l.id === branding.coverLayout)?.name || 'Layout'}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        {(branding.companyLogo || branding.clientLogo || branding.coverImage) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">✓ Changes ready to apply</p>
            <p className="text-xs text-blue-600 mt-1">
              Click the button below to save your design and see it in the main preview
            </p>
          </div>
        )}
        <button
          onClick={handleApply}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Layout className="h-5 w-5" />
          Apply Cover Page Design
        </button>
      </div>

      {/* Tips */}
      <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
        <h4 className="text-sm font-semibold text-purple-900 mb-2">💡 Cover Page Tips</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Use high-quality logos (PNG with transparent background works best)</li>
          <li>• Keep the design clean and professional</li>
          <li>• Ensure text is readable against the background</li>
          <li>• Client logo is optional - include if you have permission</li>
        </ul>
      </div>
    </div>
  );
}
