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
import { Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
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

const HostelFeeManagement = ({ 
  visible, 
  onClose, 
  onSave,
  initialData,
  existingHostelFees = [] 
}) => {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    className: '',
    academicYear: CURRENT_ACADEMIC_YEAR,
    totalTerms: '3',
    totalAnnualFee: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
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
        description: initialData.description || '',
      })
      setErrors({})
    } else {
      setFormData({
        className: '',
        academicYear: CURRENT_ACADEMIC_YEAR,
        totalTerms: '3',
        totalAnnualFee: '',
        description: '',
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
      newErrors.totalAnnualFee = 'Annual hostel fee is required'
    } else if (isNaN(formData.totalAnnualFee) || parseFloat(formData.totalAnnualFee) <= 0) {
      newErrors.totalAnnualFee = 'Enter valid annual hostel fee'
    }
    
    if (!formData.totalTerms.trim()) {
      newErrors.totalTerms = 'Number of terms is required'
    } else if (isNaN(formData.totalTerms) || parseInt(formData.totalTerms) <= 0 || parseInt(formData.totalTerms) > 4) {
      newErrors.totalTerms = 'Enter valid number of terms (1-4)'
    }
    
    // Check for duplicate
    if (!initialData) {
      const duplicate = existingHostelFees.find(fee => 
        fee.className.toLowerCase() === formData.className.toLowerCase() &&
        fee.academicYear === formData.academicYear
      )
      if (duplicate) {
        newErrors.className = `Hostel fee already exists for Class ${formData.className} in ${formData.academicYear}`
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
        description: formData.description.trim()
      }

      let response
      if (initialData && initialData._id) {
        // Update existing
        response = await axiosApi.put(`/hostel-fees/${initialData._id}`, payload)
        showToast('Hostel fee updated successfully!', 'success')
      } else {
        // Create new
        response = await axiosApi.post('/hostel-fees', payload)
        showToast('Hostel fee created successfully!', 'success')
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
      console.error('Error saving hostel fee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save hostel fee. Please try again.'
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await axiosApi.delete(`/hostel-fees/${initialData._id}`)
      showToast('Hostel fee deleted successfully!', 'success')
      onSave(null, true) // Pass true to indicate deletion
      setShowDeleteModal(false)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error deleting hostel fee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete hostel fee. Please try again.'
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
        isSelected && { backgroundColor: colors.warning + '15' }
      ]}
      onPress={() => onSelect(item)}
    >
      <ThemedText 
        style={[
          styles.dropdownItemText,
          isSelected && { color: colors.warning, fontFamily: 'Poppins-SemiBold' }
        ]}
      >
        {item}
      </ThemedText>
      {isSelected && (
        <Feather name="check" size={18} color={colors.warning} />
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
          <View style={[styles.dropdownHeader, { backgroundColor: colors.warning + '10' }]}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.warning }]}>
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
          <View style={[styles.dropdownHeader, { backgroundColor: colors.warning + '10' }]}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.warning }]}>
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
              Delete Hostel Fee
            </ThemedText>
          </View>
          
          <View style={styles.deleteModalContent}>
            <Feather name="alert-triangle" size={48} color="#ef4444" style={styles.deleteWarningIcon} />
            <ThemedText style={[styles.deleteModalText, { color: colors.text }]}>
              Are you sure you want to delete hostel fee for
            </ThemedText>
            <ThemedText style={[styles.deleteModalHighlight, { color: colors.warning }]}>
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
      backgroundColor: colors.warning + '10',
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
      color: colors.warning,
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
      borderColor: colors.warning,
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
      backgroundColor: colors.warning + '08',
      borderRadius: 16,
      padding: 20,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.warning + '20',
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
      borderTopColor: colors.warning + '20',
      marginTop: 8,
    },
    totalLabel: {
      fontSize: 15,
      color: colors.warning,
      fontFamily: 'Poppins-Bold',
    },
    totalValue: {
      fontSize: 18,
      color: colors.warning,
      fontFamily: 'Poppins-Bold',
    },
    descriptionInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 14,
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

  const termAmount = calculateTermAmount()

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <View style={modalStyles.modalTitleContainer}>
            <MaterialCommunityIcons name="bed" size={24} color={colors.warning} />
            <ThemedText type='subtitle' style={modalStyles.modalTitle}>
              {initialData ? 'Edit Hostel Fee' : 'New Hostel Fee'}
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
                      modalStyles.dropdownInput,
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

            {/* Total Annual Hostel Fee Input */}
            <View style={modalStyles.inputContainer}>
              <View style={modalStyles.labelRow}>
                <ThemedText style={modalStyles.label}>
                  Annual Hostel Fee (₹) <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                </ThemedText>
              </View>
              <View style={modalStyles.inputWrapper}>
                <TextInput
                  style={[
                    modalStyles.dropdownInput,
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
                  placeholder="Enter annual hostel fee"
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

            {/* Description Input */}
            <View style={modalStyles.inputContainer}>
              <ThemedText style={modalStyles.label}>Description (Optional)</ThemedText>
              <TextInput
                style={modalStyles.descriptionInput}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Add any additional notes or details about hostel fees..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Fee Summary Card */}
            <View style={modalStyles.feeSummaryCard}>
              <View style={modalStyles.summaryItem}>
                <ThemedText style={modalStyles.summaryLabel}>Annual Hostel Fee:</ThemedText>
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
                <ThemedText style={modalStyles.totalLabel}>TOTAL HOSTEL FEE</ThemedText>
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
            colors={[colors.warning, colors.warningDark || colors.warning]}
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

export default HostelFeeManagement