/**
 * Design System Configuration
 * All design defaults, fonts, colors, and layouts in one place
 */

export const DESIGN_CONFIG = {
  // Default color scheme (fallback if AI generation fails)
  colors: {
    primary: process.env.DEFAULT_PRIMARY_COLOR || '#3b82f6',
    secondary: process.env.DEFAULT_SECONDARY_COLOR || '#10b981',
    accent: process.env.DEFAULT_ACCENT_COLOR || '#FFB347',
    success: process.env.DEFAULT_SUCCESS_COLOR || '#10b981',
    warning: process.env.DEFAULT_WARNING_COLOR || '#f59e0b',
    error: process.env.DEFAULT_ERROR_COLOR || '#ef4444',
    background: process.env.DEFAULT_BG_COLOR || '#ffffff',
    surface: process.env.DEFAULT_SURFACE_COLOR || '#f9fafb',
  },

  // Available fonts for headings
  headingFonts: (process.env.HEADING_FONTS ||
    'Poppins,Playfair Display,Montserrat,Quicksand,Merriweather,Space Grotesk,Libre Baskerville,IBM Plex Sans,Raleway,Oswald,Bebas Neue,Archivo Black'
  ).split(',').map(f => f.trim()),

  // Available fonts for body text
  bodyFonts: (process.env.BODY_FONTS ||
    'Inter,Source Sans Pro,Open Sans,Lato,Roboto,Work Sans,Crimson Text,Noto Sans,Karla,Nunito Sans'
  ).split(',').map(f => f.trim()),

  // Default fonts
  defaultFonts: {
    heading: process.env.DEFAULT_HEADING_FONT || 'Poppins',
    body: process.env.DEFAULT_BODY_FONT || 'Inter',
  },

  // Available cover page layouts
  layouts: (process.env.COVER_LAYOUTS ||
    'centered,left-aligned,split,minimal'
  ).split(',').map(l => l.trim()),

  // Default layout
  defaultLayout: process.env.DEFAULT_LAYOUT || 'centered',

  // Background styles
  backgroundStyles: (process.env.BG_STYLES ||
    'gradient,solid,pattern,image'
  ).split(',').map(s => s.trim()),

  // Default background style
  defaultBackgroundStyle: process.env.DEFAULT_BG_STYLE || 'gradient',

  // Font pairings (heading + body combinations)
  fontPairings: [
    {
      name: 'Modern Professional',
      heading: 'Poppins',
      body: 'Inter',
      description: 'Clean, contemporary, perfect for tech and startups'
    },
    {
      name: 'Classic Elegant',
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
      description: 'Sophisticated serif with modern sans-serif'
    },
    {
      name: 'Bold & Dynamic',
      heading: 'Montserrat',
      body: 'Open Sans',
      description: 'Strong, impactful, great for marketing'
    },
    {
      name: 'Friendly & Approachable',
      heading: 'Quicksand',
      body: 'Lato',
      description: 'Warm, inviting, perfect for community-focused content'
    },
    {
      name: 'Corporate Traditional',
      heading: 'Merriweather',
      body: 'Roboto',
      description: 'Professional, trustworthy, ideal for finance'
    },
    {
      name: 'Creative & Modern',
      heading: 'Space Grotesk',
      body: 'Work Sans',
      description: 'Unique, artistic, great for creative agencies'
    },
    {
      name: 'Editorial Style',
      heading: 'Libre Baskerville',
      body: 'Crimson Text',
      description: 'Literary, refined, perfect for content-heavy documents'
    },
    {
      name: 'Tech Minimalist',
      heading: 'IBM Plex Sans',
      body: 'IBM Plex Sans',
      description: 'Monochromatic, technical, ideal for IT and software'
    },
  ],

  // Layout configurations
  layoutConfigs: {
    centered: {
      name: 'Centered Classic',
      description: 'Traditional, formal, professional',
      alignment: 'center',
      logoPosition: 'top',
    },
    'left-aligned': {
      name: 'Left Aligned',
      description: 'Modern, clean, minimalist',
      alignment: 'left',
      logoPosition: 'top-left',
    },
    split: {
      name: 'Split Design',
      description: 'Dynamic, creative, bold',
      alignment: 'split',
      logoPosition: 'left',
    },
    minimal: {
      name: 'Minimal',
      description: 'Elegant, sophisticated, simple',
      alignment: 'center',
      logoPosition: 'subtle',
    },
  },

  // Industry color mappings (used by AI for better suggestions)
  industryColorHints: {
    technology: { primary: '#3b82f6', secondary: '#8b5cf6' },
    finance: { primary: '#059669', secondary: '#0d9488' },
    healthcare: { primary: '#0ea5e9', secondary: '#06b6d4' },
    education: { primary: '#f59e0b', secondary: '#eab308' },
    retail: { primary: '#ec4899', secondary: '#f43f5e' },
    consulting: { primary: '#6366f1', secondary: '#8b5cf6' },
    manufacturing: { primary: '#64748b', secondary: '#475569' },
    legal: { primary: '#1e293b', secondary: '#334155' },
    real_estate: { primary: '#14b8a6', secondary: '#0d9488' },
    hospitality: { primary: '#f97316', secondary: '#fb923c' },
  },

  // AI generation settings
  ai: {
    temperature: parseFloat(process.env.DESIGN_AI_TEMPERATURE || '0.8'),
    model: process.env.DESIGN_AI_MODEL || 'gpt-4o',
    maxRetries: parseInt(process.env.DESIGN_AI_RETRIES || '2', 10),
  },
};

// Export individual configs for convenience
export const DEFAULT_COLORS = DESIGN_CONFIG.colors;
export const HEADING_FONTS = DESIGN_CONFIG.headingFonts;
export const BODY_FONTS = DESIGN_CONFIG.bodyFonts;
export const FONT_PAIRINGS = DESIGN_CONFIG.fontPairings;
export const COVER_LAYOUTS = DESIGN_CONFIG.layouts;
export const LAYOUT_CONFIGS = DESIGN_CONFIG.layoutConfigs;
export const INDUSTRY_COLOR_HINTS = DESIGN_CONFIG.industryColorHints;
