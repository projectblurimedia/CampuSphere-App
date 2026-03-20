import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ThemedText } from '@/components/ui/themed-text'
import ClassGroup from '@/components/students/class-group'
import StudentCard from '@/components/students/student-card'
import axiosApi from '@/utils/axiosApi'
import { useDebounce } from '@/utils/useDebounce'

export default function Students() {
  const { colors } = useTheme()
  const [classesSummary, setClassesSummary] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const scrollViewRef = useRef(null)
  const searchInputRef = useRef(null)
  
  // Debounce search query with 300ms delay for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch classes summary
  const fetchClassesSummary = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const response = await axiosApi.get('/students/classes-summary')
      if (response.data.success) {
        setClassesSummary(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching classes summary:', error.response?.data || error.message)
    } finally {
      if (showLoading) setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Search students function
  const searchStudents = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setSearchLoading(true)
    setIsSearching(true)
    
    try {
      const response = await axiosApi.get('/students/quick-search', {
        params: { query, limit: 50 }
      })
      
      if (response.data.success) {
        setSearchResults(response.data.data)
      }
    } catch (error) {
      console.error('Error searching students:', error.response?.data || error.message)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchStudents(debouncedSearchQuery)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, searchStudents])

  // Initial fetch
  useEffect(() => {
    fetchClassesSummary()
  }, [fetchClassesSummary])

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    fetchClassesSummary(false)
  }, [fetchClassesSummary])

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    searchInputRef.current?.focus()
  }, [])

  // Handle scroll view touch to dismiss keyboard
  const handleScrollViewTouch = useCallback(() => {
    if (!isSearchFocused) {
      Keyboard.dismiss()
    }
  }, [isSearchFocused])

  // Helper function for plural/singular text
  const getResultText = (count) => {
    return count === 1 ? 'student' : 'students'
  }

  // Dynamic styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Search bar styles
    searchContainer: {
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      paddingHorizontal: 14,
      borderRadius: 24,
      borderWidth: 1,
      backgroundColor: colors.cardBackground,
      borderColor: isSearchFocused ? colors.primary : colors.border,
      borderWidth: isSearchFocused ? 2 : 1,
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
    },
    clearButton: {
      padding: 4,
      marginLeft: 6,
    },
    searchInfoContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInfoText: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.textSecondary,
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 100,
    },
    classGroupsContainer: {
      flexDirection: 'column',
    },
    searchResultsContainer: {
      flexDirection: 'column',
      paddingTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
  })

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Inline Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search students by name..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            cursorColor={colors.primary}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
            enablesReturnKeyAutomatically
          />

          {searchLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Search info */}
      {isSearching && debouncedSearchQuery && (
        <View style={styles.searchInfoContainer}>
          <ThemedText style={styles.searchInfoText}>
            Found {searchResults.length} {getResultText(searchResults.length)} for "{debouncedSearchQuery}"
          </ThemedText>
        </View>
      )}

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        scrollEventThrottle={16}
        onTouchStart={handleScrollViewTouch}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Results */}
        {isSearching ? (
          searchLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {searchResults.map(student => (
                <StudentCard 
                  key={student.id}
                  student={student}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="search-outline" 
                size={48} 
                color={colors.textSecondary} 
              />
              <ThemedText style={styles.emptyText}>
                No students found matching "{debouncedSearchQuery}"
              </ThemedText>
            </View>
          )
        ) : (
          /* Classes Summary View */
          <>
            {classesSummary.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="people-outline" 
                  size={48} 
                  color={colors.textSecondary} 
                />
                <ThemedText style={styles.emptyText}>
                  No classes found
                </ThemedText>
              </View>
            ) : (
              <View style={styles.classGroupsContainer}>
                {classesSummary.map(classData => (
                  <ClassGroup 
                    key={classData.class}
                    classData={classData}
                    parentSearchQuery=""
                  />
                ))}
              </View>
            )}
          </>
        )}
        
        {/* Add some bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}