import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { useThemeColor } from '@/hooks/use-theme-color'

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')

  const fontFamilyMap = {
    default: 'Poppins-Regular',
    defaultSemiBold: 'Poppins-SemiBold',
    title: 'Poppins-Bold',
    subtitle: 'Poppins-SemiBold',
    link: 'Poppins-Regular',
  }

  const fontFamily = fontFamilyMap[type] || 'Poppins-Regular'

  return (
    <Text
      style={[
        { color, fontFamily },
        type === 'default' && styles.default,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 28,
  },
  link: {
    fontSize: 14,
    lineHeight: 24,
    color: '#1d9bf0',
  },
})
