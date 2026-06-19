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
import { FontAwesome5, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import StudentCard from '@/components/students/student-card'
import StudentMarks from '@/pages/student/StudentMarks'
import { useDebounce } from '@/utils/useDebounce'

// ─── Constants ───────────────────────────────────────────────────────────────

const EXAM_TYPE_LABELS = {
  FORMATIVE_1: 'Formative 1',
  FORMATIVE_2: 'Formative 2',
  FORMATIVE_3: 'Formative 3',
  SUMMATIVE_1: 'Summative 1',
  SUMMATIVE_2: 'Summative 2',
  PRE_FINAL_1: 'Pre-Final 1',
  PRE_FINAL_2: 'Pre-Final 2',
  PRE_FINAL_3: 'Pre-Final 3',
  FINAL: 'Final',
}

const SUBJECT_LABELS = {
  TELUGU: 'Telugu',
  MATHEMATICS: 'Mathematics',
  SCIENCE: 'Science',
  ENGLISH: 'English',
  HINDI: 'Hindi',
  SOCIAL: 'Social Studies',
  COMPUTERS: 'Computers',
  PHYSICS: 'Physics',
  BIOLOGY: 'Biology',
}

const CLASS_ORDER = [
  'PRE_NURSERY', 'NURSERY', 'LKG', 'UKG',
  'CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5',
  'CLASS_6', 'CLASS_7', 'CLASS_8', 'CLASS_9', 'CLASS_10',
]

const CLASS_LABELS = {
  PRE_NURSERY: 'Pre-Nursery',
  NURSERY: 'Nursery',
  LKG: 'LKG',
  UKG: 'UKG',
  CLASS_1: 'Class 1',
  CLASS_2: 'Class 2',
  CLASS_3: 'Class 3',
  CLASS_4: 'Class 4',
  CLASS_5: 'Class 5',
  CLASS_6: 'Class 6',
  CLASS_7: 'Class 7',
  CLASS_8: 'Class 8',
  CLASS_9: 'Class 9',
  CLASS_10: 'Class 10',
}

const GRADE_DISPLAY_ORDER = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F']

// ─── Pure helpers (outside component for stable refs) ────────────────────────

const getGradeColor = (grade) => {
  const g = typeof grade === 'string' ? grade.replace('_PLUS', '+') : grade
  switch (g) {
    case 'A+': case 'A_PLUS': return '#10b981'
    case 'A': return '#3b82f6'
    case 'B+': case 'B_PLUS': return '#8b5cf6'
    case 'B': return '#f59e0b'
    case 'C': return '#f97316'
    case 'D': return '#ef4444'
    case 'E': return '#6b7280'
    case 'F': return '#dc2626'
    default: return '#94a3b8'
  }
}

const getResultColor = (result) => {
  if (result === 'PASS') return '#10b981'
  if (result === 'FAIL') return '#ef4444'
  return '#94a3b8'
}

const formatGrade = (grade) => {
  if (!grade || grade === 'NA') return 'NA'
  return grade.replace('_PLUS', '+').replace(/_/g, ' ')
}

// ─── StudentReportCard ───────────────────────────────────────────────────────

function StudentReportCard({ student, colors, selectedClass, selectedSection, onPressViewFull }) {
  const [expanded, setExpanded] = useState(false)

  const resultColor = getResultColor(student.overallResult)
  const subjects = student.marksData ? Object.entries(student.marksData) : []

  const s = StyleSheet.create({
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      marginBottom: 8,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    rollBadge: {
      width: 34, height: 34, borderRadius: 17,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: colors.primary + '20',
    },
    rollText: { fontSize: 12, fontFamily: 'Poppins-Bold', color: colors.primary },
    nameBox: { flex: 1 },
    name: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text },
    summary: { fontSize: 11, fontFamily: 'Poppins-Medium', marginTop: 1 },
    right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    resultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    resultText: { fontSize: 10, fontFamily: 'Poppins-Bold' },
    expanded: { borderTopWidth: 1, borderTopColor: colors.border },
    overallRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: colors.primary + '0D',
    },
    overallLabel: { fontSize: 13, fontFamily: 'Poppins-Bold', color: colors.text },
    rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    marksVal: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: colors.text },
    pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    pillText: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Poppins-Bold' },
    pct: { fontSize: 13, fontFamily: 'Poppins-Bold', minWidth: 48, textAlign: 'right' },
    subjectRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 8,
      borderTopWidth: 0.5, borderTopColor: colors.border,
    },
    subjectName: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.textSecondary, flex: 1 },
    subjectRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    absentPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#ef444420' },
    absentText: { fontSize: 10, color: '#ef4444', fontFamily: 'Poppins-Medium' },
    resPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, minWidth: 36, alignItems: 'center' },
    resPillText: { fontSize: 9, fontFamily: 'Poppins-Bold' },
    viewBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, margin: 10, padding: 8, borderRadius: 10,
      borderWidth: 1, borderColor: colors.primary + '50',
      backgroundColor: colors.primary + '08',
    },
    viewBtnText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: colors.primary },
    noMarksNote: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: 12, borderTopWidth: 1, borderTopColor: colors.border,
    },
    noMarksText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.textSecondary },
  })

  return (
    <View style={s.card}>
      <TouchableOpacity style={s.headerRow} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={s.left}>
          <View style={s.rollBadge}>
            <ThemedText style={s.rollText}>{student.rollNo || '—'}</ThemedText>
          </View>
          <View style={s.nameBox}>
            <ThemedText style={s.name} numberOfLines={1}>{student.fullName}</ThemedText>
            {student.hasMarks ? (
              <ThemedText style={[s.summary, { color: colors.textSecondary }]}>
                {student.totalObtained}/{student.totalMaximum} • {student.percentage?.toFixed(1)}%
              </ThemedText>
            ) : (
              <ThemedText style={[s.summary, { color: '#f59e0b' }]}>Marks not uploaded</ThemedText>
            )}
          </View>
        </View>
        <View style={s.right}>
          <View style={[s.resultBadge, { backgroundColor: resultColor + '20' }]}>
            <ThemedText style={[s.resultText, { color: resultColor }]}>
              {student.hasMarks ? student.overallResult : 'NO DATA'}
            </ThemedText>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {expanded && student.hasMarks && (
        <View style={s.expanded}>
          {/* Overall summary row */}
          <View style={s.overallRow}>
            <ThemedText style={s.overallLabel}>Overall</ThemedText>
            <View style={s.rightGroup}>
              <ThemedText style={s.marksVal}>
                {student.totalObtained}/{student.totalMaximum}
              </ThemedText>
              <View style={[s.pill, { backgroundColor: getGradeColor(student.overallGrade) }]}>
                <ThemedText style={s.pillText}>{formatGrade(student.overallGrade)}</ThemedText>
              </View>
              <ThemedText style={[s.pct, { color: getGradeColor(student.overallGrade) }]}>
                {student.percentage?.toFixed(1)}%
              </ThemedText>
            </View>
          </View>

          {/* Per-subject rows */}
          {subjects.map(([subjectKey, sub]) => {
            const label = SUBJECT_LABELS[subjectKey] || subjectKey
            const grade = formatGrade(sub.grade)
            const gradeColor = getGradeColor(sub.grade)
            const resColor = getResultColor(sub.result)
            const pct = sub.totalMarks > 0
              ? ((sub.marks / sub.totalMarks) * 100).toFixed(1)
              : '0.0'

            return (
              <View key={subjectKey} style={s.subjectRow}>
                <ThemedText style={s.subjectName} numberOfLines={1}>{label}</ThemedText>
                <View style={s.subjectRight}>
                  {sub.isAbsent ? (
                    <View style={s.absentPill}>
                      <ThemedText style={s.absentText}>Absent</ThemedText>
                    </View>
                  ) : (
                    <>
                      <ThemedText style={[s.marksVal, { fontSize: 12 }]}>
                        {sub.marks}/{sub.totalMarks}
                      </ThemedText>
                      <View style={[s.pill, { backgroundColor: gradeColor }]}>
                        <ThemedText style={s.pillText}>{grade}</ThemedText>
                      </View>
                      <ThemedText style={[s.pct, { color: gradeColor, fontSize: 12, minWidth: 44 }]}>
                        {pct}%
                      </ThemedText>
                    </>
                  )}
                  <View style={[s.resPill, { backgroundColor: resColor + '20' }]}>
                    <ThemedText style={[s.resPillText, { color: resColor }]}>
                      {sub.result}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )
          })}

          {/* View full marks button */}
          <TouchableOpacity style={s.viewBtn} onPress={() => onPressViewFull(student)}>
            <MaterialIcons name="assignment" size={14} color={colors.primary} />
            <ThemedText style={s.viewBtnText}>View Full Marks Report</ThemedText>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {expanded && !student.hasMarks && (
        <View style={s.noMarksNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <ThemedText style={s.noMarksText}>No marks recorded for this exam</ThemedText>
        </View>
      )}
    </View>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentsMarksStats({ visible, onClose }) {
  const { colors } = useTheme()
  const searchInputRef = useRef(null)

  // Stats from API
  const [stats, setStats] = useState([])
  const [availableExams, setAvailableExams] = useState([])

  // Filter state
  const [selectedExamType, setSelectedExamType] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  // Class-level student detail data
  const [classStudents, setClassStudents] = useState(null)
  const [classLoading, setClassLoading] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Student marks modal
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentMarks, setShowStudentMarks] = useState(false)

  const showToast = (message, type = 'error', duration = 3000) =>
    setToast({ message, type, duration })
  const hideToast = () => setToast(null)

  // ── API calls ──────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const res = await axiosApi.get('/students/marks-stats')
      if (res.data.success) {
        setStats(res.data.data?.exams || [])
        setAvailableExams(res.data.data?.availableExams || [])
      } else {
        throw new Error(res.data.message || 'Failed to fetch statistics')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load statistics'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      if (showLoading) setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchClassStudents = useCallback(async (examType, className, section) => {
    setClassLoading(true)
    setClassStudents(null)
    try {
      const res = await axiosApi.get('/marks/exam', {
        params: { examType, className, section },
      })
      if (res.data.success) {
        setClassStudents(res.data.data)
      } else {
        throw new Error(res.data.message || 'Failed to fetch student data')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load student data'
      showToast(msg, 'error')
    } finally {
      setClassLoading(false)
    }
  }, [])

  const searchStudents = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setSearchLoading(true)
    setIsSearching(true)
    try {
      const res = await axiosApi.get('/students/quick-search', {
        params: { query, limit: 50 },
      })
      if (res.data.success) setSearchResults(res.data.data)
    } catch {
      showToast('Failed to search students', 'error')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchStudents(debouncedSearchQuery)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, searchStudents])

  useEffect(() => {
    if (visible) {
      fetchStats()
      setSelectedExamType(null)
      setSelectedClass(null)
      setSelectedSection(null)
      setClassStudents(null)
      setSearchQuery('')
    }
  }, [visible])

  useEffect(() => {
    if (selectedExamType && selectedClass && selectedSection) {
      fetchClassStudents(selectedExamType, selectedClass, selectedSection)
    } else {
      setClassStudents(null)
    }
  }, [selectedExamType, selectedClass, selectedSection])

  // ── Filter handlers ────────────────────────────────────────────────────────

  const handleExamTypeSelect = (examType) => {
    setSelectedExamType((prev) => (prev === examType ? null : examType))
    setSelectedClass(null)
    setSelectedSection(null)
    setClassStudents(null)
  }

  const handleClassSelect = (cls) => {
    setSelectedClass((prev) => (prev === cls ? null : cls))
    setSelectedSection(null)
    setClassStudents(null)
  }

  const handleSectionSelect = (sec) => {
    setSelectedSection((prev) => (prev === sec ? null : sec))
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const getSelectedExamData = () =>
    stats.find((e) => e.examType === selectedExamType) || null

  const getAvailableClasses = () => {
    const exam = getSelectedExamData()
    if (!exam) return []
    const cls = [...new Set(exam.classSections.map((s) => s.class))]
    return cls.sort((a, b) => CLASS_ORDER.indexOf(a) - CLASS_ORDER.indexOf(b))
  }

  const getAvailableSections = () => {
    const exam = getSelectedExamData()
    if (!exam || !selectedClass) return []
    return exam.classSections
      .filter((s) => s.class === selectedClass)
      .map((s) => s.section)
      .sort()
  }

  const getSchoolSummary = () => {
    const exam = getSelectedExamData()
    if (!exam) return null

    const { summary } = exam
    let totalPass = 0
    let totalFail = 0
    const gradeDistribution = {}

    exam.classSections.forEach((cs) => {
      totalPass += cs.summary?.resultDistribution?.PASS || 0
      totalFail += cs.summary?.resultDistribution?.FAIL || 0
      const gd = cs.summary?.gradeDistribution || {}
      Object.entries(gd).forEach(([grade, count]) => {
        if (count > 0) {
          const display = grade.replace('_PLUS', '+')
          gradeDistribution[display] = (gradeDistribution[display] || 0) + count
        }
      })
    })

    const passPercentage =
      summary.totalStudentsWithMarks > 0
        ? ((totalPass / summary.totalStudentsWithMarks) * 100).toFixed(1)
        : '0.0'

    return {
      totalStudentsWithMarks: summary.totalStudentsWithMarks,
      totalPass,
      totalFail,
      passPercentage,
      avgPercentage:
        summary.averagePercentage != null
          ? summary.averagePercentage.toFixed(1)
          : '0.0',
      gradeDistribution,
    }
  }

  // ── Student press handlers ─────────────────────────────────────────────────

  const handleStudentPress = (student) => {
    setSelectedStudent({
      ...student,
      displayClass: CLASS_LABELS[selectedClass] || selectedClass,
      section: selectedSection,
      class: selectedClass,
    })
    setShowStudentMarks(true)
  }

  const handleSearchStudentPress = (student) => {
    setSelectedStudent(student)
    setShowStudentMarks(true)
  }

  const handleCloseStudentModal = () => {
    setShowStudentMarks(false)
    setSelectedStudent(null)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    searchInputRef.current?.focus()
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStats(false)
    if (selectedExamType && selectedClass && selectedSection) {
      fetchClassStudents(selectedExamType, selectedClass, selectedSection)
    }
  }, [selectedExamType, selectedClass, selectedSection])

  // ── Header subtitle ────────────────────────────────────────────────────────

  const getHeaderSubtitle = () => {
    if (isSearching) return 'Search Results'
    if (selectedExamType && selectedClass && selectedSection)
      return `${CLASS_LABELS[selectedClass]} — Sec ${selectedSection} · ${EXAM_TYPE_LABELS[selectedExamType] || selectedExamType}`
    if (selectedExamType)
      return EXAM_TYPE_LABELS[selectedExamType] || selectedExamType
    return 'Select exam type to view report'
  }

  // ── Styles (dynamic, depend on colors/focus) ───────────────────────────────

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
      width: 44, height: 44, borderRadius: 22,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    },
    headerTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins-SemiBold' },
    headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    // Filters
    filtersWrapper: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterBlock: { marginBottom: 10 },
    filterLabel: {
      fontSize: 10, fontFamily: 'Poppins-SemiBold',
      color: colors.textSecondary, marginBottom: 6,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.text },
    chipTextSelected: { color: '#FFFFFF' },

    // Search
    searchContainer: {
      marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    },
    searchBar: {
      flexDirection: 'row', alignItems: 'center',
      height: 44, paddingHorizontal: 14,
      borderRadius: 22, borderWidth: isSearchFocused ? 2 : 1,
      backgroundColor: colors.cardBackground,
      borderColor: isSearchFocused ? colors.primary : colors.border,
    },
    searchInput: {
      flex: 1, fontSize: 14, paddingVertical: 8,
      color: colors.text,
    },
    searchInfoText: {
      fontSize: 12, color: colors.textSecondary,
      marginHorizontal: 16, marginBottom: 8, fontStyle: 'italic',
    },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    // States
    loadingContainer: {
      alignItems: 'center', justifyContent: 'center', paddingVertical: 60,
    },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    errorContainer: {
      alignItems: 'center', justifyContent: 'center', paddingVertical: 60,
    },
    errorText: { textAlign: 'center', color: '#dc2626', marginTop: 12, fontSize: 14 },
    emptyContainer: {
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 50, paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 18, fontFamily: 'Poppins-Bold',
      color: colors.text, marginTop: 16, marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 14, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 20,
    },

    // Hero card
    heroCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    heroTopRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 16,
    },
    heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins-Medium' },
    heroExamBadge: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
    heroBigValue: {
      fontSize: 46, color: '#FFFFFF', fontFamily: 'Poppins-Bold', lineHeight: 52,
    },
    heroStatsRow: {
      flexDirection: 'row', justifyContent: 'space-around',
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
      paddingTop: 14,
    },
    heroStat: { alignItems: 'center', flex: 1 },
    heroStatVal: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins-Bold' },
    heroStatLbl: {
      fontSize: 10, color: 'rgba(255,255,255,0.75)',
      fontFamily: 'Poppins-Medium', marginTop: 2,
    },
    heroStatDiv: {
      width: 1, height: 32,
      backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center',
    },

    // Grade distribution
    gradeSectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.border,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14, fontFamily: 'Poppins-SemiBold',
      color: colors.text, marginBottom: 12,
    },
    gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gradeBox: {
      flex: 1, minWidth: 68, alignItems: 'center',
      padding: 10, borderRadius: 12, borderWidth: 1,
    },
    gradeDot: {
      width: 34, height: 34, borderRadius: 17,
      justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    gradeDotText: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Poppins-Bold' },
    gradeCount: { fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 2 },
    gradePercent: { fontSize: 10, fontFamily: 'Poppins-Medium', color: colors.textSecondary },

    // Section header row
    sectionHeaderRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10,
    },
    sectionHint: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Poppins-Medium' },

    // Class overview cards
    classCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14, borderWidth: 1,
      borderColor: colors.border, marginBottom: 10,
      overflow: 'hidden',
    },
    classCardHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', padding: 12,
    },
    classCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    classCardTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text },
    secBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    secBadgeText: { fontSize: 11, fontFamily: 'Poppins-Medium' },
    passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    passBadgeText: { fontSize: 11, fontFamily: 'Poppins-SemiBold' },
    classStatsStrip: {
      flexDirection: 'row', justifyContent: 'space-around',
      padding: 10, backgroundColor: colors.inputBackground,
    },
    classStat: { alignItems: 'center', flex: 1 },
    classStatVal: { fontSize: 14, fontFamily: 'Poppins-Bold', color: colors.text },
    classStatLbl: {
      fontSize: 9, fontFamily: 'Poppins-Medium',
      color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase',
    },
    divider: { width: 1, height: 28, alignSelf: 'center', backgroundColor: colors.border },

    // Class summary (detail view)
    classSummaryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16, borderWidth: 1,
      borderColor: colors.border, marginBottom: 16,
      overflow: 'hidden',
    },
    classSummaryHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', padding: 16,
    },
    classSummaryTitle: {
      fontSize: 16, fontFamily: 'Poppins-Bold', color: colors.text,
    },
    classSummaryExam: {
      fontSize: 12, fontFamily: 'Poppins-Medium',
      color: colors.textSecondary, marginTop: 2,
    },
    classSummaryStats: {
      flexDirection: 'row', justifyContent: 'space-around',
      padding: 12, backgroundColor: colors.inputBackground,
    },
    csStat: { alignItems: 'center', flex: 1 },
    csStatVal: { fontSize: 16, fontFamily: 'Poppins-Bold' },
    csStatLbl: {
      fontSize: 9, fontFamily: 'Poppins-Medium',
      color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase',
    },

    listLabel: {
      fontSize: 11, fontFamily: 'Poppins-SemiBold',
      color: colors.textSecondary, marginBottom: 10,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
  })

  // ── Render: Exam type filter chips ────────────────────────────────────────

  const renderExamFilter = () => {
    if (availableExams.length === 0) return null
    return (
      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Exam Type</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {availableExams.map((exam) => {
            const sel = selectedExamType === exam.examType
            return (
              <TouchableOpacity
                key={exam.examType}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => handleExamTypeSelect(exam.examType)}
              >
                <ThemedText style={[styles.chipText, sel && styles.chipTextSelected]}>
                  {EXAM_TYPE_LABELS[exam.examType] || exam.examTypeLabel}
                </ThemedText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderClassFilter = () => {
    if (!selectedExamType) return null
    const classes = getAvailableClasses()
    if (classes.length === 0) return null
    return (
      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Class</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {classes.map((cls) => {
            const sel = selectedClass === cls
            return (
              <TouchableOpacity
                key={cls}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => handleClassSelect(cls)}
              >
                <ThemedText style={[styles.chipText, sel && styles.chipTextSelected]}>
                  {CLASS_LABELS[cls] || cls}
                </ThemedText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderSectionFilter = () => {
    if (!selectedClass) return null
    const sections = getAvailableSections()
    if (sections.length === 0) return null
    return (
      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Section</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {sections.map((sec) => {
            const sel = selectedSection === sec
            return (
              <TouchableOpacity
                key={sec}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => handleSectionSelect(sec)}
              >
                <ThemedText style={[styles.chipText, sel && styles.chipTextSelected]}>
                  Section {sec}
                </ThemedText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  // ── Render: School overview (exam selected, no class/section) ─────────────

  const renderSchoolOverview = () => {
    const examData = getSelectedExamData()
    const summary = getSchoolSummary()

    if (!examData || !summary) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyMessage}>No data for this exam type</ThemedText>
        </View>
      )
    }

    const gradeEntries = GRADE_DISPLAY_ORDER
      .filter((g) => summary.gradeDistribution[g] > 0)
      .map((g) => ({ grade: g, count: summary.gradeDistribution[g] }))

    return (
      <View>
        {/* Hero pass % card */}
        <LinearGradient
          colors={['#047857', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View>
              <ThemedText style={styles.heroLabel}>School Pass Percentage</ThemedText>
              <ThemedText style={styles.heroExamBadge}>
                {EXAM_TYPE_LABELS[selectedExamType] || selectedExamType}
              </ThemedText>
            </View>
            <ThemedText style={styles.heroBigValue}>{summary.passPercentage}%</ThemedText>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{summary.totalStudentsWithMarks}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Tested</ThemedText>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{summary.totalPass}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Passed</ThemedText>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{summary.totalFail}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Failed</ThemedText>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{summary.avgPercentage}%</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Avg Score</ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Grade distribution */}
        {gradeEntries.length > 0 && (
          <View style={styles.gradeSectionCard}>
            <ThemedText style={styles.sectionTitle}>Grade Distribution</ThemedText>
            <View style={styles.gradeGrid}>
              {gradeEntries.map(({ grade, count }) => {
                const color = getGradeColor(grade)
                const pct =
                  summary.totalStudentsWithMarks > 0
                    ? ((count / summary.totalStudentsWithMarks) * 100).toFixed(1)
                    : '0'
                return (
                  <View
                    key={grade}
                    style={[styles.gradeBox, { backgroundColor: color + '18', borderColor: color + '35' }]}
                  >
                    <View style={[styles.gradeDot, { backgroundColor: color }]}>
                      <ThemedText style={styles.gradeDotText}>{grade}</ThemedText>
                    </View>
                    <ThemedText style={[styles.gradeCount, { color }]}>{count}</ThemedText>
                    <ThemedText style={styles.gradePercent}>{pct}%</ThemedText>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Class-wise breakdown */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>Class-wise Breakdown</ThemedText>
          <ThemedText style={styles.sectionHint}>Tap class → section for details</ThemedText>
        </View>

        {examData.classSections.map((cs, idx) => {
          const sum = cs.summary
          const passColor =
            sum.passPercentage >= 75 ? '#10b981' : sum.passPercentage >= 50 ? '#f59e0b' : '#ef4444'
          const avgColor =
            sum.averagePercentage >= 75 ? '#10b981' : sum.averagePercentage >= 50 ? '#f59e0b' : '#ef4444'

          return (
            <View key={idx} style={styles.classCard}>
              <View style={styles.classCardHeader}>
                <View style={styles.classCardLeft}>
                  <ThemedText style={styles.classCardTitle}>{cs.classLabel}</ThemedText>
                  <View style={[styles.secBadge, { backgroundColor: colors.primary + '15' }]}>
                    <ThemedText style={[styles.secBadgeText, { color: colors.primary }]}>
                      Sec {cs.section}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.passBadge, { backgroundColor: passColor + '18' }]}>
                  <ThemedText style={[styles.passBadgeText, { color: passColor }]}>
                    {sum.passPercentage}% Pass
                  </ThemedText>
                </View>
              </View>
              <View style={styles.classStatsStrip}>
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: colors.primary }]}>
                    {sum.studentsWithMarks}/{sum.totalStudents}
                  </ThemedText>
                  <ThemedText style={styles.classStatLbl}>Students</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: avgColor }]}>
                    {sum.averagePercentage}%
                  </ThemedText>
                  <ThemedText style={styles.classStatLbl}>Avg Score</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: colors.text }]}>
                    {sum.averageMarks}
                  </ThemedText>
                  <ThemedText style={styles.classStatLbl}>Avg Marks</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: '#ef4444' }]}>
                    {sum.resultDistribution?.FAIL || 0}
                  </ThemedText>
                  <ThemedText style={styles.classStatLbl}>Failed</ThemedText>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  // ── Render: Class-section detail with student reports ─────────────────────

  const renderClassReport = () => {
    if (classLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading student reports...</ThemedText>
        </View>
      )
    }
    if (!classStudents) return null

    const { students, summary } = classStudents

    // Correct weighted average: total obtained across all students / total maximum
    const avgPct =
      summary.classTotalMaximum > 0
        ? ((summary.classTotalObtained / summary.classTotalMaximum) * 100).toFixed(1)
        : '0.0'

    const withMarks = students.filter((s) => s.hasMarks)
    const passCount = withMarks.filter((s) => s.overallResult === 'PASS').length
    const failCount = withMarks.filter((s) => s.overallResult === 'FAIL').length
    const passPercentage =
      withMarks.length > 0
        ? ((passCount / withMarks.length) * 100).toFixed(1)
        : '0.0'
    const passColor =
      parseFloat(passPercentage) >= 75
        ? '#10b981'
        : parseFloat(passPercentage) >= 50
        ? '#f59e0b'
        : '#ef4444'

    return (
      <View>
        {/* Class summary card */}
        <View style={styles.classSummaryCard}>
          <View style={styles.classSummaryHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.classSummaryTitle}>
                {CLASS_LABELS[selectedClass]} — Section {selectedSection}
              </ThemedText>
              <ThemedText style={styles.classSummaryExam}>
                {EXAM_TYPE_LABELS[selectedExamType] || selectedExamType}
              </ThemedText>
            </View>
            <View style={[styles.passBadge, { backgroundColor: passColor + '18' }]}>
              <ThemedText style={[styles.passBadgeText, { color: passColor }]}>
                {passPercentage}% Pass
              </ThemedText>
            </View>
          </View>
          <View style={styles.classSummaryStats}>
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: colors.primary }]}>
                {summary.withMarks}/{summary.totalStudents}
              </ThemedText>
              <ThemedText style={styles.csStatLbl}>Marked</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: '#10b981' }]}>{passCount}</ThemedText>
              <ThemedText style={styles.csStatLbl}>Passed</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: '#ef4444' }]}>{failCount}</ThemedText>
              <ThemedText style={styles.csStatLbl}>Failed</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: colors.text }]}>{avgPct}%</ThemedText>
              <ThemedText style={styles.csStatLbl}>Class Avg</ThemedText>
            </View>
          </View>
        </View>

        {/* Students list */}
        <ThemedText style={styles.listLabel}>
          All Students ({summary.totalStudents})
        </ThemedText>

        {students.map((student) => (
          <StudentReportCard
            key={student.id}
            student={student}
            colors={colors}
            selectedClass={selectedClass}
            selectedSection={selectedSection}
            onPressViewFull={handleStudentPress}
          />
        ))}
      </View>
    )
  }

  // ── Render: Main content ──────────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading marks data...</ThemedText>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={50} color="#dc2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )
    }

    if (!selectedExamType) {
      if (availableExams.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={70} color={colors.textSecondary + '60'} />
            <ThemedText style={styles.emptyTitle}>No Data Available</ThemedText>
            <ThemedText style={styles.emptyMessage}>
              No marks records found in the system
            </ThemedText>
          </View>
        )
      }
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="filter-outline" size={60} color={colors.textSecondary + '80'} />
          <ThemedText style={styles.emptyTitle}>Select Exam Type</ThemedText>
          <ThemedText style={styles.emptyMessage}>
            Choose an exam type above to view the school marks report
          </ThemedText>
        </View>
      )
    }

    if (selectedExamType && selectedClass && selectedSection) {
      return renderClassReport()
    }

    if (selectedExamType && selectedClass) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={60} color={colors.textSecondary + '80'} />
          <ThemedText style={styles.emptyTitle}>Select Section</ThemedText>
          <ThemedText style={styles.emptyMessage}>
            Choose a section to view student-wise marks
          </ThemedText>
        </View>
      )
    }

    return renderSchoolOverview()
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          {/* Header */}
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.headerTitle}>Marks Report</ThemedText>
                  <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                    {getHeaderSubtitle()}
                  </ThemedText>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Filters (hidden when searching) */}
          {!isSearching && (
            <View style={styles.filtersWrapper}>
              {renderExamFilter()}
              {renderClassFilter()}
              {renderSectionFilter()}
            </View>
          )}

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
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
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {isSearching && debouncedSearchQuery ? (
            <ThemedText style={styles.searchInfoText}>
              Found {searchResults.length} {searchResults.length === 1 ? 'student' : 'students'} for "{debouncedSearchQuery}"
            </ThemedText>
          ) : null}

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            onTouchStart={() => { if (!isSearchFocused) Keyboard.dismiss() }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator
          >
            {isSearching ? (
              searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onPress={handleSearchStudentPress}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <ThemedText style={[styles.emptyMessage, { marginTop: 12 }]}>
                    No students found matching "{debouncedSearchQuery}"
                  </ThemedText>
                </View>
              )
            ) : (
              renderContent()
            )}
          </ScrollView>

          <ToastNotification
            visible={!!toast}
            type={toast?.type}
            message={toast?.message}
            onHide={hideToast}
            position="bottom-center"
            duration={toast?.duration || 3000}
            showCloseButton
          />
        </View>
      </Modal>

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
