import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const OtpVerificationStep = ({ email, onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  // Mock OTP (in real app, this would come from your backend)
  const MOCK_OTP = '1234'

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else if (timer === 0) {
      setCanResend(true)
    }
  }, [timer, canResend])

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1].focus()
    }

    // If all digits are filled, verify
    if (newOtp.every(digit => digit !== '') && index === 3) {
      handleVerifyOtp()
    }
  }

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('')
    
    if (enteredOtp.length !== 4) {
      Alert.alert('Error', 'Please enter all 4 digits')
      return
    }

    setLoading(true)
    Keyboard.dismiss()

    // Simulate API verification
    setTimeout(() => {
      if (enteredOtp === MOCK_OTP) {
        Alert.alert('Success', 'OTP verified successfully!', [
          { text: 'Continue', onPress: onSuccess }
        ])
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.')
      }
      setLoading(false)
    }, 1000)
  }

  const handleResendOtp = () => {
    if (!canResend) return

    setTimer(60)
    setCanResend(false)
    setOtp(['', '', '', ''])
    
    Alert.alert('OTP Resent', 'A new OTP has been sent to your email.')
  }

  const styles = StyleSheet.create({
    welcomeText: {
      fontSize: 24,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 5,
    },
    subtitleText: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    emailText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 30,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    otpInput: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderColor: colors.border,
      fontSize: 24,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      textAlign: 'center',
    },
    otpInputFocused: {
      borderColor: colors.primary,
    },
    infoText: {
      fontSize: 12,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary + '80',
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 18,
    },
    timerText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 25,
    },
    resendText: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
      marginRight: 5,
    },
    resendButton: {
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    resendButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: canResend ? colors.primary : colors.textSecondary + '60',
    },
    submitButton: {
      borderRadius: 12,
      overflow: 'hidden',
      height: 56,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitGradient: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#fff',
    },
    submitIcon: {
      marginLeft: 10,
    },
  })

  return (
    <>
      <Text style={styles.welcomeText}>Verify OTP</Text>
      <Text style={styles.subtitleText}>Enter the 4-digit code sent to</Text>
      <Text style={styles.emailText}>{email}</Text>

      {/* OTP Inputs */}
      <View style={styles.otpContainer}>
        {[0, 1, 2, 3].map((index) => (
          <TextInput
            key={index}
            ref={ref => inputRefs.current[index] = ref}
            style={[
              styles.otpInput,
              otp[index] && styles.otpInputFocused
            ]}
            value={otp[index]}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!loading}
            selectTextOnFocus
          />
        ))}
      </View>

      <Text style={styles.infoText}>
        Enter the 4-digit verification code you received in your email.
      </Text>

      {/* Timer */}
      <Text style={styles.timerText}>
        {canResend ? 'Didn\'t receive code?' : `Resend OTP in ${timer}s`}
      </Text>

      {/* Resend OTP */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code?</Text>
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOtp}
          disabled={!canResend || loading}
        >
          <Text style={styles.resendButtonText}>
            Resend OTP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleVerifyOtp}
        disabled={loading || otp.some(digit => digit === '')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#0c7bc9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Verify OTP</Text>
              <FontAwesome5 name="check" size={16} color="#fff" style={styles.submitIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  )
}

export default OtpVerificationStep