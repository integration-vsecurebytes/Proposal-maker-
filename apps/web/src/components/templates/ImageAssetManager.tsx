import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Trash2, Edit2, Save, X, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { templateApi } from '../../lib/api';

interface ImageAsset {
  id?: string;
  data: string;
  type?: string;
  name?: string;
  placement?: any;
  metadata?: {
    description?: string;
    confidence?: number;
    type?: string;
  };
}

interface ImageAssetManagerProps {
  templateId: string;
  assets: any;
  open: boolean;
  onClose: () => void;
  onSave: (updatedAssets: any) => void;
}

const IMAGE_ROLES = [
  { value: 'companyLogo', label: 'Company Logo', description: 'Main brand logo' },
  { value: 'headerLogo', label: 'Header Logo', description: 'Logo in header (repeats on all pages)' },
  { value: 'footerLogo', label: 'Footer Logo', description: 'Logo in footer (repeats on all pages)' },
  { value: 'coverImage', label: 'Cover Image', description: 'Hero image on cover page' },
  { value: 'thankYouSlide', label: 'Thank You Slide', description: 'Final slide/page' },
  { value: 'chart', label: 'Chart/Graph', description: 'Data visualization' },
  { value: 'diagram', label: 'Diagram', description: 'Flowchart or architecture diagram' },
  { value: 'photo', label: 'Photo', description: 'Professional photo' },
  { value: 'icon', label: 'Icon', description: 'Small decorative icon' },
  { value: 'decorative', label: 'Decorative', description: 'Background or decoration' },
  { value: 'unused', label: 'Unused', description: 'Not used in template' },
];

export function ImageAssetManager({ templateId, assets, open, onClose, onSave }: ImageAssetManagerProps) {
  // Early return if dialog is not open - prevents unnecessary initialization
  if (!open) {
    return null;
  }

  const [allImages, setAllImages] = useState<ImageAsset[]>(() => {
    // Combine all images into a single array with metadata
    const images: ImageAsset[] = [];

    // Check if assets exists
    if (!assets) {
      return images;
    }

    // Add named assets
    if (assets.companyLogo) {
      images.push({
        id: 'companyLogo',
        data: assets.companyLogo.data || assets.companyLogo,
        type: 'companyLogo',
        name: 'Company Logo',
        placement: assets.companyLogo.placement,
        metadata: assets.companyLogo.metadata,
      });
    }
    if (assets.headerLogo) {
      images.push({
        id: 'headerLogo',
        data: assets.headerLogo.data || assets.headerLogo,
        type: 'headerLogo',
        name: 'Header Logo',
        placement: assets.headerLogo.placement,
        metadata: assets.headerLogo.metadata,
      });
    }
    if (assets.footerLogo) {
      images.push({
        id: 'footerLogo',
        data: assets.footerLogo.data || assets.footerLogo,
        type: 'footerLogo',
        name: 'Footer Logo',
        placement: assets.footerLogo.placement,
        metadata: assets.footerLogo.metadata,
      });
    }
    if (assets.coverImage) {
      images.push({
        id: 'coverImage',
        data: assets.coverImage.data || assets.coverImage,
        type: 'coverImage',
        name: 'Cover Image',
        placement: assets.coverImage.placement,
        metadata: assets.coverImage.metadata,
      });
    }
    if (assets.thankYouSlide) {
      images.push({
        id: 'thankYouSlide',
        data: assets.thankYouSlide.data || assets.thankYouSlide,
        type: 'thankYouSlide',
        name: 'Thank You Slide',
        placement: assets.thankYouSlide.placement,
        metadata: assets.thankYouSlide.metadata,
      });
    }

    // Add additional images
    if (assets.images && Array.isArray(assets.images)) {
      assets.images.forEach((img: any, index: number) => {
        images.push({
          id: `image_${index}`,
          data: img.data || img,
          type: img.type || img.metadata?.type || 'unused',
          name: img.name || img.metadata?.description || `Image ${index + 1}`,
          placement: img.placement,
          metadata: img.metadata,
        });
      });
    }

    return images;
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRoleChange = (index: number, newRole: string) => {
    const updated = [...allImages];
    updated[index] = { ...updated[index], type: newRole };
    setAllImages(updated);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(allImages[index].name || '');
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...allImages];
    updated[index] = { ...updated[index], name: editName };
    setAllImages(updated);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditName('');
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this image?')) {
      const updated = allImages.filter((_, i) => i !== index);
      setAllImages(updated);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...allImages];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setAllImages(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === allImages.length - 1) return;
    const updated = [...allImages];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setAllImages(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Reconstruct assets object from managed images
      const updatedAssets: any = {
        images: [],
      };

      allImages.forEach((img) => {
        const assetData = {
          data: img.data,
          placement: img.placement,
          metadata: img.metadata,
        };

        // Assign to named roles or add to images array
        if (img.type === 'companyLogo') {
          updatedAssets.companyLogo = assetData;
        } else if (img.type === 'headerLogo') {
          updatedAssets.headerLogo = assetData;
        } else if (img.type === 'footerLogo') {
          updatedAssets.footerLogo = assetData;
        } else if (img.type === 'coverImage') {
          updatedAssets.coverImage = assetData;
        } else if (img.type === 'thankYouSlide') {
          updatedAssets.thankYouSlide = assetData;
        } else if (img.type !== 'unused') {
          // Add to additional images array
          updatedAssets.images.push({
            ...assetData,
            type: img.type,
            name: img.name,
          });
        }
        // Skip if type is 'unused'
      });

      // Update template via API
      await templateApi.update(templateId, { assets: updatedAssets });

      onSave(updatedAssets);
      onClose();
    } catch (error) {
      console.error('Failed to save assets:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (type: string) => {
    const colors: Record<string, string> = {
      companyLogo: 'bg-blue-100 text-blue-800',
      headerLogo: 'bg-purple-100 text-purple-800',
      footerLogo: 'bg-purple-100 text-purple-800',
      coverImage: 'bg-green-100 text-green-800',
      thankYouSlide: 'bg-pink-100 text-pink-800',
      chart: 'bg-orange-100 text-orange-800',
      diagram: 'bg-cyan-100 text-cyan-800',
      photo: 'bg-yellow-100 text-yellow-800',
      icon: 'bg-gray-100 text-gray-800',
      decorative: 'bg-gray-100 text-gray-800',
      unused: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Manage Template Images
          </DialogTitle>
          <DialogDescription>
            Rename, reorder, assign roles, and delete images. Changes will update the template.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-3">
            {allImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No images found in this template</p>
              </div>
            ) : (
              allImages.map((image, index) => (
                <div
                  key={image.id || index}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={image.data}
                        alt={image.name || 'Image'}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name */}
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Image name"
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleSaveEdit(index)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{image.name || 'Unnamed'}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Role Selection */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 min-w-[60px]">Role:</span>
                      <select
                        value={image.type}
                        onChange={(e) => handleRoleChange(index, e.target.value)}
                        className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {IMAGE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label} - {role.description}
                          </option>
                        ))}
                      </select>
                      <Badge className={getRoleColor(image.type || 'unused')}>
                        {IMAGE_ROLES.find((r) => r.value === image.type)?.label || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Metadata */}
                    {image.metadata?.description && (
                      <p className="text-xs text-gray-500 truncate">
                        AI: {image.metadata.description}
                      </p>
                    )}
                    {image.placement && (
                      <p className="text-xs text-blue-600">
                        Placement: {image.placement.location}
                        {image.placement.position && ` @ ${image.placement.position}`}
                        {image.placement.repeatsOnPages === 'all' && ' (all pages)'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === allImages.length - 1}
                      className="h-7 w-7 p-0"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(index)}
                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {allImages.filter((img) => img.type === 'unused').length} unused images
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
