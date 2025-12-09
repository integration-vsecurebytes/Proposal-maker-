import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import type { DiagramConfig } from '@proposal-gen/shared';
import { Alert, AlertDescription } from '../ui/alert';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

interface DiagramPreviewProps {
  config: DiagramConfig;
  className?: string;
}

export function DiagramPreview({ config, className = '' }: DiagramPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !config.code) return;

      setIsRendering(true);
      setError(null);

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, config.code);

        // Insert the SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [config.code]);

  return (
    <div className={`diagram-container ${className}`}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{config.title}</h3>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to render diagram: {error}
          </AlertDescription>
        </Alert>
      )}

      {isRendering && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div
        ref={containerRef}
        className="mermaid-diagram flex items-center justify-center p-4 bg-white rounded-lg border"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
}
