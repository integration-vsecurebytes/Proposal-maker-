/**
 * Callout Component
 * Attention-grabbing boxes for info, warnings, success messages, and tips
 */

import { motion } from 'framer-motion';
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
  Zap,
  Shield,
  TrendingUp,
  Target,
  Heart,
  Star,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export type CalloutType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'tip'
  | 'note'
  | 'important'
  | 'quote';

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  animated?: boolean;
  className?: string;
}

export default function Callout({
  type = 'info',
  title,
  children,
  icon,
  collapsible = false,
  defaultExpanded = true,
  animated = true,
  className = '',
}: CalloutProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const config = getCalloutConfig(type);
  const IconComponent = icon || config.icon;

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 10 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      className={`rounded-lg border-l-4 ${config.borderColor} ${config.backgroundColor} ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-start gap-3 p-4 ${
          collapsible ? 'cursor-pointer select-none' : ''
        }`}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {typeof IconComponent === 'function' ? (
            <IconComponent className="w-6 h-6" />
          ) : (
            IconComponent
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold mb-1 ${config.textColor}`}>
              {title}
            </h4>
          )}

          {/* Body (collapsible or always shown) */}
          {(!collapsible || isExpanded) && (
            <motion.div
              initial={collapsible && animated ? { height: 0, opacity: 0 } : {}}
              animate={
                collapsible && animated
                  ? { height: 'auto', opacity: 1 }
                  : {}
              }
              exit={collapsible && animated ? { height: 0, opacity: 0 } : {}}
              className={config.textColor}
            >
              <div className="text-sm leading-relaxed">{children}</div>
            </motion.div>
          )}
        </div>

        {/* Collapse Indicator */}
        {collapsible && (
          <div className={`flex-shrink-0 ${config.iconColor} transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Get callout configuration
 */
function getCalloutConfig(type: CalloutType): {
  icon: LucideIcon;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
} {
  const configs: Record<CalloutType, ReturnType<typeof getCalloutConfig>> = {
    info: {
      icon: Info,
      borderColor: 'border-blue-500',
      backgroundColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-600',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'border-yellow-500',
      backgroundColor: 'bg-yellow-50',
      textColor: 'text-yellow-900',
      iconColor: 'text-yellow-600',
    },
    success: {
      icon: CheckCircle2,
      borderColor: 'border-green-500',
      backgroundColor: 'bg-green-50',
      textColor: 'text-green-900',
      iconColor: 'text-green-600',
    },
    error: {
      icon: AlertCircle,
      borderColor: 'border-red-500',
      backgroundColor: 'bg-red-50',
      textColor: 'text-red-900',
      iconColor: 'text-red-600',
    },
    tip: {
      icon: Lightbulb,
      borderColor: 'border-purple-500',
      backgroundColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600',
    },
    note: {
      icon: Info,
      borderColor: 'border-gray-500',
      backgroundColor: 'bg-gray-50',
      textColor: 'text-gray-900',
      iconColor: 'text-gray-600',
    },
    important: {
      icon: Zap,
      borderColor: 'border-orange-500',
      backgroundColor: 'bg-orange-50',
      textColor: 'text-orange-900',
      iconColor: 'text-orange-600',
    },
    quote: {
      icon: Star,
      borderColor: 'border-indigo-500',
      backgroundColor: 'bg-indigo-50',
      textColor: 'text-indigo-900',
      iconColor: 'text-indigo-600',
    },
  };

  return configs[type];
}

/**
 * Preset Callout Components
 */
export function InfoCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="info" />;
}

export function WarningCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="warning" />;
}

export function SuccessCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="success" />;
}

export function ErrorCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="error" />;
}

export function TipCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="tip" />;
}

export function NoteCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="note" />;
}

export function ImportantCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="important" />;
}

export function QuoteCallout(props: Omit<CalloutProps, 'type'>) {
  return <Callout {...props} type="quote" />;
}

/**
 * Special Purpose Callouts
 */
export function SecurityCallout({ children, ...props }: Omit<CalloutProps, 'type' | 'icon'>) {
  return (
    <Callout {...props} type="info" icon={Shield}>
      {children}
    </Callout>
  );
}

export function PerformanceCallout({ children, ...props }: Omit<CalloutProps, 'type' | 'icon'>) {
  return (
    <Callout {...props} type="success" icon={TrendingUp}>
      {children}
    </Callout>
  );
}

export function GoalCallout({ children, ...props }: Omit<CalloutProps, 'type' | 'icon'>) {
  return (
    <Callout {...props} type="info" icon={Target}>
      {children}
    </Callout>
  );
}

export function RecommendationCallout({ children, ...props }: Omit<CalloutProps, 'type' | 'icon'>) {
  return (
    <Callout {...props} type="tip" icon={Sparkles}>
      {children}
    </Callout>
  );
}

export function TestimonialCallout({ children, ...props }: Omit<CalloutProps, 'type' | 'icon'>) {
  return (
    <Callout {...props} type="quote" icon={Heart}>
      {children}
    </Callout>
  );
}

/**
 * Callout Group for multiple related callouts
 */
export function CalloutGroup({
  children,
  gap = 4,
  className = '',
}: {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-${gap} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Inline Callout (smaller, inline with text)
 */
export function InlineCallout({
  type = 'info',
  children,
  icon,
}: {
  type?: CalloutType;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const config = getCalloutConfig(type);
  const IconComponent = icon || config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${config.backgroundColor} ${config.textColor}`}
    >
      {typeof IconComponent === 'function' ? (
        <IconComponent className="w-4 h-4" />
      ) : (
        IconComponent
      )}
      <span>{children}</span>
    </span>
  );
}
