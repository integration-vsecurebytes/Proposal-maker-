import { useState, useRef } from 'react';
import { Template } from '@proposal-gen/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Eye, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { templateApi } from '../../lib/api';

interface TemplateCardProps {
  template: Template;
  onSelect?: (template: Template) => void;
  onDelete?: () => void;
  onReExtract?: () => void;
}

export function TemplateCard({ template, onSelect, onDelete, onReExtract }: TemplateCardProps) {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schema = template.schema as any;
  const branding = schema?.branding;
  const assets = template.assets as any;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(template);
    }
    navigate(`/create/${template.id}`);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't allow deleting predefined templates
    if (template.id.startsWith('predefined-')) {
      alert('Cannot delete predefined templates');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await templateApi.delete(template.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const handleReExtractClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (template.id.startsWith('predefined-')) {
      alert('Cannot re-extract predefined templates');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Please select a .docx file');
      return;
    }

    if (!confirm(`Re-extract template from "${file.name}"? This will update the existing template.`)) {
      return;
    }

    try {
      setReExtracting(true);

      // Re-extract using the dedicated endpoint
      await templateApi.reExtract(template.id, file);

      if (onReExtract) {
        onReExtract();
      }
    } catch (error) {
      console.error('Failed to re-extract template:', error);
      alert('Failed to re-extract template');
    } finally {
      setReExtracting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isPredefined = template.id.startsWith('predefined-');

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded flex items-center justify-center"
              style={{ backgroundColor: branding?.primary_color || '#3B82F6' }}
            >
              {assets?.companyLogo?.data || assets?.companyLogo ? (
                <img src={assets.companyLogo?.data || assets.companyLogo} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <FileText className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>
                {schema?.style || 'Professional'} template
                {isPredefined && <span className="ml-2 text-xs text-blue-600">(Built-in)</span>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{schema?.sections?.length || 0}</span>
              <span>sections</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: branding?.primary_color || '#3B82F6' }}
              />
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: branding?.secondary_color || '#1E40AF' }}
              />
              <span className="text-xs text-muted-foreground ml-1">Brand colors</span>
            </div>
            {assets && (
              <div className="text-xs text-muted-foreground">
                {assets.companyLogo && '✓ Logo'}
                {assets.headerLogo && ' • Header'}
                {assets.footerLogo && ' • Footer'}
                {assets.images?.length > 0 && ` • ${assets.images.length} images`}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button className="flex-1" variant="default" onClick={handleSelect}>
              Select
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreview}>
              <Eye className="w-4 h-4" />
            </Button>
            {!isPredefined && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReExtractClick}
                  disabled={reExtracting}
                  title="Re-extract from DOCX"
                >
                  <RefreshCw className={`w-4 h-4 ${reExtracting ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".docx"
        className="hidden"
      />

      <TemplatePreviewDialog
        template={template}
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
