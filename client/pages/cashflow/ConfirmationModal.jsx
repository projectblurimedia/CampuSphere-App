import React from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = '#ef4444',
  loading = false,
  icon = 'alert-triangle'
}) => {
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      width: SCREEN_WIDTH * 0.85,
      borderRadius: 24,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    content: {
      padding: 24,
      alignItems: 'center',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: confirmButtonColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.2)',
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    cancelButton: {
      borderRightWidth: 1,
      borderRightColor: 'rgba(255,255,255,0.2)',
    },
    confirmButton: {
      backgroundColor: confirmButtonColor,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
    },
  })

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: confirmButtonColor + '30' }]}>
              <Feather name={icon} size={32} color={confirmButtonColor} />
            </View>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.message}>{message}</ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Feather name="x" size={18} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>{cancelText}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: confirmButtonColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>{confirmText}</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Modal>
  )
}

export default ConfirmationModal