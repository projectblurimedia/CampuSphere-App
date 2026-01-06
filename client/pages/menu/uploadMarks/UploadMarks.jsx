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
  Entypo,
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
  examName,
  subject
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
          
          <ThemedText style={styles.title}>Marks Already Uploaded</ThemedText>
          
          <ThemedText style={styles.message}>
            Marks for {examName} - {subject} already exist for {markedCount} students.
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: '#dc2626', fontFamily: 'Poppins-SemiBold' }]}>
            Do you want to override?
          </ThemedText>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Exam:</ThemedText>
              <ThemedText style={styles.detailValue}>{examName}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Subject:</ThemedText>
              <ThemedText style={styles.detailValue}>{subject}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Marked Students:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: '#dc2626' }]}>{markedCount} students</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.warningText}>
            This action will replace existing marks records
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

// Add Custom Exam Modal
const AddCustomExamModal = ({ 
  visible, 
  onClose, 
  onAdd,
  examName,
  setExamName
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
    addIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#dbeafe',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#93c5fd',
    },
    title: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
      marginBottom: 12,
      color: colors.primary,
    },
    inputContainer: {
      marginVertical: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
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
    hintText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
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
    addButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#ffffff',
    },
  })

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.addIcon}>
              <Feather name="plus" size={30} color={colors.primary} />
            </View>
          </View>
          
          <ThemedText style={styles.title}>Add Custom Exam</ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Exam Name</ThemedText>
            <TextInput
              style={styles.input}
              value={examName}
              onChangeText={setExamName}
              placeholder="e.g., Unit Test 1, Mid Term, etc."
              placeholderTextColor={colors.textSecondary}
              autoFocus={true}
            />
            <ThemedText style={styles.hintText}>
              Custom exams will be saved for future use
            </ThemedText>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={onAdd}
              activeOpacity={0.7}
              disabled={!examName.trim()}
            >
              <ThemedText style={styles.addButtonText}>
                Add Exam
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function UploadMarks({ visible, onClose }) {
  const { colors } = useTheme()
  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [examType, setExamType] = useState('formative-1')
  const [subject, setSubject] = useState('mathematics')
  const [totalMarks, setTotalMarks] = useState('100')
  const [marks, setMarks] = useState({})
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [marksExist, setMarksExist] = useState(null)
  const [toast, setToast] = useState(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideData, setOverrideData] = useState(null)
  const [showAddExamModal, setShowAddExamModal] = useState(false)
  const [customExamName, setCustomExamName] = useState('')
  const [examTypes, setExamTypes] = useState([
    { label: 'Formative Assessment 1', value: 'formative-1' },
    { label: 'Formative Assessment 2', value: 'formative-2' },
    { label: 'Formative Assessment 3', value: 'formative-3' },
    { label: 'Summative Assessment 1', value: 'summative-1' },
    { label: 'Summative Assessment 2 (Final)', value: 'summative-2' },
    { label: 'Custom Exam', value: 'custom' },
  ])

  const subjects = [
    { label: 'Mathematics', value: 'mathematics' },
    { label: 'Science', value: 'science' },
    { label: 'English', value: 'english' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Social Studies', value: 'social-studies' },
    { label: 'Computer Science', value: 'computer-science' },
    { label: 'Physics', value: 'physics' },
    { label: 'Chemistry', value: 'chemistry' },
    { label: 'Biology', value: 'biology' },
  ]

  // Toast notification functions
  const showToast = (message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }

  const hideToast = () => {
    setToast(null)
  }

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

  const academicYears = [
    { label: '2024-2025', value: '2024-2025' },
    { label: '2023-2024', value: '2023-2024' },
    { label: '2022-2023', value: '2022-2023' },
  ]

  const fetchStudents = async (className, section, year) => {
    if (!className || !section || !year) {
      setStudents([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await axiosApi.get('/marks/students', {
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
        // Initialize marks as empty strings
        const initialMarks = {}
        formattedStudents.forEach(student => {
          initialMarks[student.id] = ''
        })
        setMarks(initialMarks)
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

  const checkMarksExist = async () => {
    if (!selectedClass || !selectedSection || !examType || !subject || !academicYear) return

    try {
      const response = await axiosApi.get('/marks/check', {
        params: {
          examType,
          subject,
          className: selectedClass,
          section: selectedSection,
          academicYear
        }
      })

      if (response.data.success) {
        setMarksExist(response.data.data)
        if (response.data.data.exists) {
          loadExistingMarks(response.data.data)
          showToast('Existing marks found', 'warning', 2000)
        } else {
          // Initialize all marks as empty strings
          const initialMarks = {}
          students.forEach(student => {
            initialMarks[student.id] = ''
          })
          setMarks(initialMarks)
        }
      }
    } catch (err) {
      console.error('Error checking marks:', err)
      showToast('Failed to check existing marks', 'error')
    }
  }

  const loadExistingMarks = (existingData) => {
    const newMarks = {}
    
    existingData.markedStudents.forEach(markedStudent => {
      newMarks[markedStudent.studentId] = markedStudent.marks.toString()
    })
    
    // Fill in any missing students as empty strings
    students.forEach(student => {
      if (!(student.id in newMarks)) {
        newMarks[student.id] = ''
      }
    })
    
    setMarks(newMarks)
  }

  useEffect(() => {
    if (selectedClass && selectedSection && academicYear) {
      fetchStudents(selectedClass, selectedSection, academicYear)
    }
  }, [selectedClass, selectedSection, academicYear])

  useEffect(() => {
    if (selectedClass && selectedSection && examType && subject && academicYear && students.length > 0) {
      checkMarksExist()
    }
  }, [selectedClass, selectedSection, examType, subject, academicYear, students])

  const updateMarks = (studentId, value) => {
    // Only allow numbers and decimal point
    const cleanedValue = value.replace(/[^0-9.]/g, '')
    
    // Check if value exceeds total marks
    const numericValue = parseFloat(cleanedValue)
    if (!isNaN(numericValue) && numericValue > parseFloat(totalMarks)) {
      showToast(`Marks cannot exceed total marks (${totalMarks})`, 'error')
      return
    }
    
    setMarks(prev => ({
      ...prev,
      [studentId]: cleanedValue
    }))
  }

  const handleSave = async () => {
    // Validate all marks
    const marksArray = Object.entries(marks)
    const invalidMarks = marksArray.filter(([studentId, markValue]) => {
      const numericValue = parseFloat(markValue)
      return markValue.trim() === '' || isNaN(numericValue) || numericValue < 0 || numericValue > parseFloat(totalMarks)
    })
    
    if (invalidMarks.length > 0) {
      showToast(`Please enter valid marks (0-${totalMarks}) for all students`, 'error')
      return
    }

    if (students.length === 0) {
      showToast('No students found to upload marks', 'error')
      return
    }
    
    // Prepare marks data for backend
    const studentMarks = Object.entries(marks).map(([studentId, markValue]) => ({
      studentId: studentId.toString(),
      marks: parseFloat(markValue),
      totalMarks: parseFloat(totalMarks),
      percentage: ((parseFloat(markValue) / parseFloat(totalMarks)) * 100).toFixed(2)
    }))
    
    setSaving(true)
    
    try {
      const response = await axiosApi.post('/marks/upload', {
        examType,
        subject,
        academicYear,
        className: selectedClass,
        section: selectedSection,
        totalMarks: parseFloat(totalMarks),
        studentMarks
      })

      if (response.data.success) {
        showToast(`Marks uploaded for ${response.data.data.markedCount} student${response.data.data.markedCount > 1 ? 's' : ''}`, 'success')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        showToast(response.data.message || 'Failed to upload marks', 'error')
      }
    } catch (error) {
      if (error.response?.data?.canOverride) {
        // Show override confirmation modal
        setOverrideData({
          studentMarks,
          markedCount: error.response.data.data.totalMarked,
          examName: examTypes.find(e => e.value === examType)?.label || examType,
          subject: subjects.find(s => s.value === subject)?.label || subject
        })
        setShowOverrideModal(true)
      } else {
        showToast(
          error.response?.data?.message || 'Failed to upload marks. Please try again.',
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
      const response = await axiosApi.put('/marks/override', {
        examType,
        subject,
        academicYear,
        className: selectedClass,
        section: selectedSection,
        totalMarks: parseFloat(totalMarks),
        studentMarks: overrideData.studentMarks
      })

      if (response.data.success) {
        showToast(`Marks overridden for ${response.data.data.markedCount} student${response.data.data.markedCount > 1 ? 's' : ''}`, 'success')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        showToast(response.data.message || 'Failed to override marks', 'error')
      }
    } catch (error) {
      console.error('Error overriding marks:', error)
      showToast(
        error.response?.data?.message || 'Failed to override marks. Please try again.',
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

  const handleAddCustomExam = () => {
    if (!customExamName.trim()) {
      showToast('Please enter exam name', 'error')
      return
    }

    const newExam = {
      label: customExamName,
      value: `custom-${Date.now()}`
    }
    
    setExamTypes(prev => [...prev, newExam])
    setExamType(newExam.value)
    setShowAddExamModal(false)
    setCustomExamName('')
    showToast('Custom exam added successfully', 'success')
  }

  const handleTotalMarksChange = (value) => {
    // Only allow numbers
    const cleanedValue = value.replace(/[^0-9]/g, '')
    setTotalMarks(cleanedValue)
    
    // Validate existing marks against new total
    const numericTotal = parseFloat(cleanedValue) || 0
    if (numericTotal > 0) {
      const updatedMarks = { ...marks }
      let hasInvalidMarks = false
      
      Object.keys(updatedMarks).forEach(studentId => {
        const markValue = updatedMarks[studentId]
        if (markValue) {
          const numericMark = parseFloat(markValue)
          if (!isNaN(numericMark) && numericMark > numericTotal) {
            updatedMarks[studentId] = numericTotal.toString()
            hasInvalidMarks = true
          }
        }
      })
      
      if (hasInvalidMarks) {
        setMarks(updatedMarks)
        showToast(`Some marks were adjusted to fit new total of ${numericTotal}`, 'warning')
      }
    }
  }

  const calculateStatistics = () => {
    const marksArray = Object.values(marks)
      .map(value => parseFloat(value))
      .filter(value => !isNaN(value) && value !== '')
    
    if (marksArray.length === 0) return null
    
    const total = marksArray.reduce((sum, mark) => sum + mark, 0)
    const average = total / marksArray.length
    const max = Math.max(...marksArray)
    const min = Math.min(...marksArray)
    const filledCount = marksArray.length
    const totalCount = students.length
    
    return {
      average: average.toFixed(2),
      max,
      min,
      filledCount,
      totalCount,
      percentage: ((filledCount / totalCount) * 100).toFixed(1)
    }
  }

  const renderStatistics = () => {
    const stats = calculateStatistics()
    if (!stats) return null

    return (
      <View style={styles.statisticsContainer}>
        <ThemedText style={styles.statisticsTitle}>Marks Statistics</ThemedText>
        <View style={styles.statisticsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.average}</ThemedText>
            <ThemedText style={styles.statLabel}>Average</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.max}</ThemedText>
            <ThemedText style={styles.statLabel}>Highest</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.min}</ThemedText>
            <ThemedText style={styles.statLabel}>Lowest</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.filledCount}/{stats.totalCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Filled</ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const renderExistingMarksStatus = () => {
    if (!marksExist) return null
    
    if (marksExist.exists) {
      return (
        <View style={styles.existingMarksContainer}>
          <View style={[styles.existingMarksBadge, { backgroundColor: '#fef3c7' }]}>
            <Feather name="alert-triangle" size={16} color="#92400e" />
            <ThemedText style={[styles.existingMarksText, { color: '#92400e' }]}>
              Marks already uploaded for {marksExist.totalMarked}/{marksExist.totalStudents} students
            </ThemedText>
          </View>
          <ThemedText style={styles.existingMarksNote}>
            You can override by submitting again
          </ThemedText>
        </View>
      )
    }
    
    return null
  }

  const renderStudents = () => {
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
      const markValue = marks[student.id] || ''
      const numericValue = parseFloat(markValue)
      const isInvalid = markValue.trim() !== '' && (isNaN(numericValue) || numericValue < 0 || numericValue > parseFloat(totalMarks))

      return (
        <View key={student.id} style={[
          styles.studentCard,
          isInvalid && styles.invalidCard
        ]}>
          <View style={styles.studentInfo}>
            <View style={[
              styles.rollNumberBadge,
              { 
                backgroundColor: isInvalid ? '#fee2e2' : '#dbeafe',
                borderColor: isInvalid ? '#fca5a5' : '#93c5fd'
              }
            ]}>
              <ThemedText style={[
                styles.rollNumberText,
                { color: isInvalid ? '#dc2626' : '#1e40af' }
              ]}>#{student.rollNo}</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.studentName}>{student.name}</ThemedText>
              <ThemedText style={styles.admissionNumber}>
                Adm: {student.admissionNumber}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.marksInputContainer}>
            <TextInput
              style={[
                styles.marksInput,
                isInvalid && styles.invalidInput
              ]}
              value={markValue}
              onChangeText={(value) => updateMarks(student.id, value)}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <ThemedText style={styles.totalMarksText}>/{totalMarks}</ThemedText>
          </View>
          
          {isInvalid && (
            <Feather name="alert-circle" size={16} color="#dc2626" style={styles.errorIcon} />
          )}
        </View>
      )
    })
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
    examTypeContainer: {
      position: 'relative',
    },
    addCustomButton: {
      position: 'absolute',
      right: 0,
      top: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary + '15',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    addCustomText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: 'Poppins-Medium',
      marginLeft: 4,
    },
    totalMarksContainer: {
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
    totalMarksInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    totalMarksLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
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
    },
    invalidCard: {
      borderColor: '#fca5a5',
      backgroundColor: '#fef2f2',
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
      marginBottom: 2,
    },
    admissionNumber: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    marksInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    marksInput: {
      width: 60,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      backgroundColor: colors.inputBackground,
    },
    invalidInput: {
      borderColor: '#dc2626',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
    },
    totalMarksText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4,
      fontFamily: 'Poppins-Medium',
    },
    errorIcon: {
      marginLeft: 8,
    },
    existingMarksContainer: {
      marginTop: 16,
      marginBottom: 16,
    },
    existingMarksBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fbbf24',
    },
    existingMarksText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 8,
      flex: 1,
    },
    existingMarksNote: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      marginLeft: 4,
    },
    statisticsContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    statisticsTitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 12,
    },
    statisticsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
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
                  <ThemedText type='subtitle' style={styles.title}>Upload Marks</ThemedText>
                  <ThemedText style={styles.subtitle}>Enter student examination marks</ThemedText>
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
                    <MaterialIcons name="school" size={22} color={colors.primary} />
                    <ThemedText type='subtitle' style={styles.groupTitleText}>
                      Exam Details
                    </ThemedText>
                  </View>
                </View>

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

                <View style={styles.examTypeContainer}>
                  <ThemedText style={styles.fieldLabel}>Exam Type</ThemedText>
                  <CustomDropdown
                    value={examType}
                    items={examTypes}
                    onSelect={setExamType}
                    placeholder="Select Exam Type"
                  />
                  {examType === 'custom' && (
                    <TouchableOpacity 
                      style={styles.addCustomButton}
                      onPress={() => setShowAddExamModal(true)}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus" size={14} color={colors.primary} />
                      <ThemedText style={styles.addCustomText}>Custom</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.rowContainer}>
                  <View style={styles.halfWidth}>
                    <ThemedText style={styles.fieldLabel}>Subject</ThemedText>
                    <CustomDropdown
                      value={subject}
                      items={subjects}
                      onSelect={setSubject}
                      placeholder="Select Subject"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <ThemedText style={styles.fieldLabel}>Total Marks</ThemedText>
                    <View style={styles.totalMarksContainer}>
                      <TextInput
                        style={styles.totalMarksInput}
                        value={totalMarks}
                        onChangeText={handleTotalMarksChange}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                      <ThemedText style={styles.totalMarksLabel}>Marks</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {renderExistingMarksStatus()}
              {renderStatistics()}

              <View style={styles.formGroup}>
                <View style={styles.groupTitleContainer}>
                  <View style={styles.groupTitleChip}>
                    <Feather name="users" size={22} color={colors.primary} />
                    <ThemedText type='subtitle' style={styles.groupTitleText}>
                      Enter Marks for Students
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
                      <FontAwesome5 name="upload" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.saveBtnText}>
                        {marksExist?.exists ? 'Override Marks' : 'Upload Marks'}
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
        examName={overrideData?.examName || ''}
        subject={overrideData?.subject || ''}
      />

      {/* Add Custom Exam Modal */}
      <AddCustomExamModal
        visible={showAddExamModal}
        onClose={() => {
          setShowAddExamModal(false)
          setCustomExamName('')
        }}
        onAdd={handleAddCustomExam}
        examName={customExamName}
        setExamName={setCustomExamName}
      />
    </>
  )
}