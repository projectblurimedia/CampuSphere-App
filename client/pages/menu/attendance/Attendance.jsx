import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  FontAwesome5,
  Feather,
  MaterialIcons,
  Ionicons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Custom Dropdown Component
const CustomDropdown = ({
  value,
  items,
  onSelect,
  placeholder = "Select an option",
  style,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(
    items.find(item => item.value === value)?.label || placeholder
  )

  const handleSelect = (item) => {
    setSelectedLabel(item.label)
    onSelect(item.value)
    setIsOpen(false)
  }

  const dropdownStyles = {
    customDropdownContainer: {
      marginBottom: 12,
    },
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderLeftWidth: 3,
      borderRadius: 6,
      borderTopRightRadius: 22,
      borderBottomRightRadius: 22,
      paddingHorizontal: 12,
      height: 50,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderLeftColor: colors.primary,
      justifyContent: 'space-between',
    },
    dropdownSelectedText: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      color: value ? colors.text : colors.textSecondary,
    },
    dropdownList: {
      position: 'absolute',
      top: 52,
      left: 0,
      right: 0,
      borderWidth: 1,
      borderRadius: 8,
      borderTopWidth: 0,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      backgroundColor: colors.inputBackground,
      borderColor: colors.primary + '30',
      maxHeight: 200,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dropdownItemText: {
      fontSize: 15,
      flex: 1,
    },
  }

  return (
    <View style={[dropdownStyles.customDropdownContainer, style]}>
      <TouchableOpacity
        style={dropdownStyles.dropdownHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Feather name="chevron-down" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <ThemedText style={dropdownStyles.dropdownSelectedText}>
          {selectedLabel}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color={colors.primary} />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={dropdownStyles.dropdownList}>
          <ScrollView 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.value.toString()}
                style={[
                  dropdownStyles.dropdownItem,
                  {
                    backgroundColor: value === item.value ? colors.primary + '15' : 'transparent',
                    borderLeftWidth: value === item.value ? 2 : 0,
                    borderLeftColor: colors.primary,
                  }
                ]}
                onPress={() => handleSelect(item)}
              >
                <ThemedText style={[
                  dropdownStyles.dropdownItemText,
                  { 
                    color: value === item.value ? colors.primary : colors.text,
                    fontFamily: value === item.value ? 'Poppins-SemiBold' : 'Poppins-Medium'
                  }
                ]}>
                  {item.label}
                </ThemedText>
                {value === item.value && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// Static students data
const staticStudents = {
  '1': [
    { id: 1, name: 'John Doe', rollNo: '1' },
    { id: 2, name: 'Jane Smith', rollNo: '2' },
    { id: 3, name: 'Bob Johnson', rollNo: '3' },
    { id: 4, name: 'Alice Brown', rollNo: '4' },
    { id: 5, name: 'Charlie Wilson', rollNo: '5' },
    { id: 6, name: 'David Lee', rollNo: '6' },
    { id: 7, name: 'Emma Watson', rollNo: '7' },
    { id: 8, name: 'Frank Miller', rollNo: '8' },
    { id: 9, name: 'Grace Taylor', rollNo: '9' },
    { id: 10, name: 'Henry Clark', rollNo: '10' },
  ],
  '2': [
    { id: 11, name: 'David Lee', rollNo: '1' },
    { id: 12, name: 'Emma Watson', rollNo: '2' },
    { id: 13, name: 'Frank Miller', rollNo: '3' },
  ],
  '3': [
    { id: 14, name: 'Grace Taylor', rollNo: '1' },
    { id: 15, name: 'Henry Clark', rollNo: '2' },
  ],
}

export default function Attendance({ visible, onClose }) {
  const { colors } = useTheme()
  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [sessionType, setSessionType] = useState('morning')
  const [markAbsent, setMarkAbsent] = useState(false) // false = present (default)
  const [useManualInput, setUseManualInput] = useState(false)
  const [manualRollInput, setManualRollInput] = useState('')
  const [attendance, setAttendance] = useState({})

  const students = staticStudents[selectedClass] || []

  const classes = Array.from({ length: 12 }, (_, i) => ({
    label: `Class ${i + 1}`,
    value: `${i + 1}`
  }))

  const sessionTypes = [
    { label: 'Morning Session', value: 'morning' },
    { label: 'Afternoon Session', value: 'afternoon' },
    { label: 'Full Day', value: 'fullday' },
  ]

  const toggleAttendance = (studentId) => {
    const isPresent = attendance[studentId] || false
    setAttendance(prev => ({
      ...prev,
      [studentId]: !isPresent
    }))
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSave = () => {
    if (useManualInput && manualRollInput.trim() === '') {
      Alert.alert('Error', 'Please enter roll numbers')
      return
    }
    
    Alert.alert('Success', 'Attendance marked successfully!', [{ text: 'OK', onPress: onClose }])
    setAttendance({})
    setManualRollInput('')
    setUseManualInput(false)
    setMarkAbsent(false)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const processManualRollInput = () => {
    if (!manualRollInput.trim()) return []
    
    const numbers = manualRollInput.split(/[,\s]+/).filter(num => num.trim() !== '')
    const selectedStudents = students.filter(student => 
      numbers.includes(student.rollNo.toString())
    )
    
    return selectedStudents
  }

  const renderRealTimeRollPreview = () => {
    if (!useManualInput) return null
    
    const numbers = manualRollInput.split(/[,\s]+/).filter(num => num.trim() !== '')
    const previewStudents = students.filter(student => 
      numbers.some(num => student.rollNo.toString().startsWith(num))
    )
    
    if (previewStudents.length === 0) return null
    
    return (
      <View style={styles.previewContainer}>
        <ThemedText style={styles.previewTitle}>Matching Students ({previewStudents.length}):</ThemedText>
        {previewStudents.map((student) => (
          <View key={student.id} style={styles.previewItem}>
            <View style={[
              styles.rollNumberBadge,
              { backgroundColor: markAbsent ? '#fee2e2' : colors.primary + '20' }
            ]}>
              <ThemedText style={[
                styles.rollNumberText,
                { color: markAbsent ? '#dc2626' : colors.primary }
              ]}>#{student.rollNo}</ThemedText>
            </View>
            <ThemedText style={styles.studentName}>{student.name}</ThemedText>
          </View>
        ))}
      </View>
    )
  }

  const renderManualRollDetails = () => {
    const selectedStudents = processManualRollInput()
    
    if (selectedStudents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="clipboard" size={40} color={colors.textSecondary} />
          <ThemedText style={styles.emptyStateText}>
            Enter roll numbers separated by commas (e.g., 1, 3, 5)
          </ThemedText>
        </View>
      )
    }

    return (
      <View style={styles.selectedList}>
        <View style={styles.selectedHeader}>
          <View style={styles.statusBadge}>
            <Feather 
              name={markAbsent ? "x-circle" : "check-circle"} 
              size={16} 
              color={markAbsent ? "#dc2626" : "#16a34a"} 
            />
            <ThemedText style={[
              styles.selectedTitle,
              { color: markAbsent ? "#dc2626" : "#16a34a" }
            ]}>
              {markAbsent ? 'Absent' : 'Present'} Students ({selectedStudents.length})
            </ThemedText>
          </View>
        </View>
        {selectedStudents.map((student) => (
          <View key={student.id} style={styles.selectedItem}>
            <View style={styles.selectedItemLeft}>
              <View style={[
                styles.rollNumberBadge,
                { backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7' }
              ]}>
                <ThemedText style={[
                  styles.rollNumberText,
                  { color: markAbsent ? '#dc2626' : '#166534' }
                ]}>#{student.rollNo}</ThemedText>
              </View>
              <ThemedText style={styles.studentName}>{student.name}</ThemedText>
            </View>
            <View style={[
              styles.statusBadgeSmall,
              { backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7' }
            ]}>
              <Feather 
                name={markAbsent ? "x" : "check"} 
                size={14} 
                color={markAbsent ? "#dc2626" : "#16a34a"} 
              />
              <ThemedText style={[
                styles.statusText,
                { color: markAbsent ? "#dc2626" : "#16a34a" }
              ]}>
                {markAbsent ? 'Absent' : 'Present'}
              </ThemedText>
            </View>
          </View>
        ))}
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
    title: {
      fontSize: 18,
      color: '#FFFFFF',
      marginBottom: -5,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 160,
    },
    card: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formGroup: {
      marginBottom: 22,
    },
    groupTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary + '30',
    },
    groupTitleChip: {
      paddingHorizontal: 0,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    groupTitleText: {
      marginLeft: 8,
      fontSize: 16,
      color: colors.primary,
      letterSpacing: 0.5,
    },
    fieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      borderTopRightRadius: 22,
      borderBottomRightRadius: 22,
      marginBottom: 12,
      paddingHorizontal: 12,
      height: 50,
    },
    dateIcon: {
      marginRight: 10,
      color: colors.textSecondary,
    },
    dateText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
      fontFamily: 'Poppins-Medium',
    },
    modeContainer: {
      marginBottom: 16,
    },
    modeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    modeToggleContent: {
      flex: 1,
    },
    modeToggleTitle: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 4,
    },
    modeToggleSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    modeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      marginLeft: 12,
    },
    modeIndicatorText: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 4,
    },
    manualContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 2,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    manualToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: useManualInput ? 16 : 0,
    },
    manualToggleContent: {
      flex: 1,
    },
    manualToggleTitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    manualToggleSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    manualInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: markAbsent ? '#f87171' : colors.primary,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      borderTopRightRadius: 22,
      borderBottomRightRadius: 22,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      minHeight: 50,
    },
    manualInputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
    },
    manualInputHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    studentListContainer: {
      marginTop: 10,
    },
    studentCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 70,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rollNumberBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 12,
      borderWidth: 1,
    },
    rollNumberText: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
    },
    studentName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      flex: 1,
    },
    sessionBadge: {
      backgroundColor: sessionType === 'morning' ? '#fef3c7' : 
                     sessionType === 'afternoon' ? '#dbeafe' : '#dcfce7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    sessionBadgeText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      color: sessionType === 'morning' ? '#92400e' : 
             sessionType === 'afternoon' ? '#1e40af' : '#166534',
    },
    noStudentsText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 20,
      fontSize: 14,
    },
    selectedList: {
      marginTop: 16,
    },
    selectedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: markAbsent ? '#fca5a5' : '#86efac',
    },
    statusBadgeSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    selectedTitle: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 6,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 4,
    },
    selectedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    emptyStateText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 12,
      fontSize: 14,
      paddingHorizontal: 20,
    },
    previewContainer: {
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
    },
    previewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    footerWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      paddingTop: 8,
      backgroundColor: colors?.background,
    },
    footerCard: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    saveBtnGradient: {
      paddingVertical: 13,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      marginLeft: 8,
    },
  })

  const renderStudents = () => {
    if (useManualInput) {
      return (
        <>
          {renderManualRollDetails()}
          {renderRealTimeRollPreview()}
        </>
      )
    }

    if (students.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="users" size={40} color={colors.textSecondary} />
          <ThemedText style={styles.emptyStateText}>
            No students found for this class
          </ThemedText>
        </View>
      )
    }

    return students.map((student) => {
      const isPresent = attendance[student.id] || false
      const switchValue = markAbsent ? !isPresent : isPresent

      return (
        <View key={student.id} style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <View style={[
              styles.rollNumberBadge,
              { 
                backgroundColor: markAbsent ? '#fee2e2' : colors.primary + '20',
                borderColor: markAbsent ? '#fca5a5' : colors.primary + '40'
              }
            ]}>
              <ThemedText style={[
                styles.rollNumberText,
                { color: markAbsent ? '#dc2626' : colors.primary }
              ]}>#{student.rollNo}</ThemedText>
            </View>
            <ThemedText style={styles.studentName}>{student.name}</ThemedText>
            <View style={styles.sessionBadge}>
              <ThemedText style={styles.sessionBadgeText}>
                {sessionType === 'morning' ? 'Morning' : 
                 sessionType === 'afternoon' ? 'Afternoon' : 'Full Day'}
              </ThemedText>
            </View>
          </View>
          <Switch
            value={switchValue}
            onValueChange={() => toggleAttendance(student.id)}
            trackColor={{ false: colors.border, true: markAbsent ? '#f87171' : '#4ade80' }}
            thumbColor={'#ffffff'}
            ios_backgroundColor={colors.border}
          />
        </View>
      )
    })
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
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
                <ThemedText type='subtitle' style={styles.title}>Mark Attendance</ThemedText>
                <ThemedText style={styles.subtitle}>Track student presence</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.card}>
            {/* SELECTION DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="date-range" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>
                    Selection Details
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Select Date</ThemedText>
              <TouchableOpacity 
                style={styles.dateContainer}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Feather name="calendar" size={20} style={styles.dateIcon} />
                <ThemedText style={styles.dateText}>
                  {formatDate(selectedDate)}
                </ThemedText>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}
              </TouchableOpacity>

              <ThemedText style={styles.fieldLabel}>Select Class</ThemedText>
              <CustomDropdown
                value={selectedClass}
                items={classes}
                onSelect={setSelectedClass}
                placeholder="Select Class"
              />

              <ThemedText style={styles.fieldLabel}>Select Session</ThemedText>
              <CustomDropdown
                value={sessionType}
                items={sessionTypes}
                onSelect={setSessionType}
                placeholder="Select Session"
              />
            </View>

            {/* ATTENDANCE MODE */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <Feather name="edit-3" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>
                    Attendance Mode
                  </ThemedText>
                </View>
              </View>

              <View style={styles.modeContainer}>
                <TouchableOpacity 
                  style={styles.modeToggle}
                  onPress={() => setMarkAbsent(!markAbsent)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modeToggleContent}>
                    <ThemedText style={styles.modeToggleTitle}>
                      {markAbsent ? 'Mark Absent' : 'Mark Present'}
                    </ThemedText>
                    <ThemedText style={styles.modeToggleSubtitle}>
                      {markAbsent 
                        ? 'Select students who are absent' 
                        : 'Select students who are present'}
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.modeIndicator,
                    { backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7' }
                  ]}>
                    <Feather 
                      name={markAbsent ? "x-circle" : "check-circle"} 
                      size={16} 
                      color={markAbsent ? "#dc2626" : "#16a34a"} 
                    />
                    <ThemedText style={[
                      styles.modeIndicatorText,
                      { color: markAbsent ? "#dc2626" : "#16a34a" }
                    ]}>
                      {markAbsent ? 'Absent' : 'Present'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>

                {/* Manual Input Container */}
                <View style={styles.manualContainer}>
                  <View style={styles.manualToggle}>
                    <View style={styles.manualToggleContent}>
                      <ThemedText style={styles.manualToggleTitle}>
                        Enter Roll Numbers Manually
                      </ThemedText>
                      <ThemedText style={styles.manualToggleSubtitle}>
                        Enter specific roll numbers instead of selecting each student
                      </ThemedText>
                    </View>
                    <Switch
                      value={useManualInput}
                      onValueChange={(value) => {
                        setUseManualInput(value)
                        if (!value) {
                          setManualRollInput('')
                        }
                      }}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={'#ffffff'}
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                  
                  {useManualInput && (
                    <>
                      <ThemedText style={styles.manualInputLabel}>
                        {markAbsent ? 'Enter Absent Roll Numbers' : 'Enter Present Roll Numbers'}
                      </ThemedText>
                      <TextInput
                        style={styles.manualInput}
                        value={manualRollInput}
                        onChangeText={setManualRollInput}
                        placeholder={markAbsent ? "e.g., 1, 3, 5, 7 or 1-5" : "e.g., 2, 4, 6, 8 or 2-6"}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      <ThemedText style={styles.manualInputHint}>
                        Separate with commas (1, 3, 5) or use dash for range (1-5)
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* STUDENT ATTENDANCE - Only show when NOT using manual input */}
            {!useManualInput && (
              <View style={styles.formGroup}>
                <View style={styles.groupTitleContainer}>
                  <View style={styles.groupTitleChip}>
                    <Feather name="users" size={22} color={colors.primary} />
                    <ThemedText type='subtitle' style={styles.groupTitleText}>
                      {markAbsent ? 'Mark Students Absent' : 'Mark Students Present'} ({students.length} students)
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.studentListContainer}>
                  {renderStudents()}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* SAVE BUTTON */}
        <View style={styles.footerWrapper}>
          <View style={styles.footerCard}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.9}
                style={styles.saveBtnPressable}
              >
                <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                <ThemedText style={styles.saveBtnText}>Save Attendance</ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  )
}