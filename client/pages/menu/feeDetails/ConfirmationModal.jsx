import React, { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width } = Dimensions.get('window')

export default function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info', 
}) {
  const { colors } = useTheme()
  const slideAnim = useRef(new Animated.Value(width)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
      slideAnim.setValue(width)
    }
  }, [visible])

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <Ionicons name="warning" size={60} color={colors.warning} />
      case 'danger':
        return <Ionicons name="alert-circle" size={60} color={colors.danger} />
      case 'success':
        return <Feather name="check-circle" size={60} color={colors.success} />
      default:
        return <Ionicons name="information-circle" size={60} color={colors.primary} />
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'warning':
        return colors.warning
      case 'danger':
        return colors.danger
      case 'success':
        return colors.success
      default:
        return colors.primary
    }
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { 
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            opacity: fadeAnim 
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <ThemedText style={styles.title}>{title}</ThemedText>
          
          <ThemedText style={styles.message}>{message}</ThemedText>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.buttonText, styles.cancelButtonText]}>
                {cancelText}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: getButtonColor() }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {confirmText}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButtonText: {
    color: '#666',
  },
})