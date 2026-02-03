import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import EmailVerificationStep from './EmailVerificationStep'
import OtpVerificationStep from './OtpVerificationStep'
import CreatePasswordScreen from '../CreatePasswordScreen'

const ForgotPasswordScreen = ({ email, onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [step, setStep] = useState('email') // 'email', 'otp', 'createPassword'
  const [verifiedEmail, setVerifiedEmail] = useState('')

  const handleEmailVerified = (email) => {
    setVerifiedEmail(email)
    setStep('otp')
  }

  const handleOtpVerified = () => {
    setStep('createPassword')
  }

  const handlePasswordCreated = () => {
    onSuccess()
  }

  const handleBackFromEmail = () => {
    if (step === 'email') {
      onBack()
    } else if (step === 'otp') {
      setStep('email')
    } else {
      setStep('otp')
    }
  }

  const styles = StyleSheet.create({
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 15,
    },
    backButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
      marginLeft: 10,
    },
  })

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <EmailVerificationStep
            initialEmail={email}
            onSuccess={handleEmailVerified}
            onBack={handleBackFromEmail}
          />
        )
      case 'otp':
        return (
          <OtpVerificationStep
            email={verifiedEmail}
            onSuccess={handleOtpVerified}
            onBack={handleBackFromEmail}
          />
        )
      case 'createPassword':
        return (
          <CreatePasswordScreen
            user={{ email: verifiedEmail }}
            onSuccess={handlePasswordCreated}
            onBack={handleBackFromEmail}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackFromEmail}
      >
        <FontAwesome5 name="arrow-left" size={18} color={colors.primary} />
        <Text style={styles.backButtonText}>
          {step === 'email' ? 'Back to Login' : 'Back'}
        </Text>
      </TouchableOpacity>

      {renderStep()}
    </>
  )
}

export default ForgotPasswordScreen