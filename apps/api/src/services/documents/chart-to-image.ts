import { Chart, ChartConfiguration } from 'chart.js/auto';
import { createCanvas } from 'canvas';
import { validateChartData } from './chart-validator';

export interface ChartImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  scale?: number; // For higher resolution/quality
}

/**
 * Normalize branding colors from either camelCase or snake_case
 */
function normalizeBranding(branding: any) {
  return {
    primaryColor: branding?.primaryColor || branding?.primary_color || '#3b82f6',
    secondaryColor: branding?.secondaryColor || branding?.secondary_color || '#64748b',
    accentColor: branding?.accentColor || branding?.accent_color || '#8b5cf6',
    borderColor: branding?.borderColor || branding?.border_color || '#e2e8f0',
    textColor: branding?.textColor || branding?.text_color || '#64748b',
    backgroundColor: branding?.backgroundColor || branding?.background_color || '#ffffff',
    surfaceColor: branding?.surfaceColor || branding?.surface_color || '#f8fafc',
    fontFamily: branding?.fontFamily || branding?.font_family || 'system-ui, sans-serif',
    successColor: branding?.successColor || branding?.success_color,
    warningColor: branding?.warningColor || branding?.warning_color,
    errorColor: branding?.errorColor || branding?.error_color,
    infoColor: branding?.infoColor || branding?.info_color,
  };
}

export class ChartImageService {
  /**
   * Generate color palette from branding - using dynamic theme colors
   */
  private generateColorPalette(branding?: any): string[] {
    const colors = normalizeBranding(branding);

    // Use normalized theme colors
    return [
      colors.primaryColor,
      colors.secondaryColor,
      colors.accentColor,
      colors.successColor,
      colors.warningColor,
      colors.errorColor,
      colors.infoColor,
      colors.surfaceColor,
      colors.borderColor,
      colors.textColor,
    ].filter(Boolean); // Remove undefined values
  }

  /**
   * Apply branding colors to chart datasets
   */
  private applyBrandingToDatasets(chartConfig: ChartConfiguration, branding?: any): void {
    const colors = this.generateColorPalette(branding);

    if (!chartConfig.data?.datasets) return;

    chartConfig.data.datasets.forEach((dataset: any, index: number) => {
      const color = colors[index % colors.length];

      // Apply colors based on chart type
      if (chartConfig.type === 'pie' || chartConfig.type === 'doughnut' || chartConfig.type === 'polarArea') {
        // For pie/doughnut charts, each data point gets a different color
        if (!dataset.backgroundColor) {
          dataset.backgroundColor = dataset.data.map((_: any, i: number) => colors[i % colors.length]);
        }
        if (!dataset.borderColor && branding?.backgroundColor) {
          dataset.borderColor = branding.backgroundColor;
          dataset.borderWidth = 2;
        }
      } else {
        // For other charts, each dataset gets one color
        if (!dataset.backgroundColor) {
          dataset.backgroundColor = color + '80'; // Add alpha for transparency
        }
        if (!dataset.borderColor) {
          dataset.borderColor = color;
          dataset.borderWidth = 2;
        }
      }
    });
  }

  /**
   * Generate a high-quality PNG image from Chart.js configuration
   */
  async generateChartImage(
    chartConfig: ChartConfiguration,
    options: ChartImageOptions = {},
    branding?: any
  ): Promise<Buffer> {
    const {
      width = 800,
      height = 500,
      backgroundColor = 'transparent', // Transparent background for documents
      scale = 2, // 2x resolution for better quality
    } = options;

    try {
      // Apply branding colors to datasets
      this.applyBrandingToDatasets(chartConfig, branding);

      // Create a high-resolution canvas
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const canvas = createCanvas(scaledWidth, scaledHeight);
      const ctx = canvas.getContext('2d') as any;

      // Enable anti-aliasing for smoother rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Only fill background if not transparent
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);
      }

      // Scale context for high DPI
      ctx.scale(scale, scale);

      // Create the chart with scaled dimensions
      new Chart(ctx, {
        ...chartConfig,
        options: {
          ...chartConfig.options,
          devicePixelRatio: scale,
          animation: false, // Disable animation for server-side rendering
        },
      });

      console.log(`[Chart] Generated ${chartConfig.type} chart: ${scaledWidth}x${scaledHeight}px`);

      // Return as PNG buffer with compression
      return canvas.toBuffer('image/png', {
        compressionLevel: 6,
      });
    } catch (error) {
      console.error('[Chart] Error generating chart image:', error);
      throw new Error(`Failed to generate chart image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate chart image from simplified chart data
   */
  async generateFromChartData(
    chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea',
    chartData: any,
    caption?: string,
    options: ChartImageOptions = {},
    branding?: any
  ): Promise<Buffer> {
    // Validate chart data
    const validation = validateChartData(chartType, chartData);

    if (!validation.isValid) {
      console.error(`[Chart] Validation failed for ${chartType}:`, validation.errors);
      throw new Error(`Invalid ${chartType} chart data: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn(`[Chart] Warnings for ${chartType}:`, validation.warnings);
    }

    // Normalize branding colors
    const colors = normalizeBranding(branding);

    // Build Chart.js configuration with dynamic branding colors
    const chartConfig: ChartConfiguration = {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!caption,
            text: caption || '',
            font: {
              size: 28, // LARGER for document visibility
              weight: 'bold',
              family: colors.fontFamily,
            },
            color: colors.primaryColor,
            padding: {
              bottom: 25,
            },
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: {
                family: colors.fontFamily,
                size: 18, // LARGER for document visibility
                weight: 'bold',
              },
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            titleFont: {
              family: colors.fontFamily,
              size: 18,
              weight: 'bold',
            },
            bodyFont: {
              family: colors.fontFamily,
              size: 16,
            },
            padding: 14,
            cornerRadius: 6,
          },
          // Add data labels plugin configuration for showing values on chart
          datalabels: {
            display: true,
            color: '#000000',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
        scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
          x: {
            ticks: {
              color: '#000000', // Pure black for visibility
              font: {
                family: colors.fontFamily,
                size: 16, // LARGER for document visibility
                weight: 'bold',
              },
            },
            grid: {
              color: colors.borderColor,
            },
            title: {
              display: true,
              color: '#000000',
              font: {
                family: colors.fontFamily,
                size: 18,
                weight: 'bold',
              },
            },
          },
          y: {
            ticks: {
              color: '#000000', // Pure black for visibility
              font: {
                family: colors.fontFamily,
                size: 16, // LARGER for document visibility
                weight: 'bold',
              },
            },
            grid: {
              color: colors.borderColor,
            },
            title: {
              display: true,
              color: '#000000',
              font: {
                family: colors.fontFamily,
                size: 18,
                weight: 'bold',
              },
            },
          },
        } : undefined,
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
          },
        },
      },
    };

    console.log(`[Chart] Creating ${chartType} chart with ${chartData.datasets?.length || 0} datasets`);

    return this.generateChartImage(chartConfig, options, branding);
  }

  /**
   * Generate multiple chart images in batch
   */
  async generateBatch(
    charts: Array<{
      type: string;
      data: any;
      caption?: string;
    }>,
    options: ChartImageOptions = {}
  ): Promise<Buffer[]> {
    const promises = charts.map((chart) =>
      this.generateFromChartData(
        chart.type as any,
        chart.data,
        chart.caption,
        options
      )
    );

    return Promise.all(promises);
  }
}

export const chartImageService = new ChartImageService();
