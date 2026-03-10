import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import * as DocumentPicker from 'expo-document-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { downloadTimetableTemplate } from './sampleData'

// Subject colors for different periods - assigned based on period number
const PERIOD_COLORS = [
  '#FF6B6B', 
  '#18b080', 
  '#b92bb9',
  '#1d9bf0', 
  '#e44e92', 
  '#8430e3',
  '#ec2f2f', 
  '#4d6fe0',
]

// Break color
const BREAK_COLOR = '#f59e0b' // Amber color for breaks

// Custom Dropdown Component
const CustomDropdown = ({ 
  value, 
  onValueChange, 
  options, 
  placeholder,
  disabled = false 
}) => {
  const { colors } = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder

  const dropdownStyles = StyleSheet.create({
    button: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      opacity: disabled ? 0.5 : 1,
    },
    buttonText: {
      fontSize: 14,
      color: value ? colors.text : colors.textSecondary,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      maxHeight: '70%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.primary + '10',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    option: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedOption: {
      backgroundColor: colors.primary + '10',
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
    },
    selectedOptionText: {
      color: colors.primary,
      fontWeight: '600',
    },
  })

  return (
    <>
      <TouchableOpacity
        style={dropdownStyles.button}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <ThemedText 
          style={dropdownStyles.buttonText}
          numberOfLines={1}
        >
          {selectedLabel}
        </ThemedText>
        <Feather name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={dropdownStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={dropdownStyles.modalContent}>
            <View style={dropdownStyles.modalHeader}>
              <ThemedText style={dropdownStyles.modalTitle}>
                {placeholder}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    dropdownStyles.option,
                    value === option.value && dropdownStyles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(option.value)
                    setModalVisible(false)
                  }}
                >
                  <ThemedText 
                    style={[
                      dropdownStyles.optionText,
                      value === option.value && dropdownStyles.selectedOptionText
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

export default function Timetable({ visible, onClose }) {
  const { colors } = useTheme()
  
  // States for class-section selection
  const [classesSections, setClassesSections] = useState({})
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingTimetable, setLoadingTimetable] = useState(false)
  const [timetableData, setTimetableData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // States for expandable weeks - multiple days can be expanded
  const [expandedDays, setExpandedDays] = useState({})
  
  // States for bulk import modal
  const [bulkImportVisible, setBulkImportVisible] = useState(false)
  const [excelFile, setExcelFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState(null)
  const [toast, setToast] = useState(null)

  // States for confirmation modal
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)

  // Track mounted state
  const isMounted = useRef(true)
  const fetchTimeout = useRef(null)
  const isFetchingTimetable = useRef(false)
  const initialSelectionDone = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current)
      }
    }
  }, [])

  const showToast = useCallback((message, type = 'error', duration = 3000) => {
    if (isMounted.current) {
      setToast({ message, type, duration })
    }
  }, [])

  const hideToast = useCallback(() => {
    if (isMounted.current) {
      setToast(null)
    }
  }, [])

  // Fetch classes and sections
  const fetchClassesAndSections = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoadingClasses(true)
      }
      
      const response = await axiosApi.get('/timetable/classes-sections')
      
      if (!isMounted.current) return
      
      if (response.data?.success) {
        const data = response.data.data || {}
        setClassesSections(data)
        
        const hasData = Object.keys(data).length > 0
        
        if (hasData && !initialSelectionDone.current) {
          const classEntries = Object.entries(data)
          if (classEntries.length > 0) {
            const [firstClass, sections] = classEntries[0]
            setSelectedClass(firstClass)
            if (sections && sections.length > 0) {
              setSelectedSection(sections[0])
            }
            initialSelectionDone.current = true
          }
        } else if (!hasData) {
          setSelectedClass('')
          setSelectedSection('')
          setTimetableData(null)
          setExpandedDays({})
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      if (isMounted.current) {
        showToast('Failed to load classes', 'error')
      }
    } finally {
      if (isMounted.current) {
        setLoadingClasses(false)
        setRefreshing(false)
        setInitialLoadComplete(true)
      }
    }
  }, [showToast])

  // Fetch timetable
  const fetchTimetable = useCallback(async (showLoading = true) => {
    if (!selectedClass || !selectedSection || isFetchingTimetable.current) return
    
    isFetchingTimetable.current = true
    
    try {
      if (showLoading) {
        setLoadingTimetable(true)
      }
      
      // Clear previous data immediately when fetching new
      setTimetableData(null)
      setExpandedDays({})
      
      const response = await axiosApi.get('/timetable', {
        params: {
          class: selectedClass,
          section: selectedSection
        }
      })
      
      if (!isMounted.current) return
      
      if (response.data?.success) {
        const data = response.data.data
        setTimetableData(data)
        // Expand all days by default
        if (data?.timetable?.length > 0) {
          const expanded = {}
          data.timetable.forEach(day => {
            expanded[day.day] = true
          })
          setExpandedDays(expanded)
        }
      } else {
        setTimetableData(null)
      }
    } catch (error) {
      console.error('Error fetching timetable:', error)
      if (isMounted.current) {
        if (error.response?.status !== 404) {
          showToast('Failed to load timetable', 'error')
        }
        setTimetableData(null)
      }
    } finally {
      if (isMounted.current) {
        setLoadingTimetable(false)
      }
      isFetchingTimetable.current = false
    }
  }, [selectedClass, selectedSection, showToast])

  // Initial fetch
  useEffect(() => {
    if (visible) {
      initialSelectionDone.current = false
      fetchClassesAndSections()
    } else {
      // Reset states when modal closes
      setTimetableData(null)
      setSelectedClass('')
      setSelectedSection('')
      setInitialLoadComplete(false)
      setExpandedDays({})
      setClassesSections({})
      initialSelectionDone.current = false
    }
  }, [visible, fetchClassesAndSections])

  // Fetch timetable when selection changes
  useEffect(() => {
    if (selectedClass && selectedSection && visible) {
      // Clear existing timeout
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current)
      }
      
      // Set new timeout
      fetchTimeout.current = setTimeout(() => {
        fetchTimetable(true)
      }, 100)
      
      return () => {
        if (fetchTimeout.current) {
          clearTimeout(fetchTimeout.current)
        }
      }
    }
  }, [selectedClass, selectedSection, visible, fetchTimetable])

  const handleRefresh = useCallback(() => {
    fetchClassesAndSections(true)
  }, [fetchClassesAndSections])

  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '.xlsx',
          '.xls'
        ],
        copyToCacheDirectory: true,
      })
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0]
        
        const validExtensions = ['.xlsx', '.xls']
        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        
        if (!validExtensions.includes(fileExtension)) {
          showToast('Please select an Excel file (.xlsx or .xls)', 'error')
          return
        }
        
        if (file.size > 10 * 1024 * 1024) {
          showToast('File size must be less than 10MB', 'error')
          return
        }
        
        setExcelFile(file)
        setImportResult(null)
      }
    } catch (error) {
      console.error('File pick error:', error)
      showToast('Failed to pick file', 'error')
    }
  }, [showToast])

  const downloadTemplate = useCallback(async () => {
    const result = downloadTimetableTemplate()
  
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
  }, [showToast])

  const handleImport = useCallback(async () => {
    if (!excelFile) {
      showToast('Please select an Excel file first', 'error')
      return
    }

    setImportLoading(true)
    setUploadProgress(0)
    setImportResult(null)
    
    try {
      const formData = new FormData()
      const fileUri = excelFile.uri
      const fileName = excelFile.name || `timetable_${Date.now()}.xlsx`
      const fileType = excelFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      
      let finalUri = fileUri
      if (Platform.OS === 'ios' && !fileUri.startsWith('file://')) {
        finalUri = `file://${fileUri}`
      }
      
      formData.append('excelFile', {
        uri: finalUri,
        type: fileType,
        name: fileName,
      })

      const response = await axiosApi.post('/timetable/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && isMounted.current) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(percentCompleted)
          }
        },
      })

      if (!isMounted.current) return

      const summary = response.data.summary || {
        totalRows: 0,
        timetablesCreated: 0,
        totalSlots: 0,
        errors: []
      }
      
      const errors = summary.errors || []
      
      setImportResult({
        totalRows: summary.totalRows,
        successfulSlots: summary.totalSlots,
        timetablesCreated: summary.timetablesCreated,
        failedRows: errors.length,
        errors: errors,
        message: response.data.message
      })
      
      if (errors.length === 0 && summary.totalSlots > 0) {
        showToast(`✅ Successfully imported ${summary.totalSlots} slots`, 'success', 4000)
        await fetchClassesAndSections()
        if (selectedClass && selectedSection) {
          fetchTimetable(false)
        }
      } else if (summary.totalSlots === 0 && errors.length > 0) {
        showToast(`❌ Import failed: ${errors.length} errors`, 'error', 4000)
      } else if (summary.totalSlots > 0 && errors.length > 0) {
        showToast(`⚠️ Imported ${summary.totalSlots} slots, ${errors.length} errors`, 'warning', 4000)
      }
      
    } catch (error) {
      console.error('Import error details:', error)
      
      if (!isMounted.current) return
      
      let errorMessage = 'Failed to import timetable'
      let errorDetails = []
      let totalRows = 0
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. File may be too large.'
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network connection failed. Please check your internet.'
      } else if (error.response) {
        if (error.response.data?.summary?.errors) {
          errorDetails = error.response.data.summary.errors
          errorMessage = error.response.data.message || 'Bulk import failed'
          totalRows = error.response.data.summary.totalRows || 0
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
          errorDetails = [{
            row: 0,
            error: errorMessage,
            type: 'server_error'
          }]
        }
        
        setImportResult({
          totalRows: totalRows,
          successfulSlots: 0,
          timetablesCreated: 0,
          failedRows: errorDetails.length || 1,
          errors: errorDetails,
        })
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again.'
        setImportResult({
          totalRows: 0,
          successfulSlots: 0,
          timetablesCreated: 0,
          failedRows: 1,
          errors: [{
            row: 0,
            error: errorMessage,
            type: 'connection_error'
          }],
        })
      }
      
      showToast(errorMessage, 'error')
    } finally {
      if (isMounted.current) {
        setImportLoading(false)
        setUploadProgress(0)
      }
    }
  }, [excelFile, selectedClass, selectedSection, fetchClassesAndSections, fetchTimetable, showToast])

  const resetImport = useCallback(() => {
    setExcelFile(null)
    setImportResult(null)
    setUploadProgress(0)
  }, [])

  const handleBulkImportPress = useCallback(() => {
    setBulkImportVisible(true)
  }, [])

  const handleBulkImportClose = useCallback(() => {
    if (!importLoading) {
      setBulkImportVisible(false)
      resetImport()
    }
  }, [importLoading, resetImport])

  const handleConfirmImport = useCallback(() => {
    setConfirmModalVisible(false)
    handleImport()
  }, [handleImport])

  const handleMainClose = useCallback(() => {
    if (!importLoading) {
      onClose()
    }
  }, [importLoading, onClose])

  const handleClassChange = useCallback((value) => {
    setSelectedClass(value)
    setSelectedSection('') // Reset section when class changes
    setTimetableData(null) // Clear timetable immediately
    setExpandedDays({})
  }, [])

  const handleSectionChange = useCallback((value) => {
    setSelectedSection(value)
    setTimetableData(null) // Clear timetable immediately
    setExpandedDays({})
  }, [])

  const toggleDay = useCallback((day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }))
  }, [])

  const getErrorIcon = useCallback((errorType) => {
    const icons = {
      missing_fields: 'alert-circle',
      missing_teacher: 'user-x',
      invalid_day: 'calendar',
      invalid_type: 'tag',
      invalid_timings: 'clock',
      invalid_class: 'grid',
      invalid_section: 'layers',
      invalid_sno: 'hash',
      processing_error: 'cpu',
      server_error: 'server',
      connection_error: 'wifi-off'
    }
    return icons[errorType] || 'x-circle'
  }, [])

  const getErrorColor = useCallback((errorType) => {
    const colors = {
      missing_fields: '#f59e0b',
      missing_teacher: '#f97316',
      invalid_day: '#f97316',
      invalid_type: '#f97316',
      invalid_timings: '#f97316',
      invalid_class: '#f97316',
      invalid_section: '#f97316',
      invalid_sno: '#f97316',
      processing_error: '#dc2626',
      server_error: '#dc2626',
      connection_error: '#dc2626'
    }
    return colors[errorType] || '#dc2626'
  }, [])

  const formatTimings = useCallback((timings) => {
    if (!timings) return { start: '', end: '' }
    const parts = timings.split('-').map(t => t.trim())
    if (parts.length === 2) {
      return {
        start: parts[0],
        end: parts[1]
      }
    }
    return {
      start: timings,
      end: ''
    }
  }, [])

  // Memoized day order
  const dayOrder = useMemo(() => ({
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
    'Friday': 5, 'Saturday': 6, 'Sunday': 7
  }), [])

  // Memoized sorted timetable
  const sortedTimetable = useMemo(() => {
    if (!timetableData?.timetable) return []
    try {
      return [...timetableData.timetable]
        .sort((a, b) => dayOrder[a.day] - dayOrder[b.day])
        .map(day => ({
          ...day,
          slots: day.slots ? [...day.slots] : []
        }))
    } catch (error) {
      console.error('Error sorting timetable:', error)
      return []
    }
  }, [timetableData, dayOrder])

  const hasClassData = useMemo(() => {
    return Object.keys(classesSections).length > 0
  }, [classesSections])

  const isImportEnabled = useMemo(() => {
    return excelFile !== null && !importLoading
  }, [excelFile, importLoading])

  const classOptions = useMemo(() => {
    return Object.keys(classesSections).map(className => ({
      label: className,
      value: className
    }))
  }, [classesSections])

  const sectionOptions = useMemo(() => {
    const sections = classesSections[selectedClass] || []
    return sections.map(section => ({
      label: `Section ${section}`,
      value: section
    }))
  }, [classesSections, selectedClass])

  // Determine if we should show loading state
  const showLoading = useMemo(() => {
    return loadingClasses || (loadingTimetable && !timetableData && selectedClass && selectedSection)
  }, [loadingClasses, loadingTimetable, timetableData, selectedClass, selectedSection])

  // Determine if we should show empty state
  const showEmptyState = useMemo(() => {
    return !showLoading && !loadingClasses && initialLoadComplete && selectedClass && selectedSection && (!timetableData || sortedTimetable.length === 0)
  }, [showLoading, loadingClasses, initialLoadComplete, selectedClass, selectedSection, timetableData, sortedTimetable])

  const styles = useMemo(() => StyleSheet.create({
    modalContainer: {
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
    backIcon: {
      marginLeft: -2,
    },
    headerTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    headerPlaceholder: {
      width: 44,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    classSectionRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    noDataContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    noDataIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    noDataTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    noDataText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    noTimetableContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noTimetableIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    noTimetableTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    noTimetableText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    dayCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      overflow: 'hidden',
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.primary + '08',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dayHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dayIcon: {
      marginRight: 10,
    },
    dayTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 0.3,
    },
    expandButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary + '08',
      borderWidth: 1,
      borderColor: colors.border,
    },
    slotsContainer: {
      padding: 12,
    },
    slotItem: {
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    periodHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    periodNumberContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    periodNumber: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    subjectName: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
      flex: 1,
      marginLeft: 12,
    },
    teacherName: {
      fontSize: 13,
      color: '#FFFFFF',
      opacity: 0.95,
      fontFamily: 'Poppins-Medium'
    },
    timingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    horizontalLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    timingText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
      marginHorizontal: 8,
    },
    // Break card styles - restored to original design
    breakContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    breakLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.5)',
      marginHorizontal: 8,
    },
    breakContent: {
      alignItems: 'center',
    },
    breakText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    breakTimingText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    importButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginTop: 16,
    },
    importButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    modalContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
    importModalHeader: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    importModalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    importModalTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    importModalSubtitle: {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    importModalBackButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    importContent: {
      padding: 16,
      paddingBottom: 100,
    },
    stepCard: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.primary + '50',
    },
    stepNumberText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    stepTitle: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    stepDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    excelFormatInfo: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 8,
    },
    filePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: 12,
      padding: 20,
      marginTop: 12,
    },
    filePickerButtonSelected: {
      backgroundColor: colors.primary + '10',
      borderStyle: 'solid',
      borderColor: colors.primary,
    },
    filePickerIcon: {
      marginRight: 10,
    },
    filePickerText: {
      fontSize: 15,
      color: colors.primary,
    },
    selectedFileContainer: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedFileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fileInfo: {
      flex: 1,
      marginLeft: 12,
    },
    fileName: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    fileSize: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    removeButton: {
      padding: 6,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    resultCard: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      marginTop: 16,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultIcon: {
      marginRight: 10,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    resultStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    statItem: {
      alignItems: 'center',
      minWidth: 70,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    errorSection: {
      marginTop: 12,
    },
    errorTitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: 'bold',
    },
    errorItem: {
      backgroundColor: '#fef2f2',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    errorIcon: {
      marginRight: 10,
      marginTop: 2,
    },
    errorContent: {
      flex: 1,
    },
    errorText: {
      fontSize: 13,
      color: '#4B5563',
      lineHeight: 18,
    },
    errorRowNumber: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 4,
    },
    errorChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    errorChipText: {
      fontSize: 10,
    },
    importFooterWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      paddingTop: 8,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    buttonCard: {
      borderRadius: 16,
      overflow: 'hidden',
      flex: 1,
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBackground,
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
    },
    importButtonGradient: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    importButtonPressable: {
      flex: 1,
      paddingVertical: 13,
      paddingHorizontal: 18,
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    importButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    confirmModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmModalContent: {
      width: '80%',
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmModalIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    confirmModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    confirmModalMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    confirmModalButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    confirmModalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
    },
    confirmModalCancel: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    confirmModalConfirm: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    confirmModalCancelText: {
      color: colors.text,
      fontSize: 16,
    },
    confirmModalConfirmText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
  }), [colors])

  const renderSlot = useCallback(({ item, index }) => {
    try {
      const formattedTime = formatTimings(item.timings)
      
      if (item.isBreak) {
        const isLunch = item.breakType === 'LUNCH' || item.subject?.toLowerCase().includes('lunch')
        const breakText = isLunch ? 'LUNCH BREAK' : (item.subject || 'BREAK').toUpperCase()
        
        return (
          <View 
            key={`slot-${item.sno || 'break'}-${index}`} 
            style={[styles.slotItem, { backgroundColor: BREAK_COLOR }]}
          >
            <View style={styles.breakContainer}>
              <View style={styles.breakLine} />
              <View style={styles.breakContent}>
                <ThemedText style={styles.breakText}>
                  {breakText}
                </ThemedText>
                <ThemedText style={styles.breakTimingText}>
                  {formattedTime.start} - {formattedTime.end}
                </ThemedText>
              </View>
              <View style={styles.breakLine} />
            </View>
          </View>
        )
      }

      const colorIndex = ((item.sno - 1) % PERIOD_COLORS.length)
      const backgroundColor = PERIOD_COLORS[colorIndex]

      return (
        <View 
          key={`slot-${item.sno || 'period'}-${index}`} 
          style={[styles.slotItem, { backgroundColor }]}
        >
          <View style={styles.periodHeader}>
            <View style={styles.periodNumberContainer}>
              <ThemedText style={styles.periodNumber}>{item.sno}</ThemedText>
            </View>
            <ThemedText style={styles.subjectName} numberOfLines={1}>
              {item.subject || 'Subject'}
            </ThemedText>
            {item.teacherName && (
              <ThemedText style={styles.teacherName} numberOfLines={1}>
                {item.teacherName}
              </ThemedText>
            )}
          </View>
          
          <View style={styles.timingRow}>
            <View style={styles.horizontalLine} />
            <ThemedText style={styles.timingText}>
              {formattedTime.start} - {formattedTime.end}
            </ThemedText>
            <View style={styles.horizontalLine} />
          </View>
        </View>
      )
    } catch (error) {
      console.error('Error rendering slot:', error)
      return null
    }
  }, [styles, formatTimings])

  const renderDay = useCallback(({ item }) => {
    const isExpanded = expandedDays[item.day]
    
    return (
      <View style={styles.dayCard}>
        <TouchableOpacity 
          style={[
            styles.dayHeader,
            isExpanded && { backgroundColor: colors.primary + '15' }
          ]}
          onPress={() => toggleDay(item.day)}
          activeOpacity={0.7}
        >
          <View style={styles.dayHeaderLeft}>
            <Feather 
              name="calendar" 
              size={18} 
              color={isExpanded ? colors.primary : colors.primary + 'CC'} 
              style={styles.dayIcon} 
            />
            <ThemedText style={[
              styles.dayTitle,
              isExpanded && { color: colors.primary }
            ]}>
              {item.day}
            </ThemedText>
          </View>
          <View style={[
            styles.expandButton,
            isExpanded && { backgroundColor: colors.primary + '15' }
          ]}>
            <Feather 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={isExpanded ? colors.primary : colors.primary + 'CC'} 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.slotsContainer}>
            {item.slots && item.slots.length > 0 ? (
              item.slots.map((slot, idx) => renderSlot({ item: slot, index: idx }))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ThemedText style={{ color: colors.textSecondary }}>
                  No slots for {item.day}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    )
  }, [styles, colors.primary, expandedDays, toggleDay, renderSlot])

  const renderTimetable = useCallback(() => {
    if (loadingClasses) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading classes...</ThemedText>
        </View>
      )
    }

    if (!selectedClass || !selectedSection) {
      return (
        <View style={styles.noTimetableContainer}>
          <Feather name="calendar" size={60} color={colors.textSecondary} style={styles.noTimetableIcon} />
          <ThemedText style={styles.noTimetableTitle}>Select Class & Section</ThemedText>
          <ThemedText style={styles.noTimetableText}>
            Please select a class and section to view timetable
          </ThemedText>
        </View>
      )
    }

    if (showLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading timetable...</ThemedText>
        </View>
      )
    }

    if (showEmptyState) {
      return (
        <View style={styles.noTimetableContainer}>
          <Feather name="calendar" size={60} color={colors.textSecondary} style={styles.noTimetableIcon} />
          <ThemedText style={styles.noTimetableTitle}>No Timetable Found</ThemedText>
          <ThemedText style={styles.noTimetableText}>
            No timetable available for {selectedClass} - Section {selectedSection}
          </ThemedText>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={handleBulkImportPress}
          >
            <Feather name="upload" size={18} color="#FFFFFF" />
            <ThemedText style={styles.importButtonText}>Import Timetable</ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    if (!timetableData || sortedTimetable.length === 0) {
      return (
        <View style={styles.noTimetableContainer}>
          <Feather name="calendar" size={60} color={colors.textSecondary} style={styles.noTimetableIcon} />
          <ThemedText style={styles.noTimetableTitle}>No Timetable Data</ThemedText>
          <ThemedText style={styles.noTimetableText}>
            No timetable available for {selectedClass} - Section {selectedSection}
          </ThemedText>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={handleBulkImportPress}
          >
            <Feather name="upload" size={18} color="#FFFFFF" />
            <ThemedText style={styles.importButtonText}>Import Timetable</ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <FlatList
        data={sortedTimetable}
        keyExtractor={(item) => item.day}
        renderItem={renderDay}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={3}
        extraData={expandedDays}
      />
    )
  }, [
    loadingClasses,
    selectedClass,
    selectedSection,
    showLoading,
    showEmptyState,
    timetableData,
    sortedTimetable,
    colors,
    styles,
    handleBulkImportPress,
    refreshing,
    handleRefresh,
    renderDay,
    expandedDays
  ])

  const renderEmptyState = useCallback(() => (
    <View style={styles.noDataContainer}>
      <Feather name="calendar" size={80} color={colors.textSecondary} style={styles.noDataIcon} />
      <ThemedText style={styles.noDataTitle}>No Timetable Data</ThemedText>
      <ThemedText style={styles.noDataText}>
        No timetables have been created yet. Import your first timetable using the bulk import option.
      </ThemedText>
      <TouchableOpacity 
        style={[styles.importButton, { paddingHorizontal: 24 }]}
        onPress={handleBulkImportPress}
      >
        <Feather name="upload-cloud" size={20} color="#FFFFFF" />
        <ThemedText style={styles.importButtonText}>Bulk Import Timetable</ThemedText>
      </TouchableOpacity>
    </View>
  ), [colors, styles, handleBulkImportPress])

  // Confirmation Modal Component
  const ConfirmationModal = useCallback(() => (
    <Modal
      visible={confirmModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setConfirmModalVisible(false)}
      statusBarTranslucent
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.confirmModalIcon}>
            <Feather name="upload-cloud" size={30} color={colors.primary} />
          </View>
          <ThemedText style={styles.confirmModalTitle}>Confirm Import</ThemedText>
          <ThemedText style={styles.confirmModalMessage}>
            Are you sure you want to import timetable from {excelFile?.name}?
            This will replace all existing timetables.
          </ThemedText>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.confirmModalCancel]}
              onPress={() => setConfirmModalVisible(false)}
            >
              <ThemedText style={styles.confirmModalCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.confirmModalConfirm]}
              onPress={handleConfirmImport}
            >
              <ThemedText style={styles.confirmModalConfirmText}>Confirm</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [confirmModalVisible, excelFile, handleConfirmImport, colors.primary, styles])

  // Bulk Import Modal Component
  const BulkImportModal = useCallback(() => (
    <Modal 
      visible={bulkImportVisible} 
      animationType="fade" 
      onRequestClose={handleBulkImportClose}
      statusBarTranslucent
    >
      <View style={styles.modalContent}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.importModalHeader}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.importModalHeaderRow}>
              <TouchableOpacity 
                style={[styles.importModalBackButton, importLoading && styles.disabledButton]} 
                onPress={handleBulkImportClose}
                disabled={importLoading}
              >
                <FontAwesome5 style={styles.backIcon} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.importModalTitle}>Bulk Import</ThemedText>
                <ThemedText style={styles.importModalSubtitle}>Upload timetable data</ThemedText>
              </View>
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <FlatList
          data={[1]}
          keyExtractor={() => 'content'}
          renderItem={() => (
            <View style={styles.importContent}>
              <View style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <ThemedText style={styles.stepNumberText}>1</ThemedText>
                  </View>
                  <ThemedText style={styles.stepTitle}>Download Template</ThemedText>
                </View>
                <ThemedText style={styles.stepDescription}>
                  Download our CSV template with the correct format.
                </ThemedText>
                <TouchableOpacity 
                  style={[styles.filePickerButton, { marginTop: 8 }]}
                  onPress={downloadTemplate}
                  disabled={importLoading}
                >
                  <Feather name="download" size={20} color={colors.primary} style={styles.filePickerIcon} />
                  <ThemedText style={styles.filePickerText}>
                    {importLoading ? 'Downloading...' : 'Download Template'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <ThemedText style={styles.stepNumberText}>2</ThemedText>
                  </View>
                  <ThemedText style={styles.stepTitle}>Select File</ThemedText>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.filePickerButton,
                    excelFile && styles.filePickerButtonSelected
                  ]}
                  onPress={handleFilePick}
                  disabled={importLoading}
                >
                  <Feather name="upload" size={20} color={colors.primary} style={styles.filePickerIcon} />
                  <ThemedText style={styles.filePickerText}>
                    {excelFile ? 'Change File' : 'Select Excel File'}
                  </ThemedText>
                </TouchableOpacity>
                
                {excelFile && (
                  <View style={styles.selectedFileContainer}>
                    <View style={styles.selectedFileRow}>
                      <Feather name="file" size={24} color={colors.primary} />
                      <View style={styles.fileInfo}>
                        <ThemedText style={styles.fileName} numberOfLines={1}>
                          {excelFile.name}
                        </ThemedText>
                        <ThemedText style={styles.fileSize}>
                          {(excelFile.size / 1024).toFixed(2)} KB
                        </ThemedText>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => setExcelFile(null)}
                        disabled={importLoading}
                      >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    
                    {importLoading && uploadProgress > 0 && (
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBarFill,
                            { width: `${uploadProgress}%` }
                          ]} 
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {importResult && (
                <View style={[
                  styles.resultCard, 
                  { 
                    borderColor: importResult.failedRows > 0 ? 
                      (importResult.successfulSlots === 0 ? '#ef4444' : '#f59e0b') : 
                      '#10b981'
                  }
                ]}>
                  <View style={styles.resultHeader}>
                    <Feather 
                      name={importResult.failedRows > 0 ? 
                        (importResult.successfulSlots === 0 ? "x-circle" : "alert-triangle") : 
                        "check-circle"} 
                      size={24} 
                      color={importResult.failedRows > 0 ? 
                        (importResult.successfulSlots === 0 ? '#ef4444' : '#f59e0b') : 
                        '#10b981'} 
                      style={styles.resultIcon}
                    />
                    <ThemedText style={[
                      styles.resultTitle,
                      {
                        color: importResult.failedRows > 0 ? 
                          (importResult.successfulSlots === 0 ? '#ef4444' : '#f59e0b') : 
                          '#10b981'
                      }
                    ]}>
                      {importResult.failedRows > 0 ? 
                        (importResult.successfulSlots === 0 ? 'Import Failed' : 'Completed with Errors') : 
                        'Import Successful'}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.resultStats}>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>{importResult.totalRows}</ThemedText>
                      <ThemedText style={styles.statLabel}>Total Rows</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: '#10b981' }]}>
                        {importResult.successfulSlots}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Slots Added</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>
                        {importResult.failedRows}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Failed</ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.importFooterWrapper}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.secondaryButton, importLoading && styles.disabledButton]}
              onPress={resetImport}
              disabled={importLoading}
            >
              <ThemedText style={styles.secondaryButtonText}>Reset</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.buttonCard}>
              <LinearGradient
                colors={!isImportEnabled ? [colors.border, colors.border] : [colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.importButtonGradient}
              >
                <TouchableOpacity
                  onPress={() => setConfirmModalVisible(true)}
                  activeOpacity={0.9}
                  style={[
                    styles.importButtonPressable, 
                    (!isImportEnabled) && styles.disabledButton
                  ]}
                  disabled={!isImportEnabled}
                >
                  {importLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="upload-cloud" size={18} color="#FFFFFF" />
                  )}
                  <ThemedText style={styles.importButtonText}>
                    {importLoading ? 'Importing...' : 'Start Import'}
                  </ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  ), [
    bulkImportVisible, 
    colors, 
    styles, 
    importLoading, 
    handleBulkImportClose,
    downloadTemplate,
    handleFilePick,
    excelFile,
    uploadProgress,
    importResult,
    resetImport,
    isImportEnabled,
  ])

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      onRequestClose={handleMainClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={[styles.backButton, loadingClasses && styles.disabledButton]} 
                onPress={handleMainClose}
                disabled={loadingClasses}
              >
                <FontAwesome5 style={styles.backIcon} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.headerTitle}>Timetable</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Manage schedules</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleBulkImportPress}
              >
                <Feather name="upload-cloud" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {loadingClasses && !initialLoadComplete ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Loading classes...</ThemedText>
            </View>
          ) : hasClassData ? (
            <>
              <View style={styles.classSectionRow}>
                <CustomDropdown
                  value={selectedClass}
                  onValueChange={handleClassChange}
                  options={classOptions}
                  placeholder="Select Class"
                />

                <CustomDropdown
                  value={selectedSection}
                  onValueChange={handleSectionChange}
                  options={sectionOptions}
                  placeholder="Select Section"
                  disabled={!selectedClass}
                />
              </View>

              {renderTimetable()}
            </>
          ) : (
            renderEmptyState()
          )}
        </View>

        <BulkImportModal />
        <ConfirmationModal />

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
  )
}