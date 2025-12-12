import { db } from '../../db';
import { proposals, templates, visualizations } from '../../db/schema';
import { eq } from 'drizzle-orm';
import ejs from 'ejs';
import { readFile } from 'fs/promises';
import path from 'path';
import mermaid from 'mermaid';

/**
 * Normalized branding colors interface
 */
interface BrandingColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  border_color: string;
  text_color: string;
  background_color: string;
  fontFamily: string;
}

/**
 * Normalize branding property names
 * Handles both camelCase (from proposal.branding) and snake_case (from template)
 */
function normalizeBranding(branding: any): BrandingColors {
  return {
    primary_color: branding.primaryColor || branding.primary_color || '#3b82f6',
    secondary_color: branding.secondaryColor || branding.secondary_color || '#64748b',
    accent_color: branding.accentColor || branding.accent_color || '#FFB347',
    border_color: branding.borderColor || branding.border_color || '#e5e7eb',
    text_color: branding.textColor || branding.text_color || '#1f2937',
    background_color: branding.backgroundColor || branding.background_color || '#ffffff',
    fontFamily: branding.fontFamily || branding.font_family || 'Inter, system-ui, sans-serif',
  };
}

/**
 * HTML Generator Service
 * Generates standalone HTML files from proposal content
 */
export class HtmlGenerator {
  /**
   * Generate HTML file from proposal
   */
  async generateHtml(proposalId: string): Promise<string> {
    // Get proposal
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get template
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, proposal.templateId!));

    if (!template) {
      throw new Error('Template not found');
    }

    // Get visualizations
    const proposalVisualizations = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.proposalId, proposalId));

    // Extract data
    const generatedContent = (proposal.generatedContent as any) || { sections: {} };
    const sections = generatedContent.sections || {};
    const templateSchema = template.schema as any;
    const templateBranding = templateSchema?.branding || {};

    // Normalize branding
    const branding = normalizeBranding({
      ...templateBranding,
      ...(proposal.branding || {}),
    });

    // Transform sections data
    const transformedSections = Object.entries(sections).map(([id, data]: [string, any], index) => {
      // Get manually added visualizations for this section
      const manualVisualizations = proposalVisualizations
        .filter((v) => v.sectionId === id)
        .map((v) => {
          if (v.type === 'chart') {
            const config = v.config as any;
            return {
              type: 'chart',
              chartType: config.type,
              chartData: {
                labels: config.labels,
                datasets: config.datasets,
              },
              caption: config.title,
            };
          } else {
            const config = v.config as any;
            return {
              type: 'mermaid',
              code: config.code,
              caption: config.title,
            };
          }
        });

      // Combine AI-generated and manually added visualizations
      const allVisualizations = [
        ...(data.visualizations || []),
        ...manualVisualizations,
      ];

      return {
        id,
        type: data.type || 'general',
        title: data.title,
        content: data.content,
        visualizations: allVisualizations,
        order: index + 1,
      };
    });

    // Prepare proposal data for template
    const proposalData = {
      projectTitle: proposal.projectTitle || 'Untitled Proposal',
      clientName: proposal.clientName,
      clientCompany: proposal.clientCompany,
      companyName: proposal.companyName || 'Your Company',
      date: new Date(proposal.createdAt).toLocaleDateString(),
      sections: transformedSections,
    };

    // Generate HTML
    const html = await this.renderHtmlTemplate(proposalData, branding, template);

    return html;
  }

  /**
   * Render the HTML template
   */
  private async renderHtmlTemplate(
    proposal: any,
    branding: BrandingColors,
    template: any
  ): Promise<string> {
    // Collect all chart configurations
    const chartConfigs: Array<{ id: string; config: any }> = [];

    // Build complete HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal.projectTitle || 'Proposal'}</title>

  <!-- Chart.js for charts -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

  <!-- Mermaid for diagrams - Using version 9 for better compatibility -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@9/dist/mermaid.min.js"></script>

  <script>
    // Initialize Mermaid with simple config
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      logLevel: 'error',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
        fontSize: '16px',
        fontFamily: 'Inter, sans-serif'
      }
    });

    // Initialize everything when page loads
    window.addEventListener('load', function() {
      console.log('Page loaded, initializing visualizations...');

      // Initialize all charts
      if (typeof Chart !== 'undefined') {
        console.log('Initializing Chart.js charts...');
        try {
          window.initializeCharts();
          console.log('Charts initialized successfully');
        } catch (e) {
          console.error('Error initializing charts:', e);
        }
      } else {
        console.error('Chart.js not loaded');
      }

      // Double-check Mermaid rendered
      setTimeout(function() {
        const mermaidDivs = document.querySelectorAll('.mermaid');
        console.log('Mermaid diagrams on page: ' + mermaidDivs.length);
        mermaidDivs.forEach(function(div, index) {
          if (!div.querySelector('svg')) {
            console.warn('Mermaid diagram ' + index + ' did not render');
          }
        });
      }, 1000);
    });
  </script>

  <style>
    /* Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${branding.fontFamily};
      font-size: 11pt;
      line-height: 1.6;
      color: ${branding.text_color};
      background: linear-gradient(to bottom, #ffffff, #f8fafc);
      padding: 2rem;
      max-width: 210mm;
      margin: 0 auto;
    }

    /* Typography - Matching Preview */
    h1 {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
      page-break-after: avoid;
    }

    h1::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, ${branding.primary_color}, ${branding.accent_color});
      border-radius: 2px;
    }

    h2 {
      font-size: 1.75rem;
      font-weight: bold;
      color: ${branding.primary_color};
      margin-top: 2rem;
      margin-bottom: 1rem;
      page-break-after: avoid;
      position: relative;
      padding-left: 20px;
    }

    h2::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 60%;
      background: ${branding.primary_color};
      border-radius: 3px;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: bold;
      color: ${branding.secondary_color};
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      page-break-after: avoid;
    }

    p {
      line-height: 1.8;
      margin-bottom: 1.25rem;
      color: #374151;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Lists - Matching Preview */
    ul, ol {
      margin: 1.5rem 0;
      padding-left: 2rem;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    li {
      margin-bottom: 0.75rem;
      line-height: 1.7;
      color: #4b5563;
      position: relative;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    ul li::marker {
      color: ${branding.primary_color};
      font-weight: bold;
    }

    strong {
      color: ${branding.primary_color};
      font-weight: 600;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      page-break-after: always;
      background: linear-gradient(135deg, ${branding.primary_color}15 0%, ${branding.secondary_color}15 100%);
    }

    .cover-title {
      font-size: 3rem;
      font-weight: bold;
      color: ${branding.primary_color};
      margin-bottom: 2rem;
    }

    .cover-subtitle {
      font-size: 1.5rem;
      color: ${branding.secondary_color};
      margin-bottom: 1rem;
    }

    .cover-client {
      font-size: 1.75rem;
      font-weight: bold;
      margin-top: 3rem;
      margin-bottom: 1rem;
    }

    .cover-date {
      font-size: 1.25rem;
      color: ${branding.secondary_color};
      margin-top: 3rem;
    }

    /* Sections - Matching Preview */
    .section {
      background: white;
      padding: 3rem;
      margin-bottom: 2rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: box-shadow 0.3s ease;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
      page-break-inside: avoid;
    }

    .section:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* Visualizations - Matching Preview with decorative accents */
    .visualization {
      position: relative;
      margin: 2rem 0;
      padding: 2rem;
      border: 2px solid ${branding.accent_color};
      border-radius: 16px;
      background: linear-gradient(to bottom right, #ffffff, #f9fafb);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .visualization::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle at top right, ${branding.primary_color}15, transparent);
      opacity: 0.5;
    }

    .visualization-caption {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 2px solid ${branding.accent_color};
      text-align: center;
      font-weight: 600;
      font-size: 0.875rem;
      color: ${branding.secondary_color};
    }

    /* Charts - Matching Preview */
    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
      margin: 1rem 0;
      z-index: 2;
    }

    .chart-container canvas {
      max-width: 100%;
      max-height: 400px;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    /* Mermaid diagrams - Matching Preview */
    .mermaid-container {
      margin: 1rem 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      max-height: 300px;
      overflow: auto;
      z-index: 2;
    }

    .mermaid {
      max-width: 100%;
      display: inline-block;
      text-align: center;
    }

    .mermaid-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      min-height: 200px;
    }

    /* Mermaid SVG and text styling - Matching Preview */
    .mermaid svg {
      max-width: 100%;
      max-height: 300px;
      height: auto;
      width: auto;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
    }

    .mermaid svg text,
    .mermaid svg tspan {
      fill: #000000 !important;
      color: #000000 !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      text-anchor: middle !important;
      dominant-baseline: central !important;
    }

    .mermaid svg foreignObject {
      overflow: visible !important;
    }

    .mermaid svg foreignObject > div {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .mermaid svg foreignObject div,
    .mermaid svg foreignObject span,
    .mermaid svg foreignObject p {
      color: #000000 !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      text-align: center !important;
      line-height: 1.4 !important;
      white-space: normal !important;
      word-break: break-word !important;
      writing-mode: horizontal-tb !important;
    }

    .mermaid svg .label-container,
    .mermaid svg .labelBox {
      fill: #ffffff !important;
      stroke: #d1d5db !important;
    }

    .mermaid svg .node rect,
    .mermaid svg .node circle,
    .mermaid svg .node polygon {
      stroke-width: 2px !important;
    }

    /* Print Styles */
    @media print {
      body {
        padding: 0;
      }

      .section {
        page-break-inside: avoid;
      }

      .visualization {
        page-break-inside: avoid;
        page-break-before: auto;
        page-break-after: auto;
      }

      .chart-container,
      .mermaid-container {
        page-break-inside: avoid;
      }

      @page {
        size: A4;
        margin: 20mm 25mm;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-title">${proposal.projectTitle}</div>
    <div class="cover-subtitle">Business Proposal</div>
    <div class="cover-client">Prepared for: ${proposal.clientCompany || proposal.clientName}</div>
    <div class="cover-date">${proposal.date}</div>
  </div>

  <!-- Sections -->
  ${proposal.sections.map((section: any) => `
    <div class="section">
      <h2>${section.title}</h2>
      <div class="content">
        ${this.formatContent(section.content)}
      </div>

      ${section.visualizations && section.visualizations.length > 0 ? `
        ${section.visualizations.map((viz: any) => this.renderVisualization(viz, chartConfigs)).join('\n')}
      ` : ''}
    </div>
  `).join('\n')}

  <!-- Chart Initialization Script -->
  <script>
    window.initializeCharts = function() {
      ${chartConfigs.length > 0 ? chartConfigs.map(({ id, config }) => `
        (function() {
          try {
            const ctx = document.getElementById('${id}');
            if (ctx) {
              console.log('Initializing chart: ${id}');
              new Chart(ctx, ${JSON.stringify(config)});
            } else {
              console.error('Canvas element not found: ${id}');
            }
          } catch (e) {
            console.error('Error initializing chart ${id}:', e);
          }
        })();
      `).join('\n') : '// No charts to initialize'}
    };

    // Call immediately if Chart.js is already loaded
    if (typeof Chart !== 'undefined' && document.readyState === 'complete') {
      window.initializeCharts();
    }
  </script>

</body>
</html>`;

    return html;
  }

  /**
   * Format content (convert markdown-like syntax to HTML)
   */
  private formatContent(content: string): string {
    if (!content) return '';

    // First, handle inline formatting
    let formatted = content;

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em> (but not if it's at start of line for bullets)
    formatted = formatted.replace(/(?<!^|\n)\*([^*\n]+)\*/g, '<em>$1</em>');

    // Split into blocks by double newlines
    const blocks = formatted.split('\n\n');

    return blocks
      .map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';

        // Check if it's a bullet list (starts with -, *, or •)
        const lines = trimmed.split('\n');
        const isList = lines.some(line => /^[-*•]\s+/.test(line.trim()));

        if (isList) {
          const items = lines
            .filter(line => /^[-*•]\s+/.test(line.trim()))
            .map(line => {
              // Remove bullet marker and format content
              const cleaned = line.replace(/^[-*•]\s+/, '').trim();
              return cleaned ? `<li>${this.formatInlineText(cleaned)}</li>` : '';
            })
            .filter(Boolean)
            .join('\n');
          return `<ul>${items}</ul>`;
        }

        // Check if it's a heading (starts with ## or #)
        if (trimmed.startsWith('###')) {
          const text = trimmed.replace(/^###\s*/, '').trim();
          return `<h3>${this.formatInlineText(text)}</h3>`;
        }
        if (trimmed.startsWith('##')) {
          const text = trimmed.replace(/^##\s*/, '').trim();
          return `<h2>${this.formatInlineText(text)}</h2>`;
        }
        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#\s*/, '').trim();
          return `<h1>${this.formatInlineText(text)}</h1>`;
        }

        // Regular paragraph - handle line breaks within
        const withLineBreaks = trimmed.replace(/\n/g, '<br>');
        return `<p>${this.formatInlineText(withLineBreaks)}</p>`;
      })
      .join('\n');
  }

  /**
   * Format inline text (bold, italic, etc.)
   */
  private formatInlineText(text: string): string {
    let formatted = text;

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convert remaining single * at start (like *Key:) to bold for headings
    formatted = formatted.replace(/^\*([^*:]+:)/g, '<strong>$1</strong>');

    // Convert *text* to <em> for emphasis
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return formatted;
  }

  /**
   * Render a visualization (chart or diagram)
   */
  private renderVisualization(viz: any, chartConfigs: Array<{ id: string; config: any }>): string {
    // Handle nested data structure (AI-generated visualizations have type + data)
    let unwrappedViz = viz;
    if (viz.data && typeof viz.data === 'object') {
      unwrappedViz = {
        type: viz.type,
        ...viz.data,
      };
    }

    if (unwrappedViz.type === 'chart' && unwrappedViz.chartType && unwrappedViz.chartData) {
      return this.renderChart(unwrappedViz, chartConfigs);
    } else if (unwrappedViz.type === 'mermaid' && unwrappedViz.code) {
      return this.renderMermaid(unwrappedViz);
    }

    // Skip rendering for other visualization types (callout, table, etc.)
    return '';
  }

  /**
   * Render a chart
   */
  private renderChart(viz: any, chartConfigs: Array<{ id: string; config: any }>): string {
    const chartId = `chart-${Math.random().toString(36).substring(7)}`;
    const config = {
      type: viz.chartType,
      data: viz.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          title: {
            display: !!viz.caption,
            text: viz.caption || '',
          }
        }
      }
    };

    // Add to chartConfigs array for initialization
    chartConfigs.push({ id: chartId, config });

    return `
      <div class="visualization">
        <div class="chart-container">
          <canvas id="${chartId}"></canvas>
        </div>
        ${viz.caption ? `<div class="visualization-caption">${viz.caption}</div>` : ''}
      </div>
    `;
  }

  /**
   * Render a Mermaid diagram
   */
  private renderMermaid(viz: any): string {
    return `
      <div class="visualization">
        <div class="mermaid-container">
          <div class="mermaid">${viz.code || ''}</div>
        </div>
        ${viz.caption ? `<div class="visualization-caption">${viz.caption}</div>` : ''}
      </div>
    `;
  }
}

export const htmlGenerator = new HtmlGenerator();
