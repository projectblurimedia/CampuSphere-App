import { TextInput, StyleSheet, View, Text } from 'react-native'
import { useThemeColor } from '@/hooks/use-theme-color'

export function ThemedInput({
  label,
  style,
  lightColor,
  darkColor,
  labelStyle,
  containerStyle,
  error,
  icon,
  ...rest
}) {
  const backgroundColor = useThemeColor(
    { light: lightColor || '#FFFFFF', dark: darkColor || '#1C1C1E' },
    'cardBackground'
  )
  const textColor = useThemeColor({ light: '#11181C', dark: '#FFFFFF' }, 'text')
  const borderColor = useThemeColor(
    { light: lightColor || '#E6E8EB', dark: darkColor || '#2C2C2E' },
    'border'
  )
  const tintColor = useThemeColor(
    { light: '#1d9bf0', dark: '#1d9bf0' },
    'tint'
  )
  const errorColor = useThemeColor(
    { light: '#ef4444', dark: '#ef4444' },
    'danger'
  )

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: textColor, fontFamily: 'Poppins-SemiBold' },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor: error ? errorColor : borderColor,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              fontFamily: 'Poppins-Medium',
              paddingLeft: icon ? 50 : 16,
            },
            style,
          ]}
          placeholderTextColor="#687076"
          selectionColor={tintColor}
          {...rest}
        />
      </View>
      {error && (
        <Text
          style={[
            styles.errorText,
            { color: errorColor, fontFamily: 'Poppins-Medium' },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
})