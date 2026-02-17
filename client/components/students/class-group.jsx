import { useState, useEffect, useCallback, useRef } from 'react'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import StudentCard from '@/components/students/student-card'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'

export default function ClassGroup({ 
  classData, 
  searchQuery,
  filters,
  onClassSelect,
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
    onClassSelect?.()
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentSection) {
      setCurrentSection(null)
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
  }

  // Handle section select in modal
  const handleSectionSelect = (section) => {
    setCurrentSection(section)
    if (!sectionStudents[section]) {
      fetchStudentsForSection(section)
    }
  }

  // Apply filters to students
  const applyFiltersToStudents = (students) => {
    if (!students || students.length === 0) return []
    
    if (!filters || Object.values(filters).every(val => val === 'All')) {
      return students
    }

    return students.filter(student => {
      const matchesGender = filters.genderFilter === 'All' || 
        (filters.genderFilter === 'Male' && student.gender === 'MALE') ||
        (filters.genderFilter === 'Female' && student.gender === 'FEMALE')
      
      const matchesSearch = !searchQuery || 
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesGender && matchesSearch
    })
  }

  // Compact class card (default view)
  if (!showClassModal) {
    return (
      <TouchableOpacity 
        style={[styles.classCard, { 
          backgroundColor: colors?.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.shadow || '#00000040'
        }]}
        onPress={handleClassPress}
        activeOpacity={0.7}
      >
        <View style={styles.classCardContent}>
          <View style={styles.classIconContainer}>
            <View style={[styles.classIcon, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="school" size={22} color={colors.tint} />
            </View>
          </View>
          
          <View style={styles.classInfo}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 16 }}>
              {classData.classLabel || classData.class}
            </ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
              {classData.totalCount || 0} students
            </ThemedText>
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>
    )
  }

  // Class modal
  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent={false}
      visible={showClassModal}
      onRequestClose={handleBack}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
     
        {/* Header with Gradient - Matching CreateStudent style */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={[styles.backButton]}
                onPress={handleBack}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.headerInfo}>
                <View>
                  <ThemedText type="subtitle" style={styles.title}>
                    {currentSection 
                      ? `${modalClassData?.classLabel || modalClassData?.class} - Section ${currentSection}` 
                      : `${modalClassData?.classLabel || modalClassData?.class}`
                    }
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {currentSection 
                      ? `${applyFiltersToStudents(sectionStudents[currentSection] || []).length} students`
                      : 'Select a section to view students'
                    }
                  </ThemedText>
                </View>
              </View>
              
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Modal Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            currentSection ? (
              <RefreshControl
                refreshing={refreshingStudents[currentSection] || false}
                onRefresh={() => handleRefreshSection(currentSection)}
                colors={[colors.tint]}
                tintColor={colors.tint}
              />
            ) : undefined
          }
        >
          {currentSection ? (
            // Students content
            (() => {
              const students = sectionStudents[currentSection] || []
              const filteredStudents = applyFiltersToStudents(students)
              
              return (
                <View style={styles.studentsInner}>
                  {loadingStudents[currentSection] && !refreshingStudents[currentSection] ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.tint} />
                      <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
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
                      <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
                        {students.length === 0 
                          ? 'No students found in this section'
                          : 'No students match your search criteria'
                        }
                      </ThemedText>
                      {students.length > 0 && searchQuery && (
                        <TouchableOpacity 
                          style={[styles.clearButton, { borderColor: colors.primary }]}
                          onPress={() => onClassSelect?.()}
                        >
                          <ThemedText style={{ color: colors.primary }}>
                            Clear Search
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )
            })()
          ) : (
            // Sections content
            <View style={styles.sectionsInner}>
              {loadingDetails ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.tint} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                    Loading sections...
                  </ThemedText>
                </View>
              ) : classDetails.length > 0 ? (
                classDetails.map(sectionData => (
                  <TouchableOpacity
                    key={sectionData.section}
                    style={[styles.sectionCard, { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      shadowColor: colors.shadow || '#00000040'
                    }]}
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
                        <ThemedText style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                          Section {sectionData.section}
                        </ThemedText>
                        <View style={styles.sectionStats}>
                          <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                              Boys: {sectionData.maleCount || 0}
                            </ThemedText>
                          </View>
                          <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: colors.success }]} />
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                              Girls: {sectionData.femaleCount || 0}
                            </ThemedText>
                          </View>
                          <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
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
                  <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
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
  )
}

const styles = StyleSheet.create({
  classCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  // Modal styles - Matching CreateStudent
  modalContainer: {
    flex: 1,
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

  // Section card styles
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  sectionStats: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
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

  // Loading and empty states
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  clearButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
  },
})