import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import {
  FontAwesome5,
  Feather,
  AntDesign,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
  Entypo,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import { Image } from 'expo-image'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Custom Input Component
const CustomInput = React.memo(({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  maxLength,
  editable = true,
  style,
  ...props
}) => {
  const { colors } = useTheme()
  
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      maxLength={maxLength}
      editable={editable}
      style={[
        {
          flex: 1,
          height: '100%',
          fontSize: 15,
          color: colors.text,
          paddingVertical: 0,
          paddingRight: 10,
          margin: 0,
          fontFamily: 'Poppins-Medium'
        },
        multiline && {
          height: '100%',
          textAlignVertical: 'top',
          paddingTop: 0,
        },
        style,
      ]}
      cursorColor="#1d9bf0"
      selectionColor="#1d9bf0"
      {...props}
    />
  )
})

// Custom Dropdown Component
const CustomDropdown = ({
  value,
  items,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  style,
  dropdownStyle,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(
    items.find(item => item.value === value)?.label || placeholder
  )
  const rotateAnim = useRef(new Animated.Value(0)).current
  const heightAnim = useRef(new Animated.Value(0)).current

  const toggleDropdown = () => {
    if (disabled) return
    
    if (isOpen) {
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => setIsOpen(false))
    } else {
      setIsOpen(true)
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: Math.min(items.length * 48, SCREEN_HEIGHT * 0.3),
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start()
    }
  }

  const handleSelect = (item) => {
    if (disabled) return
    setSelectedLabel(item.label)
    onSelect(item.value)
    toggleDropdown()
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })

  const maxDropdownHeight = Math.min(items.length * 48, SCREEN_HEIGHT * 0.3)

  useEffect(() => {
    const selectedItem = items.find(item => item.value === value)
    if (selectedItem) {
      setSelectedLabel(selectedItem.label)
    } else {
      setSelectedLabel(placeholder)
    }
  }, [value, items, placeholder])

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
      opacity: disabled ? 0.5 : 1,
    },
    dropdownIcon: {
      marginRight: 8,
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
      overflow: 'hidden',
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
        onPress={toggleDropdown}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Feather name="chevron-down" size={18} color={colors.textSecondary} style={dropdownStyles.dropdownIcon} />
        <ThemedText style={dropdownStyles.dropdownSelectedText}>
          {selectedLabel}
        </ThemedText>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </Animated.View>
      </TouchableOpacity>
      
      {isOpen && (
        <Animated.View style={[
          dropdownStyles.dropdownList,
          dropdownStyle,
          { height: heightAnim }
        ]}>
          <ScrollView 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: maxDropdownHeight }}
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
                disabled={disabled}
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
        </Animated.View>
      )}
    </View>
  )
}

export default function CreateStaff({ visible, onClose }) {
  const { colors, currentTheme } = useTheme()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), // Default to 18 years ago
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    employeeId: '',
    designation: '',
    department: '',
    joiningDate: new Date(),
    qualification: '',
    experience: '',
    aadharNumber: '',
    panNumber: '',
    status: 'Active',
  })

  const [profilePic, setProfilePic] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState({ dob: false, joiningDate: false })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Gender options
  const genderOptions = useMemo(() => [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ], [])

  // Status options
  const statusOptions = useMemo(() => [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'On Leave', value: 'On Leave' },
    { label: 'Resigned', value: 'Resigned' },
    { label: 'Terminated', value: 'Terminated' },
  ], [])

  // Update form data
  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Handle profile picture selection
  const handleProfilePic = useCallback(async () => {
    if (loading) return

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      showToast('Gallery access is required to select images.', 'error')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setProfilePic(result.assets[0])
    }
  }, [loading, showToast])

  // Validate form data
  const validateForm = useCallback(() => {
    const requiredFields = [
      'firstName', 'lastName', 'gender', 'dob', 'email', 'phone', 
      'address', 'city', 'state', 'pincode', 'employeeId', 
      'designation', 'department', 'qualification', 'experience', 
      'aadharNumber'
    ]

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        showToast(`Please fill ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error')
        return false
      }
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error')
      return false
    }

    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      showToast('Phone number must be 10 digits', 'error')
      return false
    }

    // Pincode validation (6 digits)
    const pincodeRegex = /^[0-9]{6}$/
    if (!pincodeRegex.test(formData.pincode)) {
      showToast('Pincode must be 6 digits', 'error')
      return false
    }

    // Aadhar validation (12 digits)
    const aadharRegex = /^[0-9]{12}$/
    if (!aadharRegex.test(formData.aadharNumber)) {
      showToast('Aadhar number must be 12 digits', 'error')
      return false
    }

    // PAN validation (if provided)
    if (formData.panNumber && formData.panNumber.trim() !== '') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(formData.panNumber.toUpperCase())) {
        showToast('Please enter a valid PAN number', 'error')
        return false
      }
    }

    // Experience validation (non-negative)
    if (parseFloat(formData.experience) < 0) {
      showToast('Experience cannot be negative', 'error')
      return false
    }

    return true
  }, [formData, showToast])

  // Handle save
  const handleSave = useCallback(async () => {
    if (loading) return
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          if (key === 'dob' || key === 'joiningDate') {
            formDataToSend.append(key, new Date(formData[key]).toISOString())
          } else {
            formDataToSend.append(key, formData[key].toString().trim())
          }
        }
      })

      // Add profile picture
      if (profilePic) {
        const uriParts = profilePic.uri.split('.')
        const fileType = uriParts[uriParts.length - 1]
        formDataToSend.append('profilePic', {
          uri: profilePic.uri,
          name: `profile_${Date.now()}.${fileType}`,
          type: profilePic.mimeType || `image/${fileType}`,
        })
      }

      const response = await axiosApi.post('/staff', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success || response.data.message?.includes('success')) {
        showToast('Staff member created successfully!', 'success')
        resetForm()
        setTimeout(() => onClose(), 1500)
      } else {
        showToast(response.data.message || 'Failed to create staff', 'error')
      }
    } catch (error) {
      console.error('Create staff error:', error)
      let errorMessage = 'Failed to create staff member'
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      error.response.data?.errors?.join(', ') || 
                      'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to create staff member'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [formData, profilePic, validateForm, loading, onClose, showToast])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      dob: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000),
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      employeeId: '',
      designation: '',
      department: '',
      joiningDate: new Date(),
      qualification: '',
      experience: '',
      aadharNumber: '',
      panNumber: '',
      status: 'Active',
    })
    setProfilePic(null)
    setShowDatePicker({ dob: false, joiningDate: false })
  }, [])

  // Date change handlers
  const onDateChange = useCallback((field) => (event, selectedDate) => {
    setShowDatePicker(prev => ({ ...prev, [field]: Platform.OS === 'ios' }))
    if (selectedDate) {
      updateFormData({ [field]: selectedDate })
    }
  }, [updateFormData])

  // Input change handlers
  const onFirstNameChange = useCallback((text) => updateFormData({ firstName: text }), [updateFormData])
  const onLastNameChange = useCallback((text) => updateFormData({ lastName: text }), [updateFormData])
  const onEmailChange = useCallback((text) => updateFormData({ email: text.toLowerCase() }), [updateFormData])
  const onPhoneChange = useCallback((text) => updateFormData({ phone: text.replace(/[^0-9]/g, '') }), [updateFormData])
  const onAlternatePhoneChange = useCallback((text) => updateFormData({ alternatePhone: text.replace(/[^0-9]/g, '') }), [updateFormData])
  const onAddressChange = useCallback((text) => updateFormData({ address: text }), [updateFormData])
  const onCityChange = useCallback((text) => updateFormData({ city: text }), [updateFormData])
  const onStateChange = useCallback((text) => updateFormData({ state: text }), [updateFormData])
  const onPincodeChange = useCallback((text) => updateFormData({ pincode: text.replace(/[^0-9]/g, '') }), [updateFormData])
  const onEmployeeIdChange = useCallback((text) => updateFormData({ employeeId: text.toUpperCase() }), [updateFormData])
  const onDesignationChange = useCallback((text) => updateFormData({ designation: text }), [updateFormData])
  const onDepartmentChange = useCallback((text) => updateFormData({ department: text }), [updateFormData])
  const onQualificationChange = useCallback((text) => updateFormData({ qualification: text }), [updateFormData])
  const onExperienceChange = useCallback((text) => updateFormData({ experience: text.replace(/[^0-9.]/g, '') }), [updateFormData])
  const onAadharNumberChange = useCallback((text) => updateFormData({ aadharNumber: text.replace(/[^0-9]/g, '') }), [updateFormData])
  const onPanNumberChange = useCallback((text) => updateFormData({ panNumber: text.toUpperCase().replace(/[^A-Z0-9]/g, '') }), [updateFormData])

  // Dropdown handlers
  const onGenderSelect = useCallback((value) => updateFormData({ gender: value }), [updateFormData])
  const onStatusSelect = useCallback((value) => updateFormData({ status: value }), [updateFormData])

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }, [loading, resetForm, onClose])

  const styles = useMemo(() => StyleSheet.create({
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
      paddingBottom: 500
    },
    card: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formGroup: {
      marginBottom: 26,
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
    profilePicContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    profilePicOuter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      padding: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profilePicInner: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '50',
      overflow: 'hidden',
    },
    profilePicImage: {
      width: '100%',
      height: '100%',
      borderRadius: 45,
    },
    profilePicHint: {
      color: colors.textSecondary,
      marginTop: 6,
      fontSize: 11,
    },
    fieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    inputContainer: {
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
      paddingHorizontal: 10,
      height: 50,
    },
    inputIcon: {
      marginRight: 8,
      color: colors.textSecondary,
      width: 24,
      marginBottom: 3,
    },
    textInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 0,
      margin: 0,
      fontFamily: 'Poppins-Medium'
    },
    dateText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
      height: '100%',
      textAlignVertical: 'center',
      fontFamily: 'Poppins-Medium'
    },
    dateTouchable: {
      flex: 1,
      justifyContent: 'center',
      height: '100%',
    },
    multilineContainer: {
      height: 90,
      alignItems: 'flex-start',
      paddingTop: 10,
      paddingBottom: 10,
    },
    multilineInput: {
      height: '100%',
      textAlignVertical: 'top',
      paddingTop: 0,
    },
    multilineIcon: {
      marginTop: 4,
    },
    footerWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      paddingTop: 8,
      backgroundColor: colors?.background
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
      paddingVertical: 13,
      paddingHorizontal: 18,
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      marginLeft: 8,
    },
  }), [colors])

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={[styles.backButton, loading && { opacity: 0.5 }]} 
                onPress={handleClose}
                disabled={loading}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText type='subtitle' style={styles.title}>Create New Staff</ThemedText>
                <ThemedText style={styles.subtitle}>Fill the staff details below</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* PERSONAL DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="person" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Personal Details</ThemedText>
                </View>
              </View>

              <View style={styles.profilePicContainer}>
                <TouchableOpacity onPress={handleProfilePic} activeOpacity={0.8} disabled={loading}>
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.profilePicOuter}
                  >
                    <View style={styles.profilePicInner}>
                      {profilePic?.uri ? (
                        <Image source={{ uri: profilePic.uri }} style={styles.profilePicImage} />
                      ) : (
                        <Feather name="camera" size={30} color={colors.textSecondary} />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                <ThemedText style={styles.profilePicHint}>
                  Tap to add profile picture
                </ThemedText>
              </View>

              <ThemedText style={styles.fieldLabel}>First Name *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChangeText={onFirstNameChange}
                  editable={!loading}
                  maxLength={50}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Last Name *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="user-check" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChangeText={onLastNameChange}
                  editable={!loading}
                  maxLength={50}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Gender *</ThemedText>
              <CustomDropdown
                value={formData.gender}
                items={genderOptions}
                onSelect={onGenderSelect}
                placeholder="Select Gender"
                disabled={loading}
              />

              <ThemedText style={styles.fieldLabel}>Date of Birth *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="cake-variant"
                  size={20}
                  style={styles.inputIcon}
                />
                <TouchableOpacity
                  style={styles.dateTouchable}
                  onPress={() => !loading && setShowDatePicker(prev => ({ ...prev, dob: true }))}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <ThemedText style={styles.dateText}>
                    {formData.dob.toLocaleDateString()}
                  </ThemedText>
                </TouchableOpacity>
                {showDatePicker.dob && (
                  <DateTimePicker
                    value={formData.dob}
                    mode="date"
                    display="default"
                    maximumDate={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)} // Minimum 18 years
                    onChange={onDateChange('dob')}
                  />
                )}
              </View>
            </View>

            {/* CONTACT DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="contact-phone" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Contact Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Email *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={onEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  maxLength={100}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Phone Number *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChangeText={onPhoneChange}
                  keyboardType="phone-pad"
                  editable={!loading}
                  maxLength={10}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Alternate Phone Number</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter alternate phone number"
                  value={formData.alternatePhone}
                  onChangeText={onAlternatePhoneChange}
                  keyboardType="phone-pad"
                  editable={!loading}
                  maxLength={10}
                />
              </View>
            </View>

            {/* ADDRESS DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="location-on" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Address Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Address *</ThemedText>
              <View style={[styles.inputContainer, styles.multilineContainer]}>
                <Feather 
                  name="map-pin" 
                  size={20} 
                  style={[styles.inputIcon, styles.multilineIcon]} 
                />
                <CustomInput
                  placeholder="Enter full address"
                  value={formData.address}
                  onChangeText={onAddressChange}
                  multiline
                  numberOfLines={3}
                  style={styles.multilineInput}
                  editable={!loading}
                  maxLength={500}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>City *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-city" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter city"
                  value={formData.city}
                  onChangeText={onCityChange}
                  editable={!loading}
                  maxLength={50}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>State *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="map" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter state"
                  value={formData.state}
                  onChangeText={onStateChange}
                  editable={!loading}
                  maxLength={50}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Pincode *</ThemedText>
              <View style={styles.inputContainer}>
                <Entypo name="pin" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter 6-digit pincode"
                  value={formData.pincode}
                  onChangeText={onPincodeChange}
                  keyboardType="number-pad"
                  editable={!loading}
                  maxLength={6}
                />
              </View>
            </View>

            {/* EMPLOYMENT DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="work" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Employment Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Employee ID *</ThemedText>
              <View style={styles.inputContainer}>
                <AntDesign name="idcard" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter employee ID"
                  value={formData.employeeId}
                  onChangeText={onEmployeeIdChange}
                  editable={!loading}
                  maxLength={20}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Designation *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="badge" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter designation"
                  value={formData.designation}
                  onChangeText={onDesignationChange}
                  editable={!loading}
                  maxLength={100}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Department *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="business" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter department"
                  value={formData.department}
                  onChangeText={onDepartmentChange}
                  editable={!loading}
                  maxLength={100}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Joining Date</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="date-range" size={20} style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.dateTouchable}
                  onPress={() => !loading && setShowDatePicker(prev => ({ ...prev, joiningDate: true }))}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <ThemedText style={styles.dateText}>
                    {formData.joiningDate.toLocaleDateString()}
                  </ThemedText>
                </TouchableOpacity>
                {showDatePicker.joiningDate && (
                  <DateTimePicker
                    value={formData.joiningDate}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={onDateChange('joiningDate')}
                  />
                )}
              </View>

              <ThemedText style={styles.fieldLabel}>Qualification *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="school" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter qualification"
                  value={formData.qualification}
                  onChangeText={onQualificationChange}
                  editable={!loading}
                  maxLength={200}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Experience (Years) *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="timeline" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter years of experience"
                  value={formData.experience}
                  onChangeText={onExperienceChange}
                  keyboardType="decimal-pad"
                  editable={!loading}
                  maxLength={3}
                />
              </View>
            </View>

            {/* DOCUMENT DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="description" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Document Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Aadhar Number *</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="credit-card" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter 12-digit Aadhar number"
                  value={formData.aadharNumber}
                  onChangeText={onAadharNumberChange}
                  keyboardType="number-pad"
                  editable={!loading}
                  maxLength={12}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>PAN Number</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="assignment" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter PAN number (e.g., ABCDE1234F)"
                  value={formData.panNumber}
                  onChangeText={onPanNumberChange}
                  editable={!loading}
                  maxLength={10}
                />
              </View>
            </View>

            {/* STATUS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="settings" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Status</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Employment Status</ThemedText>
              <CustomDropdown
                value={formData.status}
                items={statusOptions}
                onSelect={onStatusSelect}
                placeholder="Select Status"
                disabled={loading}
              />
            </View>
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
                style={[styles.saveBtnPressable, loading && { opacity: 0.5 }]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                )}
                <ThemedText style={styles.saveBtnText}>
                  {loading ? 'Saving...' : 'Save Staff'}
                </ThemedText>
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
          duration={3000}
          showCloseButton={true}
        />
      </View>
    </Modal>
  )
}