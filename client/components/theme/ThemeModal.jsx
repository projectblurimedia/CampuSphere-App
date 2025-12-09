import React, { useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, FontAwesome6 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const ThemeModal = ({ visible, onClose }) => {
  const { theme, colors, changeTheme } = useTheme()
  const modalScale = useRef(new Animated.Value(0.8)).current
  const modalOpacity = useRef(new Animated.Value(0)).current

  const themeOptions = [
    { 
      id: 'system', 
      label: 'System Default', 
      icon: 'settings',
      gradient: ['#667eea', '#764ba2']
    },
    { 
      id: 'light', 
      label: 'Light Mode', 
      icon: 'sun',
      gradient: ['#fbbf24', '#f59e0b']
    },
    { 
      id: 'dark', 
      label: 'Dark Mode', 
      icon: 'moon',
      gradient: ['#4f46e5', '#7c3aed']
    },
  ]

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 0.8,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const handleThemeSelect = (themeId) => {
    changeTheme(themeId)
    setTimeout(() => onClose(), 300)
  }

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.backdropAnimated,
            { opacity: modalOpacity }
          ]}
        />
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.modalContainer,
          { 
            opacity: modalOpacity,
            transform: [{ scale: modalScale }]
          }
        ]}
      >
        <View style={[
          styles.modalContent,
          { backgroundColor: colors.cardBackground }
        ]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <FontAwesome6 name="palette" size={28} color="#FFFFFF" />
              </View>
              <ThemedText type='subtitle' style={styles.headerTitle}>
                Choose Theme
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Select your preferred app theme
              </ThemedText>
            </View>
          </LinearGradient>

          <View style={styles.optionsContainer}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  { 
                    backgroundColor: colors.cardBackground,
                    borderWidth: theme === option.id ? 2 : 1,
                    borderColor: theme === option.id ? colors.tint : colors.border,
                  }
                ]}
                activeOpacity={0.7}
                onPress={() => handleThemeSelect(option.id)}
              >
                <LinearGradient
                  colors={option.gradient}
                  style={styles.optionIcon}
                >
                  <Feather name={option.icon} size={24} color="#FFFFFF" />
                </LinearGradient>
                
                <View style={styles.optionText}>
                  <ThemedText 
                    style={[
                      styles.optionLabel,
                      { color: theme === option.id ? colors.tint : colors.text }
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </View>
                
                {theme === option.id && (
                  <View style={[styles.selected, { backgroundColor: colors.tint }]}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { borderTopColor: colors.border }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.closeText, { color: colors.textSecondary }]}>
              Close
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropAnimated: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  selected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ThemeModal