/**
 * ComparisonMatrix Component
 * Feature comparison table with sticky headers and visual indicators
 */

import { motion } from 'framer-motion';
import { Check, X, Minus, Info, Star, Sparkles } from 'lucide-react';

export interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
  highlighted?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}

export interface ComparisonRow {
  id: string;
  feature: string;
  description?: string;
  category?: string;
  importance?: 'low' | 'medium' | 'high';
  values: Array<boolean | string | number | React.ReactNode>;
}

export interface ComparisonMatrixProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  showCategories?: boolean;
  highlightBest?: boolean;
  animated?: boolean;
  className?: string;
}

export default function ComparisonMatrix({
  columns,
  rows,
  stickyHeader = true,
  stickyFirstColumn = true,
  showCategories = true,
  highlightBest = true,
  animated = true,
  className = '',
}: ComparisonMatrixProps) {
  // Group rows by category if categories are shown
  const groupedRows = showCategories
    ? groupByCategory(rows)
    : [{ category: null, rows }];

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
        {/* Table Header */}
        <thead className={stickyHeader ? 'sticky top-0 z-20' : ''}>
          <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            {/* Feature Column Header */}
            <th
              className={`p-4 text-left font-semibold ${
                stickyFirstColumn ? 'sticky left-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-600' : ''
              }`}
            >
              Features
            </th>

            {/* Product/Option Column Headers */}
            {columns.map((column, index) => (
              <th
                key={column.id}
                className={`p-4 text-center font-semibold min-w-[150px] ${
                  column.highlighted ? 'bg-yellow-500 text-gray-900' : ''
                }`}
              >
                <motion.div
                  initial={animated ? { opacity: 0, y: -10 } : {}}
                  animate={animated ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center gap-2"
                >
                  {column.icon && <div className="w-8 h-8">{column.icon}</div>}
                  <div>
                    <div className="font-bold">{column.title}</div>
                    {column.subtitle && (
                      <div className="text-sm opacity-90 font-normal">{column.subtitle}</div>
                    )}
                  </div>
                  {column.badge && (
                    <span className="px-2 py-1 text-xs font-medium bg-white/20 rounded-full">
                      {column.badge}
                    </span>
                  )}
                  {column.highlighted && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-4 h-4 fill-current" />
                      <span>Recommended</span>
                    </div>
                  )}
                </motion.div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {groupedRows.map((group, groupIndex) => (
            <React.Fragment key={group.category || 'default'}>
              {/* Category Header */}
              {group.category && (
                <tr className="bg-gray-100">
                  <td
                    colSpan={columns.length + 1}
                    className="p-3 font-semibold text-gray-700 text-sm uppercase tracking-wide"
                  >
                    {group.category}
                  </td>
                </tr>
              )}

              {/* Feature Rows */}
              {group.rows.map((row, rowIndex) => (
                <motion.tr
                  key={row.id}
                  initial={animated ? { opacity: 0 } : {}}
                  animate={animated ? { opacity: 1 } : {}}
                  transition={{ delay: (groupIndex * 10 + rowIndex) * 0.02 }}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {/* Feature Name Column */}
                  <td
                    className={`p-4 ${
                      stickyFirstColumn ? 'sticky left-0 z-10 bg-white' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {row.importance && (
                        <div className="flex-shrink-0 mt-1">
                          {getImportanceIndicator(row.importance)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{row.feature}</div>
                        {row.description && (
                          <div className="text-sm text-gray-600 mt-1">{row.description}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Value Cells */}
                  {row.values.map((value, colIndex) => {
                    const column = columns[colIndex];
                    const isHighlighted = highlightBest && column.highlighted;

                    return (
                      <td
                        key={colIndex}
                        className={`p-4 text-center ${
                          isHighlighted ? 'bg-yellow-50' : ''
                        }`}
                      >
                        {renderCellValue(value)}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Render cell value based on type
 */
function renderCellValue(value: boolean | string | number | React.ReactNode): React.ReactNode {
  // Boolean: Check/X icons
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-6 h-6 text-green-600 mx-auto" />
    ) : (
      <X className="w-6 h-6 text-red-600 mx-auto" />
    );
  }

  // String or Number
  if (typeof value === 'string' || typeof value === 'number') {
    // Check for special values
    if (value === 'N/A' || value === '-') {
      return <Minus className="w-6 h-6 text-gray-400 mx-auto" />;
    }

    // Check for checkmark strings
    if (value === '✓' || value === 'Yes' || value === 'yes') {
      return <Check className="w-6 h-6 text-green-600 mx-auto" />;
    }

    // Check for X strings
    if (value === '✗' || value === 'No' || value === 'no') {
      return <X className="w-6 h-6 text-red-600 mx-auto" />;
    }

    // Regular text/number
    return <span className="font-medium text-gray-900">{value}</span>;
  }

  // React node
  return value;
}

/**
 * Get importance indicator
 */
function getImportanceIndicator(importance: 'low' | 'medium' | 'high'): React.ReactNode {
  switch (importance) {
    case 'high':
      return <Sparkles className="w-4 h-4 text-red-500" />;
    case 'medium':
      return <Info className="w-4 h-4 text-yellow-500" />;
    case 'low':
      return <Info className="w-4 h-4 text-gray-400" />;
  }
}

/**
 * Group rows by category
 */
function groupByCategory(rows: ComparisonRow[]): Array<{ category: string | null; rows: ComparisonRow[] }> {
  const groups: Record<string, ComparisonRow[]> = {};

  rows.forEach((row) => {
    const category = row.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(row);
  });

  return Object.entries(groups).map(([category, rows]) => ({
    category,
    rows,
  }));
}

/**
 * Helper to create comparison data
 */
export function createComparisonData(
  products: string[],
  features: Array<{
    name: string;
    description?: string;
    category?: string;
    values: Array<boolean | string | number>;
  }>
): { columns: ComparisonColumn[]; rows: ComparisonRow[] } {
  const columns = products.map((product, index) => ({
    id: `product-${index}`,
    title: product,
    highlighted: index === 0, // Highlight first by default
  }));

  const rows = features.map((feature, index) => ({
    id: `feature-${index}`,
    feature: feature.name,
    description: feature.description,
    category: feature.category,
    values: feature.values,
  }));

  return { columns, rows };
}

/**
 * Preset comparison styles
 */
export function PricingComparisonMatrix(props: Omit<ComparisonMatrixProps, 'className'>) {
  return (
    <ComparisonMatrix
      {...props}
      className="border-2 border-blue-200 rounded-lg"
    />
  );
}

export function FeatureComparisonMatrix(props: Omit<ComparisonMatrixProps, 'className'>) {
  return (
    <ComparisonMatrix
      {...props}
      className="shadow-xl"
      highlightBest={true}
    />
  );
}

export function ProductComparisonMatrix(props: Omit<ComparisonMatrixProps, 'className'>) {
  return (
    <ComparisonMatrix
      {...props}
      className="border border-gray-300 rounded-xl"
      showCategories={true}
    />
  );
}
