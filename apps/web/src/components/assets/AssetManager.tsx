import { useState, useEffect } from 'react';
import { Trash2, Download, Image as ImageIcon, FileText } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../../lib/api';

const API_BASE_URL = getApiUrl();

interface Asset {
  id: string;
  type: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface AssetManagerProps {
  proposalId: string;
}

export function AssetManager({ proposalId }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, [proposalId]);

  const loadAssets = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/assets/proposal/${proposalId}`
      );
      setAssets(response.data.assets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/assets/${assetId}`);
      setAssets(assets.filter((a) => a.id !== assetId));
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAssetIcon = (type: string) => {
    if (type.includes('logo')) return ImageIcon;
    if (type.includes('image') || type.includes('cover')) return ImageIcon;
    return FileText;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading assets...</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p>No assets uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Proposal Assets ({assets.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => {
          const Icon = getAssetIcon(asset.type);

          return (
            <div
              key={asset.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                {asset.url && asset.mimeType.startsWith('image/') ? (
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Icon className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {asset.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {asset.type.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(asset.size)}</span>
                  <span>
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {asset.url && (
                    <a
                      href={asset.url}
                      download={asset.filename}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
