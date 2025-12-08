import { Platform } from 'react-native'

const tintColor = '#1d9bf0'

export const Colors = {
  light: {
    title: '#0d3755',
    text: '#11181C',
    textSecondary: '#687076',
    background: '#fafdff',
    tint: tintColor,
    icon: '#496078',
    tabIconDefault: '#637785',
    tabIconSelected: tintColor,
    tabBarBackground: '#fafdff',
    cardBackground: '#FFFFFF',
    border: '#E6E8EB',
    accent: tintColor,
  },
  dark: {
    title: '#c1d7e7',
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0c0f14',
    tint: tintColor,
    icon: '#cad5e0',
    tabIconDefault: '#728390',
    tabIconSelected: tintColor,
    tabBarBackground: '#0c0f14',
    cardBackground: '#1A1D21',
    border: '#2D3748',
    accent: tintColor,
  },
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
})