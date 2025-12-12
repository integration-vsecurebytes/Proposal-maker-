/**
 * Chart Data Validation
 * Validates chart data before rendering to prevent Chart.js failures
 */

export interface ChartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Validate pie/doughnut chart data
 */
export function validatePieChartData(config: any): ChartValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for labels
  if (!config.labels || config.labels.length === 0) {
    errors.push('Pie chart requires at least one label');
  }

  // Warn about too many segments
  if (config.labels && config.labels.length > 8) {
    warnings.push(`Too many segments (${config.labels.length}). Consider fewer than 8 for readability.`);
  }

  // Check for datasets
  if (!config.datasets || config.datasets.length === 0) {
    errors.push('Pie chart requires at least one dataset');
    return { isValid: false, errors, warnings };
  }

  const dataset = config.datasets[0];

  // Check for data array
  if (!dataset.data || !Array.isArray(dataset.data)) {
    errors.push('Dataset must have a data array');
    return { isValid: false, errors, warnings };
  }

  // Check data length matches labels length
  if (dataset.data.length !== config.labels.length) {
    errors.push(`Data length (${dataset.data.length}) must match labels length (${config.labels.length})`);
  }

  // Validate individual data values
  let hasNonZero = false;
  dataset.data.forEach((value: any, index: number) => {
    if (typeof value !== 'number') {
      errors.push(`Value at index ${index} is not a number: ${value}`);
    } else if (value < 0) {
      errors.push(`Pie chart cannot have negative values: ${value}`);
    } else if (value > 0) {
      hasNonZero = true;
    }
  });

  // Check for at least one non-zero value
  if (!hasNonZero) {
    errors.push('Pie chart must have at least one non-zero value');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate bar/line chart data
 */
export function validateBarLineChartData(config: any): ChartValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for labels
  if (!config.labels || config.labels.length === 0) {
    errors.push('Chart requires labels');
  }

  // Check for datasets
  if (!config.datasets || config.datasets.length === 0) {
    errors.push('Chart requires at least one dataset');
    return { isValid: false, errors, warnings };
  }

  // Validate each dataset
  config.datasets.forEach((dataset: any, datasetIndex: number) => {
    if (!dataset.data || !Array.isArray(dataset.data)) {
      errors.push(`Dataset ${datasetIndex} must have a data array`);
      return;
    }

    // Check data length matches labels
    if (config.labels && dataset.data.length !== config.labels.length) {
      warnings.push(`Dataset ${datasetIndex} data length (${dataset.data.length}) does not match labels length (${config.labels.length})`);
    }

    // Validate individual values
    dataset.data.forEach((value: any, valueIndex: number) => {
      if (typeof value !== 'number' && value !== null && value !== undefined) {
        warnings.push(`Dataset ${datasetIndex}, value at index ${valueIndex} is not a number: ${value}`);
      }
    });
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate radar/polar area chart data
 */
export function validateRadarChartData(config: any): ChartValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for labels
  if (!config.labels || config.labels.length === 0) {
    errors.push('Radar chart requires labels');
  }

  // Minimum 3 axes for radar chart
  if (config.labels && config.labels.length < 3) {
    errors.push(`Radar chart requires at least 3 axes, got ${config.labels.length}`);
  }

  // Check for datasets
  if (!config.datasets || config.datasets.length === 0) {
    errors.push('Radar chart requires at least one dataset');
    return { isValid: false, errors, warnings };
  }

  // Validate each dataset
  config.datasets.forEach((dataset: any, datasetIndex: number) => {
    if (!dataset.data || !Array.isArray(dataset.data)) {
      errors.push(`Dataset ${datasetIndex} must have a data array`);
      return;
    }

    // Check data length matches labels
    if (config.labels && dataset.data.length !== config.labels.length) {
      errors.push(`Dataset ${datasetIndex} data length (${dataset.data.length}) must match labels length (${config.labels.length})`);
    }

    // Validate individual values
    dataset.data.forEach((value: any, valueIndex: number) => {
      if (typeof value !== 'number') {
        errors.push(`Dataset ${datasetIndex}, value at index ${valueIndex} is not a number: ${value}`);
      } else if (value < 0) {
        warnings.push(`Radar chart typically uses non-negative values. Found negative at dataset ${datasetIndex}, index ${valueIndex}`);
      }
    });
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Main chart validation function
 */
export function validateChartData(chartType: string, chartData: any): ChartValidationResult {
  // Basic validation for any chart
  if (!chartData || typeof chartData !== 'object') {
    return {
      isValid: false,
      errors: ['Chart data must be an object'],
      warnings: [],
    };
  }

  // Type-specific validation
  if (chartType === 'pie' || chartType === 'doughnut') {
    return validatePieChartData(chartData);
  } else if (chartType === 'bar' || chartType === 'line') {
    return validateBarLineChartData(chartData);
  } else if (chartType === 'radar' || chartType === 'polarArea') {
    return validateRadarChartData(chartData);
  }

  // Default validation for unknown types
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!chartData.labels || chartData.labels.length === 0) {
    errors.push('Chart requires labels');
  }

  if (!chartData.datasets || chartData.datasets.length === 0) {
    errors.push('Chart requires at least one dataset');
  }

  return { isValid: errors.length === 0, errors, warnings };
}
