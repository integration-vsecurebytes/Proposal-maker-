import { useState } from 'react';
import { Template } from '@proposal-gen/shared';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Image, Palette, Layout, Settings } from 'lucide-react';
import { ImageAssetManager } from './ImageAssetManager';

interface TemplatePreviewDialogProps {
  template: Template;
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export function TemplatePreviewDialog({ template, open, onClose, onSelect }: TemplatePreviewDialogProps) {
  const schema = template.schema as any;
  const branding = schema?.branding;
  const [assets, setAssets] = useState(template.assets as any);
  const styles = template.styles as any;
  const [showImageManager, setShowImageManager] = useState(false);

  const handleSelect = () => {
    onSelect();
    onClose();
  };

  const handleAssetsSaved = (updatedAssets: any) => {
    setAssets(updatedAssets);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription>{schema?.description || 'Template Preview'}</DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageManager(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Images
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Template Info
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Sections:</span>{' '}
                  <span className="font-medium">{schema?.sections?.length || 0}</span>
                </p>
                {schema?.industry && (
                  <p>
                    <span className="text-muted-foreground">Industry:</span>{' '}
                    <span className="font-medium">{schema.industry}</span>
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Style:</span>{' '}
                  <span className="font-medium">{schema?.style || 'Professional'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Version:</span>{' '}
                  <span className="font-medium">{schema?.version || '1.0'}</span>
                </p>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Brand Colors
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: branding?.primary_color || styles?.primaryColor || '#3B82F6' }}
                  />
                  <span className="text-sm">Primary: {branding?.primary_color || styles?.primaryColor || '#3B82F6'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: branding?.secondary_color || styles?.secondaryColor || '#1E40AF' }}
                  />
                  <span className="text-sm">Secondary: {branding?.secondary_color || styles?.secondaryColor || '#1E40AF'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assets */}
          {assets && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Image className="w-4 h-4" />
                Extracted Assets
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {assets.companyLogo && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Company Logo</p>
                    <div className="border rounded p-4 bg-white flex items-center justify-center h-24">
                      <img src={assets.companyLogo?.data || assets.companyLogo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    {assets.companyLogo?.placement && (
                      <p className="text-xs text-muted-foreground">
                        {assets.companyLogo.placement.location} @ {assets.companyLogo.placement.position}
                      </p>
                    )}
                  </div>
                )}
                {assets.headerLogo && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Header Logo</p>
                    <div className="border rounded p-4 bg-white flex items-center justify-center h-24">
                      <img src={assets.headerLogo?.data || assets.headerLogo} alt="Header Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    {assets.headerLogo?.placement && (
                      <p className="text-xs text-muted-foreground">
                        {assets.headerLogo.placement.location} @ {assets.headerLogo.placement.position}
                        {assets.headerLogo.placement.repeatsOnPages === 'all' && ' (all pages)'}
                      </p>
                    )}
                  </div>
                )}
                {assets.footerLogo && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Footer Logo</p>
                    <div className="border rounded p-4 bg-white flex items-center justify-center h-24">
                      <img src={assets.footerLogo?.data || assets.footerLogo} alt="Footer Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    {assets.footerLogo?.placement && (
                      <p className="text-xs text-muted-foreground">
                        {assets.footerLogo.placement.location} @ {assets.footerLogo.placement.position}
                        {assets.footerLogo.placement.repeatsOnPages === 'all' && ' (all pages)'}
                      </p>
                    )}
                  </div>
                )}
                {assets.coverImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cover Image</p>
                    <div className="border rounded p-4 bg-white flex items-center justify-center h-24">
                      <img src={assets.coverImage?.data || assets.coverImage} alt="Cover" className="max-w-full max-h-full object-contain" />
                    </div>
                    {assets.coverImage?.placement && (
                      <p className="text-xs text-muted-foreground">
                        {assets.coverImage.placement.location} @ {assets.coverImage.placement.position}
                      </p>
                    )}
                  </div>
                )}
                {assets.thankYouSlide && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Thank You Slide</p>
                    <div className="border rounded p-4 bg-white flex items-center justify-center h-24">
                      <img src={assets.thankYouSlide?.data || assets.thankYouSlide} alt="Thank You" className="max-w-full max-h-full object-contain" />
                    </div>
                    {assets.thankYouSlide?.placement && (
                      <p className="text-xs text-muted-foreground">
                        {assets.thankYouSlide.placement.location} (full page)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Images (charts, diagrams, photos) */}
              {assets.images && assets.images.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Additional Images ({assets.images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {assets.images.map((image: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <p className="text-xs font-medium text-gray-600">
                          {image.type || image.metadata?.type || 'Image'} {index + 1}
                        </p>
                        <div className="border rounded p-3 bg-white flex items-center justify-center h-20">
                          <img
                            src={image.data || image}
                            alt={image.metadata?.description || `Image ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        {image.metadata?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {image.metadata.description}
                          </p>
                        )}
                        {image.placement && (
                          <p className="text-xs text-blue-600">
                            {image.placement.location}
                            {image.placement.position && ` @ ${image.placement.position}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Template Sections ({schema?.sections?.length || 0})
            </h3>
            <div className="space-y-1">
              {schema?.sections?.map((section: any, index: number) => {
                // Calculate indentation based on level
                const indentLevel = section.level || 0;
                const paddingLeft = indentLevel * 16; // 16px per level

                return (
                  <div
                    key={section.id || index}
                    className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 transition-colors"
                    style={{ paddingLeft: `${paddingLeft + 8}px` }}
                  >
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {section.level === 0 ? 'Cover' : section.level === 1 ? 'H1' : section.level === 2 ? 'H2' : 'H3'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{section.name || section.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{section.type}</span>
                        {section.parentId && (
                          <span className="text-blue-600">↳ subsection</span>
                        )}
                      </div>
                      {section.description && (
                        <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                      )}
                    </div>
                    {section.required && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Required
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Styles */}
          {styles && (
            <div className="space-y-3">
              <h3 className="font-semibold">Typography & Styles</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Font Family:</span>{' '}
                  <span className="font-medium">{styles.fontFamily || 'Default'}</span>
                </p>
                {styles.fontSize && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <p>
                      <span className="text-muted-foreground">Title:</span> {styles.fontSize.title}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Heading 1:</span> {styles.fontSize.heading1}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Heading 2:</span> {styles.fontSize.heading2}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Body:</span> {styles.fontSize.body}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSelect} className="flex-1">
            Select This Template
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Image Asset Manager */}
      <ImageAssetManager
        templateId={template.id}
        assets={assets}
        open={showImageManager}
        onClose={() => setShowImageManager(false)}
        onSave={handleAssetsSaved}
      />
    </Dialog>
  );
}
