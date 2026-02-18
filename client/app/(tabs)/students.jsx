import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Keyboard,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ThemedText } from '@/components/ui/themed-text'
import SearchBar from '@/components/students/search-bar'
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
  const [isSearching, setIsSearching] = useState(false)
  const scrollViewRef = useRef(null)
  const isSearchFocused = useRef(false)
  
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
  }, [])

  // Handle scroll view touch to dismiss keyboard
  const handleScrollViewTouch = useCallback(() => {
    if (!isSearchFocused.current) {
      Keyboard.dismiss()
    }
  }, [])

  // Helper function for plural/singular text
  const getResultText = (count) => {
    return count === 1 ? 'student' : 'students'
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClear={handleClearSearch}
        placeholder="Search students by name..."
        autoFocus={false}
        loading={searchLoading}
        onFocusChange={(focused) => {
          isSearchFocused.current = focused
        }}
      />

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
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
          <>
            {/* Search info */}
            {debouncedSearchQuery && (
              <View style={styles.searchInfoContainer}>
                <ThemedText style={[styles.searchInfoText, { color: colors.textSecondary }]}>
                  Found {searchResults.length} {getResultText(searchResults.length)} for "{debouncedSearchQuery}"
                </ThemedText>
              </View>
            )}

            {/* Search Results List */}
            {searchLoading ? (
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
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No students found matching "{debouncedSearchQuery}"
                </ThemedText>
              </View>
            )}
          </>
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
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No classes found
                </ThemedText>
              </View>
            ) : (
              <View style={styles.classGroupsContainer}>
                {classesSummary.map(classData => (
                  <ClassGroup 
                    key={classData.class}
                    classData={classData}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
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
  },
  searchInfoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchInfoText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
})