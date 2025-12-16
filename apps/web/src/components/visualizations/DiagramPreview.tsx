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

// Helper function to sanitize Mermaid code and fix common syntax errors
const sanitizeMermaidCode = (rawCode: string): string => {
  let code = rawCode.trim();

  // Remove markdown code blocks if present
  code = code.replace(/^```(?:mermaid)?\n?/, '');
  code = code.replace(/\n?```$/, '');
  code = code.trim();

  // Fix Gantt chart date format issues
  // Convert "Month Day, Year" to "YYYY-MM-DD"
  if (code.includes('gantt')) {
    const monthMap: Record<string, string> = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };

    // Match patterns like "January 15, 2026" or "January 15 2026"
    code = code.replace(/(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b)/gi, (match) => {
      const parts = match.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/i);
      if (parts) {
        const month = monthMap[parts[1].toLowerCase()];
        const day = parts[2].padStart(2, '0');
        const year = parts[3];
        return `${year}-${month}-${day}`;
      }
      return match;
    });

    // Also handle "15 January 2026" format
    code = code.replace(/(\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b)/gi, (match) => {
      const parts = match.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
      if (parts) {
        const month = monthMap[parts[2].toLowerCase()];
        const day = parts[1].padStart(2, '0');
        const year = parts[3];
        return `${year}-${month}-${day}`;
      }
      return match;
    });
  }

  // Fix mindmap syntax - remove problematic emojis that cause parsing issues
  // IMPORTANT: Don't use brackets [] as they create square nodes in mermaid mindmaps
  if (code.startsWith('mindmap')) {
    // Replace problematic emojis with plain text (no brackets - they break mindmap syntax)
    code = code.replace(/✅/g, 'DONE:');
    code = code.replace(/❌/g, 'NOT:');
    code = code.replace(/📋/g, 'NOTE:');
    code = code.replace(/⚠️/g, 'WARN:');
    code = code.replace(/🔴/g, '');
    code = code.replace(/🟢/g, '');
    code = code.replace(/⚡/g, '');
    code = code.replace(/💡/g, '');
    code = code.replace(/🎯/g, '');
  }

  // Ensure single newline between lines (fix multiple blank lines)
  code = code.replace(/\n{3,}/g, '\n\n');

  return code;
};

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

        // Sanitize the code before rendering
        const sanitizedCode = sanitizeMermaidCode(config.code);

        // Render the diagram
        const { svg } = await mermaid.render(id, sanitizedCode);

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
