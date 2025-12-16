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

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: {
        fontSize: '18px',            // Bigger base font
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
        fontSize: 16,                // Bigger font
        nodeSpacing: 30,             // More spacing between nodes
        rankSpacing: 40,             // More spacing between ranks
        padding: 20,                 // More padding in boxes for bigger text
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        wrappingWidth: 150,          // More wrapping width for bigger text
      },
      sequence: {
        fontSize: 16,
        messageMargin: 25,
        boxMargin: 8,
        useMaxWidth: true,
      },
      gantt: {
        fontSize: 14,
        sectionFontSize: 16,
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

        // First, sanitize and fix common syntax errors
        let cleanedCode = sanitizeMermaidCode(code);

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
            // Constrain diagram size to fit container - smaller diagrams
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '280px'; // Even smaller for compact view
            svgElement.style.height = 'auto';
            svgElement.style.width = 'auto';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto'; // Center the diagram

            // Get original dimensions
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
              const [, , width, height] = viewBox.split(' ').map(Number);

              // Scale down more to make diagrams smaller
              const maxPreviewWidth = 500; // Smaller max width
              const maxPreviewHeight = 280; // Smaller max height

              if (width > maxPreviewWidth || height > maxPreviewHeight) {
                const scale = Math.min(maxPreviewWidth / width, maxPreviewHeight / height, 0.7); // Scale down to 70%
                const newWidth = width * scale;
                const newHeight = height * scale;

                svgElement.setAttribute('width', `${newWidth}`);
                svgElement.setAttribute('height', `${newHeight}`);
              }
            }

            // Force all text elements to be dark and visible - CRITICAL FIX
            const textElements = svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel, .label, foreignObject div, foreignObject span, foreignObject p');
            textElements.forEach((textEl: any) => {
              textEl.style.fill = '#000000'; // Pure black
              textEl.style.color = '#000000'; // For HTML elements in foreignObject
              textEl.style.fontWeight = '600'; // Semi-bold for visibility
              textEl.style.fontSize = '16px'; // Bigger font for readability
              textEl.setAttribute('fill', '#000000'); // Set attribute directly
              textEl.setAttribute('color', '#000000');

              // Fix text alignment for SVG text elements
              if (textEl.tagName === 'text' || textEl.tagName === 'tspan') {
                textEl.setAttribute('text-anchor', 'middle'); // Center align text
                textEl.style.dominantBaseline = 'middle'; // Vertical center
                textEl.style.textAnchor = 'middle';
              }

              // Enable text wrapping and center alignment for foreignObject content
              if (textEl.tagName === 'foreignObject') {
                textEl.style.overflow = 'visible';
                textEl.style.whiteSpace = 'normal';
                textEl.style.wordWrap = 'break-word';
                textEl.style.padding = '0px';
                textEl.style.boxSizing = 'border-box';

                // Center content vertically and horizontally
                const foreignDiv = textEl.querySelector('div');
                if (foreignDiv) {
                  foreignDiv.style.display = 'flex';
                  foreignDiv.style.alignItems = 'center';
                  foreignDiv.style.justifyContent = 'center';
                  foreignDiv.style.height = '100%';
                  foreignDiv.style.width = '100%';
                }
              }

              // Center align HTML text elements
              if (textEl.tagName === 'DIV' || textEl.tagName === 'SPAN' || textEl.tagName === 'P') {
                textEl.style.textAlign = 'center';
                textEl.style.width = '100%';
                textEl.style.padding = '0px';
                textEl.style.margin = '0px';
                textEl.style.boxSizing = 'border-box';
                textEl.style.lineHeight = '1.4';
                textEl.style.wordBreak = 'break-word';
                textEl.style.overflowWrap = 'break-word';
                textEl.style.whiteSpace = 'normal';
                textEl.style.writingMode = 'horizontal-tb';
                textEl.style.verticalAlign = 'middle';
              }
            });

            // Force ALL text tags specifically with proper alignment
            const allTextTags = svgElement.querySelectorAll('text');
            allTextTags.forEach((textEl: any) => {
              textEl.style.fill = '#000000';
              textEl.style.fontWeight = '600';
              textEl.style.fontSize = '16px';
              textEl.setAttribute('fill', '#000000');
              textEl.setAttribute('text-anchor', 'middle');
              textEl.style.textAnchor = 'middle';
              textEl.style.dominantBaseline = 'central';
            });

            // Force ALL tspan tags specifically with proper alignment
            const allTspans = svgElement.querySelectorAll('tspan');
            allTspans.forEach((tspan: any) => {
              tspan.style.fill = '#000000';
              tspan.style.fontSize = '16px';
              tspan.setAttribute('fill', '#000000');
              tspan.setAttribute('text-anchor', 'middle');
              tspan.style.textAnchor = 'middle';
            });

            // Force label backgrounds to be visible
            const labelBackgrounds = svgElement.querySelectorAll('.label-container, .labelBox, rect.label-container');
            labelBackgrounds.forEach((bg: any) => {
              bg.style.fill = '#ffffff';
              bg.style.stroke = '#d1d5db';
            });

            // Make sure node text is visible, centered, and fits
            const nodeTexts = svgElement.querySelectorAll('.nodeLabel, .node, g.label, .edgeLabel');
            nodeTexts.forEach((nodeEl: any) => {
              // Find text elements within nodes
              const textEls = nodeEl.querySelectorAll('text');
              textEls.forEach((textEl: any) => {
                textEl.style.fill = '#000000';
                textEl.style.fontWeight = '600';
                textEl.style.fontSize = '16px';
                textEl.setAttribute('fill', '#000000');
                textEl.setAttribute('text-anchor', 'middle');
                textEl.style.textAnchor = 'middle';
                textEl.style.dominantBaseline = 'central';
              });

              // Handle foreignObject labels
              const foreignObjs = nodeEl.querySelectorAll('foreignObject');
              foreignObjs.forEach((foreignObj: any) => {
                foreignObj.style.overflow = 'visible';
                foreignObj.style.padding = '0px';
                foreignObj.style.boxSizing = 'border-box';

                // Style the outer div to center content
                const outerDiv = foreignObj.querySelector('div');
                if (outerDiv) {
                  outerDiv.style.display = 'flex';
                  outerDiv.style.alignItems = 'center';
                  outerDiv.style.justifyContent = 'center';
                  outerDiv.style.height = '100%';
                  outerDiv.style.width = '100%';
                  outerDiv.style.padding = '0px';
                  outerDiv.style.margin = '0px';

                  // Style all nested text elements
                  const textDivs = outerDiv.querySelectorAll('div, span, p');
                  textDivs.forEach((div: any) => {
                    div.style.color = '#000000';
                    div.style.fontWeight = '600';
                    div.style.textAlign = 'center';
                    div.style.padding = '0px';
                    div.style.margin = '0px';
                    div.style.boxSizing = 'border-box';
                    div.style.lineHeight = '1.4';
                    div.style.wordBreak = 'break-word';
                    div.style.overflowWrap = 'break-word';
                    div.style.whiteSpace = 'normal';
                    div.style.writingMode = 'horizontal-tb';
                  });
                }
              });
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
        className="flex items-center justify-center overflow-hidden"
        style={{
          minHeight: isRendering ? '120px' : 'auto',
          maxHeight: '300px',
          maxWidth: '100%',
          position: 'relative',
          zIndex: 1,
          padding: '0.5rem 0'
        }}
      ></div>
    </div>
  );
}
