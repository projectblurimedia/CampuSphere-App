import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Keyboard,
  ActivityIndicator,
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
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

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

// Custom Confirmation Modal Component
const OverrideConfirmationModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  markedCount, 
  date, 
  sessionType 
}) => {
  const { colors } = useTheme()
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '90%',
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    warningIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#fee2e2',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fca5a5',
    },
    title: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
      marginBottom: 12,
      color: '#dc2626',
    },
    message: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.text,
      lineHeight: 22,
    },
    details: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    warningText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#dc2626',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#ffffff',
    },
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getSessionLabel = (type) => {
    switch(type) {
      case 'morning': return 'Morning Session'
      case 'afternoon': return 'Afternoon Session'
      case 'fullday': return 'Full Day'
      default: return type
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.warningIcon}>
              <Feather name="alert-triangle" size={30} color="#dc2626" />
            </View>
          </View>
          
          <ThemedText style={styles.title}>Attendance Already Exists</ThemedText>
          
          <ThemedText style={styles.message}>
            Attendance for {getSessionLabel(sessionType)} on {formatDate(date)} already exists for {markedCount} students.
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: '#dc2626', fontFamily: 'Poppins-SemiBold' }]}>
            Do you want to override?
          </ThemedText>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Session:</ThemedText>
              <ThemedText style={styles.detailValue}>{getSessionLabel(sessionType)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDate(date)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Marked Students:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: '#dc2626' }]}>{markedCount} students</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.warningText}>
            This action will replace existing attendance records
          </ThemedText>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.confirmButtonText}>Override</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function Attendance({ visible, onClose }) {
  const { colors } = useTheme()
  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [sessionType, setSessionType] = useState('morning')
  const [markAbsent, setMarkAbsent] = useState(false)
  const [useManualInput, setUseManualInput] = useState(false)
  const [manualRollInput, setManualRollInput] = useState('')
  const [attendance, setAttendance] = useState({})
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [attendanceExists, setAttendanceExists] = useState(null)
  const [toast, setToast] = useState(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideData, setOverrideData] = useState(null)

  // Toast notification functions
  const showToast = (message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }

  const hideToast = () => {
    setToast(null)
  }

  const academicYears = [
    { label: '2024-2025', value: '2024-2025' },
    { label: '2023-2024', value: '2023-2024' },
    { label: '2022-2023', value: '2022-2023' },
  ]

  const classSections = {
    '1': ['A', 'B'],
    '2': ['A', 'B'],
    '3': ['A', 'B', 'C'],
    '4': ['A', 'B'],
    '5': ['A', 'B', 'C'],
    '6': ['A', 'B'],
    '7': ['A', 'B', 'C'],
    '8': ['A', 'B'],
    '9': ['A', 'B'],
    '10': ['A', 'B'],
    '11': ['A', 'B'],
    '12': ['A', 'B'],
  }

  const classes = Array.from({ length: 12 }, (_, i) => ({
    label: `Class ${i + 1}`,
    value: `${i + 1}`
  }))

  const sections = classSections[selectedClass]?.map(section => ({
    label: `Section ${section}`,
    value: section
  })) || []

  const sessionTypes = [
    { label: 'Morning Session', value: 'morning' },
    { label: 'Afternoon Session', value: 'afternoon' },
    { label: 'Full Day', value: 'fullday' },
  ]

  const fetchStudents = async (className, section, year) => {
    if (!className || !section || !year) {
      setStudents([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await axiosApi.get('/attendance/students', {
        params: {
          className,
          section,
          academicYear: year
        }
      })

      if (response.data.success) {
        const formattedStudents = response.data.data.map(student => ({
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          admissionNumber: student.admissionNumber
        }))
        setStudents(formattedStudents)
        // Initialize all students as false (OFF) regardless of mode
        const initialAttendance = {}
        formattedStudents.forEach(student => {
          initialAttendance[student.id] = false
        })
        setAttendance(initialAttendance)
        showToast(`${formattedStudents.length} students loaded`, 'success', 2000)
      } else {
        const errorMsg = response.data.message || 'Failed to fetch students'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        setStudents([])
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      const errorMsg = err.response?.data?.message || 'Network error. Please try again.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const checkAttendanceExists = async () => {
    if (!selectedClass || !selectedSection || !selectedDate || !sessionType) return

    try {
      // Create a UTC date at midnight
      const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0, 0, 0, 0
      ))
      
      const response = await axiosApi.get('/attendance/check', {
        params: {
          date: utcDate.toISOString(), // Send UTC date
          className: selectedClass,
          section: selectedSection,
          academicYear,
          session: sessionType
        }
      })

      if (response.data.success) {
        setAttendanceExists(response.data.data)
        if (response.data.data.exists) {
          loadExistingAttendance(response.data.data)
          showToast('Existing attendance found', 'warning', 2000)
        } else {
          // Initialize all students as false (OFF)
          const initialAttendance = {}
          students.forEach(student => {
            initialAttendance[student.id] = false
          })
          setAttendance(initialAttendance)
        }
      }
    } catch (err) {
      console.error('Error checking attendance:', err)
      // Log the full error response for debugging
      console.error('Error response:', err.response?.data)
      showToast('Failed to check existing attendance', 'error')
    }
  }

  const loadExistingAttendance = (existingData) => {
    const newAttendance = {}
    
    existingData.markedStudents.forEach(markedStudent => {
      let isPresent = false
      
      if (sessionType === 'fullday') {
        isPresent = markedStudent.morning === true && markedStudent.afternoon === true
      } else {
        isPresent = markedStudent[sessionType] === true
      }
      
      // Set switch to ON if student matches the current mode
      if (markAbsent) {
        // In "Mark Absent" mode, switch ON = absent
        newAttendance[markedStudent.studentId] = !isPresent
      } else {
        // In "Mark Present" mode, switch ON = present
        newAttendance[markedStudent.studentId] = isPresent
      }
    })
    
    // Fill in any missing students as false (OFF)
    students.forEach(student => {
      if (!(student.id in newAttendance)) {
        newAttendance[student.id] = false
      }
    })
    
    setAttendance(newAttendance)
  }

  useEffect(() => {
    if (selectedClass && selectedSection && academicYear) {
      fetchStudents(selectedClass, selectedSection, academicYear)
    }
  }, [selectedClass, selectedSection, academicYear])

  useEffect(() => {
    if (selectedClass && selectedSection && selectedDate && sessionType && academicYear) {
      checkAttendanceExists()
    }
  }, [selectedClass, selectedSection, selectedDate, sessionType, academicYear])

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSave = async () => {
    if (useManualInput && manualRollInput.trim() === '') {
      showToast('Please enter roll numbers', 'error')
      return
    }

    if (students.length === 0) {
      showToast('No students found to mark attendance', 'error')
      return
    }
    
    let attendanceData = {}
    
    if (useManualInput) {
      const selectedStudents = processManualRollInput()
      const allStudentIds = students.map(s => s.id)
      const selectedStudentIds = selectedStudents.map(s => s.id)
      
      allStudentIds.forEach(studentId => {
        if (selectedStudentIds.includes(studentId)) {
          // Selected students get the status based on markAbsent mode
          attendanceData[studentId] = markAbsent ? 'absent' : 'present'
        } else {
          // Unselected students get the opposite status
          attendanceData[studentId] = markAbsent ? 'present' : 'absent'
        }
      })
    } else {
      // Use the current attendance state
      students.forEach(student => {
        const isSwitchOn = attendance[student.id] || false
        if (markAbsent) {
          // In "Mark Absent" mode: switch ON = absent, switch OFF = present
          attendanceData[student.id] = isSwitchOn ? 'absent' : 'present'
        } else {
          // In "Mark Present" mode: switch ON = present, switch OFF = absent
          attendanceData[student.id] = isSwitchOn ? 'present' : 'absent'
        }
      })
    }

    // Prepare student attendance array for backend
    const studentAttendance = Object.entries(attendanceData).map(([studentId, status]) => ({
      studentId: studentId.toString(),
      status: status
    }))
    
    setSaving(true)
    
    try {
      const response = await axiosApi.post('/attendance/mark', {
        date: selectedDate.toISOString(),
        academicYear,
        className: selectedClass,
        section: selectedSection,
        session: sessionType,
        studentAttendance
      })

      if (response.data.success) {
        showToast(`Attendance marked for ${response.data.data.markedCount} student${response.data.data.markedCount > 1 ? 's' : ''}`, 'success')
        setTimeout(() => {
          setManualRollInput('')
          setUseManualInput(false)
          setAttendanceExists(null)
          onClose()
        }, 1500)
      } else {
        showToast(response.data.message || 'Failed to save attendance', 'error')
      }
    } catch (error) {
      if (error.response?.data?.canOverride) {
        // Show override confirmation modal instead of alert
        setOverrideData({
          studentAttendance,
          markedCount: error.response.data.data.totalMarked,
          date: selectedDate.toISOString(),
          sessionType
        })
        setShowOverrideModal(true)
      } else {
        showToast(
          error.response?.data?.message || 'Failed to save attendance. Please try again.',
          'error'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleOverrideConfirm = async () => {
    if (!overrideData) return
    
    setSaving(true)
    setShowOverrideModal(false)
    
    try {
      const response = await axiosApi.put('/attendance/override', {
        date: selectedDate.toISOString(),
        academicYear,
        className: selectedClass,
        section: selectedSection,
        session: sessionType,
        studentAttendance: overrideData.studentAttendance
      })

      if (response.data.success) {
        showToast(`Attendance overridden for ${response.data.data.markedCount} student${response.data.data.markedCount > 1 ? 's' : ''}`, 'success')
        setTimeout(() => {
          setManualRollInput('')
          setUseManualInput(false)
          setAttendanceExists(null)
          onClose()
        }, 1500)
      } else {
        showToast(response.data.message || 'Failed to override attendance', 'error')
      }
    } catch (error) {
      console.error('Error overriding attendance:', error)
      showToast(
        error.response?.data?.message || 'Failed to override attendance. Please try again.',
        'error'
      )
    } finally {
      setSaving(false)
      setOverrideData(null)
    }
  }

  const handleOverrideCancel = () => {
    setShowOverrideModal(false)
    setOverrideData(null)
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
    
    const inputParts = manualRollInput.split(/[,\s]+/)
    const selectedRollNumbers = []
    
    inputParts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(num => parseInt(num.trim()))
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            selectedRollNumbers.push(i.toString())
          }
        }
      } else {
        const num = part.trim()
        if (num) {
          selectedRollNumbers.push(num)
        }
      }
    })
    
    const selectedStudents = students.filter(student => 
      selectedRollNumbers.includes(student.rollNo.toString())
    )
    
    return selectedStudents
  }

  const renderRealTimeRollPreview = () => {
    if (!useManualInput || !manualRollInput.trim()) return null
    
    const inputParts = manualRollInput.split(/[,\s]+/)
    const previewRollNumbers = []
    
    inputParts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(num => parseInt(num.trim()))
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= Math.min(end, start + 5); i++) {
            previewRollNumbers.push(i.toString())
          }
        }
      } else {
        const num = part.trim()
        if (num) {
          previewRollNumbers.push(num)
        }
      }
    })
    
    const previewStudents = students.filter(student => 
      previewRollNumbers.some(num => student.rollNo.toString().startsWith(num))
    )
    
    if (previewStudents.length === 0) return null
    
    return (
      <View style={styles.previewContainer}>
        <ThemedText style={styles.previewTitle}>Matching Students ({previewStudents.length}):</ThemedText>
        {previewStudents.map((student) => (
          <View key={student.id} style={styles.previewItem}>
            <View style={[
              styles.rollNumberBadge,
              { 
                backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7',
                borderColor: markAbsent ? '#fca5a5' : '#86efac'
              }
            ]}>
              <ThemedText style={[
                styles.rollNumberText,
                { color: markAbsent ? '#dc2626' : '#16a34a' }
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
            Enter roll numbers separated by commas (e.g., 1, 3, 5) or range (e.g., 1-5)
          </ThemedText>
          <ThemedText style={[styles.emptyStateText, { fontSize: 12, marginTop: 8 }]}>
            {markAbsent 
              ? 'Entered roll numbers will be marked as ABSENT, others as PRESENT'
              : 'Entered roll numbers will be marked as PRESENT, others as ABSENT'
            }
          </ThemedText>
        </View>
      )
    }

    const totalStudents = students.length
    const selectedCount = selectedStudents.length
    const otherCount = totalStudents - selectedCount

    return (
      <View style={styles.selectedList}>
        <View style={styles.selectedHeader}>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7',
              borderColor: markAbsent ? '#fca5a5' : '#86efac'
            }
          ]}>
            <Feather 
              name={markAbsent ? "x-circle" : "check-circle"} 
              size={16} 
              color={markAbsent ? "#dc2626" : "#16a34a"} 
            />
            <ThemedText style={[
              styles.selectedTitle,
              { color: markAbsent ? "#dc2626" : "#16a34a" }
            ]}>
              {markAbsent ? 'Absent' : 'Present'} Students ({selectedCount})
            </ThemedText>
          </View>
          <View style={[
            styles.statusBadge, 
            { 
              marginLeft: 8, 
              backgroundColor: markAbsent ? '#dcfce7' : '#fee2e2',
              borderColor: markAbsent ? '#86efac' : '#fca5a5'
            }
          ]}>
            <Feather 
              name={markAbsent ? "check-circle" : "x-circle"} 
              size={16} 
              color={markAbsent ? "#16a34a" : "#dc2626"} 
            />
            <ThemedText style={[
              styles.selectedTitle,
              { color: markAbsent ? "#16a34a" : "#dc2626" }
            ]}>
              {markAbsent ? 'Present' : 'Absent'} Students ({otherCount})
            </ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.sectionTitle}>Selected Students:</ThemedText>
        {selectedStudents.map((student) => (
          <View key={student.id} style={styles.selectedItem}>
            <View style={styles.selectedItemLeft}>
              <View style={[
                styles.rollNumberBadge,
                { 
                  backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7',
                  borderColor: markAbsent ? '#fca5a5' : '#86efac'
                }
              ]}>
                <ThemedText style={[
                  styles.rollNumberText,
                  { color: markAbsent ? '#dc2626' : '#16a34a' }
                ]}>#{student.rollNo}</ThemedText>
              </View>
              <ThemedText style={styles.studentName}>{student.name}</ThemedText>
            </View>
            <View style={[
              styles.statusBadgeSmall,
              { 
                backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7',
                borderColor: markAbsent ? '#fca5a5' : '#86efac'
              }
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

  const handleMarkAbsentToggle = (value) => {
    setMarkAbsent(value)
    // Reset all switches to OFF when mode changes
    const newAttendance = {}
    students.forEach(student => {
      newAttendance[student.id] = false
    })
    setAttendance(newAttendance)
    setManualRollInput('')
  }

  useEffect(() => {
    // Reset attendance when class, section, etc changes
    const newAttendance = {}
    students.forEach(student => {
      newAttendance[student.id] = false
    })
    setAttendance(newAttendance)
    setManualRollInput('')
    setAttendanceExists(null)
  }, [selectedClass, selectedSection, academicYear, sessionType])

  const renderAttendanceStatus = () => {
    if (!attendanceExists) return null
    
    if (attendanceExists.exists) {
      return (
        <View style={styles.existingAttendanceContainer}>
          <View style={[styles.existingAttendanceBadge, { backgroundColor: '#fef3c7' }]}>
            <Feather name="alert-triangle" size={16} color="#92400e" />
            <ThemedText style={[styles.existingAttendanceText, { color: '#92400e' }]}>
              Attendance already marked for {attendanceExists.totalMarked}/{attendanceExists.totalStudents} students
            </ThemedText>
          </View>
          <ThemedText style={styles.existingAttendanceNote}>
            You can override by submitting again
          </ThemedText>
        </View>
      )
    }
    
    return null
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
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    halfWidth: {
      width: '48%',
    },
    fullWidth: {
      width: '100%',
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
      borderWidth: 1,
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
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    noStudentsText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 20,
      fontSize: 14,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    errorText: {
      textAlign: 'center',
      color: '#dc2626',
      marginTop: 12,
      fontSize: 14,
      paddingHorizontal: 20,
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
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
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
    sectionTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
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
    existingAttendanceContainer: {
      marginTop: 16,
      marginBottom: 16,
    },
    existingAttendanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fbbf24',
    },
    existingAttendanceText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 8,
      flex: 1,
    },
    existingAttendanceNote: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      marginLeft: 4,
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnPressable: {
      flex: 1,
      width: '100%',
      height: '100%',
      paddingVertical: 13,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      marginLeft: 8,
    },
    academicYearContainer: {
      marginTop: 12,
    },
    academicYearLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
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

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>
            Loading students...
          </ThemedText>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={40} color="#dc2626" />
          <ThemedText style={styles.errorText}>
            {error}
          </ThemedText>
        </View>
      )
    }

    if (students.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="users" size={40} color={colors.textSecondary} />
          <ThemedText style={styles.noStudentsText}>
            No students found for {selectedClass}-{selectedSection}
          </ThemedText>
        </View>
      )
    }

    return students.map((student) => {
      const isSwitchOn = attendance[student.id] || false
      
      // Determine status based on mode and switch position
      let status = 'absent'
      let statusColor = '#dc2626'
      let backgroundColor = '#fee2e2'
      let borderColor = '#fca5a5'
      
      if (markAbsent) {
        // In "Mark Absent" mode: switch ON = absent
        status = isSwitchOn ? 'absent' : 'present'
        if (isSwitchOn) {
          statusColor = '#dc2626'
          backgroundColor = '#fee2e2'
          borderColor = '#fca5a5'
        } else {
          statusColor = '#16a34a'
          backgroundColor = '#dcfce7'
          borderColor = '#86efac'
        }
      } else {
        // In "Mark Present" mode: switch ON = present
        status = isSwitchOn ? 'present' : 'absent'
        if (isSwitchOn) {
          statusColor = '#16a34a'
          backgroundColor = '#dcfce7'
          borderColor = '#86efac'
        } else {
          statusColor = '#dc2626'
          backgroundColor = '#fee2e2'
          borderColor = '#fca5a5'
        }
      }

      return (
        <View key={student.id} style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <View style={[
              styles.rollNumberBadge,
              { 
                backgroundColor,
                borderColor
              }
            ]}>
              <ThemedText style={[
                styles.rollNumberText,
                { color: statusColor }
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
            value={isSwitchOn}
            onValueChange={() => toggleAttendance(student.id)}
            trackColor={{ 
              false: colors.border, 
              true: markAbsent ? '#f87171' : '#4ade80' 
            }}
            thumbColor={'#ffffff'}
            ios_backgroundColor={colors.border}
          />
        </View>
      )
    })
  }

  return (
    <>
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

                <View style={styles.rowContainer}>
                  <View style={styles.halfWidth}>
                    <ThemedText style={styles.fieldLabel}>Class</ThemedText>
                    <CustomDropdown
                      value={selectedClass}
                      items={classes}
                      onSelect={setSelectedClass}
                      placeholder="Select Class"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <ThemedText style={styles.fieldLabel}>Section</ThemedText>
                    <CustomDropdown
                      value={selectedSection}
                      items={sections}
                      onSelect={setSelectedSection}
                      placeholder="Select Section"
                    />
                  </View>
                </View>

                <View style={styles.academicYearContainer}>
                  <ThemedText style={styles.fieldLabel}>Academic Year</ThemedText>
                  <CustomDropdown
                    value={academicYear}
                    items={academicYears}
                    onSelect={setAcademicYear}
                    placeholder="Select Academic Year"
                  />
                </View>

                <ThemedText style={styles.fieldLabel}>Select Session</ThemedText>
                <CustomDropdown
                  value={sessionType}
                  items={sessionTypes}
                  onSelect={setSessionType}
                  placeholder="Select Session"
                />
              </View>

              {renderAttendanceStatus()}

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
                    onPress={() => handleMarkAbsentToggle(!markAbsent)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modeToggleContent}>
                      <ThemedText style={styles.modeToggleTitle}>
                        {markAbsent ? 'Mark Absent' : 'Mark Present'}
                      </ThemedText>
                      <ThemedText style={styles.modeToggleSubtitle}>
                        {markAbsent 
                          ? 'Toggle switches ON for ABSENT students' 
                          : 'Toggle switches ON for PRESENT students'}
                      </ThemedText>
                    </View>
                    <View style={[
                      styles.modeIndicator,
                      { 
                        backgroundColor: markAbsent ? '#fee2e2' : '#dcfce7',
                        borderColor: markAbsent ? '#fca5a5' : '#86efac'
                      }
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
                          {markAbsent 
                            ? 'Enter Roll Numbers for ABSENT Students (others will be PRESENT)' 
                            : 'Enter Roll Numbers for PRESENT Students (others will be ABSENT)'}
                        </ThemedText>
                        <TextInput
                          style={styles.manualInput}
                          value={manualRollInput}
                          onChangeText={setManualRollInput}
                          placeholder={markAbsent 
                            ? "e.g., 1, 3, 5, 7 or 1-5 (These will be ABSENT)" 
                            : "e.g., 2, 4, 6, 8 or 2-6 (These will be PRESENT)"}
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numbers-and-punctuation"
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                          multiline={true}
                        />
                        <ThemedText style={styles.manualInputHint}>
                          Separate with commas (1, 3, 5) or use dash for range (1-5)
                        </ThemedText>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {!useManualInput && (
                <View style={styles.formGroup}>
                  <View style={styles.groupTitleContainer}>
                    <View style={styles.groupTitleChip}>
                      <Feather name="users" size={22} color={colors.primary} />
                      <ThemedText type='subtitle' style={styles.groupTitleText}>
                        {markAbsent ? 'Toggle ON for Absent Students' : 'Toggle ON for Present Students'} 
                        <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
                          {' '}({students.length} students)
                        </ThemedText>
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
                  disabled={saving || loading}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.saveBtnText}>
                        {attendanceExists?.exists ? 'Override Attendance' : 'Save Attendance'}
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

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

      {/* Override Confirmation Modal */}
      <OverrideConfirmationModal
        visible={showOverrideModal}
        onConfirm={handleOverrideConfirm}
        onCancel={handleOverrideCancel}
        markedCount={overrideData?.markedCount || 0}
        date={overrideData?.date || selectedDate.toISOString()}
        sessionType={overrideData?.sessionType || sessionType}
      />
    </>
  )
}