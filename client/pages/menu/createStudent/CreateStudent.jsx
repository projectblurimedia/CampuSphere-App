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
import { useDispatch } from 'react-redux'
import { triggerRefresh } from '@/redux/studentsRefreshSlice'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Modern Input Component with Label
const ModernInput = React.memo(({
  value,
  onChangeText,
  placeholder,
  label,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  editable = true,
  required = false,
  icon,
  ...props
}) => {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <View style={styles.inputWrapper}>
      {label && (
        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
          {label} {required && <ThemedText style={{ color: colors.danger }}>*</ThemedText>}
        </ThemedText>
      )}
      <View style={[
        styles.modernInputContainer,
        {
          borderColor: isFocused ? colors.primary : colors.border,
          backgroundColor: colors.inputBackground,
          opacity: editable ? 1 : 0.6,
          minHeight: multiline ? 90 : 50,
        },
        style
      ]}>
        {icon && (
          <View style={styles.modernInputIcon}>
            {icon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary + '80'}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.modernInput,
            {
              color: editable ? colors.text : colors.textSecondary,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingTop: multiline ? 12 : 0,
            }
          ]}
          cursorColor={colors.primary}
          selectionColor={colors.primary + '40'}
          {...props}
        />
      </View>
    </View>
  )
})

// Modern Dropdown Component with Label
const ModernDropdown = ({
  value,
  items,
  onSelect,
  label,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  icon,
  style,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(
    items.find(item => item.value === value)?.label || ''
  )
  const rotateAnim = useRef(new Animated.Value(0)).current
  const heightAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    setSelectedLabel(items.find(item => item.value === value)?.label || '')
  }, [value, items])

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

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })

  const maxDropdownHeight = Math.min(items.length * 48, SCREEN_HEIGHT * 0.3)

  return (
    <View style={[styles.inputWrapper, style]}>
      {label && (
        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
          {label} {required && <ThemedText style={{ color: colors.danger }}>*</ThemedText>}
        </ThemedText>
      )}
      <View style={[
        styles.modernInputContainer,
        {
          borderColor: isOpen ? colors.primary : colors.border,
          backgroundColor: colors.inputBackground,
          opacity: disabled ? 0.6 : 1,
          padding: 0,
          overflow: 'visible',
        }
      ]}>
        <TouchableOpacity
          style={styles.modernDropdownHeader}
          onPress={toggleDropdown}
          activeOpacity={0.7}
          disabled={disabled}
        >
          {icon && <View style={styles.modernInputIcon}>{icon}</View>}
          <ThemedText style={[
            styles.modernDropdownText,
            { color: value ? colors.text : colors.textSecondary + '80' }
          ]}>
            {selectedLabel || placeholder}
          </ThemedText>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={18} color={colors.primary} />
          </Animated.View>
        </TouchableOpacity>
        
        {isOpen && (
          <Animated.View style={[
            styles.modernDropdownList,
            { 
              height: heightAnim, 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }
          ]}>
            <ScrollView 
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: maxDropdownHeight }}
            >
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value.toString()}
                  style={[
                    styles.modernDropdownItem,
                    value === item.value && {
                      backgroundColor: colors.primary + '10',
                    }
                  ]}
                  onPress={() => {
                    onSelect(item.value)
                    toggleDropdown()
                  }}
                >
                  <ThemedText style={[
                    styles.modernDropdownItemText,
                    { color: value === item.value ? colors.primary : colors.text }
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
    </View>
  )
}

export default function CreateStudent({ visible, onClose, studentData: editStudentData }) {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  const isEditMode = !!editStudentData

  // Form state
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

  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [selectedStudentType, setSelectedStudentType] = useState('DAY_SCHOLAR')
  const [isUsingSchoolTransport, setIsUsingSchoolTransport] = useState(false)
  const [schoolFeeDiscount, setSchoolFeeDiscount] = useState(0)
  const [transportFeeDiscount, setTransportFeeDiscount] = useState(0)
  const [hostelFeeDiscount, setHostelFeeDiscount] = useState(0)
  const [admissionNo, setAdmissionNo] = useState('')
  const [rollNo, setRollNo] = useState('')

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

      setSelectedClass(editStudentData.class || '1')
      setSelectedSection(editStudentData.section || 'A')
      setSelectedStudentType(editStudentData.studentType || 'DAY_SCHOLAR')
      setIsUsingSchoolTransport(editStudentData.isUsingSchoolTransport || false)
      setSchoolFeeDiscount(editStudentData.schoolFeeDiscount || 0)
      setTransportFeeDiscount(editStudentData.transportFeeDiscount || 0)
      setHostelFeeDiscount(editStudentData.hostelFeeDiscount || 0)
      setAdmissionNo(editStudentData.admissionNo || '')
      setRollNo(editStudentData.rollNo || '')
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

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

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

  const validateForm = useCallback(() => {
    if (!formData.firstName?.trim()) {
      showToast('First name is required', 'error')
      return false
    }
    if (!formData.lastName?.trim()) {
      showToast('Last name is required', 'error')
      return false
    }
    if (!isEditMode && !admissionNo?.trim()) {
      showToast('Admission number is required', 'error')
      return false
    }
    if (!formData.parentName?.trim()) {
      showToast('Parent name is required', 'error')
      return false
    }
    if (!formData.parentPhone?.trim()) {
      showToast('Parent phone number is required', 'error')
      return false
    }
    if (!isEditMode && !selectedClass) {
      showToast('Class is required', 'error')
      return false
    }
    if (!formData.village?.trim()) {
      showToast('Village is required', 'error')
      return false
    }
    return true
  }, [formData, isEditMode, admissionNo, selectedClass])

  const handleSave = useCallback(async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      
      formDataToSend.append('firstName', formData.firstName.trim())
      formDataToSend.append('lastName', formData.lastName.trim())
      formDataToSend.append('dob', formData.dob.toISOString())
      formDataToSend.append('gender', formData.gender)
      formDataToSend.append('address', formData.address?.trim() || '')
      formDataToSend.append('village', formData.village?.trim() || '')
      formDataToSend.append('parentName', formData.parentName?.trim() || '')
      formDataToSend.append('parentPhone', formData.parentPhone.trim())
      formDataToSend.append('parentPhone2', formData.parentPhone2?.trim() || '')
      formDataToSend.append('parentEmail', formData.parentEmail?.trim() || '')

      formDataToSend.append('class', selectedClass)
      formDataToSend.append('section', selectedSection)
      formDataToSend.append('admissionNo', admissionNo.trim())
      formDataToSend.append('rollNo', rollNo?.trim() || '')
      formDataToSend.append('studentType', selectedStudentType)
      formDataToSend.append('isUsingSchoolTransport', String(isUsingSchoolTransport))
      formDataToSend.append('schoolFeeDiscount', String(schoolFeeDiscount))
      formDataToSend.append('transportFeeDiscount', String(transportFeeDiscount))
      formDataToSend.append('hostelFeeDiscount', String(hostelFeeDiscount))

      if (profilePic) {
        const uriParts = profilePic.split('.')
        const fileType = uriParts[uriParts.length - 1]
        formDataToSend.append('profilePic', {
          uri: profilePic,
          name: `profilePic.${fileType}`,
          type: `image/${fileType}`,
        })
      }

      if (isEditMode && removeProfilePic) {
        formDataToSend.append('removeProfilePic', 'true')
      }

      let response
      if (isEditMode) {
        response = await axiosApi.put(`/students/${editStudentData.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        response = await axiosApi.post('/students', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      if (response.data.success) {
        showToast(isEditMode ? 'Student updated successfully!' : 'Student created successfully!', 'success')
        dispatch(triggerRefresh())
        resetForm()
        setTimeout(() => onClose(true), 1500)
      }
    } catch (error) {
      console.error(isEditMode ? 'Update student error:' : 'Create student error:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          (isEditMode ? 'Failed to update student' : 'Failed to create student')
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [formData, isEditMode, editStudentData, profilePic, removeProfilePic, selectedClass, selectedSection, admissionNo, rollNo, selectedStudentType, isUsingSchoolTransport, schoolFeeDiscount, transportFeeDiscount, hostelFeeDiscount, validateForm, showToast, onClose])

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
    setSelectedClass('1')
    setSelectedSection('A')
    setSelectedStudentType('DAY_SCHOLAR')
    setIsUsingSchoolTransport(false)
    setSchoolFeeDiscount(0)
    setTransportFeeDiscount(0)
    setHostelFeeDiscount(0)
    setAdmissionNo('')
    setRollNo('')
    setProfilePic(null)
    setExistingProfilePic(null)
    setRemoveProfilePic(false)
  }, [])

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm()
      onClose(false)
    }
  }, [loading, resetForm, onClose])

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                <ThemedText style={styles.title}>
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
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Profile Picture */}
            <View style={styles.profilePicContainer}>
              <View style={styles.profilePicWrapper}>
                <TouchableOpacity onPress={handleProfilePic} activeOpacity={0.8} disabled={loading}>
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.profilePicOuter}
                  >
                    <View style={[styles.profilePicInner, { backgroundColor: colors.inputBackground }]}>
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
              <ThemedText style={[styles.profilePicHint, { color: colors.textSecondary }]}>
                {isEditMode ? 'Tap to change profile picture' : 'Tap to add profile picture'}
              </ThemedText>
            </View>

            {/* Personal Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="person" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Personal Details
                </ThemedText>
              </View>

              <ModernInput
                label="First Name"
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                required
                icon={<Feather name="user" size={18} color={colors.primary} />}
                editable={!loading}
              />

              <ModernInput
                label="Last Name"
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                required
                icon={<Feather name="user-check" size={18} color={colors.primary} />}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => !loading && setShowDatePicker(true)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <ModernInput
                  label="Date of Birth"
                  placeholder="Select date of birth"
                  value={formData.dob.toLocaleDateString('en-GB')}
                  editable={false}
                  required
                  icon={<MaterialCommunityIcons name="cake-variant" size={18} color={colors.primary} />}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.dob}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false)
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, dob: selectedDate }))
                    }
                  }}
                />
              )}

              <ModernDropdown
                label="Gender"
                value={formData.gender}
                items={genders}
                onSelect={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                placeholder="Select gender"
                required
                icon={<Ionicons name="male-female" size={18} color={colors.primary} />}
                disabled={loading}
              />
            </View>

            {/* Academic Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="school" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Academic Details
                </ThemedText>
              </View>

              {!isEditMode && (
                <ModernDropdown
                  label="Class"
                  value={selectedClass}
                  items={classes}
                  onSelect={setSelectedClass}
                  placeholder="Select class"
                  required
                  icon={<MaterialIcons name="class" size={18} color={colors.primary} />}
                  disabled={loading}
                />
              )}

              <ModernDropdown
                label="Section"
                value={selectedSection}
                items={sections}
                onSelect={setSelectedSection}
                placeholder="Select section"
                required
                icon={<MaterialIcons name="grid-view" size={18} color={colors.primary} />}
                disabled={loading}
              />

              {!isEditMode && (
                <ModernInput
                  label="Admission Number"
                  placeholder="Enter admission number"
                  value={admissionNo}
                  onChangeText={setAdmissionNo}
                  required
                  icon={<AntDesign name="idcard" size={18} color={colors.primary} />}
                  editable={!loading}
                />
              )}

              <ModernInput
                label="Roll Number"
                placeholder="Enter roll number"
                value={rollNo}
                onChangeText={setRollNo}
                icon={<MaterialIcons name="numbers" size={18} color={colors.primary} />}
                editable={!loading}
              />
            </View>

            {/* Address Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="location-on" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Address Details
                </ThemedText>
              </View>

              <ModernInput
                label="Address"
                placeholder="Enter full address"
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                multiline
                numberOfLines={3}
                icon={<Feather name="map-pin" size={18} color={colors.primary} />}
                editable={!loading}
              />

              <ModernInput
                label="Village / Town"
                placeholder="Enter village or town"
                value={formData.village}
                onChangeText={(text) => setFormData(prev => ({ ...prev, village: text }))}
                required
                icon={<MaterialIcons name="location-city" size={18} color={colors.primary} />}
                editable={!loading}
              />
            </View>

            {/* Parent Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="family-restroom" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Parent / Guardian
                </ThemedText>
              </View>

              <ModernInput
                label="Parent Name"
                placeholder="Enter parent/guardian name"
                value={formData.parentName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, parentName: text }))}
                required
                icon={<Feather name="user" size={18} color={colors.primary} />}
                editable={!loading}
              />

              <ModernInput
                label="Parent Phone 1"
                placeholder="Enter 10-digit phone number"
                value={formData.parentPhone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, parentPhone: text }))}
                keyboardType="phone-pad"
                required
                icon={<Feather name="phone" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={10}
              />

              <ModernInput
                label="Parent Phone 2"
                placeholder="Enter alternate phone number"
                value={formData.parentPhone2}
                onChangeText={(text) => setFormData(prev => ({ ...prev, parentPhone2: text }))}
                keyboardType="phone-pad"
                icon={<Feather name="phone" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={10}
              />

              <ModernInput
                label="Parent Email"
                placeholder="Enter email address"
                value={formData.parentEmail}
                onChangeText={(text) => setFormData(prev => ({ ...prev, parentEmail: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Feather name="mail" size={18} color={colors.primary} />}
                editable={!loading}
              />
            </View>

            {/* Services */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="room-service" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Services
                </ThemedText>
              </View>

              <ModernDropdown
                label="Student Type"
                value={selectedStudentType}
                items={studentTypes}
                onSelect={setSelectedStudentType}
                placeholder="Select student type"
                required
                icon={<MaterialIcons name="school" size={18} color={colors.primary} />}
                disabled={loading}
              />

              {selectedStudentType === 'DAY_SCHOLAR' && (
                <ModernDropdown
                  label="Using School Transport?"
                  value={isUsingSchoolTransport}
                  items={yesNoOptions}
                  onSelect={setIsUsingSchoolTransport}
                  placeholder="Select yes or no"
                  required
                  icon={<Ionicons name="bus" size={18} color={colors.primary} />}
                  disabled={loading}
                />
              )}

              {selectedStudentType === 'HOSTELLER' && (
                <ModernInput
                  label="Using School Hostel"
                  placeholder="Hostel"
                  value="Yes (Default)"
                  editable={false}
                  icon={<MaterialIcons name="hotel" size={18} color={colors.primary} />}
                />
              )}
            </View>

            {/* Fee Discounts */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="discount" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Fee Discounts
                </ThemedText>
              </View>

              <ModernInput
                label="School Fee Discount (%)"
                placeholder="Enter discount percentage"
                value={String(schoolFeeDiscount)}
                onChangeText={(text) => setSchoolFeeDiscount(parseInt(text) || 0)}
                keyboardType="numeric"
                icon={<Feather name="percent" size={18} color={colors.primary} />}
                editable={!loading}
              />

              {selectedStudentType === 'DAY_SCHOLAR' && isUsingSchoolTransport && (
                <ModernInput
                  label="Transport Fee Discount (%)"
                  placeholder="Enter discount percentage"
                  value={String(transportFeeDiscount)}
                  onChangeText={(text) => setTransportFeeDiscount(parseInt(text) || 0)}
                  keyboardType="numeric"
                  icon={<Feather name="percent" size={18} color={colors.primary} />}
                  editable={!loading}
                />
              )}

              {selectedStudentType === 'HOSTELLER' && (
                <ModernInput
                  label="Hostel Fee Discount (%)"
                  placeholder="Enter discount percentage"
                  value={String(hostelFeeDiscount)}
                  onChangeText={(text) => setHostelFeeDiscount(parseInt(text) || 0)}
                  keyboardType="numeric"
                  icon={<Feather name="percent" size={18} color={colors.primary} />}
                  editable={!loading}
                />
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footerWrapper, { backgroundColor: colors.background }]}>
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

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.modalIcon, { backgroundColor: colors.danger + '20' }]}>
                <MaterialIcons name="delete" size={30} color={colors.danger} />
              </View>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                Delete Profile Picture
              </ThemedText>
              <ThemedText style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Are you sure you want to delete the profile picture? This action cannot be undone.
              </ThemedText>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDelete, { backgroundColor: colors.danger }]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Poppins-Medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  formGroup: {
    marginBottom: 24,
  },
  groupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  groupTitleText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePicHint: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    marginBottom: 6,
    marginLeft: 4,
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  modernInputIcon: {
    marginRight: 8,
    width: 24,
    alignItems: 'center',
  },
  modernInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    padding: 0,
    marginBottom: -4,
  },
  modernDropdownHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  modernDropdownText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  modernDropdownList: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  modernDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modernDropdownItemText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  footerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
  },
  saveBtnGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveBtnPressable: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.8,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
    borderWidth: 1,
  },
  modalButtonDelete: {},
  modalButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  modalButtonTextDelete: {
    color: '#FFFFFF',
  },
})