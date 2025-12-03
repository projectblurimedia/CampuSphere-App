import { Platform } from 'react-native'

const tintColor = '#1d9bf0'

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fafdff',
    tint: tintColor,
    icon: '#496078',
    tabIconDefault: '#637785',
    tabIconSelected: tintColor,
    tabBarBackground: '#fafdff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0c0f14',
    tint: tintColor,
    icon: '#cad5e0',
    tabIconDefault: '#728390',
    tabIconSelected: tintColor,
    tabBarBackground: '#0c0f14',
  },
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
