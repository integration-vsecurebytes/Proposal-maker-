import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import JSZip from 'jszip';

/**
 * AI-Powered Template Design Extractor
 * Uses latest 2025 AI models to intelligently extract design elements
 *
 * CURRENT MODELS (2025):
 * =====================
 * Image Analysis: gemini-2.0-flash ✅
 *   - Fast + excellent images
 *   - Best for real-time apps
 *   - Superior logo detection
 *
 * Document Structure: gpt-4o ✅
 *   - Best for mixed text + image generation
 *   - Excellent structured data extraction
 *   - JSON output support
 *
 * MODEL OPTIONS (can be swapped):
 * ================================
 * For Image Analysis (Gemini):
 *   - gemini-2.0-flash      ✅ Current - Fast + excellent images, best for real-time apps
 *   - gemini-2.0-pro        - Best for high-quality images + reasoning
 *   - gpt-4o                - Best for mixed text + image generation
 *   - gpt-4o-mini           - Super-fast, cheaper, very good visuals
 *
 * For Structure Analysis (OpenAI):
 *   - gpt-4o                ✅ Current - Best for mixed text + images
 *   - gpt-4o-mini           - Super-fast, cheaper, very good visuals
 */
export class AITemplateExtractor {
  private gemini: GoogleGenerativeAI;
  private openai: OpenAI;

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Extract design elements using AI
   */
  async extractDesignWithAI(filePath: string): Promise<{
    schema: any;
    styles: any;
    assets: any;
    aiAnalysis: any;
  }> {
    console.log('🤖 Starting AI-powered design extraction...');

    // Read DOCX file
    const buffer = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(buffer);

    // Step 1: Extract all images from DOCX
    const images = await this.extractAllImages(zip);
    console.log(`📸 Found ${images.length} images in document`);

    // Step 2: Use Gemini Vision to analyze images and identify logos
    const imageAnalysis = await this.analyzeImagesWithGemini(images);
    console.log('🔍 Gemini image analysis complete');

    // Step 3: Extract colors and styles from document
    const stylesData = await this.extractStylesData(zip);

    // Step 4: Use GPT-4 to analyze document structure and content
    const documentAnalysis = await this.analyzeDocumentStructure(zip);
    console.log('📄 Document structure analysis complete');

    // Step 5: Combine AI analyses to create template
    const designElements = await this.combineAIAnalyses(
      imageAnalysis,
      stylesData,
      documentAnalysis
    );

    return {
      schema: designElements.schema,
      styles: designElements.styles,
      assets: designElements.assets,
      aiAnalysis: {
        imageAnalysis,
        documentAnalysis,
        confidence: designElements.confidence,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract all images from DOCX
   */
  private async extractAllImages(zip: JSZip): Promise<Array<{
    name: string;
    data: Buffer;
    base64: string;
    mimeType: string;
  }>> {
    const images: Array<{
      name: string;
      data: Buffer;
      base64: string;
      mimeType: string;
    }> = [];

    const mediaFolder = zip.folder('word/media');
    if (!mediaFolder) {
      return images;
    }

    for (const [filename, file] of Object.entries(mediaFolder.files)) {
      if (file.dir) continue;

      const extension = path.extname(filename).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp'].includes(extension)) {
        const data = await file.async('nodebuffer');
        const mimeType = this.getMimeType(extension);
        const base64 = data.toString('base64');

        images.push({
          name: filename,
          data,
          base64: `data:${mimeType};base64,${base64}`,
          mimeType,
        });
      }
    }

    return images;
  }

  /**
   * Use Gemini Vision to analyze images and identify logos
   */
  private async analyzeImagesWithGemini(images: Array<{
    name: string;
    data: Buffer;
    base64: string;
    mimeType: string;
  }>): Promise<{
    companyLogo: { image: any; confidence: number } | null;
    headerLogo: { image: any; confidence: number } | null;
    footerLogo: { image: any; confidence: number } | null;
    coverImage: { image: any; confidence: number } | null;
    decorativeImages: any[];
  }> {
    if (images.length === 0) {
      return {
        companyLogo: null,
        headerLogo: null,
        footerLogo: null,
        coverImage: null,
        decorativeImages: [],
      };
    }

    try {
      // Use Gemini 2.0 Flash - Fast + excellent images, best for real-time apps (2025)
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are an expert at analyzing business documents and identifying different types of images intelligently.

ANALYZE ALL IMAGES CAREFULLY and classify each one by TYPE and LOCATION:

**IMAGE TYPES TO IDENTIFY**:
1. **company_logo** - Main company/brand logo (usually on cover page, header, or footer)
2. **header_logo** - Logo specifically in document header (might be smaller, watermark-style)
3. **footer_logo** - Logo specifically in document footer (might be smaller, text-based)
4. **cover_image** - Large professional photo/graphic on cover page (hero image, background)
5. **thank_you_slide** - Final slide/image saying "Thank You" or "Questions?"
6. **chart** - Bar charts, pie charts, line graphs, data visualizations
7. **diagram** - Flowcharts, architecture diagrams, process diagrams
8. **photo** - Professional photos (team, office, products)
9. **icon** - Small decorative icons or symbols
10. **decorative** - Background patterns, dividers, shapes

**IMPORTANT CLASSIFICATION RULES**:
- **Look for LOGOS in MULTIPLE locations**: Check if same logo appears in header, footer, AND cover page
- **Company logos** are usually professional, clean brand marks with company name or symbol
- **Header/Footer logos** are often smaller versions or watermarks of the main logo
- **Cover images** are large, full-width hero images or backgrounds on the first page
- **Thank you slides** typically have text like "Thank You", "Questions?", or contact information
- **Charts** have axes, data points, legends (bars, pies, lines)
- **Diagrams** show workflows, systems, or processes with boxes and arrows
- **Photos** are realistic images of people, places, or products

**FOR EACH IMAGE, EXTRACT**:
1. **type** - One of the types above (company_logo, header_logo, etc.)
2. **location** - Where in document: "header", "footer", "cover_page", "body", "end_slide"
3. **confidence** - 0-100 (how certain you are about this classification)
4. **description** - Brief, clear description of what the image shows
5. **placement** - How the image should be positioned:
   - position: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"
   - alignment: "left" | "center" | "right"
   - repeatsOnPages: "all" | "first_only" | "last_only" | "none" (for headers/footers)
   - size: "small" | "medium" | "large" | "full-width" (relative size in document)
6. **characteristics**:
   - hasText: true/false (does it contain visible text?)
   - dominantColors: ["#HEX", "#HEX"] (extract actual colors you see)
   - isSimple: true/false (is it simple/minimal or complex/detailed?)
   - isProfessional: true/false (does it look professional/business-appropriate?)
   - textContent: "..." (if hasText is true, what does the text say?)

**RETURN VALID JSON ARRAY**:
[
  {
    "index": 0,
    "filename": "image1.png",
    "type": "company_logo",
    "location": "cover_page",
    "confidence": 95,
    "description": "Company logo with blue gradient and text 'TechCorp'",
    "placement": {
      "position": "top-left",
      "alignment": "left",
      "repeatsOnPages": "none",
      "size": "medium"
    },
    "characteristics": {
      "hasText": true,
      "textContent": "TechCorp",
      "dominantColors": ["#0066CC", "#FFFFFF"],
      "isSimple": true,
      "isProfessional": true
    }
  },
  {
    "index": 1,
    "filename": "image2.png",
    "type": "header_logo",
    "location": "header",
    "confidence": 90,
    "description": "Smaller watermark version of company logo",
    "placement": {
      "position": "top-right",
      "alignment": "right",
      "repeatsOnPages": "all",
      "size": "small"
    },
    "characteristics": {
      "hasText": true,
      "textContent": "TechCorp",
      "dominantColors": ["#0066CC"],
      "isSimple": true,
      "isProfessional": true
    }
  },
  {
    "index": 2,
    "filename": "image3.jpg",
    "type": "cover_image",
    "location": "cover_page",
    "confidence": 88,
    "description": "Professional office workspace with modern technology and team collaboration",
    "placement": {
      "position": "center",
      "alignment": "center",
      "repeatsOnPages": "first_only",
      "size": "full-width"
    },
    "characteristics": {
      "hasText": false,
      "dominantColors": ["#2C3E50", "#FFFFFF", "#3498DB"],
      "isSimple": false,
      "isProfessional": true
    }
  },
  {
    "index": 3,
    "filename": "image4.png",
    "type": "thank_you_slide",
    "location": "end_slide",
    "confidence": 92,
    "description": "Thank you slide with contact information",
    "placement": {
      "position": "center",
      "alignment": "center",
      "repeatsOnPages": "last_only",
      "size": "full-width"
    },
    "characteristics": {
      "hasText": true,
      "textContent": "Thank You! Contact: info@techcorp.com",
      "dominantColors": ["#0066CC", "#FFFFFF"],
      "isSimple": true,
      "isProfessional": true
    }
  }
]

**BE THOROUGH**: Analyze each image carefully and provide accurate classifications with high confidence scores.`;

      const imageParts = images.slice(0, 10).map((img, index) => ({
        inlineData: {
          data: img.base64.split(',')[1],
          mimeType: img.mimeType,
        },
      }));

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = result.response.text();

      console.log('🤖 Gemini raw response:', response);

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('⚠️ Could not parse Gemini response as JSON, using simple logic');
        return this.fallbackImageClassification(images);
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Map analysis to image structure with new types
      const companyLogo = analysis.find((a: any) => a.type === 'company_logo');
      const headerLogo = analysis.find((a: any) => a.type === 'header_logo');
      const footerLogo = analysis.find((a: any) => a.type === 'footer_logo');
      const coverImage = analysis.find((a: any) => a.type === 'cover_image');
      const thankYouSlide = analysis.find((a: any) => a.type === 'thank_you_slide');

      return {
        companyLogo: companyLogo
          ? {
              image: images[companyLogo.index],
              confidence: companyLogo.confidence,
              location: companyLogo.location,
              description: companyLogo.description
            }
          : null,
        headerLogo: headerLogo
          ? {
              image: images[headerLogo.index],
              confidence: headerLogo.confidence,
              location: headerLogo.location,
              description: headerLogo.description
            }
          : null,
        footerLogo: footerLogo
          ? {
              image: images[footerLogo.index],
              confidence: footerLogo.confidence,
              location: footerLogo.location,
              description: footerLogo.description
            }
          : null,
        coverImage: coverImage
          ? {
              image: images[coverImage.index],
              confidence: coverImage.confidence,
              location: coverImage.location,
              description: coverImage.description
            }
          : null,
        thankYouSlide: thankYouSlide
          ? {
              image: images[thankYouSlide.index],
              confidence: thankYouSlide.confidence,
              location: thankYouSlide.location,
              description: thankYouSlide.description
            }
          : null,
        decorativeImages: analysis
          .filter((a: any) => !['company_logo', 'header_logo', 'footer_logo', 'cover_image', 'thank_you_slide'].includes(a.type))
          .map((a: any) => ({
            image: images[a.index],
            type: a.type,
            location: a.location,
            description: a.description,
            characteristics: a.characteristics,
          })),
      };
    } catch (error) {
      console.error('❌ Gemini image analysis failed:', error);
      return this.fallbackImageClassification(images);
    }
  }

  /**
   * Fallback image classification using simple logic
   */
  private fallbackImageClassification(images: any[]) {
    return {
      companyLogo: images[0] ? { image: images[0], confidence: 50 } : null,
      headerLogo: images[0] ? { image: images[0], confidence: 50 } : null,
      footerLogo: images[0] ? { image: images[0], confidence: 50 } : null,
      coverImage: images[1] ? { image: images[1], confidence: 50 } : null,
      decorativeImages: images.slice(2).map((img) => ({
        image: img,
        type: 'decorative',
        description: 'Additional image',
      })),
    };
  }

  /**
   * Extract styles data from DOCX
   */
  private async extractStylesData(zip: JSZip): Promise<any> {
    const styles: any = {
      colors: [],
      fonts: [],
      rawXml: '',
    };

    try {
      // Extract theme colors
      const themeFile = zip.file('word/theme/theme1.xml');
      if (themeFile) {
        const themeXml = await themeFile.async('string');
        styles.rawXml += themeXml;

        // Extract colors from theme
        const colorMatches = themeXml.matchAll(/<a:srgbClr val="([A-F0-9]{6})"/gi);
        for (const match of colorMatches) {
          styles.colors.push(`#${match[1]}`);
        }
      }

      // Extract styles
      const stylesFile = zip.file('word/styles.xml');
      if (stylesFile) {
        const stylesXml = await stylesFile.async('string');
        styles.rawXml += stylesXml;

        // Extract fonts
        const fontMatches = stylesXml.matchAll(/<w:rFonts[^>]*w:ascii="([^"]+)"/gi);
        for (const match of fontMatches) {
          if (!styles.fonts.includes(match[1])) {
            styles.fonts.push(match[1]);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting styles:', error);
    }

    return styles;
  }

  /**
   * Analyze document structure, colors, and fonts using GPT-4o
   */
  private async analyzeDocumentStructure(zip: JSZip): Promise<any> {
    try {
      const documentFile = zip.file('word/document.xml');
      const stylesFile = zip.file('word/styles.xml');
      const themeFile = zip.file('word/theme/theme1.xml');

      if (!documentFile) {
        return { sections: [], structure: 'unknown', colors: [], fonts: [] };
      }

      const documentXml = await documentFile.async('string');
      const stylesXml = stylesFile ? await stylesFile.async('string') : '';
      const themeXml = themeFile ? await themeFile.async('string') : '';

      // Combine XML for comprehensive analysis
      const combinedXml = `
=== DOCUMENT STRUCTURE ===
${documentXml.substring(0, 4000)}

=== STYLES ===
${stylesXml.substring(0, 2000)}

=== THEME ===
${themeXml.substring(0, 2000)}
`;

      // Use GPT-4o - Best for mixed text + structured data extraction (2025)
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing Microsoft Word documents and extracting complete document structure, design, and content.

**YOUR TASK**: Perform COMPREHENSIVE analysis and extraction of:

1. **Complete Document Structure** (EXTRACT EVERYTHING - INCLUDING ALL SUBSECTIONS):
   - Document type: proposal, report, invoice, contract, letter, presentation, etc.
   - **EVERY SINGLE SECTION AND SUBSECTION** - Don't miss any!
   - Section hierarchy with proper parent-child relationships
   - Section types: cover_page, executive_summary, company_overview, scope_of_work, timeline, pricing, terms, signature_block, appendix, thank_you_page
   - **CRITICAL**: Extract ALL heading levels (H1, H2, H3, H4) as separate sections with proper nesting

2. **Color Scheme** (INTELLIGENTLY IDENTIFY):
   - **Primary color**: The MAIN brand color (used for headings, key elements)
   - **Secondary color**: Supporting brand color (used for subheadings, accents)
   - **Accent color**: Highlight color (used for call-to-action, emphasis)
   - **All colors**: Complete list of hex colors found in theme/styles
   - **Context**: Where each color is used (headings, body, backgrounds, borders)

3. **Typography** (COMPLETE FONT ANALYSIS):
   - **Heading font**: Font used for H1, H2, titles
   - **Body font**: Font used for paragraphs, normal text
   - **Font sizes**: Exact sizes for title, heading1, heading2, heading3, body
   - **Font weights**: bold, normal, light

4. **Design Style & Tone**:
   - **Tone**: professional, casual, formal, friendly
   - **Aesthetic**: modern, traditional, minimal, corporate
   - **Colorfulness**: vibrant, balanced, minimal
   - **Industry**: IT, finance, healthcare, consulting, etc. (infer from content)

**RETURN VALID JSON** with this EXACT structure:
{
  "structure": "proposal|report|invoice|contract|letter|presentation",
  "industry": "IT|Finance|Healthcare|Consulting|etc",
  "sections": [
    {
      "id": "cover_page",
      "name": "Cover Page",
      "type": "cover_page",
      "level": 0,
      "order": 1,
      "parentId": null,
      "description": "Document cover with title and company branding",
      "contentSummary": "Brief summary of what this section contains",
      "hasImages": true,
      "hasTable": false
    },
    {
      "id": "executive_summary",
      "name": "Executive Summary",
      "type": "executive_summary",
      "level": 1,
      "order": 2,
      "parentId": null,
      "description": "High-level overview of the proposal",
      "contentSummary": "Summary of proposal purpose and key benefits",
      "hasImages": false,
      "hasTable": false
    },
    {
      "id": "company_overview",
      "name": "Company Overview",
      "type": "company_overview",
      "level": 1,
      "order": 3,
      "parentId": null,
      "description": "Information about the proposing company",
      "contentSummary": "Company history, expertise, and credentials",
      "hasImages": true,
      "hasTable": false
    },
    {
      "id": "company_overview_history",
      "name": "Our History",
      "type": "subsection",
      "level": 2,
      "order": 4,
      "parentId": "company_overview",
      "description": "Company founding and evolution",
      "contentSummary": "History of company growth",
      "hasImages": false,
      "hasTable": false
    },
    {
      "id": "company_overview_expertise",
      "name": "Areas of Expertise",
      "type": "subsection",
      "level": 2,
      "order": 5,
      "parentId": "company_overview",
      "description": "Core competencies and specializations",
      "contentSummary": "List of expertise areas",
      "hasImages": false,
      "hasTable": true
    }
  ],
  "colors": {
    "primary": "#0066CC",
    "primaryUsage": "headings, key elements, brand color",
    "secondary": "#3399FF",
    "secondaryUsage": "subheadings, supporting elements",
    "accent": "#27AE60",
    "accentUsage": "call-to-action, highlights, success indicators",
    "allColors": ["#0066CC", "#3399FF", "#27AE60", "#FFFFFF", "#2C3E50", "#ECF0F1"]
  },
  "fonts": {
    "heading": "Calibri Light",
    "body": "Calibri",
    "sizes": {
      "title": "28pt",
      "heading1": "20pt",
      "heading2": "16pt",
      "heading3": "14pt",
      "body": "11pt"
    },
    "weights": {
      "title": "bold",
      "heading1": "bold",
      "body": "normal"
    }
  },
  "style": {
    "tone": "professional",
    "aesthetic": "modern",
    "colorfulness": "balanced"
  }
}

**CRITICAL REQUIREMENTS**:
- Extract ALL sections AND subsections you find (don't skip any - even if there are 20+ sections!)
- For subsections, set parentId to the parent section's ID
- Level 0 = cover, Level 1 = main sections (H1), Level 2 = subsections (H2), Level 3 = sub-subsections (H3)
- Provide accurate section IDs (cover_page, executive_summary, scope_of_work, pricing, etc.)
- Identify section order correctly (1, 2, 3... including ALL subsections in document order)
- Extract actual hex colors from the XML (look in theme1.xml for <a:srgbClr val="..."/>)
- Extract actual font names from styles (look for <w:rFonts w:ascii="..."/>)
- Return ONLY valid JSON, no markdown formatting`,
          },
          {
            role: 'user',
            content: `Analyze this Word document comprehensively and extract ALL sections with complete structure and design:\n\n${combinedXml}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      console.log('📊 GPT-4o complete analysis:', JSON.stringify(analysis, null, 2));

      return analysis;
    } catch (error) {
      console.error('❌ GPT-4o analysis failed:', error);
      return {
        sections: [],
        structure: 'unknown',
        colors: { primary: null, secondary: null, accent: null, allColors: [] },
        fonts: { heading: null, body: null, sizes: {} },
        style: {}
      };
    }
  }

  /**
   * Combine AI analyses to create final template (100% AI-driven, no hardcoded values)
   */
  private async combineAIAnalyses(
    imageAnalysis: any,
    stylesData: any,
    documentAnalysis: any
  ): Promise<{
    schema: any;
    styles: any;
    assets: any;
    confidence: number;
  }> {
    // Helper function to convert AI size to dimensions
    const getSizeDimensions = (size: string) => {
      const sizeMap: any = {
        'small': { maxWidth: '120px', maxHeight: '60px' },
        'medium': { maxWidth: '200px', maxHeight: '100px' },
        'large': { maxWidth: '400px', maxHeight: '200px' },
        'full-width': { maxWidth: '100%', maxHeight: '400px' }
      };
      return sizeMap[size] || sizeMap['medium'];
    };

    // Build comprehensive assets object with AI-extracted placement metadata
    const assets: any = {};

    // Company logo - use AI-extracted placement
    if (imageAnalysis.companyLogo) {
      const aiPlacement = imageAnalysis.companyLogo.placement || {};
      const size = getSizeDimensions(aiPlacement.size || 'medium');

      assets.companyLogo = {
        data: imageAnalysis.companyLogo.image.base64,
        placement: {
          location: imageAnalysis.companyLogo.location,
          position: aiPlacement.position,
          alignment: aiPlacement.alignment,
          repeatsOnPages: aiPlacement.repeatsOnPages,
          ...size
        },
        metadata: {
          description: imageAnalysis.companyLogo.description,
          confidence: imageAnalysis.companyLogo.confidence
        }
      };
    }

    // Header logo - use AI-extracted placement or fallback to company logo
    if (imageAnalysis.headerLogo) {
      const aiPlacement = imageAnalysis.headerLogo.placement || {};
      const size = getSizeDimensions(aiPlacement.size || 'small');

      assets.headerLogo = {
        data: imageAnalysis.headerLogo.image.base64,
        placement: {
          location: imageAnalysis.headerLogo.location,
          position: aiPlacement.position,
          alignment: aiPlacement.alignment,
          repeatsOnPages: aiPlacement.repeatsOnPages,
          ...size
        },
        metadata: {
          description: imageAnalysis.headerLogo.description,
          confidence: imageAnalysis.headerLogo.confidence
        }
      };
    } else if (imageAnalysis.companyLogo) {
      // Use company logo for header if no specific header logo
      const size = getSizeDimensions('small');
      assets.headerLogo = {
        data: imageAnalysis.companyLogo.image.base64,
        placement: {
          location: 'header',
          position: 'top-right',
          alignment: 'right',
          repeatsOnPages: 'all',
          ...size
        },
        metadata: {
          description: 'Company logo used in header',
          confidence: imageAnalysis.companyLogo.confidence
        }
      };
    }

    // Footer logo - use AI-extracted placement or fallback to company logo
    if (imageAnalysis.footerLogo) {
      const aiPlacement = imageAnalysis.footerLogo.placement || {};
      const size = getSizeDimensions(aiPlacement.size || 'small');

      assets.footerLogo = {
        data: imageAnalysis.footerLogo.image.base64,
        placement: {
          location: imageAnalysis.footerLogo.location,
          position: aiPlacement.position,
          alignment: aiPlacement.alignment,
          repeatsOnPages: aiPlacement.repeatsOnPages,
          ...size
        },
        metadata: {
          description: imageAnalysis.footerLogo.description,
          confidence: imageAnalysis.footerLogo.confidence
        }
      };
    } else if (imageAnalysis.companyLogo) {
      // Use company logo for footer if no specific footer logo
      const size = getSizeDimensions('small');
      assets.footerLogo = {
        data: imageAnalysis.companyLogo.image.base64,
        placement: {
          location: 'footer',
          position: 'bottom-left',
          alignment: 'left',
          repeatsOnPages: 'all',
          ...size
        },
        metadata: {
          description: 'Company logo used in footer',
          confidence: imageAnalysis.companyLogo.confidence
        }
      };
    }

    // Cover image - use AI-extracted placement
    if (imageAnalysis.coverImage) {
      const aiPlacement = imageAnalysis.coverImage.placement || {};
      const size = getSizeDimensions(aiPlacement.size || 'full-width');

      assets.coverImage = {
        data: imageAnalysis.coverImage.image.base64,
        placement: {
          location: imageAnalysis.coverImage.location,
          position: aiPlacement.position,
          alignment: aiPlacement.alignment,
          repeatsOnPages: aiPlacement.repeatsOnPages || 'first_only',
          ...size
        },
        metadata: {
          description: imageAnalysis.coverImage.description,
          confidence: imageAnalysis.coverImage.confidence
        }
      };
    }

    // Thank you slide - use AI-extracted placement
    if (imageAnalysis.thankYouSlide) {
      const aiPlacement = imageAnalysis.thankYouSlide.placement || {};
      const size = getSizeDimensions(aiPlacement.size || 'full-width');

      assets.thankYouSlide = {
        data: imageAnalysis.thankYouSlide.image.base64,
        placement: {
          location: imageAnalysis.thankYouSlide.location,
          position: aiPlacement.position,
          alignment: aiPlacement.alignment,
          repeatsOnPages: aiPlacement.repeatsOnPages || 'last_only',
          fullPage: true,
          ...size
        },
        metadata: {
          description: imageAnalysis.thankYouSlide.description,
          confidence: imageAnalysis.thankYouSlide.confidence
        }
      };
    }

    // Other images - use AI-extracted placements
    assets.images = imageAnalysis.decorativeImages.map((img: any) => {
      const aiPlacement = img.placement || {};
      const size = getSizeDimensions(aiPlacement.size || (img.type === 'chart' || img.type === 'diagram' ? 'large' : 'medium'));

      return {
        name: img.image.name,
        data: img.image.base64,
        type: img.type,
        placement: {
          location: img.location,
          position: aiPlacement.position,
          alignment: aiPlacement.alignment,
          repeatsOnPages: aiPlacement.repeatsOnPages || 'none',
          ...size
        },
        metadata: {
          description: img.description,
          characteristics: img.characteristics
        }
      };
    });

    // Extract colors from GPT-4o analysis with usage context
    const aiColors = documentAnalysis.colors || {};
    const primaryColor = aiColors.primary || stylesData.colors[0] || null;
    const secondaryColor = aiColors.secondary || stylesData.colors[1] || null;
    const accentColor = aiColors.accent || stylesData.colors[2] || null;

    // Extract fonts from GPT-4o analysis
    const aiFonts = documentAnalysis.fonts || {};
    const headingFont = aiFonts.heading || stylesData.fonts[0] || null;
    const bodyFont = aiFonts.body || stylesData.fonts[0] || null;

    // Extract font sizes and weights
    const fontSizes = aiFonts.sizes || {};
    const fontWeights = aiFonts.weights || {};

    // Build comprehensive styles object
    const styles: any = {
      primaryColor,
      primaryColorUsage: aiColors.primaryUsage || 'Brand color for headings and key elements',
      secondaryColor,
      secondaryColorUsage: aiColors.secondaryUsage || 'Supporting color for subheadings',
      accentColor,
      accentColorUsage: aiColors.accentUsage || 'Highlight color for emphasis',
      fontFamily: headingFont,
      bodyFont,
      fontSize: {
        title: fontSizes.title || null,
        heading1: fontSizes.heading1 || null,
        heading2: fontSizes.heading2 || null,
        heading3: fontSizes.heading3 || null,
        body: fontSizes.body || null,
      },
      fontWeight: fontWeights,
      extractedColors: aiColors.allColors || stylesData.colors,
      extractedFonts: [headingFont, bodyFont].filter(Boolean),
      designStyle: documentAnalysis.style || {},
    };

    // Build comprehensive schema with all sections
    const schema: any = {
      name: 'AI Extracted Template',
      version: '1.0',
      type: documentAnalysis.structure || 'document',
      industry: documentAnalysis.industry || 'Business',
      description: `Automatically extracted ${documentAnalysis.structure || 'document'} template using AI for ${documentAnalysis.industry || 'business'} industry`,
      sections: (documentAnalysis.sections || []).map((section: any) => ({
        id: section.id || section.name.toLowerCase().replace(/\s+/g, '_'),
        name: section.name,
        type: section.type || 'section',
        level: section.level || 1,
        order: section.order || 0,
        parentId: section.parentId || null,
        description: section.description || '',
        contentSummary: section.contentSummary || '',
        hasImages: section.hasImages || false,
        hasTable: section.hasTable || false,
        placeholder: `{{${section.id || section.name.toLowerCase().replace(/\s+/g, '_')}_content}}`,
      })),
      branding: {
        primary_color: primaryColor,
        primary_color_usage: aiColors.primaryUsage,
        secondary_color: secondaryColor,
        secondary_color_usage: aiColors.secondaryUsage,
        accent_color: accentColor,
        accent_color_usage: aiColors.accentUsage,
      },
      typography: {
        heading_font: headingFont,
        body_font: bodyFont,
        sizes: fontSizes,
        weights: fontWeights,
      },
      designStyle: documentAnalysis.style || {},
      imageLocations: {
        companyLogo: imageAnalysis.companyLogo?.location || null,
        headerLogo: imageAnalysis.headerLogo?.location || null,
        footerLogo: imageAnalysis.footerLogo?.location || null,
        coverImage: imageAnalysis.coverImage?.location || null,
        thankYouSlide: imageAnalysis.thankYouSlide?.location || null,
      },
    };

    // Calculate overall confidence including thank you slide
    const confidenceScores = [
      imageAnalysis.companyLogo?.confidence || 0,
      imageAnalysis.headerLogo?.confidence || 0,
      imageAnalysis.footerLogo?.confidence || 0,
      imageAnalysis.coverImage?.confidence || 0,
      imageAnalysis.thankYouSlide?.confidence || 0,
    ].filter((c) => c > 0);

    const confidence = confidenceScores.length > 0
      ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
      : 0;

    console.log('✅ Final AI extraction complete:');
    console.log('   Industry:', documentAnalysis.industry || 'Unknown');
    console.log('   Colors:', { primaryColor, secondaryColor, accentColor });
    console.log('   Fonts:', { headingFont, bodyFont });
    console.log('   Sections:', schema.sections.length);
    console.log('   Images with Placements:');
    if (assets.companyLogo) {
      console.log('     - Company Logo:', assets.companyLogo.placement.location, '@', assets.companyLogo.placement.position);
    }
    if (assets.headerLogo) {
      console.log('     - Header Logo:', assets.headerLogo.placement.location, '@', assets.headerLogo.placement.position, '(repeats on', assets.headerLogo.placement.repeatOnPages, 'pages)');
    }
    if (assets.footerLogo) {
      console.log('     - Footer Logo:', assets.footerLogo.placement.location, '@', assets.footerLogo.placement.position, '(repeats on', assets.footerLogo.placement.repeatOnPages, 'pages)');
    }
    if (assets.coverImage) {
      console.log('     - Cover Image:', assets.coverImage.placement.location, '@', assets.coverImage.placement.position);
    }
    if (assets.thankYouSlide) {
      console.log('     - Thank You Slide:', assets.thankYouSlide.placement.location, '(full page)');
    }
    console.log('     - Decorative/Content Images:', assets.images.length);
    console.log('   Confidence:', confidence + '%');

    return {
      schema,
      styles,
      assets,
      confidence,
    };
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
    };
    return mimeTypes[extension.toLowerCase()] || 'image/png';
  }
}

export const aiTemplateExtractor = new AITemplateExtractor();
