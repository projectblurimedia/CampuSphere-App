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
import { Feather, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

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

const BusFeeManagement = ({ 
  visible, 
  onClose, 
  onSave,
  initialData,
  existingBusFees = [] 
}) => {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    villageName: '',
    distance: '',
    feeAmount: '',
    vehicleType: 'bus',
    academicYear: CURRENT_ACADEMIC_YEAR,
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info'
  })
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        villageName: initialData.villageName || '',
        distance: initialData.distance?.toString() || '',
        feeAmount: initialData.feeAmount?.toString() || '',
        vehicleType: initialData.vehicleType || 'bus',
        academicYear: initialData.academicYear || CURRENT_ACADEMIC_YEAR,
        description: initialData.description || '',
      })
      setErrors({})
    } else {
      setFormData({
        villageName: '',
        distance: '',
        feeAmount: '',
        vehicleType: 'bus',
        academicYear: CURRENT_ACADEMIC_YEAR,
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
    
    if (!formData.villageName.trim()) {
      newErrors.villageName = 'Village name is required'
    }
    
    if (!formData.distance.trim()) {
      newErrors.distance = 'Distance is required'
    } else if (isNaN(formData.distance) || parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'Enter valid distance in km'
    }
    
    if (!formData.feeAmount.trim()) {
      newErrors.feeAmount = 'Annual bus fee is required'
    } else if (isNaN(formData.feeAmount) || parseFloat(formData.feeAmount) <= 0) {
      newErrors.feeAmount = 'Enter valid annual bus fee amount'
    }
    
    // Check for duplicate
    if (!initialData) {
      const duplicate = existingBusFees.find(fee => 
        fee.villageName.toLowerCase() === formData.villageName.toLowerCase() &&
        fee.academicYear === formData.academicYear
      )
      if (duplicate) {
        newErrors.villageName = `Bus fee already exists for ${formData.villageName} in ${formData.academicYear}`
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
        villageName: formData.villageName.trim(),
        distance: parseFloat(formData.distance),
        feeAmount: parseFloat(formData.feeAmount),
        vehicleType: formData.vehicleType,
        academicYear: formData.academicYear,
        description: formData.description.trim()
      }

      let response
      if (initialData && initialData._id) {
        // Update existing
        response = await axiosApi.put(`/bus-fees/${initialData._id}`, payload)
        showToast('Bus fee updated successfully!', 'success')
      } else {
        // Create new
        response = await axiosApi.post('/bus-fees', payload)
        showToast('Bus fee created successfully!', 'success')
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
      console.error('Error saving bus fee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save bus fee. Please try again.'
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await axiosApi.delete(`/bus-fees/${initialData._id}`)
      showToast('Bus fee deleted successfully!', 'success')
      onSave(null, true) // Pass true to indicate deletion
      setShowDeleteModal(false)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error deleting bus fee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete bus fee. Please try again.'
      showToast(errorMessage, 'error')
      setLoading(false)
      setShowDeleteModal(false)
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
        isSelected && { backgroundColor: colors.success + '15' }
      ]}
      onPress={() => onSelect(item)}
    >
      <ThemedText 
        style={[
          styles.dropdownItemText,
          isSelected && { color: colors.success, fontFamily: 'Poppins-SemiBold' }
        ]}
      >
        {item}
      </ThemedText>
      {isSelected && (
        <Feather name="check" size={18} color={colors.success} />
      )}
    </TouchableOpacity>
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
          <View style={[styles.dropdownHeader, { backgroundColor: colors.success + '10' }]}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.success }]}>
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
              Delete Bus Fee
            </ThemedText>
          </View>
          
          <View style={styles.deleteModalContent}>
            <Feather name="alert-triangle" size={48} color="#ef4444" style={styles.deleteWarningIcon} />
            <ThemedText style={[styles.deleteModalText, { color: colors.text }]}>
              Are you sure you want to delete bus fee for
            </ThemedText>
            <ThemedText style={[styles.deleteModalHighlight, { color: colors.success }]}>
              {formData.villageName}?
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
      maxHeight: SCREEN_HEIGHT * 0.75,
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
      backgroundColor: colors.success + '10',
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
      color: colors.success,
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
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 5,
    },
    requiredStar: {
      color: '#ef4444',
      fontSize: 16,
      marginLeft: 2,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
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
    focusedInput: {
      borderColor: colors.success,
    },
    errorInput: {
      borderColor: '#ef4444',
    },
    inputIcon: {
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
    vehicleTypeContainer: {
      marginTop: 12,
    },
    vehicleTypeLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 8,
    },
    vehicleTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    vehicleTypeButton: {
      flex: 1,
      minWidth: '22%',
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    vehicleTypeSelected: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success,
    },
    vehicleTypeIcon: {
      marginBottom: 6,
    },
    vehicleTypeText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
    },
    descriptionInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 14,
    },
    feeSummaryCard: {
      backgroundColor: colors.success + '08',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.success + '20',
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    summaryValue: {
      fontSize: 16,
      color: colors.success,
      fontFamily: 'Poppins-Bold',
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

  const vehicleTypes = [
    { label: 'Bus', value: 'bus', icon: 'bus' },
    { label: 'Van', value: 'van', icon: 'van-utility' },
    { label: 'Auto', value: 'auto', icon: 'rickshaw' },
    { label: 'Other', value: 'other', icon: 'car' },
  ]

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <View style={modalStyles.modalTitleContainer}>
            <MaterialIcons name="directions-bus" size={24} color={colors.success} />
            <ThemedText type='subtitle' style={modalStyles.modalTitle}>
              {initialData ? 'Edit Bus Fee' : 'New Bus Fee'}
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
            <View style={modalStyles.inputContainer}>
              <View style={modalStyles.labelRow}>
                <ThemedText style={modalStyles.label}>
                  Village Name <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                </ThemedText>
              </View>
              <View style={modalStyles.inputWrapper}>
                <TextInput
                  style={[
                    initialData ? modalStyles.lockedInput : modalStyles.input,
                    errors.villageName && modalStyles.errorInput,
                    !initialData && !errors.villageName && formData.villageName.trim() && modalStyles.focusedInput
                  ]}
                  value={formData.villageName}
                  onChangeText={(text) => {
                    if (!initialData) {
                      setFormData(prev => ({ ...prev, villageName: text }))
                      if (errors.villageName) {
                        setErrors(prev => ({ ...prev, villageName: '' }))
                      }
                    }
                  }}
                  placeholder="Enter village/area name"
                  placeholderTextColor={initialData ? colors.textSecondary + '90' : colors.textSecondary}
                  editable={!initialData}
                />
                {!initialData && !errors.villageName && formData.villageName.trim() && (
                  <Feather 
                    name="check-circle" 
                    size={18} 
                    color={colors.success} 
                    style={modalStyles.inputIcon}
                  />
                )}
                {initialData && (
                  <Feather 
                    name="lock" 
                    size={18} 
                    color={colors.textSecondary + '90'} 
                    style={modalStyles.inputIcon}
                  />
                )}
              </View>
              {errors.villageName && (
                <ThemedText style={modalStyles.errorText}>{errors.villageName}</ThemedText>
              )}
            </View>

            <View style={modalStyles.rowContainer}>
              <View style={modalStyles.halfContainer}>
                <View style={modalStyles.labelRow}>
                  <ThemedText style={modalStyles.label}>
                    Distance (km) <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                  </ThemedText>
                </View>
                <View style={modalStyles.inputWrapper}>
                  <TextInput
                    style={[
                      modalStyles.input,
                      errors.distance && modalStyles.errorInput,
                      !errors.distance && formData.distance.trim() && modalStyles.focusedInput
                    ]}
                    value={formData.distance}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, distance: text }))
                      if (errors.distance) {
                        setErrors(prev => ({ ...prev, distance: '' }))
                      }
                    }}
                    placeholder="e.g., 5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <Feather 
                    name="map-pin" 
                    size={18} 
                    color={colors.textSecondary} 
                    style={modalStyles.inputIcon}
                  />
                </View>
                {errors.distance && (
                  <ThemedText style={modalStyles.errorText}>{errors.distance}</ThemedText>
                )}
              </View>
              <View style={modalStyles.halfContainer}>
                <View style={modalStyles.labelRow}>
                  <ThemedText style={modalStyles.label}>
                    Annual Bus Fee (₹) <ThemedText style={modalStyles.requiredStar}>*</ThemedText>
                  </ThemedText>
                </View>
                <View style={modalStyles.inputWrapper}>
                  <TextInput
                    style={[
                      modalStyles.input,
                      errors.feeAmount && modalStyles.errorInput,
                      !errors.feeAmount && formData.feeAmount.trim() && modalStyles.focusedInput
                    ]}
                    value={formData.feeAmount}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, feeAmount: text }))
                      if (errors.feeAmount) {
                        setErrors(prev => ({ ...prev, feeAmount: '' }))
                      }
                    }}
                    placeholder="e.g., 2000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <FontAwesome5 
                    name="rupee-sign" 
                    size={18} 
                    color={colors.textSecondary} 
                    style={modalStyles.inputIcon}
                  />
                </View>
                {errors.feeAmount && (
                  <ThemedText style={modalStyles.errorText}>{errors.feeAmount}</ThemedText>
                )}
              </View>
            </View>

            <View style={modalStyles.inputContainer}>
              <ThemedText style={modalStyles.vehicleTypeLabel}>Vehicle Type</ThemedText>
              <View style={modalStyles.vehicleTypeGrid}>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      modalStyles.vehicleTypeButton,
                      formData.vehicleType === type.value && modalStyles.vehicleTypeSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, vehicleType: type.value }))}
                  >
                    <MaterialCommunityIcons
                      name={type.icon}
                      size={20}
                      color={formData.vehicleType === type.value ? colors.success : colors.textSecondary}
                      style={modalStyles.vehicleTypeIcon}
                    />
                    <ThemedText style={[
                      modalStyles.vehicleTypeText,
                      { 
                        color: formData.vehicleType === type.value ? colors.success : colors.textSecondary,
                        fontFamily: formData.vehicleType === type.value ? 'Poppins-SemiBold' : 'Poppins-Medium'
                      }
                    ]}>
                      {type.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.inputContainer}>
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
                      style={modalStyles.inputIcon}
                    />
                  ) : (
                    <Feather 
                      name="lock" 
                      size={18} 
                      color={colors.textSecondary + '90'} 
                      style={modalStyles.inputIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.inputContainer}>
              <ThemedText style={modalStyles.label}>Description (Optional)</ThemedText>
              <TextInput
                style={[modalStyles.input, modalStyles.descriptionInput]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Add any additional notes or details..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={modalStyles.feeSummaryCard}>
              <View style={modalStyles.summaryItem}>
                <ThemedText style={modalStyles.summaryLabel}>Annual Bus Fee:</ThemedText>
                <ThemedText style={modalStyles.summaryValue}>
                  ₹{(parseFloat(formData.feeAmount) || 0).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
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
            colors={[colors.success, colors.successDark || colors.success]}
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

export default BusFeeManagement