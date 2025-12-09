/**
 * 30 Curated Google Font Pairings
 * Professional combinations for headings and body text
 */

export type FontStyle = 'modern' | 'classic' | 'elegant' | 'bold' | 'minimal' | 'creative';

export interface FontPairing {
  id: string;
  name: string;
  style: FontStyle;
  heading: {
    font: string;
    weights: number[];
    googleFontUrl: string;
    fallback: string;
  };
  body: {
    font: string;
    weights: number[];
    googleFontUrl: string;
    fallback: string;
  };
  description: string;
  useCases: string[];
  preview: {
    headingSample: string;
    bodySample: string;
  };
}

export const fontPairings: FontPairing[] = [
  // ==================== MODERN (6) ====================
  {
    id: 'modern-inter-roboto',
    name: 'Modern Professional',
    style: 'modern',
    heading: {
      font: 'Inter',
      weights: [600, 700, 800],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Roboto',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Clean, modern, and highly readable for tech and corporate',
    useCases: ['technology', 'corporate', 'saas', 'startups'],
    preview: {
      headingSample: 'Professional Business Solutions',
      bodySample: 'Our comprehensive approach ensures sustainable growth and measurable results.',
    },
  },
  {
    id: 'modern-montserrat-opensans',
    name: 'Contemporary Clean',
    style: 'modern',
    heading: {
      font: 'Montserrat',
      weights: [600, 700, 800],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Open Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Geometric headings with friendly, readable body text',
    useCases: ['marketing', 'creative', 'digital', 'agency'],
    preview: {
      headingSample: 'Transform Your Digital Presence',
      bodySample: 'We deliver innovative solutions that drive engagement and conversion.',
    },
  },
  {
    id: 'modern-poppins-lato',
    name: 'Friendly Modern',
    style: 'modern',
    heading: {
      font: 'Poppins',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Lato',
      weights: [400, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Approachable and warm while maintaining professionalism',
    useCases: ['education', 'healthcare', 'nonprofit', 'community'],
    preview: {
      headingSample: 'Building Better Communities',
      bodySample: 'Together we create lasting impact through collaborative innovation.',
    },
  },
  {
    id: 'modern-worksans-sourcesans',
    name: 'Tech Forward',
    style: 'modern',
    heading: {
      font: 'Work Sans',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Source Sans Pro',
      weights: [400, 600],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Contemporary sans-serif pairing for tech companies',
    useCases: ['technology', 'software', 'IT', 'engineering'],
    preview: {
      headingSample: 'Next-Generation Solutions',
      bodySample: 'Leveraging cutting-edge technology to solve complex challenges.',
    },
  },
  {
    id: 'modern-nunito-inter',
    name: 'Soft Modern',
    style: 'modern',
    heading: {
      font: 'Nunito',
      weights: [700, 800],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Inter',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Rounded, friendly headings with clean body text',
    useCases: ['wellness', 'lifestyle', 'food', 'retail'],
    preview: {
      headingSample: 'Wellness Reimagined',
      bodySample: 'Discover a holistic approach to health and sustainable living.',
    },
  },
  {
    id: 'modern-dmSans-inter',
    name: 'Geometric Clean',
    style: 'modern',
    heading: {
      font: 'DM Sans',
      weights: [700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Inter',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Precise geometric headings for modern brands',
    useCases: ['design', 'architecture', 'fashion', 'minimal'],
    preview: {
      headingSample: 'Precision in Design',
      bodySample: 'Where form meets function in perfect harmony.',
    },
  },

  // ==================== CLASSIC (6) ====================
  {
    id: 'classic-playfair-sourcesans',
    name: 'Timeless Elegance',
    style: 'classic',
    heading: {
      font: 'Playfair Display',
      weights: [700, 800],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Source Sans Pro',
      weights: [400, 600],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Sophisticated serif headings with clean sans body',
    useCases: ['legal', 'finance', 'luxury', 'consulting'],
    preview: {
      headingSample: 'Excellence Through Tradition',
      bodySample: 'Upholding the highest standards of professional service since 1985.',
    },
  },
  {
    id: 'classic-merriweather-lato',
    name: 'Editorial Classic',
    style: 'classic',
    heading: {
      font: 'Merriweather',
      weights: [700, 900],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Lato',
      weights: [400, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Traditional serif for editorial and publishing',
    useCases: ['publishing', 'media', 'journalism', 'research'],
    preview: {
      headingSample: 'The Art of Communication',
      bodySample: 'Delivering insightful analysis and comprehensive reporting.',
    },
  },
  {
    id: 'classic-loraserif-roboto',
    name: 'Refined Traditional',
    style: 'classic',
    heading: {
      font: 'Lora',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Roboto',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Balanced serif-sans combination for versatile use',
    useCases: ['education', 'government', 'nonprofit', 'heritage'],
    preview: {
      headingSample: 'Preserving Heritage, Building Future',
      bodySample: 'Committed to excellence in education and community development.',
    },
  },
  {
    id: 'classic-crimson-nunito',
    name: 'Academic Authority',
    style: 'classic',
    heading: {
      font: 'Crimson Text',
      weights: [600, 700],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Nunito',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Scholarly serif with approachable body text',
    useCases: ['education', 'research', 'university', 'academic'],
    preview: {
      headingSample: 'Advancing Knowledge',
      bodySample: 'Leading research initiatives that shape the future of learning.',
    },
  },
  {
    id: 'classic-ebgaramond-opensans',
    name: 'Classical Heritage',
    style: 'classic',
    heading: {
      font: 'EB Garamond',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Open Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Old-style serif for historical and cultural organizations',
    useCases: ['museum', 'culture', 'heritage', 'history'],
    preview: {
      headingSample: 'Celebrating Our Heritage',
      bodySample: 'Preserving history and culture for future generations.',
    },
  },
  {
    id: 'classic-spectral-worksans',
    name: 'Modern Classic',
    style: 'classic',
    heading: {
      font: 'Spectral',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Work Sans',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Contemporary serif with modern sans-serif body',
    useCases: ['editorial', 'publishing', 'corporate', 'professional'],
    preview: {
      headingSample: 'Where Tradition Meets Innovation',
      bodySample: 'Blending time-tested principles with modern methodologies.',
    },
  },

  // ==================== ELEGANT (6) ====================
  {
    id: 'elegant-cormorant-montserrat',
    name: 'Luxury Refined',
    style: 'elegant',
    heading: {
      font: 'Cormorant Garamond',
      weights: [600, 700],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Montserrat',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Sophisticated serif for luxury and premium brands',
    useCases: ['luxury', 'fashion', 'jewelry', 'premium'],
    preview: {
      headingSample: 'Timeless Luxury',
      bodySample: 'Exquisite craftsmanship meets unparalleled elegance.',
    },
  },
  {
    id: 'elegant-cinzel-raleway',
    name: 'Regal Presence',
    style: 'elegant',
    heading: {
      font: 'Cinzel',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Raleway',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Majestic headings for high-end brands',
    useCases: ['luxury', 'hotel', 'spa', 'hospitality'],
    preview: {
      headingSample: 'The Pinnacle of Excellence',
      bodySample: 'Experience unmatched sophistication and world-class service.',
    },
  },
  {
    id: 'elegant-butler-josefinsans',
    name: 'Art Deco',
    style: 'elegant',
    heading: {
      font: 'Playfair Display',
      weights: [700, 800],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Josefin Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: '1920s-inspired elegance for creative luxury',
    useCases: ['fashion', 'design', 'art', 'event'],
    preview: {
      headingSample: 'Elegance Redefined',
      bodySample: 'Where vintage charm meets contemporary sophistication.',
    },
  },
  {
    id: 'elegant-libre-sourcesans',
    name: 'Graceful Modern',
    style: 'elegant',
    heading: {
      font: 'Libre Baskerville',
      weights: [700],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Source Sans Pro',
      weights: [400, 600],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Elegant serif with modern readability',
    useCases: ['real estate', 'consulting', 'professional', 'advisory'],
    preview: {
      headingSample: 'Distinguished Service',
      bodySample: 'Providing sophisticated solutions with personal attention.',
    },
  },
  {
    id: 'elegant-italiana-lato',
    name: 'Italian Elegance',
    style: 'elegant',
    heading: {
      font: 'Italiana',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Italiana&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Lato',
      weights: [400, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Stylish Italian-inspired headings',
    useCases: ['fashion', 'restaurant', 'luxury', 'lifestyle'],
    preview: {
      headingSample: 'Bella Vita',
      bodySample: 'Celebrate the art of living with Italian style and grace.',
    },
  },
  {
    id: 'elegant-cormorantupright-raleway',
    name: 'Sophisticated Touch',
    style: 'elegant',
    heading: {
      font: 'Cormorant Upright',
      weights: [600, 700],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Cormorant+Upright:wght@600;700&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Raleway',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Refined serif for upscale brands',
    useCases: ['beauty', 'spa', 'wellness', 'lifestyle'],
    preview: {
      headingSample: 'Pure Indulgence',
      bodySample: 'Experience tranquility and rejuvenation in luxurious surroundings.',
    },
  },

  // ==================== BOLD (6) ====================
  {
    id: 'bold-oswald-opensans',
    name: 'Impact Bold',
    style: 'bold',
    heading: {
      font: 'Oswald',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Open Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Strong, condensed headings for maximum impact',
    useCases: ['sports', 'automotive', 'industrial', 'construction'],
    preview: {
      headingSample: 'POWER & PERFORMANCE',
      bodySample: 'Delivering strength and reliability in every project.',
    },
  },
  {
    id: 'bold-bebas-roboto',
    name: 'Athletic Power',
    style: 'bold',
    heading: {
      font: 'Bebas Neue',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Roboto',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Athletic and energetic for sports brands',
    useCases: ['sports', 'fitness', 'athletics', 'active'],
    preview: {
      headingSample: 'UNLEASH YOUR POTENTIAL',
      bodySample: 'Train harder, perform better, achieve greatness.',
    },
  },
  {
    id: 'bold-anton-sourcesans',
    name: 'Statement Bold',
    style: 'bold',
    heading: {
      font: 'Anton',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Anton&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Source Sans Pro',
      weights: [400, 600],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Ultra-bold headings that demand attention',
    useCases: ['marketing', 'advertising', 'events', 'campaigns'],
    preview: {
      headingSample: 'MAKE IT HAPPEN',
      bodySample: 'Bold ideas. Powerful execution. Measurable results.',
    },
  },
  {
    id: 'bold-archivo-inter',
    name: 'Modern Strength',
    style: 'bold',
    heading: {
      font: 'Archivo Black',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Inter',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Heavy weight for industrial and manufacturing',
    useCases: ['manufacturing', 'industrial', 'engineering', 'construction'],
    preview: {
      headingSample: 'BUILT TO LAST',
      bodySample: 'Engineering excellence meets innovative design solutions.',
    },
  },
  {
    id: 'bold-teko-lato',
    name: 'Tech Bold',
    style: 'bold',
    heading: {
      font: 'Teko',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Teko:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Lato',
      weights: [400, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Tall, condensed headings for tech presentations',
    useCases: ['technology', 'gaming', 'esports', 'digital'],
    preview: {
      headingSample: 'NEXT LEVEL INNOVATION',
      bodySample: 'Pushing boundaries with cutting-edge technology.',
    },
  },
  {
    id: 'bold-impact-montserrat',
    name: 'Maximum Impact',
    style: 'bold',
    heading: {
      font: 'Archivo Black',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Montserrat',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Eye-catching headers for high-impact campaigns',
    useCases: ['advertising', 'marketing', 'sales', 'promotion'],
    preview: {
      headingSample: 'DRIVE RESULTS',
      bodySample: 'Powerful strategies that convert attention into action.',
    },
  },

  // ==================== MINIMAL (6) ====================
  {
    id: 'minimal-helvetica-system',
    name: 'Pure Minimal',
    style: 'minimal',
    heading: {
      font: 'Inter',
      weights: [600, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Inter',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Single font family for ultimate consistency',
    useCases: ['design', 'architecture', 'minimal', 'modern'],
    preview: {
      headingSample: 'Less is More',
      bodySample: 'Clarity through simplicity. Function follows form.',
    },
  },
  {
    id: 'minimal-inter-system',
    name: 'System Clean',
    style: 'minimal',
    heading: {
      font: 'Inter',
      weights: [700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap',
      fallback: 'system-ui, sans-serif',
    },
    body: {
      font: 'Inter',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      fallback: 'system-ui, sans-serif',
    },
    description: 'Native system font aesthetic',
    useCases: ['software', 'apps', 'digital', 'interface'],
    preview: {
      headingSample: 'Native Experience',
      bodySample: 'Seamless integration with your operating system.',
    },
  },
  {
    id: 'minimal-roboto-mono',
    name: 'Monospace Minimal',
    style: 'minimal',
    heading: {
      font: 'Roboto',
      weights: [700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Roboto Mono',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap',
      fallback: 'monospace',
    },
    description: 'Tech-forward with monospace body',
    useCases: ['developer', 'coding', 'tech', 'engineering'],
    preview: {
      headingSample: 'Code Meets Design',
      bodySample: 'Precision engineering for digital products.',
    },
  },
  {
    id: 'minimal-space-grotesk',
    name: 'Space Minimal',
    style: 'minimal',
    heading: {
      font: 'Space Grotesk',
      weights: [600, 700],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Space Grotesk',
      weights: [400, 500],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Geometric simplicity for modern brands',
    useCases: ['design', 'tech', 'startup', 'minimal'],
    preview: {
      headingSample: 'Geometric Precision',
      bodySample: 'Where mathematical perfection meets aesthetic beauty.',
    },
  },
  {
    id: 'minimal-public-sans',
    name: 'Government Clean',
    style: 'minimal',
    heading: {
      font: 'Public Sans',
      weights: [700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Public Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Neutral and accessible for government use',
    useCases: ['government', 'public', 'institutional', 'civic'],
    preview: {
      headingSample: 'Public Service',
      bodySample: 'Serving the community with transparency and integrity.',
    },
  },
  {
    id: 'minimal-ibmplex-sans',
    name: 'IBM Clean',
    style: 'minimal',
    heading: {
      font: 'IBM Plex Sans',
      weights: [600, 700],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600;700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'IBM Plex Sans',
      weights: [400, 500],
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Corporate-grade minimal typography',
    useCases: ['corporate', 'enterprise', 'B2B', 'professional'],
    preview: {
      headingSample: 'Enterprise Solutions',
      bodySample: 'Scalable technology for global organizations.',
    },
  },

  // ==================== CREATIVE (6) ====================
  {
    id: 'creative-abril-raleway',
    name: 'Fashion Forward',
    style: 'creative',
    heading: {
      font: 'Abril Fatface',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap',
      fallback: 'serif',
    },
    body: {
      font: 'Raleway',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Bold display serif for fashion and editorial',
    useCases: ['fashion', 'magazine', 'editorial', 'luxury'],
    preview: {
      headingSample: 'Style Revolution',
      bodySample: 'Defining trends with bold creativity and timeless appeal.',
    },
  },
  {
    id: 'creative-righteous-opensans',
    name: 'Playful Modern',
    style: 'creative',
    heading: {
      font: 'Righteous',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Open Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Fun and quirky for creative brands',
    useCases: ['entertainment', 'gaming', 'youth', 'creative'],
    preview: {
      headingSample: 'Level Up Your Game',
      bodySample: 'Innovative experiences that engage and entertain.',
    },
  },
  {
    id: 'creative-comfortaa-opensans',
    name: 'Friendly Creative',
    style: 'creative',
    heading: {
      font: 'Comfortaa',
      weights: [700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&display=swap',
      fallback: 'sans-serif',
    },
    body: {
      font: 'Open Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Rounded and approachable for lifestyle brands',
    useCases: ['lifestyle', 'wellness', 'children', 'community'],
    preview: {
      headingSample: 'Happy Healthy Living',
      bodySample: 'Bringing joy and wellness to everyday life.',
    },
  },
  {
    id: 'creative-pacifico-opensans',
    name: 'Beach Vibes',
    style: 'creative',
    heading: {
      font: 'Pacifico',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
      fallback: 'cursive',
    },
    body: {
      font: 'Open Sans',
      weights: [400, 600],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Hand-written style for casual brands',
    useCases: ['lifestyle', 'food', 'travel', 'casual'],
    preview: {
      headingSample: 'Life is Beautiful',
      bodySample: 'Embrace every moment with sunshine and smiles.',
    },
  },
  {
    id: 'creative-permanent-roboto',
    name: 'Marker Bold',
    style: 'creative',
    heading: {
      font: 'Permanent Marker',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap',
      fallback: 'cursive',
    },
    body: {
      font: 'Roboto',
      weights: [400, 500],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Hand-drawn energy for youth brands',
    useCases: ['youth', 'urban', 'street', 'creative'],
    preview: {
      headingSample: 'Street Culture',
      bodySample: 'Authentic expression from the underground to mainstream.',
    },
  },
  {
    id: 'creative-bangers-lato',
    name: 'Comic Energy',
    style: 'creative',
    heading: {
      font: 'Bangers',
      weights: [400],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Bangers&display=swap',
      fallback: 'cursive',
    },
    body: {
      font: 'Lato',
      weights: [400, 700],
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      fallback: 'sans-serif',
    },
    description: 'Comic-book style for entertainment',
    useCases: ['entertainment', 'gaming', 'comics', 'kids'],
    preview: {
      headingSample: 'BOOM! POW! WOW!',
      bodySample: 'Action-packed entertainment that never stops.',
    },
  },
];

/**
 * Get font pairings by style
 */
export function getFontPairingsByStyle(style: FontStyle): FontPairing[] {
  return fontPairings.filter((p) => p.style === style);
}

/**
 * Get font pairing by ID
 */
export function getFontPairingById(id: string): FontPairing | undefined {
  return fontPairings.find((p) => p.id === id);
}

/**
 * Get font pairings by use case
 */
export function getFontPairingsByUseCase(useCase: string): FontPairing[] {
  return fontPairings.filter((p) =>
    p.useCases.some((uc) => uc.toLowerCase().includes(useCase.toLowerCase()))
  );
}

/**
 * Get random font pairing
 */
export function getRandomFontPairing(): FontPairing {
  return fontPairings[Math.floor(Math.random() * fontPairings.length)];
}

/**
 * Font styles for filtering
 */
export const fontStyles: Array<{ id: FontStyle; label: string; description: string }> = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean, contemporary sans-serif combinations',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional serif with timeless appeal',
  },
  {
    id: 'elegant',
    label: 'Elegant',
    description: 'Sophisticated and refined typography',
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Strong, impactful headings',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Simple, understated typography',
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Unique and expressive combinations',
  },
];
