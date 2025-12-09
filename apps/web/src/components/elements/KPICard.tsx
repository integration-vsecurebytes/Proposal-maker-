/**
 * KPICard Component
 * Display key performance indicators with trends, sparklines, and visual indicators
 */

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  Users,
  ShoppingCart,
  Activity,
  BarChart3,
  Zap,
  LucideIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale);

export interface KPICardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number; // Percentage change
    label?: string; // e.g., "vs last month"
    direction?: 'up' | 'down' | 'neutral';
  };
  sparklineData?: number[]; // Historical data for sparkline
  target?: {
    value: number;
    label?: string;
  };
  icon?: LucideIcon;
  iconColor?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export default function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  sparklineData,
  target,
  icon: Icon,
  iconColor,
  status,
  size = 'md',
  animated = true,
  className = '',
}: KPICardProps) {
  const sparklineRef = useRef<HTMLCanvasElement>(null);

  // Determine status color
  const statusColor = status
    ? getStatusColor(status)
    : trend
    ? getTrendColor(trend.direction || (trend.value >= 0 ? 'up' : 'down'))
    : 'bg-gray-100 text-gray-700';

  // Determine icon color
  const iconColorClass = iconColor || (status ? getIconColor(status) : 'text-blue-600');

  // Size classes
  const sizeClasses = {
    sm: {
      card: 'p-4',
      title: 'text-sm',
      value: 'text-2xl',
      icon: 'w-8 h-8',
    },
    md: {
      card: 'p-6',
      title: 'text-base',
      value: 'text-3xl',
      icon: 'w-10 h-10',
    },
    lg: {
      card: 'p-8',
      title: 'text-lg',
      value: 'text-4xl',
      icon: 'w-12 h-12',
    },
  };

  const classes = sizeClasses[size];

  // Render sparkline
  useEffect(() => {
    if (!sparklineData || !sparklineRef.current) return;

    const ctx = sparklineRef.current.getContext('2d');
    if (!ctx) return;

    const sparklineChart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: sparklineData.map((_, i) => i.toString()),
        datasets: [
          {
            data: sparklineData,
            borderColor: getTrendSparklineColor(trend?.direction),
            backgroundColor: getTrendSparklineColor(trend?.direction, 0.1),
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });

    return () => {
      sparklineChart.destroy();
    };
  }, [sparklineData, trend]);

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.95 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      whileHover={animated ? { scale: 1.02 } : {}}
      className={`bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all ${classes.card} ${className}`}
    >
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`font-medium text-gray-600 ${classes.title}`}>{title}</h3>
        </div>
        {Icon && (
          <div className={`${iconColorClass} ${classes.icon} flex-shrink-0`}>
            <Icon className="w-full h-full" />
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-4">
        <div className={`font-bold text-gray-900 ${classes.value} flex items-baseline gap-1`}>
          {prefix && <span className="text-lg opacity-70">{prefix}</span>}
          <CountUpNumber value={typeof value === 'number' ? value : 0} animated={animated}>
            {typeof value === 'string' ? value : null}
          </CountUpNumber>
          {suffix && <span className="text-lg opacity-70">{suffix}</span>}
        </div>
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className={`flex items-center gap-2 mb-3`}>
          <span
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getTrendBadgeColor(
              trend.direction || (trend.value >= 0 ? 'up' : 'down')
            )}`}
          >
            {getTrendIcon(trend.direction || (trend.value >= 0 ? 'up' : 'down'))}
            <span>{Math.abs(trend.value)}%</span>
          </span>
          {trend.label && <span className="text-sm text-gray-500">{trend.label}</span>}
        </div>
      )}

      {/* Sparkline Chart */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mb-3" style={{ height: '50px' }}>
          <canvas ref={sparklineRef} />
        </div>
      )}

      {/* Target Progress */}
      {target && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-1">
              <Target className="w-4 h-4" />
              {target.label || 'Target'}
            </span>
            <span className="font-medium text-gray-900">{target.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={animated ? { width: 0 } : {}}
              animate={animated ? { width: `${calculateProgress(value, target.value)}%` } : {}}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${getProgressColor(
                calculateProgress(value, target.value)
              )}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * CountUp Animation Component
 */
function CountUpNumber({
  value,
  animated,
  children,
}: {
  value: number;
  animated: boolean;
  children?: React.ReactNode;
}) {
  const [displayValue, setDisplayValue] = React.useState(animated ? 0 : value);

  React.useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // ms
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  if (children) return <>{children}</>;

  return <>{displayValue.toLocaleString()}</>;
}

/**
 * Utility Functions
 */
function getTrendIcon(direction: 'up' | 'down' | 'neutral') {
  const iconClass = 'w-4 h-4';
  switch (direction) {
    case 'up':
      return <TrendingUp className={iconClass} />;
    case 'down':
      return <TrendingDown className={iconClass} />;
    case 'neutral':
      return <Minus className={iconClass} />;
  }
}

function getTrendColor(direction: 'up' | 'down' | 'neutral'): string {
  switch (direction) {
    case 'up':
      return 'bg-green-100 text-green-800';
    case 'down':
      return 'bg-red-100 text-red-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-800';
  }
}

function getTrendBadgeColor(direction: 'up' | 'down' | 'neutral'): string {
  switch (direction) {
    case 'up':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'down':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'neutral':
      return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
}

function getTrendSparklineColor(direction?: 'up' | 'down' | 'neutral', alpha: number = 1): string {
  switch (direction) {
    case 'up':
      return `rgba(34, 197, 94, ${alpha})`;
    case 'down':
      return `rgba(239, 68, 68, ${alpha})`;
    default:
      return `rgba(59, 130, 246, ${alpha})`;
  }
}

function getStatusColor(status: 'success' | 'warning' | 'danger' | 'neutral'): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'danger':
      return 'bg-red-100 text-red-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-800';
  }
}

function getIconColor(status: 'success' | 'warning' | 'danger' | 'neutral'): string {
  switch (status) {
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'danger':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-600';
  }
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function calculateProgress(current: string | number, target: number): number {
  const currentNum = typeof current === 'string' ? parseFloat(current.replace(/[^0-9.]/g, '')) : current;
  return Math.min((currentNum / target) * 100, 100);
}

/**
 * Preset KPI Card Components
 */
export function RevenueKPICard(props: Omit<KPICardProps, 'icon'>) {
  return <KPICard {...props} icon={DollarSign} iconColor="text-green-600" />;
}

export function UsersKPICard(props: Omit<KPICardProps, 'icon'>) {
  return <KPICard {...props} icon={Users} iconColor="text-blue-600" />;
}

export function SalesKPICard(props: Omit<KPICardProps, 'icon'>) {
  return <KPICard {...props} icon={ShoppingCart} iconColor="text-purple-600" />;
}

export function ActivityKPICard(props: Omit<KPICardProps, 'icon'>) {
  return <KPICard {...props} icon={Activity} iconColor="text-indigo-600" />;
}

export function MetricsKPICard(props: Omit<KPICardProps, 'icon'>) {
  return <KPICard {...props} icon={BarChart3} iconColor="text-teal-600" />;
}

export function PerformanceKPICard(props: Omit<KPICardProps, 'icon'>) {
  return <KPICard {...props} icon={Zap} iconColor="text-yellow-600" />;
}

/**
 * KPI Grid Layout Helper
 */
export function KPIGrid({
  children,
  columns = 3,
  gap = 6,
  className = '',
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}
