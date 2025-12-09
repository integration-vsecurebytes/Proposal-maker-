import React from 'react';
import { cn } from '@/lib/utils';
import { Info, CheckCircle, AlertTriangle, Lightbulb, AlertCircle, DollarSign, Target, Shield } from 'lucide-react';

export type CalloutType = 'info' | 'success' | 'warning' | 'tip' | 'note' | 'insight' | 'risk' | 'cost' | 'recommendation' | 'benefit';

interface CalloutRendererProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    borderColor: string;
    backgroundColor: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  info: {
    icon: Info,
    borderColor: 'border-l-blue-500',
    backgroundColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900',
  },
  success: {
    icon: CheckCircle,
    borderColor: 'border-l-green-500',
    backgroundColor: 'bg-green-50',
    iconColor: 'text-green-500',
    titleColor: 'text-green-900',
  },
  benefit: {
    icon: CheckCircle,
    borderColor: 'border-l-emerald-500',
    backgroundColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-900',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-yellow-500',
    backgroundColor: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-900',
  },
  risk: {
    icon: Shield,
    borderColor: 'border-l-red-500',
    backgroundColor: 'bg-red-50',
    iconColor: 'text-red-500',
    titleColor: 'text-red-900',
  },
  tip: {
    icon: Lightbulb,
    borderColor: 'border-l-purple-500',
    backgroundColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
    titleColor: 'text-purple-900',
  },
  insight: {
    icon: Lightbulb,
    borderColor: 'border-l-indigo-500',
    backgroundColor: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    titleColor: 'text-indigo-900',
  },
  cost: {
    icon: DollarSign,
    borderColor: 'border-l-green-600',
    backgroundColor: 'bg-green-50',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
  },
  recommendation: {
    icon: Target,
    borderColor: 'border-l-orange-500',
    backgroundColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
    titleColor: 'text-orange-900',
  },
  note: {
    icon: AlertCircle,
    borderColor: 'border-l-gray-500',
    backgroundColor: 'bg-gray-50',
    iconColor: 'text-gray-500',
    titleColor: 'text-gray-900',
  },
};

export function CalloutRenderer({
  type,
  title,
  children,
  className,
}: CalloutRendererProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  // Determine default title if not provided
  const defaultTitle = title || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div
      className={cn(
        'my-6 rounded-r-lg border-l-4 p-4',
        config.borderColor,
        config.backgroundColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1">
          <p className={cn('font-semibold text-sm mb-1', config.titleColor)}>
            {defaultTitle}
          </p>
          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse markdown callout blocks and render them
 * Format: > **💡 Key Insight:** Your callout text here
 */
export function parseAndRenderCallouts(content: string): React.ReactNode[] {
  const calloutRegex = />\s*\*\*([^:]+):\*\*\s*(.+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = calloutRegex.exec(content)) !== null) {
    // Add text before the callout
    if (match.index > lastIndex) {
      parts.push(
        <div
          key={`text-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: content.substring(lastIndex, match.index) }}
        />
      );
    }

    // Determine callout type from title and emojis
    const titleText = match[1].trim().toLowerCase();
    let type: CalloutType = 'note';

    if (titleText.includes('💡') || titleText.includes('insight')) {
      type = 'insight';
    } else if (titleText.includes('⚠️') || titleText.includes('risk alert') || titleText.includes('risk')) {
      type = 'risk';
    } else if (titleText.includes('✅') || titleText.includes('success factor') || titleText.includes('success')) {
      type = 'success';
    } else if (titleText.includes('💰') || titleText.includes('cost benefit') || titleText.includes('cost')) {
      type = 'cost';
    } else if (titleText.includes('🎯') || titleText.includes('recommendation')) {
      type = 'recommendation';
    } else if (titleText.includes('benefit')) {
      type = 'benefit';
    } else if (titleText.includes('warning') || titleText.includes('caution')) {
      type = 'warning';
    } else if (titleText.includes('tip')) {
      type = 'tip';
    } else if (titleText.includes('info')) {
      type = 'info';
    }

    // Add the callout
    parts.push(
      <CalloutRenderer key={`callout-${match.index}`} type={type} title={match[1].trim()}>
        {match[2].trim()}
      </CalloutRenderer>
    );

    lastIndex = calloutRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <div
        key={`text-${lastIndex}`}
        dangerouslySetInnerHTML={{ __html: content.substring(lastIndex) }}
      />
    );
  }

  return parts.length > 0 ? parts : [content];
}
