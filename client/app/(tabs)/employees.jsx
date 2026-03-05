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
import EmployeeCard from '@/components/employee/employee-card'
import axiosApi from '@/utils/axiosApi'
import { useDebounce } from '@/utils/useDebounce'

export default function Employees() {
  const { colors, isDark } = useTheme()
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedDesignation, setSelectedDesignation] = useState('All')
  const [designations, setDesignations] = useState(['All'])
  const [totalCount, setTotalCount] = useState(0)
  
  const scrollViewRef = useRef(null)
  const searchInputRef = useRef(null)
  
  // Debounce search query with 300ms delay for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch all employees
  const fetchEmployees = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const response = await axiosApi.get('/employees', {
        params: {
          status: 'active',
          limit: 100
        }
      })
      
      if (response.data.success) {
        setEmployees(response.data.data)
        setFilteredEmployees(response.data.data)
        setTotalCount(response.data.total || response.data.data.length)
        
        // Extract unique designations for filter
        const uniqueDesignations = ['All', ...new Set(response.data.data.map(emp => emp.designationDisplay || emp.designation))]
        setDesignations(uniqueDesignations)
      }
    } catch (error) {
      console.error('Error fetching employees:', error.response?.data || error.message)
    } finally {
      if (showLoading) setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Search employees function
  const searchEmployees = useCallback(async (query) => {
    if (!query.trim()) {
      setFilteredEmployees(employees)
      setIsSearching(false)
      return
    }

    setSearchLoading(true)
    setIsSearching(true)
    
    try {
      const response = await axiosApi.get('/employees/search', {
        params: { 
          query, 
          status: 'active',
          limit: 50
        }
      })
      
      if (response.data.success) {
        setFilteredEmployees(response.data.data)
      }
    } catch (error) {
      console.error('Error searching employees:', error.response?.data || error.message)
      setFilteredEmployees([])
    } finally {
      setSearchLoading(false)
    }
  }, [employees])

  // Filter by designation
  const filterByDesignation = useCallback((designation) => {
    setSelectedDesignation(designation)
    
    if (designation === 'All') {
      // If there's a search query, use search results as base
      if (debouncedSearchQuery) {
        // Will be handled by the search effect
        return
      } else {
        setFilteredEmployees(employees)
      }
    } else {
      const filtered = employees.filter(emp => 
        emp.designationDisplay === designation || emp.designation === designation
      )
      setFilteredEmployees(filtered)
    }
  }, [employees, debouncedSearchQuery])

  // Effect for debounced search
  useEffect(() => {
    const applySearchAndFilter = async () => {
      if (debouncedSearchQuery) {
        await searchEmployees(debouncedSearchQuery)
      } else {
        // No search query, apply designation filter to all employees
        if (selectedDesignation === 'All') {
          setFilteredEmployees(employees)
        } else {
          const filtered = employees.filter(emp => 
            emp.designationDisplay === selectedDesignation || emp.designation === selectedDesignation
          )
          setFilteredEmployees(filtered)
        }
        setIsSearching(false)
      }
    }

    applySearchAndFilter()
  }, [debouncedSearchQuery, employees, selectedDesignation, searchEmployees])

  // Initial fetch
  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setSearchQuery('')
    setSelectedDesignation('All')
    fetchEmployees(false)
  }, [fetchEmployees])

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }, [])

  // Handle designation change
  const handleDesignationChange = useCallback((designation) => {
    setSelectedDesignation(designation)
    filterByDesignation(designation)
  }, [filterByDesignation])

  // Handle scroll view touch to dismiss keyboard
  const handleScrollViewTouch = useCallback(() => {
    if (!isSearchFocused) {
      Keyboard.dismiss()
    }
  }, [isSearchFocused])

  // Helper function for plural/singular text
  const getResultText = (count) => {
    return count === 1 ? 'employee' : 'employees'
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
    
    // Filter chips
    filterContainer: {
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    filterScroll: {
      flexDirection: 'row',
      paddingVertical: 4,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },

    // Search info
    searchInfoContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInfoText: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.textSecondary,
    },

    // Content
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 200,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 8,
      paddingHorizontal: 16,
    },
    resultsTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    employeesContainer: {
      flexDirection: 'column',
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
    emptySubtext: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary + '99',
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
            placeholder="Search employees by name, email, phone..."
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

      {/* Designation Filter Chips */}
      {designations.length > 1 && (
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {designations.map((designation) => (
              <TouchableOpacity
                key={designation}
                style={[
                  styles.filterChip,
                  selectedDesignation === designation && styles.filterChipActive
                ]}
                onPress={() => handleDesignationChange(designation)}
              >
                <ThemedText 
                  style={[
                    styles.filterChipText,
                    selectedDesignation === designation && styles.filterChipTextActive
                  ]}
                >
                  {designation}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search info */}
      {isSearching && debouncedSearchQuery && (
        <View style={styles.searchInfoContainer}>
          <ThemedText style={styles.searchInfoText}>
            Found {filteredEmployees.length} {getResultText(filteredEmployees.length)} for "{debouncedSearchQuery}"
          </ThemedText>
        </View>
      )}

      {/* Results header */}
      {!isSearching && (
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultsTitle}>
            {selectedDesignation === 'All' ? 'All Employees' : selectedDesignation}
            {' '}({filteredEmployees.length})
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
        {/* Employee List */}
        {isSearching && searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredEmployees.length > 0 ? (
          <View style={styles.employeesContainer}>
            {filteredEmployees.map(employee => (
              <EmployeeCard 
                key={employee.id}
                employee={employee}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={48} 
              color={colors.textSecondary} 
            />
            <ThemedText style={styles.emptyText}>
              {isSearching 
                ? `No employees found matching "${debouncedSearchQuery}"`
                : selectedDesignation !== 'All'
                ? `No employees found in ${selectedDesignation} designation`
                : 'No employees found'
              }
            </ThemedText>
            {(isSearching || selectedDesignation !== 'All') && (
              <ThemedText style={styles.emptySubtext}>
                Try adjusting your search or filter
              </ThemedText>
            )}
          </View>
        )}
        
        {/* Add some bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}