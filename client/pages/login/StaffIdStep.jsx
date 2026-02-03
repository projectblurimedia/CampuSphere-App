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
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { STAFF_DATABASE } from './data'

const StaffIdStep = ({ onSuccess, onBack }) => {
  const { colors } = useTheme()
  const [staffId, setStaffId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStaffIdSubmit = async () => {
    if (!staffId.trim()) {
      Alert.alert('Error', 'Please enter your Staff ID')
      return
    }

    setLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const user = STAFF_DATABASE.find(
        staff => staff.staffId === staffId.trim().toUpperCase()
      )

      if (user) {
        onSuccess(user)
      } else {
        Alert.alert('Error', 'Invalid Staff ID. Please check and try again.')
      }
      
      setLoading(false)
    }, 1000)
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
      <Text style={styles.welcomeText}>Staff Login</Text>
      <Text style={styles.stepIndicator}>STEP 1 OF 2</Text>
      <Text style={styles.subtitleText}>Enter your Staff ID to continue</Text>

      {/* Staff ID Input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="badge" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Staff ID"
          placeholderTextColor={colors.textSecondary + '80'}
          value={staffId}
          onChangeText={setStaffId}
          autoCapitalize="characters"
          autoComplete="off"
          editable={!loading}
          onSubmitEditing={handleStaffIdSubmit}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleStaffIdSubmit}
        disabled={loading || !staffId.trim()}
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
              <Text style={styles.submitButtonText}>Continue</Text>
              <FontAwesome5 name="arrow-right" size={16} color="#fff" style={styles.submitIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  )
}

export default StaffIdStep