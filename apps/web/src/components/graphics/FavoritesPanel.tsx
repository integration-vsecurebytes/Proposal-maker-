'use client';

import { useState } from 'react';
import { useAssetsStore } from '@/stores/assets';
import AssetDragItem from './AssetDragItem';
import { Star, Clock, Trash2 } from 'lucide-react';

type TabType = 'favorites' | 'recents';

export default function FavoritesPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('favorites');

  const favorites = useAssetsStore((state) => state.favorites);
  const recents = useAssetsStore((state) => state.recents);
  const getFavoriteGraphics = useAssetsStore((state) => state.getFavoriteGraphics);
  const getRecentGraphics = useAssetsStore((state) => state.getRecentGraphics);
  const removeFromFavorites = useAssetsStore((state) => state.removeFromFavorites);

  const favoriteGraphics = getFavoriteGraphics();
  const recentGraphics = getRecentGraphics();

  const handleClearRecents = () => {
    if (window.confirm('Clear all recent assets?')) {
      // Clear recents in store
      useAssetsStore.setState({ recents: [] });
    }
  };

  const handleRemoveFavorite = (assetId: string) => {
    removeFromFavorites(assetId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'favorites'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className={`h-4 w-4 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
            Favorites
            {favorites.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recents')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'recents'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            Recent
            {recents.length > 0 && (
              <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                {recents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'favorites' ? (
          favoriteGraphics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Star className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-700 font-medium">No favorites yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                <kbd className="px-1 bg-gray-100 border border-gray-300 rounded">Ctrl+Click</kbd>
                {' '}any asset to add it to favorites
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {favoriteGraphics.map((asset) => (
                <div key={asset.id} className="relative group">
                  <AssetDragItem asset={asset} showName={true} size="sm" />
                  <button
                    onClick={() => handleRemoveFavorite(asset.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Remove from favorites"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : recentGraphics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-700 font-medium">No recent assets</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Assets you preview or use will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-600">
                Last {recentGraphics.length} used
              </p>
              {recents.length > 0 && (
                <button
                  onClick={handleClearRecents}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recentGraphics.map((asset) => (
                <AssetDragItem key={asset.id} asset={asset} showName={true} size="sm" />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Tips */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        {activeTab === 'favorites' ? (
          <span>
            <span className="font-medium">Tip:</span> Keep your most-used assets here for quick access
          </span>
        ) : (
          <span>
            <span className="font-medium">Tip:</span> Recent assets are saved for this session
          </span>
        )}
      </div>
    </div>
  );
}
