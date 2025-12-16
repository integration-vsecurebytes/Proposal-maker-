import puppeteer, { Browser, Page } from 'puppeteer';

// Extend Window interface for mermaid rendering status
declare global {
  interface Window {
    mermaidRendered?: boolean;
    mermaidError?: string;
  }
}

export interface DiagramImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Normalize branding colors from either camelCase or snake_case
 */
function normalizeBranding(branding: any) {
  return {
    primaryColor: branding?.primaryColor || branding?.primary_color || '#3b82f6',
    secondaryColor: branding?.secondaryColor || branding?.secondary_color || '#64748b',
    accentColor: branding?.accentColor || branding?.accent_color || '#8b5cf6',
    borderColor: branding?.borderColor || branding?.border_color || '#cbd5e1',
    textColor: branding?.textColor || branding?.text_color || '#1e293b',
    headerTextColor: branding?.headerTextColor || branding?.header_text_color || '#1e293b',
    backgroundColor: branding?.backgroundColor || branding?.background_color || '#ffffff',
    surfaceColor: branding?.surfaceColor || branding?.surface_color || '#f8fafc',
    fontFamily: branding?.fontFamily || branding?.font_family || 'system-ui, sans-serif',
  };
}

export class DiagramImageService {
  private browser: Browser | null = null;

  /**
   * Sanitize Mermaid code and fix common syntax errors
   */
  private sanitizeMermaidCode(rawCode: string): string {
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
  }

  /**
   * Initialize the headless browser (reused for multiple renders)
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate a PNG image from Mermaid diagram code
   * Uses Puppeteer screenshot for better text rendering
   */
  async generateDiagramImage(
    mermaidCode: string,
    options: DiagramImageOptions = {},
    branding?: any
  ): Promise<Buffer> {
    const {
      width = 1200,
      height = 800,
      backgroundColor = '#ffffff',
      scale = 2, // Higher scale for better quality
    } = options;

    let page: Page | null = null;

    try {
      console.log('[Diagram] Generating diagram via Puppeteer screenshot...');

      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Set viewport with high DPI for better quality
      await page.setViewport({
        width: width,
        height: height,
        deviceScaleFactor: scale,
      });

      // Normalize branding colors
      const colors = normalizeBranding(branding);

      // Determine background color (white for documents, transparent for web)
      const bgColor = backgroundColor === 'transparent' ? 'transparent' : backgroundColor;

      // Sanitize the mermaid code to fix common syntax issues
      const sanitizedCode = this.sanitizeMermaidCode(mermaidCode);
      console.log('[Diagram] Sanitized mermaid code (first 200 chars):', sanitizedCode.substring(0, 200));

      // Create HTML with Mermaid configuration matching preview's MermaidRenderer
      // CRITICAL: Use startOnLoad: false and explicitly call mermaid.run() to ensure
      // all diagram types (including mindmaps) render correctly
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .mermaid {
      font-family: ${colors.fontFamily};
    }
    .mermaid svg {
      max-width: none !important;
      width: auto !important;
      height: auto !important;
    }
    /* Force text visibility - MUCH LARGER fonts for documents */
    .mermaid text, .mermaid tspan {
      fill: #000000 !important;
      font-weight: 700 !important;
      font-size: 28px !important;
    }
    .mermaid foreignObject div, .mermaid foreignObject span, .mermaid foreignObject p {
      color: #000000 !important;
      font-weight: 700 !important;
      font-size: 28px !important;
      text-align: center !important;
      line-height: 1.2 !important;
    }
    .mermaid .nodeLabel, .mermaid .edgeLabel, .mermaid .label {
      font-size: 26px !important;
      font-weight: 700 !important;
      fill: #000000 !important;
      color: #000000 !important;
    }
    .mermaid .node rect, .mermaid .node circle, .mermaid .node polygon {
      stroke-width: 3px !important;
    }
    .mermaid .edgePath path {
      stroke-width: 3px !important;
    }
    /* Mindmap specific styles */
    .mermaid .mindmap-node rect, .mermaid .mindmap-node circle {
      stroke-width: 2px !important;
    }
    .mermaid .mindmap-node text {
      font-size: 20px !important;
      font-weight: 600 !important;
    }
  </style>
</head>
<body>
  <div class="mermaid" id="diagram">
${sanitizedCode}
  </div>
  <script>
    // Initialize mermaid with startOnLoad: false
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        // MUCH LARGER fonts for document visibility
        fontSize: '28px',
        primaryTextColor: '#000000',
        secondaryTextColor: '#000000',
        tertiaryTextColor: '#000000',
        primaryColor: '${colors.primaryColor}',
        primaryBorderColor: '${colors.primaryColor}',
        lineColor: '#4b5563',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#e5e7eb',
        textColor: '#000000',
        labelTextColor: '#000000',
        nodeTextColor: '#000000',
        edgeLabelBackground: '#ffffff',
        labelBackground: '#ffffff',
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
        background: '${bgColor}',
        mainBkg: '${colors.surfaceColor}',
        fontFamily: '${colors.fontFamily}',
        nodeBorder: '${colors.borderColor}'
      },
      flowchart: {
        fontSize: 26,
        nodeSpacing: 80,
        rankSpacing: 100,
        padding: 40,
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        wrappingWidth: 250,
        diagramPadding: 30
      },
      sequence: {
        fontSize: 24,
        messageMargin: 50,
        boxMargin: 20,
        useMaxWidth: false,
        width: 220,
        height: 70,
        actorFontSize: 24,
        noteFontSize: 22,
        messageFontSize: 24
      },
      gantt: {
        fontSize: 22,
        sectionFontSize: 24,
        numberSectionStyles: 4,
        useMaxWidth: false,
        barHeight: 40,
        barGap: 8
      },
      mindmap: {
        useMaxWidth: false,
        padding: 20
      }
    });

    // Explicitly run mermaid to render the diagram
    // This is critical for mindmaps and other diagram types that don't render with startOnLoad
    mermaid.run({ querySelector: '#diagram' }).then(() => {
      window.mermaidRendered = true;
    }).catch(err => {
      console.error('Mermaid rendering error:', err);
      window.mermaidError = err.message;
    });
  </script>
</body>
</html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for mermaid.run() to complete
      await page.waitForFunction(() => window.mermaidRendered === true || window.mermaidError, { timeout: 15000 });

      // Check for rendering errors
      const renderError = await page.evaluate(() => window.mermaidError);
      if (renderError) {
        throw new Error(`Mermaid rendering failed: ${renderError}`);
      }

      // Wait for the SVG to be in the DOM
      await page.waitForSelector('.mermaid svg', { timeout: 10000 });

      // Wait for SVG to have non-zero dimensions (important for mindmaps)
      await page.waitForFunction(() => {
        const svg = document.querySelector('.mermaid svg');
        if (!svg) return false;
        const bbox = svg.getBoundingClientRect();
        return bbox.width > 0 && bbox.height > 0;
      }, { timeout: 10000 });

      // Wait a bit more for full rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the SVG element and its bounding box
      const svgElement = await page.$('.mermaid svg');
      if (!svgElement) {
        throw new Error('SVG element not found after Mermaid rendering');
      }

      // Get the bounding box of the SVG
      const boundingBox = await svgElement.boundingBox();
      console.log(`[Diagram] SVG bounding box:`, boundingBox);

      // Take screenshot of JUST the SVG element (not the full page)
      // This ensures the diagram fills the image
      const screenshot = await svgElement.screenshot({
        type: 'png',
        omitBackground: backgroundColor === 'transparent',
      });

      console.log(`[Diagram] Generated PNG from SVG element: ${boundingBox?.width}x${boundingBox?.height}px at ${scale}x scale (${screenshot.length} bytes)`);
      return screenshot as Buffer;

    } catch (error) {
      console.error('[Diagram] Error generating diagram image:', error);
      throw new Error(`Failed to generate diagram image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Generate multiple diagram images in batch
   */
  async generateBatch(
    diagrams: Array<{
      code: string;
      options?: DiagramImageOptions;
    }>
  ): Promise<Buffer[]> {
    const results: Buffer[] = [];

    for (const diagram of diagrams) {
      const buffer = await this.generateDiagramImage(
        diagram.code,
        diagram.options
      );
      results.push(buffer);
    }

    return results;
  }

  /**
   * Generate diagram with auto-sizing based on content complexity
   */
  async generateAutoSized(
    mermaidCode: string,
    baseOptions: DiagramImageOptions = {}
  ): Promise<Buffer> {
    // Estimate size based on code complexity
    const lines = mermaidCode.split('\n').length;
    const estimatedWidth = Math.min(1600, Math.max(800, lines * 50));
    const estimatedHeight = Math.min(1200, Math.max(600, lines * 40));

    return this.generateDiagramImage(mermaidCode, {
      width: estimatedWidth,
      height: estimatedHeight,
      ...baseOptions,
    });
  }
}

export const diagramImageService = new DiagramImageService();

// Cleanup on process exit
process.on('exit', () => {
  diagramImageService.closeBrowser();
});

process.on('SIGINT', () => {
  diagramImageService.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', () => {
  diagramImageService.closeBrowser();
  process.exit(0);
});
