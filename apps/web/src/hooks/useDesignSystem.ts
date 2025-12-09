/**
 * useDesignSystem Hook
 * Unified hook for applying color palettes and font pairings to proposals
 */

import { useState, useCallback, useEffect } from 'react';
import type { ColorPalette } from '@/data/colorPalettes';
import type { FontPairing } from '@/data/fontPairings';
import { preloadFonts } from '@/utils/typography';

export interface DesignSystemConfig {
  palette?: ColorPalette;
  fontPairing?: FontPairing;
}

export interface ProposalDesign {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  fonts: {
    heading: {
      family: string;
      weights: number[];
      url: string;
    };
    body: {
      family: string;
      weights: number[];
      url: string;
    };
  };
  metadata: {
    paletteId?: string;
    paletteName?: string;
    fontPairingId?: string;
    fontPairingName?: string;
  };
}

export function useDesignSystem(proposalId?: string) {
  const [design, setDesign] = useState<ProposalDesign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing design configuration
  useEffect(() => {
    if (!proposalId) return;

    const loadDesign = async () => {
      try {
        setIsLoading(true);
        // Fetch proposal design from API
        const response = await fetch(`/api/proposals/${proposalId}/design`);
        if (!response.ok) throw new Error('Failed to load design');

        const data = await response.json();
        if (data.design) {
          setDesign(data.design);

          // Preload fonts if configured
          if (data.design.fonts) {
            await preloadFonts([
              data.design.fonts.heading.url,
              data.design.fonts.body.url,
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load design:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadDesign();
  }, [proposalId]);

  // Apply color palette
  const applyPalette = useCallback(
    async (palette: ColorPalette) => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedDesign: ProposalDesign = {
          ...design!,
          colors: {
            primary: palette.primary,
            secondary: palette.secondary,
            accent: palette.accent,
            success: palette.success,
            warning: palette.warning,
            error: palette.error,
            background: palette.background,
            surface: palette.surface,
            text: palette.text,
            textSecondary: palette.textSecondary,
          },
          metadata: {
            ...design?.metadata,
            paletteId: palette.id,
            paletteName: palette.name,
          },
        };

        setDesign(updatedDesign);

        // Save to API if proposalId exists
        if (proposalId) {
          const response = await fetch(`/api/proposals/${proposalId}/design`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ design: updatedDesign }),
          });

          if (!response.ok) throw new Error('Failed to save design');
        }

        // Apply CSS variables to document root
        applyColorsToDOM(updatedDesign.colors);

        return updatedDesign;
      } catch (err) {
        console.error('Failed to apply palette:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [design, proposalId]
  );

  // Apply font pairing
  const applyFontPairing = useCallback(
    async (fontPairing: FontPairing) => {
      setIsLoading(true);
      setError(null);

      try {
        // Preload fonts first
        await preloadFonts([
          fontPairing.heading.googleFontUrl,
          fontPairing.body.googleFontUrl,
        ]);

        const updatedDesign: ProposalDesign = {
          ...design!,
          fonts: {
            heading: {
              family: fontPairing.heading.font,
              weights: fontPairing.heading.weights,
              url: fontPairing.heading.googleFontUrl,
            },
            body: {
              family: fontPairing.body.font,
              weights: fontPairing.body.weights,
              url: fontPairing.body.googleFontUrl,
            },
          },
          metadata: {
            ...design?.metadata,
            fontPairingId: fontPairing.id,
            fontPairingName: fontPairing.name,
          },
        };

        setDesign(updatedDesign);

        // Save to API if proposalId exists
        if (proposalId) {
          const response = await fetch(`/api/proposals/${proposalId}/design`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ design: updatedDesign }),
          });

          if (!response.ok) throw new Error('Failed to save design');
        }

        // Apply fonts to document
        applyFontsToDOM(updatedDesign.fonts);

        return updatedDesign;
      } catch (err) {
        console.error('Failed to apply font pairing:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [design, proposalId]
  );

  // Apply complete design system (palette + fonts)
  const applyDesignSystem = useCallback(
    async (config: DesignSystemConfig) => {
      try {
        if (config.palette) {
          await applyPalette(config.palette);
        }
        if (config.fontPairing) {
          await applyFontPairing(config.fontPairing);
        }
      } catch (err) {
        throw err;
      }
    },
    [applyPalette, applyFontPairing]
  );

  // Reset to default design
  const resetDesign = useCallback(async () => {
    if (!proposalId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/design`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to reset design');

      setDesign(null);
      removeDesignFromDOM();
    } catch (err) {
      console.error('Failed to reset design:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  // Export design configuration
  const exportDesign = useCallback(() => {
    if (!design) return;

    const data = JSON.stringify(design, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-design-${proposalId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [design, proposalId]);

  return {
    design,
    isLoading,
    error,
    applyPalette,
    applyFontPairing,
    applyDesignSystem,
    resetDesign,
    exportDesign,
  };
}

/**
 * Apply colors to DOM as CSS variables
 */
function applyColorsToDOM(colors: ProposalDesign['colors']) {
  const root = document.documentElement;

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
}

/**
 * Apply fonts to DOM as CSS variables
 */
function applyFontsToDOM(fonts: ProposalDesign['fonts']) {
  const root = document.documentElement;

  root.style.setProperty('--font-heading', `'${fonts.heading.family}', sans-serif`);
  root.style.setProperty('--font-body', `'${fonts.body.family}', sans-serif`);
  root.style.setProperty('--font-heading-weight', fonts.heading.weights[0].toString());
  root.style.setProperty('--font-body-weight', fonts.body.weights[0].toString());
}

/**
 * Remove all design customizations from DOM
 */
function removeDesignFromDOM() {
  const root = document.documentElement;

  const props = [
    '--color-primary',
    '--color-secondary',
    '--color-accent',
    '--color-success',
    '--color-warning',
    '--color-error',
    '--color-background',
    '--color-surface',
    '--color-text',
    '--color-text-secondary',
    '--font-heading',
    '--font-body',
    '--font-heading-weight',
    '--font-body-weight',
  ];

  props.forEach((prop) => root.style.removeProperty(prop));
}

/**
 * Get computed design values from DOM
 */
export function getComputedDesign(): Partial<ProposalDesign> {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  return {
    colors: {
      primary: styles.getPropertyValue('--color-primary').trim() || '#0066B3',
      secondary: styles.getPropertyValue('--color-secondary').trim() || '#F7941D',
      accent: styles.getPropertyValue('--color-accent').trim() || '#FFB347',
      success: styles.getPropertyValue('--color-success').trim() || '#22C55E',
      warning: styles.getPropertyValue('--color-warning').trim() || '#F59E0B',
      error: styles.getPropertyValue('--color-error').trim() || '#EF4444',
      background: styles.getPropertyValue('--color-background').trim() || '#FFFFFF',
      surface: styles.getPropertyValue('--color-surface').trim() || '#F9FAFB',
      text: styles.getPropertyValue('--color-text').trim() || '#1F2937',
      textSecondary: styles.getPropertyValue('--color-text-secondary').trim() || '#6B7280',
    },
  };
}
