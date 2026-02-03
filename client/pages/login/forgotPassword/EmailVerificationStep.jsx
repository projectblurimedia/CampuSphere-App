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
import { FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const EmailVerificationStep = ({ initialEmail, onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [email, setEmail] = useState(initialEmail || '')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setLoading(true)

    // Simulate API call to send OTP
    setTimeout(() => {
      // In real app, you would send OTP to the email
      Alert.alert('OTP Sent', `OTP has been sent to ${email}. Check your email.`, [
        { text: 'OK', onPress: () => {
          onSuccess(email)
        }}
      ])
      
      setLoading(false)
    }, 1500)
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
    infoText: {
      fontSize: 12,
      fontFamily: 'Poppins-Regular',
      color: colors.textSecondary + '80',
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 18,
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
      <Text style={styles.welcomeText}>Forgot Password</Text>
      <Text style={styles.subtitleText}>Enter your email to receive OTP</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Feather name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor={colors.textSecondary + '80'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />
      </View>

      <Text style={styles.infoText}>
        A 4-digit OTP will be sent to your email address for verification.
      </Text>

      {/* Send OTP Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSendOtp}
        disabled={loading || !email.trim()}
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
              <Text style={styles.submitButtonText}>Send OTP</Text>
              <FontAwesome5 name="paper-plane" size={16} color="#fff" style={styles.submitIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  )
}

export default EmailVerificationStep