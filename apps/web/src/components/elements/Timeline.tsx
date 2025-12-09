/**
 * Timeline Component
 * Visual timeline for project milestones and schedules
 * Supports vertical and horizontal orientations
 */

import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending' | 'delayed';
  icon?: React.ReactNode;
  metadata?: {
    duration?: string;
    assignee?: string;
    tags?: string[];
  };
}

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  showIcons?: boolean;
  showDates?: boolean;
  showStatus?: boolean;
  animated?: boolean;
  className?: string;
}

export default function Timeline({
  items,
  orientation = 'vertical',
  showIcons = true,
  showDates = true,
  showStatus = true,
  animated = true,
  className = '',
}: TimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <HorizontalTimeline
        items={items}
        showIcons={showIcons}
        showDates={showDates}
        showStatus={showStatus}
        animated={animated}
        className={className}
      />
    );
  }

  return (
    <VerticalTimeline
      items={items}
      showIcons={showIcons}
      showDates={showDates}
      showStatus={showStatus}
      animated={animated}
      className={className}
    />
  );
}

/**
 * Vertical Timeline
 */
function VerticalTimeline({
  items,
  showIcons,
  showDates,
  showStatus,
  animated,
  className,
}: Omit<TimelineProps, 'orientation'>) {
  return (
    <div className={`relative ${className}`}>
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Timeline items */}
      <div className="space-y-8">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={animated ? { opacity: 0, x: -20 } : {}}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start gap-6 pl-16"
          >
            {/* Icon/Status Badge */}
            <div
              className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${getStatusColor(
                item.status
              )}`}
            >
              {showIcons && (item.icon || getStatusIcon(item.status))}
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  {showDates && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{item.date}</span>
                      {item.metadata?.duration && (
                        <>
                          <span className="text-gray-400">•</span>
                          <Clock className="w-4 h-4" />
                          <span>{item.metadata.duration}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {showStatus && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
              )}

              {/* Metadata */}
              {item.metadata && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.metadata.assignee && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      <span className="font-medium">Assigned:</span>
                      <span>{item.metadata.assignee}</span>
                    </div>
                  )}
                  {item.metadata.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Horizontal Timeline
 */
function HorizontalTimeline({
  items,
  showIcons,
  showDates,
  showStatus,
  animated,
  className,
}: Omit<TimelineProps, 'orientation'>) {
  return (
    <div className={`relative ${className}`}>
      {/* Horizontal line */}
      <div className="absolute top-16 left-0 right-0 h-0.5 bg-gray-200" />

      {/* Timeline items */}
      <div className="flex items-start gap-8 overflow-x-auto pb-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={animated ? { opacity: 0, y: 20 } : {}}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.1 }}
            className="relative flex flex-col items-center min-w-[250px]"
          >
            {/* Icon/Status Badge */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${getStatusColor(
                item.status
              )} z-10`}
            >
              {showIcons && (item.icon || getStatusIcon(item.status))}
            </div>

            {/* Connector Arrow */}
            {index < items.length - 1 && (
              <div className="absolute top-6 left-full w-8 -translate-x-1/2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            )}

            {/* Content Card */}
            <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 w-full hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="mb-2">
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                {showDates && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              {showStatus && (
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusBadgeColor(
                    item.status
                  )}`}
                >
                  {getStatusLabel(item.status)}
                </span>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-gray-600 text-xs line-clamp-3">{item.description}</p>
              )}

              {/* Duration */}
              {item.metadata?.duration && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{item.metadata.duration}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Utility Functions
 */
function getStatusIcon(status: TimelineItem['status']): React.ReactNode {
  const iconClass = 'w-5 h-5 text-white';

  switch (status) {
    case 'completed':
      return <CheckCircle2 className={iconClass} />;
    case 'in_progress':
      return <Clock className={iconClass} />;
    case 'pending':
      return <Circle className={iconClass} />;
    case 'delayed':
      return <AlertCircle className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
}

function getStatusColor(status: TimelineItem['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-gray-400';
    case 'delayed':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

function getStatusBadgeColor(status: TimelineItem['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'delayed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: TimelineItem['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending':
      return 'Pending';
    case 'delayed':
      return 'Delayed';
    default:
      return 'Unknown';
  }
}

/**
 * Example usage and helper to create timeline data
 */
export function createTimelineData(
  milestones: Array<{
    title: string;
    date: string;
    description?: string;
    duration?: string;
    completed?: boolean;
  }>
): TimelineItem[] {
  return milestones.map((milestone, index) => ({
    id: `milestone-${index}`,
    title: milestone.title,
    description: milestone.description,
    date: milestone.date,
    status: milestone.completed ? 'completed' : index === 0 ? 'in_progress' : 'pending',
    metadata: {
      duration: milestone.duration,
    },
  }));
}
