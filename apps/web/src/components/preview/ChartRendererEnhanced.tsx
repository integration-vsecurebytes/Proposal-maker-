/**
 * Enhanced ChartRenderer with 14 chart types total
 * Existing: bar, line, pie, doughnut, radar, polarArea (6)
 * New: heatmap, sankey, treemap, bullet, gauge, waterfall, scatter, bubble (8)
 */

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';

// Register all Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  MatrixController,
  MatrixElement,
  SankeyController,
  Flow,
  TreemapController,
  TreemapElement
);

// Custom Bullet Chart Plugin
const bulletChartPlugin = {
  id: 'bulletChart',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset: any, i: number) => {
      const meta = chart.getDatasetMeta(i);
      if (dataset.type === 'bullet') {
        meta.data.forEach((bar: any, index: number) => {
          const { x, y, base, width } = bar.getProps(['x', 'y', 'base', 'width'], true);
          const target = dataset.targets?.[index];

          if (target !== undefined) {
            // Draw target line
            ctx.save();
            ctx.strokeStyle = dataset.targetColor || '#000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x, y + 10);
            ctx.stroke();
            ctx.restore();
          }
        });
      }
    });
  },
};

// Custom Gauge Chart Plugin
const gaugeChartPlugin = {
  id: 'gaugeChart',
  afterDatasetsDraw(chart: any) {
    const { ctx, chartArea, data } = chart;
    if (data.datasets[0]?.gaugeValue !== undefined) {
      const value = data.datasets[0].gaugeValue;
      const max = data.datasets[0].gaugeMax || 100;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      // Draw value text
      ctx.save();
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value}%`, centerX, centerY);
      ctx.restore();
    }
  },
};

// Custom Waterfall Chart Plugin
const waterfallChartPlugin = {
  id: 'waterfallChart',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset: any, i: number) => {
      const meta = chart.getDatasetMeta(i);
      if (dataset.type === 'waterfall') {
        let cumulative = 0;
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          const { x, y, base, width } = bar.getProps(['x', 'y', 'base', 'width'], true);

          // Draw connector line to next bar
          if (index < meta.data.length - 1) {
            const nextBar = meta.data[index + 1];
            const nextProps = nextBar.getProps(['x', 'y'], true);

            ctx.save();
            ctx.strokeStyle = '#999';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y);
            ctx.lineTo(nextProps.x - width / 2, y);
            ctx.stroke();
            ctx.restore();
          }

          cumulative += value;
        });
      }
    });
  },
};

// Register custom plugins
ChartJS.register(bulletChartPlugin, gaugeChartPlugin, waterfallChartPlugin);

export type ChartType =
  // Existing types (6)
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'polarArea'
  // New types (8)
  | 'matrix'      // Heatmap
  | 'sankey'      // Flow diagram
  | 'treemap'     // Hierarchical data
  | 'bullet'      // KPI comparison
  | 'gauge'       // Percentage gauge
  | 'waterfall'   // Cumulative changes
  | 'scatter'     // XY scatter plot
  | 'bubble';     // Bubble chart

export interface ChartData {
  labels?: string[];
  datasets: any[];
  [key: string]: any;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: any;
  scales?: any;
  [key: string]: any;
}

interface ChartRendererEnhancedProps {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
  height?: number;
  width?: number;
  className?: string;
}

export default function ChartRendererEnhanced({
  type,
  data,
  options = {},
  height = 400,
  width,
  className = '',
}: ChartRendererEnhancedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Get chart configuration based on type
    const config = getChartConfig(type, data, options);

    // Create new chart
    try {
      chartRef.current = new ChartJS(ctx, config);
    } catch (error) {
      console.error('Failed to create chart:', error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div
      className={`chart-container ${className}`}
      style={{
        height: `${height}px`,
        width: width ? `${width}px` : '100%',
        position: 'relative',
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

/**
 * Get chart configuration based on type
 */
function getChartConfig(
  type: ChartType,
  data: ChartData,
  userOptions: ChartOptions
): any {
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !['gauge', 'bullet', 'matrix'].includes(type),
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  // Type-specific configurations
  const typeConfigs: Record<string, any> = {
    matrix: {
      type: 'matrix',
      options: {
        ...baseOptions,
        scales: {
          x: {
            type: 'category',
            ticks: { display: true },
            grid: { display: false },
          },
          y: {
            type: 'category',
            offset: true,
            ticks: { display: true },
            grid: { display: false },
          },
        },
        plugins: {
          ...baseOptions.plugins,
          legend: { display: true },
          tooltip: {
            callbacks: {
              title() {
                return '';
              },
              label(context: any) {
                const v = context.dataset.data[context.dataIndex];
                return ['x: ' + v.x, 'y: ' + v.y, 'value: ' + v.v];
              },
            },
          },
        },
      },
    },
    sankey: {
      type: 'sankey',
      options: {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            callbacks: {
              label(context: any) {
                const item = context.dataset.data[context.dataIndex];
                return `${item.from} → ${item.to}: ${item.flow}`;
              },
            },
          },
        },
      },
    },
    treemap: {
      type: 'treemap',
      options: {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: { display: false },
          tooltip: {
            callbacks: {
              title(context: any) {
                return context[0].dataset.tree[context[0].dataIndex].name;
              },
              label(context: any) {
                const item = context.dataset.tree[context.dataIndex];
                return `Value: ${item.value}`;
              },
            },
          },
        },
      },
    },
    bullet: {
      type: 'bar',
      options: {
        ...baseOptions,
        indexAxis: 'y' as const,
        plugins: {
          ...baseOptions.plugins,
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
          },
        },
      },
    },
    gauge: {
      type: 'doughnut',
      options: {
        ...baseOptions,
        circumference: 180,
        rotation: 270,
        cutout: '80%',
        plugins: {
          ...baseOptions.plugins,
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    },
    waterfall: {
      type: 'bar',
      options: {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    },
    scatter: {
      type: 'scatter',
      options: {
        ...baseOptions,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
          },
          y: {
            type: 'linear',
          },
        },
      },
    },
    bubble: {
      type: 'bubble',
      options: {
        ...baseOptions,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
          },
          y: {
            type: 'linear',
          },
        },
      },
    },
  };

  // Get type-specific config or use basic type
  const config = typeConfigs[type] || {
    type,
    options: baseOptions,
  };

  // Merge user options
  return {
    ...config,
    data,
    options: deepMerge(config.options || {}, userOptions),
  };
}

/**
 * Deep merge objects
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Helper functions to create chart data
 */
export function createMatrixData(
  xLabels: string[],
  yLabels: string[],
  values: number[][]
) {
  const data: any[] = [];

  yLabels.forEach((yLabel, yIndex) => {
    xLabels.forEach((xLabel, xIndex) => {
      data.push({
        x: xLabel,
        y: yLabel,
        v: values[yIndex][xIndex],
      });
    });
  });

  return {
    datasets: [
      {
        label: 'Matrix',
        data,
        backgroundColor(context: any) {
          const value = context.dataset.data[context.dataIndex].v;
          const max = Math.max(...context.dataset.data.map((d: any) => d.v));
          const alpha = value / max;
          return `rgba(59, 130, 246, ${alpha})`;
        },
        borderWidth: 1,
        borderColor: '#fff',
        width: ({ chart }: any) => (chart.chartArea || {}).width / xLabels.length,
        height: ({ chart }: any) => (chart.chartArea || {}).height / yLabels.length,
      },
    ],
  };
}

export function createSankeyData(
  flows: Array<{ from: string; to: string; flow: number }>
) {
  return {
    datasets: [
      {
        label: 'Flow',
        data: flows,
        colorFrom: (c: any) => getColorForNode(c.dataset.data[c.dataIndex].from),
        colorTo: (c: any) => getColorForNode(c.dataset.data[c.dataIndex].to),
        borderWidth: 1,
      },
    ],
  };
}

export function createTreemapData(
  tree: Array<{ name: string; value: number; color?: string }>
) {
  return {
    datasets: [
      {
        label: 'Treemap',
        tree,
        key: 'value',
        groups: ['name'],
        spacing: 1,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor(context: any) {
          const item = context.dataset.tree[context.dataIndex];
          return item.color || generateColor(context.dataIndex);
        },
      },
    ],
  };
}

export function createBulletData(
  categories: string[],
  values: number[],
  targets: number[],
  ranges?: Array<{ min: number; max: number; color: string }>
) {
  return {
    labels: categories,
    datasets: [
      {
        label: 'Actual',
        data: values,
        targets,
        targetColor: '#000',
        backgroundColor: '#3B82F6',
        type: 'bullet',
      },
    ],
  };
}

export function createGaugeData(value: number, max: number = 100) {
  const percentage = (value / max) * 100;
  const remaining = 100 - percentage;

  return {
    datasets: [
      {
        data: [percentage, remaining],
        backgroundColor: [
          getGaugeColor(percentage),
          '#E5E7EB',
        ],
        borderWidth: 0,
        gaugeValue: Math.round(percentage),
        gaugeMax: 100,
      },
    ],
  };
}

export function createWaterfallData(
  categories: string[],
  values: number[]
) {
  const cumulative = [0];
  values.forEach((v, i) => {
    cumulative.push(cumulative[i] + v);
  });

  return {
    labels: categories,
    datasets: [
      {
        label: 'Changes',
        data: values,
        backgroundColor: values.map((v) => (v >= 0 ? '#10B981' : '#EF4444')),
        type: 'waterfall',
      },
    ],
  };
}

export function createScatterData(
  dataPoints: Array<{ x: number; y: number }>,
  label: string = 'Dataset'
) {
  return {
    datasets: [
      {
        label,
        data: dataPoints,
        backgroundColor: '#3B82F6',
        borderColor: '#1E40AF',
        borderWidth: 1,
      },
    ],
  };
}

export function createBubbleData(
  dataPoints: Array<{ x: number; y: number; r: number }>,
  label: string = 'Dataset'
) {
  return {
    datasets: [
      {
        label,
        data: dataPoints,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#1E40AF',
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Utility functions
 */
function getColorForNode(node: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  ];
  const hash = node.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function generateColor(index: number): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#14B8A6', '#6366F1', '#F43F5E',
  ];
  return colors[index % colors.length];
}

function getGaugeColor(percentage: number): string {
  if (percentage >= 80) return '#10B981'; // Green
  if (percentage >= 60) return '#84CC16'; // Lime
  if (percentage >= 40) return '#F59E0B'; // Orange
  if (percentage >= 20) return '#F97316'; // Deep orange
  return '#EF4444'; // Red
}
