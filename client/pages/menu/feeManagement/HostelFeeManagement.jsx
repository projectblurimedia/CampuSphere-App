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
import { useSelector } from 'react-redux'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Class enum options matching Prisma schema
const CLASS_ENUM_OPTIONS = [
  { label: 'Pre-Nursery', value: 'PRE_NURSERY' },
  { label: 'Nursery', value: 'NURSERY' },
  { label: 'LKG', value: 'LKG' },
  { label: 'UKG', value: 'UKG' },
  { label: 'Class 1', value: 'CLASS_1' },
  { label: 'Class 2', value: 'CLASS_2' },
  { label: 'Class 3', value: 'CLASS_3' },
  { label: 'Class 4', value: 'CLASS_4' },
  { label: 'Class 5', value: 'CLASS_5' },
  { label: 'Class 6', value: 'CLASS_6' },
  { label: 'Class 7', value: 'CLASS_7' },
  { label: 'Class 8', value: 'CLASS_8' },
  { label: 'Class 9', value: 'CLASS_9' },
  { label: 'Class 10', value: 'CLASS_10' },
  { label: 'Class 11', value: 'CLASS_11' },
  { label: 'Class 12', value: 'CLASS_12' }
]

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
    totalAnnualFee: '',
    description: '',
    createdBy: '',
    updatedBy: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info'
  })
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const employee = useSelector(state => state.employee.employee)
  const teacherName = employee ? `${employee.firstName} ${employee.lastName}` : 'Accountant'

  // Get current user from Redux/context
  const getCurrentUser = () => {
    return teacherName || 'Unknown Employee'
  }

  useEffect(() => {
    if (initialData) {
      setFormData({
        className: initialData.className || '',
        totalAnnualFee: initialData.totalAnnualFee?.toString() || '',
        description: initialData.description || '',
        createdBy: initialData.createdBy || '',
        updatedBy: getCurrentUser()
      })
      setErrors({})
    } else {
      setFormData({
        className: '',
        totalAnnualFee: '',
        description: '',
        createdBy: getCurrentUser(),
        updatedBy: getCurrentUser()
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
    
    if (!formData.className) {
      newErrors.className = 'Class name is required'
    }
    
    if (!formData.totalAnnualFee) {
      newErrors.totalAnnualFee = 'Annual hostel fee is required'
    } else if (isNaN(formData.totalAnnualFee) || parseFloat(formData.totalAnnualFee) <= 0) {
      newErrors.totalAnnualFee = 'Enter valid annual hostel fee'
    }
    
    // Check for duplicate active fee structure
    if (!initialData) {
      const duplicate = existingHostelFees.find(fee => 
        fee.className === formData.className && 
        fee.isActive === true
      )
      if (duplicate) {
        newErrors.className = `Active hostel fee already exists for ${getClassLabel(formData.className)}`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getClassLabel = (enumValue) => {
    const found = CLASS_ENUM_OPTIONS.find(opt => opt.value === enumValue)
    return found ? found.label : enumValue
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        className: formData.className,
        totalAnnualFee: parseFloat(formData.totalAnnualFee),
        description: formData.description || null,
        createdBy: formData.createdBy,
        updatedBy: formData.updatedBy
      }

      let response
      if (initialData && initialData.id) {
        response = await axiosApi.put(`/fee-structure/hostel/${initialData.id}`, payload)
        showToast('Hostel fee updated successfully!', 'success')
      } else {
        response = await axiosApi.post('/fee-structure/hostel', payload)
        showToast('Hostel fee created successfully!', 'success')
      }

      if (response.data.success) {
        onSave(response.data.data)
        setLoading(false)
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
      await axiosApi.delete(`/fee-structure/hostel/${initialData.id}`)
      showToast('Hostel fee deleted successfully!', 'success')
      onSave(null, true)
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

  const handleSelectClass = (classValue) => {
    setFormData(prev => ({ ...prev, className: classValue }))
    setShowClassDropdown(false)
    if (errors.className) {
      setErrors(prev => ({ ...prev, className: '' }))
    }
  }

  const renderDropdownItem = ({ item, onSelect, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        isSelected && { backgroundColor: colors.warning + '15' }
      ]}
      onPress={() => onSelect(item.value)}
    >
      <ThemedText 
        style={[
          styles.dropdownItemText,
          isSelected && { color: colors.warning, fontFamily: 'Poppins-SemiBold' }
        ]}
      >
        {item.label}
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
            data={CLASS_ENUM_OPTIONS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => renderDropdownItem({
              item,
              onSelect: handleSelectClass,
              isSelected: formData.className === item.value
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
              {getClassLabel(formData.className)}?
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
                      !initialData && !errors.className && formData.className && modalStyles.focusedInput
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: formData.className ? (initialData ? colors.text + '90' : colors.text) : colors.textSecondary,
                        fontSize: 15,
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      {formData.className ? getClassLabel(formData.className) : 'Select Class'}
                    </ThemedText>
                  </View>
                  {!initialData ? (
                    <Feather 
                      name="chevron-down" 
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
                    !errors.totalAnnualFee && formData.totalAnnualFee && modalStyles.focusedInput
                  ]}
                  value={formData.totalAnnualFee}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '')
                    setFormData(prev => ({ ...prev, totalAnnualFee: cleaned }))
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