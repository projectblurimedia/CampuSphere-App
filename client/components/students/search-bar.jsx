import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function SearchBar({ 
  searchQuery, 
  setSearchQuery,
  onClear,
  placeholder = 'Search students...',
  autoFocus = false,
  loading = false,
  onFocusChange,
}) {
  const { colors } = useTheme()
  const inputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Notify parent of focus changes
  useEffect(() => {
    onFocusChange?.(isFocused)
  }, [isFocused, onFocusChange])

  // Dynamic styles based on focus and theme
  const styles = useMemo(() => {
    const borderColor = isFocused ? colors.primary : colors.border
    const borderWidth = isFocused ? 2 : 1
    
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        zIndex: 1000,
      },
      searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 14,
        borderRadius: 24,
        borderWidth: borderWidth,
        borderColor: borderColor,
        backgroundColor: colors.cardBackground,
        shadowColor: isFocused ? colors.primary : 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: isFocused ? 3 : 0,
      },
      searchIcon: {
        marginRight: 8,
      },
      searchInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        paddingHorizontal: 0,
        lineHeight: 20,
        fontWeight: '500',
        color: colors.text,
        includeFontPadding: false,
      },
      clearButton: {
        padding: 4,
        marginLeft: 6,
      },
      loadingContainer: {
        marginLeft: 6,
        padding: 4,
      },
    })
  }, [colors, isFocused])

  const handleClear = useCallback((e) => {
    // Stop event propagation to prevent triggering parent TouchableOpacity
    e.stopPropagation()
    
    // Clear the input
    setSearchQuery('')
    
    // Call the onClear callback if provided
    onClear?.()
    
    // Focus the input after clearing
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [setSearchQuery, onClear])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const handlePress = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={handlePress}
      style={styles.container}
    >
      {/* Search Input Container */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary + '80'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          cursorColor={colors.primary}
          textAlignVertical="center"
          autoFocus={autoFocus}
          returnKeyType="search"
          clearButtonMode="never"
          enablesReturnKeyAutomatically
          autoCorrect={false}
          autoCapitalize="none"
          blurOnSubmit={false}
          keyboardType="default"
          importantForAutofill="no"
        />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer} pointerEvents="none">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Clear Button */}
        {searchQuery.length > 0 && !loading && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}