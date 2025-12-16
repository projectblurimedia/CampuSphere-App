import React, { useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
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
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SchoolStats({ visible, onClose }) {
  const { colors } = useTheme()
  
  const [schoolInfo] = useState({
    // Basic Information
    totalStudents: '1245',
    totalTeachers: '45',
    totalClassrooms: '32',
    establishedYear: '2002',
    
    // Student Gender Breakdown
    boysCount: '650',
    girlsCount: '595',
    
    // Staff Breakdown
    staffMale: '30',
    staffFemale: '15',
    drivers: '8',
    caretakers: '10',
    watchmen: '5',
    others: '7',
    
    // Academic Performance
    schoolPassPercentage: '98%',
    boysPassPercentage: '97%',
    girlsPassPercentage: '99%',
    
    // Attendance
    totalAttendancePercentage: '96%',
    boysAttendancePercentage: '95%',
    girlsAttendancePercentage: '97%',
    
    // Transportation
    totalBuses: '12',
    activeBuses: '10',
    underMaintenance: '2',
    
    // Class-wise Data
    classPassPercentages: [
      { class: '1', pass: '100%', attendance: '98%' },
      { class: '2', pass: '98%', attendance: '97%' },
      { class: '3', pass: '99%', attendance: '96%' },
      { class: '4', pass: '97%', attendance: '95%' },
      { class: '5', pass: '100%', attendance: '99%' },
      { class: '6', pass: '96%', attendance: '94%' },
      { class: '7', pass: '98%', attendance: '96%' },
      { class: '8', pass: '99%', attendance: '97%' },
      { class: '9', pass: '95%', attendance: '93%' },
      { class: '10', pass: '97%', attendance: '95%' },
    ],
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
      width: 45,
      height: 45,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    schoolHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
    },
    schoolName: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    sectionContainer: {
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 6,
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
    statItem: {
      alignItems: 'center',
      width: SCREEN_WIDTH / 4 - 20,
      marginBottom: 12,
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
    statValue: {
      fontSize: 16,
      marginBottom: 2,
      fontWeight: '600',
    },
    statLabel: {
      fontSize: 11,
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
  }), [colors])

  // Define all stat items after schoolInfo is available
  const basicStatItems = [
    {
      id: 'students',
      title: 'Students',
      value: schoolInfo.totalStudents,
      icon: 'users',
      color: '#3b82f6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'teachers',
      title: 'Teachers',
      value: schoolInfo.totalTeachers,
      icon: 'chalkboard-teacher',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'classrooms',
      title: 'Classrooms',
      value: schoolInfo.totalClassrooms,
      icon: 'door-open',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'established',
      title: 'Established',
      value: schoolInfo.establishedYear,
      icon: 'calendar-alt',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
  ]

  const genderStatItems = [
    {
      id: 'boys',
      title: 'Boys',
      value: schoolInfo.boysCount,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'girls',
      title: 'Girls',
      value: schoolInfo.girlsCount,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
  ]

  const staffStatItems = [
    {
      id: 'staffMale',
      title: 'Male Staff',
      value: schoolInfo.staffMale,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'staffFemale',
      title: 'Female Staff',
      value: schoolInfo.staffFemale,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
    {
      id: 'drivers',
      title: 'Drivers',
      value: schoolInfo.drivers,
      icon: 'car',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
    {
      id: 'caretakers',
      title: 'Caretakers',
      value: schoolInfo.caretakers,
      icon: 'user-nurse',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'watchmen',
      title: 'Watchmen',
      value: schoolInfo.watchmen,
      icon: 'shield-alt',
      color: '#ef4444',
      iconType: 'FontAwesome5'
    },
    {
      id: 'others',
      title: 'Others',
      value: schoolInfo.others,
      icon: 'users',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
  ]

  const academicStatItems = [
    {
      id: 'schoolPass',
      title: 'Pass %',
      value: schoolInfo.schoolPassPercentage,
      icon: 'award',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'boysPass',
      title: 'Boys Pass %',
      value: schoolInfo.boysPassPercentage,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'girlsPass',
      title: 'Girls Pass %',
      value: schoolInfo.girlsPassPercentage,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
  ]

  const attendanceStatItems = [
    {
      id: 'totalAttendance',
      title: 'Total Attendance',
      value: schoolInfo.totalAttendancePercentage,
      icon: 'calendar-check',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'boysAttendance',
      title: 'Boys Attendance',
      value: schoolInfo.boysAttendancePercentage,
      icon: 'mars',
      color: '#1d9bf0',
      iconType: 'FontAwesome5'
    },
    {
      id: 'girlsAttendance',
      title: 'Girls Attendance',
      value: schoolInfo.girlsAttendancePercentage,
      icon: 'venus',
      color: '#ec4899',
      iconType: 'FontAwesome5'
    },
  ]

  const transportStatItems = [
    {
      id: 'totalBuses',
      title: 'Total Buses',
      value: schoolInfo.totalBuses,
      icon: 'bus',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
    {
      id: 'activeBuses',
      title: 'Active Buses',
      value: schoolInfo.activeBuses,
      icon: 'bus',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'underMaintenance',
      title: 'Maintenance',
      value: schoolInfo.underMaintenance,
      icon: 'tools',
      color: '#ef4444',
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
        <ThemedText type="subtitle" style={[styles.statValue, { color: colors.text }]}>
          {item.value}
        </ThemedText>
        <ThemedText style={styles.statLabel}>
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
            {item.attendance}
          </ThemedText>
          <ThemedText style={styles.classValueLabel}>
            Attendance
          </ThemedText>
        </View>
        <View style={styles.valueContainer}>
          <ThemedText style={[styles.classValue, { color: '#10b981' }]}>
            {item.pass}
          </ThemedText>
          <ThemedText style={styles.classValueLabel}>
            Pass %
          </ThemedText>
        </View>
      </View>
    </View>
  )

  const handleClose = () => {
    onClose()
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
     
        {/* Header with School Name */}
        <LinearGradient
          colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleClose}
              >
                <FontAwesome5
                  name="chevron-left"
                  size={22}
                  color="#FFFFFF"
                  style={{ transform: [{ translateX: -1 }] }}
                />
              </TouchableOpacity>
              <View style={styles.schoolHeaderInfo}>
                <FontAwesome5 name="chart-bar" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText type="title" style={styles.schoolName}>
                  School Statistics
                </ThemedText>
              </View>
              <View style={{ width: 45 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
          </View>

          {/* 3. STAFF BREAKDOWN */}
          <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
            <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
              Staff Breakdown
            </ThemedText>
            <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statsRow}>
              {staffStatItems.map(item => renderStatItem(item, true))}
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
          </View>

          {/* 7. CLASS-WISE PERFORMANCE */}
          <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
            <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
              Class-wise Performance
            </ThemedText>
            <View style={[styles.sectionTitleDivider, { backgroundColor: colors.border }]} />
            <View style={{ paddingHorizontal: 8 }}>
              {schoolInfo.classPassPercentages.map(renderClassStatItem)}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}