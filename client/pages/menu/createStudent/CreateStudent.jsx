import React, { useState, useRef, useCallback, useMemo } from 'react'
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

// Custom Input Component - Fixed keyboard issue
const CustomInput = React.memo(({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
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
  style,
  dropdownStyle,
  iconName = "chevron-down",
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(
    items.find(item => item.value === value)?.label || placeholder
  )
  const rotateAnim = useRef(new Animated.Value(0)).current
  const heightAnim = useRef(new Animated.Value(0)).current

  const toggleDropdown = () => {
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

  // Inline styles for dropdown since styles is not accessible
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

export default function CreateStudent({ visible, onClose }) {
  const { colors, currentTheme } = useTheme()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: new Date(),
    gender: 'NOT_SPECIFIED',
    class: '1',
    section: 'A',
    admissionNo: '',
    rollNo: '',
    address: '',
    village: '',
    parentName: '',
    parentPhone: '',
    parentPhone2: '',
    parentEmail: '',
    studentType: 'DAY_SCHOLAR',
    isUsingSchoolTransport: false,
    isUsingSchoolHostel: false,
    schoolFeeDiscount: 0,
    transportFeeDiscount: 0,
    hostelFeeDiscount: 0,
  })

  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [selectedGender, setSelectedGender] = useState('NOT_SPECIFIED')
  const [selectedStudentType, setSelectedStudentType] = useState('DAY_SCHOLAR')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [profilePic, setProfilePic] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

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
    }
  }, [showToast])

  const handleSave = useCallback(async () => {
    if (!formData.firstName || !formData.lastName || !formData.admissionNo || !formData.parentPhone) {
      showToast('Please fill all required fields', 'error')
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      formDataToSend.append('dob', formData.dob.toISOString())
      formDataToSend.append('gender', formData.gender)
      formDataToSend.append('class', selectedClass)
      formDataToSend.append('section', selectedSection)
      formDataToSend.append('admissionNo', formData.admissionNo)
      formDataToSend.append('rollNo', formData.rollNo)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('village', formData.village)
      formDataToSend.append('parentName', formData.parentName)
      formDataToSend.append('parentPhone', formData.parentPhone)
      formDataToSend.append('parentPhone2', formData.parentPhone2)
      formDataToSend.append('parentEmail', formData.parentEmail)
      formDataToSend.append('studentType', formData.studentType)
      formDataToSend.append('isUsingSchoolTransport', formData.isUsingSchoolTransport)
      formDataToSend.append('isUsingSchoolHostel', formData.isUsingSchoolHostel)
      formDataToSend.append('schoolFeeDiscount', formData.schoolFeeDiscount)
      formDataToSend.append('transportFeeDiscount', formData.transportFeeDiscount)
      formDataToSend.append('hostelFeeDiscount', formData.hostelFeeDiscount)

      if (profilePic) {
        const uriParts = profilePic.split('.')
        const fileType = uriParts[uriParts.length - 1]
        formDataToSend.append('profilePic', {
          uri: profilePic,
          name: `profilePic.${fileType}`,
          type: `image/${fileType}`,
        })
      }

      const response = await axiosApi.post('/students', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.message === 'Student created successfully') {
        showToast('Student created successfully!', 'success')
        resetForm()
        setTimeout(() => onClose(), 1500) // Delay close to show success toast
      }
    } catch (error) {
      console.error('Create student error:', error)
      let errorMessage = 'Failed to create student'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to create student'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [formData, selectedClass, selectedSection, profilePic, showToast, onClose, resetForm])

  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      dob: new Date(),
      gender: 'NOT_SPECIFIED',
      class: '1',
      section: 'A',
      admissionNo: '',
      rollNo: '',
      address: '',
      village: '',
      parentName: '',
      parentPhone: '',
      parentPhone2: '',
      parentEmail: '',
      studentType: 'DAY_SCHOLAR',
      isUsingSchoolTransport: false,
      isUsingSchoolHostel: false,
      schoolFeeDiscount: 0,
      transportFeeDiscount: 0,
      hostelFeeDiscount: 0,
    })
    setSelectedClass('1')
    setSelectedSection('A')
    setSelectedGender('NOT_SPECIFIED')
    setSelectedStudentType('DAY_SCHOLAR')
    setProfilePic(null)
  }, [])

  const onDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      updateFormData({ dob: selectedDate })
    }
  }, [updateFormData])

  const onClassSelect = useCallback((value) => {
    setSelectedClass(value)
    updateFormData({ class: value })
  }, [updateFormData])

  const onSectionSelect = useCallback((value) => {
    setSelectedSection(value)
    updateFormData({ section: value })
  }, [updateFormData])

  const onGenderSelect = useCallback((value) => {
    setSelectedGender(value)
    updateFormData({ gender: value })
  }, [updateFormData])

  const onStudentTypeSelect = useCallback((value) => {
    setSelectedStudentType(value)
    updateFormData({ studentType: value })
  }, [updateFormData])

  const onFirstNameChange = useCallback((text) => updateFormData({ firstName: text }), [updateFormData])
  const onLastNameChange = useCallback((text) => updateFormData({ lastName: text }), [updateFormData])
  const onAdmissionNoChange = useCallback((text) => updateFormData({ admissionNo: text }), [updateFormData])
  const onRollNoChange = useCallback((text) => updateFormData({ rollNo: text }), [updateFormData])
  const onAddressChange = useCallback((text) => updateFormData({ address: text }), [updateFormData])
  const onVillageChange = useCallback((text) => updateFormData({ village: text }), [updateFormData])
  const onParentNameChange = useCallback((text) => updateFormData({ parentName: text }), [updateFormData])
  const onParentPhoneChange = useCallback((text) => updateFormData({ parentPhone: text }), [updateFormData])
  const onParentPhone2Change = useCallback((text) => updateFormData({ parentPhone2: text }), [updateFormData])
  const onParentEmailChange = useCallback((text) => updateFormData({ parentEmail: text }), [updateFormData])
  const onSchoolFeeDiscountChange = useCallback((text) => updateFormData({ schoolFeeDiscount: parseInt(text) || 0 }), [updateFormData])
  const onTransportFeeDiscountChange = useCallback((text) => updateFormData({ transportFeeDiscount: parseInt(text) || 0 }), [updateFormData])
  const onHostelFeeDiscountChange = useCallback((text) => updateFormData({ hostelFeeDiscount: parseInt(text) || 0 }), [updateFormData])
  const onIsUsingSchoolTransportSelect = useCallback((value) => updateFormData({ isUsingSchoolTransport: value }), [updateFormData])
  const onIsUsingSchoolHostelSelect = useCallback((value) => updateFormData({ isUsingSchoolHostel: value }), [updateFormData])

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

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm()
      onClose()
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
                <ThemedText type='subtitle' style={styles.title}>Create New Student</ThemedText>
                <ThemedText style={styles.subtitle}>Fill the details below</ThemedText>
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
                      {profilePic ? (
                        <Image source={{ uri: profilePic }} style={styles.profilePicImage} />
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
                    {formData.dob.toLocaleDateString()}
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
              />
            </View>

            {/* ACADEMIC DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="school" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Academic Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Class</ThemedText>
              <CustomDropdown
                value={selectedClass}
                items={classes}
                onSelect={onClassSelect}
                placeholder="Select Class"
                style={loading ? { opacity: 0.5 } : {}}
              />

              <ThemedText style={styles.fieldLabel}>Section</ThemedText>
              <CustomDropdown
                value={selectedSection}
                items={sections}
                onSelect={onSectionSelect}
                placeholder="Select Section"
                style={loading ? { opacity: 0.5 } : {}}
              />

              <ThemedText style={styles.fieldLabel}>Student Type</ThemedText>
              <CustomDropdown
                value={formData.studentType}
                items={studentTypes}
                onSelect={onStudentTypeSelect}
                placeholder="Select Student Type"
                style={loading ? { opacity: 0.5 } : {}}
              />

              <ThemedText style={styles.fieldLabel}>Admission Number *</ThemedText>
              <View style={styles.inputContainer}>
                <AntDesign name="idcard" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter admission number"
                  value={formData.admissionNo}
                  onChangeText={onAdmissionNoChange}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Roll Number</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="numbers" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter roll number"
                  value={formData.rollNo}
                  onChangeText={onRollNoChange}
                  keyboardType="numeric"
                  editable={!loading}
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

            {/* SERVICES DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="bus-alert" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Services</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Using School Transport?</ThemedText>
              <CustomDropdown
                value={formData.isUsingSchoolTransport}
                items={yesNoOptions}
                onSelect={onIsUsingSchoolTransportSelect}
                placeholder="Select Yes/No"
                style={loading ? { opacity: 0.5 } : {}}
              />

              <ThemedText style={styles.fieldLabel}>Using School Hostel?</ThemedText>
              <CustomDropdown
                value={formData.isUsingSchoolHostel}
                items={yesNoOptions}
                onSelect={onIsUsingSchoolHostelSelect}
                placeholder="Select Yes/No"
                style={loading ? { opacity: 0.5 } : {}}
              />
            </View>

            {/* DISCOUNTS DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="discount" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Fee Discounts</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>School Fee Discount</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="percent" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter school fee discount"
                  value={formData.schoolFeeDiscount.toString()}
                  onChangeText={onSchoolFeeDiscountChange}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Transport Fee Discount</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="percent" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter transport fee discount"
                  value={formData.transportFeeDiscount.toString()}
                  onChangeText={onTransportFeeDiscountChange}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Hostel Fee Discount</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="percent" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter hostel fee discount"
                  value={formData.hostelFeeDiscount.toString()}
                  onChangeText={onHostelFeeDiscountChange}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
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
                  {loading ? 'Saving...' : 'Save Student'}
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