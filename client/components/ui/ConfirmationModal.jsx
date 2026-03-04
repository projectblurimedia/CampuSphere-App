import React from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  loading = false,
}) => {
  const { colors } = useTheme()

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'alert-octagon',
          iconColor: '#EF4444',
          gradientColors: ['#EF4444', '#DC2626'],
          bgColor: '#EF444410',
        }
      case 'info':
        return {
          icon: 'information',
          iconColor: '#3B82F6',
          gradientColors: ['#3B82F6', '#2563EB'],
          bgColor: '#3B82F610',
        }
      case 'success':
        return {
          icon: 'check-circle',
          iconColor: '#10B981',
          gradientColors: ['#10B981', '#059669'],
          bgColor: '#10B98110',
        }
      default: // warning
        return {
          icon: 'alert',
          iconColor: '#F59E0B',
          gradientColors: ['#F59E0B', '#D97706'],
          bgColor: '#F59E0B10',
        }
    }
  }

  const config = getTypeConfig()

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    blurView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContent: {
      width: SCREEN_WIDTH - 48,
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    headerGradient: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    body: {
      padding: 24,
    },
    message: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    cancelButton: {
      backgroundColor: colors.border + '40',
    },
    confirmButton: {
      backgroundColor: config.iconColor,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.5,
    },
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={20}
          tint="dark"
          style={styles.blurView}
        />
        
        <View style={styles.modalContent}>
          <LinearGradient
            colors={config.gradientColors}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={config.icon}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <ThemedText style={styles.headerTitle}>
              {title}
            </ThemedText>
          </LinearGradient>

          <View style={styles.body}>
            <ThemedText style={styles.message}>
              {message}
            </ThemedText>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, loading && styles.disabledButton]}
                onPress={onClose}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color={colors.text} />
                <ThemedText style={[styles.buttonText, styles.cancelButtonText]}>
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
                onPress={onConfirm}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <Feather name="loader" size={18} color="#FFFFFF" />
                ) : (
                  <Feather name="check" size={18} color="#FFFFFF" />
                )}
                <ThemedText style={[styles.buttonText, styles.confirmButtonText]}>
                  {loading ? 'Processing...' : confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default ConfirmationModal