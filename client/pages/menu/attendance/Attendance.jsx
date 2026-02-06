import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Modal,
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
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { useSelector } from 'react-redux'

const CustomDropdown = ({
  value,
  items,
  onSelect,
  placeholder = "Select an option",
  style,
  isLoading = false,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(placeholder)

  // Update selected label whenever value or items change
  useEffect(() => {
    if (value && items && items.length > 0) {
      const foundItem = items.find(item => item.value === value)
      if (foundItem) {
        setSelectedLabel(foundItem.label)
      } else {
        setSelectedLabel(placeholder)
      }
    } else {
      setSelectedLabel(placeholder)
    }
  }, [value, items, placeholder])

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
        style={[dropdownStyles.dropdownHeader, isLoading && { opacity: 0.5 }]}
        onPress={() => !isLoading && setIsOpen(!isOpen)}
        activeOpacity={0.7}
        disabled={isLoading || items.length === 0}
      >
        <Feather name="chevron-down" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <ThemedText style={dropdownStyles.dropdownSelectedText}>
          {isLoading ? 'Loading...' : selectedLabel}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={colors.primary} />
      </TouchableOpacity>
      
      {isOpen && !isLoading && items.length > 0 && (
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
  date,
  session
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

  const getSessionLabel = (session) => {
    return session === 'morning' ? 'Morning Session' : 'Afternoon Session'
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
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
            {getSessionLabel(session)} attendance for {formatDate(date)} already exists.
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: '#dc2626', fontFamily: 'Poppins-SemiBold' }]}>
            Do you want to override?
          </ThemedText>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Session:</ThemedText>
              <ThemedText style={styles.detailValue}>{getSessionLabel(session)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDate(date)}</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.warningText}>
            This action will replace existing attendance records for this session
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

// Custom Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  date,
  session,
  className,
  section,
  isDeleting = false
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
    deleteIcon: {
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
      color: '#dc2626',
      textAlign: 'center',
      marginTop: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    noteText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
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
    confirmButton: {
      flex: 1,
      backgroundColor: '#dc2626',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      opacity: isDeleting ? 0.6 : 1,
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#ffffff',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
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

  const getSessionLabel = (session) => {
    return session === 'morning' ? 'Morning Session' : 'Afternoon Session'
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.deleteIcon}>
              {isDeleting ? (
                <ActivityIndicator size="large" color="#dc2626" />
              ) : (
                <Feather name="trash-2" size={30} color="#dc2626" />
              )}
            </View>
          </View>
          
          <ThemedText style={styles.title}>
            {isDeleting ? 'Deleting Attendance...' : 'Delete Attendance'}
          </ThemedText>
          
          <ThemedText style={styles.message}>
            {isDeleting 
              ? `Deleting ${getSessionLabel(session)} attendance for ${formatDate(date)}...`
              : `Are you sure you want to delete the ${getSessionLabel(session)} attendance for ${formatDate(date)}?`
            }
          </ThemedText>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Class-Section:</ThemedText>
              <ThemedText style={styles.detailValue}>{className}-{section}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Session:</ThemedText>
              <ThemedText style={styles.detailValue}>{getSessionLabel(session)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date:</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDate(date)}</ThemedText>
            </View>
          </View>
          
          {!isDeleting && (
            <>
              <ThemedText style={styles.warningText}>
                This action cannot be undone
              </ThemedText>
              
              <ThemedText style={styles.noteText}>
                All attendance records for this session will be permanently deleted
              </ThemedText>
            </>
          )}
          
          <View style={styles.buttonContainer}>
            {!isDeleting && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <ThemedText style={[styles.confirmButtonText, { marginLeft: 8 }]}>
                    Deleting...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.confirmButtonText}>Delete</ThemedText>
              )}
            </TouchableOpacity>
          </View>
          
          {isDeleting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#dc2626" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

export default function Attendance({ visible, onClose }) {
  const { colors } = useTheme()
  
  // Get employee from Redux
  const employee = useSelector(state => state.employee.employee)
  const teacherName = employee ? `${employee.firstName} ${employee.lastName}` : 'Teacher'
  
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedSession, setSelectedSession] = useState('morning')
  const [attendance, setAttendance] = useState({})
  const [existingAttendance, setExistingAttendance] = useState({})
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [attendanceExists, setAttendanceExists] = useState(null)
  const [toast, setToast] = useState(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideData, setOverrideData] = useState(null)
  const [sessionMarkedBy, setSessionMarkedBy] = useState(null)
  const [lastLoadedData, setLastLoadedData] = useState({
    class: null,
    section: null,
    date: null,
    session: null
  })
  const [loadingStep, setLoadingStep] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteOption, setShowDeleteOption] = useState(false)
  
  // New state for classes and sections
  const [classesAndSections, setClassesAndSections] = useState({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])

  // Toast notification functions
  const showToast = (message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }

  const hideToast = () => {
    setToast(null)
  }

  const sessions = [
    { label: 'Morning Session', value: 'morning' },
    { label: 'Afternoon Session', value: 'afternoon' },
  ]

  // Function to load classes and sections from API
  const loadClassesAndSections = useCallback(async () => {
    try {
      setIsLoadingClasses(true)
      setLoadingStep('Loading classes and sections...')

      const response = await axiosApi.get('/students/classes-sections')
      
      if (response.data.success) {
        const classesData = response.data.data
        setClassesAndSections(classesData)
        
        // Transform the data for dropdown
        const classesArray = Object.keys(classesData).map(className => ({
          label: className,
          value: className === 'Pre-Nursery' || className === 'Nursery' || className === 'LKG' || className === 'UKG' 
            ? className 
            : className.split(' ')[1] // Extract number from "Class X"
        }))
        
        // Sort classes: Pre-Nursery, Nursery, LKG, UKG, then Class 1-12
        const sortedClasses = classesArray.sort((a, b) => {
          // Define the correct order for non-numeric classes
          const specialOrder = {
            'Pre-Nursery': 0,
            'Nursery': 1,
            'LKG': 2,
            'UKG': 3
          }
          
          // Get order for both items
          const orderA = specialOrder[a.value] !== undefined ? specialOrder[a.value] : 
                        specialOrder[a.label] !== undefined ? specialOrder[a.label] : 4
          const orderB = specialOrder[b.value] !== undefined ? specialOrder[b.value] : 
                        specialOrder[b.label] !== undefined ? specialOrder[b.label] : 4
          
          // If both are numeric classes (after the special ones)
          if (orderA === 4 && orderB === 4) {
            // Extract numeric value and compare as numbers
            const numA = parseInt(a.value) || parseInt(a.label?.split(' ')[1]) || 100
            const numB = parseInt(b.value) || parseInt(b.label?.split(' ')[1]) || 100
            return numA - numB
          }
          
          return orderA - orderB
        })
        
        setClasses(sortedClasses)
        
        // Set first class and section by default if none selected
        if (sortedClasses.length > 0) {
          if (!selectedClass) {
            const firstClass = sortedClasses[0].value
            setSelectedClass(firstClass)
            
            // Get sections for first class
            const firstClassSections = classesData[sortedClasses[0].label] || []
            if (firstClassSections.length > 0 && !selectedSection) {
              setSelectedSection(firstClassSections[0])
            }
          }
        }
        
      } else {
        throw new Error(response.data.message || 'Failed to load classes and sections')
      }
    } catch (err) {
      console.error('Error loading classes and sections:', err)
      showToast('Failed to load classes. Using default list.', 'warning')
      
      // Fallback to hardcoded classes if API fails
      const fallbackClasses = [
        { label: 'Pre-Nursery', value: 'Pre-Nursery' },
        { label: 'Nursery', value: 'Nursery' },
        { label: 'LKG', value: 'LKG' },
        { label: 'UKG', value: 'UKG' },
        { label: 'Class 1', value: '1' },
        { label: 'Class 2', value: '2' },
        { label: 'Class 3', value: '3' },
        { label: 'Class 4', value: '4' },
        { label: 'Class 5', value: '5' },
        { label: 'Class 6', value: '6' },
        { label: 'Class 7', value: '7' },
        { label: 'Class 8', value: '8' },
        { label: 'Class 9', value: '9' },
        { label: 'Class 10', value: '10' },
        { label: 'Class 11', value: '11' },
        { label: 'Class 12', value: '12' },
      ]
      
      const fallbackClassSections = {
        'Pre-Nursery': ['A', 'B'],
        'Nursery': ['A', 'B'],
        'LKG': ['A', 'B'],
        'UKG': ['A', 'B'],
        '1': ['A', 'B'],
        '2': ['A', 'B'],
        '3': ['A', 'B'],
        '4': ['A', 'B'],
        '5': ['A', 'B'],
        '6': ['A', 'B'],
        '7': ['A', 'B'],
        '8': ['A', 'B'],
        '9': ['A', 'B'],
        '10': ['A', 'B'],
        '11': ['A', 'B'],
        '12': ['A', 'B'],
      }
      
      setClasses(fallbackClasses)
      setClassesAndSections(fallbackClassSections)
      
      // Set first class and section by default
      if (fallbackClasses.length > 0) {
        if (!selectedClass) {
          const firstClass = fallbackClasses[0].value
          setSelectedClass(firstClass)
          
          if (!selectedSection) {
            const firstClassSections = fallbackClassSections[fallbackClasses[0].label] || ['A']
            setSelectedSection(firstClassSections[0])
          }
        }
      }
    } finally {
      setIsLoadingClasses(false)
      setLoadingStep('')
    }
  }, [])

  // Function to update sections based on selected class
  const updateSectionsForClass = (className) => {
    if (!className || !classesAndSections) return
    
    // Find the class label
    const classItem = classes.find(c => c.value === className)
    if (!classItem) return
    
    const classLabel = classItem.label
    const classSections = classesAndSections[classLabel] || []
    
    if (classSections.length > 0) {
      const sectionsArray = classSections.map(section => ({
        label: `Section ${section}`,
        value: section
      }))
      setSections(sectionsArray)
      
      // Auto-select first section if current section is not in the list
      if (!selectedSection || !classSections.includes(selectedSection)) {
        setSelectedSection(classSections[0])
      }
    } else {
      // Default fallback
      const defaultSections = ['A'].map(section => ({
        label: `Section ${section}`,
        value: section
      }))
      setSections(defaultSections)
      
      if (!selectedSection) {
        setSelectedSection('A')
      }
    }
  }

  // Function to load all required data
  const loadAllData = useCallback(async () => {
    if (!selectedClass || !selectedSection) return

    setIsLoading(true)
    setError(null)
    setLoadingStep('Fetching students list...')
    
    try {
      // Track what data we're currently loading
      const currentLoadData = {
        class: selectedClass,
        section: selectedSection,
        date: selectedDate,
        session: selectedSession
      }
      
      // Set last loaded data immediately
      setLastLoadedData(currentLoadData)

      // Step 1: Fetch students
      const studentsResponse = await axiosApi.get(`/attendances/students/list?className=${selectedClass}&section=${selectedSection}`)
      
      if (!studentsResponse.data.success) {
        throw new Error(studentsResponse.data.message || 'Failed to fetch students')
      }

      const formattedStudents = studentsResponse.data.data.map(student => ({
        id: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        rollNo: student.rollNo,
      }))
      
      setStudents(formattedStudents)
      setLoadingStep('Checking existing attendance...')
      
      // Step 2: Check if attendance exists for this date and session
      const attendanceDate = new Date(selectedDate)
      attendanceDate.setHours(0, 0, 0, 0)
      
      const checkResponse = await axiosApi.get('/attendances/check', {
        params: {
          date: attendanceDate.toISOString(),
          className: selectedClass,
          section: selectedSection,
          session: selectedSession
        }
      })
      
      if (checkResponse.data.success) {
        setAttendanceExists(checkResponse.data.data)
        // Show delete option only if attendance exists
        setShowDeleteOption(checkResponse.data.data.exists)
      }

      setLoadingStep('Loading attendance data...')
      
      // Step 3: Load existing attendance data
      const existingResponse = await axiosApi.get('/attendances/class/day', {
        params: {
          date: attendanceDate.toISOString(),
          className: selectedClass,
          section: selectedSection
        }
      })

      if (existingResponse.data.success) {
        const { attendance: attendanceData } = existingResponse.data.data
        
        const attendanceMap = {}
        const existingData = {}
        let sessionMarkedByUser = null
        
        attendanceData.forEach(studentAttendance => {
          attendanceMap[studentAttendance.studentId] = {
            morning: studentAttendance.morning,
            afternoon: studentAttendance.afternoon
          }
          
          existingData[studentAttendance.studentId] = {
            morning: studentAttendance.morning,
            afternoon: studentAttendance.afternoon,
            markedBy: studentAttendance.markedBy
          }
          
          // Check who marked the current session
          if (selectedSession === 'morning' && studentAttendance.morning !== null) {
            sessionMarkedByUser = studentAttendance.markedBy
          } else if (selectedSession === 'afternoon' && studentAttendance.afternoon !== null) {
            sessionMarkedByUser = studentAttendance.markedBy
          }
        })
        
        setExistingAttendance(existingData)
        setSessionMarkedBy(sessionMarkedByUser)
        
        // Step 4: Initialize attendance state - SET TO ABSENT BY DEFAULT
        const newAttendance = {}
        formattedStudents.forEach(student => {
          const existing = attendanceMap[student.id]
          
          if (selectedSession === 'morning') {
            // If morning attendance exists, use it, otherwise default to false (Absent)
            newAttendance[student.id] = existing?.morning !== null ? existing.morning : false
          } else {
            // If afternoon attendance exists, use it, otherwise default to false (Absent)
            newAttendance[student.id] = existing?.afternoon !== null ? existing.afternoon : false
          }
        })
        
        setAttendance(newAttendance)
        
        showToast(`${formattedStudents.length} students loaded`, 'success', 2000)
      }
      
    } catch (err) {
      console.error('Error loading data:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Network error. Please try again.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setStudents([])
      setAttendance({})
      setExistingAttendance({})
      setShowDeleteOption(false)
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }, [selectedClass, selectedSection, selectedDate, selectedSession, teacherName])

  // Load classes and sections when component mounts
  useEffect(() => {
    if (visible) {
      loadClassesAndSections()
    }
  }, [visible])

  // Update sections when class changes or classes are loaded
  useEffect(() => {
    if (selectedClass && Object.keys(classesAndSections).length > 0) {
      updateSectionsForClass(selectedClass)
    }
  }, [selectedClass, classesAndSections])

  // Load attendance data when class and section are selected
  useEffect(() => {
    if (visible && selectedClass && selectedSection && !isLoadingClasses) {
      loadAllData()
    }
  }, [visible, selectedClass, selectedSection, selectedDate, selectedSession, isLoadingClasses])

  // Handle class selection
  const handleClassSelect = (classValue) => {
    setSelectedClass(classValue)
    // Section will be updated by the useEffect above
  }

  const toggleAttendance = (studentId) => {
    setAttendance(prev => {
      const currentValue = prev[studentId]
      const newValue = !currentValue
      
      return {
        ...prev,
        [studentId]: newValue
      }
    })
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSave = async () => {
    // Validate all required fields
    if (!selectedDate || !selectedClass || !selectedSection || !selectedSession) {
      showToast('Please select date, class, section, and session', 'error')
      return
    }

    if (students.length === 0) {
      showToast('No students found to mark attendance', 'error')
      return
    }
    
    // Check if any attendance is marked
    const markedStudents = Object.entries(attendance).filter(([_, isPresent]) => isPresent !== null)
    
    if (markedStudents.length === 0) {
      showToast('Please mark attendance for at least one student', 'warning')
      return
    }
    
    // Prepare student attendance array for backend
    const studentAttendance = markedStudents.map(([studentId, isPresent]) => ({
      studentId: studentId.toString(),
      isPresent: Boolean(isPresent)
    }))
    
    setSaving(true)
    
    try {
      const attendanceDate = new Date(selectedDate)
      attendanceDate.setHours(0, 0, 0, 0)
      
      // Ensure all required fields are sent correctly
      const payload = {
        date: attendanceDate.toISOString(),
        className: selectedClass,
        section: selectedSection,
        session: selectedSession,
        studentAttendance,
        markedBy: teacherName
      }
      
      const response = await axiosApi.post('/attendances/mark', payload)

      if (response.data.success) {
        showToast(`${selectedSession} attendance marked successfully`, 'success')
        // Reload data to update UI
        setTimeout(() => {
          loadAllData()
        }, 1000)
      } else {
        showToast(response.data.message || 'Failed to save attendance', 'error')
      }
    } catch (error) {
      console.error('Save attendance error:', error.response?.data || error)
      
      if (error.response?.status === 400) {
        if (error.response.data.canOverride) {
          // Show override confirmation modal
          setOverrideData({
            studentAttendance,
            date: selectedDate,
            session: selectedSession
          })
          setShowOverrideModal(true)
        } else {
          showToast(error.response.data.message || 'Invalid data. Please check your inputs.', 'error')
        }
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
      const attendanceDate = new Date(overrideData.date)
      attendanceDate.setHours(0, 0, 0, 0)
      
      const payload = {
        date: attendanceDate.toISOString(),
        className: selectedClass,
        section: selectedSection,
        session: overrideData.session,
        studentAttendance: overrideData.studentAttendance,
        markedBy: teacherName
      }
      
      const response = await axiosApi.put('/attendances/override', payload)

      if (response.data.success) {
        showToast(`${overrideData.session} attendance overridden successfully`, 'success')
        // Reload data to update UI
        setTimeout(() => {
          loadAllData()
        }, 1000)
      } else {
        showToast(response.data.message || 'Failed to override attendance', 'error')
      }
    } catch (error) {
      console.error('Error overriding attendance:', error.response?.data || error)
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

  const handleDeleteAttendance = async () => {
    // Prevent multiple clicks
    if (deleting) {
      return
    }

    if (!selectedDate || !selectedClass || !selectedSection || !selectedSession) {
      showToast('Please select date, class, section, and session', 'error')
      return
    }

    if (!attendanceExists?.exists) {
      showToast('No attendance found to delete', 'warning')
      setShowDeleteModal(false)
      return
    }

    setDeleting(true)
    
    try {
      const attendanceDate = new Date(selectedDate)
      attendanceDate.setHours(0, 0, 0, 0)
      
      const payload = {
        date: attendanceDate.toISOString(),
        className: selectedClass,
        section: selectedSection,
        session: selectedSession
      }
      
      const response = await axiosApi.delete('/attendances/class/session', { data: payload })

      if (response.data.success) {
        showToast(`${selectedSession} attendance deleted successfully`, 'success')
        
        // Close delete modal after a brief delay
        setTimeout(() => {
          setShowDeleteModal(false)
          // Reset delete option state
          setShowDeleteOption(false)
          // Reset attendance exists state
          setAttendanceExists(prev => ({ ...prev, exists: false, totalMarked: 0 }))
          // Clear existing attendance for the current session
          const updatedExistingAttendance = { ...existingAttendance }
          Object.keys(updatedExistingAttendance).forEach(studentId => {
            if (selectedSession === 'morning') {
              updatedExistingAttendance[studentId].morning = null
            } else {
              updatedExistingAttendance[studentId].afternoon = null
            }
          })
          setExistingAttendance(updatedExistingAttendance)
        }, 500)
      } else {
        showToast(response.data.message || 'Failed to delete attendance', 'error')
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Error deleting attendance:', error.response?.data || error)
      
      // Handle specific error cases
      let errorMessage = 'Failed to delete attendance. Please try again.'
      
      if (error.response?.status === 404) {
        errorMessage = 'Attendance not found. It may have already been deleted.'
        // Reset states since attendance doesn't exist
        setAttendanceExists(prev => ({ ...prev, exists: false, totalMarked: 0 }))
        setShowDeleteOption(false)
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid request. Please check your selections.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network connection error. Please check your internet connection.'
      }
      
      showToast(errorMessage, 'error')
      setShowDeleteModal(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteConfirm = () => {
    // Don't open modal if already deleting
    if (deleting) {
      return
    }
    setShowDeleteModal(true)
  }

  const handleDeleteCancel = () => {
    // Don't close if currently deleting
    if (deleting) {
      return
    }
    setShowDeleteModal(false)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSessionLabel = (session) => {
    return session === 'morning' ? 'Morning Session' : 'Afternoon Session'
  }

  const getAttendanceStatusText = (status) => {
    if (status === true) return 'Present'
    if (status === false) return 'Absent'
    return 'Not Marked'
  }

  const getAttendanceStatusColor = (status, isSubmitted = false) => {
    if (!isSubmitted) {
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        textColor: '#6b7280'
      }
    }
    
    if (status === true) {
      return {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
        textColor: '#16a34a'
      }
    } else if (status === false) {
      return {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
        textColor: '#dc2626'
      }
    }
    
    return {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
      textColor: '#6b7280'
    }
  }

  const getAttendanceIcon = (status) => {
    if (status === true) return "check-circle"
    if (status === false) return "x-circle"
    return "circle"
  }

  const getCurrentSessionMarkedBy = (studentId) => {
    if (!existingAttendance[studentId]) return null
    
    // Check if we have specific session data from the attendanceExists check
    if (attendanceExists?.exists) {
      // If attendance exists, return the current teacher name (who is overriding)
      return teacherName
    }
    
    // Otherwise return the existing markedBy
    return existingAttendance[studentId].markedBy
  }

  const getCurrentSessionStatus = (studentId) => {
    if (!existingAttendance[studentId]) return null
    
    return selectedSession === 'morning' 
      ? existingAttendance[studentId].morning
      : existingAttendance[studentId].afternoon
  }

  const isCurrentSessionSubmitted = (studentId) => {
    if (!existingAttendance[studentId]) return false
    
    const status = getCurrentSessionStatus(studentId)
    return status !== null
  }

  const getHeaderSubtitle = () => {
    if (attendanceExists?.exists && sessionMarkedBy) {
      return `Attendance marked by: ${sessionMarkedBy}`
    } else if (sessionMarkedBy && !attendanceExists?.exists) {
      return `Already marked by: ${sessionMarkedBy}`
    }
    return `Will be Marked as: ${teacherName}`
  }

  const renderHeaderMoreButton = () => {
    // Don't show delete button if currently deleting or no attendance exists
    if (!showDeleteOption || deleting) return <View style={{ width: 44 }} />
    
    return (
      <TouchableOpacity 
        style={[
          styles.moreButton,
          { opacity: deleting ? 0.5 : 1 }
        ]} 
        onPress={handleDeleteConfirm}
        activeOpacity={0.7}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
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
    moreButton: {
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
      textAlign: 'center',
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
      marginBottom: 10,
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
      gap: 5,
    },
    groupTitleTextContainer: {
      flexDirection: 'column',
      marginLeft: 5,
    },
    groupTitleText: {
      fontSize: 14,
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
      minHeight: 100,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
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
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyState: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    noStudentsText: {
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
    existingAttendanceContainer: {
      marginTop: 6,
      marginBottom: 10,
    },
    existingAttendanceBadge: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fbbf24',
      backgroundColor: '#fef3c7',
    },
    existingAttendanceText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 8,
      flex: 1,
      color: '#92400e',
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
    sessionStatusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    sessionStatusItem: {
      flex: 1,
      padding: 8,
      borderRadius: 8,
      marginHorizontal: 4,
      borderWidth: 1,
    },
    sessionStatusLabel: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    sessionStatusValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    readonlySessionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
    },
    editableSessionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    attendanceStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    attendanceStatusText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 6,
    },
    attendanceSwitchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    attendanceStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      minWidth: 200,
    },
    loadingText: {
      marginTop: 12,
      color: colors.text,
      textAlign: 'center',
      fontSize: 14,
    },
    loadingStepText: {
      marginTop: 8,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 12,
      fontStyle: 'italic',
    },
    updatingDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
  })

  const renderStudents = () => {
    if (isLoadingClasses || classes.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            Loading classes and sections...
          </ThemedText>
          {loadingStep ? (
            <ThemedText style={styles.loadingStepText}>
              {loadingStep}
            </ThemedText>
          ) : null}
        </View>
      )
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            Loading students and attendance data...
          </ThemedText>
          {loadingStep ? (
            <ThemedText style={styles.loadingStepText}>
              {loadingStep}
            </ThemedText>
          ) : null}
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
          <FontAwesome5 name="users" size={40} color={colors.textSecondary} />
          <ThemedText style={styles.noStudentsText}>
            No students found for {selectedClass}-{selectedSection}
          </ThemedText>
        </View>
      )
    }

    // Check if we're showing the right data for current selection
    const isDataForCurrentSelection = 
      lastLoadedData.class === selectedClass &&
      lastLoadedData.section === selectedSection &&
      lastLoadedData.session === selectedSession &&
      new Date(lastLoadedData.date).toDateString() === new Date(selectedDate).toDateString()

    if (!isDataForCurrentSelection) {
      return (
        <View style={styles.updatingDataContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            Updating data for new selection...
          </ThemedText>
          <ThemedText style={styles.loadingStepText}>
            Loading {selectedClass}-{selectedSection} for {formatDate(selectedDate)}
          </ThemedText>
        </View>
      )
    }

    return students.map((student) => {
      const studentAttendanceStatus = attendance[student.id]
      const isSubmitted = isCurrentSessionSubmitted(student.id)
      const markedBy = getCurrentSessionMarkedBy(student.id)
      
      // Determine if student's switch should be editable
      const isEditable = !isSubmitted || attendanceExists?.exists

      const currentColors = getAttendanceStatusColor(
        studentAttendanceStatus, 
        isSubmitted && !attendanceExists?.exists
      )

      const morningColors = getAttendanceStatusColor(
        existingAttendance[student.id]?.morning,
        existingAttendance[student.id]?.morning !== null
      )

      const afternoonColors = getAttendanceStatusColor(
        existingAttendance[student.id]?.afternoon,
        existingAttendance[student.id]?.afternoon !== null
      )

      return (
        <View key={student.id} style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <View style={[
              styles.rollNumberBadge,
              { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }
            ]}>
              <ThemedText style={[
                styles.rollNumberText,
                { color: colors.primary }
              ]}>#{student.rollNo}</ThemedText>
            </View>
            <ThemedText style={styles.studentName}>{student.name}</ThemedText>
          </View>
          
          <View style={styles.sessionStatusContainer}>
            {/* Morning Session Status */}
            <View style={[
              styles.sessionStatusItem,
              { 
                backgroundColor: morningColors.backgroundColor,
                borderColor: morningColors.borderColor
              }
            ]}>
              <ThemedText style={styles.sessionStatusLabel}>
                Morning
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather 
                  name={getAttendanceIcon(existingAttendance[student.id]?.morning)} 
                  size={14} 
                  color={morningColors.textColor} 
                />
                <ThemedText style={[
                  styles.sessionStatusValue,
                  { 
                    color: morningColors.textColor,
                    marginLeft: 4
                  }
                ]}>
                  {getAttendanceStatusText(existingAttendance[student.id]?.morning)}
                </ThemedText>
              </View>
            </View>
            
            {/* Afternoon Session Status */}
            <View style={[
              styles.sessionStatusItem,
              { 
                backgroundColor: afternoonColors.backgroundColor,
                borderColor: afternoonColors.borderColor
              }
            ]}>
              <ThemedText style={styles.sessionStatusLabel}>
                Afternoon
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather 
                  name={getAttendanceIcon(existingAttendance[student.id]?.afternoon)} 
                  size={14} 
                  color={afternoonColors.textColor} 
                />
                <ThemedText style={[
                  styles.sessionStatusValue,
                  { 
                    color: afternoonColors.textColor,
                    marginLeft: 4
                  }
                ]}>
                  {getAttendanceStatusText(existingAttendance[student.id]?.afternoon)}
                </ThemedText>
              </View>
            </View>
          </View>
          
          {/* Current Session Editable Section */}
          <View style={styles.editableSessionContainer}>
            <ThemedText style={[
              styles.fieldLabel,
              { marginBottom: 4, fontSize: 14 }
            ]}>
              {getSessionLabel(selectedSession)}:
            </ThemedText>
            
            <View style={styles.attendanceStatusContainer}>
              {isSubmitted && !attendanceExists?.exists ? (
                <View style={[
                  styles.attendanceStatusBadge,
                  { 
                    backgroundColor: currentColors.backgroundColor,
                    borderColor: currentColors.borderColor
                  }
                ]}>
                  <Feather 
                    name={getAttendanceIcon(studentAttendanceStatus)} 
                    size={14} 
                    color={currentColors.textColor} 
                  />
                  <ThemedText style={[
                    styles.attendanceStatusText,
                    { color: currentColors.textColor }
                  ]}>
                    {getAttendanceStatusText(studentAttendanceStatus)}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.attendanceSwitchContainer}>
                  <ThemedText style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginRight: 10
                  }}>
                    {studentAttendanceStatus === true ? 'Present' : 'Absent'}
                  </ThemedText>
                  
                  {isEditable ? (
                    <Switch
                      value={studentAttendanceStatus === true}
                      onValueChange={() => toggleAttendance(student.id)}
                      trackColor={{ 
                        false: '#fca5a5', 
                        true: '#4ade80' 
                      }}
                      thumbColor={'#ffffff'}
                      ios_backgroundColor="#fca5a5"
                    />
                  ) : (
                    <View style={[
                      styles.readonlySessionContainer,
                      { 
                        backgroundColor: studentAttendanceStatus === true ? '#dcfce7' : '#fee2e2',
                        borderColor: studentAttendanceStatus === true ? '#86efac' : '#fca5a5'
                      }
                    ]}>
                      <Feather 
                        name={studentAttendanceStatus === true ? "check" : "x"} 
                        size={14} 
                        color={studentAttendanceStatus === true ? "#16a34a" : "#dc2626"} 
                      />
                      <ThemedText style={[
                        styles.rollNumberText,
                        { 
                          fontSize: 14,
                          color: studentAttendanceStatus === true ? '#16a34a' : '#dc2626',
                          marginLeft: 4
                        }
                      ]}>
                        {studentAttendanceStatus === true ? 'Present' : 'Absent'}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      )
    })
  }

  const renderAttendanceStatus = () => {
    if (!attendanceExists) return null
    
    if (attendanceExists.exists) {
      return (
        <View style={styles.existingAttendanceContainer}>
          <View style={[
            styles.existingAttendanceBadge,
            { 
              backgroundColor: '#fef3c7',
              borderColor: '#fbbf24'
            }
          ]}>
            <Feather 
              name="alert-triangle" 
              size={16} 
              color="#92400e"
              style={{ marginTop: 4}} 
            />
            <ThemedText style={[
              styles.existingAttendanceText,
              { color: "#92400e" }
            ]}>
              {selectedSession} attendance already marked for {attendanceExists.totalMarked} students
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

  // Get header gradient colors based on attendance status
  const getHeaderGradientColors = () => {
    if (attendanceExists?.exists) {
      return ['#d85e00', '#d94206'] 
    }
    return [colors.gradientStart, colors.gradientEnd] // Default gradient
  }

  // Get save button gradient colors
  const getSaveButtonGradientColors = () => {
    if (attendanceExists?.exists) {
      return ['#d85e00', '#d94206'] 
    }
    return [colors.gradientStart, colors.gradientEnd] // Default gradient
  }

  return (
    <>
      <Modal 
        visible={visible} 
        animationType="fade" 
        onRequestClose={onClose}
        onShow={() => {
          // Reset states when modal opens
          setError(null)
          setAttendanceExists(null)
        }}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          <LinearGradient
            colors={getHeaderGradientColors()}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText type='subtitle' style={styles.title}>Mark Attendance</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {getHeaderSubtitle()}
                  </ThemedText>
                </View>
                {renderHeaderMoreButton()}
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Loading overlay */}
          {(isLoadingClasses || isLoading) && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingText}>
                  {isLoadingClasses ? 'Loading classes and sections...' : 'Loading attendance data...'}
                </ThemedText>
                {loadingStep ? (
                  <ThemedText style={styles.loadingStepText}>
                    {loadingStep}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          )}

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
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
                      onSelect={handleClassSelect}
                      placeholder="Select Class"
                      isLoading={isLoadingClasses}
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <ThemedText style={styles.fieldLabel}>Section</ThemedText>
                    <CustomDropdown
                      value={selectedSection}
                      items={sections}
                      onSelect={setSelectedSection}
                      placeholder="Select Section"
                      isLoading={isLoadingClasses}
                    />
                  </View>
                </View>

                <ThemedText style={styles.fieldLabel}>Select Session</ThemedText>
                <CustomDropdown
                  value={selectedSession}
                  items={sessions}
                  onSelect={setSelectedSession}
                  placeholder="Select Session"
                />
              </View>

              {renderAttendanceStatus()}

              <View style={styles.formGroup}>
                <View style={styles.groupTitleContainer}>
                  <View style={styles.groupTitleChip}>
                    <FontAwesome5 name="users" size={18} color={colors.primary} />
                    <ThemedText type='subtitle' style={styles.groupTitleText}>
                      Mark {getSessionLabel(selectedSession)} for ({students.length}) students
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
                colors={getSaveButtonGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.9}
                  style={styles.saveBtnPressable}
                  disabled={saving || isLoading || isLoadingClasses || deleting}
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
        date={overrideData?.date || selectedDate}
        session={overrideData?.session || selectedSession}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onConfirm={handleDeleteAttendance}
        onCancel={handleDeleteCancel}
        date={selectedDate}
        session={selectedSession}
        className={selectedClass}
        section={selectedSection}
        isDeleting={deleting}
      />
    </>
  )
}