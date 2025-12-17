import React, { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Modal,
  Image,
  TextInput,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  FontAwesome5,
  Feather,
  AntDesign,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

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
    academicYear: '2024-2025',
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
  })

  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [profilePic, setProfilePic] = useState(null)

  const handleSave = () => {
    if (formData.firstName && formData.lastName && formData.admissionNo && formData.parentPhone) {
      Alert.alert('Success', 'Student created successfully!', [{ text: 'OK', onPress: onClose }])
      setFormData({
        firstName: '',
        lastName: '',
        dob: new Date(),
        academicYear: '2024-2025',
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
      })
      setSelectedClass('1')
      setSelectedSection('A')
      setProfilePic(null)
    } else {
      Alert.alert('Error', 'Please fill required fields')
    }
  }

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setFormData({ ...formData, dob: selectedDate })
    }
  }

  const handleProfilePic = () => {
    Alert.alert('Profile Pic', 'Select from gallery or camera', [
      { text: 'Cancel' },
      { text: 'Gallery', onPress: () => console.log('Open gallery') },
      { text: 'Camera', onPress: () => console.log('Open camera') },
    ])
  }

  const academicYears = [
    { label: '2023-2024', value: '2023-2024' },
    { label: '2024-2025', value: '2024-2025' },
    { label: '2025-2026', value: '2025-2026' },
    { label: '2026-2027', value: '2026-2027' },
  ]

  const classes = Array.from({ length: 12 }, (_, i) => ({
    label: `Class ${i + 1}`,
    value: `${i + 1}`
  }))

  const sections = ['A', 'B', 'C', 'D', 'E'].map(sec => ({
    label: `Section ${sec}`,
    value: sec
  }))

  const styles = StyleSheet.create({
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
      paddingVertical: 13,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      marginLeft: 8,
    },
  })

  // Custom Input component that properly fills its container
  const CustomInput = ({ value, onChangeText, placeholder, keyboardType, multiline, numberOfLines, style, ...props }) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={[
        styles.textInput,
        multiline && styles.multilineInput,
        style,
      ]}
      cursorColor="#1d9bf0"
      selectionColor="#1d9bf0"
      {...props}
    />
  )

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
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

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
                <TouchableOpacity onPress={handleProfilePic} activeOpacity={0.8}>
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
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Last Name *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="user-check" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
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
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.dateText}>
                    {formData.dob.toDateString()}
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
            </View>

            {/* ACADEMIC DETAILS */}
            <View style={styles.formGroup}>
              <View style={styles.groupTitleContainer}>
                <View style={styles.groupTitleChip}>
                  <MaterialIcons name="school" size={22} color={colors.primary} />
                  <ThemedText type='subtitle' style={styles.groupTitleText}>Academic Details</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.fieldLabel}>Academic Year</ThemedText>
              <CustomDropdown
                value={formData.academicYear}
                items={academicYears}
                onSelect={(value) => setFormData({ ...formData, academicYear: value })}
                placeholder="Select Academic Year"
              />

              <ThemedText style={styles.fieldLabel}>Class</ThemedText>
              <CustomDropdown
                value={selectedClass}
                items={classes}
                onSelect={(value) => {
                  setSelectedClass(value)
                  setFormData({ ...formData, class: value })
                }}
                placeholder="Select Class"
              />

              <ThemedText style={styles.fieldLabel}>Section</ThemedText>
              <CustomDropdown
                value={selectedSection}
                items={sections}
                onSelect={(value) => {
                  setSelectedSection(value)
                  setFormData({ ...formData, section: value })
                }}
                placeholder="Select Section"
              />

              <ThemedText style={styles.fieldLabel}>Admission Number *</ThemedText>
              <View style={styles.inputContainer}>
                <AntDesign name="idcard" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter admission number"
                  value={formData.admissionNo}
                  onChangeText={(text) => setFormData({ ...formData, admissionNo: text })}
                  keyboardType="numeric"
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Roll Number</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="numbers" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter roll number"
                  value={formData.rollNo}
                  onChangeText={(text) => setFormData({ ...formData, rollNo: text })}
                  keyboardType="numeric"
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
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                  style={styles.multilineInput}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Village / Town</ThemedText>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-city" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter village / town"
                  value={formData.village}
                  onChangeText={(text) => setFormData({ ...formData, village: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, parentName: text })}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Phone 1 *</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter parent phone number"
                  value={formData.parentPhone}
                  onChangeText={(text) => setFormData({ ...formData, parentPhone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Phone 2</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter alternate phone number"
                  value={formData.parentPhone2}
                  onChangeText={(text) => setFormData({ ...formData, parentPhone2: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <ThemedText style={styles.fieldLabel}>Parent Email</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} style={styles.inputIcon} />
                <CustomInput
                  placeholder="Enter parent email"
                  value={formData.parentEmail}
                  onChangeText={(text) => setFormData({ ...formData, parentEmail: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                style={styles.saveBtnPressable}
              >
                <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                <ThemedText style={styles.saveBtnText}>Save Student</ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  )
}