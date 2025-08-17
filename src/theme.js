// Base theme structure to extend
const baseTheme = {
  shadows: {
    sm: '0 1px 2px 0 #0000000D',
    md: '0 4px 6px -1px #0000001A',
    lg: '0 10px 15px -3px #0000001A',
  },
};

// Base tokens that all themes should have
const baseTokens = {
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },
  ui: {
    border: '#E2E8F0',
    divider: '#EDF2F7',
    hover: '#F1F5F9',
    focus: '#61dafb',
    selection: '#c6f6d5',
    highlight: '#fbd38d',
    error: '#feb2b2',
    warning: '#FED7D7',
  },
  accent: {
    blue: { extra: '#c3dbfa', main: '#3182CE', light: '#4299E1', dark: '#2563EB' },
    green: { extra: '#b7f5c8', main: '#38A169', light: '#48BB78', dark: '#2F855A' },
    red: { extra: '#fbbcbc', main: '#E53E3E', light: '#F56565', dark: '#e74c3c' },
    purple: { extra: '#d1b3fa', main: '#6B46C1', light: '#9F7AEA', dark: '#553C9A' },
  },
};

// Helper function to create a theme with tokens
const createTheme = (colors) => {
  const accent = {
    blue: colors.info || baseTokens.accent.blue,
    green: colors.success || baseTokens.accent.green,
    red: colors.error || baseTokens.accent.red,
    purple: colors.secondary || colors.primary || baseTokens.accent.purple,
  };
  return {
    ...baseTheme,
    colors,
    tokens: {
      ...baseTokens,
      ...colors,  // Include colors in tokens for backward compatibility
      accent,
    },
  };
};

export const lightTheme = createTheme({
  primary: {
    main: '#4CAF50',
    light: '#68D391',
    dark: '#2F855A',
  },
  secondary: {
    main: '#2196F3',
    light: '#63B3ED',
    dark: '#2B6CB0',
  },
  success: {
    main: '#38A169',
    light: '#48BB78',
    dark: '#27ae60',
  },
  error: {
    main: '#E53E3E',
    light: '#F56565',
    dark: '#e74c3c',
  },
  warning: {
    main: '#ECC94B',
    light: '#F6E05E',
    dark: '#D69E2E',
  },
  info: {
    main: '#3182CE',
    light: '#4299E1',
    dark: '#2563EB',
  },
  danger: {
    main: '#E53E3E',
  },
  // Background colors
  background: {
    main: '#F8FAFC',
    paper: '#FFFFFF',
    sidebar: '#FFFFFF',
    default: '#FFFFFF',
    dark: '#1e1e1e',
    alt: '#282c34',
  },
  
  // Text colors
  text: {
    primary: '#2D3748',
    secondary: '#718096',
    disabled: '#A0AEC0',
  },
  
  // Border colors
  border: '#E2E8F0',
  
  // Status colors
  status: {
    active: '#F0FFF4',
    activeText: '#38A169',
    inactive: '#FFF5F5',
    inactiveText: '#E53E3E',
  },

  // Grayscale
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },

  // UI specific colors
  ui: {
    border: '#E2E8F0',
    divider: '#EDF2F7',
    hover: '#F1F5F9',
    focus: '#61dafb',
    selection: '#c6f6d5',
    highlight: '#fbd38d',
    error: '#feb2b2',
    warning: '#FED7D7',
  },

  // Chart colors
  chart: {
    open: {
      border: '#4BC0C0',
      bg: '#4BC0C033',
    },
    close: {
      border: '#FF6384',
      bg: '#FF638433',
    },
    reg: {
      border: '#36A2EB',
      bg: '#36A2EB33',
    },
  },
});

export const darkTheme = createTheme({
  primary: {
    main: '#68D391',
    light: '#9AE6B4',
    dark: '#48BB78',
  },
  secondary: {
    main: '#63B3ED',
    light: '#90CDF4',
    dark: '#4299E1',
  },
  success: {
    main: '#48BB78',
    light: '#68D391',
    dark: '#38A169',
  },
  error: {
    main: '#F56565',
    light: '#FC8181',
    dark: '#E53E3E',
  },
  warning: {
    main: '#F6E05E',
    light: '#FAF089',
    dark: '#ECC94B',
  },
  info: {
    main: '#4299E1',
    light: '#63B3ED',
    dark: '#3182CE',
  },
  danger: {
    main: '#F56565',
  },
  background: {
    main: '#1A202C',
    paper: '#2D3748',
    sidebar: '#2D3748',
    default: '#1A202C',
    dark: '#171923',
    alt: '#2D3748',
  },
  
  text: {
    primary: '#F7FAFC',
    secondary: '#CBD5E0',
    disabled: '#718096',
  },
  
  border: '#4A5568',
  
  status: {
    active: '#2F3B52',
    activeText: '#68D391',
    inactive: '#3B3747',
    inactiveText: '#F56565',
  },

  // Grayscale
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },

  // UI specific colors
  ui: {
    border: '#4A5568',
    divider: '#4A5568',
    hover: '#2D3748',
    focus: '#63B3ED',
    selection: '#2F855A',
    highlight: '#D69E2E',
    error: '#FC8181',
    warning: '#3B3747',
  },

  // Chart colors - using slightly brighter colors for dark theme
  chart: {
    open: {
      border: '#55CACA',
      bg: '#55CACA33',
    },
    close: {
      border: '#FF6D8E',
      bg: '#FF6D8E33',
    },
    reg: {
      border: '#40ACF5',
      bg: '#40ACF533',
    },
  },
});

export const purpleRaindropsTheme = createTheme({
  primary: {
    main: '#7209B7',
    light: '#B5179E',
    dark: '#560BAD',
  },
  secondary: {
    main: '#4361EE',
    light: '#4895EF',
    dark: '#3A0CA3',
  },
  success: {
    main: '#4CC9F0',
    light: '#4895EF',
    dark: '#3F37C9',
  },
  error: {
    main: '#F72585',
    light: '#F72585',
    dark: '#B5179E',
  },
  warning: {
    main: '#4895EF',
    light: '#4CC9F0',
    dark: '#4361EE',
  },
  info: {
    main: '#3A0CA3',
    light: '#4361EE',
    dark: '#3F37C9',
  },
  danger: {
    main: '#F72585',
  },
  background: {
    main: '#F4EEFB',
    paper: '#FFFFFF',
    sidebar: '#FAF6FF',
    default: '#F7F2FF',
    dark: '#480CA8',
    alt: '#560BAD',
  },
  text: {
    primary: '#3A0CA3',
    secondary: '#4361EE',
    disabled: '#B5179E',
  },
  border: '#4895EF',
  status: {
    active: '#F0FFF4',
    activeText: '#4CC9F0',
    inactive: '#FFF5F5',
    inactiveText: '#F72585',
  },
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },
  ui: {
    border: '#4895EF',
    divider: '#4CC9F0',
    hover: '#F1F5F9',
    focus: '#3A0CA3',
    selection: '#B5179E',
    highlight: '#4361EE',
    error: '#F72585',
    warning: '#4895EF',
  },
  chart: {
    open: {
      border: '#4CC9F0',
      bg: '#4CC9F033',
    },
    close: {
      border: '#F72585',
      bg: '#F7258533',
    },
    reg: {
      border: '#3A0CA3',
      bg: '#3A0CA333',
    },
  },
});

export const earthyGrayTheme = createTheme({
  primary: {
    main: '#52796F',
    light: '#84A98C',
    dark: '#354F52',
  },
  secondary: {
    main: '#84A98C',
    light: '#CAD2C5',
    dark: '#52796F',
  },
  success: {
    main: '#84A98C',
    light: '#CAD2C5',
    dark: '#52796F',
  },
  error: {
    main: '#2F3E46',
    light: '#354F52',
    dark: '#2F3E46',
  },
  warning: {
    main: '#84A98C',
    light: '#CAD2C5',
    dark: '#52796F',
  },
  info: {
    main: '#52796F',
    light: '#84A98C',
    dark: '#354F52',
  },
  danger: {
    main: '#2F3E46',
  },
  background: {
    main: '#EAF2EE',
    paper: '#FFFFFF',
    sidebar: '#F6FAF7',
    default: '#F3F7F4',
    dark: '#2F3E46',
    alt: '#354F52',
  },
  text: {
    primary: '#2F3E46',
    secondary: '#52796F',
    disabled: '#84A98C',
  },
  border: '#84A98C',
  status: {
    active: '#F0FFF4',
    activeText: '#84A98C',
    inactive: '#FFF5F5',
    inactiveText: '#2F3E46',
  },
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },
  ui: {
    border: '#84A98C',
    divider: '#CAD2C5',
    hover: '#F1F5F9',
    focus: '#52796F',
    selection: '#354F52',
    highlight: '#84A98C',
    error: '#2F3E46',
    warning: '#84A98C',
  },
  chart: {
    open: {
      border: '#84A98C',
      bg: '#84A98C33',
    },
    close: {
      border: '#2F3E46',
      bg: '#2F3E4633',
    },
    reg: {
      border: '#52796F',
      bg: '#52796F33',
    },
  },
});

export const pastelDreamlandTheme = createTheme({
  primary: {
    main: '#CDB4DB',
    light: '#FFC8DD',
    dark: '#FFAFCC',
  },
  secondary: {
    main: '#BDE0FE',
    light: '#A2D2FF',
    dark: '#CDB4DB',
  },
  success: {
    main: '#A2D2FF',
    light: '#BDE0FE',
    dark: '#FFAFCC',
  },
  error: {
    main: '#FFAFCC',
    light: '#FFC8DD',
    dark: '#CDB4DB',
  },
  warning: {
    main: '#FFC8DD',
    light: '#FFAFCC',
    dark: '#CDB4DB',
  },
  info: {
    main: '#BDE0FE',
    light: '#A2D2FF',
    dark: '#CDB4DB',
  },
  danger: {
    main: '#FFAFCC',
  },
  background: {
    main: '#FFF0F6',
    paper: '#FFFFFF',
    sidebar: '#FFF7FB',
    default: '#FFF6FB',
    dark: '#CDB4DB',
    alt: '#FFAFCC',
  },
  text: {
    primary: '#6B4E71',
    secondary: '#8B7B8B',
    disabled: '#A799A7',
  },
  border: '#FFC8DD',
  status: {
    active: '#F0FFF4',
    activeText: '#A2D2FF',
    inactive: '#FFF5F5',
    inactiveText: '#FFAFCC',
  },
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },
  ui: {
    border: '#FFC8DD',
    divider: '#FFF5F9',
    hover: '#F1F5F9',
    focus: '#BDE0FE',
    selection: '#CDB4DB',
    highlight: '#FFC8DD',
    error: '#FFAFCC',
    warning: '#FFC8DD',
  },
  chart: {
    open: {
      border: '#A2D2FF',
      bg: '#A2D2FF33',
    },
    close: {
      border: '#FFAFCC',
      bg: '#FFAFCC33',
    },
    reg: {
      border: '#BDE0FE',
      bg: '#BDE0FE33',
    },
  },
});

export const candyPopTheme = createTheme({
  primary: {
    main: '#9B5DE5',
    light: '#F15BB5',
    dark: '#7B44B8',
  },
  secondary: {
    main: '#00BBF9',
    light: '#00F5D4',
    dark: '#0095C7',
  },
  success: {
    main: '#00F5D4',
    light: '#00BBF9',
    dark: '#00C4AD',
  },
  error: {
    main: '#F15BB5',
    light: '#F47CC5',
    dark: '#C14891',
  },
  warning: {
    main: '#FEE440',
    light: '#FEE966',
    dark: '#CBB633',
  },
  info: {
    main: '#00BBF9',
    light: '#00F5D4',
    dark: '#0095C7',
  },
  danger: {
    main: '#F15BB5',
  },
  background: {
    main: '#FFF8FE',
    paper: '#FFFFFF',
    sidebar: '#FFFDF7',
    default: '#FFF4FA',
    dark: '#9B5DE5',
    alt: '#F15BB5',
  },
  text: {
    primary: '#2D1B36',
    secondary: '#574D5E',
    disabled: '#8E8696',
  },
  border: '#E2E8F0',
  status: {
    active: '#F0FFF4',
    activeText: '#00F5D4',
    inactive: '#FFF5F5',
    inactiveText: '#F15BB5',
  },
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },
  ui: {
    border: '#E2E8F0',
    divider: '#F8F9FA',
    hover: '#F1F5F9',
    focus: '#00BBF9',
    selection: '#9B5DE5',
    highlight: '#FEE440',
    error: '#F15BB5',
    warning: '#FEE440',
  },
  chart: {
    open: {
      border: '#00F5D4',
      bg: '#00F5D433',
    },
    close: {
      border: '#F15BB5',
      bg: '#F15BB533',
    },
    reg: {
      border: '#00BBF9',
      bg: '#00BBF933',
    },
  },
});

export const midnightMagicTheme = createTheme({
  primary: {
    main: '#3A015C',
    light: '#4F0147',
    dark: '#35012C',
  },
  secondary: {
    main: '#4F0147',
    light: '#35012C',
    dark: '#290025',
  },
  success: {
    main: '#4F0147',
    light: '#3A015C',
    dark: '#35012C',
  },
  error: {
    main: '#35012C',
    light: '#4F0147',
    dark: '#290025',
  },
  warning: {
    main: '#3A015C',
    light: '#4F0147',
    dark: '#35012C',
  },
  info: {
    main: '#4F0147',
    light: '#3A015C',
    dark: '#35012C',
  },
  danger: {
    main: '#35012C',
  },
  background: {
    main: '#11001C',
    paper: '#290025',
    sidebar: '#290025',
    default: '#290025',
    dark: '#11001C',
    alt: '#35012C',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B8A2C5',
    disabled: '#6B4E71',
  },
  border: '#4F0147',
  status: {
    active: '#2F3B52',
    activeText: '#4F0147',
    inactive: '#3B3747',
    inactiveText: '#35012C',
  },
  grey: {
    100: '#F8FAFC',
    200: '#F7FAFC',
    300: '#EDF2F7',
    400: '#E2E8F0',
    500: '#CBD5E0',
    600: '#A0AEC0',
    700: '#718096',
    800: '#4A5568',
    900: '#2D3748',
    1000: '#1A202C',
  },
  ui: {
    border: '#4F0147',
    divider: '#290025',
    hover: '#35012C',
    focus: '#3A015C',
    selection: '#4F0147',
    highlight: '#3A015C',
    error: '#35012C',
    warning: '#3A015C',
  },
  chart: {
    open: {
      border: '#4F0147',
      bg: '#4F014733',
    },
    close: {
      border: '#35012C',
      bg: '#35012C33',
    },
    reg: {
      border: '#3A015C',
      bg: '#3A015C33',
    },
  },
});

// Export all themes in a map for easy access
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  purpleRaindrops: purpleRaindropsTheme,
  earthyGray: earthyGrayTheme,
  pastelDreamland: pastelDreamlandTheme,
  candyPop: candyPopTheme,
  midnightMagic: midnightMagicTheme,
}; 