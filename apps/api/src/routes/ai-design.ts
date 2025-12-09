import { Router, Request, Response } from 'express';
import { multiProviderAI, type AIProvider } from '../services/ai/multi-provider-ai';
import { CoverDesignGenerator } from '../services/ai/cover-generator';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generatePalettesSchema = z.object({
  logoColors: z.array(z.string()),
  industry: z.string().optional().default('general'),
  tone: z.string().optional().default('professional'),
  provider: z.enum(['claude', 'gpt', 'gemini', 'grok']).optional().default('gemini'),
});

const generateBackgroundSchema = z.object({
  industry: z.string(),
  tone: z.string(),
  style: z.enum(['gradient', 'solid']),
  colorPreference: z.string().optional(),
  provider: z.enum(['claude', 'gpt', 'gemini', 'grok']).optional().default('gemini'),
});

const critiqueDesignSchema = z.object({
  background: z.any(),
  template: z.string(),
  industry: z.string(),
  hasLogo: z.boolean(),
  titleLength: z.number(),
  primaryColor: z.string(),
  backgroundColor: z.string(),
  provider: z.enum(['claude', 'gpt', 'gemini', 'grok']).optional().default('gemini'),
});

const recommendTemplatesSchema = z.object({
  title: z.string(),
  industry: z.string(),
  tone: z.string(),
  contentLength: z.number(),
  hasMetrics: z.boolean(),
  targetAudience: z.string(),
  provider: z.enum(['claude', 'gpt', 'gemini', 'grok']).optional().default('gemini'),
});

/**
 * POST /api/ai-design/palettes
 * Generate color palettes from logo colors
 */
router.post('/palettes', async (req: Request, res: Response) => {
  try {
    const validated = generatePalettesSchema.parse(req.body);

    const palettes = await multiProviderAI.generatePalettesFromLogo(
      validated.logoColors,
      validated.industry,
      validated.tone,
      validated.provider
    );

    res.json({
      palettes,
      provider: validated.provider,
      fallbackUsed: false,
    });
  } catch (error: any) {
    console.error('Error generating palettes:', error);

    // Try fallback to ChatGPT if Gemini fails
    if (req.body.provider === 'gemini') {
      try {
        const validated = generatePalettesSchema.parse({
          ...req.body,
          provider: 'gpt',
        });

        const palettes = await multiProviderAI.generatePalettesFromLogo(
          validated.logoColors,
          validated.industry,
          validated.tone,
          'gpt'
        );

        return res.json({
          palettes,
          provider: 'gpt',
          fallbackUsed: true,
          originalProvider: 'gemini',
        });
      } catch (fallbackError) {
        console.error('Fallback to ChatGPT also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to generate palettes',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/background
 * Generate background design
 */
router.post('/background', async (req: Request, res: Response) => {
  try {
    const validated = generateBackgroundSchema.parse(req.body);

    const background = await multiProviderAI.generateBackground(
      {
        industry: validated.industry,
        tone: validated.tone,
        style: validated.style,
        colorPreference: validated.colorPreference,
      },
      validated.provider
    );

    res.json({
      background,
      provider: validated.provider,
      fallbackUsed: false,
    });
  } catch (error: any) {
    console.error('Error generating background:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const validated = generateBackgroundSchema.parse({
          ...req.body,
          provider: 'gpt',
        });

        const background = await multiProviderAI.generateBackground(
          {
            industry: validated.industry,
            tone: validated.tone,
            style: validated.style,
            colorPreference: validated.colorPreference,
          },
          'gpt'
        );

        return res.json({
          background,
          provider: 'gpt',
          fallbackUsed: true,
          originalProvider: 'gemini',
        });
      } catch (fallbackError) {
        console.error('Fallback to ChatGPT also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to generate background',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/critique
 * Critique cover page design
 */
router.post('/critique', async (req: Request, res: Response) => {
  try {
    const validated = critiqueDesignSchema.parse(req.body);

    const critique = await multiProviderAI.critiqueDesign(
      {
        background: validated.background,
        template: validated.template,
        industry: validated.industry,
        hasLogo: validated.hasLogo,
        titleLength: validated.titleLength,
        primaryColor: validated.primaryColor,
        backgroundColor: validated.backgroundColor,
      },
      validated.provider
    );

    res.json({
      critique,
      provider: validated.provider,
      fallbackUsed: false,
    });
  } catch (error: any) {
    console.error('Error critiquing design:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const validated = critiqueDesignSchema.parse({
          ...req.body,
          provider: 'gpt',
        });

        const critique = await multiProviderAI.critiqueDesign(
          {
            background: validated.background,
            template: validated.template,
            industry: validated.industry,
            hasLogo: validated.hasLogo,
            titleLength: validated.titleLength,
            primaryColor: validated.primaryColor,
            backgroundColor: validated.backgroundColor,
          },
          'gpt'
        );

        return res.json({
          critique,
          provider: 'gpt',
          fallbackUsed: true,
          originalProvider: 'gemini',
        });
      } catch (fallbackError) {
        console.error('Fallback to ChatGPT also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to critique design',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/recommend-templates
 * Recommend best templates for proposal
 */
router.post('/recommend-templates', async (req: Request, res: Response) => {
  try {
    const validated = recommendTemplatesSchema.parse(req.body);

    const recommendations = await multiProviderAI.recommendTemplates(
      {
        title: validated.title,
        industry: validated.industry,
        tone: validated.tone,
        contentLength: validated.contentLength,
        hasMetrics: validated.hasMetrics,
        targetAudience: validated.targetAudience,
      },
      validated.provider
    );

    res.json({
      recommendations,
      provider: validated.provider,
      fallbackUsed: false,
    });
  } catch (error: any) {
    console.error('Error recommending templates:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const validated = recommendTemplatesSchema.parse({
          ...req.body,
          provider: 'gpt',
        });

        const recommendations = await multiProviderAI.recommendTemplates(
          {
            title: validated.title,
            industry: validated.industry,
            tone: validated.tone,
            contentLength: validated.contentLength,
            hasMetrics: validated.hasMetrics,
            targetAudience: validated.targetAudience,
          },
          'gpt'
        );

        return res.json({
          recommendations,
          provider: 'gpt',
          fallbackUsed: true,
          originalProvider: 'gemini',
        });
      } catch (fallbackError) {
        console.error('Fallback to ChatGPT also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to recommend templates',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/analyze-logo
 * Extract colors from logo image
 */
router.post('/analyze-logo', async (req: Request, res: Response) => {
  try {
    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json({ error: 'logoUrl is required' });
    }

    // For now, return mock data
    // In production, download the image and analyze it
    const colors = await multiProviderAI.extractColorsFromImage(logoUrl);

    res.json({
      dominantColors: colors.dominant,
      palette: colors.palette,
    });
  } catch (error: any) {
    console.error('Error analyzing logo:', error);
    res.status(500).json({
      error: 'Failed to analyze logo',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/chat
 * Chat with AI design assistant
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, context, provider = 'gemini' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build system prompt for design assistant
    const systemPrompt = `You are an expert graphic designer and brand consultant helping users create professional business proposals. You provide:
- Design advice (colors, layouts, typography)
- Template recommendations
- Branding suggestions
- Accessibility guidance
- Industry-specific design best practices

Keep responses concise (2-3 sentences) and actionable. Be friendly and professional.

${context ? `\n\nCurrent Context:\n${JSON.stringify(context, null, 2)}` : ''}`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

    // Use multi-provider AI
    const response = await multiProviderAI['generateCompletion' as any](
      fullPrompt,
      provider as any
    );

    res.json({
      response: response.trim(),
      provider,
    });
  } catch (error: any) {
    console.error('Error in AI chat:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const { message, context } = req.body;
        const systemPrompt = `You are an expert graphic designer helping users design business proposals. Keep responses concise and actionable.${
          context ? `\n\nContext: ${JSON.stringify(context)}` : ''
        }`;
        const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

        const response = await multiProviderAI['generateCompletion' as any](
          fullPrompt,
          'gpt'
        );

        return res.json({
          response: response.trim(),
          provider: 'gpt',
          fallbackUsed: true,
        });
      } catch (fallbackError) {
        console.error('Fallback to ChatGPT also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/layout-suggestions
 * Get AI-powered layout suggestions for content
 */
router.post('/layout-suggestions', async (req: Request, res: Response) => {
  try {
    const { content, contentType, visualDensity, provider = 'gemini' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const response = await multiProviderAI.generateCompletion(
      `You are a professional graphic designer analyzing content for optimal layout.

**Content Type**: ${contentType || 'general'}
**Target Visual Density**: ${visualDensity || '40-60%'}
**Content**: ${content.substring(0, 500)}...

**Task**: Suggest the best visual layout for this content.

Provide suggestions in this JSON format (no markdown):
{
  "layout": "single-column" | "two-column" | "grid" | "card-based",
  "visualElements": [
    {"type": "chart" | "icon" | "image" | "diagram", "placement": "top" | "side" | "inline", "reasoning": "why"}
  ],
  "spacing": "compact" | "comfortable" | "spacious",
  "hierarchy": {"primary": "title placement", "secondary": "content placement"},
  "reasoning": "overall layout rationale"
}`,
      provider as any
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return res.json({
        suggestions,
        provider,
      });
    }

    throw new Error('Failed to parse AI response');
  } catch (error: any) {
    console.error('Error getting layout suggestions:', error);

    // Fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const { content, contentType, visualDensity } = req.body;
        const response = await multiProviderAI.generateCompletion(
          `Suggest optimal layout for this content (${contentType}): ${content.substring(
            0,
            300
          )}. Return JSON with layout, visualElements, spacing, reasoning.`,
          'gpt'
        );

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return res.json({
            suggestions,
            provider: 'gpt',
            fallbackUsed: true,
          });
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to get layout suggestions',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai-design/status
 * Check AI provider status and availability
 */
router.get('/status', async (req: Request, res: Response) => {
  const providers = {
    gemini: {
      available: !!process.env.GOOGLE_API_KEY,
      name: 'Google Gemini 2.0 Flash',
      isPrimary: true,
    },
    gpt: {
      available: !!process.env.OPENAI_API_KEY,
      name: 'OpenAI GPT-4 Turbo',
      isPrimary: false,
      isFallback: true,
    },
    claude: {
      available: !!process.env.ANTHROPIC_API_KEY,
      name: 'Claude 3.5 Sonnet',
      isPrimary: false,
    },
    grok: {
      available: !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
      name: 'Grok Beta (xAI)',
      isPrimary: false,
    },
  };

  const availableProviders = Object.entries(providers)
    .filter(([_, config]) => config.available)
    .map(([key, _]) => key);

  res.json({
    providers,
    availableProviders,
    primaryProvider: 'gemini',
    fallbackChain: ['gemini', 'gpt', 'claude', 'grok'],
    message:
      availableProviders.length === 0
        ? 'No AI providers configured. Please add API keys.'
        : `${availableProviders.length} provider(s) available`,
  });
});

/**
 * GET /api/ai-design/color-options
 * Get dynamic industries, moods, and quick prompts
 */
router.get('/color-options', async (req: Request, res: Response) => {
  try {
    const { provider = 'gemini' } = req.query;

    const prompt = `You are a brand and design expert. Generate helpful options for color scheme generation.

**Task**: Provide dynamic options for users creating color schemes.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "industries": [
    {"id": "technology", "label": "Technology", "description": "Software, apps, IT services, and tech companies", "examples": ["SaaS", "AI", "Cloud"]},
    {"id": "finance", "label": "Finance", "description": "Banks, investment, fintech", "examples": ["Banking", "Trading", "Insurance"]},
    ... (generate 15 diverse industries)
  ],
  "moods": [
    {"id": "professional", "label": "Professional", "description": "Trustworthy and corporate", "colorHints": ["blues", "grays"]},
    {"id": "modern", "label": "Modern", "description": "Contemporary and fresh", "colorHints": ["bright", "clean"]},
    ... (generate 12 diverse moods)
  ],
  "quickPrompts": [
    {"text": "Modern AI startup building developer tools", "industry": "technology", "mood": "modern"},
    {"text": "Luxury hotel with spa and wellness services", "industry": "hospitality", "mood": "elegant"},
    ... (generate 10 diverse quick prompts covering different industries)
  ]
}

Make it comprehensive and useful for diverse use cases.`;

    const response = await multiProviderAI.generateCompletion(prompt, provider as any);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return res.json(data);
    }

    throw new Error('Failed to parse AI response');
  } catch (error: any) {
    console.error('Error fetching color options:', error);

    // Return fallback static options if AI fails
    res.json({
      industries: [
        {
          id: 'technology',
          label: 'Technology',
          description: 'Software, apps, and tech',
          examples: ['SaaS', 'AI', 'Cloud'],
        },
        {
          id: 'finance',
          label: 'Finance',
          description: 'Banking and financial services',
          examples: ['Banking', 'Trading'],
        },
        {
          id: 'healthcare',
          label: 'Healthcare',
          description: 'Medical and wellness',
          examples: ['Hospitals', 'Clinics'],
        },
      ],
      moods: [
        {
          id: 'professional',
          label: 'Professional',
          description: 'Trustworthy and corporate',
          colorHints: ['blues', 'grays'],
        },
        {
          id: 'modern',
          label: 'Modern',
          description: 'Contemporary and fresh',
          colorHints: ['bright', 'clean'],
        },
      ],
      quickPrompts: [
        {
          text: 'Modern tech startup with innovation focus',
          industry: 'technology',
          mood: 'modern',
        },
        { text: 'Luxury hotel with spa services', industry: 'hospitality', mood: 'elegant' },
      ],
      fallback: true,
    });
  }
});

/**
 * POST /api/ai-design/generate-color-scheme
 * Generate complete color schemes based on brand description
 */
router.post('/generate-color-scheme', async (req: Request, res: Response) => {
  try {
    const { prompt, industry, mood, provider = 'gemini' } = req.body;

    if (!prompt && !industry) {
      return res.status(400).json({ error: 'prompt or industry is required' });
    }

    const fullPrompt = `You are a professional color designer and brand strategist.

**Task**: Generate 3 professional color schemes for:
${prompt ? `Description: ${prompt}` : ''}
Industry: ${industry}
Mood/Tone: ${mood}

For each color scheme, provide:
1. **name**: Creative, descriptive name
2. **description**: Brief explanation (1 sentence)
3. **primary**: Main brand color (hex)
4. **secondary**: Complementary color (hex)
5. **accent**: Highlight/CTA color (hex)
6. **success**: Success state color (hex, green tones)
7. **warning**: Warning state color (hex, yellow/orange tones)
8. **error**: Error state color (hex, red tones)
9. **background**: Page background (hex, usually white or very light)
10. **surface**: Card/surface background (hex, slightly darker than background)
11. **text**: Primary text color (hex, high contrast with background)
12. **textSecondary**: Secondary text color (hex, medium contrast)
13. **harmony**: Color harmony used ("complementary" | "analogous" | "triadic" | "monochromatic")
14. **reasoning**: Why these colors work (2-3 sentences)
15. **useCases**: Array of 3-5 use cases

**Requirements:**
- Ensure WCAG AA contrast compliance (4.5:1 for text)
- Use professional, business-appropriate colors
- Consider color psychology for the industry
- Create visually harmonious combinations
- All hex codes must be uppercase (e.g., #FF5733)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "schemes": [
    {
      "name": "scheme name",
      "description": "brief description",
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "success": "#22C55E",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "background": "#FFFFFF",
      "surface": "#F9FAFB",
      "text": "#1F2937",
      "textSecondary": "#6B7280",
      "harmony": "complementary",
      "reasoning": "explanation",
      "useCases": ["use1", "use2", "use3"],
      "accessibility": {
        "wcagCompliant": true,
        "contrastRatios": {
          "primaryOnBackground": 4.8,
          "textOnBackground": 12.5
        }
      }
    }
  ]
}`;

    const response = await multiProviderAI.generateCompletion(fullPrompt, provider as any);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return res.json({
        schemes: data.schemes || [],
        provider,
      });
    }

    throw new Error('Failed to parse AI response');
  } catch (error: any) {
    console.error('Error generating color scheme:', error);

    // Fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const { prompt, industry, mood } = req.body;
        const fallbackPrompt = `Generate 3 professional color schemes for ${industry} industry with ${mood} mood. ${
          prompt ? `Description: ${prompt}` : ''
        }. Return JSON with schemes array containing name, colors, reasoning.`;

        const response = await multiProviderAI.generateCompletion(fallbackPrompt, 'gpt');
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return res.json({
            schemes: data.schemes || [],
            provider: 'gpt',
            fallbackUsed: true,
          });
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to generate color scheme',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai-design/analyze-cover-image
 * Analyze uploaded image for cover page design insights
 */
router.post('/analyze-cover-image', async (req: Request, res: Response) => {
  try {
    const { imagePath, provider = 'gemini' } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    const generator = new CoverDesignGenerator(provider as AIProvider);
    const analysis = await generator.analyzeImage(imagePath);

    res.json({
      analysis,
      provider,
      success: true,
    });
  } catch (error: any) {
    console.error('Error analyzing cover image:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const generator = new CoverDesignGenerator('gpt');
        const analysis = await generator.analyzeImage(req.body.imagePath);

        return res.json({
          analysis,
          provider: 'gpt',
          fallbackUsed: true,
          success: true,
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message,
      success: false,
    });
  }
});

/**
 * POST /api/ai-design/generate-covers
 * Generate multiple cover design variations using AI
 */
router.post('/generate-covers', async (req: Request, res: Response) => {
  try {
    const {
      imagePath,
      projectTitle,
      company,
      industry,
      clientName,
      count = 6,
      provider = 'gemini',
    } = req.body;

    // Validate required fields
    if (!imagePath) {
      return res.status(400).json({ error: 'imagePath is required' });
    }
    if (!projectTitle || !industry) {
      return res.status(400).json({
        error: 'projectTitle and industry are required',
      });
    }

    const generator = new CoverDesignGenerator(provider as AIProvider);

    // First, analyze the image
    const analysis = await generator.analyzeImage(imagePath);

    // Then generate cover variations
    const variations = await generator.generateCoverVariations(
      analysis,
      {
        projectTitle,
        company: company || 'Professional Services', // Provide default if empty
        industry,
        clientName,
      },
      count
    );

    res.json({
      variations,
      analysis,
      provider,
      count: variations.length,
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating covers:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const generator = new CoverDesignGenerator('gpt');
        const analysis = await generator.analyzeImage(req.body.imagePath);
        const variations = await generator.generateCoverVariations(
          analysis,
          {
            projectTitle: req.body.projectTitle,
            company: req.body.company || 'Professional Services',
            industry: req.body.industry,
            clientName: req.body.clientName,
          },
          req.body.count || 6
        );

        return res.json({
          variations,
          analysis,
          provider: 'gpt',
          fallbackUsed: true,
          count: variations.length,
          success: true,
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to generate cover designs',
      message: error.message,
      success: false,
    });
  }
});

/**
 * POST /api/ai-design/regenerate-cover
 * Regenerate a single cover design with modifications
 */
router.post('/regenerate-cover', async (req: Request, res: Response) => {
  try {
    const { currentDesign, modifications, imageAnalysis, provider = 'gemini' } = req.body;

    if (!currentDesign) {
      return res.status(400).json({ error: 'currentDesign is required' });
    }
    if (!modifications) {
      return res.status(400).json({ error: 'modifications is required' });
    }
    if (!imageAnalysis) {
      return res.status(400).json({ error: 'imageAnalysis is required' });
    }

    const generator = new CoverDesignGenerator(provider as AIProvider);
    const updatedDesign = await generator.regenerateVariation(
      currentDesign,
      modifications,
      imageAnalysis
    );

    res.json({
      design: updatedDesign,
      provider,
      success: true,
    });
  } catch (error: any) {
    console.error('Error regenerating cover:', error);

    // Try fallback to ChatGPT
    if (req.body.provider === 'gemini') {
      try {
        const generator = new CoverDesignGenerator('gpt');
        const updatedDesign = await generator.regenerateVariation(
          req.body.currentDesign,
          req.body.modifications,
          req.body.imageAnalysis
        );

        return res.json({
          design: updatedDesign,
          provider: 'gpt',
          fallbackUsed: true,
          success: true,
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    res.status(500).json({
      error: 'Failed to regenerate cover design',
      message: error.message,
      success: false,
    });
  }
});

export default router;
