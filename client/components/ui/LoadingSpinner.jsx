import React from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'

export const LoadingSpinner = ({ size = 40, color, message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <ThemedText style={[styles.message, { color: color }]}>
          {message}
        </ThemedText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
})