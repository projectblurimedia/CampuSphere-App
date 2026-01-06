import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing,
  LayoutAnimation,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather, MaterialIcons, Entypo } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState, useRef } from 'react'

export default function Student({ student, onClose }) {
  const { colors } = useTheme()
  const [selectedYear, setSelectedYear] = useState(0) 
  const [showMarks, setShowMarks] = useState(true)
  const [showFees, setShowFees] = useState(true)
  const [showAttendance, setShowAttendance] = useState(true)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  
  const marksAnimation = useRef(new Animated.Value(1)).current
  const feesAnimation = useRef(new Animated.Value(1)).current
  const attendanceAnimation = useRef(new Animated.Value(1)).current
  const yearDropdownAnimation = useRef(new Animated.Value(0)).current

  // Static data for demo - Now includes attendance for each academic year
  const academicYears = [
    {
      id: 1,
      year: '2023-2024',
      class: '11th Grade',
      marks: {
        subjects: [
          { name: 'Mathematics', marks: 85, total: 100 },
          { name: 'Science', marks: 78, total: 100 },
          { name: 'English', marks: 92, total: 100 },
          { name: 'History', marks: 88, total: 100 },
          { name: 'Computer Science', marks: 95, total: 100 },
        ],
        total: 438,
        percentage: 87.6
      },
      fees: {
        total: 25000,
        paid: 25000,
        pending: 0,
        status: 'Paid'
      },
      attendance: {
        totalDays: 220,
        presentDays: 195,
        absentDays: 25,
        percentage: 88.64
      }
    },
    {
      id: 2,
      year: '2022-2023',
      class: '10th Grade',
      marks: {
        subjects: [
          { name: 'Mathematics', marks: 92, total: 100 },
          { name: 'Science', marks: 85, total: 100 },
          { name: 'English', marks: 88, total: 100 },
          { name: 'History', marks: 90, total: 100 },
          { name: 'Social Studies', marks: 87, total: 100 },
        ],
        total: 442,
        percentage: 88.4
      },
      fees: {
        total: 22000,
        paid: 22000,
        pending: 0,
        status: 'Paid'
      },
      attendance: {
        totalDays: 210,
        presentDays: 200,
        absentDays: 10,
        percentage: 95.24
      }
    },
    {
      id: 3,
      year: '2021-2022',
      class: '9th Grade',
      marks: {
        subjects: [
          { name: 'Mathematics', marks: 78, total: 100 },
          { name: 'Science', marks: 82, total: 100 },
          { name: 'English', marks: 85, total: 100 },
          { name: 'History', marks: 80, total: 100 },
          { name: 'Geography', marks: 88, total: 100 },
        ],
        total: 413,
        percentage: 82.6
      },
      fees: {
        total: 20000,
        paid: 18000,
        pending: 2000,
        status: 'Pending'
      },
      attendance: {
        totalDays: 200,
        presentDays: 175,
        absentDays: 25,
        percentage: 87.5
      }
    }
  ]

  const moreActions = [
    { id: 1, icon: 'edit', label: 'Edit Student', color: colors.primary },
    { id: 2, icon: 'addchart', label: 'Add Marks', color: colors.success },
    { id: 3, icon: 'attach-money', label: 'Update Fees', color: colors.warning },
    { id: 4, icon: 'assignment', label: 'View Reports', color: colors.info },
    { id: 5, icon: 'picture-as-pdf', label: 'Generate Report Card', color: colors.danger },
    { id: 6, icon: 'notifications', label: 'Send Notification', color: colors.tint },
    { id: 7, icon: 'person-remove', label: 'Student Completed', color: colors.textSecondary },
  ]

  const toggleMarks = () => {
    const toValue = showMarks ? 0 : 1
    Animated.timing(marksAnimation, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start()
    setShowMarks(!showMarks)
  }

  const toggleFees = () => {
    const toValue = showFees ? 0 : 1
    Animated.timing(feesAnimation, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start()
    setShowFees(!showFees)
  }

  const toggleAttendance = () => {
    const toValue = showAttendance ? 0 : 1
    Animated.timing(attendanceAnimation, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start()
    setShowAttendance(!showAttendance)
  }

  const toggleYearDropdown = () => {
    const toValue = showYearDropdown ? 0 : 1
    Animated.timing(yearDropdownAnimation, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start()
    setShowYearDropdown(!showYearDropdown)
  }

  const handleYearSelect = (index) => {
    setSelectedYear(index)
    // Reset all sections to be expanded when year changes
    setShowMarks(true)
    setShowFees(true)
    setShowAttendance(true)
    
    // Reset animations
    marksAnimation.setValue(1)
    feesAnimation.setValue(1)
    attendanceAnimation.setValue(1)
    
    toggleYearDropdown()
  }

  const handleMoreAction = (action) => {
    setShowMoreMenu(false)
    console.log(`Action: ${action.label}`)
    
    if (action.id === 7) { // Student Completed action
      // Add your logic for student completion here
      console.log('Student marked as completed for this school')
      // You can show an alert or navigate to another screen
    }
  }

  const dynamicStyles = {
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 15,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.border}30`,
    },
    marksSection: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      overflow: 'hidden',
    },
    feesSection: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      overflow: 'hidden',
    },
    attendanceSection: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    marksItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.border}20`,
    },
    feesStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: `${colors.background}80`,
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    attendanceStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: `${colors.background}80`,
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    moreMenu: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 120 : 100, 
      right: 20,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      width: 220,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
      zIndex: 9999,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.border}20`,
    },
  }

  const renderAvatar = () => {
    if (student.profilePic) {
      return (
        <Image source={{ uri: student.profilePic }} style={styles.studentAvatar} />
      )
    }
    
    return (
      <LinearGradient
        colors={[colors.primary, colors.tint]}
        style={styles.studentAvatar}
      >
        <ThemedText style={[styles.avatarText, { color: '#fff' }]}>
          {student.name.charAt(0).toUpperCase()}
        </ThemedText>
      </LinearGradient>
    )
  }

  const renderFeesStatus = () => {
    const isPaid = student.fees === 'Paid'
    return (
      <View style={[
        styles.statusBadge, 
        { 
          backgroundColor: isPaid ? `${colors.success}15` : `${colors.warning}15`,
          borderColor: isPaid ? colors.success : colors.warning
        }
      ]}>
        <Ionicons 
          name={isPaid ? "checkmark-circle" : "alert-circle"} 
          size={16} 
          color={isPaid ? colors.success : colors.warning} 
          style={styles.badgeIcon}
        />
        <ThemedText style={{ 
          fontSize: 14, 
          fontWeight: '600',
          color: isPaid ? colors.success : colors.warning,
          marginLeft: 8
        }}>
          {student.fees}
        </ThemedText>
      </View>
    )
  }

  const renderYearDropdown = () => (
    <View style={[styles.dropdownContainer, { marginBottom: 16 }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.dropdownScroll}
        nestedScrollEnabled
      >
        {academicYears.map((year, index) => (
          <TouchableOpacity
            key={year.id}
            style={[
              dynamicStyles.dropdownOption,
              index === selectedYear && { backgroundColor: `${colors.primary}15` }
            ]}
            onPress={() => handleYearSelect(index)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[
                styles.timelineDot,
                { 
                  backgroundColor: index === selectedYear ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                  marginRight: 12
                }
              ]} />
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.yearText, { color: colors.text }]}>{year.year}</ThemedText>
                <ThemedText style={[styles.classText, { color: colors.textSecondary }]}>{year.class}</ThemedText>
              </View>
            </View>
            {index === selectedYear && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderMarksSection = () => {
    const year = academicYears[selectedYear]
    
    return (
      <View style={dynamicStyles.marksSection}>
        <TouchableOpacity 
          style={dynamicStyles.sectionHeader}
          onPress={toggleMarks}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="school-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Marks Details</ThemedText>
          </View>
          <Animated.View style={{ 
            transform: [{
              rotate: marksAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })
            }]
          }}>
            <Feather name="chevron-down" size={24} color={colors.primary} />
          </Animated.View>
        </TouchableOpacity>
        
        {showMarks && (
          <View style={{ paddingBottom: 8 }}>
            <View style={{ paddingHorizontal: 16 }}>
              {year.marks.subjects.map((subject, index) => (
                <View key={index} style={dynamicStyles.marksItem}>
                  <ThemedText style={[styles.marksLabel, { color: colors.textSecondary }]}>
                    {subject.name}
                  </ThemedText>
                  <ThemedText style={[styles.marksValue, { color: colors.text }]}>
                    {subject.marks}/{subject.total}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.totalContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText style={[styles.totalLabel, { color: colors.text }]}>Total Marks</ThemedText>
                  <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
                    {year.marks.total}/{year.marks.subjects.length * 100}
                  </ThemedText>
                </View>
                <View style={styles.percentageContainer}>
                  <ThemedText style={[styles.percentageText, { color: colors.success }]}>
                    {year.marks.percentage}%
                  </ThemedText>
                  <ThemedText style={[styles.percentageLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                    Overall Percentage
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderFeesSection = () => {
    const year = academicYears[selectedYear]
    
    return (
      <View style={dynamicStyles.feesSection}>
        <TouchableOpacity 
          style={dynamicStyles.sectionHeader}
          onPress={toggleFees}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="attach-money" size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Fees Details</ThemedText>
          </View>
          <Animated.View style={{ 
            transform: [{
              rotate: feesAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })
            }]
          }}>
            <Feather name="chevron-down" size={24} color={colors.primary} />
          </Animated.View>
        </TouchableOpacity>
        
        {showFees && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={dynamicStyles.feesStatus}>
              <View>
                <ThemedText style={[styles.feesLabel, { color: colors.textSecondary }]}>Total Fees</ThemedText>
                <ThemedText style={[styles.feesValue, { color: colors.text }]}>₹{year.fees.total}</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={[styles.feesLabel, { color: colors.textSecondary }]}>Paid</ThemedText>
                <ThemedText style={[styles.feesValue, { color: colors.success }]}>₹{year.fees.paid}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={[styles.feesLabel, { color: colors.textSecondary }]}>Pending</ThemedText>
                <ThemedText style={[
                  styles.feesValue, 
                  { color: year.fees.pending > 0 ? colors.warning : colors.success }
                ]}>
                  ₹{year.fees.pending}
                </ThemedText>
              </View>
            </View>
            <View style={{ 
              backgroundColor: year.fees.status === 'Paid' ? `${colors.success}15` : `${colors.warning}15`,
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons 
                name={year.fees.status === 'Paid' ? "checkmark-circle" : "time"} 
                size={16} 
                color={year.fees.status === 'Paid' ? colors.success : colors.warning} 
              />
              <ThemedText style={[
                styles.feesStatusText,
                { 
                  color: year.fees.status === 'Paid' ? colors.success : colors.warning,
                  marginLeft: 8
                }
              ]}>
                Status: {year.fees.status}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderAttendanceSection = () => {
    const year = academicYears[selectedYear]
    
    return (
      <View style={dynamicStyles.attendanceSection}>
        <TouchableOpacity 
          style={dynamicStyles.sectionHeader}
          onPress={toggleAttendance}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="calendar" size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Attendance Details</ThemedText>
          </View>
          <Animated.View style={{ 
            transform: [{
              rotate: attendanceAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })
            }]
          }}>
            <Feather name="chevron-down" size={24} color={colors.primary} />
          </Animated.View>
        </TouchableOpacity>
        
        {showAttendance && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={dynamicStyles.attendanceStats}>
              <View>
                <ThemedText style={[styles.feesLabel, { color: colors.textSecondary }]}>Total Days</ThemedText>
                <ThemedText style={[styles.feesValue, { color: colors.text }]}>{year.attendance.totalDays}</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={[styles.feesLabel, { color: colors.textSecondary }]}>Present</ThemedText>
                <ThemedText style={[styles.feesValue, { color: colors.success }]}>{year.attendance.presentDays}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={[styles.feesLabel, { color: colors.textSecondary }]}>Absent</ThemedText>
                <ThemedText style={[
                  styles.feesValue, 
                  { color: year.attendance.absentDays > 15 ? colors.warning : colors.success }
                ]}>
                  {year.attendance.absentDays}
                </ThemedText>
              </View>
            </View>
            <View style={{ 
              backgroundColor: year.attendance.percentage > 85 ? `${colors.success}15` : `${colors.warning}15`,
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Feather 
                name={year.attendance.percentage > 85 ? "trending-up" : "trending-down"} 
                size={16} 
                color={year.attendance.percentage > 85 ? colors.success : colors.warning} 
              />
              <ThemedText style={[
                styles.feesStatusText,
                { 
                  color: year.attendance.percentage > 85 ? colors.success : colors.warning,
                  marginLeft: 8
                }
              ]}>
                Attendance Rate: {year.attendance.percentage}%
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderMoreMenu = () => (
    <View style={dynamicStyles.moreMenu}>
      {moreActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={dynamicStyles.menuItem}
          onPress={() => handleMoreAction(action)}
          activeOpacity={0.7}
        >
          <MaterialIcons name={action.icon} size={20} color={action.color} style={{ marginRight: 12 }} />
          <ThemedText style={[
            styles.menuItemText, 
            { 
              color: action.id === 7 ? colors.textSecondary : colors.text, 
              flex: 1 
            }
          ]}>
            {action.label}
          </ThemedText>
          <Feather name="chevron-right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  )

  const styles = StyleSheet.create({
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
    moreButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      position: 'relative',
      zIndex: 1,
    },
    headerTitle: {
      flex: 1,
      alignItems: 'center',
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
    contentContainer: {
      padding: 20,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    studentAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarText: {
      fontSize: 40,
      fontWeight: '700',
    },
    studentName: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    rollNo: {
      fontSize: 16,
      marginBottom: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 25,
      borderWidth: 1,
    },
    badgeIcon: {
      marginRight: 4,
    },
    detailsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    subSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    infoRow: {
      gap: 12,
    },
    infoItem: {}, 
    infoText: {
      marginLeft: 12,
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
    },
    yearText: {
      fontSize: 14,
      fontWeight: '600',
    },
    classText: {
      fontSize: 12,
      fontWeight: '500',
    },
    marksLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    marksValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    totalContainer: {
      backgroundColor: `${colors.background}80`,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    totalLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
    totalValue: {
      fontSize: 15,
      fontWeight: '700',
    },
    percentageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 10,
    },
    percentageText: {
      fontSize: 14,
      fontWeight: '700',
    },
    percentageLabel: {
      fontSize: 12,
      fontWeight: '500',
    },
    feesLabel: {
      fontSize: 12,
      fontWeight: '500',
    },
    feesValue: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: 2,
    },
    feesStatusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    dropdownContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownScroll: {
      maxHeight: 300,
    },
    sectionContent: {
      flex: 1,
    },
    menuItemText: {
      fontSize: 14,
      fontWeight: '500',
    },
  })

  const handleMoreActions = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  return (
    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
    
      <LinearGradient
        colors={[colors?.gradientStart, colors?.gradientEnd]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              activeOpacity={0.9}
            >
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <ThemedText type="title" style={styles.title}>
                Student Details
              </ThemedText>
            </View>
            
            <TouchableOpacity
              style={styles.moreButton}
              onPress={handleMoreActions}
              activeOpacity={0.9}
            >
              <Entypo name="dots-three-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <View style={styles.avatarSection}>
            {renderAvatar()}
            <ThemedText style={[styles.studentName, { color: colors.text }]}>{student.name}</ThemedText>
            <ThemedText style={[styles.rollNo, { color: colors.textSecondary }]}>
              Roll No: {student.rollNo}
            </ThemedText>
            {renderFeesStatus()}
          </View>

          {/* Divider */}
          <View style={dynamicStyles.divider} />

          {/* Student Details Section */}
          <View style={styles.detailsSection}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 16 }]}>
              Academic Info
            </ThemedText>
            <View style={styles.infoRow}>
              <View style={[styles.infoItem, dynamicStyles.infoItem]}>
                <Ionicons name="school-outline" size={18} color={colors.primary} />
                <View style={styles.infoText}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Class</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{student.class}</ThemedText>
                </View>
              </View>
              <View style={[styles.infoItem, dynamicStyles.infoItem]}>
                <Feather name="calendar" size={18} color={colors.primary} />
                <View style={styles.infoText}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Attendance</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{student.attendance}</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Parent Details Section */}
          {(student.parent || student.contact) && (
            <View style={styles.detailsSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 16 }]}>
                Parent Info
              </ThemedText>
              <View style={styles.infoRow}>
                {student.parent && (
                  <View style={[styles.infoItem, dynamicStyles.infoItem]}>
                    <Ionicons name="person-outline" size={18} color={colors.primary} />
                    <View style={styles.infoText}>
                      <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Parent Name</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: colors.text }]}>{student.parent}</ThemedText>
                    </View>
                  </View>
                )}
                {student.contact && (
                  <View style={[styles.infoItem, dynamicStyles.infoItem]}>
                    <Feather name="phone" size={18} color={colors.primary} />
                    <View style={styles.infoText}>
                      <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Contact</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: colors.text }]}>{student.contact}</ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={dynamicStyles.divider} />

          {/* Academic Year Selector */}
          <View style={styles.detailsSection}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 16 }]}>
              Academic Details
            </ThemedText>
            
            {/* Year Selection Dropdown */}
            <TouchableOpacity 
              style={dynamicStyles.dropdownButton}
              onPress={toggleYearDropdown}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <View>
                  <ThemedText style={[styles.yearText, { color: colors.text }]}>
                    {academicYears[selectedYear].year}
                  </ThemedText>
                  <ThemedText style={[styles.classText, { color: colors.textSecondary }]}>
                    {academicYears[selectedYear].class}
                  </ThemedText>
                </View>
              </View>
              <Animated.View style={{ 
                transform: [{
                  rotate: yearDropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}>
                <Feather name="chevron-down" size={24} color={colors.primary} />
              </Animated.View>
            </TouchableOpacity>

            {/* Year Dropdown */}
            {showYearDropdown && renderYearDropdown()}

            {/* Marks, Fees, and Attendance Sections for Selected Year */}
            {renderMarksSection()}
            {renderAttendanceSection()}
            {renderFeesSection()}
          </View>
        </View>
      </ScrollView>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMoreMenu(false)}
            activeOpacity={1}
          />
          {renderMoreMenu()}
        </>
      )}
    </View>
  )
}