import puppeteer, { Browser, Page } from 'puppeteer';

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

      // Create HTML with Mermaid configuration matching preview's MermaidRenderer
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
      max-width: 100%;
      font-family: ${colors.fontFamily};
    }
    /* Force text visibility matching preview */
    .mermaid text, .mermaid tspan {
      fill: #000000 !important;
      font-weight: 600 !important;
      font-size: 16px !important;
    }
    .mermaid foreignObject div, .mermaid foreignObject span, .mermaid foreignObject p {
      color: #000000 !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      text-align: center !important;
    }
  </style>
</head>
<body>
  <div class="mermaid">
${mermaidCode}
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        // Match preview's MermaidRenderer theme variables exactly
        fontSize: '18px',
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
        fontSize: 16,
        nodeSpacing: 30,
        rankSpacing: 40,
        padding: 20,
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        wrappingWidth: 150
      },
      sequence: {
        fontSize: 16,
        messageMargin: 25,
        boxMargin: 8,
        useMaxWidth: true
      },
      gantt: {
        fontSize: 14,
        sectionFontSize: 16,
        numberSectionStyles: 4,
        useMaxWidth: true,
        barHeight: 20,
        barGap: 4
      }
    });
  </script>
</body>
</html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for Mermaid to render
      await page.waitForSelector('.mermaid svg', { timeout: 10000 });

      // Take a high-quality screenshot directly from the browser
      // This preserves all text because the browser handles font rendering
      // Transparent background so only the diagram shows in documents
      const screenshot = await page.screenshot({
        type: 'png',
        omitBackground: true,
        encoding: 'binary',
      });

      console.log(`[Diagram] Generated PNG screenshot: ${width}x${height}px at ${scale}x scale (${screenshot.length} bytes)`);
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
