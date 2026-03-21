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
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { useDebounce } from '@/utils/useDebounce'
import axiosApi from '@/utils/axiosApi'
import StudentInactiveDetails from './StudentInactiveDetails'

export default function InactiveSearch({ visible, onClose }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState([])
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
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
  const searchInactiveStudents = useCallback(async (query) => {
    if (!query.trim()) {
      setFilteredStudents([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await axiosApi.get('/students/search-inactive', {
        params: {
          query: query,
          page: 1,
          limit: 50
        }
      })

      if (response.data.success) {
        setFilteredStudents(response.data.data)
      } else {
        setSearchError(response.data.message || 'Search failed')
        showToast(response.data.message || 'Search failed', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      
      let errorMessage = 'Failed to search inactive students'
      
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
      searchInactiveStudents(debouncedSearchQuery)
    } else {
      setFilteredStudents([])
      setSearchError(null)
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, searchInactiveStudents])

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
      await searchInactiveStudents(searchQuery)
      showToast('Search refreshed!', 'success')
    } catch (error) {
      showToast('Failed to refresh search', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [searchQuery, searchInactiveStudents])

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      searchInactiveStudents(searchQuery)
    }
  }, [searchQuery, searchInactiveStudents])

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return first + last
  }

  const getAvatarColors = (name) => {
    const colorsList = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F39C12', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C'
    ]
    const index = name.length % colorsList.length
    return colorsList[index]
  }

  const renderStudentItem = useCallback(
    ({ item }) => {
      const initials = getInitials(item.firstName, item.lastName)
      const avatarColor = getAvatarColors(item.name || `${item.firstName || ''}${item.lastName || ''}`)
      
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => handleStudentSelect(item)}
        >
          <View style={styles.studentHeader}>
            {/* Avatar with initials */}
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>
            
            {/* Student Info */}
            <View style={styles.studentInfo}>
              <View style={styles.nameRow}>
                <ThemedText style={styles.studentName} numberOfLines={1}>
                  {item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim()}
                </ThemedText>
                <View style={[styles.inactiveBadge, { backgroundColor: colors.danger + '20' }]}>
                  <ThemedText style={[styles.inactiveBadgeText, { color: colors.danger }]}>
                    Inactive
                  </ThemedText>
                </View>
              </View>
              
              {/* Village */}
              <View style={styles.villageContainer}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <ThemedText style={styles.villageText} numberOfLines={1}>
                  {item.village || 'Village not specified'}
                </ThemedText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [colors]
  )

  const renderEmptyComponent = useCallback(() => {
    if (isSearching) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Searching inactive students...</ThemedText>
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
            onPress={() => searchInactiveStudents(searchQuery)}
          >
            <ThemedText style={styles.retryButtonText}>Retry Search</ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    if (searchQuery && !isSearching) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <Ionicons name="person-remove-outline" size={48} color={colors.textSecondary} />
          <ThemedText style={styles.emptyTitle}>No Inactive Students Found</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Try a different search term.</ThemedText>
        </View>
      )
    }

    return (
      <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
        <Ionicons name="search-outline" size={48} color={colors.primary} />
        <ThemedText style={styles.emptyTitle}>Search Inactive Students</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Enter name to find inactive students.</ThemedText>
      </View>
    )
  }, [searchQuery, isSearching, searchError, colors, searchInactiveStudents])

  const handleCloseStudentModal = useCallback(() => {
    setShowStudentModal(false)
    setSelectedStudent(null)
    // Refresh search when modal closes
    if (searchQuery) {
      searchInactiveStudents(searchQuery)
    }
  }, [searchQuery, searchInactiveStudents])

  const handleReactivateSuccess = useCallback(() => {
    // Refresh the search results
    if (searchQuery) {
      searchInactiveStudents(searchQuery)
    }
    showToast('Student reactivated successfully', 'success')
  }, [searchQuery, searchInactiveStudents])

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
      marginBottom: -5,
      fontFamily: 'Poppins-SemiBold',
    },
    subtitle: { 
      marginTop: 4, 
      fontSize: 11, 
      fontFamily: 'Poppins-Medium',
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
      color: colors.text ,
      marginBottom: -4,
    },
    clearButton: { 
      padding: 4 
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
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
    },
    studentInfo: { 
      flex: 1,
      justifyContent: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    studentName: { 
      fontSize: 16, 
      color: colors.text, 
      fontFamily: 'Poppins-SemiBold',
      flex: 1,
    },
    inactiveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    inactiveBadgeText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    villageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    villageText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      flex: 1,
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
                <ThemedText style={styles.title}>Inactive Students</ThemedText>
                <ThemedText style={styles.subtitle}>Search and view inactive students</ThemedText>
              </View>
              
              <View style={{ width: 44 }} />
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
              placeholder="Search inactive students by name"
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

        {/* Student Details Modal for Inactive Student */}
        {selectedStudent && (
          <StudentInactiveDetails
            visible={showStudentModal} 
            onClose={handleCloseStudentModal} 
            student={selectedStudent}
            onReactivateSuccess={handleReactivateSuccess}
          />
        )}
      </View>
    </Modal>
  )
}