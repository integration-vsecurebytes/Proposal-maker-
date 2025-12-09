import { MultiProviderAI, AIProvider } from './multi-provider-ai';
import sharp from 'sharp';

export interface CoverDesignVariation {
  id: string;
  name: string;
  description: string;
  templateId: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  zones: {
    logo?: any;
    title: any;
    subtitle?: any;
    date?: any;
    clientLogo?: any;
    decorative?: any[];
  };
  background: {
    type: 'solid' | 'gradient' | 'pattern' | 'image';
    value?: string;
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      colors: string[];
      angle?: number;
    };
    pattern?: string;
    opacity: number;
  };
  textSizes: {
    title: string;
    subtitle: string;
    date: string;
  };
  mood: string;
  industryFit: number;
}

export interface ImageAnalysis {
  dominantColors: string[];
  colorPalette: string[];
  mood: string;
  style: string;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedCategories: string[];
  colorTemperature: 'warm' | 'cool' | 'neutral';
  brightness: 'dark' | 'light' | 'balanced';
}

export class CoverDesignGenerator {
  private aiService: MultiProviderAI;

  constructor(private defaultProvider: AIProvider = 'gemini') {
    this.aiService = new MultiProviderAI(defaultProvider);
  }

  /**
   * Analyze uploaded image to extract design insights using AI
   */
  async analyzeImage(imagePath: string): Promise<ImageAnalysis> {
    try {
      // Extract colors using sharp
      const colorData = await this.aiService.extractColorsFromImage(imagePath);

      // Get image metadata
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const stats = await image.stats();

      // Calculate brightness
      const avgBrightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;
      const brightness = avgBrightness < 85 ? 'dark' : avgBrightness > 170 ? 'light' : 'balanced';

      // Determine complexity
      const complexity = metadata.channels && metadata.channels > 3 ? 'complex' :
                        metadata.width && metadata.width > 1920 ? 'complex' : 'moderate';

      // Determine color temperature
      const colorTemperature = this.getColorTemperature(colorData.dominant[0]);

      // Use AI to analyze the image aesthetics and suggest categories
      const prompt = `Analyze this image for cover page design:

**Image Data:**
- Colors: ${colorData.palette.join(', ')}
- Dimensions: ${metadata.width}x${metadata.height}
- Format: ${metadata.format}
- Brightness: ${brightness}
- Color Temperature: ${colorTemperature}

**Task:** Provide design analysis for business proposal cover pages.

Return analysis as JSON:
1. **mood**: Single word mood (professional, energetic, calm, bold, innovative, trustworthy, creative, elegant, modern, corporate)
2. **style**: Single word style (minimal, classic, contemporary, artistic, corporate, tech, luxury, clean)
3. **suggestedCategories**: Array of 3 template categories that match this image (from: minimal, professional, creative, modern)

Return ONLY valid JSON:
{
  "mood": "mood word",
  "style": "style word",
  "suggestedCategories": ["category1", "category2", "category3"]
}`;

      const response = await this.aiService.generateCompletion(prompt, this.defaultProvider);
      const analysis = this.parseJSONResponse(response);

      return {
        dominantColors: colorData.dominant,
        colorPalette: colorData.palette,
        mood: analysis.mood || 'professional',
        style: analysis.style || 'modern',
        complexity,
        suggestedCategories: analysis.suggestedCategories || ['professional', 'modern', 'minimal'],
        colorTemperature,
        brightness,
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Generate multiple cover design variations dynamically using AI
   */
  async generateCoverVariations(
    imageAnalysis: ImageAnalysis,
    context: {
      projectTitle: string;
      company: string;
      industry: string;
      clientName?: string;
    },
    count: number = 6
  ): Promise<CoverDesignVariation[]> {
    const prompt = `You are an expert graphic and UX designer creating business proposal cover pages.

**Context:**
- Project: ${context.projectTitle}
- Company: ${context.company}
- Industry: ${context.industry}
- Client: ${context.clientName || 'N/A'}

**Image Analysis:**
- Colors: ${imageAnalysis.colorPalette.join(', ')}
- Mood: ${imageAnalysis.mood}
- Style: ${imageAnalysis.style}
- Temperature: ${imageAnalysis.colorTemperature}
- Brightness: ${imageAnalysis.brightness}
- Suggested Categories: ${imageAnalysis.suggestedCategories.join(', ')}

**Task:** Generate ${count} completely unique, professional cover page designs.

**Page Format: A4 Size (210mm × 297mm / 8.27" × 11.69")**
- Aspect ratio: 1:1.414 (portrait orientation)
- All designs MUST be optimized for A4 paper size
- Zone positions must account for A4 proportions

**Requirements:**
1. Each design must be DISTINCT in layout, colors, fonts, and style
2. Use diverse template categories: ${imageAnalysis.suggestedCategories.join(', ')}, and others
3. Create varied zone layouts (logo, title, subtitle, date, clientLogo positions)
4. Mix background types: solid, gradient, pattern
5. Ensure WCAG AA contrast (4.5:1 minimum)
6. Use modern, professional fonts
7. Match ${context.industry} industry standards
8. CRITICAL: Design for A4 dimensions - vertical layouts work best

**For each design, provide:**

{
  "name": "Creative unique name (e.g., 'Executive Horizon', 'Bold Innovator')",
  "description": "One sentence description",
  "templateId": "unique-id-lowercase-with-hyphens",
  "category": "minimal | professional | creative | modern",
  "colors": {
    "primary": "#RRGGBB (dominant from image)",
    "secondary": "#RRGGBB (complementary)",
    "accent": "#RRGGBB (highlight)",
    "background": "#RRGGBB (page background)",
    "text": "#RRGGBB (high contrast text)"
  },
  "fonts": {
    "heading": "Professional font (Inter, Poppins, Montserrat, Playfair Display, Space Grotesk, IBM Plex Sans, etc.)",
    "body": "Readable font (Inter, Open Sans, Roboto, Lato, etc.)"
  },
  "zones": {
    "logo": { "x": 10, "y": 10, "width": 20, "height": 10, "alignment": "left" },
    "title": { "x": 10, "y": 40, "width": 80, "height": 20, "alignment": "center", "verticalAlign": "middle" },
    "subtitle": { "x": 10, "y": 65, "width": 80, "height": 10, "alignment": "center" },
    "date": { "x": 10, "y": 90, "width": 30, "height": 5, "alignment": "left" },
    "clientLogo": { "x": 70, "y": 90, "width": 20, "height": 8, "alignment": "right" }
  },
  "background": {
    "type": "solid | gradient | pattern",
    "gradient": { "type": "linear | radial | conic", "colors": ["#hex1", "#hex2"], "angle": 135 },
    "opacity": 0.1 to 1.0
  },
  "textSizes": {
    "title": "2.5rem to 4rem",
    "subtitle": "1rem to 1.5rem",
    "date": "0.875rem to 1rem"
  },
  "mood": "Design mood",
  "industryFit": 70-100
}

**IMPORTANT:**
- Vary zone positions dramatically (x, y coordinates)
- Use different alignments (left, center, right)
- Mix text sizes across designs
- Create unique gradient combinations
- All positions are percentages (0-100)

Return ONLY valid JSON array (no markdown, no code blocks):
{
  "variations": [...]
}`;

    try {
      const response = await this.aiService.generateCompletion(prompt, this.defaultProvider);
      const data = this.parseJSONResponse(response);

      if (!data.variations || !Array.isArray(data.variations)) {
        throw new Error('Invalid AI response format');
      }

      // Process and validate each variation
      return data.variations.slice(0, count).map((variation: any, index: number) => {
        const timestamp = Date.now();
        return {
          id: `cover-${timestamp}-${index}`,
          name: variation.name || `Design ${index + 1}`,
          description: variation.description || 'AI-generated professional cover design',
          templateId: variation.templateId || `ai-gen-${timestamp}-${index}`,
          category: this.validateCategory(variation.category),
          colors: {
            primary: this.validateHexColor(variation.colors?.primary, imageAnalysis.dominantColors[0]),
            secondary: this.validateHexColor(variation.colors?.secondary, imageAnalysis.colorPalette[1]),
            accent: this.validateHexColor(variation.colors?.accent, imageAnalysis.colorPalette[2]),
            background: this.validateHexColor(variation.colors?.background, '#FFFFFF'),
            text: this.validateHexColor(variation.colors?.text, '#0F172A'),
          },
          fonts: {
            heading: variation.fonts?.heading || 'Inter',
            body: variation.fonts?.body || 'Inter',
          },
          zones: variation.zones || this.generateDefaultZones(variation.category),
          background: {
            type: variation.background?.type || 'solid',
            value: variation.background?.value,
            gradient: variation.background?.gradient,
            pattern: variation.background?.pattern,
            opacity: variation.background?.opacity || 1.0,
          },
          textSizes: variation.textSizes || {
            title: '3rem',
            subtitle: '1.25rem',
            date: '0.875rem',
          },
          mood: variation.mood || imageAnalysis.mood,
          industryFit: variation.industryFit || 80,
        };
      });
    } catch (error) {
      console.error('Error generating AI variations:', error);
      throw new Error('Failed to generate cover designs. Please try again.');
    }
  }

  /**
   * Regenerate a single design variation with modifications
   */
  async regenerateVariation(
    currentDesign: CoverDesignVariation,
    modifications: string,
    imageAnalysis: ImageAnalysis
  ): Promise<CoverDesignVariation> {
    const prompt = `Modify this cover page design based on user feedback.

**Current Design:**
${JSON.stringify(currentDesign, null, 2)}

**Modifications Requested:**
${modifications}

**Image Colors:**
${imageAnalysis.colorPalette.join(', ')}

**Task:** Generate an improved version incorporating the feedback.

Return the complete updated design as JSON (same structure as current design).

Return ONLY valid JSON:
{
  "name": "...",
  "description": "...",
  ...
}`;

    const response = await this.aiService.generateCompletion(prompt, this.defaultProvider);
    const updatedDesign = this.parseJSONResponse(response);

    return {
      ...currentDesign,
      ...updatedDesign,
      id: `cover-${Date.now()}-regenerated`,
    };
  }

  /**
   * Generate zones dynamically based on category
   */
  private generateDefaultZones(category: string): any {
    const zoneLayouts: Record<string, any> = {
      minimal: {
        logo: { x: 10, y: 10, width: 20, height: 8, alignment: 'left' },
        title: { x: 10, y: 45, width: 80, height: 20, alignment: 'left', verticalAlign: 'middle' },
        subtitle: { x: 10, y: 68, width: 70, height: 10, alignment: 'left' },
        date: { x: 10, y: 88, width: 30, height: 5, alignment: 'left' },
      },
      professional: {
        logo: { x: 40, y: 15, width: 20, height: 10, alignment: 'center' },
        title: { x: 10, y: 40, width: 80, height: 25, alignment: 'center', verticalAlign: 'middle' },
        subtitle: { x: 15, y: 68, width: 70, height: 12, alignment: 'center' },
        date: { x: 35, y: 85, width: 30, height: 5, alignment: 'center' },
        clientLogo: { x: 70, y: 88, width: 20, height: 8, alignment: 'right' },
      },
      modern: {
        logo: { x: 70, y: 10, width: 25, height: 12, alignment: 'right' },
        title: { x: 10, y: 35, width: 75, height: 25, alignment: 'left', verticalAlign: 'middle' },
        subtitle: { x: 10, y: 62, width: 65, height: 12, alignment: 'left' },
        date: { x: 10, y: 90, width: 30, height: 5, alignment: 'left' },
      },
      creative: {
        logo: { x: 15, y: 75, width: 20, height: 10, alignment: 'left' },
        title: { x: 15, y: 25, width: 70, height: 30, alignment: 'left', verticalAlign: 'top' },
        subtitle: { x: 15, y: 58, width: 60, height: 12, alignment: 'left' },
        clientLogo: { x: 75, y: 85, width: 18, height: 8, alignment: 'right' },
      },
    };

    return zoneLayouts[category] || zoneLayouts.professional;
  }

  /**
   * Validate and normalize category
   */
  private validateCategory(category: any): string {
    const validCategories = ['minimal', 'professional', 'creative', 'modern'];
    if (typeof category === 'string' && validCategories.includes(category.toLowerCase())) {
      return category.toLowerCase();
    }
    return 'professional';
  }

  /**
   * Validate hex color format
   */
  private validateHexColor(color: any, fallback: string): string {
    if (typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      return color.toUpperCase();
    }
    return fallback;
  }

  /**
   * Determine color temperature from hex color
   */
  private getColorTemperature(hexColor: string): 'warm' | 'cool' | 'neutral' {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 'neutral';

    const warmness = rgb.r - rgb.b;
    if (warmness > 30) return 'warm';
    if (warmness < -30) return 'cool';
    return 'neutral';
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Parse JSON response from AI (handles markdown code blocks)
   */
  private parseJSONResponse(response: string): any {
    try {
      let cleaned = response.trim();

      // Remove markdown code blocks
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
      }

      // Remove any leading/trailing whitespace
      cleaned = cleaned.trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Response:', response.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}
