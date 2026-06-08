// Light theme colors (existing default)
export const lightColors = {
  primary: '#0B63F6',
  background: '#F9FAFC',
  card: '#FFFFFF',
  textMain: '#1A1C1E',
  textSub: '#7D848D',
  inputBg: '#F3F4F6',
  border: '#E8E9EB',
  danger: '#FF4C4C',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
  transparent: 'transparent',
  dashboardCardBg: '#0B63F6',
  insightCardBg: '#FCE7F3',
  // Surface colors for cards, modals, etc.
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  tabBar: '#FFFFFF',
  tabBarBorder: 'transparent',
  statusBar: 'dark-content',
};

// Dark theme colors
export const darkColors = {
  primary: '#4F8EF7',
  background: '#0F1117',
  card: '#1A1D27',
  textMain: '#EAEAF0',
  textSub: '#9CA3AF',
  inputBg: '#252535',
  border: '#2D2D3D',
  danger: '#FF6B6B',
  success: '#34D399',
  warning: '#FBBF24',
  white: '#1A1D27',
  transparent: 'transparent',
  dashboardCardBg: '#1E3A5F',
  insightCardBg: '#2D1B35',
  // Surface colors for cards, modals, etc.
  surface: '#1A1D27',
  surfaceElevated: '#22252F',
  tabBar: '#1A1D27',
  tabBarBorder: '#2D2D3D',
  statusBar: 'light-content',
};

// Backward-compatible default export (light mode)
export const colors = lightColors;

export const theme = {
  colors,
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
  }
};
