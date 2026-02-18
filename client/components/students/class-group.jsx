import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  TextInput,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import StudentCard from '@/components/students/student-card'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import { useDebounce } from '@/utils/useDebounce'

export default function ClassGroup({ 
  classData, 
  parentSearchQuery,
}) {
  const { colors } = useTheme()
  
  // Modal state
  const [showClassModal, setShowClassModal] = useState(false)
  const [modalClassData, setModalClassData] = useState(null)
  
  // Class details state
  const [classDetails, setClassDetails] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Students state
  const [sectionStudents, setSectionStudents] = useState({})
  const [loadingStudents, setLoadingStudents] = useState({})
  const [refreshingStudents, setRefreshingStudents] = useState({})
  const [currentSection, setCurrentSection] = useState(null)
  
  // Search state for students view
  const [sectionSearchQuery, setSectionSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef(null)
  
  // Debounce search query with 300ms delay for better performance
  const debouncedSectionSearch = useDebounce(sectionSearchQuery, 300)
  
  // Toast state
  const [toast, setToast] = useState(null)

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    if (showClassModal && modalClassData) {
      fetchClassDetails()
    }
  }, [showClassModal, modalClassData])

  const fetchClassDetails = async () => {
    setLoadingDetails(true)
    try {
      const classEnum = classData.class
      
      const response = await axiosApi.get('/students/class-details', { 
        params: { 
          class: classEnum
        } 
      })
      
      if (response.data.success) {
        setClassDetails(response.data.data)
      } else {
        showToast(response.data.message || 'Failed to load class details', 'error')
      }
    } catch (error) {
      console.error('Error fetching class details:', error)
      let errorMessage = 'Failed to load class details'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load class details'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoadingDetails(false)
    }
  }

  const fetchStudentsForSection = async (section, showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingStudents(prev => ({ ...prev, [section]: true }))
    } else {
      setLoadingStudents(prev => ({ ...prev, [section]: true }))
    }
    
    try {
      const classEnum = classData.class
      
      const response = await axiosApi.get('/students/class-section-students', { 
        params: { 
          class: classEnum, 
          section
        } 
      })
      
      if (response.data.success) {
        setSectionStudents(prev => ({ ...prev, [section]: response.data.data }))
      } else {
        showToast(response.data.message || `Failed to load students for section ${section}`, 'error')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      let errorMessage = `Failed to load students for section ${section}`
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load students'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      if (showRefreshing) {
        setRefreshingStudents(prev => ({ ...prev, [section]: false }))
      } else {
        setLoadingStudents(prev => ({ ...prev, [section]: false }))
      }
    }
  }

  const handleRefreshSection = (section) => {
    fetchStudentsForSection(section, true)
  }

  // Handle class card press - open modal
  const handleClassPress = () => {
    setModalClassData(classData)
    setShowClassModal(true)
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentSection) {
      setCurrentSection(null)
      setSectionSearchQuery('')
    } else {
      closeModal()
    }
  }

  // Close modal and reset
  const closeModal = () => {
    setShowClassModal(false)
    setModalClassData(null)
    setClassDetails([])
    setSectionStudents({})
    setLoadingStudents({})
    setRefreshingStudents({})
    setCurrentSection(null)
    setSectionSearchQuery('')
  }

  // Handle section select in modal
  const handleSectionSelect = (section) => {
    setCurrentSection(section)
    setSectionSearchQuery('')
    if (!sectionStudents[section]) {
      fetchStudentsForSection(section)
    }
  }

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSectionSearchQuery('')
    searchInputRef.current?.focus()
  }, [])

  // Apply filters and search to students
  const filteredStudents = useMemo(() => {
    const students = sectionStudents[currentSection] || []
    
    if (students.length === 0) return []
    
    // Apply search filter
    if (debouncedSectionSearch.trim()) {
      const query = debouncedSectionSearch.toLowerCase().trim()
      return students.filter(student => {
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase()
        const rollNo = student.rollNo?.toLowerCase() || ''
        const admissionNo = student.admissionNo?.toLowerCase() || ''
        
        return fullName.includes(query) || 
               rollNo.includes(query) || 
               admissionNo.includes(query)
      })
    }
    
    return students
  }, [sectionStudents, currentSection, debouncedSectionSearch])

  // Check if class matches parent search query
  const matchesParentSearch = useMemo(() => {
    if (!parentSearchQuery) return true
    const query = parentSearchQuery.toLowerCase()
    return (
      classData.classLabel?.toLowerCase().includes(query) ||
      classData.class?.toString().toLowerCase().includes(query) ||
      classData.sections?.some(s => s.toLowerCase().includes(query))
    )
  }, [parentSearchQuery, classData])

  // Helper functions for plural/singular text
  const getStudentText = (count) => {
    return count === 1 ? 'student' : 'students'
  }

  const getSectionText = (count) => {
    return count === 1 ? 'section' : 'sections'
  }

  const getResultText = (count) => {
    return count === 1 ? 'result' : 'results'
  }

  if (!matchesParentSearch) return null

  // Styles
  const styles = useMemo(() => StyleSheet.create({
    classCard: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 8,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: .5,
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      shadowColor: colors.text,
    },
    classCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    classIconContainer: {
      marginRight: 12,
    },
    classIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    classInfo: {
      flex: 1,
    },
    className: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    classSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
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
      justifyContent: 'space-between',
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
    headerInfo: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 16,
    },
    title: {
      fontSize: 18,
      color: '#FFFFFF',
      marginBottom: 2,
      textAlign: 'center',
      fontWeight: '600',
    },
    subtitle: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    sectionsInner: {
      padding: 20,
    },
    studentsInner: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },

    // Search bar for students view
    searchContainer: {
      marginHorizontal: 20,
      marginTop: 16,
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
    searchInfoText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginHorizontal: 20,
      marginBottom: 12,
      fontStyle: 'italic',
    },

    // Section card styles
    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: .5,
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      shadowColor: colors.text,
    },
    sectionCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    sectionIconContainer: {
      marginRight: 12,
    },
    sectionIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionInfo: {
      flex: 1,
    },
    sectionName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    sectionStats: {
      flexDirection: 'row',
      marginTop: 4,
      gap: 12,
      flexWrap: 'wrap',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Loading and empty states
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    clearSearchButton: {
      marginTop: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderRadius: 20,
      borderColor: colors.primary,
    },
    clearSearchText: {
      color: colors.primary,
    },
  }), [colors, isSearchFocused])

  // Compact class card (default view)
  return (
    <>
      <TouchableOpacity 
        style={styles.classCard}
        onPress={handleClassPress}
        activeOpacity={0.7}
      >
        <View style={styles.classCardContent}>
          <View style={styles.classIconContainer}>
            <View style={[styles.classIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="school" size={22} color={colors.primary} />
            </View>
          </View>
          
          <View style={styles.classInfo}>
            <ThemedText style={styles.className}>
              {classData.classLabel || classData.class}
            </ThemedText>
            <ThemedText style={styles.classSubtext}>
              {classData.totalCount || 0} {getStudentText(classData.totalCount || 0)} • {classData.sections?.length || 0} {getSectionText(classData.sections?.length || 0)}
            </ThemedText>
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      {/* Class Modal */}
      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent={false}
        visible={showClassModal}
        onRequestClose={handleBack}
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
       
          {/* Header with Gradient - Using colors from theme */}
          <LinearGradient
            colors={[colors.gradientStart || colors.primary, colors.gradientEnd || colors.primaryDark || colors.primary + 'cc']}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={styles.headerInfo}>
                  <ThemedText style={styles.title}>
                    {currentSection 
                      ? `${modalClassData?.classLabel || modalClassData?.class} - Section ${currentSection}` 
                      : `${modalClassData?.classLabel || modalClassData?.class}`
                    }
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {currentSection 
                      ? `${filteredStudents.length} ${getStudentText(filteredStudents.length)}`
                      : 'Select a section to view students'
                    }
                  </ThemedText>
                </View>
                
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Search Bar - Only show when in students view */}
          {currentSection && (
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
                  placeholder="Search by name, roll no, admission no..."
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={sectionSearchQuery}
                  onChangeText={setSectionSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  cursorColor={colors.primary}
                  returnKeyType="search"
                  clearButtonMode="never"
                  autoCorrect={false}
                  autoCapitalize="none"
                  enablesReturnKeyAutomatically
                />

                {sectionSearchQuery.length > 0 && (
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
                )}
              </View>
            </View>
          )}

          {/* Search results info */}
          {currentSection && debouncedSectionSearch && (
            <ThemedText style={styles.searchInfoText}>
              Found {filteredStudents.length} {getResultText(filteredStudents.length)} for "{debouncedSectionSearch}"
            </ThemedText>
          )}

          {/* Modal Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            refreshControl={
              currentSection ? (
                <RefreshControl
                  refreshing={refreshingStudents[currentSection] || false}
                  onRefresh={() => handleRefreshSection(currentSection)}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {currentSection ? (
              // Students content
              <View style={styles.studentsInner}>
                {loadingStudents[currentSection] && !refreshingStudents[currentSection] ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>
                      Loading students...
                    </ThemedText>
                  </View>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <StudentCard 
                      key={student.id}
                      student={student}
                    />
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Feather name="users" size={48} color={colors.textSecondary + '50'} />
                    <ThemedText style={styles.emptyText}>
                      {sectionStudents[currentSection]?.length === 0 
                        ? 'No students found in this section'
                        : 'No students match your search criteria'
                      }
                    </ThemedText>
                    {sectionStudents[currentSection]?.length > 0 && debouncedSectionSearch && (
                      <TouchableOpacity 
                        style={styles.clearSearchButton}
                        onPress={handleClearSearch}
                      >
                        <ThemedText style={styles.clearSearchText}>
                          Clear Search
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : (
              // Sections content
              <View style={styles.sectionsInner}>
                {loadingDetails ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>
                      Loading sections...
                    </ThemedText>
                  </View>
                ) : classDetails.length > 0 ? (
                  classDetails.map(sectionData => (
                    <TouchableOpacity
                      key={sectionData.section}
                      style={styles.sectionCard}
                      onPress={() => handleSectionSelect(sectionData.section)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sectionCardContent}>
                        <View style={styles.sectionIconContainer}>
                          <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="people" size={20} color={colors.primary} />
                          </View>
                        </View>
                        
                        <View style={styles.sectionInfo}>
                          <ThemedText style={styles.sectionName}>
                            Section {sectionData.section}
                          </ThemedText>
                          <View style={styles.sectionStats}>
                            <View style={styles.statItem}>
                              <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                              <ThemedText style={styles.statText}>
                                Boys: {sectionData.maleCount || 0}
                              </ThemedText>
                            </View>
                            <View style={styles.statItem}>
                              <View style={[styles.statDot, { backgroundColor: colors.success || '#4CAF50' }]} />
                              <ThemedText style={styles.statText}>
                                Girls: {sectionData.femaleCount || 0}
                              </ThemedText>
                            </View>
                            <View style={styles.statItem}>
                              <View style={[styles.statDot, { backgroundColor: colors.warning || '#FF9800' }]} />
                              <ThemedText style={styles.statText}>
                                Total: {sectionData.totalCount || 0}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                        
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Feather name="grid" size={48} color={colors.textSecondary + '50'} />
                    <ThemedText style={styles.emptyText}>
                      No sections found for this class
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Toast Notification */}
          <ToastNotification
            visible={!!toast}
            type={toast?.type}
            message={toast?.message}
            onHide={hideToast}
            position="bottom-center"
            duration={3000}
            showCloseButton={true}
          />
        </View>
      </Modal>
    </>
  )
}