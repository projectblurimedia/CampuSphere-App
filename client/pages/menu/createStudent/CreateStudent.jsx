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
  style,
  editable = true,
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
      editable={editable}
      style={[
        {
          flex: 1,
          height: '100%',
          fontSize: 15,
          color: editable ? colors.text : colors.textSecondary,
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
  style,
  dropdownStyle,
  editable = true,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(
    items.find(item => item.value === value)?.label || placeholder
  )
  const rotateAnim = useRef(new Animated.Value(0)).current
  const heightAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    setSelectedLabel(items.find(item => item.value === value)?.label || placeholder)
  }, [value, items, placeholder])

  const toggleDropdown = () => {
    if (!editable) return
    
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
    setSelectedLabel(item.label)
    onSelect(item.value)
    toggleDropdown()
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })

  const maxDropdownHeight = Math.min(items.length * 48, SCREEN_HEIGHT * 0.3)

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
      opacity: editable ? 1 : 0.6,
    },
    dropdownIcon: {
      marginRight: 8,
    },
    dropdownSelectedText: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      color: value ? (editable ? colors.text : colors.textSecondary) : colors.textSecondary,
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
        disabled={!editable}
      >
        <Feather name="chevron-down" size={18} color={colors.textSecondary} style={dropdownStyles.dropdownIcon} />
        <ThemedText style={dropdownStyles.dropdownSelectedText}>
          {selectedLabel}
        </ThemedText>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color={editable ? colors.primary : colors.textSecondary} />
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

export default function CreateStudent({ visible, onClose, studentData: editStudentData }) {
  const { colors } = useTheme()
  const isEditMode = !!editStudentData

  // Form state - only editable fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: new Date(),
    gender: 'NOT_SPECIFIED',
    address: '',
    village: '',
    parentName: '',
    parentPhone: '',
    parentPhone2: '',
    parentEmail: '',
  })

  // Additional state for both create and edit mode
  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [selectedStudentType, setSelectedStudentType] = useState('DAY_SCHOLAR')
  const [isUsingSchoolTransport, setIsUsingSchoolTransport] = useState(false)
  const [schoolFeeDiscount, setSchoolFeeDiscount] = useState(0)
  const [transportFeeDiscount, setTransportFeeDiscount] = useState(0)
  const [hostelFeeDiscount, setHostelFeeDiscount] = useState(0)
  const [admissionNo, setAdmissionNo] = useState('')
  const [rollNo, setRollNo] = useState('')

  const [selectedGender, setSelectedGender] = useState('NOT_SPECIFIED')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [profilePic, setProfilePic] = useState(null)
  const [existingProfilePic, setExistingProfilePic] = useState(null)
  const [removeProfilePic, setRemoveProfilePic] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Load student data in edit mode
  useEffect(() => {
    if (visible && isEditMode && editStudentData) {
      const dob = editStudentData.dob ? new Date(editStudentData.dob) : new Date()
      
      setFormData({
        firstName: editStudentData.firstName || '',
        lastName: editStudentData.lastName || '',
        dob: dob,
        gender: editStudentData.gender || 'NOT_SPECIFIED',
        address: editStudentData.address || '',
        village: editStudentData.village || '',
        parentName: editStudentData.parentName || '',
        parentPhone: editStudentData.parentPhone || '',
        parentPhone2: editStudentData.parentPhone2 || '',
        parentEmail: editStudentData.parentEmail || '',
      })

      // Load all fields in edit mode
      setSelectedClass(editStudentData.class || '1')
      setSelectedSection(editStudentData.section || 'A')
      setSelectedStudentType(editStudentData.studentType || 'DAY_SCHOLAR')
      setIsUsingSchoolTransport(editStudentData.isUsingSchoolTransport || false)
      setSchoolFeeDiscount(editStudentData.schoolFeeDiscount || 0)
      setTransportFeeDiscount(editStudentData.transportFeeDiscount || 0)
      setHostelFeeDiscount(editStudentData.hostelFeeDiscount || 0)
      setAdmissionNo(editStudentData.admissionNo || '')
      setRollNo(editStudentData.rollNo || '')
      
      setSelectedGender(editStudentData.gender || 'NOT_SPECIFIED')
      setExistingProfilePic(editStudentData.profilePicUrl || null)
      setRemoveProfilePic(false)
    }
  }, [visible, isEditMode, editStudentData])

  // Dropdown options
  const classes = useMemo(() => [
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
  ], [])

  const sections = useMemo(() => 
    ['A', 'B', 'C', 'D', 'E'].map(sec => ({
      label: `Section ${sec}`,
      value: sec
    })), []
  )

  const genders = useMemo(() => [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Not Specified', value: 'NOT_SPECIFIED' },
  ], [])

  const studentTypes = useMemo(() => [
    { label: 'Day Scholar', value: 'DAY_SCHOLAR' },
    { label: 'Hosteller', value: 'HOSTELLER' },
  ], [])

  const yesNoOptions = useMemo(() => [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ], [])

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

  const handleProfilePic = useCallback(async () => {
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
      setProfilePic(result.assets[0].uri)
      setExistingProfilePic(null)
      setRemoveProfilePic(false)
    }
  }, [showToast])

  const handleDeleteProfilePic = useCallback(() => {
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteProfilePic = useCallback(() => {
    setProfilePic(null)
    setExistingProfilePic(null)
    
    if (isEditMode) {
      setRemoveProfilePic(true)
    }
    
    setShowDeleteModal(false)
    showToast('Profile picture removed', 'success')
  }, [isEditMode, showToast])

  const handleSave = useCallback(async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      showToast('First name and last name are required', 'error')
      return
    }

    if (!isEditMode && !admissionNo) {
      showToast('Admission number is required', 'error')
      return
    }

    if (!formData.parentPhone) {
      showToast('Parent phone number is required', 'error')
      return
    }

    if (!isEditMode && !selectedClass) {
      showToast('Class is required', 'error')
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      
      // Common fields for both create and edit
      formDataToSend.append('firstName', formData.firstName.trim())
      formDataToSend.append('lastName', formData.lastName.trim())
      formDataToSend.append('dob', formData.dob.toISOString())
      formDataToSend.append('gender', formData.gender)
      formDataToSend.append('address', formData.address || '')
      formDataToSend.append('village', formData.village || '')
      formDataToSend.append('parentName', formData.parentName || '')
      formDataToSend.append('parentPhone', formData.parentPhone.trim())
      formDataToSend.append('parentPhone2', formData.parentPhone2 || '')
      formDataToSend.append('parentEmail', formData.parentEmail || '')

      // Always send academic and service fields (for both create and edit)
      formDataToSend.append('class', selectedClass)
      formDataToSend.append('section', selectedSection)
      formDataToSend.append('admissionNo', admissionNo.trim())
      formDataToSend.append('rollNo', rollNo || '')
      formDataToSend.append('studentType', selectedStudentType)
      formDataToSend.append('isUsingSchoolTransport', isUsingSchoolTransport)
      formDataToSend.append('schoolFeeDiscount', schoolFeeDiscount.toString())
      formDataToSend.append('transportFeeDiscount', transportFeeDiscount.toString())
      formDataToSend.append('hostelFeeDiscount', hostelFeeDiscount.toString())

      // Handle profile picture
      if (profilePic) {
        const uriParts = profilePic.split('.')
        const fileType = uriParts[uriParts.length - 1]
        formDataToSend.append('profilePic', {
          uri: profilePic,
          name: `profilePic.${fileType}`,
          type: `image/${fileType}`,
        })
      }

      // Add removeProfilePic flag for edit mode
      if (isEditMode && removeProfilePic) {
        formDataToSend.append('removeProfilePic', 'true')
      }

      let response
      if (isEditMode) {
        // Update existing student
        response = await axiosApi.put(`/students/${editStudentData.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        // Create new student
        response = await axiosApi.post('/students', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      if (response.data.success || response.data.message?.includes('successfully')) {
        showToast(
          isEditMode ? 'Student updated successfully!' : 'Student created successfully!', 
          'success'
        )
        resetForm()
        setTimeout(() => onClose(true), 1500)
      }
    } catch (error) {
      console.error(isEditMode ? 'Update student error:' : 'Create student error:', error)
      let errorMessage = isEditMode ? 'Failed to update student' : 'Failed to create student'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || (isEditMode ? 'Failed to update student' : 'Failed to create student')
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [
    formData, 
    isEditMode, 
    editStudentData, 
    profilePic, 
    removeProfilePic,
    showToast, 
    onClose,
    // All fields
    selectedClass,
    selectedSection,
    admissionNo,
    rollNo,
    selectedStudentType,
    isUsingSchoolTransport,
    schoolFeeDiscount,
    transportFeeDiscount,
    hostelFeeDiscount
  ])

  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      dob: new Date(),
      gender: 'NOT_SPECIFIED',
      address: '',
      village: '',
      parentName: '',
      parentPhone: '',
      parentPhone2: '',
      parentEmail: '',
    })
    setSelectedGender('NOT_SPECIFIED')
    setProfilePic(null)
    setExistingProfilePic(null)
    setRemoveProfilePic(false)
    
    // Reset all fields
    setSelectedClass('1')
    setSelectedSection('A')
    setSelectedStudentType('DAY_SCHOLAR')
    setIsUsingSchoolTransport(false)
    setSchoolFeeDiscount(0)
    setTransportFeeDiscount(0)
    setHostelFeeDiscount(0)
    setAdmissionNo('')
    setRollNo('')
  }, [])

  const onDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      updateFormData({ dob: selectedDate })
    }
  }, [updateFormData])

  const onGenderSelect = useCallback((value) => {
    setSelectedGender(value)
    updateFormData({ gender: value })
  }, [updateFormData])

  const onFirstNameChange = useCallback((text) => updateFormData({ firstName: text }), [updateFormData])
  const onLastNameChange = useCallback((text) => updateFormData({ lastName: text }), [updateFormData])
  const onAddressChange = useCallback((text) => updateFormData({ address: text }), [updateFormData])
  const onVillageChange = useCallback((text) => updateFormData({ village: text }), [updateFormData])
  const onParentNameChange = useCallback((text) => updateFormData({ parentName: text }), [updateFormData])
  const onParentPhoneChange = useCallback((text) => updateFormData({ parentPhone: text }), [updateFormData])
  const onParentPhone2Change = useCallback((text) => updateFormData({ parentPhone2: text }), [updateFormData])
  const onParentEmailChange = useCallback((text) => updateFormData({ parentEmail: text }), [updateFormData])

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
    profilePicWrapper: {
      position: 'relative',
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
    deletePicButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
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
    sectionDivider: {
      marginTop: 8,
      marginBottom: 16,
      height: 1,
      backgroundColor: colors.border,
    },
    readOnlyNotice: {
      backgroundColor: colors.primary + '10',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    readOnlyNoticeText: {
      color: colors.primary,
      fontSize: 12,
      marginLeft: 8,
      flex: 1,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: SCREEN_WIDTH * 0.8,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.danger + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    modalMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonCancel: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonDelete: {
      backgroundColor: colors.danger,
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalButtonTextCancel: {
      color: colors.text,
    },
    modalButtonTextDelete: {
      color: '#FFFFFF',
    },
    discountContainer: {
      marginTop: 8,
      marginBottom: 8,
      paddingLeft: 16,
      borderLeftWidth: 2,
      borderLeftColor: colors.primary + '30',
    },
  }), [colors])

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm()
      onClose(false)
    }
  }, [loading, resetForm, onClose])

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
                <ThemedText type='subtitle' style={styles.title}>
                  {isEditMode ? 'Edit Student' : 'Create New Student'}
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  {isEditMode ? 'Update editable information' : 'Fill all details below'}
                </ThemedText>
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
            {/* PROFILE PICTURE */}
            <View style={styles.profilePicContainer}>
              <View style={styles.profilePicWrapper}>
                <TouchableOpacity onPress={handleProfilePic} activeOpacity={0.8} disabled={loading}>
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.profilePicOuter}
                  >
                    <View style={styles.profilePicInner}>
                      {profilePic ? (
                        <Image source={{ uri: profilePic }} style={styles.profilePicImage} />
                      ) : existingProfilePic ? (
                        <Image source={{ uri: existingProfilePic }} style={styles.profilePicImage} />
                      ) : (
                        <Feather name="camera" size={30} color={colors.textSecondary} />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                {(profilePic || existingProfilePic) && (
                  <TouchableOpacity
                    style={[styles.deletePicButton, { backgroundColor: colors.danger }]}
                    onPress={handleDeleteProfilePic}
                    disabled={loading}
                  >
                    <MaterialIcons name="delete" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              
              <ThemedText style={styles.profilePicHint}>
                {isEditMode ? 'Tap to change profile picture' : 'Tap to add profile picture'}
              </ThemedText>
            </View>

            {/* PERSONAL DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="person" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Personal Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>First Name *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChangeText={onFirstNameChange}
                  editable={!loading}
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
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Date of Birth</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="cake-variant"
                  size={20}
                  style={styles.inputIcon}
                />
                <TouchableOpacity
                  style={styles.dateTouchable}
                  onPress={() => !loading && setShowDatePicker(true)}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <ThemedText style={styles.dateText}>
                    {formData.dob.toLocaleDateString('en-GB')}
                  </ThemedText>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dob}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={onDateChange}
                  />
                )}
              </View>

              <ThemedText style={styles.fieldLabel}>Gender</ThemedText>
              <CustomDropdown
                value={formData.gender}
                items={genders}
                onSelect={onGenderSelect}
                placeholder="Select Gender"
                style={loading ? { opacity: 0.5 } : {}}
                editable={!loading}
              />
            </View>

            {/* ACADEMIC DETAILS - Hide class in edit mode */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="school" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Academic Details</ThemedText>
                </View>
              </View>

              {/* Class - Hidden in edit mode */}
              {!isEditMode && (
                <>
                  <ThemedText style={styles.fieldLabel}>Class *</ThemedText>
                  <CustomDropdown
                    value={selectedClass}
                    items={classes}
                    onSelect={setSelectedClass}
                    placeholder="Select Class"
                    style={loading ? { opacity: 0.5 } : {}}
                    editable={!loading}
                  />
                </>
              )}

              <ThemedText style={styles.fieldLabel}>Section *</ThemedText>
              <CustomDropdown
                value={selectedSection}
                items={sections}
                onSelect={setSelectedSection}
                placeholder="Select Section"
                style={loading ? { opacity: 0.5 } : {}}
                editable={!loading}
              />

              {/* Admission Number - Hidden in edit mode */}
              {!isEditMode && (
                <>
                  <ThemedText style={styles.fieldLabel}>Admission Number *</ThemedText>
                  <View style={styles.inputContainer}>
                    <AntDesign name="idcard" size={20} style={styles.inputIcon} />
                    <CustomInput
                      placeholder="Enter admission number"
                      value={admissionNo}
                      onChangeText={setAdmissionNo}
                      keyboardType="default"
                      editable={!loading}
                    />
                  </View>
                </>
              )}

              <ThemedText style={styles.fieldLabel}>Roll Number</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="numbers" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter roll number"
                  value={rollNo}
                  onChangeText={setRollNo}
                  keyboardType="default"
                  editable={!loading}
                />
              </View>

              <View style={styles.sectionDivider} />
            </View>

            {/* ADDRESS DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="location-on" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Address Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Address</ThemedText>
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
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Village / Town</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-city" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter village / town"
                  value={formData.village}
                  onChangeText={onVillageChange}
                  editable={!loading}
                />
              </View>
            </View>

            {/* PARENT DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons
                    name="family-restroom"
                    size={22}
                    color={colors.primary}
                  />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Parent / Guardian</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Name</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter parent / guardian name"
                  value={formData.parentName}
                  onChangeText={onParentNameChange}
                  editable={!loading}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Phone 1 *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter parent phone number"
                  value={formData.parentPhone}
                  onChangeText={onParentPhoneChange}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Phone 2</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter alternate phone number"
                  value={formData.parentPhone2}
                  onChangeText={onParentPhone2Change}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Email</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter parent email"
                  value={formData.parentEmail}
                  onChangeText={onParentEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* SERVICES DETAILS - Student Type moved here */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="room-service" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Services</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Student Type *</ThemedText>
              <CustomDropdown
                value={selectedStudentType}
                items={studentTypes}
                onSelect={setSelectedStudentType}
                placeholder="Select Student Type"
                style={loading ? { opacity: 0.5 } : {}}
                editable={!loading}
              />

              {/* Day Scholar specific option */}
              {selectedStudentType === 'DAY_SCHOLAR' && (
                <>
                  <ThemedText style={styles.fieldLabel}>Using School Transport?</ThemedText>
                  <CustomDropdown
                    value={isUsingSchoolTransport}
                    items={yesNoOptions}
                    onSelect={setIsUsingSchoolTransport}
                    placeholder="Select Yes/No"
                    style={loading ? { opacity: 0.5 } : {}}
                    editable={!loading}
                  />
                </>
              )}

              {/* Hosteller specific option */}
              {selectedStudentType === 'HOSTELLER' && (
                <>
                  <ThemedText style={styles.fieldLabel}>Using School Hostel?</ThemedText>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="hotel" size={20} style={styles.inputIcon} />
                    <CustomInput
                      placeholder="Hostel"
                      value="Yes (Default)"
                      editable={false}
                      style={{ color: colors.primary }}
                    />
                  </View>
                </>
              )}
            </View>

            {/* DISCOUNTS DETAILS - All discounts together */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="discount" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Fee Discounts</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>School Fee Discount (%)</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="percent" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter school fee discount"
                  value={schoolFeeDiscount.toString()}
                  onChangeText={(text) => setSchoolFeeDiscount(parseInt(text) || 0)}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              {/* Transport Discount - Only show if day scholar AND using transport */}
              {selectedStudentType === 'DAY_SCHOLAR' && isUsingSchoolTransport && (
                <>
                  <ThemedText style={styles.fieldLabel}>Transport Fee Discount (%)</ThemedText>
                  <View style={styles.inputContainer}>
                    <Feather name="percent" size={20} style={styles.inputIcon} />
                    <CustomInput
                      placeholder="Enter transport fee discount"
                      value={transportFeeDiscount.toString()}
                      onChangeText={(text) => setTransportFeeDiscount(parseInt(text) || 0)}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>
                </>
              )}

              {/* Hostel Discount - Only show if hosteller */}
              {selectedStudentType === 'HOSTELLER' && (
                <>
                  <ThemedText style={styles.fieldLabel}>Hostel Fee Discount (%)</ThemedText>
                  <View style={styles.inputContainer}>
                    <Feather name="percent" size={20} style={styles.inputIcon} />
                    <CustomInput
                      placeholder="Enter hostel fee discount"
                      value={hostelFeeDiscount.toString()}
                      onChangeText={(text) => setHostelFeeDiscount(parseInt(text) || 0)}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>
                </>
              )}
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
                  {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Student' : 'Save Student')}
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* DELETE CONFIRMATION MODAL */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalIcon, { backgroundColor: colors.danger + '20' }]}>
                <MaterialIcons name="delete" size={30} color={colors.danger} />
              </View>
              <ThemedText style={styles.modalTitle}>Delete Profile Picture</ThemedText>
              <ThemedText style={styles.modalMessage}>
                Are you sure you want to delete the profile picture? This action cannot be undone.
              </ThemedText>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <ThemedText style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDelete]}
                  onPress={confirmDeleteProfilePic}
                >
                  <ThemedText style={[styles.modalButtonText, styles.modalButtonTextDelete]}>
                    Delete
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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