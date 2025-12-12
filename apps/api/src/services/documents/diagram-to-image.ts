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

      // Create HTML with Mermaid configuration
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
      background-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .mermaid {
      max-width: 100%;
      font-family: ${colors.fontFamily};
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
      theme: 'base',
      themeVariables: {
        primaryColor: '${colors.primaryColor}',
        primaryTextColor: '#000000',
        primaryBorderColor: '${colors.primaryColor}',
        secondaryColor: '${colors.secondaryColor}',
        secondaryTextColor: '#000000',
        tertiaryColor: '${colors.accentColor}',
        tertiaryTextColor: '#000000',
        lineColor: '${colors.borderColor}',
        textColor: '#000000',
        background: 'transparent',
        mainBkg: '${colors.surfaceColor}',
        fontSize: '18px',
        fontFamily: '${colors.fontFamily}',
        nodeBorder: '${colors.borderColor}',
        nodeTextColor: '#000000',
        edgeLabelBackground: 'transparent',
        clusterBkg: '${colors.surfaceColor}',
        clusterBorder: '${colors.borderColor}',
        labelTextColor: '#000000',
        labelColor: '#000000',
        signalTextColor: '#000000'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
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
