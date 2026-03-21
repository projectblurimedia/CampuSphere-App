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

export default function StudentAttendance({ visible, onClose, student }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [attendanceData, setAttendanceData] = useState(null)
  const [toast, setToast] = useState(null)

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Fetch attendance data using existing API
  const fetchAttendance = async () => {
    if (!student?.id) return

    try {
      setLoading(true)
      const response = await axiosApi.get(`/attendances/student/${student.id}`)
      console.log(response.data)
      
      if (response.data.success) {
        setAttendanceData(response.data.data)
      } else {
        showToast(response.data.message || 'Failed to load attendance data', 'error')
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      let errorMessage = 'Failed to load attendance data'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load attendance data'
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
    fetchAttendance()
  }

  useEffect(() => {
    if (visible && student?.id) {
      fetchAttendance()
    }
  }, [visible, student?.id])

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return '#4CAF50'
    if (percentage >= 60) return '#FF9800'
    return '#F44336'
  }

  const getStatusText = (percentage) => {
    if (percentage >= 75) return 'Excellent'
    if (percentage >= 60) return 'Good'
    return 'Needs Improvement'
  }

  const formatDateLong = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    return date.toLocaleDateString('en-IN', options)
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
            Attendance Overview
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
        Loading attendance...
      </ThemedText>
    </View>
  )

  const renderAttendanceStats = () => {
    if (!attendanceData) return null

    const { summary, student: studentInfo } = attendanceData
    
    const totalSessions = summary.totalSessions || 0
    const presentSessions = summary.presentSessions || 0
    const absentSessions = summary.absentSessions || 0
    const notMarkedSessions = summary.notMarkedSessions || 0
    const attendancePercentage = summary.attendancePercentage || 0
    
    const statusColor = getStatusColor(attendancePercentage)
    const statusText = getStatusText(attendancePercentage)

    return (
      <View style={styles.contentContainer}>
        {/* Sessions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Sessions:
          </ThemedText>
        </View>

        {/* Stats Cards - 2x2 Grid */}
        <View style={styles.statsGrid}>
          {/* Total Sessions */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#2196F315' }]}>
              <Ionicons name="calendar" size={26} color="#2196F3" />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>
                {totalSessions}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total
              </ThemedText>
            </View>
          </View>

          {/* Present Sessions */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#4CAF5015' }]}>
              <Ionicons name="checkmark-circle" size={26} color="#4CAF50" />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>
                {presentSessions}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Present
              </ThemedText>
            </View>
          </View>

          {/* Absent Sessions */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F4433615' }]}>
              <Ionicons name="close-circle" size={26} color="#F44336" />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>
                {absentSessions}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Absent
              </ThemedText>
            </View>
          </View>

          {/* Not Marked Sessions */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF980015' }]}>
              <Ionicons name="help-circle" size={26} color="#FF9800" />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>
                {notMarkedSessions}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                Not Marked
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Percentage Card */}
        <LinearGradient
          colors={[colors.cardBackground, colors.cardBackground]}
          style={[styles.percentageCard, { borderColor: colors.border }]}
        >
          <View style={styles.percentageHeader}>
            <View style={[styles.percentageIconContainer, { backgroundColor: `${statusColor}15` }]}>
              <MaterialIcons name="pie-chart" size={26} color={statusColor} />
            </View>
            <View style={styles.percentageInfo}>
              <ThemedText style={[styles.percentageLabel, { color: colors.textSecondary }]}>
                Attendance Percentage
              </ThemedText>
              <View style={styles.percentageRow}>
                <ThemedText type='title' style={[styles.percentageValue, { color: statusColor }]}>
                  {attendancePercentage}%
                </ThemedText>
                <LinearGradient
                  colors={[statusColor, statusColor]}
                  style={[styles.statusBadge]}
                >
                  <ThemedText style={[styles.statusText, { color: '#FFFFFF' }]}>
                    {statusText}
                  </ThemedText>
                </LinearGradient>
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
                { width: `${Math.min(attendancePercentage, 100)}%` }
              ]} 
            />
          </View>

          {/* Session Info */}
          <View style={styles.effectiveInfo}>
            <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.effectiveText, { color: colors.textSecondary }]}>
              {presentSessions} present out of {totalSessions} total sessions
            </ThemedText>
          </View>
        </LinearGradient>

        {/* Period Info */}
        {attendanceData.period && attendanceData.period.startDate && attendanceData.period.endDate && (
          <View style={styles.periodSection}>
            <View style={styles.periodHeader}>
              <MaterialIcons name="date-range" size={20} color={colors.primary} />
              <ThemedText style={[styles.periodTitle, { color: colors.text }]}>
                Attendance Period
              </ThemedText>
            </View>
            
            <View style={styles.periodContainer}>
              {/* From Date Card */}
              <LinearGradient
                colors={['#E3F2FD', '#BBDEFB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.periodDateCard}
              >
                <View style={styles.periodDateHeader}>
                  <Feather name="calendar" size={16} color="#1976D2" />
                  <ThemedText style={styles.periodDateLabel}>FROM</ThemedText>
                </View>
                <ThemedText style={styles.periodDateValue}>
                  {formatDateLong(attendanceData.period.startDate)}
                </ThemedText>
                <View style={styles.periodDateBadge}>
                  <ThemedText style={styles.periodDateBadgeText}>
                    {new Date(attendanceData.period.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </ThemedText>
                </View>
              </LinearGradient>

              {/* Arrow Connector */}
              <View style={styles.periodArrowContainer}>
                <LinearGradient
                  colors={[colors.primary, colors.primary]}
                  style={styles.periodArrowCircle}
                >
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* To Date Card */}
              <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.periodDateCard}
              >
                <View style={styles.periodDateHeader}>
                  <Feather name="calendar" size={16} color="#2E7D32" />
                  <ThemedText style={styles.periodDateLabel}>TO</ThemedText>
                </View>
                <ThemedText style={styles.periodDateValue}>
                  {formatDateLong(attendanceData.period.endDate)}
                </ThemedText>
                <View style={[styles.periodDateBadge, { backgroundColor: '#2E7D3220' }]}>
                  <ThemedText style={[styles.periodDateBadgeText, { color: '#2E7D32' }]}>
                    {new Date(attendanceData.period.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </ThemedText>
                </View>
              </LinearGradient>
            </View>

            {/* Duration Badge */}
            <View style={styles.durationBadge}>
              <Ionicons name="time" size={14} color={colors.textSecondary} />
              <ThemedText style={[styles.durationText, { color: colors.textSecondary }]}>
                {Math.ceil((new Date(attendanceData.period.endDate) - new Date(attendanceData.period.startDate)) / (1000 * 60 * 60 * 24)) + 1} days period
              </ThemedText>
            </View>
          </View>
        )}
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
            {renderAttendanceStats()}
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
  contentContainer: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: .5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Medium',
  },
  percentageCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: .5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  percentageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  percentageInfo: {
    flex: 1,
  },
  percentageLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: 'Poppins-Medium',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentageValue: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  effectiveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  effectiveText: {
    fontSize: 12,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  periodSection: {
    marginTop: 4,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodDateCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  periodDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  periodDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.8,
    fontFamily: 'Poppins-Bold',
  },
  periodDateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  periodDateBadge: {
    backgroundColor: '#1976D220',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  periodDateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1976D2',
    fontFamily: 'Poppins-Medium',
  },
  periodArrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
})