export interface CoverZone {
  x: number;      // X position (percentage or px)
  y: number;      // Y position (percentage or px)
  width: number;  // Width (percentage or px)
  height: number; // Height (percentage or px)
  alignment?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface CoverTemplate {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'professional' | 'creative' | 'modern';
  preview: string; // Path to preview image
  zones: {
    logo?: CoverZone;
    title: CoverZone;
    subtitle?: CoverZone;
    date?: CoverZone;
    clientLogo?: CoverZone;
    decorative?: CoverZone[];
  };
  background: {
    type: 'solid' | 'gradient' | 'pattern' | 'image';
    value?: string;
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      colors: string[];
      angle?: number;
    };
  };
  textSizes: {
    title: string;
    subtitle: string;
    date: string;
  };
}

export const coverTemplates: CoverTemplate[] = [
  // 1. Minimal Left
  {
    id: 'minimal-left',
    name: 'Minimal Left',
    description: 'Clean left-aligned layout with plenty of whitespace',
    category: 'minimal',
    preview: '/templates/minimal-left.svg',
    zones: {
      logo: { x: 10, y: 10, width: 20, height: 10, alignment: 'left' },
      title: { x: 10, y: 40, width: 50, height: 15, alignment: 'left' },
      subtitle: { x: 10, y: 58, width: 50, height: 8, alignment: 'left' },
      date: { x: 10, y: 85, width: 30, height: 5, alignment: 'left' },
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    textSizes: {
      title: '4xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 2. Centered Classic
  {
    id: 'centered-classic',
    name: 'Centered Classic',
    description: 'Traditional centered layout with balanced composition',
    category: 'professional',
    preview: '/templates/centered-classic.svg',
    zones: {
      logo: { x: 40, y: 15, width: 20, height: 10, alignment: 'center' },
      title: { x: 20, y: 45, width: 60, height: 12, alignment: 'center' },
      subtitle: { x: 25, y: 60, width: 50, height: 8, alignment: 'center' },
      clientLogo: { x: 40, y: 75, width: 20, height: 8, alignment: 'center' },
      date: { x: 35, y: 88, width: 30, height: 5, alignment: 'center' },
    },
    background: {
      type: 'solid',
      value: '#F9FAFB',
    },
    textSizes: {
      title: '5xl',
      subtitle: '2xl',
      date: 'md',
    },
  },

  // 3. Split Screen
  {
    id: 'split-screen',
    name: 'Split Screen',
    description: 'Bold 50/50 color block design with contrast',
    category: 'modern',
    preview: '/templates/split-screen.svg',
    zones: {
      logo: { x: 55, y: 15, width: 35, height: 8, alignment: 'left' },
      title: { x: 55, y: 40, width: 35, height: 15, alignment: 'left' },
      subtitle: { x: 55, y: 58, width: 35, height: 8, alignment: 'left' },
      date: { x: 55, y: 85, width: 30, height: 5, alignment: 'left' },
      decorative: [
        { x: 0, y: 0, width: 50, height: 100, alignment: 'left' }, // Left color block
      ],
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    textSizes: {
      title: '4xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 4. Hero Image
  {
    id: 'hero-image',
    name: 'Hero Image',
    description: 'Full background image with overlay text',
    category: 'creative',
    preview: '/templates/hero-image.svg',
    zones: {
      logo: { x: 10, y: 10, width: 20, height: 8, alignment: 'left' },
      title: { x: 10, y: 50, width: 80, height: 15, alignment: 'left', verticalAlign: 'middle' },
      subtitle: { x: 10, y: 68, width: 60, height: 8, alignment: 'left' },
      date: { x: 10, y: 88, width: 30, height: 5, alignment: 'left' },
    },
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        colors: ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)'],
        angle: 45,
      },
    },
    textSizes: {
      title: '6xl',
      subtitle: '2xl',
      date: 'md',
    },
  },

  // 5. Geometric Modern
  {
    id: 'geometric-modern',
    name: 'Geometric Modern',
    description: 'Modern design with geometric shape accents',
    category: 'modern',
    preview: '/templates/geometric-modern.svg',
    zones: {
      logo: { x: 10, y: 10, width: 20, height: 8, alignment: 'left' },
      title: { x: 10, y: 45, width: 70, height: 15, alignment: 'left' },
      subtitle: { x: 10, y: 63, width: 60, height: 8, alignment: 'left' },
      date: { x: 10, y: 88, width: 30, height: 5, alignment: 'left' },
      decorative: [
        { x: 75, y: 20, width: 20, height: 20, alignment: 'center' }, // Circle
        { x: 5, y: 75, width: 15, height: 15, alignment: 'center' },  // Square
      ],
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    textSizes: {
      title: '5xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 6. Magazine Style
  {
    id: 'magazine-style',
    name: 'Magazine Style',
    description: 'Editorial layout with large typography',
    category: 'creative',
    preview: '/templates/magazine-style.svg',
    zones: {
      logo: { x: 85, y: 10, width: 10, height: 6, alignment: 'right' },
      title: { x: 10, y: 30, width: 80, height: 25, alignment: 'left' },
      subtitle: { x: 10, y: 58, width: 60, height: 6, alignment: 'left' },
      date: { x: 10, y: 88, width: 30, height: 4, alignment: 'left' },
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    textSizes: {
      title: '7xl',
      subtitle: 'lg',
      date: 'xs',
    },
  },

  // 7. Corporate Formal
  {
    id: 'corporate-formal',
    name: 'Corporate Formal',
    description: 'Professional layout with header stripe',
    category: 'professional',
    preview: '/templates/corporate-formal.svg',
    zones: {
      logo: { x: 10, y: 5, width: 20, height: 8, alignment: 'left' },
      title: { x: 10, y: 35, width: 80, height: 12, alignment: 'left' },
      subtitle: { x: 10, y: 50, width: 70, height: 8, alignment: 'left' },
      clientLogo: { x: 10, y: 75, width: 20, height: 8, alignment: 'left' },
      date: { x: 10, y: 88, width: 30, height: 5, alignment: 'left' },
      decorative: [
        { x: 0, y: 0, width: 100, height: 15, alignment: 'left' }, // Header stripe
      ],
    },
    background: {
      type: 'solid',
      value: '#F9FAFB',
    },
    textSizes: {
      title: '5xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 8. Creative Diagonal
  {
    id: 'creative-diagonal',
    name: 'Creative Diagonal',
    description: 'Dynamic layout with angled elements',
    category: 'creative',
    preview: '/templates/creative-diagonal.svg',
    zones: {
      logo: { x: 10, y: 10, width: 20, height: 8, alignment: 'left' },
      title: { x: 15, y: 40, width: 70, height: 15, alignment: 'left' },
      subtitle: { x: 15, y: 58, width: 60, height: 8, alignment: 'left' },
      date: { x: 15, y: 85, width: 30, height: 5, alignment: 'left' },
      decorative: [
        { x: 60, y: 0, width: 40, height: 100, alignment: 'left' }, // Diagonal stripe
      ],
    },
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        colors: ['#FFFFFF', '#F3F4F6'],
        angle: 135,
      },
    },
    textSizes: {
      title: '5xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 9. Minimalist White
  {
    id: 'minimalist-white',
    name: 'Minimalist White',
    description: 'Ultra-clean design with maximum breathing room',
    category: 'minimal',
    preview: '/templates/minimalist-white.svg',
    zones: {
      logo: { x: 45, y: 20, width: 10, height: 6, alignment: 'center' },
      title: { x: 20, y: 50, width: 60, height: 10, alignment: 'center', verticalAlign: 'middle' },
      subtitle: { x: 25, y: 63, width: 50, height: 6, alignment: 'center' },
      date: { x: 35, y: 80, width: 30, height: 4, alignment: 'center' },
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    textSizes: {
      title: '6xl',
      subtitle: 'lg',
      date: 'xs',
    },
  },

  // 10. Bold Typography
  {
    id: 'bold-typography',
    name: 'Bold Typography',
    description: 'Title-dominant design with minimal decoration',
    category: 'modern',
    preview: '/templates/bold-typography.svg',
    zones: {
      logo: { x: 10, y: 10, width: 15, height: 6, alignment: 'left' },
      title: { x: 10, y: 25, width: 80, height: 35, alignment: 'left' },
      subtitle: { x: 10, y: 65, width: 70, height: 8, alignment: 'left' },
      date: { x: 10, y: 88, width: 30, height: 5, alignment: 'left' },
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    textSizes: {
      title: '8xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 11. Isometric Illustration
  {
    id: 'isometric-illustration',
    name: 'Isometric Illustration',
    description: '3D graphics showcase with modern feel',
    category: 'creative',
    preview: '/templates/isometric-illustration.svg',
    zones: {
      logo: { x: 10, y: 10, width: 20, height: 8, alignment: 'left' },
      title: { x: 10, y: 55, width: 45, height: 15, alignment: 'left' },
      subtitle: { x: 10, y: 73, width: 45, height: 8, alignment: 'left' },
      date: { x: 10, y: 88, width: 30, height: 5, alignment: 'left' },
      decorative: [
        { x: 55, y: 15, width: 35, height: 35, alignment: 'center' }, // Illustration area
      ],
    },
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        colors: ['#F0F9FF', '#E0E7FF'],
        angle: 45,
      },
    },
    textSizes: {
      title: '4xl',
      subtitle: 'xl',
      date: 'sm',
    },
  },

  // 12. Photo Collage
  {
    id: 'photo-collage',
    name: 'Photo Collage',
    description: 'Multiple images with text overlay',
    category: 'creative',
    preview: '/templates/photo-collage.svg',
    zones: {
      logo: { x: 10, y: 10, width: 20, height: 8, alignment: 'left' },
      title: { x: 10, y: 75, width: 80, height: 12, alignment: 'left' },
      subtitle: { x: 10, y: 88, width: 60, height: 5, alignment: 'left' },
      decorative: [
        { x: 0, y: 0, width: 50, height: 60, alignment: 'left' },   // Image 1
        { x: 52, y: 0, width: 48, height: 35, alignment: 'left' },  // Image 2
        { x: 52, y: 37, width: 48, height: 23, alignment: 'left' }, // Image 3
      ],
    },
    background: {
      type: 'solid',
      value: '#000000',
    },
    textSizes: {
      title: '5xl',
      subtitle: 'lg',
      date: 'sm',
    },
  },
];

// Helper function to get template by ID
export function getTemplateById(id: string): CoverTemplate | undefined {
  return coverTemplates.find((template) => template.id === id);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: CoverTemplate['category']): CoverTemplate[] {
  return coverTemplates.filter((template) => template.category === category);
}

// Default template
export const defaultTemplate = coverTemplates[0]; // Minimal Left
