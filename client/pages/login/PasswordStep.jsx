import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '@/hooks/useTheme'

const PasswordStep = ({ user, onSuccess, onBack, onForgotPassword }) => {
  const { colors } = useTheme()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password')
      return
    }

    setLoading(true)

    // Simulate API call delay
    setTimeout(async () => {
      if (user && user.password === password) {
        if (rememberMe) {
          await AsyncStorage.setItem('user_email', user.email)
        }
        
        const userData = {
          staffId: user.staffId,
          email: user.email,
          name: user.name,
          role: user.role,
          hasPassword: user.hasPassword
        }
        
        await AsyncStorage.setItem('is_authenticated', 'true')
        await AsyncStorage.setItem('user_data', JSON.stringify(userData))
        
        Alert.alert('Success', `Welcome ${user.name}!`, [
          { text: 'Continue', onPress: () => onSuccess(userData) }
        ])
      } else {
        Alert.alert('Error', 'Invalid password. Please try again.')
      }
      
      setLoading(false)
    }, 1000)
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
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 5,
      letterSpacing: 1,
    },
    subtitleText: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
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
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary,
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
      height: '100%',
    },
    passwordToggle: {
      padding: 5,
    },
    rememberForgotContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
    rememberMeText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    forgotPasswordText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
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
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={loading}
        >
          <FontAwesome5 name="arrow-left" size={18} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Staff ID</Text>
        </TouchableOpacity>
      )}

      {/* User Info Card */}
      {user && (
        <View style={styles.userInfoCard}>
          <View style={styles.userAvatar}>
            <MaterialIcons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role} • {user.staffId}</Text>
          </View>
        </View>
      )}

      <Text style={styles.welcomeText}>Enter Password</Text>
      <Text style={styles.stepIndicator}>STEP 2 OF 2</Text>
      <Text style={styles.subtitleText}>Enter your password to complete login</Text>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary + '80'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
          autoFocus={true}
          onSubmitEditing={handlePasswordSubmit}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
          disabled={loading}
        >
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Remember Me & Forgot Password */}
      <View style={styles.rememberForgotContainer}>
        <TouchableOpacity
          style={styles.rememberMeContainer}
          onPress={() => setRememberMe(!rememberMe)}
          disabled={loading}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && (
              <Feather name="check" size={14} color="#fff" />
            )}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onForgotPassword} disabled={loading}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handlePasswordSubmit}
        disabled={loading || !password.trim()}
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