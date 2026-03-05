import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
  FontAwesome,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SchoolStats({ visible, onClose }) {
  const { colors } = useTheme()
  
  // State management
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [statsData, setStatsData] = useState({
    basicInfo: {
      schoolName: '-',
      establishedYear: '-',
      affiliation: '-',
      board: '-',
      principal: '-',
      email: '-',
      phone: '-',
      address: '-',
    },
    overview: {
      totalStudents: '-',
      activeStudents: '-',
      totalTeachers: '-',
      totalStaff: '-',
      totalClassSections: '-',
      academicYear: '-',
    },
    studentGender: {
      boys: '-',
      girls: '-',
      others: '-',
      boysPercentage: '-',
      girlsPercentage: '-',
    },
    staffBreakdown: {
      male: '-',
      female: '-',
      teachers: '-',
      otherStaff: '-',
      malePercentage: '-',
      femalePercentage: '-',
    },
    academic: {
      overallPassPercentage: '-',
      totalStudentsAppeared: '-',
      passedStudents: '-',
      failedStudents: '-',
      boysPassPercentage: '-',
      girlsPassPercentage: '-',
    },
    attendance: {
      today: '-',
      averageDaily: '-',
      todayPercentage: '-',
      averagePercentage: '-',
      boysAttendance: '-',
      girlsAttendance: '-',
    },
    transport: {
      totalBuses: '-',
      activeBuses: '-',
      underMaintenance: '-',
      studentsUsingTransport: '-',
      busRoutes: '-',
    },
    fees: {
      totalDue: '-',
      totalCollected: '-',
      defaultersCount: '-',
      collectionEfficiency: '-',
    },
    classWisePerformance: [],
  })

  const styles = useMemo(() => StyleSheet.create({
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
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    sectionContainer: {
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 3,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    sectionTitle: {
      fontSize: 18,
      marginBottom: 12,
      textAlign: 'center',
      fontWeight: '600',
    },
    sectionTitleDivider: {
      height: 1,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      width: SCREEN_WIDTH / 4 - 20,
      marginBottom: 12,
    },
    statItemTwoCol: {
      alignItems: 'center',
      width: (SCREEN_WIDTH - 82) / 2,
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItemThreeCol: {
      alignItems: 'center',
      width: SCREEN_WIDTH / 3.5 - 20,
      marginBottom: 12,
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    statIconContainerTwoCol: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 16,
      marginBottom: 2,
      fontWeight: '600',
    },
    statValueTwoCol: {
      fontSize: 18,
      marginBottom: 2,
      fontWeight: '700',
    },
    statLabel: {
      fontSize: 11,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    statLabelTwoCol: {
      fontSize: 12,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    classStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    classLabel: {
      fontSize: 14,
      flex: 1,
      color: colors.text,
    },
    classValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    classValue: {
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 50,
      textAlign: 'center',
    },
    classValueLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    valueContainer: {
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 60,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    retryText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    lastUpdatedContainer: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    lastUpdatedText: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    rupeeIcon: {
      marginRight: 4,
    },
    valueWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [colors])

  // Fetch statistics on mount and when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchStats()
    }
  }, [visible])

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  const fetchStats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const response = await axiosApi.get('/stats')
      
      if (response.data.success) {
        setStatsData(response.data.data)
      } else {
        showToast(response.data.message || 'Failed to load statistics', 'error')
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
      showToast(error.response?.data?.message || 'Failed to load statistics', 'error')
    } finally {
      if (showLoading) setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStats(false)
  }, [])

  const handleRetry = () => {
    fetchStats(true)
  }

  const handleClose = () => {
    onClose()
  }

  // Define stat items with real data
  const basicStatItems = [
    {
      id: 'students',
      title: 'Students',
      value: statsData.overview.totalStudents,
      icon: 'users',
      color: '#3b82f6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'teachers',
      title: 'Teachers',
      value: statsData.overview.totalTeachers,
      icon: 'chalkboard-teacher',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'classSections',
      title: 'Classes',
      value: statsData.overview.totalClassSections,
      icon: 'door-open',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'established',
      title: 'Established',
      value: statsData.basicInfo.establishedYear,
      icon: 'calendar-alt',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
  ]

  const genderStatItems = [
    {
      id: 'boys',
      title: 'Boys',
      value: statsData.studentGender.boys,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'girls',
      title: 'Girls',
      value: statsData.studentGender.girls,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
    {
      id: 'others',
      title: 'Others',
      value: statsData.studentGender.others,
      icon: 'genderless',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
  ]

  const staffStatItems = [
    {
      id: 'staffMale',
      title: 'Male Staff',
      value: statsData.staffBreakdown.male,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'staffFemale',
      title: 'Female Staff',
      value: statsData.staffBreakdown.female,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
    {
      id: 'teachers',
      title: 'Teachers',
      value: statsData.staffBreakdown.teachers,
      icon: 'chalkboard-teacher',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'otherStaff',
      title: 'Other Staff',
      value: statsData.staffBreakdown.otherStaff,
      icon: 'users',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
  ]

  const academicStatItems = [
    {
      id: 'schoolPass',
      title: 'Pass %',
      value: statsData.academic.overallPassPercentage,
      icon: 'award',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'boysPass',
      title: 'Boys Pass %',
      value: statsData.academic.boysPassPercentage,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'girlsPass',
      title: 'Girls Pass %',
      value: statsData.academic.girlsPassPercentage,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
  ]

  const attendanceStatItems = [
    {
      id: 'totalAttendance',
      title: 'Today\'s',
      value: statsData.attendance.todayPercentage,
      icon: 'calendar-check',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'averageAttendance',
      title: 'Avg Daily',
      value: statsData.attendance.averagePercentage,
      icon: 'chart-line',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
  ]

  const transportStatItems = [
    {
      id: 'totalBuses',
      title: 'Total Buses',
      value: statsData.transport.totalBuses,
      icon: 'bus',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
    {
      id: 'activeBuses',
      title: 'Active Buses',
      value: statsData.transport.activeBuses,
      icon: 'bus',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'studentsTransport',
      title: 'Using Transport',
      value: statsData.transport.studentsUsingTransport,
      icon: 'child',
      color: '#3b82f6',
      iconType: 'FontAwesome5'
    },
  ]

  const feeStatItems = [
    {
      id: 'totalDue',
      title: 'Total Due',
      value: statsData.fees.totalDue,
      icon: 'rupee-sign',
      color: '#ef4444',
      iconType: 'FontAwesome5',
    },
    {
      id: 'totalCollected',
      title: 'Collected',
      value: statsData.fees.totalCollected,
      icon: 'rupee-sign',
      color: '#10b981',
      iconType: 'FontAwesome5',
    },
    {
      id: 'defaulters',
      title: 'Defaulters',
      value: statsData.fees.defaultersCount,
      icon: 'exclamation-triangle',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
    {
      id: 'efficiency',
      title: 'Efficiency',
      value: statsData.fees.collectionEfficiency,
      icon: 'percentage',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
  ]

  const renderStatItem = (item, isThreeCol = false) => {
    const IconComponent = {
      FontAwesome5: FontAwesome5,
      MaterialCommunityIcons: MaterialCommunityIcons,
      MaterialIcons: MaterialIcons,
      Ionicons: Ionicons,
      Feather: Feather,
    }[item.iconType] || FontAwesome5

    return (
      <View key={item.id} style={isThreeCol ? styles.statItemThreeCol : styles.statItem}>
        <View style={[styles.statIconContainer, { backgroundColor: item.color + '15' }]}>
          <IconComponent name={item.icon} size={16} color={item.color} />
        </View>
        <View style={styles.valueWithIcon}>
          {item.isRupee && <FontAwesome5 name="rupee-sign" size={12} color={colors.text} style={styles.rupeeIcon} />}
          <ThemedText type="subtitle" style={[styles.statValue, { color: colors.text }]}>
            {item.value}
          </ThemedText>
        </View>
        <ThemedText style={styles.statLabel}>
          {item.title}
        </ThemedText>
      </View>
    )
  }

  const renderTwoColStatItem = (item) => {
    const IconComponent = {
      FontAwesome5: FontAwesome5,
      MaterialCommunityIcons: MaterialCommunityIcons,
      MaterialIcons: MaterialIcons,
      Ionicons: Ionicons,
      Feather: Feather,
    }[item.iconType] || FontAwesome5

    return (
      <View key={item.id} style={[styles.statItemTwoCol, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.statIconContainerTwoCol, { backgroundColor: item.color + '15' }]}>
          <IconComponent name={item.icon} size={20} color={item.color} />
        </View>
        <View style={styles.valueWithIcon}>
          {item.isRupee && <FontAwesome5 name="rupee-sign" size={14} color={colors.text} style={styles.rupeeIcon} />}
          <ThemedText type="subtitle" style={[styles.statValueTwoCol, { color: colors.text }]}>
            {item.value}
          </ThemedText>
        </View>
        <ThemedText style={styles.statLabelTwoCol}>
          {item.title}
        </ThemedText>
      </View>
    )
  }

  const renderClassStatItem = (item) => (
    <View key={item.class} style={styles.classStatItem}>
      <ThemedText style={styles.classLabel}>
        Class {item.class}
      </ThemedText>
      <View style={styles.classValueContainer}>
        <View style={styles.valueContainer}>
          <ThemedText style={[styles.classValue, { color: '#8b5cf6' }]}>
            {item.attendance || '-'}
          </ThemedText>
          <ThemedText style={styles.classValueLabel}>
            Attendance
          </ThemedText>
        </View>
        <View style={styles.valueContainer}>
          <ThemedText style={[styles.classValue, { color: '#10b981' }]}>
            {item.pass || '-'}
          </ThemedText>
          <ThemedText style={styles.classValueLabel}>
            Pass %
          </ThemedText>
        </View>
      </View>
    </View>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>
            Loading statistics...
          </ThemedText>
        </View>
      )
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 1. BASIC INFORMATION SECTION */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Basic Information
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            {basicStatItems.map(item => renderStatItem(item))}
          </View>
        </View>

        {/* 2. STUDENT GENDER BREAKDOWN */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Student Gender Breakdown
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            {genderStatItems.map(item => renderStatItem(item))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
              Boys: {statsData.studentGender.boysPercentage} | Girls: {statsData.studentGender.girlsPercentage}
            </ThemedText>
          </View>
        </View>

        {/* 3. STAFF BREAKDOWN - 2x2 Grid */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Staff Breakdown
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsGrid}>
            {staffStatItems.map(item => renderTwoColStatItem(item))}
          </View>
        </View>

        {/* 4. TRANSPORTATION */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Transportation
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            {transportStatItems.map(item => renderStatItem(item))}
          </View>
        </View>

        {/* 5. ACADEMIC PERFORMANCE */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Academic Performance
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            {academicStatItems.map(item => renderStatItem(item))}
          </View>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
              Appeared: {statsData.academic.totalStudentsAppeared} | Passed: {statsData.academic.passedStudents}
            </ThemedText>
          </View>
        </View>

        {/* 6. ATTENDANCE STATISTICS */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Attendance Statistics
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            {attendanceStatItems.map(item => renderStatItem(item))}
          </View>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
              Today: {statsData.attendance.today} present
            </ThemedText>
          </View>
        </View>

        {/* 7. FEE STATISTICS - 2x2 Grid */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
            Fee Statistics
          </ThemedText>
          <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statsGrid}>
            {feeStatItems.map(item => renderTwoColStatItem(item))}
          </View>
        </View>

        {/* 8. CLASS-WISE PERFORMANCE */}
        {statsData.classWisePerformance && statsData.classWisePerformance.length > 0 && (
          <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
            <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
              Class-wise Performance
            </ThemedText>
            <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
            <View style={{ paddingHorizontal: 8 }}>
              {statsData.classWisePerformance.map(renderClassStatItem)}
            </View>
          </View>
        )}

        {/* Last Updated Timestamp */}
        <View style={styles.lastUpdatedContainer}>
          <ThemedText style={styles.lastUpdatedText}>
            Academic Year: {statsData.overview.academicYear}
          </ThemedText>
        </View>
      </ScrollView>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
     
        {/* Header with centered title like School Profile */}
        <LinearGradient
          colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={[styles.backButton, loading && { opacity: 0.5 }]}
                onPress={handleClose}
                disabled={loading}
              >
                <FontAwesome5
                  name="chevron-left"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginLeft: -2 }}
                />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <ThemedText type="subtitle" style={styles.title}>
                  Statistics
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  {statsData.basicInfo.schoolName !== '-' ? statsData.basicInfo.schoolName : 'Overview'}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.refreshButton, (loading || refreshing) && { opacity: 0.5 }]}
                onPress={onRefresh}
                disabled={loading || refreshing}
              >
                <FontAwesome
                  name="refresh"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {renderContent()}

        {/* Toast Notification */}
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={() => setToast(null)}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </View>
    </Modal>
  )
}