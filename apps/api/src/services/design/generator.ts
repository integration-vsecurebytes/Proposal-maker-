import { createAIProvider } from '../../lib/ai-provider';
import { LATEST_STABLE_MODELS } from '../../lib/models';
import {
  DESIGN_CONFIG,
  DEFAULT_COLORS,
  HEADING_FONTS,
  BODY_FONTS,
  COVER_LAYOUTS,
  INDUSTRY_COLOR_HINTS,
} from '../../lib/design-config';

/**
 * AI Design Generator Service
 * Automatically generates color schemes and fonts based on proposal context
 */
export class DesignGenerator {
  private aiProvider: any;

  constructor() {
    // Use configured AI model for design generation
    const modelName = DESIGN_CONFIG.ai.model;
    const model = LATEST_STABLE_MODELS.openai[modelName] || LATEST_STABLE_MODELS.openai.gpt4o;
    this.aiProvider = createAIProvider('openai', model);
  }

  /**
   * Generate a complete design system for a proposal
   */
  async generateDesignSystem(context: {
    projectTitle: string;
    industry?: string;
    clientCompany?: string;
    projectType?: string;
  }): Promise<{
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      success: string;
      warning: string;
      error: string;
      background: string;
      surface: string;
    };
    fonts: {
      headingFont: string;
      bodyFont: string;
    };
    coverLayout: string;
  }> {
    console.log('🎨 Generating design system for:', context.projectTitle);

    const prompt = `You are a professional brand and UI designer. Generate a cohesive design system for a business proposal with the following details:

Title: ${context.projectTitle}
Industry: ${context.industry || 'General Business'}
Client: ${context.clientCompany || 'Not specified'}
Type: ${context.projectType || 'General'}

Generate a professional, modern design system that includes:

1. **Color Palette** - Choose colors that:
   - Reflect the industry and project type
   - Are professional and trustworthy
   - Have good contrast and accessibility (WCAG AA compliant)
   - Work well together

2. **Typography** - Select font pairings that:
   - Match the industry and tone
   - Are professional and readable
   - Create visual hierarchy

3. **Cover Layout** - Choose the most appropriate layout:
   - centered: Traditional, formal, professional
   - left-aligned: Modern, clean, minimalist
   - split: Dynamic, creative, bold
   - minimal: Elegant, sophisticated, simple

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "colors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "background": "#ffffff",
    "surface": "#f9fafb"
  },
  "fonts": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name"
  },
  "coverLayout": "centered|left-aligned|split|minimal",
  "reasoning": "Brief explanation of design choices"
}

Use these professional Google Fonts:
Headings: ${HEADING_FONTS.join(', ')}
Body: ${BODY_FONTS.join(', ')}`;

    try {
      const response = await this.aiProvider.generateText({
        messages: [
          {
            role: 'system',
            content: 'You are a professional brand designer. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: DESIGN_CONFIG.ai.temperature,
      });

      let content = response.trim();

      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const design = JSON.parse(content);

      console.log('✅ Generated design system:', {
        primary: design.colors.primary,
        fonts: design.fonts,
        layout: design.coverLayout,
      });

      return {
        colors: design.colors,
        fonts: design.fonts,
        coverLayout: design.coverLayout,
      };
    } catch (error) {
      console.error('❌ Design generation failed:', error);

      // Fallback to configured defaults
      return {
        colors: DEFAULT_COLORS,
        fonts: {
          headingFont: DESIGN_CONFIG.defaultFonts.heading,
          bodyFont: DESIGN_CONFIG.defaultFonts.body,
        },
        coverLayout: DESIGN_CONFIG.defaultLayout,
      };
    }
  }

  /**
   * Generate color scheme based on industry
   */
  async generateColorScheme(industry: string, mood?: string): Promise<any> {
    const prompt = `Generate a professional color scheme for a ${industry} business proposal with a ${mood || 'professional'} mood.

Return ONLY valid JSON with this structure:
{
  "primary": "#HEX",
  "secondary": "#HEX",
  "accent": "#HEX",
  "success": "#10b981",
  "warning": "#f59e0b",
  "error": "#ef4444",
  "background": "#ffffff",
  "surface": "#f9fafb"
}`;

    try {
      const response = await this.aiProvider.generateText({
        messages: [
          { role: 'system', content: 'You are a color theory expert. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      let content = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error) {
      console.error('Color generation failed:', error);
      return {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#FFB347',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        surface: '#f9fafb',
      };
    }
  }
}

export const designGenerator = new DesignGenerator();
