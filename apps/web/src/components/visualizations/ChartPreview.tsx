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
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import type { ChartConfig } from '@proposal-gen/shared';

// Register Chart.js components
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
  Legend
);

interface ChartPreviewProps {
  config: ChartConfig;
  height?: number;
  className?: string;
}

export function ChartPreview({ config, height = 400, className = '' }: ChartPreviewProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy?.();
      }
    };
  }, []);

  const chartData = {
    labels: config.labels,
    datasets: config.datasets,
  };

  const chartOptions: ChartOptions<any> = {
    ...config.options,
    responsive: true,
    maintainAspectRatio: false,
  };

  // Render the appropriate chart type
  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'line':
        return <Line ref={chartRef} data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={chartOptions} />;
      case 'radar':
        return <Radar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'polarArea':
        return <PolarArea ref={chartRef} data={chartData} options={chartOptions} />;
      default:
        return <div className="text-muted-foreground">Unsupported chart type: {config.type}</div>;
    }
  };

  return (
    <div className={`chart-container ${className}`}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{config.title}</h3>
      )}
      <div style={{ height: `${height}px`, position: 'relative' }}>
        {renderChart()}
      </div>
    </div>
  );
}
