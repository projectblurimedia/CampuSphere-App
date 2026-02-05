import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useDispatch, useSelector } from 'react-redux'
import { checkEmployeeExists, clearError } from '@/redux/employeeSlice'

const EmailPhoneStep = () => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { isLoading, error } = useSelector((state) => state.employee)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [inputError, setInputError] = useState('')
  const [localLoading, setLocalLoading] = useState(false)

  const handleSubmit = async () => {
    // Clear previous errors
    dispatch(clearError())
    setInputError('')

    if (!emailOrPhone.trim()) {
      setInputError('Please enter email or phone number')
      return
    }

    // Basic validation
    const isEmail = emailOrPhone.includes('@')
    const isPhone = /^\d{10}$/.test(emailOrPhone.trim())

    if (!isEmail && !isPhone) {
      setInputError('Please enter a valid email or 10-digit phone number')
      return
    }

    setLocalLoading(true)
    
    try {
      // Dispatch and wait for it to complete
      const result = await dispatch(checkEmployeeExists(emailOrPhone.trim()))
      
      // If it's rejected, the error will be handled in extraReducers
      if (checkEmployeeExists.rejected.match(result)) {
        // Reset local loading on error
        setLocalLoading(false)
      }
    } catch (err) {
      setLocalLoading(false)
    }
    // Don't setLocalLoading(false) here - Redux will handle step change
  }

  const styles = StyleSheet.create({
    welcomeText: {
      fontSize: 24,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 5,
    },
    stepIndicator: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 5,
      letterSpacing: 1,
    },
    subtitleText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
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
      height: '100%',
    },
    errorText: {
      color: colors.error || '#ef4444',
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 12,
      textAlign: 'center',
    },
    submitButton: {
      borderRadius: 12,
      overflow: 'hidden',
      height: 56,
      marginTop: 5,
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
    infoText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      paddingHorizontal: 10,
    },
  })

  // Determine if button should be disabled
  const isButtonDisabled = localLoading || !emailOrPhone.trim()
  const showButtonLoading = localLoading

  return (
    <>
      <Text style={styles.welcomeText}>Employee Login</Text>
      <Text style={styles.stepIndicator}>STEP 1 OF 2</Text>
      <Text style={styles.subtitleText}>Enter your email or phone number</Text>

      {/* Email/Phone Input */}
      <View style={styles.inputContainer}>
        <MaterialIcons 
          name="email" 
          size={20} 
          color={colors.textSecondary} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Email or Phone Number"
          placeholderTextColor={colors.textSecondary + '80'}
          value={emailOrPhone}
          onChangeText={(text) => {
            setEmailOrPhone(text)
            setInputError('')
            dispatch(clearError())
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="off"
          editable={!localLoading}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />
      </View>

      {/* Error Messages - These are inline errors */}
      {(inputError || error) && (
        <Text style={styles.errorText}>
          {inputError || (typeof error === 'string' ? error : 'An error occurred')}
        </Text>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isButtonDisabled && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isButtonDisabled}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#0c7bc9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {showButtonLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Continue</Text>
              <FontAwesome5 name="arrow-right" size={16} color="#fff" style={styles.submitIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Info Text */}
      <Text style={styles.infoText}>
        Use the email or phone number registered with the school administration
      </Text>
    </>
  )
}

export default EmailPhoneStep