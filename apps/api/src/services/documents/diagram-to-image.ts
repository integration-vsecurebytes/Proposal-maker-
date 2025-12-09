import puppeteer, { Browser, Page } from 'puppeteer';

export interface DiagramImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  scale?: number;
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
   */
  async generateDiagramImage(
    mermaidCode: string,
    options: DiagramImageOptions = {}
  ): Promise<Buffer> {
    const {
      width = 1200,
      height = 800,
      backgroundColor = '#ffffff',
      scale = 2, // Higher scale for better quality
    } = options;

    let page: Page | null = null;

    try {
      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width, height, deviceScaleFactor: scale });

      // Create HTML with Mermaid
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
      background-color: ${backgroundColor};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .mermaid {
      max-width: 100%;
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
      themeVariables: {
        fontSize: '16px',
        fontFamily: 'Inter, system-ui, sans-serif'
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

      // Get the SVG element dimensions
      const svgElement = await page.$('.mermaid svg');
      if (!svgElement) {
        throw new Error('Mermaid diagram did not render');
      }

      // Take screenshot of the SVG element
      const screenshot = await svgElement.screenshot({
        type: 'png',
        omitBackground: backgroundColor === 'transparent',
      });

      return screenshot as Buffer;
    } catch (error) {
      console.error('Error generating diagram image:', error);
      throw new Error(`Failed to generate diagram image: ${error.message}`);
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
