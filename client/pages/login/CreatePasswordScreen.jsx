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
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useDispatch, useSelector } from 'react-redux'
import { createEmployeePassword, clearError, resetLoginFlow } from '@/redux/employeeSlice'

const CreatePasswordScreen = ({ onBack }) => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { tempEmployee, isLoading, error } = useSelector((state) => state.employee)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [localLoading, setLocalLoading] = useState(false)

  const handleBack = () => {
    if (onBack) {
      dispatch(clearError())
      dispatch(resetLoginFlow())
    }
  }

  const validatePassword = (password) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long'
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async () => {
    // Clear previous errors
    dispatch(clearError())
    setPasswordError('')

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password')
      return
    }

    if (!confirmPassword.trim()) {
      setPasswordError('Please confirm your password')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setPasswordError(validationError)
      return
    }

    if (!tempEmployee?.employeeId) {
      setPasswordError('Employee information not found')
      return
    }

    setLocalLoading(true)
    
    try {
      await dispatch(createEmployeePassword({
        employeeId: tempEmployee.employeeId,
        password: newPassword.trim(),
        confirmPassword: confirmPassword.trim()
      })).unwrap()
      
      // Success - Redux will handle the navigation
    } catch (err) {
      setLocalLoading(false)
    }
  }

  const checkRequirement = (password, requirement) => {
    switch (requirement) {
      case 'length':
        return password.length >= 8
      case 'uppercase':
        return /[A-Z]/.test(password)
      case 'lowercase':
        return /[a-z]/.test(password)
      case 'number':
        return /\d/.test(password)
      default:
        return false
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
    welcomeText: {
      fontSize: 24,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 5,
    },
    subtitleText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    userInfoCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + '20',
      flexDirection: 'row',
      alignItems: 'center',
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    userInfoText: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    userRole: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    passwordRequirements: {
      backgroundColor: colors.background + '80',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requirementText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    requirementMet: {
      color: colors.success || '#10b981',
    },
    requirementNotMet: {
      color: colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
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
    passwordToggle: {
      padding: 5,
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

  if (!tempEmployee) {
    return null
  }

  // Determine if button should be disabled
  const isButtonDisabled = localLoading || !newPassword.trim() || !confirmPassword.trim()
  const showButtonLoading = localLoading

  return (
    <>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={localLoading}
        >
          <FontAwesome5 name="arrow-left" size={18} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}

      {/* User Info Card */}
      <View style={styles.userInfoCard}>
        <View style={styles.userAvatar}>
          <MaterialIcons name="person" size={24} color="#fff" />
        </View>
        <View style={styles.userInfoText}>
          <Text style={styles.userName}>
            {tempEmployee.firstName} {tempEmployee.lastName}
          </Text>
          <Text style={styles.userRole}>
            {tempEmployee.designation || 'Employee'}
          </Text>
        </View>
      </View>

      <Text style={styles.welcomeText}>Create Password</Text>
      <Text style={styles.subtitleText}>Set a secure password for your account</Text>

      {/* Password Requirements */}
      <View style={styles.passwordRequirements}>
        <Text style={[
          styles.requirementText,
          checkRequirement(newPassword, 'length') ? styles.requirementMet : styles.requirementNotMet
        ]}>
          • At least 8 characters long
        </Text>
        <Text style={[
          styles.requirementText,
          checkRequirement(newPassword, 'uppercase') ? styles.requirementMet : styles.requirementNotMet
        ]}>
          • At least one uppercase letter (A-Z)
        </Text>
        <Text style={[
          styles.requirementText,
          checkRequirement(newPassword, 'lowercase') ? styles.requirementMet : styles.requirementNotMet
        ]}>
          • At least one lowercase letter (a-z)
        </Text>
        <Text style={[
          styles.requirementText,
          checkRequirement(newPassword, 'number') ? styles.requirementMet : styles.requirementNotMet
        ]}>
          • At least one number (0-9)
        </Text>
      </View>

      {/* New Password Input */}
      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={colors.textSecondary + '80'}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text)
            setPasswordError('')
            dispatch(clearError())
          }}
          secureTextEntry={!showNewPassword}
          editable={!localLoading}
          autoFocus={true}
        />
        <TouchableOpacity
          onPress={() => setShowNewPassword(!showNewPassword)}
          style={styles.passwordToggle}
          disabled={localLoading}
        >
          <Feather
            name={showNewPassword ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textSecondary + '80'}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text)
            setPasswordError('')
            dispatch(clearError())
          }}
          secureTextEntry={!showConfirmPassword}
          editable={!localLoading}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.passwordToggle}
          disabled={localLoading}
        >
          <Feather
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Error Messages - Inline errors */}
      {(passwordError || error) && (
        <Text style={styles.errorText}>
          {passwordError || (typeof error === 'string' ? error : 'An error occurred')}
        </Text>
      )}

      {/* Create Password Button */}
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
              <Text style={styles.submitButtonText}>Create Password</Text>
              <FontAwesome5 name="check" size={16} color="#fff" style={styles.submitIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  )
}

export default CreatePasswordScreen