import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

export type AIProvider = 'claude' | 'gpt' | 'gemini' | 'grok';

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

export class MultiProviderAI {
  private claude: Anthropic;
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private grokOpenAI: OpenAI; // Grok uses OpenAI-compatible API
  private defaultProvider: AIProvider;

  constructor(defaultProvider: AIProvider = 'gemini') {
    this.defaultProvider = defaultProvider;

    // Initialize Claude
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    // Initialize OpenAI (ChatGPT)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Initialize Google Gemini
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

    // Initialize Grok (uses OpenAI-compatible API)
    this.grokOpenAI = new OpenAI({
      apiKey: process.env.GROK_API_KEY || process.env.XAI_API_KEY || '',
      baseURL: 'https://api.x.ai/v1',
    });
  }

  /**
   * Generate AI completion using specified provider (PUBLIC for chat endpoint)
   */
  async generateCompletion(
    prompt: string,
    provider: AIProvider = this.defaultProvider
  ): Promise<string> {
    try {
      switch (provider) {
        case 'claude':
          return await this.claudeCompletion(prompt);

        case 'gpt':
          return await this.gptCompletion(prompt);

        case 'gemini':
          return await this.geminiCompletion(prompt);

        case 'grok':
          return await this.grokCompletion(prompt);

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      // Fallback to next provider
      return await this.fallbackCompletion(prompt, provider);
    }
  }

  private async claudeCompletion(prompt: string): Promise<string> {
    const message = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Invalid Claude response');
  }

  private async gptCompletion(prompt: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async geminiCompletion(prompt: string): Promise<string> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async grokCompletion(prompt: string): Promise<string> {
    const completion = await this.grokOpenAI.chat.completions.create({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async fallbackCompletion(
    prompt: string,
    failedProvider: AIProvider
  ): Promise<string> {
    const providers: AIProvider[] = ['gemini', 'gpt', 'claude', 'grok'];
    const remainingProviders = providers.filter((p) => p !== failedProvider);

    for (const provider of remainingProviders) {
      try {
        console.log(`Falling back to ${provider}...`);
        return await this.generateCompletion(prompt, provider);
      } catch (error) {
        console.error(`Fallback ${provider} also failed:`, error);
        continue;
      }
    }

    throw new Error('All AI providers failed');
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
      const { dominant } = await image.stats();

      const dominantHex = this.rgbToHex(
        Math.round(dominant.r),
        Math.round(dominant.g),
        Math.round(dominant.b)
      );

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
   * Generate color palettes from logo
   */
  async generatePalettesFromLogo(
    logoColors: string[],
    industry: string = 'general',
    tone: string = 'professional',
    provider: AIProvider = this.defaultProvider
  ): Promise<ColorPalette[]> {
    const prompt = `You are a professional graphic designer specializing in corporate brand identity and proposal design.

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

Return ONLY valid JSON (no markdown, no code blocks):
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
}`;

    try {
      const response = await this.generateCompletion(prompt, provider);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.palettes;
      }
      throw new Error('Failed to parse response');
    } catch (error) {
      console.error('Error generating palettes:', error);
      return this.getFallbackPalettes(logoColors[0]);
    }
  }

  /**
   * Generate background designs
   */
  async generateBackground(
    params: {
      industry: string;
      tone: string;
      style: 'gradient' | 'solid';
      colorPreference?: string;
    },
    provider: AIProvider = this.defaultProvider
  ): Promise<BackgroundSuggestion> {
    const prompt = `You are a professional graphic designer creating proposal cover page backgrounds.

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

Return ONLY valid JSON (no markdown, no code blocks):
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
}`;

    try {
      const response = await this.generateCompletion(prompt, provider);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse response');
    } catch (error) {
      console.error('Error generating background:', error);
      return this.getFallbackBackground(params.style);
    }
  }

  /**
   * Critique cover page design
   */
  async critiqueDesign(
    design: {
      background: any;
      template: string;
      industry: string;
      hasLogo: boolean;
      titleLength: number;
      primaryColor: string;
      backgroundColor: string;
    },
    provider: AIProvider = this.defaultProvider
  ): Promise<DesignCritique> {
    const prompt = `You are a professional graphic designer reviewing a business proposal cover page.

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

Return ONLY valid JSON (no markdown, no code blocks):
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
}`;

    try {
      const response = await this.generateCompletion(prompt, provider);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse response');
    } catch (error) {
      console.error('Error critiquing design:', error);
      return this.getFallbackCritique();
    }
  }

  /**
   * Recommend templates
   */
  async recommendTemplates(
    proposal: {
      title: string;
      industry: string;
      tone: string;
      contentLength: number;
      hasMetrics: boolean;
      targetAudience: string;
    },
    provider: AIProvider = this.defaultProvider
  ): Promise<TemplateRecommendation[]> {
    const prompt = `You are a professional designer recommending cover page templates.

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

Return ONLY valid JSON (no markdown, no code blocks):
{
  "recommendations": [
    {
      "templateId": "template-id",
      "score": 9.2,
      "reasoning": "why this is the best fit",
      "bestFor": ["use case 1", "use case 2"]
    }
  ]
}`;

    try {
      const response = await this.generateCompletion(prompt, provider);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.recommendations;
      }
      throw new Error('Failed to parse response');
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
      ],
      finance: [
        {
          templateId: 'corporate-formal',
          score: 9.2,
          reasoning: 'Professional and trustworthy appearance',
          bestFor: ['financial services', 'consulting', 'legal'],
        },
      ],
    };

    return recommendations[industry.toLowerCase()] || recommendations.technology || [];
  }
}

// Export singleton instance (default: Gemini, with fallback chain)
export const multiProviderAI = new MultiProviderAI('gemini');
