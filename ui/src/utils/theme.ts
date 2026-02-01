export interface PathTheme {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    accent: {
      primary: string;
      secondary: string;
      hover: string;
      active: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: {
      primary: string;
      secondary: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontFamily: string;
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export const lightTheme: PathTheme = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F7F9',
      tertiary: '#EDF1F5',
    },
    accent: {
      primary: '#4A7C8A',    // Steel teal - like a fish scale
      secondary: '#5A8F9E',
      hover: '#5A8F9E',
      active: '#3A6570',
    },
    text: {
      primary: '#1A2B33',
      secondary: '#4A5D68',
      muted: '#7A8D98',
    },
    border: {
      primary: '#D1DBE1',
      secondary: '#B8C7D0',
    },
    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};
