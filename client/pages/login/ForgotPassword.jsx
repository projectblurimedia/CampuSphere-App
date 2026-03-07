import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

// Email Verification Step Component
const EmailVerificationStep = ({ initialEmail, onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [email, setEmail] = useState(initialEmail || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      onSuccess(email)
    } catch (err) {
      setError('Failed to verify email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
      marginBottom: 30,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      height: 56,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    errorText: {
      color: colors.error || '#ef4444',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
    },
    submitButton: {
      borderRadius: 12,
      overflow: 'hidden',
      height: 56,
      marginBottom: 16,
    },
    submitGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: 45,
      borderRadius: 20,
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#fff',
      marginBottom: -2,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.description}>
        Enter your email address and we'll send you a verification code to reset your password.
      </Text>

      <View style={styles.inputContainer}>
        <Feather name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary + '80'}
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            setError('')
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          autoFocus={true}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
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
            <Text style={styles.submitButtonText}>Send Verification Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

// OTP Verification Step Component
const OtpVerificationStep = ({ email, onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  
  // Create refs for each OTP input
  const inputRefs = useRef([])

  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)

    // Auto-focus next input if current input is filled
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e, index) => {
    // Handle backspace to focus previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter complete OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      onSuccess()
    } catch (err) {
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setTimeLeft(60)
    setOtp(['', '', '', '', '', ''])
    setError('')
    
    // Focus first input after reset
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
    
    // Simulate resend API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
      marginBottom: 5,
    },
    emailText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
      marginBottom: 30,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    otpInput: {
      width: 50,
      height: 56,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      textAlign: 'center',
      fontSize: 20,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    errorText: {
      color: colors.error || '#ef4444',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
      textAlign: 'center',
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    timerText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    resendButton: {
      alignItems: 'center',
    },
    resendText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: canResend ? colors.primary : colors.textSecondary + '60',
    },
    submitButton: {
      borderRadius: 12,
      overflow: 'hidden',
      height: 56,
      marginTop: 20,
    },
    submitGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#fff',
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.description}>We've sent a code to</Text>
      <Text style={styles.emailText}>{email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            editable={!loading}
            selectTextOnFocus={true}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          Resend code in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={!canResend || loading}
      >
        <Text style={styles.resendText}>Resend Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.9}
        style={styles.submitButton}
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
            <Text style={styles.submitButtonText}>Verify & Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

// Create Password Step Component
const CreatePasswordStep = ({ onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePassword = (pass) => {
    const hasMinLength = pass.length >= 8
    const hasUpperCase = /[A-Z]/.test(pass)
    const hasLowerCase = /[a-z]/.test(pass)
    const hasNumber = /[0-9]/.test(pass)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    
    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    }
  }

  const handleSubmit = async () => {
    const validation = validatePassword(password)
    
    if (!validation.isValid) {
      setError('Password does not meet all requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      onSuccess()
    } catch (err) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validation = validatePassword(password)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
      marginBottom: 30,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      height: 56,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    passwordToggle: {
      padding: 5,
    },
    validationContainer: {
      marginBottom: 20,
    },
    validationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    validationText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginLeft: 8,
    },
    validationValid: {
      color: '#10b981',
    },
    validationInvalid: {
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.error || '#ef4444',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
    },
    submitButton: {
      borderRadius: 12,
      overflow: 'hidden',
      height: 56,
      marginTop: 10,
    },
    submitGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#fff',
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.description}>
        Your new password must be different from previously used passwords.
      </Text>

      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={colors.textSecondary + '80'}
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            setError('')
          }}
          secureTextEntry={!showPassword}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
        >
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor={colors.textSecondary + '80'}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text)
            setError('')
          }}
          secureTextEntry={!showConfirmPassword}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.passwordToggle}
        >
          <Feather
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.validationContainer}>
        <View style={styles.validationItem}>
          <Feather
            name={validation.hasMinLength ? 'check-circle' : 'circle'}
            size={14}
            color={validation.hasMinLength ? '#10b981' : colors.textSecondary}
          />
          <Text style={[styles.validationText, validation.hasMinLength && styles.validationValid]}>
            At least 8 characters
          </Text>
        </View>
        <View style={styles.validationItem}>
          <Feather
            name={validation.hasUpperCase ? 'check-circle' : 'circle'}
            size={14}
            color={validation.hasUpperCase ? '#10b981' : colors.textSecondary}
          />
          <Text style={[styles.validationText, validation.hasUpperCase && styles.validationValid]}>
            At least one uppercase letter
          </Text>
        </View>
        <View style={styles.validationItem}>
          <Feather
            name={validation.hasLowerCase ? 'check-circle' : 'circle'}
            size={14}
            color={validation.hasLowerCase ? '#10b981' : colors.textSecondary}
          />
          <Text style={[styles.validationText, validation.hasLowerCase && styles.validationValid]}>
            At least one lowercase letter
          </Text>
        </View>
        <View style={styles.validationItem}>
          <Feather
            name={validation.hasNumber ? 'check-circle' : 'circle'}
            size={14}
            color={validation.hasNumber ? '#10b981' : colors.textSecondary}
          />
          <Text style={[styles.validationText, validation.hasNumber && styles.validationValid]}>
            At least one number
          </Text>
        </View>
        <View style={styles.validationItem}>
          <Feather
            name={validation.hasSpecialChar ? 'check-circle' : 'circle'}
            size={14}
            color={validation.hasSpecialChar ? '#10b981' : colors.textSecondary}
          />
          <Text style={[styles.validationText, validation.hasSpecialChar && styles.validationValid]}>
            At least one special character
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.9}
        style={styles.submitButton}
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
            <Text style={styles.submitButtonText}>Reset Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

// Main ForgotPassword Component
const ForgotPassword = ({ email, onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [step, setStep] = useState('email') 
  const [verifiedEmail, setVerifiedEmail] = useState(email || '')

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

  const getBackButtonText = () => {
    if (step === 'email') {
      return 'Back to Login'
    } else if (step === 'otp') {
      return 'Back to Email'
    } else if (step === 'createPassword') {
      return 'Back to OTP'
    }
    return 'Back'
  }

  const handleBack = () => {
    if (step === 'email') {
      onBack()
    } else if (step === 'otp') {
      setStep('email')
    } else if (step === 'createPassword') {
      setStep('otp')
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    backButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
      marginLeft: 8,
      marginBottom: -2,
    },
    content: {
      flex: 1,
    },
  })

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <EmailVerificationStep
            initialEmail={verifiedEmail}
            onSuccess={handleEmailVerified}
            onBack={handleBack}
          />
        )
      case 'otp':
        return (
          <OtpVerificationStep
            email={verifiedEmail}
            onSuccess={handleOtpVerified}
            onBack={handleBack}
          />
        )
      case 'createPassword':
        return (
          <CreatePasswordStep
            onSuccess={handlePasswordCreated}
            onBack={handleBack}
          />
        )
      default:
        return null
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={colors.primary} />
            <Text style={styles.backButtonText}>{getBackButtonText()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {renderStep()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ForgotPassword