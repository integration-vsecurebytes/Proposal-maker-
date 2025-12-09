import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

export interface ExtractedDocx {
  text: string;
  html: string;
  styles: StyleInfo;
  images: ImageInfo[];
  structure: DocumentStructure;
}

export interface StyleInfo {
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  fonts: {
    heading?: string;
    body?: string;
  };
  tableStyles?: {
    headerBg?: string;
    headerText?: string;
  };
}

export interface ImageInfo {
  name: string;
  data: Buffer;
  type: string;
  width?: number;
  height?: number;
}

export interface DocumentStructure {
  sections: Array<{
    level: number;
    text: string;
    type: 'heading' | 'paragraph' | 'table' | 'list';
  }>;
}

export class DocxExtractor {
  /**
   * Extract content, styles, and images from DOCX file
   */
  async extract(filePath: string): Promise<ExtractedDocx> {
    const fileBuffer = await fs.readFile(filePath);

    // Extract text and HTML using mammoth
    const { value: html, messages } = await mammoth.convertToHtml({ buffer: fileBuffer });
    const { value: text } = await mammoth.extractRawText({ buffer: fileBuffer });

    // Extract styles and images from DOCX XML
    const styles = await this.extractStyles(fileBuffer);
    const images = await this.extractImages(fileBuffer);
    const structure = await this.extractStructure(html);

    return {
      text,
      html,
      styles,
      images,
      structure,
    };
  }

  /**
   * Extract styles (colors, fonts) from DOCX XML
   */
  private async extractStyles(fileBuffer: Buffer): Promise<StyleInfo> {
    const zip = await JSZip.loadAsync(fileBuffer);

    // Extract styles.xml
    const stylesFile = zip.file('word/styles.xml');
    if (!stylesFile) {
      return {
        colors: {},
        fonts: {},
      };
    }

    const stylesXml = await stylesFile.async('text');
    const stylesData = await parseXML(stylesXml);

    const colors = this.extractColors(stylesData);
    const fonts = this.extractFonts(stylesData);
    const tableStyles = await this.extractTableStyles(zip);

    return {
      colors,
      fonts,
      tableStyles,
    };
  }

  /**
   * Extract colors from styles XML
   */
  private extractColors(stylesData: any): { primary?: string; secondary?: string; accent?: string } {
    const colors: { primary?: string; secondary?: string; accent?: string } = {};

    try {
      // Look for color definitions in the styles
      const styles = stylesData?.['w:styles']?.['w:style'];
      if (Array.isArray(styles)) {
        const colorValues: string[] = [];

        styles.forEach((style: any) => {
          const color = style?.['w:rPr']?.[0]?.['w:color']?.[0]?.$?.['w:val'];
          if (color && color !== 'auto' && color.match(/^[0-9A-Fa-f]{6}$/)) {
            colorValues.push(`#${color}`);
          }
        });

        // Assign most common colors
        if (colorValues.length > 0) {
          colors.primary = colorValues[0];
        }
        if (colorValues.length > 1) {
          colors.secondary = colorValues[1];
        }
        if (colorValues.length > 2) {
          colors.accent = colorValues[2];
        }
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
    }

    // Default colors if none found
    if (!colors.primary) colors.primary = '#F7941D';
    if (!colors.secondary) colors.secondary = '#0066B3';

    return colors;
  }

  /**
   * Extract fonts from styles XML
   */
  private extractFonts(stylesData: any): { heading?: string; body?: string } {
    const fonts: { heading?: string; body?: string } = {};

    try {
      const styles = stylesData?.['w:styles']?.['w:style'];
      if (Array.isArray(styles)) {
        styles.forEach((style: any) => {
          const styleName = style?.$?.['w:styleId'];
          const font = style?.['w:rPr']?.[0]?.['w:rFonts']?.[0]?.$?.['w:ascii'];

          if (font) {
            if (styleName?.includes('Heading') || styleName?.includes('Title')) {
              fonts.heading = font;
            } else if (styleName?.includes('Normal') || styleName?.includes('Body')) {
              fonts.body = font;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error extracting fonts:', error);
    }

    // Default fonts if none found
    if (!fonts.heading) fonts.heading = 'Arial';
    if (!fonts.body) fonts.body = 'Arial';

    return fonts;
  }

  /**
   * Extract table styles
   */
  private async extractTableStyles(zip: JSZip): Promise<{ headerBg?: string; headerText?: string }> {
    const tableStyles: { headerBg?: string; headerText?: string } = {};

    try {
      const stylesFile = zip.file('word/styles.xml');
      if (stylesFile) {
        const xml = await stylesFile.async('text');
        const data = await parseXML(xml) as any;

        // Look for table styles
        const tblStyles = data?.['w:styles']?.['w:style']?.filter(
          (s: any) => s?.$?.['w:type'] === 'table'
        );

        if (tblStyles && tblStyles.length > 0) {
          // Extract header colors from first table style
          const tblPr = tblStyles[0]?.['w:tblPr']?.[0];
          const shd = tblPr?.['w:shd']?.[0]?.$;

          if (shd?.['w:fill']) {
            tableStyles.headerBg = `#${shd['w:fill']}`;
          }
        }
      }
    } catch (error) {
      console.error('Error extracting table styles:', error);
    }

    // Defaults
    if (!tableStyles.headerBg) tableStyles.headerBg = '#F7941D';
    if (!tableStyles.headerText) tableStyles.headerText = '#FFFFFF';

    return tableStyles;
  }

  /**
   * Extract images from DOCX
   */
  private async extractImages(fileBuffer: Buffer): Promise<ImageInfo[]> {
    const images: ImageInfo[] = [];

    try {
      const zip = await JSZip.loadAsync(fileBuffer);

      // Get all files in word/media directory
      const mediaFiles = Object.keys(zip.files).filter((name) => name.startsWith('word/media/'));

      for (const fileName of mediaFiles) {
        const file = zip.file(fileName);
        if (file) {
          const data = await file.async('nodebuffer');
          const name = path.basename(fileName);
          const ext = path.extname(fileName).toLowerCase();

          let type = 'image/png';
          if (ext === '.jpg' || ext === '.jpeg') type = 'image/jpeg';
          else if (ext === '.png') type = 'image/png';
          else if (ext === '.gif') type = 'image/gif';

          images.push({
            name,
            data,
            type,
          });
        }
      }
    } catch (error) {
      console.error('Error extracting images:', error);
    }

    return images;
  }

  /**
   * Extract document structure from HTML
   */
  private async extractStructure(html: string): Promise<DocumentStructure> {
    const sections: DocumentStructure['sections'] = [];

    // Simple HTML parsing to identify headings and sections
    const headingRegex = /<h(\d)>(.*?)<\/h\d>/gi;
    const paragraphRegex = /<p>(.*?)<\/p>/gi;

    let match;

    // Extract headings
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, '').trim(); // Strip HTML tags

      sections.push({
        level,
        text,
        type: 'heading',
      });
    }

    // Extract paragraphs
    while ((match = paragraphRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, '').trim();

      if (text.length > 0) {
        sections.push({
          level: 0,
          text,
          type: 'paragraph',
        });
      }
    }

    return { sections };
  }
}

export const docxExtractor = new DocxExtractor();
