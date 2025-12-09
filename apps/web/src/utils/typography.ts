/**
 * Typography Scale System
 * Golden ratio-based type scale (1.618) for responsive typography
 */

export const GOLDEN_RATIO = 1.618;
export const BASE_FONT_SIZE = 16; // px

/**
 * Type scale generator using golden ratio
 */
export function generateTypeScale(baseSize: number = BASE_FONT_SIZE, ratio: number = GOLDEN_RATIO) {
  return {
    xs: Math.round((baseSize / Math.pow(ratio, 2)) * 100) / 100,
    sm: Math.round((baseSize / ratio) * 100) / 100,
    base: baseSize,
    md: Math.round((baseSize * ratio) * 100) / 100,
    lg: Math.round((baseSize * Math.pow(ratio, 2)) * 100) / 100,
    xl: Math.round((baseSize * Math.pow(ratio, 3)) * 100) / 100,
    '2xl': Math.round((baseSize * Math.pow(ratio, 4)) * 100) / 100,
    '3xl': Math.round((baseSize * Math.pow(ratio, 5)) * 100) / 100,
    '4xl': Math.round((baseSize * Math.pow(ratio, 6)) * 100) / 100,
  };
}

/**
 * Default type scale (16px base, golden ratio)
 */
export const typeScale = generateTypeScale();
// xs: 6.13px, sm: 9.89px, base: 16px, md: 25.88px, lg: 41.88px, xl: 67.77px, 2xl: 109.66px, 3xl: 177.43px, 4xl: 287.09px

/**
 * Line height calculator based on font size
 */
export function calculateLineHeight(fontSize: number): number {
  // Smaller text = taller line-height, larger text = shorter line-height
  if (fontSize <= 12) return 1.6;
  if (fontSize <= 16) return 1.5;
  if (fontSize <= 24) return 1.4;
  if (fontSize <= 32) return 1.3;
  if (fontSize <= 48) return 1.2;
  return 1.1;
}

/**
 * Letter spacing calculator (tracking)
 */
export function calculateLetterSpacing(fontSize: number, fontWeight: number = 400): number {
  // Larger text and heavier weights = tighter tracking
  let spacing = 0;

  if (fontSize < 12) {
    spacing = 0.05; // 0.05em for small text
  } else if (fontSize < 16) {
    spacing = 0.025; // 0.025em for body text
  } else if (fontSize < 24) {
    spacing = 0; // Normal for medium headings
  } else if (fontSize < 48) {
    spacing = -0.025; // Tighten for large headings
  } else {
    spacing = -0.05; // Tighten more for huge display text
  }

  // Adjust for font weight (heavier = tighter)
  if (fontWeight >= 700) {
    spacing -= 0.01;
  }

  return Math.round(spacing * 1000) / 1000; // Round to 3 decimals
}

/**
 * Responsive type scale for different breakpoints
 */
export const responsiveTypeScale = {
  mobile: generateTypeScale(14, 1.5), // Smaller base, tighter ratio
  tablet: generateTypeScale(15, 1.55),
  desktop: generateTypeScale(16, GOLDEN_RATIO),
  large: generateTypeScale(18, 1.65), // Larger base for big screens
};

/**
 * Generate CSS custom properties for type scale
 */
export function generateTypographyCSSVars(scale = typeScale) {
  return Object.entries(scale).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [`--font-size-${key}`]: `${value}px`,
      [`--line-height-${key}`]: calculateLineHeight(value),
      [`--letter-spacing-${key}`]: `${calculateLetterSpacing(value)}em`,
    };
  }, {});
}

/**
 * Typography utility classes generator
 */
export interface TypographyConfig {
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'overline';
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

export const typographyConfig: Record<string, TypographyConfig> = {
  h1: {
    element: 'h1',
    fontSize: `${typeScale['4xl']}px`,
    fontWeight: 800,
    lineHeight: calculateLineHeight(typeScale['4xl']),
    letterSpacing: calculateLetterSpacing(typeScale['4xl'], 800),
  },
  h2: {
    element: 'h2',
    fontSize: `${typeScale['3xl']}px`,
    fontWeight: 700,
    lineHeight: calculateLineHeight(typeScale['3xl']),
    letterSpacing: calculateLetterSpacing(typeScale['3xl'], 700),
  },
  h3: {
    element: 'h3',
    fontSize: `${typeScale['2xl']}px`,
    fontWeight: 700,
    lineHeight: calculateLineHeight(typeScale['2xl']),
    letterSpacing: calculateLetterSpacing(typeScale['2xl'], 700),
  },
  h4: {
    element: 'h4',
    fontSize: `${typeScale.xl}px`,
    fontWeight: 600,
    lineHeight: calculateLineHeight(typeScale.xl),
    letterSpacing: calculateLetterSpacing(typeScale.xl, 600),
  },
  h5: {
    element: 'h5',
    fontSize: `${typeScale.lg}px`,
    fontWeight: 600,
    lineHeight: calculateLineHeight(typeScale.lg),
    letterSpacing: calculateLetterSpacing(typeScale.lg, 600),
  },
  h6: {
    element: 'h6',
    fontSize: `${typeScale.md}px`,
    fontWeight: 600,
    lineHeight: calculateLineHeight(typeScale.md),
    letterSpacing: calculateLetterSpacing(typeScale.md, 600),
  },
  body: {
    element: 'body',
    fontSize: `${typeScale.base}px`,
    fontWeight: 400,
    lineHeight: calculateLineHeight(typeScale.base),
    letterSpacing: calculateLetterSpacing(typeScale.base, 400),
  },
  caption: {
    element: 'caption',
    fontSize: `${typeScale.sm}px`,
    fontWeight: 400,
    lineHeight: calculateLineHeight(typeScale.sm),
    letterSpacing: calculateLetterSpacing(typeScale.sm, 400),
  },
  overline: {
    element: 'overline',
    fontSize: `${typeScale.xs}px`,
    fontWeight: 600,
    lineHeight: calculateLineHeight(typeScale.xs),
    letterSpacing: 0.1, // Wide tracking for overlines
  },
};

/**
 * Apply typography styles to element
 */
export function getTypographyStyles(variant: keyof typeof typographyConfig): React.CSSProperties {
  const config = typographyConfig[variant];

  return {
    fontSize: config.fontSize,
    fontWeight: config.fontWeight,
    lineHeight: config.lineHeight,
    letterSpacing: `${config.letterSpacing}em`,
  };
}

/**
 * Modular scale utilities
 */
export const modularScales = {
  minorSecond: 1.067,
  majorSecond: 1.125,
  minorThird: 1.2,
  majorThird: 1.25,
  perfectFourth: 1.333,
  augmentedFourth: 1.414,
  perfectFifth: 1.5,
  goldenRatio: GOLDEN_RATIO,
  majorSixth: 1.667,
  minorSeventh: 1.778,
  majorSeventh: 1.875,
  octave: 2,
};

/**
 * Responsive font size helper
 */
export function getResponsiveFontSize(element: keyof typeof typographyConfig) {
  const config = typographyConfig[element];
  const baseFontSize = parseFloat(config.fontSize);

  return {
    mobile: `${Math.round(baseFontSize * 0.875)}px`, // 87.5% on mobile
    tablet: `${Math.round(baseFontSize * 0.9375)}px`, // 93.75% on tablet
    desktop: config.fontSize, // 100% on desktop
    large: `${Math.round(baseFontSize * 1.125)}px`, // 112.5% on large screens
  };
}

/**
 * Optimal line length (characters per line)
 */
export const optimalLineLength = {
  min: 45, // characters
  ideal: 66, // characters (most readable)
  max: 75, // characters
};

/**
 * Calculate container width for optimal line length
 */
export function calculateOptimalWidth(
  fontSize: number,
  charactersPerLine: number = optimalLineLength.ideal
): number {
  // Average character width is approximately 0.5em (50% of font size)
  const avgCharWidth = fontSize * 0.5;
  return Math.round(avgCharWidth * charactersPerLine);
}

/**
 * Font loading utility
 */
export function loadGoogleFont(fontUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${fontUrl}`));
    document.head.appendChild(link);
  });
}

/**
 * Preload multiple Google Fonts
 */
export async function preloadFonts(fontUrls: string[]): Promise<void[]> {
  return Promise.all(fontUrls.map(loadGoogleFont));
}
