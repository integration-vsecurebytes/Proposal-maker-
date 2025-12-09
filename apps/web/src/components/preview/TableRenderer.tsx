import React from 'react';
import { cn } from '@/lib/utils';

interface TableRendererProps {
  headers: string[];
  rows: Array<Array<string | number>>;
  caption?: string;
  styling?: {
    headerBg?: string;
    headerText?: string;
    alternatingRows?: boolean;
    borders?: boolean;
  };
  className?: string;
}

export function TableRenderer({
  headers,
  rows,
  caption,
  styling = {},
  className,
}: TableRendererProps) {
  const {
    headerBg = 'var(--primary-color, #3b82f6)',
    headerText = '#ffffff',
    alternatingRows = true,
    borders = true,
  } = styling;

  return (
    <div className={cn('my-6 overflow-x-auto', className)}>
      {caption && (
        <p className="text-sm font-medium text-gray-700 mb-2">{caption}</p>
      )}
      <table
        className={cn(
          'min-w-full divide-y divide-gray-200',
          borders && 'border border-gray-300'
        )}
      >
        <thead>
          <tr style={{ backgroundColor: headerBg, color: headerText }}>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider',
                  borders && 'border-r border-gray-300 last:border-r-0'
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIdx) => {
            // Check if this is a separator row
            const isSeparator = row.every(cell => cell === '---');

            if (isSeparator) {
              return (
                <tr key={rowIdx} className="bg-gray-100">
                  <td
                    colSpan={headers.length}
                    className="px-4 py-1 border-t-2 border-b-2 border-gray-300"
                  />
                </tr>
              );
            }

            // Check if this is a total/summary row
            const isTotalRow = String(row[0]).toUpperCase() === 'TOTAL';

            return (
              <tr
                key={rowIdx}
                className={cn(
                  alternatingRows && rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  isTotalRow && 'font-bold bg-gray-100 border-t-2 border-gray-400',
                  'hover:bg-gray-100 transition-colors'
                )}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={cn(
                      'px-4 py-3 text-sm text-gray-900 whitespace-normal',
                      borders && 'border-r border-gray-200 last:border-r-0'
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
