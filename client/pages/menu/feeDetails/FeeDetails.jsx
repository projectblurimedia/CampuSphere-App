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
        // Server responded with error status
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
        // Request made but no response
        errorMessage = 'No response from server. Check your connection.'
      } else {
        // Something else happened
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

  const renderStudentItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => {
          setSelectedStudent(item)
          setShowStudentModal(true)
        }}
      >
        <View style={styles.studentHeader}>
          <View style={[styles.studentIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.studentInfo}>
            <ThemedText style={styles.studentName}>{item.name}</ThemedText>
            <ThemedText style={styles.studentClass}>
              {item.displayClass || item.class} - {item.section}
            </ThemedText>
            {item.feeSummary && (
              <View style={styles.feeSummary}>
                <ThemedText style={[styles.feeStatus, { 
                  color: item.feeSummary.paymentStatus === 'Paid' ? colors.success : 
                         item.feeSummary.paymentStatus === 'Unpaid' ? colors.danger : 
                         colors.warning 
                }]}>
                  {item.feeSummary.paymentStatus}
                </ThemedText>
                <ThemedText style={styles.feeAmount}>
                  Due: ₹{item.feeSummary.totalDue}
                </ThemedText>
              </View>
            )}
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
    searchRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8 
    },
    searchInputContainer: {
      flex: 1,
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
    classWiseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.primary + '10',
      borderWidth: 1,
      borderColor: colors.primary + '40',
      gap: 8,
    },
    classWiseButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
    studentCard: {
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 4,
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
      width: 48, 
      height: 48, 
      borderRadius: 24, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: 12 
    },
    studentInfo: { 
      flex: 1 
    },
    studentName: { 
      fontSize: 16, 
      color: colors.text, 
      fontFamily: 'Poppins-SemiBold' 
    },
    studentClass: { 
      fontSize: 12, 
      color: colors.textSecondary, 
      fontFamily: 'Poppins-Medium',
      marginTop: 2,
    },
    feeSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    feeStatus: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.background,
    },
    feeAmount: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
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
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Fee Details</ThemedText>
                <ThemedText style={styles.subtitle}>Search student or view class-wise pending fees</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Feather 
                name={searchError ? "alert-circle" : "search"} 
                size={20} 
                color={searchError ? colors.danger : colors.primary} 
                style={styles.searchIcon} 
              />
              <TextInput
                ref={searchInputRef}
                placeholder="Search by name..."
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
            <TouchableOpacity 
              activeOpacity={0.9} 
              style={styles.classWiseButton} 
              onPress={() => setShowClassWiseModal(true)}
              disabled={isSearching}
            >
              <MaterialIcons name="school" size={20} color={colors.primary} />
              <ThemedText style={styles.classWiseButtonText}>Class-wise</ThemedText>
            </TouchableOpacity>
          </View>
          {searchError && (
            <ThemedText style={styles.searchErrorText}>{searchError}</ThemedText>
          )}
        </View>
        <FlatList
          ref={flatListRef}
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item._id || item.id}
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
            paddingBottom: 20 
          }}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          ListEmptyComponent={renderEmptyComponent}
          onScrollToTop={() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
          }}
        />
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
          onClose={() => setShowStudentModal(false)} 
          student={selectedStudent} 
        />
        <ClassWiseFeePending 
          visible={showClassWiseModal} 
          onClose={() => setShowClassWiseModal(false)} 
        />
      </View>
    </Modal>
  )
}