import { useEffect } from 'react';
import { useTemplateStore } from '../../stores/template';
import { templateApi } from '../../lib/api';
import { TemplateCard } from './TemplateCard';
import { Template } from '@proposal-gen/shared';
import { Loader2 } from 'lucide-react';

export function TemplateSelector() {
  const { templates, selectedTemplate, loading, error, setTemplates, setSelectedTemplate, setLoading, setError } =
    useTemplateStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateApi.list();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    console.log('Selected template:', template);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Error: {error}</p>
        <button
          onClick={loadTemplates}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Select a Template</h2>
        <p className="text-muted-foreground mt-2">
          Choose a professional template to start creating your proposal
        </p>
      </div>

      {selectedTemplate && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm font-medium">
            Selected: <span className="text-primary">{selectedTemplate.name}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={handleSelectTemplate}
            onDelete={loadTemplates}
            onReExtract={loadTemplates}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates available</p>
        </div>
      )}
    </div>
  );
}
