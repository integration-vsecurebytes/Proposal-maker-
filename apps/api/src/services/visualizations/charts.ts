import { createAIProvider } from '../../lib/ai-provider';
import { LATEST_STABLE_MODELS } from '../../lib/models';
import type { ChartConfig, ChartType, GenerateChartRequest } from '@proposal-gen/shared';
import { db } from '../../db';
import { proposals, visualizations } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface ChartGenerationContext {
  proposalId: string;
  sectionId: string;
  chartType: ChartType;
  title: string;
  extractedData?: any;
  context?: string;
}

export class ChartGenerationService {
  private aiProvider = createAIProvider('gemini', LATEST_STABLE_MODELS.gemini.pro);

  /**
   * Generate a chart configuration using AI
   */
  async generateChart(request: GenerateChartRequest): Promise<ChartConfig> {
    const { proposalId, sectionId, chartType, title, context } = request;

    // Get proposal data for context
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const extractedData = proposal.extractedData || {};

    // Generate chart data using AI
    const chartData = await this.generateChartData({
      proposalId,
      sectionId,
      chartType,
      title,
      extractedData,
      context,
    });

    return chartData;
  }

  /**
   * Generate chart data using AI based on context
   */
  private async generateChartData(ctx: ChartGenerationContext): Promise<ChartConfig> {
    const prompt = this.buildChartPrompt(ctx);

    const response = await this.aiProvider.generateText(
      prompt,
      'You are a data visualization expert. Generate chart configurations in valid JSON format.'
    );

    // Parse AI response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse chart data from AI response');
    }

    const chartData = JSON.parse(jsonMatch[0]);

    // Apply chart-specific styling
    const config: ChartConfig = {
      type: ctx.chartType,
      title: ctx.title,
      labels: chartData.labels || [],
      datasets: chartData.datasets || [],
      options: this.getChartOptions(ctx.chartType),
    };

    // Apply default colors if not provided
    config.datasets = config.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || this.getDefaultColors(ctx.chartType, config.labels.length)[index],
      borderColor: dataset.borderColor || this.getDefaultBorderColors(ctx.chartType)[index],
    }));

    return config;
  }

  /**
   * Build AI prompt for chart generation
   */
  private buildChartPrompt(ctx: ChartGenerationContext): string {
    const { chartType, title, extractedData, context } = ctx;

    let prompt = `Generate a ${chartType} chart configuration for a business proposal.\n\n`;

    prompt += `Chart Title: ${title}\n\n`;

    if (context) {
      prompt += `Context: ${context}\n\n`;
    }

    // Add proposal context
    if (extractedData.projectTitle) {
      prompt += `Project: ${extractedData.projectTitle}\n`;
    }
    if (extractedData.clientCompany) {
      prompt += `Client: ${extractedData.clientCompany}\n`;
    }
    if (extractedData.industry) {
      prompt += `Industry: ${extractedData.industry}\n`;
    }
    if (extractedData.budget?.total) {
      prompt += `Budget: ${extractedData.budget.total}\n`;
    }
    if (extractedData.timeline?.duration) {
      prompt += `Timeline: ${extractedData.timeline.duration}\n`;
    }

    // Chart-specific instructions
    prompt += `\n${this.getChartTypeInstructions(chartType)}\n\n`;

    prompt += `Return ONLY a JSON object with this structure:
{
  "labels": ["Label 1", "Label 2", ...],
  "datasets": [
    {
      "label": "Dataset Name",
      "data": [number, number, ...]
    }
  ]
}

Generate realistic, professional data that makes sense for this proposal context.`;

    return prompt;
  }

  /**
   * Get chart-specific generation instructions
   */
  private getChartTypeInstructions(chartType: ChartType): string {
    switch (chartType) {
      case 'bar':
        return `Create a bar chart for comparing values across categories. Common use cases:
- Cost breakdown by phase or category
- Resource allocation
- Timeline comparison
- Feature comparison`;

      case 'line':
        return `Create a line chart for showing trends over time. Common use cases:
- Project timeline and milestones
- Budget utilization over time
- Performance metrics
- Progress tracking`;

      case 'pie':
        return `Create a pie chart for showing proportions. Common use cases:
- Budget distribution
- Time allocation
- Resource distribution
- Market share`;

      case 'doughnut':
        return `Create a doughnut chart for showing proportions with a central focus. Common use cases:
- Payment schedule breakdown
- Phase distribution
- Team allocation
- Risk categories`;

      case 'radar':
        return `Create a radar chart for multi-dimensional comparison. Common use cases:
- Risk assessment across categories
- Capability assessment
- Performance metrics
- Feature coverage`;

      case 'polarArea':
        return `Create a polar area chart for showing magnitude and category. Common use cases:
- Priority distribution
- Impact analysis
- Resource intensity
- Coverage areas`;

      default:
        return 'Create appropriate data for this chart type.';
    }
  }

  /**
   * Get default chart options based on type
   */
  private getChartOptions(chartType: ChartType): any {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
        },
        title: {
          display: false, // Title rendered separately
        },
      },
    };

    switch (chartType) {
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        };

      case 'line':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          elements: {
            line: {
              tension: 0.4, // Smooth curves
            },
          },
        };

      case 'pie':
      case 'doughnut':
      case 'polarArea':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              display: true,
              position: 'right' as const,
            },
          },
        };

      case 'radar':
        return {
          ...baseOptions,
          scales: {
            r: {
              beginAtZero: true,
            },
          },
        };

      default:
        return baseOptions;
    }
  }

  /**
   * Get default colors for charts
   */
  private getDefaultColors(chartType: ChartType, count: number): string[] {
    const colorPalette = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#6366f1', // Indigo
    ];

    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
      // Return multiple colors for each segment
      return colorPalette.slice(0, count);
    }

    // For other charts, return one color per dataset
    return colorPalette;
  }

  /**
   * Get default border colors
   */
  private getDefaultBorderColors(chartType: ChartType): string[] {
    const borderColors = [
      '#2563eb', // Darker blue
      '#059669', // Darker green
      '#d97706', // Darker amber
      '#dc2626', // Darker red
      '#7c3aed', // Darker purple
      '#db2777', // Darker pink
      '#0891b2', // Darker cyan
      '#ea580c', // Darker orange
      '#65a30d', // Darker lime
      '#4f46e5', // Darker indigo
    ];

    return borderColors;
  }

  /**
   * Save generated chart to database
   */
  async saveChart(proposalId: string, sectionId: string, config: ChartConfig): Promise<any> {
    const [visualization] = await db
      .insert(visualizations)
      .values({
        proposalId,
        sectionId,
        type: 'chart',
        config,
      })
      .returning();

    return visualization;
  }

  /**
   * Update existing chart
   */
  async updateChart(visualizationId: string, config: ChartConfig): Promise<any> {
    const [updated] = await db
      .update(visualizations)
      .set({
        config,
        updatedAt: new Date(),
      })
      .where(eq(visualizations.id, visualizationId))
      .returning();

    return updated;
  }

  /**
   * Get chart by ID
   */
  async getChart(visualizationId: string): Promise<any> {
    const [visualization] = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, visualizationId));

    return visualization;
  }

  /**
   * Get all charts for a proposal
   */
  async getProposalCharts(proposalId: string): Promise<any[]> {
    const charts = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.proposalId, proposalId));

    return charts.filter(v => v.type === 'chart');
  }
}

export const chartGenerationService = new ChartGenerationService();
