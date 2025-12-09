import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../../lib/api';

const API_BASE_URL = getApiUrl();

interface LogoUploaderProps {
  type: 'company_logo' | 'client_logo';
  proposalId?: string;
  currentLogo?: string;
  onUploadComplete: (assetId: string, url: string) => void;
}

export function LogoUploader({
  type,
  proposalId,
  currentLogo,
  onUploadComplete,
}: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (proposalId) {
        formData.append('proposalId', proposalId);
      }
      formData.append('width', '400');
      formData.append('height', '200');
      formData.append('fit', 'inside');
      formData.append('format', 'base64');

      const response = await axios.post(
        `${API_BASE_URL}/api/assets/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        onUploadComplete(response.data.asset.id, response.data.asset.base64);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload logo');
      setPreviewUrl(currentLogo || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {type === 'company_logo' ? 'Company Logo' : 'Client Logo'}
        </label>
        {previewUrl && (
          <button
            onClick={handleRemove}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      {/* Upload area */}
      <div
        onClick={!uploading ? handleBrowse : undefined}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
          previewUrl
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-blue-400 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : previewUrl ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="max-h-32 max-w-full mx-auto rounded"
              />
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Click to change logo</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Recommended size: 400x200px. Logo will be automatically resized to fit.
      </p>
    </div>
  );
}
