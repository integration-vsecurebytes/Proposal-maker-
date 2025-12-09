import { TemplateSchema } from '@proposal-gen/shared';
import { ExtractedDocx } from '../extractor/docx-extractor';

export class SchemaGenerator {
  /**
   * Generate template schema from extracted DOCX data
   */
  generate(extracted: ExtractedDocx, templateName: string): TemplateSchema {
    const { styles, structure } = extracted;

    // Generate sections from document structure
    const sections = this.generateSections(structure);

    const schema: TemplateSchema = {
      template_name: templateName,
      style: 'formal',
      branding: {
        primary_color: styles.colors.primary || '#F7941D',
        secondary_color: styles.colors.secondary || '#0066B3',
        heading_font: styles.fonts.heading || 'Arial',
        body_font: styles.fonts.body || 'Arial',
      },
      assets: {},
      sections,
      table_styles: {
        header_bg_color: styles.tableStyles?.headerBg || '#F7941D',
        header_text_color: styles.tableStyles?.headerText || '#FFFFFF',
        alternating_rows: true,
      },
      chart_styles: {
        colors: [
          styles.colors.primary || '#F7941D',
          styles.colors.secondary || '#0066B3',
          styles.colors.accent || '#FFB347',
          '#4A90D9',
          '#FF6B6B',
          '#4ECDC4',
        ],
      },
    };

    return schema;
  }

  /**
   * Generate sections from document structure
   */
  private generateSections(structure: ExtractedDocx['structure']): TemplateSchema['sections'] {
    const sections: TemplateSchema['sections'] = [];
    let order = 0;

    // Add cover page
    sections.push({
      order: ++order,
      id: 'cover_page',
      title: 'Cover Page',
      type: 'special',
      required: true,
      purpose: 'Professional cover page',
    });

    // Add table of contents
    sections.push({
      order: ++order,
      id: 'toc',
      title: 'Table of Contents',
      type: 'auto_generated',
      required: true,
      purpose: 'Auto-generated table of contents',
    });

    // Process document headings
    const headings = structure.sections.filter((s) => s.type === 'heading');

    headings.forEach((heading, index) => {
      const level = heading.level;
      const text = heading.text;

      // Determine heading type
      let type: 'heading1' | 'heading2' | 'heading3' = 'heading1';
      if (level === 2) type = 'heading2';
      else if (level === 3) type = 'heading3';

      // Generate section ID from title
      const id = this.generateSectionId(text);

      // Determine if section supports charts/diagrams
      const supportsChart = this.supportsVisualization(text, 'chart');
      const supportsDiagram = this.supportsVisualization(text, 'diagram');

      sections.push({
        order: ++order,
        id,
        number: level === 1 ? `${index + 1}` : undefined,
        title: text,
        type,
        content_type: this.determineContentType(text),
        required: true,
        supports_chart: supportsChart,
        supports_diagram: supportsDiagram,
      });
    });

    return sections;
  }

  /**
   * Generate section ID from title
   */
  private generateSectionId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  /**
   * Determine content type based on section title
   */
  private determineContentType(
    title: string
  ): 'paragraphs' | 'bullets' | 'table' | 'mixed' | 'chart' | 'diagram' {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes('pricing') ||
      lowerTitle.includes('cost') ||
      lowerTitle.includes('payment') ||
      lowerTitle.includes('schedule')
    ) {
      return 'table';
    }

    if (
      lowerTitle.includes('scope') ||
      lowerTitle.includes('deliverable') ||
      lowerTitle.includes('assumption') ||
      lowerTitle.includes('obligation')
    ) {
      return 'bullets';
    }

    if (
      lowerTitle.includes('overview') ||
      lowerTitle.includes('solution') ||
      lowerTitle.includes('framework')
    ) {
      return 'mixed';
    }

    return 'paragraphs';
  }

  /**
   * Check if section supports visualizations
   */
  private supportsVisualization(title: string, type: 'chart' | 'diagram'): boolean {
    const lowerTitle = title.toLowerCase();

    if (type === 'chart') {
      return (
        lowerTitle.includes('pricing') ||
        lowerTitle.includes('cost') ||
        lowerTitle.includes('payment') ||
        lowerTitle.includes('risk') ||
        lowerTitle.includes('governance')
      );
    }

    if (type === 'diagram') {
      return (
        lowerTitle.includes('architecture') ||
        lowerTitle.includes('solution') ||
        lowerTitle.includes('framework') ||
        lowerTitle.includes('workflow') ||
        lowerTitle.includes('flow') ||
        lowerTitle.includes('breakdown')
      );
    }

    return false;
  }
}

export const schemaGenerator = new SchemaGenerator();
