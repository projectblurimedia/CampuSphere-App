import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  FORMATIVE_1: 'Formative 1', FORMATIVE_2: 'Formative 2', FORMATIVE_3: 'Formative 3',
  SUMMATIVE_1: 'Summative 1', SUMMATIVE_2: 'Summative 2',
  PRE_FINAL_1: 'Pre-Final 1', PRE_FINAL_2: 'Pre-Final 2', PRE_FINAL_3: 'Pre-Final 3',
  FINAL: 'Final',
}

const SUBJECT_LABELS = {
  TELUGU: 'Telugu', MATHEMATICS: 'Mathematics', SCIENCE: 'Science',
  ENGLISH: 'English', HINDI: 'Hindi', SOCIAL: 'Social Studies',
  COMPUTERS: 'Computers', PHYSICS: 'Physics', BIOLOGY: 'Biology',
}

const SUBJECT_ICONS = {
  TELUGU: 'language', MATHEMATICS: 'calculate', SCIENCE: 'science',
  ENGLISH: 'menu-book', HINDI: 'translate', SOCIAL: 'public',
  COMPUTERS: 'computer', PHYSICS: 'bolt', BIOLOGY: 'eco',
}

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

const GRADE_DISPLAY_ORDER = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F']

const RANK_COLORS = {
  1: { bg: '#F59E0B', text: '#FFFFFF', glow: '#F59E0B40', label: '🥇 1st' },
  2: { bg: '#6B7280', text: '#FFFFFF', glow: '#6B728040', label: '🥈 2nd' },
  3: { bg: '#B45309', text: '#FFFFFF', glow: '#B4530940', label: '🥉 3rd' },
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

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

const getPercentageColor = (pct) => {
  const p = parseFloat(pct)
  if (p >= 85) return '#10b981'
  if (p >= 70) return '#3b82f6'
  if (p >= 50) return '#f59e0b'
  if (p >= 33) return '#ef4444'
  return '#dc2626'
}

// Dense ranking: ties share same rank, next rank is immediate next integer (1,1,2,3 not 1,1,3,4)
const assignRanks = (students) => {
  const withMarks = students
    .filter((s) => s.hasMarks)
    .sort((a, b) => b.percentage - a.percentage)

  let currentRank = 1
  return withMarks.map((s, i) => {
    if (i > 0 && s.percentage < withMarks[i - 1].percentage) currentRank++
    return { ...s, rank: currentRank }
  })
}

// Dense ranking by subject percentage
const assignSubjectRanks = (students, ascending = false) => {
  const sorted = [...students].sort((a, b) =>
    ascending ? a.subjectPct - b.subjectPct : b.subjectPct - a.subjectPct
  )
  let currentRank = 1
  return sorted.map((s, i) => {
    if (i > 0 && s.subjectPct !== sorted[i - 1].subjectPct) currentRank++
    return { ...s, subjectRank: currentRank }
  })
}

// ─── RankedStudentCard ────────────────────────────────────────────────────────

function RankedStudentCard({ student, colors, onPressViewFull }) {
  const [expanded, setExpanded] = useState(false)

  const rankMeta = RANK_COLORS[student.rank] || null
  const pctColor = getPercentageColor(student.percentage)
  const resultColor = getResultColor(student.overallResult)
  const gradeColor = getGradeColor(student.overallGrade)
  const subjects = student.marksData ? Object.entries(student.marksData) : []
  const pctWidth = Math.min(student.percentage || 0, 100)

  return (
    <View style={[
      rcStyles.card,
      { borderColor: rankMeta ? rankMeta.bg + '60' : colors.border, backgroundColor: colors.cardBackground },
      rankMeta && { borderWidth: 1.5 }
    ]}>
      {/* Top medal strip for top-3 */}
      {rankMeta && (
        <LinearGradient
          colors={[rankMeta.bg + 'CC', rankMeta.bg + '88']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={rcStyles.medalStrip}
        >
          <ThemedText style={rcStyles.medalText}>{rankMeta.label} Rank</ThemedText>
        </LinearGradient>
      )}

      {/* Main header row */}
      <TouchableOpacity
        style={rcStyles.headerRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.75}
      >
        {/* Rank badge */}
        <View style={[
          rcStyles.rankBadge,
          rankMeta
            ? { backgroundColor: rankMeta.bg }
            : { backgroundColor: colors.primary + '20' }
        ]}>
          <ThemedText style={[
            rcStyles.rankText,
            rankMeta ? { color: '#FFF' } : { color: colors.primary }
          ]}>
            {student.rank || '#'}
          </ThemedText>
        </View>

        {/* Student info + progress bar */}
        <View style={rcStyles.infoBlock}>
          <View style={rcStyles.nameRow}>
            <ThemedText style={[rcStyles.studentName, { color: colors.text }]} numberOfLines={1}>
              {student.fullName}
            </ThemedText>
            <View style={[rcStyles.resultPill, { backgroundColor: resultColor + '20' }]}>
              <ThemedText style={[rcStyles.resultPillText, { color: resultColor }]}>
                {student.overallResult}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[rcStyles.rollText, { color: colors.textSecondary }]}>
            Roll: {student.rollNo || '—'} · {student.totalObtained}/{student.totalMaximum} marks
          </ThemedText>
          {/* Progress bar */}
          <View style={[rcStyles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[rcStyles.progressFill, { width: `${pctWidth}%`, backgroundColor: pctColor }]} />
          </View>
        </View>

        {/* Percentage + grade + chevron */}
        <View style={rcStyles.rightBlock}>
          <ThemedText style={[rcStyles.pctBig, { color: pctColor }]}>
            {student.percentage?.toFixed(1)}%
          </ThemedText>
          <View style={[rcStyles.gradePill, { backgroundColor: gradeColor }]}>
            <ThemedText style={rcStyles.gradePillText}>{formatGrade(student.overallGrade)}</ThemedText>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16} color={colors.textSecondary}
            style={{ marginTop: 4 }}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded: subject table */}
      {expanded && (
        <View style={[rcStyles.subjectTable, { borderTopColor: colors.border }]}>
          {/* Table header */}
          <View style={[rcStyles.tableHeader, { backgroundColor: colors.primary + '12' }]}>
            <ThemedText style={[rcStyles.thSubject, { color: colors.textSecondary }]}>Subject</ThemedText>
            <ThemedText style={[rcStyles.thMarks,   { color: colors.textSecondary }]}>Marks</ThemedText>
            <ThemedText style={[rcStyles.thGrade,   { color: colors.textSecondary }]}>Grade</ThemedText>
            <ThemedText style={[rcStyles.thPct,     { color: colors.textSecondary }]}>%</ThemedText>
            <ThemedText style={[rcStyles.thResult,  { color: colors.textSecondary }]}>Result</ThemedText>
          </View>

          {subjects.map(([key, sub], idx) => {
            const label = SUBJECT_LABELS[key] || key
            const gc = getGradeColor(sub.grade)
            const rc = getResultColor(sub.result)
            const sp = sub.totalMarks > 0 ? ((sub.marks / sub.totalMarks) * 100).toFixed(0) : '0'
            const isEven = idx % 2 === 0

            return (
              <View key={key} style={[
                rcStyles.tableRow,
                { borderTopColor: colors.border, backgroundColor: isEven ? colors.inputBackground + '80' : 'transparent' }
              ]}>
                <View style={rcStyles.thSubjectCell}>
                  <MaterialIcons
                    name={SUBJECT_ICONS[key] || 'book'}
                    size={13} color={gc} style={{ marginRight: 4 }}
                  />
                  <ThemedText style={[rcStyles.tdSubject, { color: colors.text }]} numberOfLines={1}>
                    {label}
                  </ThemedText>
                </View>

                {sub.isAbsent ? (
                  <>
                    <View style={[rcStyles.absentBadge]}>
                      <ThemedText style={rcStyles.absentText}>Absent</ThemedText>
                    </View>
                    <ThemedText style={[rcStyles.thGrade, { color: colors.textSecondary }]}>—</ThemedText>
                    <ThemedText style={[rcStyles.thPct,   { color: colors.textSecondary }]}>—</ThemedText>
                    <View style={rcStyles.thResult} />
                  </>
                ) : (
                  <>
                    <ThemedText style={[rcStyles.tdMarks, { color: colors.text }]}>
                      {sub.marks}/{sub.totalMarks}
                    </ThemedText>
                    <View style={[rcStyles.thGradeCell]}>
                      <View style={[rcStyles.gradeTinyPill, { backgroundColor: gc }]}>
                        <ThemedText style={rcStyles.gradeTinyText}>{formatGrade(sub.grade)}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[rcStyles.tdPct, { color: gc }]}>{sp}%</ThemedText>
                    <View style={[rcStyles.thResultCell]}>
                      <View style={[rcStyles.resultTinyPill, { backgroundColor: rc + '20' }]}>
                        <ThemedText style={[rcStyles.resultTinyText, { color: rc }]}>{sub.result}</ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )
          })}

          {/* Overall row */}
          <View style={[rcStyles.overallRow, { backgroundColor: colors.primary + '10', borderTopColor: colors.border }]}>
            <ThemedText style={[rcStyles.overallLabel, { color: colors.text }]}>Overall</ThemedText>
            <ThemedText style={[rcStyles.tdMarks, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
              {student.totalObtained}/{student.totalMaximum}
            </ThemedText>
            <View style={rcStyles.thGradeCell}>
              <View style={[rcStyles.gradeTinyPill, { backgroundColor: gradeColor }]}>
                <ThemedText style={rcStyles.gradeTinyText}>{formatGrade(student.overallGrade)}</ThemedText>
              </View>
            </View>
            <ThemedText style={[rcStyles.tdPct, { color: pctColor, fontFamily: 'Poppins-Bold' }]}>
              {student.percentage?.toFixed(1)}%
            </ThemedText>
            <View style={rcStyles.thResultCell}>
              <View style={[rcStyles.resultTinyPill, { backgroundColor: resultColor + '20' }]}>
                <ThemedText style={[rcStyles.resultTinyText, { color: resultColor, fontFamily: 'Poppins-Bold' }]}>
                  {student.overallResult}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* View full report btn */}
          <TouchableOpacity
            style={[rcStyles.viewBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}
            onPress={() => onPressViewFull(student)}
          >
            <MaterialIcons name="assignment" size={14} color={colors.primary} />
            <ThemedText style={[rcStyles.viewBtnText, { color: colors.primary }]}>
              View Full Marks Report
            </ThemedText>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// Card for students without marks
function NoMarksCard({ student, colors }) {
  return (
    <View style={[rcStyles.card, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
      <View style={rcStyles.headerRow}>
        <View style={[rcStyles.rankBadge, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="remove" size={14} color={colors.textSecondary} />
        </View>
        <View style={rcStyles.infoBlock}>
          <ThemedText style={[rcStyles.studentName, { color: colors.text }]} numberOfLines={1}>
            {student.fullName}
          </ThemedText>
          <ThemedText style={[rcStyles.rollText, { color: colors.textSecondary }]}>
            Roll: {student.rollNo || '—'}
          </ThemedText>
        </View>
        <View style={[rcStyles.resultPill, { backgroundColor: '#f59e0b20', alignSelf: 'center' }]}>
          <ThemedText style={[rcStyles.resultPillText, { color: '#f59e0b' }]}>Not Uploaded</ThemedText>
        </View>
      </View>
    </View>
  )
}

// Shared static styles for ranked card (no colors dependency)
const rcStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  medalStrip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  medalText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  rollText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  rightBlock: {
    alignItems: 'center',
    gap: 4,
    minWidth: 58,
  },
  pctBig: {
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gradePillText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  resultPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultPillText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
  },
  // Subject table
  subjectTable: {
    borderTopWidth: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  thSubject:     { flex: 1.8, fontSize: 10, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase' },
  thSubjectCell: { flex: 1.8, flexDirection: 'row', alignItems: 'center' },
  tdSubject:     { fontSize: 12, fontFamily: 'Poppins-Medium', flex: 1 },
  thMarks:       { flex: 1.1, fontSize: 10, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase', textAlign: 'center' },
  tdMarks:       { flex: 1.1, fontSize: 12, fontFamily: 'Poppins-SemiBold', textAlign: 'center' },
  thGrade:       { flex: 0.9, fontSize: 10, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase', textAlign: 'center' },
  thGradeCell:   { flex: 0.9, alignItems: 'center' },
  thPct:         { flex: 0.8, fontSize: 10, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase', textAlign: 'center' },
  tdPct:         { flex: 0.8, fontSize: 12, fontFamily: 'Poppins-SemiBold', textAlign: 'center' },
  thResult:      { flex: 1, fontSize: 10, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase', textAlign: 'center' },
  thResultCell:  { flex: 1, alignItems: 'center' },
  gradeTinyPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gradeTinyText: { fontSize: 9, color: '#FFF', fontFamily: 'Poppins-Bold' },
  resultTinyPill:{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  resultTinyText:{ fontSize: 9, fontFamily: 'Poppins-Bold' },
  absentBadge:   { flex: 1.1, alignItems: 'center' },
  absentText:    { fontSize: 10, color: '#ef4444', fontFamily: 'Poppins-Medium' },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  overallLabel: {
    flex: 1.8,
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 10,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
})

// ─── Top 3 Podium ─────────────────────────────────────────────────────────────

function TopPodium({ rankedStudents, colors, onPressViewFull }) {
  const top3 = rankedStudents.slice(0, 3)
  if (top3.length === 0) return null

  const order = [top3[1], top3[0], top3[2]].filter(Boolean) // 2nd, 1st, 3rd
  const heights = { 1: 88, 2: 72, 3: 60 }

  return (
    <View style={podiumStyles.container}>
      <ThemedText style={[podiumStyles.title, { color: colors.text }]}>
        🏆 Top Rankers
      </ThemedText>
      <View style={podiumStyles.row}>
        {order.map((student) => {
          const meta = RANK_COLORS[student.rank]
          const pctColor = getPercentageColor(student.percentage)
          const barH = heights[student.rank]
          return (
            <TouchableOpacity
              key={student.id}
              style={podiumStyles.podiumItem}
              onPress={() => onPressViewFull(student)}
              activeOpacity={0.8}
            >
              {/* Avatar circle */}
              <View style={[podiumStyles.avatar, { backgroundColor: meta.bg + '20', borderColor: meta.bg }]}>
                <ThemedText style={[podiumStyles.avatarInitial, { color: meta.bg }]}>
                  {(student.firstName?.[0] || '?').toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText style={[podiumStyles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {student.firstName}
              </ThemedText>
              <ThemedText style={[podiumStyles.podiumMarks, { color: colors.textSecondary }]}>
                {student.totalObtained}/{student.totalMaximum}
              </ThemedText>
              <ThemedText style={[podiumStyles.podiumPct, { color: pctColor }]}>
                {student.percentage?.toFixed(1)}%
              </ThemedText>
              {/* Podium bar */}
              <LinearGradient
                colors={[meta.bg, meta.bg + 'AA']}
                style={[podiumStyles.bar, { height: barH }]}
              >
                <ThemedText style={podiumStyles.barRank}>
                  {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉'}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const podiumStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 15, fontFamily: 'Poppins-Bold', marginBottom: 14, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 10 },
  podiumItem: { alignItems: 'center', width: 100 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, marginBottom: 4,
  },
  avatarInitial: { fontSize: 20, fontFamily: 'Poppins-Bold' },
  podiumName:  { fontSize: 12, fontFamily: 'Poppins-SemiBold', textAlign: 'center', marginBottom: 1 },
  podiumMarks: { fontSize: 10, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  podiumPct:   { fontSize: 12, fontFamily: 'Poppins-Bold', textAlign: 'center', marginBottom: 6 },
  bar: {
    width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8,
    justifyContent: 'flex-start', alignItems: 'center', paddingTop: 8,
  },
  barRank: { fontSize: 20 },
})

// ─── Subject Ranked Card (used in Toppers/Weakers full list) ─────────────────

function SubjectRankedCard({ student, subjectKey, colors, onPressViewFull }) {
  const rankMeta = RANK_COLORS[student.subjectRank] || null
  const pctColor = getPercentageColor(student.subjectPct)
  const overallColor = getPercentageColor(student.percentage)
  const badgeBg = rankMeta ? rankMeta.bg : colors.inputBackground
  const badgeText = rankMeta ? rankMeta.text : colors.text

  return (
    <View style={[rcStyles.card, { backgroundColor: colors.cardBackground, borderColor: rankMeta ? rankMeta.bg + '55' : colors.border }]}>
      {rankMeta && student.subjectRank <= 3 && (
        <LinearGradient
          colors={[rankMeta.bg, rankMeta.bg + 'CC']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 4 }}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <View style={[rcStyles.rankBadge, { backgroundColor: badgeBg }]}>
          <ThemedText style={[rcStyles.rankBadgeText, { color: badgeText }]}>#{student.subjectRank}</ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text }}>
            {student.firstName} {student.lastName}
          </ThemedText>
          <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
            Roll: {student.rollNo || 'N/A'}
          </ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ThemedText style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: pctColor }}>
            {student.subjectPct?.toFixed(1)}%
          </ThemedText>
          <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
            {student.subjectMarks}/{student.subjectTotalMarks} marks
          </ThemedText>
        </View>
      </View>
      <View style={{
        borderTopWidth: 1, borderTopColor: colors.border,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 8,
      }}>
        <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
          Overall: <ThemedText style={{ color: overallColor, fontFamily: 'Poppins-SemiBold' }}>{student.percentage?.toFixed(1)}%</ThemedText>
          {'  '}Grade: <ThemedText style={{ color: getGradeColor(student.overallGrade), fontFamily: 'Poppins-SemiBold' }}>{student.overallGrade || 'N/A'}</ThemedText>
        </ThemedText>
        <TouchableOpacity onPress={() => onPressViewFull(student)}>
          <ThemedText style={{ fontSize: 11, color: colors.primary, fontFamily: 'Poppins-SemiBold' }}>Full Report</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Subject Topper/Weaker Cards ──────────────────────────────────────────────

function SubjectStatCard({ subjectKey, data, mode, colors }) {
  if (!data.students || data.students.length === 0) return null
  const sorted = [...data.students].sort((a, b) => b.subjectPct - a.subjectPct)
  const target = mode === 'toppers' ? sorted[0] : sorted[sorted.length - 1]
  if (!target) return null

  const gc = getGradeColor(target.subjectGrade)
  const icon = SUBJECT_ICONS[subjectKey] || 'book'
  const modeColor = mode === 'toppers' ? '#10b981' : '#ef4444'

  return (
    <View style={[sStyles.card, { backgroundColor: colors.cardBackground, borderColor: gc + '50' }]}>
      <View style={[sStyles.subjectHeader, { backgroundColor: gc + '15' }]}>
        <MaterialIcons name={icon} size={16} color={gc} />
        <ThemedText style={[sStyles.subjectLabel, { color: gc }]}>{data.label}</ThemedText>
        <View style={[sStyles.modeBadge, { backgroundColor: modeColor + '20' }]}>
          <ThemedText style={[sStyles.modeBadgeText, { color: modeColor }]}>
            {mode === 'toppers' ? 'Topper' : 'Needs Help'}
          </ThemedText>
        </View>
      </View>
      <View style={sStyles.studentRow}>
        <View style={[sStyles.initialCircle, { backgroundColor: colors.primary + '20' }]}>
          <ThemedText style={[sStyles.initialText, { color: colors.primary }]}>
            {(target.firstName?.[0] || '?').toUpperCase()}
          </ThemedText>
        </View>
        <View style={sStyles.studentInfo}>
          <ThemedText style={[sStyles.studentName, { color: colors.text }]}>{target.fullName}</ThemedText>
          <ThemedText style={[sStyles.rollText, { color: colors.textSecondary }]}>
            Roll: {target.rollNo || '—'}
          </ThemedText>
        </View>
        <View style={sStyles.scoreBlock}>
          <ThemedText style={[sStyles.marks, { color: colors.text }]}>
            {target.subjectMarks}/{target.subjectTotalMarks}
          </ThemedText>
          <View style={[sStyles.gradePill, { backgroundColor: gc }]}>
            <ThemedText style={sStyles.gradeText}>{formatGrade(target.subjectGrade)}</ThemedText>
          </View>
          <ThemedText style={[sStyles.pct, { color: gc }]}>
            {target.subjectPct.toFixed(1)}%
          </ThemedText>
        </View>
      </View>
      {/* Mini rank in subject */}
      <View style={[sStyles.footer, { borderTopColor: colors.border }]}>
        <ThemedText style={[sStyles.footerText, { color: colors.textSecondary }]}>
          {mode === 'toppers'
            ? `Highest out of ${data.students.length} students`
            : `Lowest out of ${data.students.length} students`}
        </ThemedText>
        <ThemedText style={[sStyles.footerPct, { color: modeColor }]}>
          Class Avg: {(data.students.reduce((a, s) => a + s.subjectPct, 0) / data.students.length).toFixed(1)}%
        </ThemedText>
      </View>
    </View>
  )
}

const sStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  subjectHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  subjectLabel: { fontSize: 13, fontFamily: 'Poppins-SemiBold', flex: 1 },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  modeBadgeText: { fontSize: 10, fontFamily: 'Poppins-Bold' },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  initialCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  initialText: { fontSize: 16, fontFamily: 'Poppins-Bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  rollText: { fontSize: 11, fontFamily: 'Poppins-Medium', marginTop: 1 },
  scoreBlock: { alignItems: 'center', gap: 3 },
  marks: { fontSize: 13, fontFamily: 'Poppins-Bold' },
  gradePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  gradeText: { fontSize: 10, color: '#FFF', fontFamily: 'Poppins-Bold' },
  pct: { fontSize: 13, fontFamily: 'Poppins-Bold' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 8,
  },
  footerText: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  footerPct: { fontSize: 11, fontFamily: 'Poppins-SemiBold' },
})

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentsMarksStats({ visible, onClose }) {
  const { colors } = useTheme()
  const searchInputRef = useRef(null)

  const [stats, setStats] = useState([])
  const [availableExams, setAvailableExams] = useState([])

  const [selectedExamType, setSelectedExamType] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  const [classStudents, setClassStudents] = useState(null)
  const [classLoading, setClassLoading] = useState(false)

  // Class view filters
  const [sortOrder, setSortOrder] = useState('high') // 'high' | 'low'
  const [viewMode, setViewMode] = useState('all')    // 'all' | 'toppers' | 'weakers'
  const [selectedSubject, setSelectedSubject] = useState(null)

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
  const [showStudentMarks, setShowStudentMarks] = useState(false)

  const showToast = (message, type = 'error', duration = 3000) =>
    setToast({ message, type, duration })
  const hideToast = () => setToast(null)

  // ── API ─────────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const res = await axiosApi.get('/students/marks-stats')
      if (res.data.success) {
        setStats(res.data.data?.exams || [])
        setAvailableExams(res.data.data?.availableExams || [])
      } else throw new Error(res.data.message || 'Failed to fetch statistics')
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
      if (res.data.success) setClassStudents(res.data.data)
      else throw new Error(res.data.message || 'Failed to fetch student data')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load student data'
      showToast(msg, 'error')
    } finally {
      setClassLoading(false)
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
      setSelectedExamType(null); setSelectedClass(null); setSelectedSection(null)
      setClassStudents(null); setSearchQuery('')
      setSortOrder('high'); setViewMode('all')
    }
  }, [visible])

  useEffect(() => {
    if (selectedExamType && selectedClass && selectedSection) {
      setSortOrder('high'); setViewMode('all')
      fetchClassStudents(selectedExamType, selectedClass, selectedSection)
    } else setClassStudents(null)
  }, [selectedExamType, selectedClass, selectedSection])

  useEffect(() => { setSelectedSubject(null) }, [viewMode])

  // ── Filter handlers ──────────────────────────────────────────────────────────

  const handleExamTypeSelect = (et) => {
    setSelectedExamType((p) => (p === et ? null : et))
    setSelectedClass(null); setSelectedSection(null); setClassStudents(null)
  }
  const handleClassSelect = (cls) => {
    setSelectedClass((p) => (p === cls ? null : cls))
    setSelectedSection(null); setClassStudents(null)
  }
  const handleSectionSelect = (sec) => setSelectedSection((p) => (p === sec ? null : sec))

  // ── Derived data ─────────────────────────────────────────────────────────────

  const getSelectedExamData = () => stats.find((e) => e.examType === selectedExamType) || null

  const getAvailableClasses = () => {
    const exam = getSelectedExamData()
    if (!exam) return []
    return [...new Set(exam.classSections.map((s) => s.class))]
      .sort((a, b) => CLASS_ORDER.indexOf(a) - CLASS_ORDER.indexOf(b))
  }

  const getAvailableSections = () => {
    const exam = getSelectedExamData()
    if (!exam || !selectedClass) return []
    return exam.classSections.filter((s) => s.class === selectedClass).map((s) => s.section).sort()
  }

  const getSchoolSummary = () => {
    const exam = getSelectedExamData()
    if (!exam) return null
    let totalPass = 0, totalFail = 0
    const gradeDistribution = {}
    exam.classSections.forEach((cs) => {
      totalPass += cs.summary?.resultDistribution?.PASS || 0
      totalFail += cs.summary?.resultDistribution?.FAIL || 0
      Object.entries(cs.summary?.gradeDistribution || {}).forEach(([g, c]) => {
        if (c > 0) {
          const dg = g.replace('_PLUS', '+')
          gradeDistribution[dg] = (gradeDistribution[dg] || 0) + c
        }
      })
    })
    const tw = exam.summary.totalStudentsWithMarks
    return {
      totalStudentsWithMarks: tw,
      totalPass, totalFail,
      passPercentage: tw > 0 ? ((totalPass / tw) * 100).toFixed(1) : '0.0',
      avgPercentage: exam.summary.averagePercentage != null ? exam.summary.averagePercentage.toFixed(1) : '0.0',
      gradeDistribution,
    }
  }

  // Ranked + sorted students
  const rankedStudents = useMemo(() => {
    if (!classStudents?.students) return []
    const ranked = assignRanks(classStudents.students)
    return sortOrder === 'high'
      ? ranked
      : [...ranked].sort((a, b) => a.percentage - b.percentage)
  }, [classStudents, sortOrder])

  const studentsWithoutMarks = useMemo(() => {
    if (!classStudents?.students) return []
    return classStudents.students.filter((s) => !s.hasMarks)
  }, [classStudents])

  // Subject stats for toppers/weakers view
  const subjectStats = useMemo(() => {
    if (!classStudents?.students) return {}
    const subjects = {}
    classStudents.students.filter((s) => s.hasMarks).forEach((student) => {
      Object.entries(student.marksData || {}).forEach(([key, sub]) => {
        if (sub.isAbsent || sub.totalMarks === 0) return
        if (!subjects[key]) subjects[key] = { label: SUBJECT_LABELS[key] || key, students: [] }
        subjects[key].students.push({
          ...student,
          subjectMarks: sub.marks,
          subjectTotalMarks: sub.totalMarks,
          subjectPct: (sub.marks / sub.totalMarks) * 100,
          subjectGrade: sub.grade,
          subjectResult: sub.result,
        })
      })
    })
    return subjects
  }, [classStudents])

  const getSubjectRankedStudents = (subjectKey, ascending = false) => {
    if (!classStudents?.students) return []
    const withSubject = classStudents.students
      .filter((s) => s.hasMarks && s.marksData?.[subjectKey] && !s.marksData[subjectKey].isAbsent && s.marksData[subjectKey].totalMarks > 0)
      .map((s) => ({
        ...s,
        subjectMarks: s.marksData[subjectKey].marks,
        subjectTotalMarks: s.marksData[subjectKey].totalMarks,
        subjectPct: (s.marksData[subjectKey].marks / s.marksData[subjectKey].totalMarks) * 100,
        subjectGrade: s.marksData[subjectKey].grade,
        subjectResult: s.marksData[subjectKey].result,
      }))
    return assignSubjectRanks(withSubject, ascending)
  }

  // ── Student press ────────────────────────────────────────────────────────────

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
    setSelectedStudent(student); setShowStudentMarks(true)
  }

  const handleCloseStudentModal = () => {
    setShowStudentMarks(false); setSelectedStudent(null)
  }

  const handleClearSearch = () => {
    setSearchQuery(''); setSearchResults([]); setIsSearching(false)
    searchInputRef.current?.focus()
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true); fetchStats(false)
    if (selectedExamType && selectedClass && selectedSection)
      fetchClassStudents(selectedExamType, selectedClass, selectedSection)
  }, [selectedExamType, selectedClass, selectedSection])

  const getHeaderSubtitle = () => {
    if (isSearching) return 'Search Results'
    if (selectedExamType && selectedClass && selectedSection)
      return `${CLASS_LABELS[selectedClass]} — Sec ${selectedSection} · ${EXAM_TYPE_LABELS[selectedExamType] || selectedExamType}`
    if (selectedExamType) return EXAM_TYPE_LABELS[selectedExamType] || selectedExamType
    return 'Select exam type to view report'
  }

  // ── Dynamic styles (depends on colors) ──────────────────────────────────────

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

    // Class report filter bar
    classFilterBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      gap: 8,
    },
    filterToggleGroup: { flexDirection: 'row', gap: 6 },
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
      borderWidth: isSearchFocused ? 2 : 1,
      backgroundColor: colors.cardBackground,
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
    emptyContainer: {
      alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 20,
    },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: colors.text, marginTop: 16, marginBottom: 8 },
    emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    heroCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins-Medium' },
    heroExamBadge: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
    heroBigValue: { fontSize: 46, color: '#FFF', fontFamily: 'Poppins-Bold', lineHeight: 52 },
    heroStatsRow: {
      flexDirection: 'row', justifyContent: 'space-around',
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 14,
    },
    heroStat: { alignItems: 'center', flex: 1 },
    heroStatVal: { fontSize: 18, color: '#FFF', fontFamily: 'Poppins-Bold' },
    heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: 'Poppins-Medium', marginTop: 2 },
    heroStatDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center' },

    gradeSectionCard: {
      backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    },
    sectionTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text, marginBottom: 12 },
    gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gradeBox: { flex: 1, minWidth: 68, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
    gradeDot: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    gradeDotText: { fontSize: 11, color: '#FFF', fontFamily: 'Poppins-Bold' },
    gradeCount: { fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 2 },
    gradePercent: { fontSize: 10, fontFamily: 'Poppins-Medium', color: colors.textSecondary },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionHint: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Poppins-Medium' },

    classCard: {
      backgroundColor: colors.cardBackground, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden',
    },
    classCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
    classCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    classCardTitle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: colors.text },
    secBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    secBadgeText: { fontSize: 11, fontFamily: 'Poppins-Medium' },
    passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    passBadgeText: { fontSize: 11, fontFamily: 'Poppins-SemiBold' },
    classStatsStrip: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, backgroundColor: colors.inputBackground },
    classStat: { alignItems: 'center', flex: 1 },
    classStatVal: { fontSize: 14, fontFamily: 'Poppins-Bold', color: colors.text },
    classStatLbl: { fontSize: 9, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase' },
    divider: { width: 1, height: 28, alignSelf: 'center', backgroundColor: colors.border },

    classSummaryCard: {
      backgroundColor: colors.cardBackground, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden',
      margin: 8,
    },
    classSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 },
    classSummaryTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: colors.text },
    classSummaryExam: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2 },
    classSummaryStats: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: colors.inputBackground },
    csStat: { alignItems: 'center', flex: 1 },
    csStatVal: { fontSize: 16, fontFamily: 'Poppins-Bold' },
    csStatLbl: { fontSize: 9, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase' },

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
    const examData = getSelectedExamData()
    const summary = getSchoolSummary()
    if (!examData || !summary) return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyMessage}>No data for this exam type</ThemedText>
      </View>
    )

    const gradeEntries = GRADE_DISPLAY_ORDER
      .filter((g) => summary.gradeDistribution[g] > 0)
      .map((g) => ({ grade: g, count: summary.gradeDistribution[g] }))

    return (
      <View>
        <LinearGradient colors={['#047857', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <ThemedText style={styles.heroLabel}>School Pass Percentage</ThemedText>
              <ThemedText style={styles.heroExamBadge}>{EXAM_TYPE_LABELS[selectedExamType] || selectedExamType}</ThemedText>
            </View>
            <ThemedText style={styles.heroBigValue}>{summary.passPercentage}%</ThemedText>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}><ThemedText style={styles.heroStatVal}>{summary.totalStudentsWithMarks}</ThemedText><ThemedText style={styles.heroStatLbl}>Tested</ThemedText></View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}><ThemedText style={styles.heroStatVal}>{summary.totalPass}</ThemedText><ThemedText style={styles.heroStatLbl}>Passed</ThemedText></View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}><ThemedText style={styles.heroStatVal}>{summary.totalFail}</ThemedText><ThemedText style={styles.heroStatLbl}>Failed</ThemedText></View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}><ThemedText style={styles.heroStatVal}>{summary.avgPercentage}%</ThemedText><ThemedText style={styles.heroStatLbl}>Avg Score</ThemedText></View>
          </View>
        </LinearGradient>

        {gradeEntries.length > 0 && (
          <View style={styles.gradeSectionCard}>
            <ThemedText style={styles.sectionTitle}>Grade Distribution</ThemedText>
            <View style={styles.gradeGrid}>
              {gradeEntries.map(({ grade, count }) => {
                const color = getGradeColor(grade)
                const pct = summary.totalStudentsWithMarks > 0
                  ? ((count / summary.totalStudentsWithMarks) * 100).toFixed(1) : '0'
                return (
                  <View key={grade} style={[styles.gradeBox, { backgroundColor: color + '18', borderColor: color + '35' }]}>
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

        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>Class-wise Breakdown</ThemedText>
          <ThemedText style={styles.sectionHint}>Select class → section for details</ThemedText>
        </View>

        {examData.classSections.map((cs, idx) => {
          const sum = cs.summary
          const passColor = sum.passPercentage >= 75 ? '#10b981' : sum.passPercentage >= 50 ? '#f59e0b' : '#ef4444'
          const avgColor  = sum.averagePercentage >= 75 ? '#10b981' : sum.averagePercentage >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <View key={idx} style={styles.classCard}>
              <View style={styles.classCardHeader}>
                <View style={styles.classCardLeft}>
                  <ThemedText style={styles.classCardTitle}>{cs.classLabel}</ThemedText>
                  <View style={[styles.secBadge, { backgroundColor: colors.primary + '15' }]}>
                    <ThemedText style={[styles.secBadgeText, { color: colors.primary }]}>Sec {cs.section}</ThemedText>
                  </View>
                </View>
                <View style={[styles.passBadge, { backgroundColor: passColor + '18' }]}>
                  <ThemedText style={[styles.passBadgeText, { color: passColor }]}>{sum.passPercentage}% Pass</ThemedText>
                </View>
              </View>
              <View style={styles.classStatsStrip}>
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: colors.primary }]}>{sum.studentsWithMarks}/{sum.totalStudents}</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Students</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: avgColor }]}>{sum.averagePercentage}%</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Avg Score</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: colors.text }]}>{sum.averageMarks}</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Avg Marks</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.classStat}>
                  <ThemedText style={[styles.classStatVal, { color: '#ef4444' }]}>{sum.resultDistribution?.FAIL || 0}</ThemedText>
                  <ThemedText style={styles.classStatLbl}>Failed</ThemedText>
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
    if (classLoading) return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading student reports...</ThemedText>
      </View>
    )
    if (!classStudents) return null

    const { summary } = classStudents
    const avgPct = summary.classTotalMaximum > 0
      ? ((summary.classTotalObtained / summary.classTotalMaximum) * 100).toFixed(1)
      : '0.0'
    const passCount = rankedStudents.filter((s) => s.overallResult === 'PASS').length
    const failCount = rankedStudents.filter((s) => s.overallResult === 'FAIL').length
    const passPercentage = rankedStudents.length > 0
      ? ((passCount / rankedStudents.length) * 100).toFixed(1) : '0.0'
    const passColor = parseFloat(passPercentage) >= 75 ? '#10b981' : parseFloat(passPercentage) >= 50 ? '#f59e0b' : '#ef4444'

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
              <ThemedText style={[styles.passBadgeText, { color: passColor }]}>{passPercentage}% Pass</ThemedText>
            </View>
          </View>
          <View style={styles.classSummaryStats}>
            <View style={styles.csStat}>
              <ThemedText style={[styles.csStatVal, { color: colors.primary }]}>{summary.withMarks}/{summary.totalStudents}</ThemedText>
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

        {/* ── All Students view ── */}
        {viewMode === 'all' && (
          <View>
            {/* Top 3 podium (only when sorted high→low) */}
            {sortOrder === 'high' && rankedStudents.length >= 1 && (
              <TopPodium
                rankedStudents={rankedStudents}
                colors={colors}
                onPressViewFull={handleStudentPress}
              />
            )}

            <ThemedText style={styles.listLabel}>
              All Students ({summary.totalStudents}) · Ranked by Marks
            </ThemedText>

            {rankedStudents.map((student) => (
              <RankedStudentCard
                key={student.id}
                student={student}
                colors={colors}
                onPressViewFull={handleStudentPress}
              />
            ))}

            {studentsWithoutMarks.length > 0 && (
              <View style={styles.noMarksDivider}>
                <View style={styles.noMarksDividerLine} />
                <ThemedText style={styles.noMarksDividerText}>
                  Marks Not Uploaded ({studentsWithoutMarks.length})
                </ThemedText>
                {studentsWithoutMarks.map((student) => (
                  <NoMarksCard key={student.id} student={student} colors={colors} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Toppers view ── */}
        {viewMode === 'toppers' && (() => {
          const subjectKeys = Object.keys(subjectStats)
          const listStudents = selectedSubject
            ? getSubjectRankedStudents(selectedSubject, false)
            : rankedStudents
          return (
            <View>
              {/* Subject filter chips */}
              {subjectKeys.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  <ThemedText style={styles.listLabel}>Filter by Subject</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, { marginBottom: 12 }]}>
                    <TouchableOpacity
                      style={[styles.chip, !selectedSubject && styles.chipSelected]}
                      onPress={() => setSelectedSubject(null)}
                    >
                      <ThemedText style={[styles.chipText, !selectedSubject && styles.chipTextSelected]}>All Subjects</ThemedText>
                    </TouchableOpacity>
                    {subjectKeys.map((key) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.chip, selectedSubject === key && styles.chipSelected]}
                        onPress={() => setSelectedSubject(selectedSubject === key ? null : key)}
                      >
                        <ThemedText style={[styles.chipText, selectedSubject === key && styles.chipTextSelected]}>
                          {SUBJECT_LABELS[key] || key}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <ThemedText style={styles.listLabel}>
                {selectedSubject
                  ? `${SUBJECT_LABELS[selectedSubject] || selectedSubject} — Toppers`
                  : `All Students — Highest First (${rankedStudents.length})`}
              </ThemedText>

              {selectedSubject
                ? listStudents.map((student) => (
                    <SubjectRankedCard
                      key={student.id}
                      student={student}
                      subjectKey={selectedSubject}
                      colors={colors}
                      onPressViewFull={handleStudentPress}
                    />
                  ))
                : rankedStudents.map((student) => (
                    <RankedStudentCard
                      key={student.id}
                      student={student}
                      colors={colors}
                      onPressViewFull={handleStudentPress}
                    />
                  ))
              }
            </View>
          )
        })()}

        {/* ── Weakers view ── */}
        {viewMode === 'weakers' && (() => {
          const subjectKeys = Object.keys(subjectStats)
          const weakersSorted = [...rankedStudents].sort((a, b) => a.percentage - b.percentage)
          const listStudents = selectedSubject
            ? getSubjectRankedStudents(selectedSubject, true)
            : weakersSorted
          return (
            <View>
              {/* Subject filter chips */}
              {subjectKeys.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  <ThemedText style={styles.listLabel}>Filter by Subject</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, { marginBottom: 12 }]}>
                    <TouchableOpacity
                      style={[styles.chip, !selectedSubject && styles.chipSelected]}
                      onPress={() => setSelectedSubject(null)}
                    >
                      <ThemedText style={[styles.chipText, !selectedSubject && styles.chipTextSelected]}>All Subjects</ThemedText>
                    </TouchableOpacity>
                    {subjectKeys.map((key) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.chip, selectedSubject === key && styles.chipSelected]}
                        onPress={() => setSelectedSubject(selectedSubject === key ? null : key)}
                      >
                        <ThemedText style={[styles.chipText, selectedSubject === key && styles.chipTextSelected]}>
                          {SUBJECT_LABELS[key] || key}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <ThemedText style={styles.listLabel}>
                {selectedSubject
                  ? `${SUBJECT_LABELS[selectedSubject] || selectedSubject} — Needs Help`
                  : `All Students — Lowest First (${weakersSorted.length})`}
              </ThemedText>

              {selectedSubject
                ? listStudents.map((student) => (
                    <SubjectRankedCard
                      key={student.id}
                      student={student}
                      subjectKey={selectedSubject}
                      colors={colors}
                      onPressViewFull={handleStudentPress}
                    />
                  ))
                : weakersSorted.map((student) => (
                    <RankedStudentCard
                      key={student.id}
                      student={student}
                      colors={colors}
                      onPressViewFull={handleStudentPress}
                    />
                  ))
              }
            </View>
          )
        })()}
      </View>
    )
  }

  // ── Main content ─────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading marks data...</ThemedText>
      </View>
    )
    if (error) return (
      <View style={styles.errorContainer}>
        <Feather name="alert-triangle" size={50} color="#dc2626" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </View>
    )
    if (!selectedExamType) {
      if (availableExams.length === 0) return (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={70} color={colors.textSecondary + '60'} />
          <ThemedText style={styles.emptyTitle}>No Data Available</ThemedText>
          <ThemedText style={styles.emptyMessage}>No marks records found in the system</ThemedText>
        </View>
      )
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="filter-outline" size={60} color={colors.textSecondary + '80'} />
          <ThemedText style={styles.emptyTitle}>Select Exam Type</ThemedText>
          <ThemedText style={styles.emptyMessage}>Choose an exam type above to view the school marks report</ThemedText>
        </View>
      )
    }
    if (selectedExamType && selectedClass && selectedSection) return renderClassReport()
    if (selectedExamType && selectedClass) return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={60} color={colors.textSecondary + '80'} />
        <ThemedText style={styles.emptyTitle}>Select Section</ThemedText>
        <ThemedText style={styles.emptyMessage}>Choose a section to view student-wise marks</ThemedText>
      </View>
    )
    return renderSchoolOverview()
  }

  const isClassView = !!(selectedExamType && selectedClass && selectedSection)

  // ── Return ───────────────────────────────────────────────────────────────────

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
                  <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.headerTitle}>Marks Report</ThemedText>
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

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            onTouchStart={() => { if (!isSearchFocused) Keyboard.dismiss() }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
            }
            showsVerticalScrollIndicator
          >
            {!isSearching && (
              <View style={styles.filtersWrapper}>
                {/* Exam chips */}
                {availableExams.length > 0 && (
                  <View style={styles.filterBlock}>
                    <ThemedText style={styles.filterLabel}>Exam Type</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      {availableExams.map((exam) => {
                        const sel = selectedExamType === exam.examType
                        return (
                          <TouchableOpacity key={exam.examType} style={[styles.chip, sel && styles.chipSelected]} onPress={() => handleExamTypeSelect(exam.examType)}>
                            <ThemedText style={[styles.chipText, sel && styles.chipTextSelected]}>
                              {EXAM_TYPE_LABELS[exam.examType] || exam.examTypeLabel}
                            </ThemedText>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Class chips */}
                {selectedExamType && getAvailableClasses().length > 0 && (
                  <View style={styles.filterBlock}>
                    <ThemedText style={styles.filterLabel}>Class</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      {getAvailableClasses().map((cls) => {
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

                {/* Section chips */}
                {selectedClass && getAvailableSections().length > 0 && (
                  <View style={styles.filterBlock}>
                    <ThemedText style={styles.filterLabel}>Section</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      {getAvailableSections().map((sec) => {
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

                {/* Sort & View */}
                {isClassView && !classLoading && (
                  <View style={[styles.filterBlock, { marginBottom: 0 }]}>
                    <ThemedText style={styles.filterLabel}>Sort & View</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                      <TouchableOpacity style={[styles.chip, sortOrder === 'high' && styles.chipSelected]} onPress={() => setSortOrder('high')}>
                        <ThemedText style={[styles.chipText, sortOrder === 'high' && styles.chipTextSelected]}>↑ Top First</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, sortOrder === 'low' && styles.chipSelected]} onPress={() => setSortOrder('low')}>
                        <ThemedText style={[styles.chipText, sortOrder === 'low' && styles.chipTextSelected]}>↓ Low First</ThemedText>
                      </TouchableOpacity>
                      <View style={{ width: 1, height: 26, backgroundColor: colors.border, alignSelf: 'center', marginHorizontal: 4 }} />
                      <TouchableOpacity style={[styles.chip, viewMode === 'all' && styles.chipSelected]} onPress={() => setViewMode('all')}>
                        <ThemedText style={[styles.chipText, viewMode === 'all' && styles.chipTextSelected]}>All</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, viewMode === 'toppers' && styles.chipSelected]} onPress={() => setViewMode('toppers')}>
                        <ThemedText style={[styles.chipText, viewMode === 'toppers' && styles.chipTextSelected]}>⭐ Toppers</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, viewMode === 'weakers' && styles.chipSelected]} onPress={() => setViewMode('weakers')}>
                        <ThemedText style={[styles.chipText, viewMode === 'weakers' && styles.chipTextSelected]}>🔴 Weakers</ThemedText>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            {isSearching ? (
              searchLoading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
              ) : searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <StudentCard key={student.id} student={student} onPress={handleSearchStudentPress} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <ThemedText style={[styles.emptyMessage, { marginTop: 12 }]}>
                    No students found matching "{debouncedSearchQuery}"
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
        <StudentMarks
          visible={showStudentMarks}
          onClose={handleCloseStudentModal}
          student={selectedStudent}
        />
      )}
    </>
  )
}
