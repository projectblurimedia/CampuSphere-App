import { useState, useEffect } from 'react'
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import StudentCard from '@/components/students/student-card'
import axiosApi from '@/utils/axiosApi'

export default function ClassGroup({ 
  classData, 
  academicYear,
  dashboardColors,
  searchQuery,
  filters,
  isExpanded = false,
  onClassSelect,
  onSectionSelect,
  selectedSection
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
  const [currentSection, setCurrentSection] = useState(null)

  useEffect(() => {
    if (showClassModal && modalClassData) {
      fetchClassDetails()
    }
  }, [showClassModal, modalClassData])

  const fetchClassDetails = async () => {
    setLoadingDetails(true)
    try {
      const response = await axiosApi.get('/students/class-details', { 
        params: { 
          class: classData.class, 
          academicYear 
        } 
      })
      if (response.data.success) {
        setClassDetails(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching class details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const fetchStudentsForSection = async (section) => {
    setLoadingStudents(prev => ({ ...prev, [section]: true }))
    try {
      const response = await axiosApi.get('/students/class-section-students', { 
        params: { 
          class: classData.class, 
          section, 
          academicYear 
        } 
      })
      if (response.data.success) {
        setSectionStudents(prev => ({ ...prev, [section]: response.data.data }))
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(prev => ({ ...prev, [section]: false }))
    }
  }

  const getStudentDisplayData = (student) => ({
    id: student._id,
    name: `${student.firstName} ${student.lastName}`,
    class: `Class ${classData.classLabel}`,
    rollNo: student.rollNo || student.admissionNo,
    attendance: 'N/A',
    fees: 'N/A',
    parent: student.parentName,
    contact: student.parentPhone,
    profilePic: student.profilePic?.url
  })

  // Handle class card press - open modal
  const handleClassPress = () => {
    setModalClassData(classData)
    setShowClassModal(true)
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
    setCurrentSection(null)
    onClassSelect?.()
  }

  // Handle section select in modal
  const handleSectionSelect = (section) => {
    setCurrentSection(section)
    fetchStudentsForSection(section)
  }

  // Apply filters to students
  const applyFiltersToStudents = (students) => {
    if (!filters || Object.values(filters).every(val => val === 'All')) {
      return students
    }

    return students.filter(student => {
      const matchesClass = filters.classFilter === 'All' || filters.classFilter === classData.classLabel
      const matchesGender = filters.genderFilter === 'All' || 
        (filters.genderFilter === 'Male' && student.gender === 'Male') ||
        (filters.genderFilter === 'Female' && student.gender === 'Female')
      
      const matchesName = !searchQuery || 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesClass && matchesGender && matchesName
    })
  }

  // Compact class card (default view)
  if (!showClassModal) {
    return (
      <TouchableOpacity 
        style={[styles.classCard, { 
          backgroundColor: dashboardColors.cardBg,
          borderColor: dashboardColors.border,
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
              {classData.classLabel}
            </ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
              {classData.totalCount} students
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
     
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <Ionicons name="school" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText type="title" style={styles.title}>
                  {currentSection 
                    ? `${modalClassData?.classLabel} - Section ${currentSection}` 
                    : `${modalClassData?.classLabel} - Sections`
                  }
                </ThemedText>
              </View>
              <View style={{ width: 45 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Modal Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentSection ? (
            // Students content
            (() => {
              const students = sectionStudents[currentSection] || []
              const filteredStudents = applyFiltersToStudents(students)
              return (
                <View style={styles.studentsInner}>
                  {loadingStudents[currentSection] ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <StudentCard 
                        key={student._id}
                        student={getStudentDisplayData(student)} 
                        dashboardColors={dashboardColors} 
                      />
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                        No students found in this section
                      </ThemedText>
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
                </View>
              ) : (() => {
                const filteredSections = searchQuery
                  ? classDetails.filter(sec => 
                      sec.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      sec.totalCount.toString().includes(searchQuery)
                    )
                  : classDetails
                return filteredSections.length > 0 ? (
                  filteredSections.map(sectionData => (
                    <TouchableOpacity
                      key={sectionData.section}
                      style={[styles.sectionCard, { 
                        backgroundColor: dashboardColors.cardBg,
                        borderColor: dashboardColors.border
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
                          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                            {sectionData.maleCount}M | {sectionData.femaleCount}F - Total: {sectionData.totalCount}
                          </ThemedText>
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
                    <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                      No sections found
                    </ThemedText>
                  </View>
                )
              })()}
            </View>
          )}
        </ScrollView>
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
    elevation: 0.25,
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

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
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
    elevation: 0.25,
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
})