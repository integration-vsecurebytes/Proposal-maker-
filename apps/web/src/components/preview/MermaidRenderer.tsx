import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  className?: string;
}

export function MermaidRenderer({ code, className = '' }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: {
        fontSize: '16px',
        primaryTextColor: '#000000',    // Pure black for maximum contrast
        secondaryTextColor: '#000000',
        tertiaryTextColor: '#000000',
        primaryColor: '#3b82f6',
        primaryBorderColor: '#2563eb',
        lineColor: '#4b5563',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#e5e7eb',
        textColor: '#000000',           // Pure black
        labelTextColor: '#000000',      // Pure black for labels
        nodeTextColor: '#000000',       // Pure black for nodes
        edgeLabelBackground: '#ffffff', // White background for edge labels
        labelBackground: '#ffffff',     // White background
        clusterBkg: '#f9fafb',
        clusterBorder: '#d1d5db',
        defaultLinkColor: '#4b5563',
        titleColor: '#000000',
        actorTextColor: '#000000',
        signalTextColor: '#000000',
        labelBoxBkgColor: '#ffffff',
        labelBoxBorderColor: '#d1d5db',
        loopTextColor: '#000000',
        noteBkgColor: '#fef3c7',
        noteTextColor: '#000000',
        activationBkgColor: '#e0e7ff',
        activationBorderColor: '#6366f1',
      },
      flowchart: {
        fontSize: 14,                // Smaller font for better fit
        nodeSpacing: 30,             // Reduced space between nodes
        rankSpacing: 40,             // Reduced space between ranks
        padding: 12,                 // Reduced padding in boxes
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      sequence: {
        fontSize: 14,
        messageMargin: 30,
        boxMargin: 8,
        useMaxWidth: true,
      },
      gantt: {
        fontSize: 12,
        sectionFontSize: 14,
        numberSectionStyles: 4,
        useMaxWidth: true,
        barHeight: 20,
        barGap: 4,
      },
    });

    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;

      try {
        setIsRendering(true);
        setError(null);

        // Validate and fix gantt diagram syntax
        let cleanedCode = code.trim();

        // Fix common gantt diagram issues
        if (cleanedCode.includes('gantt')) {
          // Ensure gantt diagrams have proper section headers
          const lines = cleanedCode.split('\n');
          let hasSection = false;
          let hasDateFormat = false;
          let fixedLines: string[] = [];

          for (const line of lines) {
            const trimmed = line.trim();

            // Check if dateFormat exists
            if (trimmed.startsWith('dateFormat')) {
              hasDateFormat = true;
            }

            if (trimmed.startsWith('section ')) {
              hasSection = true;
              fixedLines.push(line);
            } else if (trimmed.startsWith('gantt')) {
              fixedLines.push(line);
              // Add dateFormat if missing
              if (!code.includes('dateFormat')) {
                fixedLines.push('    dateFormat YYYY-MM-DD');
                hasDateFormat = true;
              }
            } else if (trimmed && !trimmed.startsWith('title') &&
                      !trimmed.startsWith('dateFormat') && !trimmed.startsWith('axisFormat') &&
                      !trimmed.startsWith('%') && !trimmed.startsWith('gantt')) {
              // This looks like a task line
              // Add default section if task without section
              if (!hasSection) {
                fixedLines.push('    section Tasks');
                hasSection = true;
              }

              // Validate task format - should be "taskName : status, id, start, duration/end"
              // If line looks like it's trying to be a task but malformed, skip it
              if (trimmed.includes(':')) {
                fixedLines.push(line);
              } else if (trimmed.length > 0) {
                // Might be a malformed task, try to fix by adding colon
                fixedLines.push(`    ${trimmed} : 2024-01-01, 1d`);
              }
            } else {
              fixedLines.push(line);
            }
          }

          cleanedCode = fixedLines.join('\n');
        }

        const id = 'mermaid-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        const { svg } = await mermaid.render(id, cleanedCode);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // Ensure text is clearly visible by applying additional styles
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // Constrain diagram size to fit container
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '600px'; // Limit height
            svgElement.style.height = 'auto';
            svgElement.style.width = 'auto';

            // Get original dimensions
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
              const [, , width, height] = viewBox.split(' ').map(Number);

              // If diagram is too large, scale it down
              if (width > 1200 || height > 800) {
                const scale = Math.min(1200 / width, 800 / height, 1);
                const newWidth = width * scale;
                const newHeight = height * scale;

                svgElement.setAttribute('width', `${newWidth}`);
                svgElement.setAttribute('height', `${newHeight}`);
              }
            }

            // Force all text elements to be dark and visible - CRITICAL FIX
            const textElements = svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel, .label, foreignObject div');
            textElements.forEach((textEl: any) => {
              textEl.style.fill = '#111827 !important'; // Force dark text
              textEl.style.color = '#111827 !important'; // For HTML elements in foreignObject
              textEl.style.fontWeight = '600'; // Bolder for better visibility
              textEl.setAttribute('fill', '#111827'); // Set attribute directly

              // Enable text wrapping for long text
              if (textEl.tagName === 'foreignObject') {
                textEl.style.overflow = 'visible';
                textEl.style.whiteSpace = 'normal';
                textEl.style.wordWrap = 'break-word';
              }
            });

            // Force label backgrounds to be visible
            const labelBackgrounds = svgElement.querySelectorAll('.label-container, .labelBox, rect.label-container');
            labelBackgrounds.forEach((bg: any) => {
              bg.style.fill = '#ffffff';
              bg.style.stroke = '#d1d5db';
            });

            // Make sure node text is visible and fits
            const nodeTexts = svgElement.querySelectorAll('.nodeLabel text, .node text, g.label text');
            nodeTexts.forEach((textEl: any) => {
              textEl.style.fill = '#000000 !important';
              textEl.setAttribute('fill', '#000000');

              // Enable text wrapping for node labels
              const foreignObj = textEl.closest('foreignObject');
              if (foreignObj) {
                foreignObj.style.overflow = 'visible';
              }
            });
          }
        }

        setIsRendering(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className={'p-4 bg-red-50 border border-red-200 rounded-lg ' + className}>
        <p className="text-red-600 text-sm font-medium">Failed to render diagram</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-red-700 cursor-pointer">Show code</summary>
          <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">{code}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className={'mermaid-container relative ' + className}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-auto"
        style={{
          minHeight: isRendering ? '200px' : 'auto',
          maxHeight: '650px',
          maxWidth: '100%',
          position: 'relative',
          zIndex: 1
        }}
      ></div>
    </div>
  );
}
