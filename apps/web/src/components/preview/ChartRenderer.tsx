import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

interface ChartRendererProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
  data: any;
  options?: any;
  height?: number;
  className?: string;
}

export function ChartRenderer({
  type,
  data,
  options = {},
  height = 400,
  className = '',
}: ChartRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
    };

    chartRef.current = new ChartJS(ctx, {
      type,
      data,
      options: { ...defaultOptions, ...options },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div className={'chart-container ' + className} style={{ height: height + 'px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export function createChartData(labels: string[], datasets: any[]) {
  return {
    labels,
    datasets,
  };
}
