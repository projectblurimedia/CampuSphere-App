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
import { loginEmployee, clearError, resetLoginFlow } from '@/redux/employeeSlice'

const PasswordStep = ({ onBack }) => {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  const { tempEmployee, isLoading, error } = useSelector((state) => state.employee)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)

  const handleBack = () => {
    if (onBack) {
      dispatch(clearError())
      dispatch(resetLoginFlow())
    }
  }

  const handleSubmit = async () => {
    if (!password.trim()) {
      dispatch(clearError())
      return
    }

    if (!tempEmployee?.employeeId) {
      return
    }

    setLocalLoading(true)
    
    try {
      await dispatch(loginEmployee({
        employeeId: tempEmployee.employeeId,
        password: password.trim()
      })).unwrap() // unwrap() will throw if the promise is rejected
      
      // Success - Redux will handle the navigation
    } catch (err) {
      setLocalLoading(false)
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
      marginBottom: 30,
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
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      alignSelf: 'flex-start',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.textSecondary + '60',
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rememberText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
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
  const isButtonDisabled = localLoading || !password.trim()
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
            {tempEmployee.designation || 'Employee'} • {tempEmployee.phone || tempEmployee.email}
          </Text>
        </View>
      </View>

      <Text style={styles.welcomeText}>Enter Password</Text>
      <Text style={styles.stepIndicator}>STEP 2 OF 2</Text>
      <Text style={styles.subtitleText}>Enter your password to continue</Text>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary + '80'}
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            dispatch(clearError())
          }}
          secureTextEntry={!showPassword}
          editable={!localLoading}
          autoFocus={true}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
          disabled={localLoading}
        >
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Error Message - Inline error */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Remember Me */}
      <TouchableOpacity
        style={styles.rememberContainer}
        onPress={() => setRememberMe(!rememberMe)}
        disabled={localLoading}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && (
            <Feather name="check" size={14} color="#fff" />
          )}
        </View>
        <Text style={styles.rememberText}>Remember me on this device</Text>
      </TouchableOpacity>

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
              <Text style={styles.submitButtonText}>Sign In</Text>
              <FontAwesome5 name="arrow-right" size={16} color="#fff" style={styles.submitIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  )
}

export default PasswordStep