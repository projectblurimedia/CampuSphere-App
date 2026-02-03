import React, { useState } from 'react'
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
import StaffIdStep from './StaffIdStep'
import PasswordStep from './PasswordStep'
import CreatePasswordScreen from './CreatePasswordScreen'
import ForgotPasswordScreen from './forgotPassword/ForgotPasswordScreen'

const { height } = Dimensions.get('window')

const LoginScreen = ({ onLoginSuccess }) => {
  const { colors } = useTheme()
  const [step, setStep] = useState('staffId') // 'staffId', 'password', 'createPassword', 'forgotPassword'
  const [currentUser, setCurrentUser] = useState(null)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')

  const handleStaffIdSuccess = (user) => {
    setCurrentUser(user)
    if (user.hasPassword) {
      setStep('password')
    } else {
      setStep('createPassword')
    }
  }

  const handlePasswordSuccess = (userData) => {
    onLoginSuccess(userData)
  }

  const handleForgotPassword = () => {
    if (currentUser) {
      setForgotPasswordEmail(currentUser.email)
    }
    setStep('forgotPassword')
  }

  const handleBackToPassword = () => {
    setStep('password')
  }

  const handleBackToStaffId = () => {
    setStep('staffId')
    setCurrentUser(null)
  }

  const handlePasswordCreated = (userData) => {
    onLoginSuccess(userData)
  }

  const handleForgotPasswordComplete = () => {
    setStep('password')
    setForgotPasswordEmail('')
  }

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
      fontSize: 24,
      fontFamily: 'Poppins-SemiBold',
      color: '#fff',
      letterSpacing: 1,
    },
    schoolSubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: 'rgba(255,255,255,0.9)',
      marginTop: 5,
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
    switch (step) {
      case 'staffId':
        return (
          <StaffIdStep
            onSuccess={handleStaffIdSuccess}
            onBack={null}
          />
        )
      case 'password':
        return (
          <PasswordStep
            user={currentUser}
            onSuccess={handlePasswordSuccess}
            onBack={handleBackToStaffId}
            onForgotPassword={handleForgotPassword}
          />
        )
      case 'createPassword':
        return (
          <CreatePasswordScreen
            user={currentUser}
            onSuccess={handlePasswordCreated}
            onBack={handleBackToStaffId}
          />
        )
      case 'forgotPassword':
        return (
          <ForgotPasswordScreen
            email={forgotPasswordEmail}
            onSuccess={handleForgotPasswordComplete}
            onBack={handleBackToPassword}
          />
        )
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#0c7bc9']}
            style={styles.backgroundGradient}
          />

          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="school" size={42} color={colors.primary} />
              </View>
              <Text style={styles.schoolName}>SCHOOL MANAGER</Text>
              <Text style={styles.schoolSubtitle}>Staff Portal</Text>
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
    </View>
  )
}

export default LoginScreen