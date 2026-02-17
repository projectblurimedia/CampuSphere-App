import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

export default function StudentMarks({ visible, onClose, student }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [marksData, setMarksData] = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [showExamDropdown, setShowExamDropdown] = useState(false)
  const [toast, setToast] = useState(null)

  // Exam type display names mapping
  const examTypeDisplayNames = {
    'FORMATIVE_1': 'Formative 1',
    'FORMATIVE_2': 'Formative 2',
    'FORMATIVE_3': 'Formative 3',
    'SUMMATIVE_1': 'Summative 1',
    'SUMMATIVE_2': 'Summative 2',
    'PRE_FINAL_1': 'Pre-Final 1',
    'PRE_FINAL_2': 'Pre-Final 2',
    'PRE_FINAL_3': 'Pre-Final 3',
    'FINAL': 'Final'
  }

  // Subject display names mapping
  const subjectDisplayNames = {
    'TELUGU': 'Telugu',
    'MATHEMATICS': 'Mathematics',
    'SCIENCE': 'Science',
    'ENGLISH': 'English',
    'HINDI': 'Hindi',
    'SOCIAL': 'Social',
    'COMPUTERS': 'Computers',
    'PHYSICS': 'Physics',
    'BIOLOGY': 'Biology'
  }

  // Format grade for display
  const formatGrade = (grade) => {
    if (!grade) return 'NA'
    return grade.replace('_PLUS', '+').replace('_', ' ')
  }

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Fetch marks data using existing API
  const fetchMarks = async () => {
    if (!student?.id) return

    try {
      setLoading(true)
      const response = await axiosApi.get(`/marks/student/${student.id}`)
      
      if (response.data.success) {
        setMarksData(response.data.data)
        // Set first exam as selected by default if available
        if (response.data.data.marks && response.data.data.marks.length > 0) {
          setSelectedExam(response.data.data.marks[0])
        }
      } else {
        showToast(response.data.message || 'Failed to load marks data', 'error')
      }
    } catch (error) {
      console.error('Error fetching marks:', error)
      let errorMessage = 'Failed to load marks data'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load marks data'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true)
    fetchMarks()
  }

  useEffect(() => {
    if (visible && student?.id) {
      fetchMarks()
    }
  }, [visible, student?.id])

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return '#4CAF50'
    if (percentage >= 60) return '#FF9800'
    if (percentage >= 35) return '#F44336'
    return '#9C27B0'
  }

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A_PLUS': '#4CAF50',
      'A': '#8BC34A',
      'B_PLUS': '#CDDC39',
      'B': '#FFC107',
      'C': '#FF9800',
      'D': '#FF5722',
      'E': '#F44336',
      'F': '#D32F2F',
      'NA': '#9E9E9E'
    }
    return gradeColors[grade] || '#9E9E9E'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const renderHeader = () => (
    <LinearGradient
      colors={[colors?.gradientStart, colors?.gradientEnd]}
      style={styles.header}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.9}
        >
          <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <ThemedText type='subtitle' style={styles.title}>
            Marks Overview
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {student?.firstName || ''} {student?.lastName || ''} • {student?.displayClass}-{student?.section}
          </ThemedText>
        </View>
        
        <View style={{ width: 44 }} />
      </View>
    </LinearGradient>
  )

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.tint} />
      <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
        Loading marks...
      </ThemedText>
    </View>
  )

  const renderNoMarks = () => (
    <View style={styles.noMarksContainer}>
      <MaterialIcons name="school" size={60} color={colors.textSecondary} />
      <ThemedText style={[styles.noMarksText, { color: colors.textSecondary }]}>
        No marks found for this student
      </ThemedText>
    </View>
  )

  const renderExamDropdown = () => {
    if (!marksData?.marks || marksData.marks.length === 0) return null

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[styles.dropdownButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => setShowExamDropdown(!showExamDropdown)}
          activeOpacity={0.7}
        >
          <View style={styles.dropdownButtonContent}>
            <MaterialIcons name="assignment" size={20} color={colors.primary} />
            <ThemedText style={[styles.dropdownButtonText, { color: colors.text }]}>
              {selectedExam ? examTypeDisplayNames[selectedExam.examType] : 'Select Exam'}
            </ThemedText>
          </View>
          <Ionicons 
            name={showExamDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        {showExamDropdown && (
          <View style={[styles.dropdownList, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {marksData.marks.map((exam, index) => (
              <TouchableOpacity
                key={exam.id || index}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: colors.border },
                  selectedExam?.examType === exam.examType && { backgroundColor: `${colors.primary}10` }
                ]}
                onPress={() => {
                  setSelectedExam(exam)
                  setShowExamDropdown(false)
                }}
              >
                <View style={styles.dropdownItemContent}>
                  <MaterialIcons 
                    name="check-circle" 
                    size={16} 
                    color={selectedExam?.examType === exam.examType ? colors.primary : 'transparent'} 
                  />
                  <ThemedText style={[
                    styles.dropdownItemText, 
                    { color: colors.text },
                    selectedExam?.examType === exam.examType && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {examTypeDisplayNames[exam.examType]}
                  </ThemedText>
                </View>
                <View style={[styles.examBadge, { backgroundColor: getStatusColor(exam.percentage) }]}>
                  <ThemedText style={styles.examBadgeText}>
                    {exam.percentage?.toFixed(1) || '0'}%
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderExamSummary = () => {
    if (!selectedExam) return null

    const statusColor = getStatusColor(selectedExam.percentage)

    return (
      <View style={styles.examSummaryCard}>
        {/* Exam Header */}
        <View style={[styles.examHeaderCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.examHeaderLeft}>
            <View style={[styles.examIconContainer, { backgroundColor: `${statusColor}15` }]}>
              <MaterialIcons name="assignment" size={24} color={statusColor} />
            </View>
            <View>
              <ThemedText style={[styles.examTitle, { color: colors.text }]}>
                {examTypeDisplayNames[selectedExam.examType]}
              </ThemedText>
              <ThemedText style={[styles.examDate, { color: colors.textSecondary }]}>
                Uploaded: {formatDate(selectedExam.uploadedAt)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.overallResultBadge, { backgroundColor: `${statusColor}15` }]}>
            <ThemedText style={[styles.overallResultText, { color: statusColor }]}>
              {selectedExam.overallResult || 'NA'}
            </ThemedText>
          </View>
        </View>

        {/* Overall Stats */}
        <View style={styles.overallStats}>
          <View style={[styles.statItemSmall, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="score" size={20} color="#2196F3" />
            <View style={styles.statContentSmall}>
              <ThemedText style={[styles.statValueSmall, { color: colors.text }]}>
                {selectedExam.totalObtained || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabelSmall, { color: colors.textSecondary }]}>
                Obtained
              </ThemedText>
            </View>
          </View>
          
          <View style={[styles.statItemSmall, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="assignment" size={20} color="#FF9800" />
            <View style={styles.statContentSmall}>
              <ThemedText style={[styles.statValueSmall, { color: colors.text }]}>
                {selectedExam.totalMaximum || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabelSmall, { color: colors.textSecondary }]}>
                Maximum
              </ThemedText>
            </View>
          </View>
          
          <View style={[styles.statItemSmall, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="pie-chart" size={20} color={statusColor} />
            <View style={styles.statContentSmall}>
              <ThemedText style={[styles.statValueSmall, { color: statusColor }]}>
                {selectedExam.percentage?.toFixed(1) || '0'}%
              </ThemedText>
              <ThemedText style={[styles.statLabelSmall, { color: colors.textSecondary }]}>
                Percentage
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={[statusColor, statusColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBar, 
              { width: `${Math.min(selectedExam.percentage || 0, 100)}%` }
            ]} 
          />
        </View>

        {/* Subjects List */}
        <View style={styles.subjectsHeader}>
          <MaterialIcons name="menu-book" size={18} color={colors.primary} />
          <ThemedText type='subtitle' style={[styles.subjectsTitle, { color: colors.text }]}>
            Subject Details
          </ThemedText>
        </View>

        {selectedExam.subjectDetails && selectedExam.subjectDetails.length > 0 ? (
          selectedExam.subjectDetails.map((subject, index) => {
            const subjectGradeColor = getGradeColor(subject.grade)
            const subjectResultColor = subject.result === 'PASS' ? '#4CAF50' : '#F44336'
            const displayGrade = formatGrade(subject.grade)
            
            return (
              <View key={index} style={[styles.subjectCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.subjectHeader}>
                  <View style={styles.subjectNameContainer}>
                    <View style={[styles.subjectIconContainer, { backgroundColor: `${subjectGradeColor}15` }]}>
                      <MaterialIcons name="book" size={16} color={subjectGradeColor} />
                    </View>
                    <ThemedText style={[styles.subjectName, { color: colors.text }]}>
                      {subjectDisplayNames[subject.subject] || subject.subject}
                    </ThemedText>
                  </View>
                  <View style={[styles.subjectResultBadge, { backgroundColor: `${subjectResultColor}15` }]}>
                    <ThemedText style={[styles.subjectResultText, { color: subjectResultColor }]}>
                      {subject.result || 'NA'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.subjectDetails}>
                  <View style={styles.subjectMarks}>
                    <ThemedText style={[styles.subjectMarksValue, { color: colors.text }]}>
                      {subject.marks || 0}
                    </ThemedText>
                    <ThemedText style={[styles.subjectMarksTotal, { color: colors.textSecondary }]}>
                      / {subject.totalMarks || 0}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.subjectMeta}>
                    {subject.isAbsent ? (
                      <View style={[styles.absentBadge, { backgroundColor: '#F4433615' }]}>
                        <MaterialIcons name="block" size={14} color="#F44336" />
                        <ThemedText style={[styles.absentText, { color: '#F44336' }]}>Absent</ThemedText>
                      </View>
                    ) : (
                      <>
                        <View style={[styles.gradeBadge, { backgroundColor: `${subjectGradeColor}15` }]}>
                          <ThemedText style={[styles.gradeText, { color: subjectGradeColor }]}>
                            {displayGrade}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.percentageText, { color: subjectGradeColor }]}>
                          {((subject.marks / subject.totalMarks) * 100).toFixed(1)}%
                        </ThemedText>
                      </>
                    )}
                  </View>
                </View>
              </View>
            )
          })
        ) : (
          <View style={[styles.noSubjectsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="info" size={24} color={colors.textSecondary} />
            <ThemedText style={[styles.noSubjectsText, { color: colors.textSecondary }]}>
              No subject details available
            </ThemedText>
          </View>
        )}
      </View>
    )
  }

  const renderMarksStats = () => {
    if (!marksData) return null

    const { summary, student: studentInfo } = marksData

    return (
      <View style={styles.contentContainer}>
        {/* Summary Stats - Redesigned with 2 rows */}
        <View style={styles.summarySection}>
          {/* First Row - Total Exams and Total Subjects */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#2196F315' }]}>
                <MaterialIcons name="assignment" size={24} color="#2196F3" />
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                  {summary.totalExams || 0}
                </ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Total Exams
                </ThemedText>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#4CAF5015' }]}>
                <MaterialIcons name="menu-book" size={24} color="#4CAF50" />
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                  {summary.totalSubjects || 0}
                </ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Total Subjects
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Second Row - Average Percentage (full width) */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCardFull, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#FF980015' }]}>
                <MaterialIcons name="pie-chart" size={24} color="#FF9800" />
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={[styles.summaryValue, { color: '#FF9800' }]}>
                  {summary.averagePercentage || 0}%
                </ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Average Percentage
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Exam Dropdown */}
        {renderExamDropdown()}

        {/* Selected Exam Details */}
        {selectedExam && renderExamSummary()}
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {renderHeader()}

        {loading && !refreshing ? (
          renderLoading()
        ) : !marksData?.marks || marksData.marks.length === 0 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.tint]}
                tintColor={colors.tint}
              />
            }
          >
            {renderNoMarks()}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.tint]}
                tintColor={colors.tint}
              />
            }
          >
            {renderMarksStats()}
          </ScrollView>
        )}

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
  container: {
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  noMarksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noMarksText: {
    fontSize: 16,
    marginTop: 16,
  },
  contentContainer: {
    gap: 8,
  },
  summarySection: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  summaryCardFull: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  examBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  examBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  examSummaryCard: {
    gap: 12,
  },
  examHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  examHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  examIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 11,
  },
  overallResultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  overallResultText: {
    fontSize: 12,
  },
  overallStats: {
    flexDirection: 'row',
    gap: 6,
  },
  statItemSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  statContentSmall: {
    flex: 1,
    flexDirection: 'column',
  },
  statLabelSmall: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  subjectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  subjectsTitle: {
    fontSize: 16,
  },
  subjectCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
  },
  subjectResultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  subjectResultText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subjectDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectMarks: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  subjectMarksValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  subjectMarksTotal: {
    fontSize: 14,
  },
  subjectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  absentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  absentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noSubjectsCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  noSubjectsText: {
    fontSize: 14,
  },
})