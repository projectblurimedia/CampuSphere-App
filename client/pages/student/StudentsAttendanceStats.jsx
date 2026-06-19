import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import StudentCard from '@/components/students/student-card'
import StudentAttendance from '@/pages/student/StudentAttendance'
import { useDebounce } from '@/utils/useDebounce'

// ─── Module-level constants ────────────────────────────────────────────────────

const CLASS_ORDER = [
  'PRE_NURSERY', 'NURSERY', 'LKG', 'UKG',
  'CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5',
  'CLASS_6', 'CLASS_7', 'CLASS_8', 'CLASS_9', 'CLASS_10',
]
const CLASS_LABELS = {
  PRE_NURSERY: 'Pre-Nursery', NURSERY: 'Nursery', LKG: 'LKG', UKG: 'UKG',
  CLASS_1: 'Class 1', CLASS_2: 'Class 2', CLASS_3: 'Class 3', CLASS_4: 'Class 4',
  CLASS_5: 'Class 5', CLASS_6: 'Class 6', CLASS_7: 'Class 7', CLASS_8: 'Class 8',
  CLASS_9: 'Class 9', CLASS_10: 'Class 10',
}
const RANK_COLORS = {
  1: { bg: '#F59E0B', text: '#FFFFFF' },
  2: { bg: '#6B7280', text: '#FFFFFF' },
  3: { bg: '#B45309', text: '#FFFFFF' },
}

// ─── Helper functions ──────────────────────────────────────────────────────────

const getAttColor = (pct) => {
  const p = parseFloat(pct)
  if (p >= 90) return '#10b981'
  if (p >= 75) return '#3b82f6'
  if (p >= 60) return '#f59e0b'
  return '#ef4444'
}

const assignAttRanks = (students) => {
  const sorted = [...students].sort((a, b) => b.attendancePercentage - a.attendancePercentage)
  let currentRank = 1
  return sorted.map((s, i) => {
    if (i > 0 && s.attendancePercentage < sorted[i - 1].attendancePercentage) currentRank++
    return { ...s, rank: currentRank }
  })
}

const assignClassRanks = (classes) => {
  const sorted = [...classes].sort((a, b) =>
    b.summary.overallAttendancePercentage - a.summary.overallAttendancePercentage
  )
  let currentRank = 1
  return sorted.map((cs, i) => {
    if (i > 0 && cs.summary.overallAttendancePercentage < sorted[i - 1].summary.overallAttendancePercentage) currentRank++
    return { ...cs, rank: currentRank }
  })
}

// ─── Ranked Student Card ───────────────────────────────────────────────────────

function RankedAttendanceCard({ student, colors, onPress }) {
  const rankMeta = RANK_COLORS[student.rank] || null
  const attColor = getAttColor(student.attendancePercentage)
  const pctWidth = Math.min(student.attendancePercentage || 0, 100)
  const badgeBg = rankMeta ? rankMeta.bg : colors.inputBackground
  const badgeText = rankMeta ? rankMeta.text : colors.text

  return (
    <View style={[
      raStyles.card,
      { backgroundColor: colors.cardBackground, borderColor: rankMeta ? rankMeta.bg + '55' : colors.border },
    ]}>
      {rankMeta && (
        <LinearGradient
          colors={[rankMeta.bg, rankMeta.bg + 'CC']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 3 }}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <View style={[raStyles.rankBadge, { backgroundColor: badgeBg }]}>
          <ThemedText style={[raStyles.rankBadgeText, { color: badgeText }]}>#{student.rank}</ThemedText>
        </View>
        <View style={[raStyles.avatar, { backgroundColor: attColor + '20', borderColor: attColor }]}>
          <ThemedText style={[raStyles.avatarText, { color: attColor }]}>
            {(student.name?.[0] || '?').toUpperCase()}
          </ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text }} numberOfLines={1}>
            {student.name}
          </ThemedText>
          <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
            Roll: {student.rollNo || 'N/A'}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={() => onPress(student)} style={{ alignItems: 'flex-end' }}>
          <ThemedText style={{ fontSize: 22, fontFamily: 'Poppins-Bold', color: attColor }}>
            {student.attendancePercentage?.toFixed(1)}%
          </ThemedText>
          <ThemedText style={{ fontSize: 10, color: colors.primary, fontFamily: 'Poppins-Medium' }}>View Detail</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
        <View style={{ height: 7, backgroundColor: colors.inputBackground, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${pctWidth}%`, height: 7, backgroundColor: attColor, borderRadius: 4 }} />
        </View>
      </View>

      <View style={[raStyles.statsRow, { backgroundColor: colors.inputBackground }]}>
        <View style={raStyles.statItem}>
          <ThemedText style={[raStyles.statVal, { color: '#10b981' }]}>{student.presentCount}</ThemedText>
          <ThemedText style={raStyles.statLbl}>Present</ThemedText>
        </View>
        <View style={raStyles.statDiv} />
        <View style={raStyles.statItem}>
          <ThemedText style={[raStyles.statVal, { color: '#ef4444' }]}>{student.absentCount}</ThemedText>
          <ThemedText style={raStyles.statLbl}>Absent</ThemedText>
        </View>
        <View style={raStyles.statDiv} />
        <View style={raStyles.statItem}>
          <ThemedText style={[raStyles.statVal, { color: '#6b7280' }]}>{student.attendanceCount}</ThemedText>
          <ThemedText style={raStyles.statLbl}>Total Days</ThemedText>
        </View>
      </View>
    </View>
  )
}

const raStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  rankBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rankBadgeText: { fontSize: 12, fontFamily: 'Poppins-Bold' },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  avatarText: { fontSize: 16, fontFamily: 'Poppins-Bold' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8 },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 14, fontFamily: 'Poppins-Bold' },
  statLbl: { fontSize: 9, color: '#9ca3af', fontFamily: 'Poppins-Medium', marginTop: 1, textTransform: 'uppercase' },
  statDiv: { width: 1, height: 24, backgroundColor: '#e5e7eb' },
})

// ─── No Attendance Card ────────────────────────────────────────────────────────

function NoAttendanceCard({ student, colors }) {
  return (
    <View style={[raStyles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, padding: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[raStyles.avatar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <ThemedText style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Poppins-Bold' }}>
            {(student.name?.[0] || '?').toUpperCase()}
          </ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text }}>{student.name}</ThemedText>
          <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Roll: {student.rollNo || 'N/A'}</ThemedText>
        </View>
        <View style={{ backgroundColor: '#f59e0b20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <ThemedText style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'Poppins-SemiBold' }}>No Data</ThemedText>
        </View>
      </View>
    </View>
  )
}

// ─── Attendance Podium ─────────────────────────────────────────────────────────

function AttendancePodium({ rankedStudents, colors }) {
  const top3 = rankedStudents.slice(0, 3)
  if (top3.length === 0) return null
  const order = [top3[1], top3[0], top3[2]].filter(Boolean)
  const heights = { 1: 88, 2: 72, 3: 60 }

  return (
    <View style={podStyles.container}>
      <ThemedText style={[podStyles.title, { color: colors.text }]}>🏆 Top Attendance</ThemedText>
      <View style={podStyles.row}>
        {order.map((student) => {
          const meta = RANK_COLORS[student.rank] || RANK_COLORS[3]
          const attColor = getAttColor(student.attendancePercentage)
          const barH = heights[student.rank] || 60
          return (
            <View key={student.id} style={podStyles.podiumItem}>
              <View style={[podStyles.avatar, { backgroundColor: meta.bg + '20', borderColor: meta.bg }]}>
                <ThemedText style={[podStyles.avatarInitial, { color: meta.bg }]}>
                  {(student.name?.[0] || '?').toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText style={[podStyles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {student.name?.split(' ')[0]}
              </ThemedText>
              <ThemedText style={[podStyles.podiumDays, { color: colors.textSecondary }]}>
                {student.presentCount}/{student.attendanceCount}d
              </ThemedText>
              <ThemedText style={[podStyles.podiumPct, { color: attColor }]}>
                {student.attendancePercentage?.toFixed(1)}%
              </ThemedText>
              <LinearGradient
                colors={[meta.bg, meta.bg + 'AA']}
                style={[podStyles.bar, { height: barH }]}
              >
                <ThemedText style={podStyles.barEmoji}>
                  {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉'}
                </ThemedText>
              </LinearGradient>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const podStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 15, fontFamily: 'Poppins-Bold', marginBottom: 14, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 10 },
  podiumItem: { alignItems: 'center', width: 100 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 4 },
  avatarInitial: { fontSize: 20, fontFamily: 'Poppins-Bold' },
  podiumName: { fontSize: 12, fontFamily: 'Poppins-SemiBold', textAlign: 'center', marginBottom: 1 },
  podiumDays: { fontSize: 10, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  podiumPct: { fontSize: 12, fontFamily: 'Poppins-Bold', textAlign: 'center', marginBottom: 6 },
  bar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 8 },
  barEmoji: { fontSize: 20 },
})

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StudentsAttendanceStats({ visible, onClose }) {
  const { colors } = useTheme()
  const scrollViewRef = useRef(null)
  const searchInputRef = useRef(null)

  const [stats, setStats] = useState([])
  const [schoolSummary, setSchoolSummary] = useState(null)
  const [dateRange, setDateRange] = useState(null)

  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [sortOrder, setSortOrder] = useState('high')
  const [viewMode, setViewMode] = useState('all')

  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentAttendance, setShowStudentAttendance] = useState(false)

  const showToast = (message, type = 'error', duration = 3000) => setToast({ message, type, duration })
  const hideToast = () => setToast(null)

  // ── API ─────────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const res = await axiosApi.get('/students/attendance-stats')
      if (res.data.success) {
        setStats(res.data.data?.classes || [])
        setSchoolSummary(res.data.data?.schoolSummary || null)
        setDateRange(res.data.data?.dateRange || null)
      } else throw new Error(res.data.message || 'Failed to fetch statistics')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load statistics'
      setError(msg); showToast(msg, 'error')
    } finally {
      if (showLoading) setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  const searchStudents = useCallback(async (query) => {
    if (!query.trim()) { setSearchResults([]); setIsSearching(false); return }
    setSearchLoading(true); setIsSearching(true)
    try {
      const res = await axiosApi.get('/students/quick-search', { params: { query, limit: 50 } })
      if (res.data.success) setSearchResults(res.data.data)
    } catch { showToast('Failed to search students', 'error'); setSearchResults([]) }
    finally { setSearchLoading(false) }
  }, [])

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (debouncedSearchQuery) searchStudents(debouncedSearchQuery)
    else { setSearchResults([]); setIsSearching(false) }
  }, [debouncedSearchQuery, searchStudents])

  useEffect(() => {
    if (visible) {
      fetchStats()
      setSelectedClass(null); setSelectedSection(null)
      setSearchQuery(''); setSortOrder('high'); setViewMode('all')
    }
  }, [visible])

  useEffect(() => {
    setSortOrder('high'); setViewMode('all')
    if (!selectedClass) setSelectedSection(null)
  }, [selectedClass])

  // ── Filter handlers ──────────────────────────────────────────────────────────

  const handleClassSelect = (cls) => {
    setSelectedClass(p => p === cls ? null : cls)
    setSelectedSection(null)
  }
  const handleSectionSelect = (sec) => setSelectedSection(p => p === sec ? null : sec)

  // ── Derived data ─────────────────────────────────────────────────────────────

  const availableClasses = useMemo(() => {
    if (!stats.length) return []
    return [...new Set(stats.map(s => s.class))].sort((a, b) => CLASS_ORDER.indexOf(a) - CLASS_ORDER.indexOf(b))
  }, [stats])

  const availableSections = useMemo(() => {
    if (!stats.length || !selectedClass) return []
    return stats.filter(s => s.class === selectedClass).map(s => s.section).sort()
  }, [stats, selectedClass])

  const classData = useMemo(() => {
    if (!selectedClass || !selectedSection) return null
    return stats.find(s => s.class === selectedClass && s.section === selectedSection) || null
  }, [stats, selectedClass, selectedSection])

  const classRankings = useMemo(() => {
    if (!stats.length) return []
    return assignClassRanks(stats)
  }, [stats])

  const rankedStudents = useMemo(() => {
    if (!classData?.students) return []
    // Only rank students with real session data (present or absent > 0); null-only records are treated as not uploaded
    const withAtt = classData.students.filter(s => s.hasAttendance && (s.presentCount > 0 || s.absentCount > 0))
    const ranked = assignAttRanks(withAtt)
    return sortOrder === 'high' ? ranked : [...ranked].sort((a, b) => a.attendancePercentage - b.attendancePercentage)
  }, [classData, sortOrder])

  const studentsWithoutAttendance = useMemo(() => {
    if (!classData?.students) return []
    return classData.students.filter(s => !s.hasAttendance || (s.presentCount === 0 && s.absentCount === 0))
  }, [classData])

  const isClassView = !!(selectedClass && selectedSection)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleStudentPress = (student) => {
    setSelectedStudent(student)
    setShowStudentAttendance(true)
  }

  const handleCloseStudentModal = () => {
    setShowStudentAttendance(false)
    setSelectedStudent(null)
  }

  const handleClearSearch = () => {
    setSearchQuery(''); setSearchResults([]); setIsSearching(false)
    searchInputRef.current?.focus()
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true); fetchStats(false)
  }, [fetchStats])

  const getHeaderSubtitle = () => {
    if (isSearching) return 'Search Results'
    if (selectedClass && selectedSection)
      return `${CLASS_LABELS[selectedClass]} — Sec ${selectedSection}`
    if (selectedClass) return CLASS_LABELS[selectedClass] || selectedClass
    return 'Class-wise attendance overview'
  }

  // ── Dynamic styles ────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 16, paddingHorizontal: 20,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: {
      width: 44, height: 44, borderRadius: 22,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    },
    headerTitle: { fontSize: 18, color: '#FFF', fontFamily: 'Poppins-SemiBold' },
    headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    filtersWrapper: {
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    },
    filterBlock: { marginBottom: 10 },
    filterLabel: {
      fontSize: 10, fontFamily: 'Poppins-SemiBold', color: colors.textSecondary,
      marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.inputBackground,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.text },
    chipTextSelected: { color: '#FFF' },

    filterToggleBtn: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground,
    },
    filterToggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterToggleText: { fontSize: 11, fontFamily: 'Poppins-Medium', color: colors.textSecondary },
    filterToggleTextActive: { color: '#FFF', fontFamily: 'Poppins-SemiBold' },
    filterDivider: { width: 1, height: 28, backgroundColor: colors.border },

    searchContainer: { marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', height: 44,
      paddingHorizontal: 14, borderRadius: 22,
      backgroundColor: colors.cardBackground,
      borderWidth: isSearchFocused ? 2 : 1,
      borderColor: isSearchFocused ? colors.primary : colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 8, color: colors.text },
    searchInfoText: {
      fontSize: 12, color: colors.textSecondary,
      marginHorizontal: 16, marginBottom: 8, fontStyle: 'italic',
    },

    scrollView: { flex: 1 },
    scrollContent: { padding: 8, paddingBottom: 40 },

    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    errorText: { textAlign: 'center', color: '#dc2626', marginTop: 12, fontSize: 14 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 20 },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: colors.text, marginTop: 16, marginBottom: 8 },
    emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    heroCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins-Medium' },
    heroSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
    heroBigValue: { fontSize: 46, color: '#FFF', fontFamily: 'Poppins-Bold', lineHeight: 52 },
    heroStatsRow: {
      flexDirection: 'row', justifyContent: 'space-around',
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 14,
    },
    heroStat: { alignItems: 'center', flex: 1 },
    heroStatVal: { fontSize: 18, color: '#FFF', fontFamily: 'Poppins-Bold' },
    heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: 'Poppins-Medium', marginTop: 2 },
    heroStatDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center' },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text },
    sectionHint: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Poppins-Medium' },

    classRankCard: {
      borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 14, overflow: 'hidden',
    },
    rankBadgeSmall: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    rankBadgeSmallText: { fontSize: 11, fontFamily: 'Poppins-Bold' },
    classCardTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold' },
    secBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    secBadgeText: { fontSize: 11, fontFamily: 'Poppins-Medium' },
    classStatsStrip: { flexDirection: 'row', justifyContent: 'space-around', padding: 8, borderRadius: 8, marginTop: 8 },
    classStat: { alignItems: 'center', flex: 1 },
    classStatVal: { fontSize: 14, fontFamily: 'Poppins-Bold' },
    classStatLbl: { fontSize: 9, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase' },
    divider: { width: 1, height: 28, alignSelf: 'center', backgroundColor: colors.border },

    classSummaryCard: {
      borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden',
      margin: 8,
    },
    classSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 },
    classSummaryTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: colors.text },
    classSummaryExam: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2 },
    classSummaryStats: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
    csStat: { alignItems: 'center', flex: 1 },
    csStatVal: { fontSize: 16, fontFamily: 'Poppins-Bold' },
    csStatLbl: { fontSize: 9, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase' },
    passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    passBadgeText: { fontSize: 12, fontFamily: 'Poppins-SemiBold' },

    listLabel: {
      fontSize: 11, fontFamily: 'Poppins-SemiBold', color: colors.textSecondary,
      marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    noMarksDivider: { marginTop: 16, marginBottom: 10 },
    noMarksDividerLine: { height: 1, backgroundColor: colors.border },
    noMarksDividerText: {
      fontSize: 11, fontFamily: 'Poppins-SemiBold', color: colors.textSecondary,
      textAlign: 'center', marginTop: 8, marginBottom: 6, textTransform: 'uppercase',
    },
  })

  // ── School overview ──────────────────────────────────────────────────────────

  const renderSchoolOverview = () => {
    if (!schoolSummary) return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={70} color={colors.textSecondary + '60'} />
        <ThemedText style={styles.emptyTitle}>No Data Available</ThemedText>
        <ThemedText style={styles.emptyMessage}>No attendance records found in the system</ThemedText>
      </View>
    )

    return (
      <View>
        <LinearGradient colors={['#0369a1', '#0ea5e9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <ThemedText style={styles.heroLabel}>School Attendance</ThemedText>
              {dateRange && (
                <ThemedText style={styles.heroSubLabel}>
                  {dateRange.from} — {dateRange.to}
                </ThemedText>
              )}
            </View>
            <ThemedText style={styles.heroBigValue}>{schoolSummary.overallAttendancePercentage}%</ThemedText>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{schoolSummary.totalStudents}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Students</ThemedText>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{schoolSummary.totalPresent}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Present</ThemedText>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{schoolSummary.totalAbsent}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Absent</ThemedText>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <ThemedText style={styles.heroStatVal}>{dateRange?.totalWorkingDays ?? '—'}</ThemedText>
              <ThemedText style={styles.heroStatLbl}>Working Days</ThemedText>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>Class-wise Ranking</ThemedText>
          <ThemedText style={styles.sectionHint}>Select class for details</ThemedText>
        </View>

        {classRankings.map((cs, idx) => {
          const attColor = getAttColor(cs.summary.overallAttendancePercentage)
          const rankMeta = RANK_COLORS[cs.rank]
          const pctWidth = Math.min(cs.summary.overallAttendancePercentage || 0, 100)
          return (
            <View key={idx} style={[styles.classRankCard, { backgroundColor: colors.cardBackground, borderColor: rankMeta ? rankMeta.bg + '40' : colors.border }]}>
              {rankMeta && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: rankMeta.bg }} />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={[styles.rankBadgeSmall, { backgroundColor: rankMeta ? rankMeta.bg : colors.inputBackground }]}>
                  <ThemedText style={[styles.rankBadgeSmallText, { color: rankMeta ? rankMeta.text : colors.text }]}>
                    #{cs.rank}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText style={[styles.classCardTitle, { color: colors.text }]}>{cs.classLabel}</ThemedText>
                    <View style={[styles.secBadge, { backgroundColor: colors.primary + '15' }]}>
                      <ThemedText style={[styles.secBadgeText, { color: colors.primary }]}>Sec {cs.section}</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    {cs.summary.studentsWithAttendance}/{cs.summary.totalStudents} students tracked
                  </ThemedText>
                </View>
                <ThemedText style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: attColor }}>
                  {cs.summary.overallAttendancePercentage}%
                </ThemedText>
              </View>

              <View style={{ height: 8, backgroundColor: colors.inputBackground, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <View style={{ width: `${pctWidth}%`, height: 8, backgroundColor: attColor, borderRadius: 4 }} />
              </View>

              <View style={[styles.classStatsStrip, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: '#10b981' }]}>{cs.summary.totalPresent}</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Present</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: '#ef4444' }]}>{cs.summary.totalAbsent}</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Absent</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: colors.text }]}>{cs.summary.totalStudents}</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Students</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: colors.primary }]}>{cs.summary.averageDailyAttendance}%</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Daily Avg</ThemedText>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  // ── Class report ─────────────────────────────────────────────────────────────

  const renderClassReport = () => {
    if (!classData) return null

    const { summary } = classData
    const classAttColor = getAttColor(summary.overallAttendancePercentage)
    const hasAnyData = rankedStudents.length > 0

    const listStudents = viewMode === 'concern'
      ? [...rankedStudents].sort((a, b) => a.attendancePercentage - b.attendancePercentage)
      : viewMode === 'best'
        ? [...rankedStudents].sort((a, b) => b.attendancePercentage - a.attendancePercentage)
        : rankedStudents

    return (
      <View>
        {/* Class summary card */}
        <View style={[styles.classSummaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.classSummaryHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.classSummaryTitle}>
                {CLASS_LABELS[selectedClass]} — Section {selectedSection}
              </ThemedText>
              {dateRange && (
                <ThemedText style={styles.classSummaryExam}>{dateRange.from} — {dateRange.to}</ThemedText>
              )}
            </View>
            <View style={[styles.passBadge, { backgroundColor: (hasAnyData ? classAttColor : '#f59e0b') + '18' }]}>
              <ThemedText style={[styles.passBadgeText, { color: hasAnyData ? classAttColor : '#f59e0b' }]}>
                {hasAnyData ? `${summary.overallAttendancePercentage}%` : 'Not Uploaded'}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.classSummaryStats, { backgroundColor: colors.inputBackground }]}>
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: colors.primary }]}>{summary.studentsWithAttendance}/{summary.totalStudents}</ThemedText>
              <ThemedText style={styles.csStatLbl}>Tracked</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: '#10b981' }]}>{summary.totalPresent}</ThemedText>
              <ThemedText style={styles.csStatLbl}>Present</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: '#ef4444' }]}>{summary.totalAbsent}</ThemedText>
              <ThemedText style={styles.csStatLbl}>Absent</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: colors.text }]}>{summary.totalAttendanceRecords}</ThemedText>
              <ThemedText style={styles.csStatLbl}>Records</ThemedText>
            </View>
          </View>
        </View>

        {/* No data — show "Not Uploaded" with all students listed */}
        {!hasAnyData ? (
          <View>
            <View style={styles.emptyContainer}>
              <Ionicons name="cloud-upload-outline" size={60} color="#f59e0b80" />
              <ThemedText style={[styles.emptyTitle, { color: '#f59e0b' }]}>Attendance Not Uploaded</ThemedText>
              <ThemedText style={styles.emptyMessage}>
                No attendance has been uploaded for {CLASS_LABELS[selectedClass]} — Section {selectedSection}.
              </ThemedText>
            </View>
            <View style={styles.noMarksDivider}>
              <View style={styles.noMarksDividerLine} />
              <ThemedText style={styles.noMarksDividerText}>
                {summary.totalStudents} Students Registered
              </ThemedText>
              {studentsWithoutAttendance.map((student) => (
                <NoAttendanceCard key={student.id} student={student} colors={colors} />
              ))}
            </View>
          </View>
        ) : (
          <>
            {viewMode === 'all' && sortOrder === 'high' && rankedStudents.length >= 1 && (
              <AttendancePodium rankedStudents={rankedStudents} colors={colors} />
            )}

            <ThemedText style={styles.listLabel}>
              {viewMode === 'best'
                ? `Best Attendance (${listStudents.length})`
                : viewMode === 'concern'
                  ? `Needs Attention (${listStudents.length})`
                  : `All Students (${summary.totalStudents}) · Ranked by Attendance`}
            </ThemedText>

            {listStudents.map((student) => (
              <RankedAttendanceCard
                key={student.id}
                student={student}
                colors={colors}
                onPress={handleStudentPress}
              />
            ))}

            {viewMode === 'all' && studentsWithoutAttendance.length > 0 && (
              <View style={styles.noMarksDivider}>
                <View style={styles.noMarksDividerLine} />
                <ThemedText style={styles.noMarksDividerText}>
                  No Attendance Data ({studentsWithoutAttendance.length})
                </ThemedText>
                {studentsWithoutAttendance.map((student) => (
                  <NoAttendanceCard key={student.id} student={student} colors={colors} />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    )
  }

  // ── Main content ─────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading attendance data...</ThemedText>
      </View>
    )
    if (error) return (
      <View style={styles.errorContainer}>
        <Feather name="alert-triangle" size={50} color="#dc2626" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </View>
    )
    if (!stats.length) return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={70} color={colors.textSecondary + '60'} />
        <ThemedText style={styles.emptyTitle}>No Data Available</ThemedText>
        <ThemedText style={styles.emptyMessage}>No attendance records found in the system</ThemedText>
      </View>
    )
    if (selectedClass && selectedSection) return renderClassReport()
    if (selectedClass) return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={60} color={colors.textSecondary + '80'} />
        <ThemedText style={styles.emptyTitle}>Select Section</ThemedText>
        <ThemedText style={styles.emptyMessage}>Choose a section to view student-wise attendance</ThemedText>
      </View>
    )
    return renderSchoolOverview()
  }

  // ── Return ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.headerTitle}>Attendance Report</ThemedText>
                  <ThemedText style={styles.headerSubtitle} numberOfLines={1}>{getHeaderSubtitle()}</ThemedText>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

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
                <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {!isSearching && (
              <View style={styles.filtersWrapper}>
                {availableClasses.length > 0 && (
                  <View style={styles.filterBlock}>
                    <ThemedText style={styles.filterLabel}>Class</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      {availableClasses.map((cls) => {
                        const sel = selectedClass === cls
                        return (
                          <TouchableOpacity key={cls} style={[styles.chip, sel && styles.chipSelected]} onPress={() => handleClassSelect(cls)}>
                            <ThemedText style={[styles.chipText, sel && styles.chipTextSelected]}>{CLASS_LABELS[cls] || cls}</ThemedText>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                )}
                {selectedClass && availableSections.length > 0 && (
                  <View style={styles.filterBlock}>
                    <ThemedText style={styles.filterLabel}>Section</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      {availableSections.map((sec) => {
                        const sel = selectedSection === sec
                        return (
                          <TouchableOpacity key={sec} style={[styles.chip, sel && styles.chipSelected]} onPress={() => handleSectionSelect(sec)}>
                            <ThemedText style={[styles.chipText, sel && styles.chipTextSelected]}>Section {sec}</ThemedText>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                )}
                {isClassView && (
                  <View style={[styles.filterBlock, { marginBottom: 0 }]}>
                    <ThemedText style={styles.filterLabel}>Sort & View</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      <TouchableOpacity style={[styles.chip, sortOrder === 'high' && styles.chipSelected]} onPress={() => setSortOrder('high')}>
                        <ThemedText style={[styles.chipText, sortOrder === 'high' && styles.chipTextSelected]}>↑ High First</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, sortOrder === 'low' && styles.chipSelected]} onPress={() => setSortOrder('low')}>
                        <ThemedText style={[styles.chipText, sortOrder === 'low' && styles.chipTextSelected]}>↓ Low First</ThemedText>
                      </TouchableOpacity>
                      <View style={{ width: 1, height: 26, backgroundColor: colors.border, alignSelf: 'center', marginHorizontal: 4 }} />
                      <TouchableOpacity style={[styles.chip, viewMode === 'all' && styles.chipSelected]} onPress={() => setViewMode('all')}>
                        <ThemedText style={[styles.chipText, viewMode === 'all' && styles.chipTextSelected]}>All</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, viewMode === 'best' && styles.chipSelected]} onPress={() => setViewMode('best')}>
                        <ThemedText style={[styles.chipText, viewMode === 'best' && styles.chipTextSelected]}>⭐ Best</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, viewMode === 'concern' && styles.chipSelected]} onPress={() => setViewMode('concern')}>
                        <ThemedText style={[styles.chipText, viewMode === 'concern' && styles.chipTextSelected]}>🔴 Concern</ThemedText>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            {isSearching ? (
              searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <StudentCard key={student.id} student={student} onPress={handleStudentPress} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <ThemedText style={[styles.emptyMessage, { marginTop: 12 }]}>
                    No students found for "{debouncedSearchQuery}"
                  </ThemedText>
                </View>
              )
            ) : renderContent()}
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
        <StudentAttendance
          visible={showStudentAttendance}
          onClose={handleCloseStudentModal}
          student={selectedStudent}
        />
      )}
    </>
  )
}
