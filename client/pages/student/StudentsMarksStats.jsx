import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  Ionicons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import StudentCard from '@/components/students/student-card'
import StudentMarks from '@/pages/student/StudentMarks'
import { useDebounce } from '@/utils/useDebounce'

export default function StudentsMarksStats({ visible, onClose }) {
  const { colors } = useTheme()
  const scrollViewRef = useRef(null)
  const searchInputRef = useRef(null)
  
  const [stats, setStats] = useState(null)
  const [schoolSummary, setSchoolSummary] = useState(null)
  const [availableExams, setAvailableExams] = useState([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // Student Marks Modal state
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentMarks, setShowStudentMarks] = useState(false)

  // Toast functions
  const showToast = (message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }

  const hideToast = () => {
    setToast(null)
  }

  // Fetch marks statistics
  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const response = await axiosApi.get('/students/marks-stats')

      if (response.data.success) {
        setStats(response.data.data?.exams || [])
        setSchoolSummary(response.data.data?.schoolSummary || null)
        setAvailableExams(response.data.data?.availableExams || [])
      } else {
        throw new Error(response.data.message || 'Failed to fetch statistics')
      }
    } catch (err) {
      console.error('Error fetching marks stats:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load statistics'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      if (showLoading) setIsLoading(false)
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
    } catch (err) {
      console.error('Search error:', err)
      showToast('Failed to search students', 'error')
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

  // Initial load
  useEffect(() => {
    if (visible) {
      fetchStats()
      setSearchQuery('')
      setSelectedStudent(null)
    }
  }, [visible, fetchStats])

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    if (searchQuery.trim()) {
      setSearchQuery('')
      setSearchResults([])
      setIsSearching(false)
    } else {
      fetchStats(false)
    }
  }, [searchQuery, fetchStats])

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

  // Handle student press - Open StudentMarks Modal
  const handleStudentPress = (student) => {
    setSelectedStudent(student)
    setShowStudentMarks(true)
  }

  // Handle close student modal
  const handleCloseStudentModal = () => {
    setShowStudentMarks(false)
    setSelectedStudent(null)
  }

  // Format grade display (A+ instead of A_PLUS)
  const formatGrade = (grade) => {
    return grade.replace('_PLUS', '+').replace('_', ' ')
  }

  // Get result text for search count
  const getResultText = (count) => {
    return count === 1 ? 'student' : 'students'
  }

  // Overall Stat Card Component
  const OverallStatCard = ({ title, value, icon, color }) => (
    <View style={[styles.overallCard, { borderLeftColor: color }]}>
      <View style={styles.overallCardHeader}>
        <View style={[styles.overallIconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <ThemedText style={styles.overallCardValue}>{value}</ThemedText>
      </View>
      <ThemedText style={styles.overallCardTitle}>{title}</ThemedText>
    </View>
  )

  // Exam Card Component
  const ExamCard = ({ exam }) => {
    const getGradeColor = (grade) => {
      switch(grade) {
        case 'A+': return '#10b981'
        case 'A': return '#3b82f6'
        case 'B+': return '#8b5cf6'
        case 'B': return '#f59e0b'
        case 'C': return '#f97316'
        case 'D': return '#ef4444'
        case 'E': return '#6b7280'
        case 'F': return '#dc2626'
        default: return '#94a3b8'
      }
    }

    return (
      <View style={styles.examCard}>
        <View style={styles.examHeader}>
          <View style={[styles.examBadge, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={[styles.examName, { color: colors.primary }]}>
              {exam.examTypeLabel}
            </ThemedText>
          </View>
          <View style={styles.studentCountBadge}>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
            <ThemedText style={styles.studentCountText}>
              {exam.summary.totalStudentsWithMarks} students
            </ThemedText>
          </View>
        </View>

        {/* Class Sections Preview */}
        <View style={styles.classSectionsPreview}>
          {exam.classSections.map((section, idx) => (
            <View key={idx} style={styles.classSectionPreviewItem}>
              <View style={styles.classSectionPreviewHeader}>
                <View style={styles.classSectionTitleContainer}>
                  <ThemedText style={styles.classSectionPreviewClass}>
                    {section.classLabel}
                  </ThemedText>
                  <View style={[styles.sectionBadge, { backgroundColor: colors.inputBackground }]}>
                    <ThemedText style={styles.sectionPreviewText}>
                      Section: {section.section}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.classSectionPreviewPercent, { color: getGradeColor(section.summary.averagePercentage >= 90 ? 'A+' : section.summary.averagePercentage >= 75 ? 'A' : section.summary.averagePercentage >= 60 ? 'B' : 'C') }]}>
                  {section.summary.averagePercentage}%
                </ThemedText>
              </View>
              
              {/* Stats Row */}
              <View style={styles.classStatsRow}>
                <View style={styles.classStatItem}>
                  <ThemedText style={styles.classStatLabel}>Pass</ThemedText>
                  <ThemedText style={[styles.classStatValue, { color: '#10b981' }]}>
                    {section.summary.passPercentage}%
                  </ThemedText>
                </View>
                <View style={styles.classStatDivider} />
                <View style={styles.classStatItem}>
                  <ThemedText style={styles.classStatLabel}>Students</ThemedText>
                  <ThemedText style={[styles.classStatValue, { color: colors.primary }]}>
                    {section.summary.studentsWithMarks}/{section.summary.totalStudents}
                  </ThemedText>
                </View>
              </View>

              {/* Grade Distribution Preview - Shows top grades achieved */}
              <View style={styles.gradePreviewContainer}>
                {Object.entries(section.summary.gradeDistribution)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => {
                    // Sort by grade precedence (A+ first, then A, etc.)
                    const gradeOrder = { 'A+': 1, 'A': 2, 'B+': 3, 'B': 4, 'C': 5, 'D': 6, 'E': 7, 'F': 8 }
                    return (gradeOrder[a[0]] || 99) - (gradeOrder[b[0]] || 99)
                  })
                  .slice(0, 3)
                  .map(([grade, count]) => (
                    <View key={grade} style={[styles.gradePreviewBadge, { backgroundColor: getGradeColor(formatGrade(grade)) + '20' }]}>
                      <ThemedText style={[styles.gradePreviewText, { color: getGradeColor(formatGrade(grade)) }]}>
                        {formatGrade(grade)} : {count}
                      </ThemedText>
                    </View>
                  ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      zIndex: 10,
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
    headerTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    headerSubtitle: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 2,
    },
    // Search bar styles
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
    schoolSummarySection: {
      marginBottom: 10,
    },
    overallCardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    overallCard: {
      width: '48%',
      backgroundColor: colors.cardBackground,
      borderRadius: 6,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    overallCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    overallIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overallCardValue: {
      fontSize: 22,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
    },
    overallCardTitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 8,
      paddingBottom: 40,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 14,
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    errorText: {
      textAlign: 'center',
      color: '#dc2626',
      marginTop: 12,
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    examCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    examHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    examBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    examName: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    studentCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
    },
    studentCountText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    classSectionsPreview: {
      gap: 16,
    },
    classSectionPreviewItem: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 12,
    },
    classSectionPreviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    classSectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    classSectionPreviewClass: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
    },
    sectionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    sectionPreviewText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    classSectionPreviewPercent: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
    },
    classStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 8,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 8,
    },
    classStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    classStatLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    classStatValue: {
      fontSize: 14,
      fontFamily: 'Poppins-Bold',
    },
    classStatDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
    },
    gradePreviewContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    gradePreviewBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    gradePreviewText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginRight: 4,
    },
    resultCount: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    availableExamsHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 16,
      fontFamily: 'Poppins-Medium',
      paddingHorizontal: 4,
    },
    searchInfoContainer: {
      marginBottom: 12,
    },
  })

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.headerTitle}>Marks Statistics</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>
                    {isSearching ? 'Search Results' : 'All Exams Overview'}
                  </ThemedText>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Search Bar - Inline Design */}
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

          {/* Search results info */}
          {isSearching && debouncedSearchQuery && (
            <ThemedText style={styles.searchInfoText}>
              Found {searchResults.length} {getResultText(searchResults.length)} for "{debouncedSearchQuery}"
            </ThemedText>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            onTouchStart={handleScrollViewTouch}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={true}
          >
            {isSearching ? (
              // Search Results
              searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onPress={(selectedStudent) => {
                      handleStudentPress(selectedStudent)
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <ThemedText style={[styles.emptyMessage, { color: colors.textSecondary, marginTop: 12 }]}>
                    No students found matching "{debouncedSearchQuery}"
                  </ThemedText>
                </View>
              )
            ) : (
              // Exam Stats
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText style={styles.loadingText}>
                    Loading marks statistics...
                  </ThemedText>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-triangle" size={50} color="#dc2626" />
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              ) : !stats || stats.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="analytics-outline" size={70} color={colors.textSecondary} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>No Data Available</ThemedText>
                  <ThemedText style={styles.emptyMessage}>
                    No marks records found in the system
                  </ThemedText>
                </View>
              ) : (
                <>
                  {/* School Summary - Inside ScrollView */}
                  {schoolSummary && (
                    <View style={styles.schoolSummarySection}>
                      <View style={styles.overallCardsGrid}>
                        <OverallStatCard
                          title="Total Students"
                          value={schoolSummary.totalStudents}
                          icon="users"
                          color="#3b82f6"
                        />
                        <OverallStatCard
                          title="With Marks"
                          value={schoolSummary.uniqueStudentsWithMarks}
                          icon="check-circle"
                          color="#10b981"
                        />
                        <OverallStatCard
                          title="Without Marks"
                          value={schoolSummary.studentsWithoutAnyMarks}
                          icon="x-circle"
                          color="#ef4444"
                        />
                        <OverallStatCard
                          title="Total Exams"
                          value={schoolSummary.totalExams}
                          icon="award"
                          color="#8b5cf6"
                        />
                      </View>
                    </View>
                  )}

                  {/* Available Exams Hint */}
                  {availableExams.length > 0 && (
                    <ThemedText style={styles.availableExamsHint}>
                      {availableExams.length} {availableExams.length === 1 ? 'exam' : 'exams'} available
                    </ThemedText>
                  )}

                  {/* Exams List */}
                  {stats.map((exam, index) => (
                    <ExamCard
                      key={`${exam.examType}-${index}`}
                      exam={exam}
                    />
                  ))}
                </>
              )
            )}
          </ScrollView>

          {/* Toast Notification */}
          <ToastNotification
            visible={!!toast}
            type={toast?.type}
            message={toast?.message}
            onHide={hideToast}
            position="bottom-center"
            duration={toast?.duration || 3000}
            showCloseButton={true}
          />
        </View>
      </Modal>

      {/* Student Marks Modal */}
      {selectedStudent && (
        <StudentMarks
          visible={showStudentMarks}
          onClose={handleCloseStudentModal}
          student={selectedStudent}
        />
      )}
    </>
  )
}