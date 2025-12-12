import { useState, useMemo, useEffect } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { MermaidRenderer } from './MermaidRenderer';
import { ChartRenderer, createChartData } from './ChartRenderer';
import { TableRenderer } from './TableRenderer';
import { CalloutRenderer, parseAndRenderCallouts } from './CalloutRenderer';
import AssetDropZone from '../editor/AssetDropZone';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { fixAssetUrl } from '../../lib/api';
import '../../styles/proposal-preview.css';

interface ProposalSection {
  id: string;
  type: string;
  title: string;
  content?: string;
  data?: any;
  order: number;
}

interface ProposalData {
  id: string;
  title: string;
  clientName?: string;
  clientCompany?: string;
  companyName?: string;
  date?: string;
  sections: ProposalSection[];
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    companyLogo?: string;
    clientLogo?: string;
  };
  extractedData?: Record<string, any>;
}

export type PreviewMode = 'view' | 'edit';

interface ProposalPreviewProps {
  proposal: ProposalData;
  className?: string;
  mode?: PreviewMode;
}

export function ProposalPreview({ proposal, className = '', mode = 'view' }: ProposalPreviewProps) {
  const {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isA4Layout, setIsA4Layout] = useState(true); // Enable A4 layout by default for proper PDF export

  // Sort sections by order
  const sortedSections = useMemo(() => {
    // Ensure sections is an array
    const sections = Array.isArray(proposal.sections)
      ? proposal.sections
      : (proposal.sections ? Object.values(proposal.sections) : []);

    return [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [proposal.sections]);

  // Keyboard navigation for tabs (arrow keys)
  useEffect(() => {
    if (isA4Layout) return; // Only enable keyboard nav in tab mode

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveTabIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveTabIndex((prev) => Math.min(sortedSections.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isA4Layout, sortedSections.length]);

  // Tab-based navigation - each section is a tab
  // In A4 layout mode, show all sections (AI adds page breaks in content)
  // In tab mode, show only the active section
  const displayedSections = useMemo(() => {
    // Show all sections in A4 layout (page breaks are in content)
    if (isA4Layout) {
      return sortedSections;
    }
    // Show only active tab section
    return sortedSections[activeTabIndex] ? [sortedSections[activeTabIndex]] : [];
  }, [sortedSections, activeTabIndex, isA4Layout]);

  // Replace placeholders in content
  const replacePlaceholders = (text: string): string => {
    if (!text) return '';

    const placeholders = {
      '{{client.name}}': proposal.clientName || '',
      '{{client.company}}': proposal.clientCompany || '',
      '{{company.name}}': proposal.companyName || proposal.extractedData?.companyName || '',
      '{{date}}': proposal.date || new Date().toLocaleDateString(),
      '{{project.name}}': proposal.extractedData?.projectName || '',
      '{{project.description}}': proposal.extractedData?.projectDescription || '',
      '{{budget}}': proposal.extractedData?.budget || '',
      '{{timeline}}': proposal.extractedData?.timeline || '',
    };

    let result = text;
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  };

  // Apply branding styles from template
  const brandingStyles = useMemo(() => {
    const branding = proposal.branding || {};
    return {
      '--primary-color': branding.primaryColor,
      '--secondary-color': branding.secondaryColor,
      '--accent-color': branding.accentColor,
      '--success-color': branding.successColor,
      '--warning-color': branding.warningColor,
      '--font-family': branding.fontFamily,
      '--heading-font': branding.headingFont,
    } as React.CSSProperties;
  }, [proposal.branding]);

  // Render section based on type
  const renderSection = (section: ProposalSection) => {
    switch (section.type) {
      case 'cover_page':
        return renderCoverPage(section);
      case 'table_of_contents':
        return renderTableOfContents();
      case 'thank_you':
        return renderThankYouSlide();
      case 'back_cover':
        return renderBackCover();
      case 'executive_summary':
      case 'introduction':
      case 'methodology':
      case 'deliverables':
      case 'timeline':
      case 'pricing':
      case 'terms':
      case 'conclusion':
        return renderTextSection(section);
      case 'chart':
        return renderChart(section);
      case 'diagram':
        return renderDiagram(section);
      case 'table':
        return renderTable(section);
      default:
        return renderTextSection(section);
    }
  };

  const renderCoverPage = (section: ProposalSection) => {
    // Check if AI cover design is available
    const aiCoverDesign = proposal.branding?.coverBackground;

    // Generate background style from AI design or use default
    const getBackgroundStyle = () => {
      if (!aiCoverDesign) {
        return {
          background: `linear-gradient(135deg, ${proposal.branding?.primaryColor}15 0%, ${proposal.branding?.secondaryColor}10 50%, ${proposal.branding?.accentColor}15 100%)`
        };
      }

      // Use AI-generated background
      if (aiCoverDesign.type === 'solid') {
        return {
          backgroundColor: proposal.branding?.backgroundColor || '#FFFFFF',
          opacity: aiCoverDesign.opacity || 1
        };
      }

      if (aiCoverDesign.type === 'gradient' && aiCoverDesign.gradient) {
        const { type, colors, angle } = aiCoverDesign.gradient;
        if (type === 'linear') {
          return {
            background: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
            opacity: aiCoverDesign.opacity || 1
          };
        }
        if (type === 'radial') {
          return {
            background: `radial-gradient(circle, ${colors.join(', ')})`,
            opacity: aiCoverDesign.opacity || 1
          };
        }
        if (type === 'conic') {
          return {
            background: `conic-gradient(from ${angle}deg, ${colors.join(', ')})`,
            opacity: aiCoverDesign.opacity || 1
          };
        }
      }

      // Fallback
      return {
        background: `linear-gradient(135deg, ${proposal.branding?.primaryColor}15 0%, ${proposal.branding?.secondaryColor}10 50%, ${proposal.branding?.accentColor}15 100%)`
      };
    };

    const titleSize = proposal.branding?.coverTextSizes?.title || '3.75rem';
    const subtitleSize = proposal.branding?.coverTextSizes?.subtitle || '1.25rem';
    const dateSize = proposal.branding?.coverTextSizes?.date || '1rem';

    // Get AI zones or use defaults
    const zones = proposal.branding?.coverZones;
    const useAILayout = !!zones;

    // Helper to render positioned logo
    const renderLogoZone = (logoUrl: string | undefined, zone: any, type: 'company' | 'client') => {
      if (!zone) return null;

      const style: any = {
        position: 'absolute',
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: zone.alignment === 'center' ? 'center' : zone.alignment === 'right' ? 'flex-end' : 'flex-start',
      };

      if (logoUrl) {
        return (
          <div key={type} style={style}>
            <img
              src={fixAssetUrl(logoUrl)}
              alt={`${type === 'company' ? 'Company' : 'Client'} Logo`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error(`Failed to load ${type} logo:`, logoUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );
      }

      // Show placeholder when no logo
      return (
        <div key={type} style={style}>
          <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-sm"
            style={{ borderColor: proposal.branding?.primaryColor || '#9CA3AF' }}>
            <div className="text-center px-2">
              <div className="text-xs opacity-60" style={{ color: proposal.branding?.textColor || '#6B7280' }}>
                {type === 'company' ? 'Your Logo' : 'Client Logo'}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
    <div className="relative h-full min-h-[700px] flex flex-col items-center justify-center p-12" style={getBackgroundStyle()}>
      {/* AI-positioned logos (if AI design is active) */}
      {useAILayout && zones.logo && renderLogoZone(proposal.branding?.companyLogo, zones.logo, 'company')}
      {useAILayout && zones.clientLogo && renderLogoZone(proposal.branding?.clientLogo, zones.clientLogo, 'client')}

      {/* Fallback: Traditional centered company logo (if not using AI layout) */}
      {!useAILayout && proposal.branding?.companyLogo && (
        <div className="mb-12 p-6 bg-white rounded-xl shadow-lg">
          <img
            src={fixAssetUrl(proposal.branding.companyLogo)}
            alt="Company Logo"
            className="h-24 w-auto object-contain"
            onError={(e) => {
              console.error('Failed to load company logo:', proposal.branding?.companyLogo);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* AI-positioned title (if AI design is active) */}
      {useAILayout && zones.title ? (
        <div style={{
          position: 'absolute',
          left: `${zones.title.x}%`,
          top: `${zones.title.y}%`,
          width: `${zones.title.width}%`,
          height: `${zones.title.height}%`,
          display: 'flex',
          alignItems: zones.title.verticalAlign === 'middle' ? 'center' : zones.title.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
          justifyContent: zones.title.alignment === 'center' ? 'center' : zones.title.alignment === 'right' ? 'flex-end' : 'flex-start',
        }}>
          <h1
            className="font-bold leading-tight"
            style={{
              fontSize: titleSize,
              textAlign: zones.title.alignment as any,
              ...(proposal.branding?.textColor ? {
                color: proposal.branding.textColor
              } : {
                backgroundImage: `linear-gradient(135deg, ${proposal.branding?.primaryColor}, ${proposal.branding?.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }),
              fontFamily: 'var(--heading-font)',
            }}
          >
            {replacePlaceholders(proposal.title)}
          </h1>
        </div>
      ) : (
        /* Fallback: Traditional centered title */
        <>
          <h1
            className="font-bold text-center mb-6 leading-tight"
            style={{
              fontSize: titleSize,
              ...(proposal.branding?.textColor ? {
                color: proposal.branding.textColor
              } : {
                backgroundImage: `linear-gradient(135deg, ${proposal.branding?.primaryColor}, ${proposal.branding?.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }),
              fontFamily: 'var(--heading-font)',
            }}
          >
            {replacePlaceholders(proposal.title)}
          </h1>
          {/* Subtitle bar */}
          <div className="w-24 h-1 rounded-full mb-8" style={{ background: proposal.branding?.primaryColor }}></div>
        </>
      )}

      {/* Client info (centered when not using AI layout) */}
      <div className={`text-center space-y-3 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-2xl ${useAILayout ? '' : ''}`}
        style={useAILayout && zones.subtitle ? {
          position: 'absolute',
          left: `${zones.subtitle.x}%`,
          top: `${zones.subtitle.y}%`,
          width: `${zones.subtitle.width}%`,
          textAlign: zones.subtitle.alignment as any,
        } : {}}>
        {proposal.clientCompany && (
          <p style={{
            fontSize: subtitleSize,
            fontWeight: 'bold',
            color: proposal.branding?.textColor || proposal.branding?.primaryColor
          }}>
            Prepared for: {proposal.clientCompany}
          </p>
        )}
        {proposal.clientName && (
          <p style={{
            fontSize: subtitleSize,
            color: proposal.branding?.textColor || '#374151'
          }}>{proposal.clientName}</p>
        )}
        {/* Date (only show here if not using AI layout) */}
        {!useAILayout && (
          <p style={{
            fontSize: dateSize,
            color: proposal.branding?.textColor || '#6B7280',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #D1D5DB'
          }}>
            {new Date(proposal.date || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* AI-positioned date (if AI design is active) */}
      {useAILayout && zones.date && (
        <div style={{
          position: 'absolute',
          left: `${zones.date.x}%`,
          top: `${zones.date.y}%`,
          width: `${zones.date.width}%`,
          textAlign: zones.date.alignment as any,
        }}>
          <p style={{
            fontSize: dateSize,
            color: proposal.branding?.textColor || '#6B7280',
          }}>
            {new Date(proposal.date || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      )}

      {/* Fallback: Traditional centered client logo (if not using AI layout) */}
      {!useAILayout && proposal.branding?.clientLogo && (
        <div className="mt-12 p-4 bg-white/60 backdrop-blur-sm rounded-lg">
          <img
            src={fixAssetUrl(proposal.branding.clientLogo)}
            alt="Client Logo"
            className="h-20 w-auto object-contain opacity-70"
            onError={(e) => {
              console.error('Failed to load client logo:', proposal.branding?.clientLogo);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-20" style={{
        background: `radial-gradient(circle, ${proposal.branding?.primaryColor}, transparent)`
      }}></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full opacity-20" style={{
        background: `radial-gradient(circle, ${proposal.branding?.secondaryColor}, transparent)`
      }}></div>
    </div>
    );
  };

  const renderTableOfContents = () => (
    <div className="prose max-w-none">
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--primary-color)' }}>
        Table of Contents
      </h2>
      <ul className="space-y-3">
        {sortedSections.map((section, index) => (
          <li key={section.id} className="flex justify-between items-center">
            <span className="flex items-center gap-3">
              <span className="text-gray-400">{index + 1}.</span>
              <span className="font-medium">{section.title}</span>
            </span>
            <span className="text-gray-400">{index + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // Parse space/tab-separated tables (for tables without pipes)
  const parseSpaceSeparatedTable = (lines: string[], startIndex: number): { table: any; endIndex: number } | null => {
    const firstLine = lines[startIndex].trim();

    // Check if this looks like a table header with multiple bold sections
    // e.g., **Item**    **Initial Cost**    **Operational Cost**
    const boldCount = (firstLine.match(/\*\*/g) || []).length;
    if (boldCount < 4) return null; // Need at least 2 bold columns (4 ** marks)

    // Extract header by splitting on multiple spaces/tabs (2 or more spaces)
    const headers = firstLine
      .split(/\s{2,}|\t+/)
      .map(h => h.trim().replace(/\*\*/g, ''))
      .filter(h => h.length > 0);

    if (headers.length < 2) return null;

    // Look for data rows (lines with similar structure)
    const rows: string[][] = [];
    let i = startIndex + 1;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.startsWith('---')) break;

      // Split by multiple spaces/tabs
      const cells = line
        .split(/\s{2,}|\t+/)
        .map(c => c.trim().replace(/\*\*/g, ''))
        .filter(c => c.length > 0);

      // Must have same number of columns as header (or close to it)
      if (cells.length >= headers.length - 1 && cells.length <= headers.length + 1) {
        // Pad or trim to match header length
        while (cells.length < headers.length) cells.push('');
        if (cells.length > headers.length) cells.length = headers.length;
        rows.push(cells);
      } else if (cells.length > 0) {
        // Different structure, table ended
        break;
      }

      i++;
    }

    if (rows.length === 0) return null;

    return {
      table: {
        type: 'table',
        headers,
        rows,
        tableType: 'budget',
        styling: {
          headerBg: '#3b82f6',
          alternateRows: true,
          borderColor: '#e5e7eb'
        }
      },
      endIndex: i - 1
    };
  };

  // Parse markdown tables and convert to visual elements
  const parseMarkdownTable = (lines: string[], startIndex: number): { table: any; endIndex: number } | null => {
    // Check if it's a table header
    if (!lines[startIndex].includes('|')) return null;

    const headerLine = lines[startIndex];
    const separatorLine = lines[startIndex + 1];

    // Must have separator line with dashes
    if (!separatorLine || !separatorLine.includes('---')) return null;

    // Extract headers
    const headers = headerLine.split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Extract data rows
    const rows: string[][] = [];
    let i = startIndex + 2;

    while (i < lines.length && lines[i].includes('|')) {
      const cells = lines[i].split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      if (cells.length > 0) {
        rows.push(cells);
      }
      i++;
    }

    return {
      table: {
        type: 'table',
        headers,
        rows,
        tableType: 'comparison',
        styling: {
          headerBg: '#3b82f6',
          alternateRows: true
        }
      },
      endIndex: i - 1
    };
  };

  // Parse JSON visual elements and markdown tables from content
  const parseVisualElements = (text: string): { cleanedText: string; visualElements: any[] } => {
    const visualElements: any[] = [];
    const lines = text.split('\n');
    const cleanedLines: string[] = [];
    let inJsonBlock = false;
    let jsonBuffer: string[] = [];
    let braceCount = 0;
    let skipUntilLine = -1;

    lines.forEach((line, index) => {
      // Skip lines that are part of a parsed table
      if (index <= skipUntilLine) {
        return;
      }

      const trimmed = line.trim();

      // Detect space/tab-separated table (check first, more flexible)
      if (!inJsonBlock && trimmed.includes('**')) {
        const spaceTableResult = parseSpaceSeparatedTable(lines, index);
        if (spaceTableResult) {
          visualElements.push(spaceTableResult.table);
          skipUntilLine = spaceTableResult.endIndex;
          return;
        }
      }

      // Detect markdown table (with pipes)
      if (trimmed.includes('|') && !inJsonBlock) {
        const tableResult = parseMarkdownTable(lines, index);
        if (tableResult) {
          visualElements.push(tableResult.table);
          skipUntilLine = tableResult.endIndex;
          return;
        }
      }

      // Detect start of JSON block (just check for opening brace)
      if (trimmed === '{' && !inJsonBlock) {
        inJsonBlock = true;
        jsonBuffer = [line];
        braceCount = 1;
        return;
      }

      // Collect JSON lines
      if (inJsonBlock) {
        jsonBuffer.push(line);

        // Count braces to find matching closing brace
        braceCount += (trimmed.match(/{/g) || []).length;
        braceCount -= (trimmed.match(/}/g) || []).length;

        // Check if JSON block ends (all braces matched)
        if (braceCount === 0) {
          try {
            const jsonStr = jsonBuffer.join('\n').replace(/,\s*$/, ''); // Remove trailing comma
            const visualData = JSON.parse(jsonStr);

            // Only treat as visual element if it has a "type" field
            if (visualData.type) {
              visualElements.push(visualData);
            } else {
              // Not a visual element, add back to content
              cleanedLines.push(...jsonBuffer);
            }
          } catch (e) {
            console.warn('Failed to parse JSON block:', e, jsonBuffer.join('\n'));
            // If parsing fails, add lines back to content
            cleanedLines.push(...jsonBuffer);
          }
          inJsonBlock = false;
          jsonBuffer = [];
          braceCount = 0;
          return;
        }
        return;
      }

      // Normal content line
      if (!inJsonBlock) {
        // Skip layout description comments
        if (trimmed.startsWith('📐 Layout:') ||
            trimmed.startsWith('<!-- LAYOUT:') ||
            trimmed.startsWith('<!-- VISUAL FLOW:') ||
            trimmed.startsWith('<!-- DENSITY:')) {
          return;
        }

        // Skip emoji-based pseudo-table headers (like "**Criteria** **Current State** ⚠️")
        // These are lines with multiple ** pairs and emojis but no actual table structure
        if (trimmed.includes('**') && /[⚠️✅❌🔴🟢⚡💡🎯✓]/u.test(trimmed) && !trimmed.startsWith('|')) {
          // Count ** pairs - if more than 2 pairs and has emojis, likely a pseudo-header
          const boldCount = (trimmed.match(/\*\*/g) || []).length;
          if (boldCount >= 4) {
            return; // Skip this line
          }
        }

        cleanedLines.push(line);
      }
    });

    return {
      cleanedText: cleanedLines.join('\n'),
      visualElements
    };
  };

  // Helper function to wrap emojis in spans to preserve their native colors
  const protectEmojis = (text: string): string => {
    // Match all emojis and wrap them in spans that prevent color inheritance
    // Use all: revert to reset all inherited styles and let emoji render naturally
    return text.replace(/([\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2300}-\u{23FF}\u{2B50}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}]+[\uFE0E\uFE0F]?)/gu,
      '<span class="emoji-protect" style="all: revert; font-family: \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji\', sans-serif; font-size: 1.2em; display: inline-block; margin: 0 0.2em; filter: none; mix-blend-mode: normal;">$1</span>'
    );
  };

  // Convert plain text/markdown to HTML with proper heading support
  const formatContent = (text: string): string => {
    if (!text) return '';

    // Replace placeholders first
    let content = replacePlaceholders(text);

    // Protect emojis before any other processing
    content = protectEmojis(content);

    // Convert **bold** to <strong>
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert bullet points (- item or * item) to <ul><li>
    const lines = content.split('\n');
    let html = '';
    let inList = false;

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Skip empty lines or code blocks
      if (!trimmed || trimmed.startsWith('```')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        return;
      }

      // Handle lines with multiple bold sections separated by spaces (convert to styled flex layout)
      // Example: **Automation Excellence**    **Data-Driven Insights**    **Robust Security**
      const boldSections = trimmed.match(/<strong>[^<]+<\/strong>/g);
      if (boldSections && boldSections.length >= 2) {
        // Check if line is mostly bold sections with spaces (likely a header row)
        const textWithoutBold = trimmed.replace(/<strong>[^<]+<\/strong>/g, '').trim();
        if (textWithoutBold.length < 10) { // Mostly just spaces between bold sections
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          // Render as a flex container with styled bold sections
          html += '<div class="flex gap-6 my-4 pb-3 border-b-2" style="border-color: var(--primary-color);">';
          boldSections.forEach((section) => {
            const content = section.replace(/<\/?strong>/g, '');
            // Don't apply color to emoji spans (they're already protected by protectEmojis function)
            html += `<div class="flex-1 text-center font-bold text-lg" style="color: var(--primary-color);">${content}</div>`;
          });
          html += '</div>';
          return;
        }
      }

      // Handle page break marker
      if (trimmed === '---PAGE_BREAK---' || trimmed.includes('PAGE_BREAK')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<div class="page-break" style="page-break-after: always; break-after: page; margin: 2rem 0; border-bottom: 2px dashed #e5e7eb; padding-bottom: 1rem;"></div>';
        return;
      }

      // Handle horizontal rule (---)
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<hr class="my-8 border-t-2 opacity-30" style="border-color: var(--primary-color)" />';
        return;
      }

      // Convert markdown headings to HTML
      if (trimmed.startsWith('#### ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const headingText = trimmed.substring(5);
        html += `<h4 class="text-lg font-semibold mt-4 mb-2" style="color: var(--secondary-color); font-family: var(--heading-font); text-align: left; margin-left: 0; padding-left: 0; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${headingText}</h4>`;
      } else if (trimmed.startsWith('### ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const headingText = trimmed.substring(4);
        html += `<h3 class="text-xl font-semibold mt-6 mb-3" style="color: var(--secondary-color); font-family: var(--heading-font); text-align: left; margin-left: 0; padding-left: 0; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${headingText}</h3>`;
      } else if (trimmed.startsWith('## ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const headingText = trimmed.substring(3);
        html += `<h2 class="text-2xl font-bold mt-8 mb-4 pb-2 border-b-2" style="color: var(--primary-color); font-family: var(--heading-font); border-color: var(--primary-color); text-align: left; margin-left: 0; padding-left: 0; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${headingText}</h2>`;
      } else if (trimmed.startsWith('# ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const headingText = trimmed.substring(2);
        html += `<h1 class="text-3xl font-bold mt-10 mb-6 pb-3 border-b-4" style="color: var(--primary-color); font-family: var(--heading-font); border-color: var(--primary-color); text-align: left; margin-left: 0; padding-left: 0; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${headingText}</h1>`;
      }
      // Bullet point
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          html += '<ul class="list-disc pl-6 space-y-2 my-4" style="word-wrap: break-word; overflow-wrap: break-word;">';
          inList = true;
        }
        html += `<li class="text-gray-700" style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${trimmed.substring(2)}</li>`;
      }
      // Numbered list
      else if (/^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          html += '<ol class="list-decimal pl-6 space-y-2 my-4" style="word-wrap: break-word; overflow-wrap: break-word;">';
          inList = true;
        }
        html += `<li class="text-gray-700" style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${trimmed.replace(/^\d+\.\s/, '')}</li>`;
      }
      // End list if we hit a non-list line
      else if (trimmed) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p class="mb-4 leading-relaxed text-gray-700" style="text-align: justify; line-height: 1.8; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;">${trimmed}</p>`;
      }
    });

    // Close list if still open
    if (inList) {
      html += '</ul>';
    }

    return html;
  };

  // Helper to render heading with emoji protection
  const renderHeadingWithEmoji = (title: string) => {
    const replacedTitle = replacePlaceholders(title);

    // Extract emoji at the start (including variation selectors)
    const emojiMatch = replacedTitle.match(/^([\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2300}-\u{23FF}\u{2B50}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}]+[\uFE0E\uFE0F]?)\s*/u);

    if (emojiMatch) {
      const emoji = emojiMatch[1];
      const text = replacedTitle.substring(emojiMatch[0].length);
      return (
        <>
          <span style={{
            all: 'revert',
            fontSize: '1.5em',
            marginRight: '0.5rem',
            fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif",
            display: 'inline-block',
            verticalAlign: 'middle',
            filter: 'none',
            mixBlendMode: 'normal'
          } as React.CSSProperties}>
            {emoji}
          </span>
          <span style={{ color: 'var(--primary-color)' }}>{text}</span>
        </>
      );
    }

    return replacedTitle;
  };

  const renderTextSection = (section: ProposalSection) => {
    // Parse JSON visual elements from content
    const { cleanedText, visualElements: parsedVisuals } = parseVisualElements(section.content || '');

    // Check if section has visualizations (from AI generation or parsed from content)
    const existingVisualizations = section.data?.visualizations || [];
    const allVisualizations = [...existingVisualizations, ...parsedVisuals];
    const hasVisualizations = allVisualizations.length > 0;

    return (
      <div className="prose max-w-none" style={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>
        <h2
          className="text-3xl font-bold mb-6 pb-3 border-b-4"
          style={{
            color: 'var(--primary-color)',
            fontFamily: 'var(--heading-font)',
            borderColor: 'var(--primary-color)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {renderHeadingWithEmoji(section.title)}
        </h2>
        <div
          className="text-gray-700 leading-relaxed mb-8 text-base"
          style={{
            fontFamily: 'var(--font-family)',
            textAlign: 'justify',
            lineHeight: '1.8',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
          dangerouslySetInnerHTML={{
            __html: formatContent(cleanedText),
          }}
        />

        {/* Render any AI-generated visualizations (diagrams, charts, tables, callouts) */}
        {hasVisualizations && (
          <div className="space-y-6 mt-8">
            {allVisualizations.map((viz: any, index: number) => {
              // Handle both nested (viz.data.code) and flat (viz.code) formats
              const mermaidCode = viz.data?.code || viz.code;
              const chartType = viz.data?.chartType || viz.chartType;
              const chartData = viz.data?.chartData || viz.chartData || viz.data;
              const tableHeaders = viz.data?.headers || viz.headers;
              const tableRows = viz.data?.rows || viz.rows;
              const caption = viz.data?.caption || viz.caption;
              const styling = viz.data?.styling || viz.styling;
              const calloutTitle = viz.data?.title || viz.title;
              const calloutContent = viz.data?.content || viz.content;
              const calloutType = viz.data?.calloutType || viz.calloutType;

              return (
              <div key={index}>
                {viz.type === 'mermaid' && mermaidCode && (
                  <div className="relative border-2 rounded-2xl p-8 shadow-lg overflow-hidden" style={{
                    borderColor: proposal.branding?.accentColor || '#e5e7eb',
                    background: 'linear-gradient(to bottom right, #ffffff, #f9fafb)'
                  }}>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{
                      background: `radial-gradient(circle at top right, ${proposal.branding?.primaryColor}, transparent)`
                    }}></div>

                    <MermaidRenderer code={mermaidCode} />
                    {caption && (
                      <div className="mt-6 pt-4 border-t-2" style={{ borderColor: proposal.branding?.accentColor || '#e5e7eb' }}>
                        <p className="text-sm font-medium text-center" style={{ color: proposal.branding?.secondaryColor }}>
                          {caption}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {viz.type === 'chart' && chartType && chartData && (
                  <div className="relative border-2 rounded-2xl p-8 shadow-lg overflow-hidden" style={{
                    borderColor: proposal.branding?.accentColor || '#e5e7eb',
                    background: 'linear-gradient(to bottom right, #ffffff, #f9fafb)'
                  }}>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 left-0 w-24 h-24 opacity-10" style={{
                      background: `radial-gradient(circle at top left, ${proposal.branding?.secondaryColor}, transparent)`
                    }}></div>

                    <ChartRenderer
                      type={chartType}
                      data={createChartData(
                        chartData.labels || [],
                        chartData.datasets || []
                      )}
                      height={400}
                    />
                    {caption && (
                      <div className="mt-6 pt-4 border-t-2" style={{ borderColor: proposal.branding?.accentColor || '#e5e7eb' }}>
                        <p className="text-sm font-medium text-center" style={{ color: proposal.branding?.secondaryColor }}>
                          {caption}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {viz.type === 'table' && tableHeaders && tableRows && (
                  <TableRenderer
                    headers={tableHeaders}
                    rows={tableRows}
                    caption={caption}
                    styling={styling}
                  />
                )}
                {viz.type === 'callout' && calloutTitle && calloutContent && (
                  <CalloutRenderer
                    type={calloutType || 'info'}
                    title={calloutTitle}
                  >
                    {calloutContent}
                  </CalloutRenderer>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderChart = (section: ProposalSection) => {
    if (!section.data?.chartConfig) {
      return <div className="text-gray-500">No chart data available</div>;
    }

    const { type, data, options } = section.data.chartConfig;
    const chartData = createChartData(data.labels, data.datasets);

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>
          {section.title}
        </h3>
        <ChartRenderer type={type} data={chartData} options={options} height={400} />
      </div>
    );
  };

  const renderDiagram = (section: ProposalSection) => {
    if (!section.data?.mermaidCode) {
      return <div className="text-gray-500">No diagram data available</div>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>
          {section.title}
        </h3>
        <MermaidRenderer code={section.data.mermaidCode} />
      </div>
    );
  };

  const renderTable = (section: ProposalSection) => {
    if (!section.data?.tableData) {
      return <div className="text-gray-500">No table data available</div>;
    }

    const { headers, rows, caption, styling } = section.data.tableData;

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>
          {section.title}
        </h3>
        <TableRenderer
          headers={headers}
          rows={rows}
          caption={caption}
          styling={styling}
        />
      </div>
    );
  };

  const renderThankYouSlide = () => {
    const thankYou = proposal.branding?.thankYouSlide;
    if (!thankYou?.enabled) return null;

    return (
      <div className="relative h-full min-h-[700px] flex flex-col items-center justify-center p-12" style={{
        backgroundColor: thankYou.backgroundColor || '#f9fafb',
        background: `linear-gradient(135deg, ${proposal.branding?.primaryColor}10, ${proposal.branding?.secondaryColor}05)`
      }}>
        {/* Company Logo */}
        {proposal.branding?.companyLogo && (
          <div className="mb-8">
            <img
              src={fixAssetUrl(proposal.branding.companyLogo)}
              alt="Company Logo"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                console.error('Failed to load thank you logo');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Thank You Title */}
        <h1
          className="text-6xl font-bold text-center mb-8"
          style={{
            color: proposal.branding?.primaryColor,
            fontFamily: 'var(--heading-font)'
          }}
        >
          {thankYou.title || 'Thank You'}
        </h1>

        {/* Decorative line */}
        <div className="w-32 h-1 rounded-full mb-8" style={{ backgroundColor: proposal.branding?.primaryColor }}></div>

        {/* Message */}
        {thankYou.message && (
          <p className="text-xl text-center text-gray-700 max-w-2xl mb-12 leading-relaxed">
            {thankYou.message}
          </p>
        )}

        {/* Contact Information */}
        {(thankYou.contactPerson || thankYou.contactEmail || thankYou.contactPhone) && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-xl w-full">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">Get In Touch</p>
            {thankYou.contactPerson && (
              <p className="text-center text-lg font-bold mb-2" style={{ color: proposal.branding?.primaryColor }}>
                {thankYou.contactPerson}
              </p>
            )}
            <div className="text-center space-y-2">
              {thankYou.contactEmail && (
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {thankYou.contactEmail}
                </p>
              )}
              {thankYou.contactPhone && (
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {thankYou.contactPhone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full opacity-10" style={{
          background: `radial-gradient(circle, ${proposal.branding?.primaryColor}, transparent)`
        }}></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full opacity-10" style={{
          background: `radial-gradient(circle, ${proposal.branding?.secondaryColor}, transparent)`
        }}></div>
      </div>
    );
  };

  const renderBackCover = () => {
    const backCover = proposal.branding?.backCover;
    if (!backCover?.enabled) return null;

    return (
      <div className="relative h-full min-h-[700px] flex flex-col items-center justify-center p-12" style={{
        backgroundColor: backCover.backgroundColor || '#f9fafb',
        backgroundImage: backCover.backgroundImage ? `url(${backCover.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Company Logo */}
        {proposal.branding?.companyLogo && (
          <div className="mb-12 p-6 bg-white rounded-xl shadow-lg">
            <img
              src={fixAssetUrl(proposal.branding.companyLogo)}
              alt="Company Logo"
              className="h-32 w-auto object-contain"
              onError={(e) => {
                console.error('Failed to load back cover logo');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Tagline */}
        {backCover.tagline && (
          <h2
            className="text-4xl font-bold text-center mb-8 max-w-2xl"
            style={{
              color: proposal.branding?.primaryColor,
              fontFamily: 'var(--heading-font)'
            }}
          >
            {backCover.tagline}
          </h2>
        )}

        {/* Social Media Links */}
        {backCover.socialMedia && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-xl w-full mt-8">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">Connect With Us</p>
            <div className="space-y-3">
              {backCover.socialMedia.website && (
                <div className="flex items-center justify-center gap-3">
                  <span className="font-medium text-gray-700">Website:</span>
                  <a
                    href={backCover.socialMedia.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {backCover.socialMedia.website}
                  </a>
                </div>
              )}
              {backCover.socialMedia.linkedin && (
                <div className="flex items-center justify-center gap-3">
                  <span className="font-medium text-gray-700">LinkedIn:</span>
                  <a
                    href={backCover.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {backCover.socialMedia.linkedin}
                  </a>
                </div>
              )}
              {backCover.socialMedia.twitter && (
                <div className="flex items-center justify-center gap-3">
                  <span className="font-medium text-gray-700">Twitter:</span>
                  <a
                    href={backCover.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {backCover.socialMedia.twitter}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none"></div>

        {/* Decorative corner elements */}
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full opacity-20" style={{
          background: `radial-gradient(circle, ${proposal.branding?.accentColor}, transparent)`
        }}></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full opacity-20" style={{
          background: `radial-gradient(circle, ${proposal.branding?.secondaryColor}, transparent)`
        }}></div>
      </div>
    );
  };

  if (!proposal || !proposal.sections || proposal.sections.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[600px] bg-gray-50 rounded-lg ${className}`}>
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600">No proposal content to preview</p>
        <p className="text-sm text-gray-500 mt-2">Generate proposal content to see preview</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`proposal-preview ${isA4Layout ? 'a4-layout' : ''} bg-white ${className}`} style={{...brandingStyles, maxHeight: 'none'}}>
      {/* Header with Logo */}
      {proposal.branding?.header?.enabled !== false && (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b-2 px-6 py-3 shadow-md print:static print:shadow-none" style={{
          borderColor: proposal.branding?.primaryColor,
          backgroundColor: proposal.branding?.header?.backgroundColor || 'rgba(255, 255, 255, 0.95)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1" style={{
              justifyContent: proposal.branding?.header?.logoPosition === 'center' ? 'center' :
                            proposal.branding?.header?.logoPosition === 'right' ? 'flex-end' : 'flex-start'
            }}>
              {/* Header Logo - Primary Display */}
              {(proposal.branding?.companyLogo || proposal.branding?.header?.logo) && (
                <div className="flex items-center gap-3">
                  <img
                    src={fixAssetUrl(proposal.branding?.header?.logo || proposal.branding.companyLogo)}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      // Silently hide if logo fails to load (optional logo)
                      console.error('Failed to load header logo');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {proposal.branding?.header?.text && (
                    <div className="border-l-2 pl-3" style={{ borderColor: proposal.branding?.primaryColor }}>
                      <h2 className="text-sm font-bold leading-tight" style={{
                        color: proposal.branding?.primaryColor,
                        fontFamily: 'var(--heading-font)'
                      }}>
                        {proposal.branding.header.text}
                      </h2>
                    </div>
                  )}
                </div>
              )}
              {/* Fallback to text if no logo */}
              {!(proposal.branding?.companyLogo || proposal.branding?.header?.logo) && (
                <div>
                  <h2 className="text-lg font-bold" style={{
                    color: proposal.branding?.primaryColor,
                    fontFamily: 'var(--heading-font)'
                  }}>
                    {proposal.branding?.header?.text || proposal.title}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {proposal.clientCompany}
                  </p>
                </div>
              )}
            </div>

            {/* Layout controls - hidden in print */}
            <div className="flex items-center gap-3 print:hidden">
              {/* A4 Layout Toggle */}
              <button
                onClick={() => setIsA4Layout(!isA4Layout)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  isA4Layout
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                title={isA4Layout ? 'Switch to Tab View' : 'Switch to A4 Print View'}
              >
                {isA4Layout ? '📄 A4 View' : '📑 Tab View'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation - Only show in tab mode */}
      {!isA4Layout && sortedSections.length > 0 && (
        <div className="bg-white border-b shadow-sm print:hidden sticky top-0 z-[9]">
          <div className="flex items-center justify-between px-6">
            <div className="flex overflow-x-auto flex-1">
              {sortedSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveTabIndex(index)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTabIndex === index
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">Page {index + 1}</span>
                  <span className="text-xs opacity-75">• {section.title}</span>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 ml-4 flex items-center gap-2 flex-shrink-0">
              <span>Use</span>
              <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">←</kbd>
              <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">→</kbd>
              <span>to navigate</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-12 space-y-12">
        {displayedSections.map((section, index) => (
          mode === 'edit' ? (
            <AssetDropZone
              key={section.id}
              zone="section"
              sectionIndex={index}
              className="section"
            >
              <div data-type={section.type}>
                {renderSection(section)}
              </div>
            </AssetDropZone>
          ) : (
            <div key={section.id} className="section" data-type={section.type}>
              {renderSection(section)}
            </div>
          )
        ))}

        {/* Tab Navigation Controls - Bottom */}
        {!isA4Layout && sortedSections.length > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8 pb-4 print:hidden">
            <button
              onClick={() => setActiveTabIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeTabIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Previous</span>
            </button>
            <span className="text-sm text-gray-600 font-medium">
              {activeTabIndex + 1} / {sortedSections.length}
            </span>
            <button
              onClick={() => setActiveTabIndex((prev) => Math.min(sortedSections.length - 1, prev + 1))}
              disabled={activeTabIndex >= sortedSections.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer with Logo */}
      {proposal.branding?.footer?.enabled !== false && (
        <div className="border-t-4 px-6 py-4 print:py-3" style={{
          borderColor: proposal.branding?.primaryColor,
          backgroundColor: proposal.branding?.footer?.backgroundColor || '#f9fafb',
          background: proposal.branding?.footer?.backgroundColor || `linear-gradient(to right, ${proposal.branding?.primaryColor}05, ${proposal.branding?.secondaryColor}05)`
        }}>
          <div className="flex items-start justify-between max-w-6xl mx-auto gap-6">
            {/* Footer Logo and Company Info - Primary Display */}
            <div className="flex items-start gap-4 flex-1" style={{
              justifyContent: proposal.branding?.footer?.logoPosition === 'center' ? 'center' :
                            proposal.branding?.footer?.logoPosition === 'right' ? 'flex-end' : 'flex-start'
            }}>
              {(proposal.branding?.companyLogo || proposal.branding?.footer?.logo) && (
                <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
                    <img
                      src={fixAssetUrl(proposal.branding?.footer?.logo || proposal.branding.companyLogo)}
                      alt="Company Logo"
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        // Silently hide if logo fails to load (optional logo)
                        console.error('Failed to load footer logo');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-sm" style={{ color: proposal.branding?.primaryColor }}>
                      {proposal.branding?.footer?.companyInfo || proposal.companyName || proposal.extractedData?.companyName || 'Your Company'}
                    </p>
                    <div className="space-y-0.5 text-gray-600">
                      {proposal.branding?.footer?.email && (
                        <p className="flex items-center gap-1">
                          <span>✉</span> {proposal.branding.footer.email}
                        </p>
                      )}
                      {proposal.branding?.footer?.phone && (
                        <p className="flex items-center gap-1">
                          <span>☎</span> {proposal.branding.footer.phone}
                        </p>
                      )}
                      {proposal.branding?.footer?.website && (
                        <p className="flex items-center gap-1">
                          <span>🌐</span> {proposal.branding.footer.website}
                        </p>
                      )}
                      {proposal.branding?.footer?.address && (
                        <p className="flex items-center gap-1 mt-1">
                          <span>📍</span> {proposal.branding.footer.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Fallback if no logo */}
              {!(proposal.branding?.companyLogo || proposal.branding?.footer?.logo) && (
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-sm" style={{ color: proposal.branding?.primaryColor }}>
                    {proposal.branding?.footer?.companyInfo || proposal.companyName || proposal.extractedData?.companyName || 'Your Company'}
                  </p>
                  <div className="space-y-0.5 text-gray-600">
                    {proposal.branding?.footer?.email && <p>✉ {proposal.branding.footer.email}</p>}
                    {proposal.branding?.footer?.phone && <p>☎ {proposal.branding.footer.phone}</p>}
                    {proposal.branding?.footer?.website && <p>🌐 {proposal.branding.footer.website}</p>}
                    {proposal.branding?.footer?.address && <p className="mt-1">📍 {proposal.branding.footer.address}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Date and Page Info */}
            <div className="text-right text-xs flex-shrink-0">
              <p className="font-semibold text-sm" style={{ color: proposal.branding?.secondaryColor }}>
                {new Date(proposal.date || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {proposal.branding?.footer?.showPageNumbers !== false && !isA4Layout && (
                <p className="text-gray-500 mt-1">
                  Page {activeTabIndex + 1} of {sortedSections.length}
                </p>
              )}
              <p className="text-gray-500 mt-1">Confidential & Proprietary</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </DndContext>
  );
}
