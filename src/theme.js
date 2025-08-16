export const lightTheme = {
  colors: {
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
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

export const darkTheme = {
  colors: {
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
      divider: '#2D3748',
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
        border: 'rgb(85,202,202)',
        bg: 'rgba(85,202,202,0.2)',
      },
      close: {
        border: 'rgb(255,109,142)',
        bg: 'rgba(255,109,142,0.2)',
      },
      reg: {
        border: 'rgb(64,172,245)',
        bg: 'rgba(64,172,245,0.2)',
      },
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
}; 

export const defaultTheme = {
  colors: {
    // Primary palette
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
    
    // Status colors
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
    
    // Additional colors
    accent: {
      blue: {
        light: '#EBF8FF',
        main: '#00B1FF',
        dark: '#2B6CB0',
      },
      green: {
        light: '#F0FFF4',
        main: '#9ae6b4',
        dark: '#1f3d2b',
      },
      red: {
        light: '#FFF5F5',
        main: '#FF473E',
        dark: '#4a2020',
      },
      orange: {
        light: '#fefcbf',
        main: '#ED8936',
        dark: '#D69E2E',
      },
      purple: {
        light: '#A97DFF',
        main: '#517394',
        dark: '#2a4365',
      },
    },
    
    // Special colors
    background: {
      default: '#FFFFFF',
      paper: '#F8FAFC',
      dark: '#1e1e1e',
      alt: '#282c34',
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
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
}; 