import mammoth from 'mammoth';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

/**
 * DOCX Template Extractor
 * Extracts structure, styles, and assets from uploaded DOCX files
 */
export class TemplateExtractor {
  /**
   * Extract template from DOCX file
   */
  async extractFromDOCX(filePath: string): Promise<{
    schema: any;
    styles: any;
    assets: any;
  }> {
    console.log(`Extracting template from: ${filePath}`);

    // Read DOCX as zip
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);

    // Extract text content and structure using mammoth
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    // Extract images and logos
    const assets = await this.extractAssets(zip);

    // Extract styles from styles.xml
    const styles = await this.extractStyles(zip);

    // Generate schema from content structure
    const schema = await this.generateSchema(text, assets);

    return {
      schema,
      styles,
      assets,
    };
  }

  /**
   * Extract images and logos from DOCX
   */
  private async extractAssets(zip: JSZip): Promise<any> {
    const assets: any = {
      companyLogo: null,
      clientLogo: null,
      coverImage: null,
      headerLogo: null,
      footerLogo: null,
      images: [],
    };

    // DOCX images are in word/media/ folder
    const mediaFolder = zip.folder('word/media');
    if (!mediaFolder) {
      console.log('No media folder found in DOCX');
      return assets;
    }

    const imageFiles: Array<{ name: string; data: Buffer }> = [];

    // Extract all images
    for (const [filename, file] of Object.entries(mediaFolder.files)) {
      if (file.dir) continue;

      const extension = path.extname(filename).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(extension)) {
        const data = await file.async('nodebuffer');
        const base64 = `data:image/${extension.slice(1)};base64,${data.toString('base64')}`;

        imageFiles.push({
          name: filename,
          data: data,
        });

        // First image is typically the company logo
        if (!assets.companyLogo) {
          assets.companyLogo = base64;
          assets.headerLogo = base64;
          assets.footerLogo = base64;
        } else if (!assets.coverImage) {
          assets.coverImage = base64;
        } else {
          assets.images.push({
            name: filename,
            data: base64,
          });
        }
      }
    }

    console.log(`Extracted ${imageFiles.length} images from DOCX`);
    return assets;
  }

  /**
   * Extract styles from styles.xml
   */
  private async extractStyles(zip: JSZip): Promise<any> {
    const styles: any = {
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      fontFamily: 'Calibri, Arial, sans-serif',
      fontSize: {
        title: '24pt',
        heading1: '18pt',
        heading2: '14pt',
        body: '11pt',
      },
    };

    try {
      // Try to extract styles.xml
      const stylesFile = zip.file('word/styles.xml');
      if (stylesFile) {
        const stylesXml = await stylesFile.async('string');

        // Extract font family from styles XML
        const fontMatch = stylesXml.match(/<w:rFonts[^>]*w:ascii="([^"]+)"/);
        if (fontMatch) {
          styles.fontFamily = `${fontMatch[1]}, sans-serif`;
        }

        // Try to extract theme colors from theme1.xml
        const themeFile = zip.file('word/theme/theme1.xml');
        if (themeFile) {
          const themeXml = await themeFile.async('string');

          // Extract accent colors
          const accent1Match = themeXml.match(/<a:accent1>.*?<a:srgbClr val="([^"]+)"/);
          if (accent1Match) {
            styles.primaryColor = `#${accent1Match[1]}`;
          }

          const accent2Match = themeXml.match(/<a:accent2>.*?<a:srgbClr val="([^"]+)"/);
          if (accent2Match) {
            styles.secondaryColor = `#${accent2Match[1]}`;
          }
        }
      }
    } catch (error) {
      console.error('Error extracting styles:', error);
    }

    console.log('Extracted styles:', styles);
    return styles;
  }

  /**
   * Generate template schema from content
   */
  private async generateSchema(text: string, assets: any): Promise<any> {
    // Split text into sections
    const lines = text.split('\n').filter(line => line.trim());

    // Detect sections based on content patterns
    const sections: any[] = [];
    let sectionId = 0;

    // Common proposal sections
    const sectionPatterns = [
      { id: 'cover_page', title: 'Cover Page', type: 'cover_page', keywords: [] },
      { id: 'executive_summary', title: 'Executive Summary', type: 'executive_summary', keywords: ['executive summary', 'overview', 'summary'] },
      { id: 'introduction', title: 'Introduction', type: 'introduction', keywords: ['introduction', 'about us', 'background'] },
      { id: 'scope', title: 'Scope of Work', type: 'scope', keywords: ['scope', 'deliverables', 'services'] },
      { id: 'methodology', title: 'Methodology', type: 'methodology', keywords: ['methodology', 'approach', 'process'] },
      { id: 'timeline', title: 'Timeline', type: 'timeline', keywords: ['timeline', 'schedule', 'milestones'] },
      { id: 'pricing', title: 'Pricing', type: 'pricing', keywords: ['pricing', 'cost', 'investment', 'budget', 'fees'] },
      { id: 'terms', title: 'Terms & Conditions', type: 'terms', keywords: ['terms', 'conditions', 'legal'] },
      { id: 'conclusion', title: 'Conclusion', type: 'conclusion', keywords: ['conclusion', 'next steps', 'contact'] },
    ];

    // Auto-detect sections from content
    let currentSection: any = null;
    let contentBuffer: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Check if line matches a section pattern
      const matchedPattern = sectionPatterns.find(pattern =>
        pattern.keywords.some(keyword => lowerLine.includes(keyword)) ||
        lowerLine === pattern.title.toLowerCase()
      );

      if (matchedPattern) {
        // Save previous section
        if (currentSection) {
          currentSection.description = contentBuffer.join('\n');
          sections.push(currentSection);
          contentBuffer = [];
        }

        // Start new section
        currentSection = {
          id: `${matchedPattern.id}_${sectionId++}`,
          title: matchedPattern.title,
          type: matchedPattern.type,
          contentType: 'paragraphs',
          required: true,
          description: '',
        };
      } else if (currentSection) {
        contentBuffer.push(line);
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.description = contentBuffer.join('\n');
      sections.push(currentSection);
    }

    // If no sections detected, create default structure
    if (sections.length === 0) {
      sections.push(...sectionPatterns.map((pattern, index) => ({
        id: `${pattern.id}_${index}`,
        title: pattern.title,
        type: pattern.type,
        contentType: 'paragraphs',
        required: true,
        description: `${pattern.title} section`,
      })));
    }

    return {
      name: 'Extracted Template',
      version: '1.0',
      sections,
      metadata: {
        extractedAt: new Date().toISOString(),
        originalFormat: 'docx',
      },
    };
  }
}

export const templateExtractor = new TemplateExtractor();
