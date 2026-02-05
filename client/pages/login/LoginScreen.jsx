import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import EmailPhoneStep from './EmailPhoneStep'
import PasswordStep from './PasswordStep'
import CreatePasswordScreen from './CreatePasswordScreen'
import { useDispatch, useSelector } from 'react-redux'
import { 
  resetLoginFlow,
  loadEmployeeFromStorage,
  clearError 
} from '@/redux/employeeSlice'
import { useRouter } from 'expo-router'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { height } = Dimensions.get('window')

const LoginScreen = () => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  
  const { 
    currentStep, 
    isAuthenticated,
    employee,
    isLoading,
    error 
  } = useSelector((state) => state.employee)

  // State for toast
  const [toast, setToast] = React.useState(null)

  // Show toast when there's an error
  useEffect(() => {
    if (error) {
      setToast({
        message: error,
        type: 'error'
      })
    }
  }, [error])

  const hideToast = React.useCallback(() => {
    setToast(null)
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    dispatch(loadEmployeeFromStorage())
    // Clear any previous errors when component mounts
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    // If already authenticated, redirect to tabs
    if (isAuthenticated && employee) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        router.replace('/(tabs)')
      }, 100)
    }
  }, [isAuthenticated, employee, router])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    backgroundGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.4,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },
    headerSection: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 40 : 60,
      paddingBottom: 30,
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    schoolName: {
      fontSize: 22,
      fontFamily: 'Poppins-Bold',
      color: '#fff',
      letterSpacing: 1,
    },
    schoolSubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: 'rgba(255,255,255,0.9)',
    },
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 24,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 40,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    footer: {
      marginTop: 30,
      alignItems: 'center',
    },
    versionText: {
      fontSize: 11,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary + '60',
      marginTop: 5,
    },
  })

  const renderStep = () => {
    // Don't show loading indicator - button will handle it
    switch (currentStep) {
      case 'emailPhone':
        return <EmailPhoneStep />
      case 'password':
        return <PasswordStep onBack={() => dispatch(resetLoginFlow())} />
      case 'createPassword':
        return <CreatePasswordScreen onBack={() => dispatch(resetLoginFlow())} />
      default:
        return <EmailPhoneStep />
    }
  }

  return (
    <View style={styles.container}>      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Beautiful Gradient Background */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
          />

          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="school" size={42} color="#1d9bf0" />
              </View>
              <Text style={styles.schoolName}>SCHOOL MANAGER</Text>
              <Text style={styles.schoolSubtitle}>Employee Portal</Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formCard}>
            {renderStep()}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.versionText}>
                © {new Date().getFullYear()} School Management System • Version 1.0.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Notification */}
      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={hideToast}
        position="bottom-center"
        duration={3000}
        showCloseButton={true}
      />
    </View>
  )
}

export default LoginScreen