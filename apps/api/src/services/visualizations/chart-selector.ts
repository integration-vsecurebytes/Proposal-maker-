/**
 * Chart Selection Service
 * Intelligently recommends the best chart type based on data characteristics
 */

import type { ChartType } from '../../../../../web/src/components/preview/ChartRendererEnhanced';

export interface DataCharacteristics {
  dataPoints: number; // Number of data points
  hasCategories: boolean; // Categorical data
  hasTimeSeries: boolean; // Time-based data
  hasMultipleSeries: boolean; // Multiple datasets
  hasHierarchicalData: boolean; // Nested/hierarchical structure
  hasFlowData: boolean; // From→To relationships
  hasXYRelationship: boolean; // X-Y coordinate data
  hasSizeData: boolean; // Additional size dimension
  showsProgress: boolean; // Progress towards goal
  showsCumulativeChange: boolean; // Cumulative changes over time
  showsDistribution: boolean; // Data distribution
  showsCorrelation: boolean; // Relationship between variables
  dataRange: {
    min: number;
    max: number;
    spread: number; // max - min
  };
}

export interface ChartRecommendation {
  type: ChartType;
  confidence: number; // 0-100
  reasoning: string;
  alternatives?: Array<{
    type: ChartType;
    confidence: number;
    reasoning: string;
  }>;
  configuration?: any; // Recommended chart options
}

/**
 * Analyze data and recommend best chart type
 */
export function recommendChartType(
  data: any[],
  context?: {
    purpose?: 'comparison' | 'trend' | 'composition' | 'relationship' | 'distribution';
    emphasis?: 'accuracy' | 'trend' | 'parts' | 'correlation';
  }
): ChartRecommendation {
  const characteristics = analyzeDataCharacteristics(data);

  // Apply rule-based expert system
  const recommendations = applyChartRules(characteristics, context);

  // Sort by confidence
  recommendations.sort((a, b) => b.confidence - a.confidence);

  const [primary, ...alternatives] = recommendations;

  return {
    ...primary,
    alternatives: alternatives.slice(0, 3), // Top 3 alternatives
  };
}

/**
 * Analyze data characteristics
 */
function analyzeDataCharacteristics(data: any[]): DataCharacteristics {
  const dataPoints = data.length;

  // Check for time series
  const hasTimeSeries = data.some((d) =>
    Object.keys(d).some((key) => /date|time|period|month|year/i.test(key))
  );

  // Check for categories
  const hasCategories = data.some((d) =>
    Object.values(d).some((v) => typeof v === 'string')
  );

  // Check for multiple series (multiple numeric columns)
  const numericColumns = data.length > 0
    ? Object.keys(data[0]).filter((key) => typeof data[0][key] === 'number')
    : [];
  const hasMultipleSeries = numericColumns.length > 1;

  // Check for hierarchical data (nested objects)
  const hasHierarchicalData = data.some((d) =>
    Object.values(d).some((v) => typeof v === 'object' && v !== null)
  );

  // Check for flow data (from→to)
  const hasFlowData = data.some((d) => 'from' in d && 'to' in d && 'flow' in d);

  // Check for X-Y relationship
  const hasXYRelationship = data.some((d) => 'x' in d && 'y' in d);

  // Check for size data (bubble chart)
  const hasSizeData = data.some((d) => 'r' in d || 'size' in d);

  // Check for progress/target data
  const showsProgress = data.some((d) => 'target' in d || 'goal' in d);

  // Check for cumulative changes
  const showsCumulativeChange = data.some((d) => 'change' in d || 'delta' in d);

  // Calculate data range
  const numericValues = data.flatMap((d) =>
    Object.values(d).filter((v) => typeof v === 'number')
  ) as number[];

  const dataRange = {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    spread: Math.max(...numericValues) - Math.min(...numericValues),
  };

  return {
    dataPoints,
    hasCategories,
    hasTimeSeries,
    hasMultipleSeries,
    hasHierarchicalData,
    hasFlowData,
    hasXYRelationship,
    hasSizeData,
    showsProgress,
    showsCumulativeChange,
    showsDistribution: numericValues.length > 20,
    showsCorrelation: hasXYRelationship || (hasMultipleSeries && dataPoints > 10),
    dataRange,
  };
}

/**
 * Apply chart selection rules
 */
function applyChartRules(
  chars: DataCharacteristics,
  context?: {
    purpose?: 'comparison' | 'trend' | 'composition' | 'relationship' | 'distribution';
    emphasis?: 'accuracy' | 'trend' | 'parts' | 'correlation';
  }
): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = [];

  // Rule 1: Flow data → Sankey
  if (chars.hasFlowData) {
    recommendations.push({
      type: 'sankey',
      confidence: 95,
      reasoning: 'Data contains flow relationships (from→to), perfect for Sankey diagram to visualize flows between nodes.',
      configuration: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const item = context.dataset.data[context.dataIndex];
                return `${item.from} → ${item.to}: ${item.flow}`;
              },
            },
          },
        },
      },
    });
  }

  // Rule 2: Hierarchical data → Treemap
  if (chars.hasHierarchicalData) {
    recommendations.push({
      type: 'treemap',
      confidence: 90,
      reasoning: 'Hierarchical data structure detected, treemap shows nested relationships and relative sizes effectively.',
      configuration: {},
    });
  }

  // Rule 3: XY relationship with size → Bubble chart
  if (chars.hasXYRelationship && chars.hasSizeData) {
    recommendations.push({
      type: 'bubble',
      confidence: 92,
      reasoning: 'Three-dimensional data (X, Y, size) detected, bubble chart shows relationships across three variables.',
      configuration: {},
    });
  }

  // Rule 4: XY relationship → Scatter plot
  if (chars.hasXYRelationship && !chars.hasSizeData) {
    recommendations.push({
      type: 'scatter',
      confidence: 88,
      reasoning: 'X-Y coordinate data shows correlation or distribution patterns best with scatter plot.',
      configuration: {},
    });
  }

  // Rule 5: Progress towards target → Bullet chart
  if (chars.showsProgress) {
    recommendations.push({
      type: 'bullet',
      confidence: 87,
      reasoning: 'Progress tracking with targets detected, bullet chart compares actual vs target performance.',
      configuration: {
        indexAxis: 'y',
      },
    });
  }

  // Rule 6: Single percentage → Gauge
  if (chars.dataPoints === 1 && chars.dataRange.max <= 100) {
    recommendations.push({
      type: 'gauge',
      confidence: 90,
      reasoning: 'Single percentage value, gauge provides clear visual representation of progress or completion.',
      configuration: {
        circumference: 180,
        rotation: 270,
      },
    });
  }

  // Rule 7: Cumulative changes → Waterfall
  if (chars.showsCumulativeChange) {
    recommendations.push({
      type: 'waterfall',
      confidence: 85,
      reasoning: 'Cumulative changes detected, waterfall chart shows how values accumulate or decrease step by step.',
      configuration: {},
    });
  }

  // Rule 8: Matrix/heatmap data
  if (chars.hasCategories && chars.hasMultipleSeries && chars.dataPoints > 10) {
    recommendations.push({
      type: 'matrix',
      confidence: 82,
      reasoning: 'Multi-dimensional categorical data, matrix (heatmap) reveals patterns and correlations.',
      configuration: {},
    });
  }

  // Rule 9: Time series trend → Line chart
  if (chars.hasTimeSeries && context?.purpose === 'trend') {
    recommendations.push({
      type: 'line',
      confidence: 90,
      reasoning: 'Time series data with trend emphasis, line chart shows changes over time clearly.',
      configuration: {
        elements: {
          line: {
            tension: 0.4, // Smooth curves
          },
        },
      },
    });
  }

  // Rule 10: Categorical comparison → Bar chart
  if (chars.hasCategories && context?.purpose === 'comparison') {
    recommendations.push({
      type: 'bar',
      confidence: 85,
      reasoning: 'Categorical data for comparison, bar chart makes differences easy to see.',
      configuration: {},
    });
  }

  // Rule 11: Part-to-whole composition → Pie/Doughnut
  if (chars.dataPoints <= 7 && context?.purpose === 'composition') {
    recommendations.push({
      type: 'doughnut',
      confidence: 80,
      reasoning: 'Few categories showing parts of a whole, doughnut chart shows proportional relationships.',
      configuration: {
        cutout: '60%',
      },
    });

    recommendations.push({
      type: 'pie',
      confidence: 75,
      reasoning: 'Alternative to doughnut for showing parts of a whole.',
      configuration: {},
    });
  }

  // Rule 12: Many categories → Radar or PolarArea
  if (chars.hasCategories && chars.dataPoints >= 5 && chars.dataPoints <= 10 && chars.hasMultipleSeries) {
    recommendations.push({
      type: 'radar',
      confidence: 70,
      reasoning: 'Multiple series across several categories, radar chart compares profiles.',
      configuration: {},
    });
  }

  // Rule 13: Fallback to bar chart (most versatile)
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'bar',
      confidence: 60,
      reasoning: 'General-purpose visualization, bar chart works well for most data types.',
      configuration: {},
    });
  }

  return recommendations;
}

/**
 * Get chart description for AI prompt generation
 */
export function getChartDescription(type: ChartType): string {
  const descriptions: Record<ChartType, string> = {
    bar: 'Bar chart comparing values across categories',
    line: 'Line chart showing trends over time',
    pie: 'Pie chart displaying proportions of a whole',
    doughnut: 'Doughnut chart showing composition with central space',
    radar: 'Radar chart comparing multiple variables across categories',
    polarArea: 'Polar area chart emphasizing magnitude differences',
    matrix: 'Heatmap matrix showing correlations or intensity across two dimensions',
    sankey: 'Sankey diagram illustrating flows between nodes',
    treemap: 'Treemap showing hierarchical data with nested rectangles',
    bullet: 'Bullet chart comparing actual vs target performance',
    gauge: 'Gauge displaying a single percentage or progress metric',
    waterfall: 'Waterfall chart showing cumulative effect of sequential changes',
    scatter: 'Scatter plot revealing relationships between two variables',
    bubble: 'Bubble chart showing three dimensions of data (X, Y, size)',
  };

  return descriptions[type] || 'Chart visualization';
}

/**
 * Get chart use cases
 */
export function getChartUseCases(type: ChartType): string[] {
  const useCases: Record<ChartType, string[]> = {
    bar: ['Sales comparison', 'Market share', 'Survey results', 'Year-over-year comparison'],
    line: ['Revenue trends', 'User growth', 'Stock prices', 'Temperature changes'],
    pie: ['Budget allocation', 'Market segments', 'Vote distribution', 'Resource usage'],
    doughnut: ['Portfolio composition', 'Traffic sources', 'Project status', 'Category breakdown'],
    radar: ['Product comparison', 'Skill assessment', 'Feature analysis', 'Performance metrics'],
    polarArea: ['Seasonal patterns', 'Resource allocation', 'Risk assessment'],
    matrix: ['Correlation analysis', 'Engagement heatmap', 'Activity patterns', 'Geographic data'],
    sankey: ['Energy flows', 'User journeys', 'Budget allocation flow', 'Supply chain'],
    treemap: ['File system usage', 'Portfolio hierarchy', 'Organization structure', 'Market map'],
    bullet: ['KPI tracking', 'Goal progress', 'Performance vs target', 'Quarterly metrics'],
    gauge: ['Progress percentage', 'Completion rate', 'Score', 'Satisfaction level'],
    waterfall: ['Financial analysis', 'Inventory changes', 'Profit breakdown', 'Value bridge'],
    scatter: ['Customer segmentation', 'Price vs quality', 'Risk vs return', 'Correlation study'],
    bubble: ['Market positioning', 'Portfolio analysis', 'Risk-reward-size', 'Multi-factor comparison'],
  };

  return useCases[type] || [];
}

/**
 * Validate if data is suitable for chart type
 */
export function validateDataForChartType(data: any[], chartType: ChartType): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const chars = analyzeDataCharacteristics(data);

  // Type-specific validation
  switch (chartType) {
    case 'sankey':
      if (!chars.hasFlowData) {
        issues.push('Sankey requires flow data with from, to, and flow properties');
        suggestions.push('Add from, to, and flow fields to your data');
      }
      break;

    case 'treemap':
      if (!chars.hasHierarchicalData) {
        issues.push('Treemap requires hierarchical/nested data structure');
        suggestions.push('Organize data with parent-child relationships');
      }
      break;

    case 'bubble':
      if (!chars.hasXYRelationship || !chars.hasSizeData) {
        issues.push('Bubble chart requires x, y, and r (size) properties');
        suggestions.push('Add x, y, and r fields to represent three dimensions');
      }
      break;

    case 'scatter':
      if (!chars.hasXYRelationship) {
        issues.push('Scatter plot requires x and y coordinate properties');
        suggestions.push('Add x and y fields to show relationships');
      }
      break;

    case 'gauge':
      if (chars.dataPoints > 1) {
        issues.push('Gauge works best with single percentage value');
        suggestions.push('Use one data point representing 0-100%');
      }
      break;

    case 'matrix':
      if (chars.dataPoints < 4) {
        issues.push('Heatmap matrix needs sufficient data points to show patterns');
        suggestions.push('Provide at least 4x4 grid of values');
      }
      break;
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}
