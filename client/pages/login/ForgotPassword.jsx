import React, { useState, useRef, useEffect } from 'react'
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
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useDispatch, useSelector } from 'react-redux'
import {
  forgotPassword,
  verifyOTP,
  resetPassword,
  setForgotPasswordStep,
  resetForgotPassword,
  clearForgotPasswordError,
} from '@/redux/employeeSlice'

// Confirmation Modal Component
const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, loading }) => {
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#fff',
    },
  })

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Email Verification Step Component
const EmailVerificationStep = ({ onSuccess, onBack }) => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { isLoading, error, message } = useSelector((state) => state.employee.forgotPassword)
  const { tempEmployee } = useSelector((state) => state.employee)
  
  const [selectedContact, setSelectedContact] = useState('email') // 'email' or 'phone'
  const [inputError, setInputError] = useState('')
  
  // Get email and phone from tempEmployee
  const email = tempEmployee?.email || ''
  const phone = tempEmployee?.phone || ''

  const handleSubmit = async () => {
    setInputError('')
    dispatch(clearForgotPasswordError())

    const contactValue = selectedContact === 'email' ? email : phone
    
    if (!contactValue) {
      setInputError(`No ${selectedContact === 'email' ? 'email' : 'phone number'} found for this employee`)
      return
    }

    // Validate based on selected contact type
    if (selectedContact === 'email') {
      const isEmail = contactValue.includes('@')
      if (!isEmail) {
        setInputError('Invalid email format')
        return
      }
    } else {
      const isPhone = /^\d{10}$/.test(contactValue.replace(/\D/g, ''))
      if (!isPhone) {
        setInputError('Invalid phone number format')
        return
      }
    }

    const result = await dispatch(forgotPassword(contactValue))
    
    if (forgotPassword.fulfilled.match(result) && result.payload?.success) {
      if (onSuccess) {
        onSuccess(contactValue)
      }
    }
  }

  const toggleContactMethod = () => {
    setSelectedContact(prev => prev === 'email' ? 'phone' : 'email')
    setInputError('')
    dispatch(clearForgotPasswordError())
  }

  const styles = StyleSheet.create({
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
      marginBottom: 20,
    },
    contactCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    contactLabel: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contactValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    switchButton: {
      alignSelf: 'flex-start',
    },
    switchButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: inputError || error ? colors.error : colors.border,
      height: 56,
      opacity: 0.8,
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
    inputDisabled: {
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.error || '#ef4444',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
    },
    successText: {
      color: '#10b981',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
      textAlign: 'center',
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
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    badge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      marginRight: 8,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
  })

  return (
    <View>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.description}>
        We'll send a verification code to your registered contact method.
      </Text>

      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {selectedContact === 'email' ? '📧 Email' : '📱 Mobile'}
          </Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactLabel}>
          {selectedContact === 'email' ? 'EMAIL ADDRESS' : 'PHONE NUMBER'}
        </Text>
        <Text style={styles.contactValue}>
          {selectedContact === 'email' ? email : phone}
        </Text>
        
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={toggleContactMethod}
          disabled={isLoading}
        >
          <Text style={styles.switchButtonText}>
            {selectedContact === 'email' 
              ? '📱 Use mobile number instead' 
              : '📧 Use email instead'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Display the contact in a disabled input for clarity */}
      <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground + '80' }]}>
        <Feather 
          name={selectedContact === 'email' ? 'mail' : 'phone'} 
          size={20} 
          color={colors.textSecondary} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={selectedContact === 'email' ? email : phone}
          editable={false}
          selectTextOnFocus={false}
        />
      </View>

      {inputError ? <Text style={styles.errorText}>{inputError}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading || !(selectedContact === 'email' ? email : phone)}
        activeOpacity={0.9}
        style={styles.submitButton}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#0c7bc9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Send Code to {selectedContact === 'email' ? 'Email' : 'Mobile'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

// OTP Verification Step Component
const OtpVerificationStep = ({ contact, onBack }) => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { isLoading, error, employeeId } = useSelector((state) => state.employee.forgotPassword)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Create refs for each OTP input
  const inputRefs = useRef([])

  useEffect(() => {
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
      setShowConfirmModal(true)
      return
    }

    if (!employeeId) {
      setShowConfirmModal(true)
      return
    }

    const result = await dispatch(verifyOTP({ employeeId, otp: otpString }))
    
    if (verifyOTP.fulfilled.match(result) && result.payload?.success) {
      // Will automatically move to createPassword step via Redux
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    
    setCanResend(false)
    setTimeLeft(60)
    setOtp(['', '', '', '', '', ''])
    
    // Focus first input after reset
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
    
    // Resend OTP using the contact
    await dispatch(forgotPassword(contact))
  }

  const getErrorMessage = () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      return 'Please enter complete 6-digit OTP'
    }
    if (!employeeId) {
      return 'Session expired. Please start over.'
    }
    return error
  }

  const styles = StyleSheet.create({
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
    contactText: {
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
      marginBottom: 20,
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
    <>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.description}>We've sent a code to</Text>
      <Text style={styles.contactText}>{contact}</Text>

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
            editable={!isLoading}
            selectTextOnFocus={true}
          />
        ))}
      </View>

      {error && !getErrorMessage().includes('Please') ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          Resend code in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={!canResend || isLoading}
      >
        <Text style={styles.resendText}>Resend Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.9}
        style={styles.submitButton}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#0c7bc9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Verify & Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <ConfirmationModal
        visible={showConfirmModal}
        title="Invalid OTP"
        message={getErrorMessage() || 'Please check your OTP and try again.'}
        onConfirm={() => setShowConfirmModal(false)}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  )
}

// Create Password Step Component
const CreatePasswordStep = ({ onSuccess }) => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { isLoading, error, resetToken } = useSelector((state) => state.employee.forgotPassword)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({ title: '', message: '' })

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
      setModalConfig({
        title: 'Invalid Password',
        message: 'Password does not meet all requirements. Please check the criteria below.'
      })
      setShowConfirmModal(true)
      return
    }

    if (password !== confirmPassword) {
      setModalConfig({
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please make sure both passwords are identical.'
      })
      setShowConfirmModal(true)
      return
    }

    if (!resetToken) {
      setModalConfig({
        title: 'Session Expired',
        message: 'Your session has expired. Please start the password reset process again.'
      })
      setShowConfirmModal(true)
      return
    }

    const result = await dispatch(resetPassword({
      resetToken,
      newPassword: password,
      confirmPassword
    }))
    
    if (resetPassword.fulfilled.match(result) && result.payload?.success) {
      setModalConfig({
        title: 'Success!',
        message: 'Password reset successfully! You can now login with your new password.'
      })
      setShowConfirmModal(true)
    }
  }

  const handleModalConfirm = () => {
    setShowConfirmModal(false)
    if (modalConfig.title === 'Success!') {
      onSuccess()
    }
  }

  const validation = validatePassword(password)

  const styles = StyleSheet.create({
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
    errorText: {
      color: colors.error || '#ef4444',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
      textAlign: 'center',
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
    <>
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
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
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
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!isLoading}
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
        disabled={isLoading}
        activeOpacity={0.9}
        style={styles.submitButton}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#0c7bc9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Reset Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <ConfirmationModal
        visible={showConfirmModal}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={handleModalConfirm}
        onCancel={() => setShowConfirmModal(false)}
        loading={isLoading}
      />
    </>
  )
}

// Main ForgotPassword Component
const ForgotPassword = ({ onSuccess, onBack }) => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { step, email } = useSelector((state) => state.employee.forgotPassword)
  const [userContact, setUserContact] = useState('')

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      dispatch(resetForgotPassword())
    }
  }, [])

  const handleContactSuccess = (contact) => {
    setUserContact(contact)
  }

  const handleBack = () => {
    if (step === 'email') {
      dispatch(resetForgotPassword())
      if (onBack) onBack()
    } else if (step === 'otp') {
      dispatch(setForgotPasswordStep('email'))
    } else if (step === 'createPassword') {
      dispatch(setForgotPasswordStep('otp'))
    }
  }

  const handleSuccess = () => {
    dispatch(resetForgotPassword())
    if (onSuccess) onSuccess()
  }

  const getBackButtonText = () => {
    if (step === 'email') return 'Back to Login'
    if (step === 'otp') return 'Back to Contact'
    if (step === 'createPassword') return 'Back to OTP'
    return 'Back'
  }

  const renderStep = () => {
    switch (step) {
      case 'email':
        return <EmailVerificationStep onSuccess={handleContactSuccess} onBack={handleBack} />
      case 'otp':
        return <OtpVerificationStep contact={email || userContact} onBack={handleBack} />
      case 'createPassword':
        return <CreatePasswordStep onSuccess={handleSuccess} />
      default:
        return null
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
    },
    content: {
      flex: 1,
    },
  })

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