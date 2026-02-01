export interface PathTheme {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    accent: {
      primary: string;
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

export const darkTheme: PathTheme = {
  colors: {
    background: {
      primary: '#1a1a1a',
      secondary: '#2a2a2a',
      tertiary: '#333333',
    },
    accent: {
      primary: '#FF6B00',
      hover: '#FF8533',
      active: '#CC5500',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      muted: '#888888',
    },
    border: {
      primary: '#444444',
      secondary: '#555555',
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
