import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { MaterialIcons } from '@expo/vector-icons'

const BiometricAuth = ({ onAuthenticated, onCancel }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false)
  const [biometricType, setBiometricType] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    checkBiometricSupport()
  }, [])

  const checkBiometricSupport = async () => {
    try {
      // Check if hardware supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync()
      setIsBiometricSupported(compatible)

      if (compatible) {
        // Check for saved biometrics
        const enrolled = await LocalAuthentication.isEnrolledAsync()
        
        if (!enrolled) {
          Alert.alert(
            'No Biometrics Found',
            'Please set up fingerprint or face ID in your device settings first.',
            [{ text: 'OK', onPress: onCancel }]
          )
          return
        }

        // Get available biometric types
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
        const typeNames = types.map(type => {
          switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
              return 'Fingerprint'
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
              return 'Face ID'
            case LocalAuthentication.AuthenticationType.IRIS:
              return 'Iris'
            default:
              return 'Biometric'
          }
        })
        
        setBiometricType(typeNames.join(' or '))
      }
    } catch (error) {
      console.error('Error checking biometric support:', error)
    }
  }

  const handleBiometricAuth = async () => {
    try {
      setIsAuthenticating(true)

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access School App',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        onAuthenticated()
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled
          if (onCancel) onCancel()
        } else {
          Alert.alert(
            'Authentication Failed',
            'Please try again or use your device passcode.',
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      Alert.alert('Error', 'Failed to authenticate. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const getBiometricIcon = () => {
    if (biometricType.toLowerCase().includes('face')) {
      return 'face'
    } else if (biometricType.toLowerCase().includes('finger')) {
      return 'fingerprint'
    } else {
      return 'lock-outline'
    }
  }

  if (!isBiometricSupported) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="lock-outline" size={80} color="#666" />
        <Text style={styles.title}>Biometric Not Available</Text>
        <Text style={styles.message}>
          Your device doesn't support biometric authentication. 
          Please use your app password to continue.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={onAuthenticated}
        >
          <Text style={styles.buttonText}>Continue with Password</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MaterialIcons 
        name={getBiometricIcon()} 
        size={100} 
        color="#1d9bf0" 
      />
      
      <Text style={styles.title}>Biometric Authentication Required</Text>
      
      <Text style={styles.message}>
        Please authenticate using {biometricType || 'biometrics'} to access the app
      </Text>

      <TouchableOpacity 
        style={[styles.button, styles.biometricButton]}
        onPress={handleBiometricAuth}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons 
              name={getBiometricIcon()} 
              size={24} 
              color="#fff" 
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              Authenticate with {biometricType || 'Biometrics'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={onAuthenticated}
      >
        <Text style={styles.linkText}>Use Password Instead</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    maxWidth: 300,
  },
  biometricButton: {
    backgroundColor: '#1d9bf0',
    marginBottom: 15,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#fff',
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1d9bf0',
    textDecorationLine: 'underline',
  },
})

export default BiometricAuth