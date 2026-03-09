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
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import { Image } from 'expo-image'
import { forceLogoutEmployee } from '@/socket/socket'

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
  maxLength,
  editable = true,
  required = false,
  icon,
  style,
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
          maxLength={maxLength}
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
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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

export default function CreateEmployee({ visible, onClose, employeeData }) {
  const { colors } = useTheme()
  const isEdit = !!employeeData

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'NOT_SPECIFIED',
    dob: new Date(),
    email: '',
    phone: '',
    address: '',
    village: '',
    designation: '',
    joiningDate: new Date(),
    qualification: '',
    aadharNumber: '',
    panNumber: '',
  })

  const [profilePic, setProfilePic] = useState(null)
  const [existingProfilePic, setExistingProfilePic] = useState(null)
  const [removeProfilePic, setRemoveProfilePic] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState({ dob: false, joiningDate: false })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const genderOptions = useMemo(() => [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Not Specified', value: 'NOT_SPECIFIED' },
  ], [])

  const designationOptions = useMemo(() => [
    { label: 'Chairperson', value: 'Chairperson' },
    { label: 'Principal', value: 'Principal' },
    { label: 'Vice Principal', value: 'Vice_Principal' },
    { label: 'Accountant', value: 'Accountant' },
    { label: 'Teacher', value: 'Teacher' },
    { label: 'Other', value: 'Other' },
  ], [])

  useEffect(() => {
    if (visible && isEdit && employeeData) {
      setFormData({
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        gender: employeeData.gender || 'NOT_SPECIFIED',
        dob: employeeData.dob ? new Date(employeeData.dob) : new Date(),
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        address: employeeData.address || '',
        village: employeeData.village || '',
        designation: employeeData.designation || '',
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate) : new Date(),
        qualification: employeeData.qualification || '',
        aadharNumber: employeeData.aadharNumber || '',
        panNumber: employeeData.panNumber || '',
      })
      setExistingProfilePic(employeeData.profilePicUrl || null)
      setProfilePic(null)
      setRemoveProfilePic(false)
    } else if (visible && !isEdit) {
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'NOT_SPECIFIED',
        dob: new Date(),
        email: '',
        phone: '',
        address: '',
        village: '',
        designation: '',
        joiningDate: new Date(),
        qualification: '',
        aadharNumber: '',
        panNumber: '',
      })
      setProfilePic(null)
      setExistingProfilePic(null)
      setRemoveProfilePic(false)
    }
  }, [visible, employeeData, isEdit])

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

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
      setExistingProfilePic(null)
      setRemoveProfilePic(false)
    }
  }, [loading, showToast])

  const handleDeleteProfilePic = useCallback(() => {
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteProfilePic = useCallback(() => {
    setProfilePic(null)
    setExistingProfilePic(null)
    setRemoveProfilePic(true)
    setShowDeleteModal(false)
    showToast('Profile picture will be removed on save', 'success')
  }, [showToast])

  const validateForm = useCallback(() => {
    if (!formData.firstName?.trim()) {
      showToast('First name is required', 'error')
      return false
    }
    if (!formData.lastName?.trim()) {
      showToast('Last name is required', 'error')
      return false
    }
    if (!formData.email?.trim()) {
      showToast('Email is required', 'error')
      return false
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error')
      return false
    }
    if (!formData.phone?.trim()) {
      showToast('Phone number is required', 'error')
      return false
    }
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      showToast('Phone number must be 10 digits', 'error')
      return false
    }
    if (!formData.village?.trim()) {
      showToast('Village is required', 'error')
      return false
    }
    if (!formData.designation) {
      showToast('Designation is required', 'error')
      return false
    }
    if (formData.aadharNumber && formData.aadharNumber.trim() !== '') {
      const aadharRegex = /^[0-9]{12}$/
      if (!aadharRegex.test(formData.aadharNumber)) {
        showToast('Aadhar number must be 12 digits', 'error')
        return false
      }
    }
    if (formData.panNumber && formData.panNumber.trim() !== '') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(formData.panNumber.toUpperCase())) {
        showToast('Please enter a valid PAN number (e.g., ABCDE1234F)', 'error')
        return false
      }
    }
    return true
  }, [formData, showToast])

  const handleSave = useCallback(async () => {
    if (loading || !validateForm()) return

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          if (key === 'dob' || key === 'joiningDate') {
            formDataToSend.append(key, new Date(formData[key]).toISOString())
          } else {
            formDataToSend.append(key, String(formData[key]).trim())
          }
        }
      })

      if (profilePic) {
        const uriParts = profilePic.uri.split('.')
        const fileType = uriParts[uriParts.length - 1]
        formDataToSend.append('profilePic', {
          uri: profilePic.uri,
          name: `employee_profile_${Date.now()}.${fileType}`,
          type: profilePic.mimeType || `image/${fileType}`,
        })
      }

      if (isEdit && removeProfilePic) {
        formDataToSend.append('removeProfilePic', 'true')
      }

      let response
      if (isEdit) {
        response = await axiosApi.put(`/employees/${employeeData.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        response = await axiosApi.post('/employees', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      if (response.data.success) {
        if (isEdit) {
          forceLogoutEmployee(
            employeeData.id,
            'Your account details have been updated. Please login again.'
          )
        }
        showToast(isEdit ? 'Employee updated successfully!' : 'Employee created successfully!', 'success')
        setTimeout(() => onClose(true), 1500)
      }
    } catch (error) {
      console.error(`${isEdit ? 'Update' : 'Create'} employee error:`, error)
      
      let errorMessage = isEdit ? 'Failed to update employee' : 'Failed to create employee'
      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data.message?.includes('email already exists')) {
            errorMessage = 'Email already exists in the system'
          } else if (error.response.data.message?.includes('phone already exists')) {
            errorMessage = 'Phone number already exists in the system'
          } else if (error.response.data.message?.includes('aadhar already exists')) {
            errorMessage = 'Aadhar number already exists in the system'
          } else {
            errorMessage = error.response.data?.message || error.response.data?.error || errorMessage
          }
        } else {
          errorMessage = error.response.data?.message || error.response.data?.error || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [formData, profilePic, removeProfilePic, employeeData, isEdit, validateForm, loading, onClose, showToast])

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose(false)
    }
  }, [loading, onClose])

  const currentProfilePic = profilePic?.uri || existingProfilePic

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
                  {isEdit ? 'Edit Employee' : 'Create Employee'}
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  {isEdit ? 'Update employee details' : 'Add new employee details'}
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
                      {currentProfilePic ? (
                        <Image source={{ uri: currentProfilePic }} style={styles.profilePicImage} />
                      ) : (
                        <Feather name="camera" size={30} color={colors.textSecondary} />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                {currentProfilePic && (
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
                Tap to change profile picture
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
                maxLength={50}
              />

              <ModernInput
                label="Last Name"
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                required
                icon={<Feather name="user-check" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={50}
              />

              <ModernDropdown
                label="Gender"
                value={formData.gender}
                items={genderOptions}
                onSelect={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                placeholder="Select gender"
                required
                icon={<Ionicons name="male-female" size={18} color={colors.primary} />}
                disabled={loading}
              />

              <TouchableOpacity
                onPress={() => !loading && setShowDatePicker(prev => ({ ...prev, dob: true }))}
                activeOpacity={0.8}
                disabled={loading}
              >
                <ModernInput
                  label="Date of Birth"
                  placeholder="Select date of birth"
                  value={formData.dob.toLocaleDateString()}
                  editable={false}
                  required
                  icon={<MaterialCommunityIcons name="cake-variant" size={18} color={colors.primary} />}
                />
              </TouchableOpacity>

              {showDatePicker.dob && (
                <DateTimePicker
                  value={formData.dob}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(prev => ({ ...prev, dob: false }))
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, dob: selectedDate }))
                    }
                  }}
                />
              )}
            </View>

            {/* Contact Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="contact-phone" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Contact Details
                </ThemedText>
              </View>

              <ModernInput
                label="Email"
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text.toLowerCase() }))}
                keyboardType="email-address"
                autoCapitalize="none"
                required
                icon={<Feather name="mail" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={50}
              />

              <ModernInput
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/[^0-9]/g, '').substring(0, 10) }))}
                keyboardType="phone-pad"
                required
                icon={<Feather name="phone" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={10}
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
                maxLength={50}
              />
            </View>

            {/* Employment Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="work" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Employment Details
                </ThemedText>
              </View>

              <ModernDropdown
                label="Designation"
                value={formData.designation}
                items={designationOptions}
                onSelect={(value) => setFormData(prev => ({ ...prev, designation: value }))}
                placeholder="Select designation"
                required
                icon={<MaterialIcons name="badge" size={18} color={colors.primary} />}
                disabled={loading}
              />

              <TouchableOpacity
                onPress={() => !loading && setShowDatePicker(prev => ({ ...prev, joiningDate: true }))}
                activeOpacity={0.8}
                disabled={loading}
              >
                <ModernInput
                  label="Joining Date"
                  placeholder="Select joining date"
                  value={formData.joiningDate.toLocaleDateString()}
                  editable={false}
                  required
                  icon={<MaterialIcons name="date-range" size={18} color={colors.primary} />}
                />
              </TouchableOpacity>

              {showDatePicker.joiningDate && (
                <DateTimePicker
                  value={formData.joiningDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(prev => ({ ...prev, joiningDate: false }))
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, joiningDate: selectedDate }))
                    }
                  }}
                />
              )}

              <ModernInput
                label="Qualification"
                placeholder="Enter qualification"
                value={formData.qualification}
                onChangeText={(text) => setFormData(prev => ({ ...prev, qualification: text }))}
                icon={<MaterialIcons name="school" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={50}
              />
            </View>

            {/* Document Details */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <ThemedText style={[styles.groupTitleText, { color: colors.primary }]}>
                  Document Details
                </ThemedText>
              </View>

              <ModernInput
                label="Aadhar Number"
                placeholder="Enter 12-digit Aadhar number"
                value={formData.aadharNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, aadharNumber: text.replace(/[^0-9]/g, '').substring(0, 12) }))}
                keyboardType="number-pad"
                icon={<MaterialIcons name="credit-card" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={12}
              />

              <ModernInput
                label="PAN Number"
                placeholder="Enter 10-digit PAN number"
                value={formData.panNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, panNumber: text.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) }))}
                icon={<MaterialIcons name="assignment" size={18} color={colors.primary} />}
                editable={!loading}
                maxLength={10}
              />
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
                {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Employee' : 'Create Employee')}
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
    top: 52,
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