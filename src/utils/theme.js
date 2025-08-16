/**
 * Gets a color value from the theme, handling both old flat and new nested structures
 * @param {Object} theme The theme object
 * @param {string} colorKey The color key (e.g., 'primary', 'success', etc.)
 * @returns {string} The color value
 */
export function getThemeColor(theme, colorKey) {
  if (!theme?.colors) return null;

  // Special cases that don't follow main/light/dark pattern
  if (colorKey === 'border' || 
      colorKey.startsWith('text.') || 
      colorKey.startsWith('background.') ||
      colorKey.startsWith('status.') ||
      colorKey.startsWith('ui.')) {
    return colorKey.split('.').reduce((obj, key) => obj?.[key], theme.colors);
  }

  // Handle nested color objects
  const color = theme.colors[colorKey];
  if (typeof color === 'string') return color;  // Old flat structure
  if (color?.main) return color.main;  // New nested structure
  
  // Try tokens as fallback
  return theme.tokens?.[colorKey]?.main;
}

/**
 * Gets a specific variant (main/light/dark) of a color from the theme
 * @param {Object} theme The theme object
 * @param {string} colorKey The color key (e.g., 'primary', 'success', etc.)
 * @param {string} variant The variant ('main', 'light', or 'dark')
 * @returns {string} The color value
 */
export function getThemeColorVariant(theme, colorKey, variant = 'main') {
  if (!theme?.colors) return null;

  const color = theme.colors[colorKey];
  if (typeof color === 'string') return color;  // Old flat structure
  if (color?.[variant]) return color[variant];  // New nested structure
  
  // Try tokens as fallback
  return theme.tokens?.[colorKey]?.[variant];
}

/**
 * Gets chart colors from the theme
 * @param {Object} theme The theme object
 * @param {string} type The chart type ('open', 'close', or 'reg')
 * @returns {{ border: string, bg: string }} The chart colors
 */
export function getChartColors(theme) {
  if (!theme?.colors?.chart) {
    // Fallback colors if theme.chart is not defined
    return {
      open: {
        border: 'rgb(75,192,192)',
        bg: 'rgba(75,192,192,0.2)',
      },
      close: {
        border: 'rgb(255,99,132)',
        bg: 'rgba(255,99,132,0.2)',
      },
      reg: {
        border: 'rgb(54,162,235)',
        bg: 'rgba(54,162,235,0.2)',
      },
    };
  }
  return theme.colors.chart;
}

// Common color keys for reference
export const ThemeColors = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  ERROR: 'error',
  DANGER: 'error',  // alias for error
  WARNING: 'warning',
  INFO: 'info',
}; 