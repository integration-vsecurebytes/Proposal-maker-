import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  reasoning: string;
}

interface BackgroundSuggestion {
  type: 'solid' | 'gradient';
  solidColor?: string;
  gradient?: {
    type: 'linear' | 'radial' | 'conic';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  opacity: number;
  reasoning: string;
}

interface DesignCritique {
  score: number;
  strengths: string[];
  improvements: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
    autoFix?: any;
  }>;
  accessibility: {
    contrastRatio: number;
    wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
    issues: string[];
  };
}

interface TemplateRecommendation {
  templateId: string;
  score: number;
  reasoning: string;
  bestFor: string[];
}

export class AIDesignAssistant {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Extract dominant colors from logo image
   */
  async extractColorsFromImage(imagePath: string): Promise<{
    dominant: string[];
    palette: string[];
  }> {
    try {
      const image = sharp(imagePath);
      const { dominant, channels } = await image.stats();

      // Get dominant color
      const dominantHex = this.rgbToHex(
        Math.round(dominant.r),
        Math.round(dominant.g),
        Math.round(dominant.b)
      );

      // Extract color palette (simplified - in production, use color-thief or vibrant)
      const buffer = await image.resize(100, 100).raw().toBuffer();
      const colors = this.extractPaletteFromBuffer(buffer);

      return {
        dominant: [dominantHex],
        palette: colors,
      };
    } catch (error) {
      console.error('Error extracting colors:', error);
      return {
        dominant: ['#3B82F6'],
        palette: ['#3B82F6', '#8B5CF6', '#EC4899'],
      };
    }
  }

  /**
   * Generate color palettes from logo using AI
   */
  async generatePalettesFromLogo(
    logoColors: string[],
    industry: string = 'general',
    tone: string = 'professional'
  ): Promise<ColorPalette[]> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are a professional graphic designer specializing in corporate brand identity and proposal design.

**Task:** Generate 3 professional color palettes for a business proposal cover page.

**Logo Colors:** ${logoColors.join(', ')}
**Industry:** ${industry}
**Tone:** ${tone}

For each palette, provide:
1. **Name**: Creative, descriptive name
2. **Primary**: Main brand color (use logo color)
3. **Secondary**: Complementary color
4. **Accent**: Highlight color for CTAs and emphasis
5. **Background**: Page background color
6. **Text**: Primary text color
7. **Reasoning**: Why this palette works (1-2 sentences)

**Requirements:**
- Maintain brand consistency with logo colors
- Ensure WCAG AA contrast ratios (4.5:1 for text)
- Professional and modern aesthetics
- Industry-appropriate color psychology

Return ONLY valid JSON (no markdown):
{
  "palettes": [
    {
      "name": "palette name",
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "text": "#hex",
      "reasoning": "explanation"
    }
  ]
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.palettes;
        }
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error generating palettes:', error);
      // Return fallback palettes
      return this.getFallbackPalettes(logoColors[0]);
    }
  }

  /**
   * Generate background designs using AI
   */
  async generateBackground(params: {
    industry: string;
    tone: string;
    style: 'gradient' | 'solid';
    colorPreference?: string;
  }): Promise<BackgroundSuggestion> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a professional graphic designer creating proposal cover page backgrounds.

**Requirements:**
- Industry: ${params.industry}
- Tone: ${params.tone}
- Style: ${params.style}
- Color Preference: ${params.colorPreference || 'any'}

Design a ${params.style} background that:
1. Reflects the industry and tone
2. Is professional and modern
3. Works well with white/dark text
4. Creates visual interest without overwhelming

Return ONLY valid JSON (no markdown):
${
  params.style === 'gradient'
    ? `{
  "type": "gradient",
  "gradient": {
    "type": "linear",
    "angle": 135,
    "stops": [
      {"color": "#hex", "position": 0},
      {"color": "#hex", "position": 100}
    ]
  },
  "opacity": 0.9,
  "reasoning": "why this works"
}`
    : `{
  "type": "solid",
  "solidColor": "#hex",
  "opacity": 1,
  "reasoning": "why this works"
}`
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error generating background:', error);
      return this.getFallbackBackground(params.style);
    }
  }

  /**
   * Critique cover page design and provide feedback
   */
  async critiqueDesign(design: {
    background: any;
    template: string;
    industry: string;
    hasLogo: boolean;
    titleLength: number;
    primaryColor: string;
    backgroundColor: string;
  }): Promise<DesignCritique> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are a professional graphic designer reviewing a business proposal cover page.

**Design Details:**
- Background: ${JSON.stringify(design.background)}
- Template: ${design.template}
- Industry: ${design.industry}
- Has Logo: ${design.hasLogo}
- Title Length: ${design.titleLength} characters
- Primary Color: ${design.primaryColor}
- Background Color: ${design.backgroundColor}

**Evaluate:**
1. Visual hierarchy and balance
2. Color harmony and contrast
3. Professional appearance
4. Readability and accessibility
5. Brand consistency
6. Industry appropriateness

**Provide:**
- Overall score (0-10)
- 2-3 strengths
- 2-3 specific improvements with actionable suggestions
- Accessibility analysis (contrast ratio, WCAG level)

Return ONLY valid JSON (no markdown):
{
  "score": 8.5,
  "strengths": ["strength 1", "strength 2"],
  "improvements": [
    {
      "issue": "specific issue",
      "severity": "medium",
      "suggestion": "how to fix it"
    }
  ],
  "accessibility": {
    "contrastRatio": 4.5,
    "wcagLevel": "AA",
    "issues": ["issue if any"]
  }
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error critiquing design:', error);
      return this.getFallbackCritique();
    }
  }

  /**
   * Recommend best templates based on proposal content
   */
  async recommendTemplates(proposal: {
    title: string;
    industry: string;
    tone: string;
    contentLength: number;
    hasMetrics: boolean;
    targetAudience: string;
  }): Promise<TemplateRecommendation[]> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1536,
        messages: [
          {
            role: 'user',
            content: `You are a professional designer recommending cover page templates.

**Proposal Details:**
- Title: ${proposal.title}
- Industry: ${proposal.industry}
- Tone: ${proposal.tone}
- Content Length: ${proposal.contentLength} sections
- Has Metrics/Data: ${proposal.hasMetrics}
- Target Audience: ${proposal.targetAudience}

**Available Templates:**
1. minimal-left: Clean left-aligned, lots of whitespace
2. centered-classic: Traditional centered, balanced
3. split-screen: Bold 50/50 color block, modern
4. hero-image: Full background with overlay
5. geometric-modern: Modern with geometric shapes
6. magazine-style: Editorial, large typography
7. corporate-formal: Professional with header stripe
8. creative-diagonal: Dynamic angled elements
9. minimalist-white: Ultra-clean, maximum breathing room
10. bold-typography: Title as hero element
11. isometric-illustration: 3D graphics showcase
12. photo-collage: Multiple images with text

**Recommend top 3 templates** that best match the proposal characteristics.

Return ONLY valid JSON (no markdown):
{
  "recommendations": [
    {
      "templateId": "template-id",
      "score": 9.2,
      "reasoning": "why this is the best fit",
      "bestFor": ["use case 1", "use case 2"]
    }
  ]
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.recommendations;
        }
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error recommending templates:', error);
      return this.getFallbackRecommendations(proposal.industry);
    }
  }

  // Helper methods
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  private extractPaletteFromBuffer(buffer: Buffer): string[] {
    // Simplified palette extraction - in production use proper color quantization
    const colors = new Set<string>();
    for (let i = 0; i < buffer.length; i += 12) {
      const r = buffer[i];
      const g = buffer[i + 1];
      const b = buffer[i + 2];
      if (r !== undefined && g !== undefined && b !== undefined) {
        colors.add(this.rgbToHex(r, g, b));
      }
      if (colors.size >= 5) break;
    }
    return Array.from(colors).slice(0, 5);
  }

  private getFallbackPalettes(primaryColor: string): ColorPalette[] {
    return [
      {
        name: 'Professional Blue',
        primary: primaryColor,
        secondary: '#F7941D',
        accent: '#FFB347',
        background: '#FFFFFF',
        text: '#1F2937',
        reasoning:
          'Classic professional palette with high contrast and excellent readability',
      },
      {
        name: 'Modern Contrast',
        primary: primaryColor,
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#F9FAFB',
        text: '#111827',
        reasoning: 'Contemporary design with subtle backgrounds and vibrant accents',
      },
      {
        name: 'Bold Statement',
        primary: primaryColor,
        secondary: '#8B5CF6',
        accent: '#EC4899',
        background: '#FFFFFF',
        text: '#000000',
        reasoning: 'Eye-catching palette for creative and innovative presentations',
      },
    ];
  }

  private getFallbackBackground(style: 'gradient' | 'solid'): BackgroundSuggestion {
    if (style === 'gradient') {
      return {
        type: 'gradient',
        gradient: {
          type: 'linear',
          angle: 135,
          stops: [
            { color: '#3B82F6', position: 0 },
            { color: '#8B5CF6', position: 100 },
          ],
        },
        opacity: 0.9,
        reasoning: 'Professional blue-to-purple gradient for modern tech aesthetic',
      };
    } else {
      return {
        type: 'solid',
        solidColor: '#3B82F6',
        opacity: 1,
        reasoning: 'Clean blue background for professional appearance',
      };
    }
  }

  private getFallbackCritique(): DesignCritique {
    return {
      score: 7.5,
      strengths: [
        'Good use of whitespace',
        'Professional color scheme',
        'Clear visual hierarchy',
      ],
      improvements: [
        {
          issue: 'Consider increasing title contrast',
          severity: 'medium',
          suggestion: 'Darken the background or add a text shadow for better readability',
        },
      ],
      accessibility: {
        contrastRatio: 4.5,
        wcagLevel: 'AA',
        issues: [],
      },
    };
  }

  private getFallbackRecommendations(industry: string): TemplateRecommendation[] {
    const recommendations: Record<string, TemplateRecommendation[]> = {
      technology: [
        {
          templateId: 'geometric-modern',
          score: 9.0,
          reasoning: 'Modern aesthetic matches tech industry expectations',
          bestFor: ['tech startups', 'software companies', 'IT services'],
        },
        {
          templateId: 'split-screen',
          score: 8.5,
          reasoning: 'Bold design conveys innovation and forward-thinking',
          bestFor: ['product launches', 'tech proposals'],
        },
      ],
      finance: [
        {
          templateId: 'corporate-formal',
          score: 9.2,
          reasoning: 'Professional and trustworthy appearance',
          bestFor: ['financial services', 'consulting', 'legal'],
        },
        {
          templateId: 'centered-classic',
          score: 8.8,
          reasoning: 'Traditional layout builds credibility',
          bestFor: ['banking', 'investment', 'insurance'],
        },
      ],
    };

    return (
      recommendations[industry.toLowerCase()] ||
      recommendations.technology ||
      []
    );
  }
}

// Export singleton instance
export const aiDesignAssistant = new AIDesignAssistant();
