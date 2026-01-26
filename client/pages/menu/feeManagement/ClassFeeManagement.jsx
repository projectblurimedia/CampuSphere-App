import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, MaterialIcons, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Class options
const CLASS_OPTIONS = [
  'Pre-Nursery',
  'Nursery',
  'L.K.G',
  'U.K.G',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12'
]

// Function to generate academic years
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  let baseYear = currentYear
  
  // If current month is after June, next academic year starts
  if (currentMonth > 6) {
    baseYear = currentYear
  } else {
    baseYear = currentYear - 1
  }
  
  const years = []
  // Previous 1 year + current + next 5 years
  for (let i = 1; i >= -5; i--) {
    const startYear = baseYear - i
    const endYear = startYear + 1
    years.push(`${startYear}-${endYear}`)
  }
  
  return years
}

const ACADEMIC_YEARS = generateAcademicYears()
const CURRENT_ACADEMIC_YEAR = ACADEMIC_YEARS[1] // Current academic year is at index 1

const ClassFeeManagement = ({ 
  visible, 
  onClose, 
  onSave,
  initialData,
  existingClassFees = [] 
}) => {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    className: '',
    academicYear: CURRENT_ACADEMIC_YEAR,
    totalTerms: '3',
    totalAnnualFee: '',
    tuitionFee: '',
    examFee: '',
    libraryFee: '',
    sportsFee: '',
    activityFee: '',
    labFee: '',
    computerFee: '',
    otherCharges: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [breakdownExpanded, setBreakdownExpanded] = useState(false)
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info'
  })
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        className: initialData.className || '',
        academicYear: initialData.academicYear || CURRENT_ACADEMIC_YEAR,
        totalTerms: initialData.totalTerms?.toString() || '3',
        totalAnnualFee: initialData.totalAnnualFee?.toString() || '',
        tuitionFee: initialData.tuitionFee?.toString() || '',
        examFee: initialData.examFee?.toString() || '',
        libraryFee: initialData.libraryFee?.toString() || '',
        sportsFee: initialData.sportsFee?.toString() || '',
        activityFee: initialData.activityFee?.toString() || '',
        labFee: initialData.labFee?.toString() || '',
        computerFee: initialData.computerFee?.toString() || '',
        otherCharges: initialData.otherCharges?.toString() || '',
      })
      setErrors({})
    } else {
      setFormData({
        className: '',
        academicYear: CURRENT_ACADEMIC_YEAR,
        totalTerms: '3',
        totalAnnualFee: '',
        tuitionFee: '',
        examFee: '',
        libraryFee: '',
        sportsFee: '',
        activityFee: '',
        labFee: '',
        computerFee: '',
        otherCharges: '',
      })
      setErrors({})
    }
  }, [initialData])

  const showToast = (message, type = 'info') => {
    setToast({
      visible: true,
      message,
      type
    })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.className.trim()) {
      newErrors.className = 'Class name is required'
    }
    
    if (!formData.totalAnnualFee.trim()) {
      newErrors.totalAnnualFee = 'Annual fee is required'
    } else if (isNaN(formData.totalAnnualFee) || parseFloat(formData.totalAnnualFee) <= 0) {
      newErrors.totalAnnualFee = 'Enter valid annual fee'
    }
    
    if (!formData.totalTerms.trim()) {
      newErrors.totalTerms = 'Number of terms is required'
    } else if (isNaN(formData.totalTerms) || parseInt(formData.totalTerms) <= 0 || parseInt(formData.totalTerms) > 4) {
      newErrors.totalTerms = 'Enter valid number of terms (1-4)'
    }
    
    // Check for duplicate
    if (!initialData) {
      const duplicate = existingClassFees.find(fee => 
        fee.className.toLowerCase() === formData.className.toLowerCase() &&
        fee.academicYear === formData.academicYear
      )
      if (duplicate) {
        newErrors.className = `Class fee already exists for Class ${formData.className} in ${formData.academicYear}`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        className: formData.className.trim(),
        academicYear: formData.academicYear,
        totalTerms: parseInt(formData.totalTerms),
        totalAnnualFee: parseFloat(formData.totalAnnualFee),
        tuitionFee: parseFloat(formData.tuitionFee) || 0,
        examFee: parseFloat(formData.examFee) || 0,
        libraryFee: parseFloat(formData.libraryFee) || 0,
        sportsFee: parseFloat(formData.sportsFee) || 0,
        activityFee: parseFloat(formData.activityFee) || 0,
        labFee: parseFloat(formData.labFee) || 0,
        computerFee: parseFloat(formData.computerFee) || 0,
        otherCharges: parseFloat(formData.otherCharges) || 0,
        description: ''
      }

      let response
      if (initialData && initialData._id) {
        // Update existing
        response = await axiosApi.put(`/class-fees/${initialData._id}`, payload)
        showToast('Class fee updated successfully!', 'success')
      } else {
        // Create new
        response = await axiosApi.post('/class-fees', payload)
        showToast('Class fee created successfully!', 'success')
      }

      if (response.data.success) {
        const newData = {
          _id: response.data.data._id || Date.now().toString(),
          ...response.data.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        onSave(newData)
        setLoading(false)
        
        // Close modal after a delay to show toast
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Error saving class fee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save class fee. Please try again.'
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await axiosApi.delete(`/class-fees/${initialData._id}`)
      showToast('Class fee deleted successfully!', 'success')
      onSave(null, true) // Pass true to indicate deletion
      setShowDeleteModal(false)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error deleting class fee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete class fee. Please try again.'
      showToast(errorMessage, 'error')
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  const calculateTermAmount = () => {
    if (!formData.totalAnnualFee || !formData.totalTerms) return 0
    const annualFee = parseFloat(formData.totalAnnualFee) || 0
    const terms = parseInt(formData.totalTerms) || 3
    return terms > 0 ? annualFee / terms : 0
  }

  const calculateBreakdownTotal = () => {
    const breakdown = [
      'tuitionFee', 'examFee', 'libraryFee', 'sportsFee', 
      'activityFee', 'labFee', 'computerFee', 'otherCharges'
    ]
    
    return breakdown.reduce((total, field) => {
      return total + (parseFloat(formData[field]) || 0)
    }, 0)
  }

  const handleAutoCalculate = () => {
    const breakdownTotal = calculateBreakdownTotal()
    setFormData(prev => ({ ...prev, totalAnnualFee: breakdownTotal.toString() }))
  }

  const handleSelectClass = (className) => {
    setFormData(prev => ({ ...prev, className }))
    setShowClassDropdown(false)
    if (errors.className) {
      setErrors(prev => ({ ...prev, className: '' }))
    }
  }

  const handleSelectYear = (year) => {
    setFormData(prev => ({ ...prev, academicYear: year }))
    setShowYearDropdown(false)
  }

  const renderDropdownItem = ({ item, onSelect, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        isSelected && { backgroundColor: colors.primary + '15' }
      ]}
      onPress={() => onSelect(item)}
    >
      <ThemedText 
        style={[
          styles.dropdownItemText,
          isSelected && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
        ]}
      >
        {item}
      </ThemedText>
      {isSelected && (
        <Feather name="check" size={18} color={colors.primary} />
      )}
    </TouchableOpacity>
  )

  const renderClassDropdown = () => (
    <Modal
      transparent
      visible={showClassDropdown}
      animationType="fade"
      onRequestClose={() => setShowClassDropdown(false)}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowClassDropdown(false)}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.dropdownHeader}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.primary }]}>
              Select Class
            </ThemedText>
            <TouchableOpacity onPress={() => setShowClassDropdown(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CLASS_OPTIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => renderDropdownItem({
              item,
              onSelect: handleSelectClass,
              isSelected: formData.className === item
            })}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dropdownList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderYearDropdown = () => (
    <Modal
      transparent
      visible={showYearDropdown}
      animationType="fade"
      onRequestClose={() => setShowYearDropdown(false)}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowYearDropdown(false)}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.dropdownHeader}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.primary }]}>
              Select Academic Year
            </ThemedText>
            <TouchableOpacity onPress={() => setShowYearDropdown(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={ACADEMIC_YEARS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => renderDropdownItem({
              item,
              onSelect: handleSelectYear,
              isSelected: formData.academicYear === item
            })}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dropdownList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderDeleteModal = () => (
    <Modal
      transparent
      visible={showDeleteModal}
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={[styles.deleteModalContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.deleteModalHeader, { backgroundColor: '#ef4444' + '10' }]}>
            <Feather name="trash-2" size={24} color="#ef4444" />
            <ThemedText style={[styles.deleteModalTitle, { color: '#ef4444' }]}>
              Delete Class Fee
            </ThemedText>
          </View>
          
          <View style={styles.deleteModalContent}>
            <Feather name="alert-triangle" size={48} color="#ef4444" style={styles.deleteWarningIcon} />
            <ThemedText style={[styles.deleteModalText, { color: colors.text }]}>
              Are you sure you want to delete class fee for
            </ThemedText>
            <ThemedText style={[styles.deleteModalHighlight, { color: colors.primary }]}>
              Class {formData.className}?
            </ThemedText>
            <ThemedText style={[styles.deleteModalSubText, { color: colors.textSecondary }]}>
              This action cannot be undone.
            </ThemedText>
          </View>
          
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalCancelButton, { borderColor: colors.border }]}
              onPress={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              <ThemedText style={[styles.deleteModalButtonText, { color: colors.text }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalConfirmButton, { backgroundColor: '#ef4444' }]}
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.deleteModalButtonText, { color: '#FFFFFF' }]}>
                  Delete
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const modalStyles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    },
    modalContainer: {
      flex: 1,
      width: SCREEN_WIDTH * 0.9,
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      maxHeight: SCREEN_HEIGHT * 0.85,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.25,
          shadowRadius: 30,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: colors.primary + '10',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalTitle: {
      fontSize: 18,
      color: colors.primary,
    },
    scrollContent: {
      padding: 24,
    },
    inputContainer: {
      marginBottom: 20,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
    },
    requiredStar: {
      color: '#ef4444',
      fontSize: 16,
      marginLeft: 2,
    },
    inputWrapper: {
      position: 'relative',
      marginTop: 5,
    },
    dropdownInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
    },
    lockedInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground + 'CC',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text + '90',
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
    },
    focusedInput: {
      borderColor: colors.primary,
    },
    errorInput: {
      borderColor: '#ef4444',
    },
    dropdownIcon: {
      position: 'absolute',
      right: 16,
      top: 14,
    },
    errorText: {
      fontSize: 12,
      color: '#ef4444',
      marginTop: 6,
      fontFamily: 'Poppins-Medium',
    },
    rowContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 15,
    },
    halfContainer: {
      flex: 1,
    },
    feeSummaryCard: {
      backgroundColor: colors.primary + '08',
      borderRadius: 16,
      padding: 20,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
    },
    totalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.primary + '20',
      marginTop: 8,
    },
    totalLabel: {
      fontSize: 15,
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    totalValue: {
      fontSize: 18,
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    breakdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 5,
    },
    breakdownTitle: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Poppins-Bold',
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expandText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    breakdownContent: {
      marginTop: 12,
    },
    breakdownGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    breakdownItem: {
      width: '48%',
    },
    breakdownInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
    },
    autoCalcButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      marginTop: 12,
      marginBottom: 16,
    },
    autoCalcText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: 'Poppins-SemiBold',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 24,
      paddingBottom: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    deleteButton: {
      width: 60,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    saveButton: {
      flex: initialData ? 1.5 : 2,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 12,
      overflow: 'hidden',
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
  })

  const styles = StyleSheet.create({
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownContainer: {
      width: SCREEN_WIDTH * 0.8,
      maxHeight: SCREEN_HEIGHT * 0.6,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.primary + '10',
    },
    dropdownTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
    dropdownList: {
      paddingVertical: 8,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    deleteModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    deleteModalContainer: {
      width: SCREEN_WIDTH * 0.85,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 15,
        },
      }),
    },
    deleteModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    deleteModalTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
    },
    deleteModalContent: {
      alignItems: 'center',
      padding: 24,
    },
    deleteWarningIcon: {
      marginBottom: 20,
    },
    deleteModalText: {
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Poppins-Medium',
    },
    deleteModalHighlight: {
      fontSize: 17,
      textAlign: 'center',
      marginBottom: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    deleteModalSubText: {
      fontSize: 13,
      textAlign: 'center',
      fontFamily: 'Poppins-Medium',
    },
    deleteModalButtons: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    deleteModalButton: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
    },
    deleteModalCancelButton: {
      backgroundColor: colors.inputBackground,
    },
    deleteModalConfirmButton: {},
    deleteModalButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
  })

  if (!visible) return null

  const breakdownFields = [
    { label: 'Tuition Fee', field: 'tuitionFee', icon: 'book' },
    { label: 'Exam Fee', field: 'examFee', icon: 'edit' },
    { label: 'Library Fee', field: 'libraryFee', icon: 'open-book' },
    { label: 'Sports Fee', field: 'sportsFee', icon: 'sports-club' },
    { label: 'Activity Fee', field: 'activityFee', icon: 'users' },
    { label: 'Lab Fee', field: 'labFee', icon: 'lab-flask' },
    { label: 'Computer Fee', field: 'computerFee', icon: 'laptop' },
    { label: 'Other Charges', field: 'otherCharges', icon: 'circle-with-plus' },
  ]

  const termAmount = calculateTermAmount()
  const breakdownTotal = calculateBreakdownTotal()

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <View style={modalStyles.modalTitleContainer}>
            <MaterialIcons name="school" size={24} color={colors.primary} />
            <ThemedText type='subtitle' style={modalStyles.modalTitle}>
              {initialData ? 'Edit Class Fee' : 'New Class Fee'}
            </ThemedText>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.inputBackground,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Feather name="x" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={modalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Class Name Dropdown */}
            <View style={modalStyles.inputContainer}>
              <View style={modalStyles.labelRow}>
                <ThemedText style={modalStyles.label}>
                  Class Name <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => !initialData && setShowClassDropdown(true)}
                disabled={!!initialData}
              >
                <View style={modalStyles.inputWrapper}>
                  <View
                    style={[
                      initialData ? modalStyles.lockedInput : modalStyles.dropdownInput,
                      errors.className && modalStyles.errorInput,
                      !initialData && !errors.className && formData.className.trim() && modalStyles.focusedInput
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: formData.className.trim() ? (initialData ? colors.text + '90' : colors.text) : colors.textSecondary,
                        fontSize: 15,
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      {formData.className.trim() || 'Select Class'}
                    </ThemedText>
                  </View>
                  {!initialData ? (
                    <Feather 
                      name={showClassDropdown ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color={colors.textSecondary} 
                      style={modalStyles.dropdownIcon}
                    />
                  ) : (
                    <Feather 
                      name="lock" 
                      size={18} 
                      color={colors.textSecondary + '90'} 
                      style={modalStyles.dropdownIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>
              {errors.className && (
                <ThemedText style={modalStyles.errorText}>{errors.className}</ThemedText>
              )}
            </View>

            <View style={modalStyles.rowContainer}>
              {/* Academic Year Dropdown */}
              <View style={modalStyles.halfContainer}>
                <ThemedText style={modalStyles.label}>Academic Year</ThemedText>
                <TouchableOpacity
                  onPress={() => !initialData && setShowYearDropdown(true)}
                  disabled={!!initialData}
                >
                  <View style={modalStyles.inputWrapper}>
                    <View
                      style={[
                        initialData ? modalStyles.lockedInput : modalStyles.dropdownInput,
                      ]}
                    >
                      <ThemedText
                        style={{
                          color: initialData ? colors.text + '90' : colors.text,
                          fontSize: 15,
                          fontFamily: 'Poppins-Medium',
                        }}
                      >
                        {formData.academicYear}
                      </ThemedText>
                    </View>
                    {!initialData ? (
                      <Feather 
                        name={showYearDropdown ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color={colors.textSecondary} 
                        style={modalStyles.dropdownIcon}
                      />
                    ) : (
                      <Feather 
                        name="lock" 
                        size={18} 
                        color={colors.textSecondary + '90'} 
                        style={modalStyles.dropdownIcon}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Total Terms Input */}
              <View style={modalStyles.halfContainer}>
                <View style={modalStyles.labelRow}>
                  <ThemedText style={modalStyles.label}>
                    Total Terms <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                  </ThemedText>
                </View>
                <View style={modalStyles.inputWrapper}>
                  <TextInput
                    style={[
                      modalStyles.breakdownInput,
                      errors.totalTerms && modalStyles.errorInput,
                      !errors.totalTerms && formData.totalTerms.trim() && modalStyles.focusedInput
                    ]}
                    value={formData.totalTerms}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, totalTerms: text }))
                      if (errors.totalTerms) {
                        setErrors(prev => ({ ...prev, totalTerms: '' }))
                      }
                    }}
                    placeholder="3"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <MaterialIcons
                    name="vertical-split" 
                    size={18} 
                    color={colors.textSecondary} 
                    style={modalStyles.dropdownIcon}
                  />
                </View>
                {errors.totalTerms && (
                  <ThemedText style={modalStyles.errorText}>{errors.totalTerms}</ThemedText>
                )}
              </View>
            </View>

            {/* Total Annual Fee Input */}
            <View style={modalStyles.inputContainer}>
              <View style={modalStyles.labelRow}>
                <ThemedText style={modalStyles.label}>
                  Total Annual Fee (₹) <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                </ThemedText>
              </View>
              <View style={modalStyles.inputWrapper}>
                <TextInput
                  style={[
                    modalStyles.breakdownInput,
                    errors.totalAnnualFee && modalStyles.errorInput,
                    !errors.totalAnnualFee && formData.totalAnnualFee.trim() && modalStyles.focusedInput
                  ]}
                  value={formData.totalAnnualFee}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, totalAnnualFee: text }))
                    if (errors.totalAnnualFee) {
                      setErrors(prev => ({ ...prev, totalAnnualFee: '' }))
                    }
                  }}
                  placeholder="Enter total annual fee"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <FontAwesome5 
                  name="rupee-sign" 
                  size={18} 
                  color={colors.textSecondary} 
                  style={modalStyles.dropdownIcon}
                />
              </View>
              {errors.totalAnnualFee && (
                <ThemedText style={modalStyles.errorText}>{errors.totalAnnualFee}</ThemedText>
              )}
            </View>

            {/* Fee Breakdown Section */}
            <View style={modalStyles.breakdownHeader}>
              <ThemedText style={modalStyles.breakdownTitle}>Fee Breakdown</ThemedText>
              <TouchableOpacity 
                onPress={() => setBreakdownExpanded(!breakdownExpanded)} 
                style={modalStyles.expandButton}
              >
                <Feather 
                  name={breakdownExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={colors.textSecondary} 
                />
                <ThemedText style={modalStyles.expandText}>
                  {breakdownExpanded ? 'Hide' : 'Show'} Breakdown
                </ThemedText>
              </TouchableOpacity>
            </View>

            {breakdownExpanded && (
              <View style={modalStyles.breakdownContent}>
                <TouchableOpacity 
                  onPress={handleAutoCalculate} 
                  style={modalStyles.autoCalcButton}
                >
                  <FontAwesome5 name="calculator" size={16} color={colors.primary} />
                  <ThemedText style={modalStyles.autoCalcText}>
                    Auto-calculate total from breakdown
                  </ThemedText>
                </TouchableOpacity>
                
                <View style={modalStyles.breakdownGrid}>
                  {breakdownFields.map((item) => (
                    <View key={item.field} style={modalStyles.breakdownItem}>
                      <View style={modalStyles.labelRow}>
                        <ThemedText style={modalStyles.label}>{item.label}</ThemedText>
                      </View>
                      <View style={modalStyles.inputWrapper}>
                        <TextInput
                          style={modalStyles.breakdownInput}
                          value={formData[item.field]}
                          onChangeText={(text) => {
                            const cleanedText = text.replace(/[^0-9.]/g, '')
                            const parts = cleanedText.split('.')
                            if (parts.length > 2) {
                              setFormData(prev => ({ 
                                ...prev, 
                                [item.field]: parts[0] + '.' + parts.slice(1).join('')
                              }))
                            } else {
                              setFormData(prev => ({ ...prev, [item.field]: cleanedText }))
                            }
                          }}
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                        />
                        <Entypo 
                          name={item.icon} 
                          size={16} 
                          color={colors.textSecondary} 
                          style={modalStyles.dropdownIcon}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                <View style={[modalStyles.feeSummaryCard, { marginTop: 16 }]}>
                  <View style={modalStyles.summaryItem}>
                    <ThemedText style={modalStyles.summaryLabel}>Breakdown Total:</ThemedText>
                    <ThemedText style={modalStyles.summaryValue}>
                      ₹{breakdownTotal.toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}

            {/* Fee Summary Card */}
            <View style={modalStyles.feeSummaryCard}>
              <View style={modalStyles.summaryItem}>
                <ThemedText style={modalStyles.summaryLabel}>Annual Fee:</ThemedText>
                <ThemedText style={modalStyles.summaryValue}>
                  ₹{(parseFloat(formData.totalAnnualFee) || 0).toLocaleString()}
                </ThemedText>
              </View>
              <View style={modalStyles.summaryItem}>
                <ThemedText style={modalStyles.summaryLabel}>Per Term ({formData.totalTerms || 3} terms):</ThemedText>
                <ThemedText style={modalStyles.summaryValue}>
                  ₹{termAmount.toLocaleString()}
                </ThemedText>
              </View>
              <View style={modalStyles.totalItem}>
                <ThemedText style={modalStyles.totalLabel}>TOTAL FEE</ThemedText>
                <ThemedText style={modalStyles.totalValue}>
                  ₹{(parseFloat(formData.totalAnnualFee) || 0).toLocaleString()}
                </ThemedText>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Footer Buttons */}
        <View style={modalStyles.buttonContainer}>
          {initialData && (
            <TouchableOpacity 
              style={modalStyles.deleteButton} 
              onPress={() => setShowDeleteModal(true)}
              disabled={loading}
            >
              <Feather name="trash-2" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={modalStyles.cancelButton} 
            onPress={onClose}
            disabled={loading}
          >
            <ThemedText style={[modalStyles.buttonText, { color: colors.textSecondary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || colors.primary]}
            style={[modalStyles.saveButton, { opacity: loading ? 0.7 : 1 }]}
          >
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={loading}
              style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
              {loading ? (
                <View style={modalStyles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[modalStyles.buttonText, { color: '#FFFFFF' }]}>
                    {initialData ? 'Updating...' : 'Saving...'}
                  </ThemedText>
                </View>
              ) : (
                <View style={modalStyles.loadingContainer}>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <ThemedText style={[modalStyles.buttonText, { color: '#FFFFFF' }]}>
                    {initialData ? 'Update Fee' : 'Save Fee'}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      {/* Dropdown Modals */}
      {renderClassDropdown()}
      {renderYearDropdown()}
      {renderDeleteModal()}

      {/* Toast Notification */}
      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        duration={3000}
        onHide={hideToast}
        position="top-center"
      />
    </View>
  )
}  

export default ClassFeeManagement