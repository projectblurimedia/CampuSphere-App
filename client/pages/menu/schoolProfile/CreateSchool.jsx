import React, { useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons'

const CreateSchool = ({ visible, onClose, onSubmit, loading, colors, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    establishedYear: '',
    affiliation: '',
    board: '',
    principal: '',
    principalEmail: '',
    principalPhone: '',
    vicePrincipal: '',
    vicePrincipalEmail: '',
    vicePrincipalPhone: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    schoolHours: '',
    officeHours: '',
    workingDays: '',
    assemblyTime: '',
    facilities: '',
    mission: '',
    vision: '',
    motto: '',
    campusArea: '',
    libraryBooks: '',
    computerSystems: '',
  })

  const [formErrors, setFormErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const styles = useMemo(() => StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 75 : 55,
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
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    stepIndicator: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    progressBar: {
      flexDirection: 'row',
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginTop: 16,
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 320,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    requiredStar: {
      color: '#ef4444',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.inputBackground,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      marginBottom: -2,
    },
    textArea: {
      
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    button: {
      flex: 1,
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    previousButton: {
      backgroundColor: '#54656f90',
    },
    nextButton: {
      backgroundColor: colors.primary,
    },
    submitButton: {
      backgroundColor: '#10b981',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.5,
    },
    infoCard: {
      backgroundColor: colors.primary + '10',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    infoText: {
      fontSize: 14,
      color: colors.primary,
      textAlign: 'center',
      lineHeight: 20,
    },
  }), [colors])

  const validateStep = (step) => {
    const errors = {}

    if (step === 1) {
      if (!formData.name.trim()) errors.name = 'School name is required'
      if (!formData.principal.trim()) errors.principal = 'Principal name is required'
      if (formData.principalPhone && !/^\d{10}$/.test(formData.principalPhone.replace(/\D/g, ''))) {
        errors.principalPhone = 'Phone number must be 10 digits'
      }
    } else if (step === 2) {
      if (!formData.address.trim()) errors.address = 'Address is required'
      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = 'Phone number must be 10 digits'
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email format'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.principal.trim() || !formData.address.trim()) {
      showToast('Please fill all required fields', 'warning')
      return
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Please enter a valid email address', 'warning')
      return
    }

    // Validate phone numbers
    if (formData.principalPhone && !/^\d{10}$/.test(formData.principalPhone.replace(/\D/g, ''))) {
      showToast('Principal phone must be 10 digits', 'warning')
      return
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      showToast('School phone must be 10 digits', 'warning')
      return
    }

    onSubmit(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const renderStep1 = () => (
    <>
      <View style={styles.infoCard}>
        <ThemedText style={styles.infoText}>
          Fill in the basic information about your school. These details will be displayed on your school profile.
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>
          School Name <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <View style={[styles.inputWrapper, formErrors.name && { borderColor: '#ef4444' }]}>
          <FontAwesome5 name="school" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., St. Mary's High School"
            placeholderTextColor={colors.placeholder}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>
        {formErrors.name && <ThemedText style={styles.errorText}>{formErrors.name}</ThemedText>}
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Motto</ThemedText>
        <View style={styles.inputWrapper}>
          <FontAwesome5 name="quote-right" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., Excellence in Education"
            placeholderTextColor={colors.placeholder}
            value={formData.motto}
            onChangeText={(text) => handleInputChange('motto', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Established Year</ThemedText>
        <View style={styles.inputWrapper}>
          <FontAwesome5 name="calendar-alt" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 1995"
            placeholderTextColor={colors.placeholder}
            value={formData.establishedYear}
            onChangeText={(text) => handleInputChange('establishedYear', text)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Affiliation</ThemedText>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="certificate" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., CBSE, ICSE, State Board"
            placeholderTextColor={colors.placeholder}
            value={formData.affiliation}
            onChangeText={(text) => handleInputChange('affiliation', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Board</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="award" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., CBSE"
            placeholderTextColor={colors.placeholder}
            value={formData.board}
            onChangeText={(text) => handleInputChange('board', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>
          Principal Name <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <View style={[styles.inputWrapper, formErrors.principal && { borderColor: '#ef4444' }]}>
          <MaterialCommunityIcons name="account-tie" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter principal's full name"
            placeholderTextColor={colors.placeholder}
            value={formData.principal}
            onChangeText={(text) => handleInputChange('principal', text)}
          />
        </View>
        {formErrors.principal && <ThemedText style={styles.errorText}>{formErrors.principal}</ThemedText>}
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Principal Email</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="mail" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="principal@school.edu"
            placeholderTextColor={colors.placeholder}
            value={formData.principalEmail}
            onChangeText={(text) => handleInputChange('principalEmail', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Principal Phone</ThemedText>
        <View style={[styles.inputWrapper, formErrors.principalPhone && { borderColor: '#ef4444' }]}>
          <Feather name="phone" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.placeholder}
            value={formData.principalPhone}
            onChangeText={(text) => handleInputChange('principalPhone', text)}
            keyboardType="phone-pad"
          />
        </View>
        {formErrors.principalPhone && <ThemedText style={styles.errorText}>{formErrors.principalPhone}</ThemedText>}
      </View>
    </>
  )

  const renderStep2 = () => (
    <>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>
          Address <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <View style={[styles.inputWrapper, formErrors.address && { borderColor: '#ef4444' }]}>
          <Feather name="map-pin" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter complete address"
            placeholderTextColor={colors.placeholder}
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            multiline
            numberOfLines={3}
          />
        </View>
        {formErrors.address && <ThemedText style={styles.errorText}>{formErrors.address}</ThemedText>}
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>School Email</ThemedText>
        <View style={[styles.inputWrapper, formErrors.email && { borderColor: '#ef4444' }]}>
          <Feather name="mail" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="contact@school.edu"
            placeholderTextColor={colors.placeholder}
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {formErrors.email && <ThemedText style={styles.errorText}>{formErrors.email}</ThemedText>}
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>School Phone</ThemedText>
        <View style={[styles.inputWrapper, formErrors.phone && { borderColor: '#ef4444' }]}>
          <Feather name="phone" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={colors.placeholder}
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            keyboardType="phone-pad"
          />
        </View>
        {formErrors.phone && <ThemedText style={styles.errorText}>{formErrors.phone}</ThemedText>}
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Website</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="globe" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="https://www.school.edu"
            placeholderTextColor={colors.placeholder}
            value={formData.website}
            onChangeText={(text) => handleInputChange('website', text)}
            autoCapitalize="none"
          />
        </View>
      </View>
    </>
  )

  const renderStep3 = () => (
    <>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>School Hours</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="clock" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 8:00 AM - 3:00 PM"
            placeholderTextColor={colors.placeholder}
            value={formData.schoolHours}
            onChangeText={(text) => handleInputChange('schoolHours', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Office Hours</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="briefcase" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 9:00 AM - 5:00 PM"
            placeholderTextColor={colors.placeholder}
            value={formData.officeHours}
            onChangeText={(text) => handleInputChange('officeHours', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Working Days</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="calendar" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., Monday to Friday"
            placeholderTextColor={colors.placeholder}
            value={formData.workingDays}
            onChangeText={(text) => handleInputChange('workingDays', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Assembly Time</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="bell" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 8:30 AM"
            placeholderTextColor={colors.placeholder}
            value={formData.assemblyTime}
            onChangeText={(text) => handleInputChange('assemblyTime', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Facilities (comma separated)</ThemedText>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="home-group" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Library, Playground, Science Lab"
            placeholderTextColor={colors.placeholder}
            value={formData.facilities}
            onChangeText={(text) => handleInputChange('facilities', text)}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </>
  )

  const renderStep4 = () => (
    <>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Mission</ThemedText>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="bullseye-arrow" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter school's mission statement"
            placeholderTextColor={colors.placeholder}
            value={formData.mission}
            onChangeText={(text) => handleInputChange('mission', text)}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Vision</ThemedText>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="eye" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter school's vision statement"
            placeholderTextColor={colors.placeholder}
            value={formData.vision}
            onChangeText={(text) => handleInputChange('vision', text)}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Campus Area</ThemedText>
        <View style={styles.inputWrapper}>
          <FontAwesome5 name="mountain" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 10 acres"
            placeholderTextColor={colors.placeholder}
            value={formData.campusArea}
            onChangeText={(text) => handleInputChange('campusArea', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Library Books</ThemedText>
        <View style={styles.inputWrapper}>
          <FontAwesome5 name="book" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 5000+"
            placeholderTextColor={colors.placeholder}
            value={formData.libraryBooks}
            onChangeText={(text) => handleInputChange('libraryBooks', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Computer Systems</ThemedText>
        <View style={styles.inputWrapper}>
          <FontAwesome5 name="desktop" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 100+"
            placeholderTextColor={colors.placeholder}
            value={formData.computerSystems}
            onChangeText={(text) => handleInputChange('computerSystems', text)}
          />
        </View>
      </View>
    </>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return null
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={onClose}
                disabled={loading}
              >
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" style={{ marginLeft: -2 }} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <ThemedText type='subtitle' style={styles.title}>Create School</ThemedText>
                <ThemedText style={styles.subtitle}>Set up your school profile</ThemedText>
              </View>
              <View style={styles.stepIndicator}>
                <ThemedText style={styles.stepText}>{currentStep}/{totalSteps}</ThemedText>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderCurrentStep()}
        </ScrollView>

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.previousButton, loading && styles.disabledButton]}
              onPress={handlePrevious}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Previous</ThemedText>
            </TouchableOpacity>
          )}
          
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[styles.button, styles.nextButton, loading && styles.disabledButton]}
              onPress={handleNext}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>Next</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Create School</ThemedText>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default CreateSchool