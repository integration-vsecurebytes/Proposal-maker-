import { Chart, ChartConfiguration } from 'chart.js/auto';
import { createCanvas } from 'canvas';

export interface ChartImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export class ChartImageService {
  /**
   * Generate a PNG image from Chart.js configuration
   */
  async generateChartImage(
    chartConfig: ChartConfiguration,
    options: ChartImageOptions = {}
  ): Promise<Buffer> {
    const {
      width = 800,
      height = 500,
      backgroundColor = '#ffffff',
    } = options;

    try {
      // Create a canvas
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d') as any;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Create the chart
      new Chart(ctx, chartConfig);

      // Return as PNG buffer
      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('Error generating chart image:', error);
      throw new Error('Failed to generate chart image');
    }
  }

  /**
   * Generate chart image from simplified chart data
   */
  async generateFromChartData(
    chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea',
    chartData: any,
    caption?: string,
    options: ChartImageOptions = {}
  ): Promise<Buffer> {
    // Build Chart.js configuration
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
              size: 16,
              weight: 'bold',
            },
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    };

    return this.generateChartImage(chartConfig, options);
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
