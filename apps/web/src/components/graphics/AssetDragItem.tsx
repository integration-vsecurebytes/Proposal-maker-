'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GraphicAsset, useAssetsStore } from '@/stores/assets';
import { motion } from 'framer-motion';

interface AssetDragItemProps {
  asset: GraphicAsset;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function AssetDragItem({
  asset,
  showName = true,
  size = 'md',
}: AssetDragItemProps) {
  const setSelectedAsset = useAssetsStore((state) => state.setSelectedAsset);
  const selectedAsset = useAssetsStore((state) => state.selectedAsset);
  const addToFavorites = useAssetsStore((state) => state.addToFavorites);
  const removeFromFavorites = useAssetsStore((state) => state.removeFromFavorites);
  const favorites = useAssetsStore((state) => state.favorites);

  const isFavorite = favorites.includes(asset.id);
  const isSelected = selectedAsset?.id === asset.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: asset.id,
      data: {
        asset,
        type: 'graphic-asset',
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      // Meta/Ctrl + Click = Toggle favorite
      if (isFavorite) {
        removeFromFavorites(asset.id);
      } else {
        addToFavorites(asset.id);
      }
    } else {
      // Regular click = Select/preview
      setSelectedAsset(isSelected ? null : asset);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFromFavorites(asset.id);
    } else {
      addToFavorites(asset.id);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`group relative cursor-move ${
        isDragging ? 'opacity-50 z-50' : 'opacity-100'
      }`}
    >
      <div
        className={`${sizeClasses[size]} bg-white rounded-lg border-2 shadow-sm overflow-hidden transition-all ${
          isSelected
            ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
        }`}
      >
        {/* Asset Preview */}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-2">
          {asset.preview_url ? (
            <img
              src={asset.preview_url}
              alt={asset.name}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 rounded opacity-75" />
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-1 left-1 bg-white bg-opacity-90 text-xs font-medium text-gray-600 px-1.5 py-0.5 rounded shadow-sm">
          {asset.category === 'illustration' && '🎨'}
          {asset.category === 'icon' && '✦'}
          {asset.category === 'pattern' && '◈'}
          {asset.category === 'decorative' && '✿'}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-1 right-1 w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-50"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <span className="text-yellow-500 text-sm">★</span>
          ) : (
            <span className="text-gray-400 text-sm">☆</span>
          )}
        </button>

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded shadow-lg">
              Dragging...
            </div>
          </div>
        )}

        {/* Usage Count Badge (on hover) */}
        {asset.usage_count > 0 && (
          <div className="absolute bottom-1 right-1 bg-gray-800 bg-opacity-75 text-white text-xs font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Used {asset.usage_count}×
          </div>
        )}
      </div>

      {/* Asset Name */}
      {showName && (
        <div className="mt-1 px-1">
          <p className="text-xs font-medium text-gray-700 truncate text-center">
            {asset.name}
          </p>
          {asset.style && (
            <p className="text-xs text-gray-500 truncate text-center capitalize">
              {asset.style}
            </p>
          )}
        </div>
      )}

      {/* Quick Info on Hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
          <p className="font-medium">{asset.name}</p>
          <p className="text-gray-300 mt-0.5">
            {asset.category} • {asset.style}
          </p>
          {asset.tags.length > 0 && (
            <p className="text-gray-400 mt-0.5">
              {asset.tags.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
