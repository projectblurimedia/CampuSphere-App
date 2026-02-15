import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import StudentFeeDetails from './StudentFeeDetails'
import ClassWiseFeePending from './ClassWiseFeePending'
import PaymentHistory from './PaymentHistory'
import { useDebounce } from '@/utils/useDebounce'
import axiosApi from '@/utils/axiosApi'

export default function FeeDetails({ visible, onClose }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState([])
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showClassWiseModal, setShowClassWiseModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const searchInputRef = useRef(null)
  const flatListRef = useRef(null)

  // Use debounce for search
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }

  // Handle search with debounce
  const searchStudents = useCallback(async (query) => {
    if (!query.trim()) {
      setFilteredStudents([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await axiosApi.get('/fees/students/search', {
        params: {
          search: query,
          academicYear: '2024-2025',
          page: 1,
          limit: 50
        }
      })

      if (response.data.success) {
        setFilteredStudents(response.data.data)
        if (response.data.data.length === 0) {
          showToast('No students found', 'info')
        }
      } else {
        setSearchError(response.data.message || 'Search failed')
        showToast(response.data.message || 'Search failed', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      
      let errorMessage = 'Failed to search students'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required'
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied'
        } else if (error.response.status === 404) {
          errorMessage = 'Endpoint not found'
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error, please try again later'
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.'
      } else {
        errorMessage = error.message || 'Network error'
      }

      setSearchError(errorMessage)
      showToast(errorMessage, 'error')
      setFilteredStudents([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchStudents(debouncedSearchQuery)
    } else {
      setFilteredStudents([])
      setSearchError(null)
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, searchStudents])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setFilteredStudents([])
    setSearchError(null)
    setIsSearching(false)
  }, [])

  const handleRefresh = useCallback(async () => {
    if (!searchQuery.trim()) {
      setRefreshing(false)
      return
    }

    setRefreshing(true)
    try {
      await searchStudents(searchQuery)
      showToast('Search refreshed!', 'success')
    } catch (error) {
      showToast('Failed to refresh search', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [searchQuery, searchStudents])

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      searchStudents(searchQuery)
    }
  }, [searchQuery, searchStudents])

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  const renderStudentItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleStudentSelect(item)}
      >
        <View style={styles.studentHeader}>
          {/* Profile Icon */}
          <View style={[styles.studentIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="person" size={24} color={colors.primary} />
          </View>
          
          {/* Two-line content */}
          <View style={styles.studentInfo}>
            {/* First line: Name */}
            <ThemedText style={styles.studentName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            
            {/* Second line: Class with dot separator and Due */}
            <View style={styles.classDueRow}>
              <ThemedText style={styles.studentClass} numberOfLines={1}>
                {item.displayClass || item.class} - {item.section}
              </ThemedText>
              
              {/* Dot separator */}
              <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
              
              {/* Due amount */}
              {item.feeSummary && (
                <ThemedText style={[styles.dueAmount, { color: item.feeSummary.totalDue?.toLocaleString() === '0' ? colors.success : colors.danger }]}>
                  Due: ₹{item.feeSummary.totalDue?.toLocaleString() || 0}
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors]
  )

  const renderEmptyComponent = useCallback(() => {
    if (isSearching) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Searching...</ThemedText>
        </View>
      )
    }

    if (searchError) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <MaterialIcons name="error-outline" size={48} color={colors.danger} />
          <ThemedText style={styles.errorTitle}>Search Error</ThemedText>
          <ThemedText style={styles.errorSubtitle}>{searchError}</ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => searchStudents(searchQuery)}
          >
            <ThemedText style={styles.retryButtonText}>Retry Search</ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    if (searchQuery && !isSearching) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
          <ThemedText style={styles.emptyTitle}>No Students Found</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Try a different search term.</ThemedText>
        </View>
      )
    }

    return (
      <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
        <MaterialIcons name="search" size={48} color={colors.primary} />
        <ThemedText style={styles.emptyTitle}>Search Student Fee Details</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Enter student name, class, or section to view details.</ThemedText>
      </View>
    )
  }, [searchQuery, isSearching, searchError, colors, searchStudents])

  const handleCloseStudentModal = useCallback(() => {
    setShowStudentModal(false)
    setSelectedStudent(null)
  }, [])

  const handlePaymentSuccess = useCallback((paymentResult) => {
    // Refresh the search results to update fee summary
    if (searchQuery) {
      searchStudents(searchQuery)
    }
    showToast('Payment processed successfully', 'success')
  }, [searchQuery, searchStudents])

  // Styles
  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    title: { 
      fontSize: 18, 
      color: '#FFFFFF', 
      marginBottom: -5 
    },
    subtitle: { 
      marginTop: 4, 
      fontSize: 11, 
      color: 'rgba(255,255,255,0.9)' 
    },
    searchContainer: { 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border 
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      backgroundColor: colors.inputBackground,
      borderColor: searchError ? colors.danger : colors.primary + '40',
    },
    searchIcon: { 
      marginRight: 8 
    },
    searchInput: { 
      flex: 1, 
      height: '100%', 
      fontSize: 14, 
      fontFamily: 'Poppins-Medium', 
      color: colors.text 
    },
    clearButton: { 
      padding: 4 
    },
    // Floating Action Button for Class-wise
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      height: 46,
      borderRadius: 28,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 8,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      zIndex: 1000,
    },
    fabText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    studentCard: {
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 6,
      borderWidth: 1,
      ...Platform.select({ 
        ios: { 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.05, 
          shadowRadius: 8 
        }, 
        android: { 
          elevation: 0.5 
        } 
      }),
    },
    studentHeader: { 
      flexDirection: 'row', 
      alignItems: 'center' 
    },
    studentIcon: { 
      width: 44, 
      height: 44, 
      borderRadius: 22, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: 12 
    },
    studentInfo: { 
      flex: 1,
      justifyContent: 'center',
    },
    studentName: { 
      fontSize: 16, 
      color: colors.text, 
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 4,
    },
    classDueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    studentClass: { 
      fontSize: 13, 
      color: colors.textSecondary, 
      fontFamily: 'Poppins-Medium',
      flexShrink: 1,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    dueAmount: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      flexShrink: 1,
    },
    emptyContainer: {
      paddingHorizontal: 20,
    },
    emptyContainerCentered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyTitle: { 
      fontSize: 18, 
      fontFamily: 'Poppins-SemiBold', 
      textAlign: 'center', 
      marginTop: 16,
      marginBottom: 8, 
      color: colors.text 
    },
    emptySubtitle: { 
      fontSize: 14, 
      fontFamily: 'Poppins-Medium', 
      textAlign: 'center', 
      marginBottom: 24, 
      color: colors.textSecondary 
    },
    errorTitle: { 
      fontSize: 18, 
      fontFamily: 'Poppins-SemiBold', 
      textAlign: 'center', 
      marginTop: 16,
      marginBottom: 8, 
      color: colors.danger 
    },
    errorSubtitle: { 
      fontSize: 14, 
      fontFamily: 'Poppins-Medium', 
      textAlign: 'center', 
      marginBottom: 24, 
      color: colors.textSecondary,
      paddingHorizontal: 20,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
    },
    loadingContainer: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: colors.background + 'CC' 
    },
    loadingText: { 
      marginTop: 12, 
      color: colors.textSecondary, 
      fontFamily: 'Poppins-Medium' 
    },
    searchErrorText: {
      fontSize: 12,
      color: colors.danger,
      fontFamily: 'Poppins-Medium',
      marginTop: 4,
      marginLeft: 16,
    }
  })

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      onRequestClose={onClose} 
      statusBarTranslucent
    >
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.backButton} 
                onPress={() => {
                  handleClearSearch()
                  onClose()
                }}
              >
                <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Fee Details</ThemedText>
                <ThemedText style={styles.subtitle}>Search student to view fee details</ThemedText>
              </View>
              
              {/* History Icon Button */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={[styles.backButton, { marginLeft: 8 }]} 
                onPress={() => setShowPaymentHistory(true)}
              >
                <MaterialIcons name="history" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather 
              name={searchError ? "alert-circle" : "search"} 
              size={20} 
              color={searchError ? colors.danger : colors.primary} 
              style={styles.searchIcon} 
            />
            <TextInput
              ref={searchInputRef}
              placeholder="Search by name, class, or section..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery ? (
              <TouchableOpacity activeOpacity={0.9} onPress={handleClearSearch} style={styles.clearButton}>
                <Feather name="x-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          {searchError && (
            <ThemedText style={styles.searchErrorText}>{searchError}</ThemedText>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id || item._id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[colors.primary]} 
              tintColor={colors.primary} 
              enabled={!!searchQuery.trim()}
            />
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingVertical: 12,
            paddingBottom: 80
          }}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          ListEmptyComponent={renderEmptyComponent}
        />

        {/* Floating Action Button for Class-wise */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.fab}
          onPress={() => setShowClassWiseModal(true)}
          disabled={isSearching}
        >
          <MaterialIcons name="school" size={22} color="#FFFFFF" />
          <ThemedText style={styles.fabText}>Class-wise</ThemedText>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </View>
        )}

        <ToastNotification 
          visible={toast.visible} 
          type={toast.type} 
          message={toast.message} 
          duration={3000} 
          onHide={hideToast} 
          position="top-center" 
        />

        <StudentFeeDetails 
          visible={showStudentModal} 
          onClose={handleCloseStudentModal} 
          student={selectedStudent}
          onPaymentSuccess={handlePaymentSuccess}
        />

        <ClassWiseFeePending 
          visible={showClassWiseModal} 
          onClose={() => setShowClassWiseModal(false)} 
        />

        <PaymentHistory 
          visible={showPaymentHistory} 
          onClose={() => setShowPaymentHistory(false)} 
        />
      </View>
    </Modal>
  )
}