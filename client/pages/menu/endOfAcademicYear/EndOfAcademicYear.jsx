import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { 
  FontAwesome5, 
  Feather, 
  MaterialIcons, 
  MaterialCommunityIcons 
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { ScrollView } from 'react-native'
import { useDispatch } from 'react-redux'
import { triggerRefresh } from '@/redux/studentsRefreshSlice'

const { width, height } = Dimensions.get('window')

// Helper function to get current academic year
const getCurrentAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

// Helper function to check if academic year is completed
const isAcademicYearCompleted = (year) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const [startYear] = year.split('-').map(Number)
  
  if (startYear < currentYear) return true
  if (startYear === currentYear && currentMonth < 6) return true
  return false
}

// Academic Year Picker Modal Component
const AcademicYearPickerModal = ({ 
  visible, 
  onClose, 
  onSelect,
  currentYear 
}) => {
  const { colors } = useTheme()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  // Generate academic years
  const generateAcademicYears = () => {
    const years = []
    const currentYearNum = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    for (let i = currentYearNum - 5; i <= currentYearNum + 5; i++) {
      const yearStr = `${i}-${i + 1}`
      const isCurrent = yearStr === getCurrentAcademicYear()
      const isCompleted = i < currentYearNum || (i === currentYearNum && currentMonth >= 6)
      
      years.push({
        label: yearStr,
        value: yearStr,
        isCurrent,
        isCompleted
      })
    }
    return years
  }

  const academicYears = generateAcademicYears()

  const handleSelect = () => {
    onSelect(selectedYear)
    onClose()
  }

  const backdropOpacity = fadeAnim
  const modalScale = scaleAnim

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlayCentered, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.pickerModalContainerCentered,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <LinearGradient
            colors={[colors.gradientStart + '20', colors.gradientEnd + '10']}
            style={styles.pickerModalHeader}
          >
            <View style={[styles.pickerModalIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <MaterialCommunityIcons name="calendar-range" size={28} color={colors.primary} />
            </View>
            <ThemedText style={[styles.pickerModalTitle, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
              Select Academic Year
            </ThemedText>
            <ThemedText style={[styles.pickerModalSubtitle, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
              Choose the academic year for end of year processing
            </ThemedText>
          </LinearGradient>

          <ScrollView
            style={styles.pickerModalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerModalContent}
          >
            {academicYears.map((year) => (
              <TouchableOpacity
                key={year.value}
                style={[
                  styles.yearItem,
                  selectedYear === year.value && styles.yearItemSelected,
                  { borderColor: selectedYear === year.value ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedYear(year.value)}
                activeOpacity={0.7}
              >
                <View style={styles.yearItemLeft}>
                  <View style={[
                    styles.yearRadio,
                    { borderColor: selectedYear === year.value ? colors.primary : colors.border }
                  ]}>
                    {selectedYear === year.value && (
                      <View style={[styles.yearRadioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View>
                    <ThemedText style={[
                      styles.yearLabel,
                      { color: selectedYear === year.value ? colors.primary : colors.text, fontFamily: 'Poppins-Medium' }
                    ]}>
                      {year.label}
                    </ThemedText>
                    <View style={styles.yearBadgeContainer}>
                      {year.isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.primary + '20' }]}>
                          <MaterialIcons name="star" size={12} color={colors.primary} />
                          <ThemedText style={[styles.currentBadgeText, { color: colors.primary, fontFamily: 'Poppins-Medium' }]}>
                            Current
                          </ThemedText>
                        </View>
                      )}
                      {year.isCompleted && !year.isCurrent && (
                        <View style={[styles.completedBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                          <Feather name="check-circle" size={12} color={colors.textSecondary} />
                          <ThemedText style={[styles.completedBadgeText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                            Completed
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {selectedYear === year.value && (
                  <Animated.View>
                    <Feather name="check" size={20} color={colors.primary} />
                  </Animated.View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.pickerModalFooter}>
            <TouchableOpacity
              style={[styles.pickerCancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.pickerCancelButtonText, { color: colors.textSecondary, fontFamily: 'Poppins-SemiBold' }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pickerSelectButton, { backgroundColor: colors.primary }]}
              onPress={handleSelect}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.pickerSelectButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                Select Year
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Confirmation Modal Component
const ConfirmationModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  studentCount,
  academicYear,
  isProcessing = false
}) => {
  const { colors } = useTheme()
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  const backdropOpacity = fadeAnim
  const modalScale = scaleAnim

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlayCentered, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onCancel}
          activeOpacity={1}
          disabled={isProcessing}
        />
        <Animated.View 
          style={[
            styles.confirmModalContainerCentered,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <View style={styles.confirmModalIconContainer}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.confirmModalIcon}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="school" size={36} color="#FFFFFF" />
              )}
            </LinearGradient>
          </View>

          <ThemedText style={[styles.confirmModalTitle, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
            {isProcessing ? 'Processing...' : 'Confirm End of Year Processing'}
          </ThemedText>

          <ThemedText style={[styles.confirmModalMessage, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
            {isProcessing 
              ? `Please wait while we process ${studentCount} students for the new academic year`
              : `Are you sure you want to process the end of academic year for all ${studentCount} students?`
            }
          </ThemedText>

          {!isProcessing && (
            <View style={[styles.confirmDetailsCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={styles.confirmDetailRow}>
                <Feather name="calendar" size={16} color={colors.textSecondary} />
                <ThemedText style={[styles.confirmDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                  Academic Year:
                </ThemedText>
                <ThemedText style={[styles.confirmDetailValue, { color: colors.primary, fontFamily: 'Poppins-SemiBold' }]}>
                  {academicYear}
                </ThemedText>
              </View>

              <View style={styles.confirmDivider} />

              <View style={styles.confirmTotalRow}>
                <ThemedText style={[styles.confirmTotalLabel, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                  Total Students:
                </ThemedText>
                <View style={[styles.confirmTotalBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ThemedText style={[styles.confirmTotalValue, { color: colors.primary, fontFamily: 'Poppins-Bold' }]}>
                    {studentCount}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {!isProcessing && (
            <View style={styles.confirmWarningContainer}>
              <Feather name="info" size={14} color="#F59E0B" />
              <ThemedText style={[styles.confirmWarningText, { fontFamily: 'Poppins-Medium' }]}>
                This will archive attendance, marks, and set up new class fees for all students
              </ThemedText>
            </View>
          )}

          <View style={styles.confirmModalButtons}>
            {!isProcessing && (
              <TouchableOpacity
                style={[styles.confirmCancelButton, { borderColor: colors.border }]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.confirmCancelButtonText, { color: colors.textSecondary, fontFamily: 'Poppins-SemiBold' }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmActionButton, 
                { backgroundColor: colors.primary },
                isProcessing && styles.confirmActionButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <View style={styles.confirmProcessingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[styles.confirmActionButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                    Processing...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={[styles.confirmActionButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                  Confirm
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Success Result Modal Component
const SuccessResultModal = ({ 
  visible, 
  onClose, 
  summary
}) => {
  const { colors } = useTheme()
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const hasErrors = summary?.failed > 0

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  const backdropOpacity = fadeAnim
  const modalScale = scaleAnim

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlayCentered, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.successModalContainerCentered,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <LinearGradient
            colors={hasErrors ? ['#FEE2E2', '#FECACA'] : ['#D1FAE5', '#A7F3D0']}
            style={styles.successModalHeader}
          >
            <View style={styles.successModalIconContainer}>
              <View style={[
                styles.successModalIcon,
                { backgroundColor: hasErrors ? '#EF4444' : '#10B981' }
              ]}>
                {hasErrors ? (
                  <Feather name="alert-triangle" size={32} color="#FFFFFF" />
                ) : (
                  <Feather name="check" size={32} color="#FFFFFF" />
                )}
              </View>
            </View>
            <ThemedText style={[styles.successModalTitle, { color: hasErrors ? '#B91C1C' : '#065F46', fontFamily: 'Poppins-Bold' }]}>
              {hasErrors ? 'Partial Success' : 'End of Year Processing Complete!'}
            </ThemedText>
            <ThemedText style={[styles.successModalSubtitle, { color: hasErrors ? '#991B1B' : '#047857', fontFamily: 'Poppins-Medium' }]}>
              {hasErrors 
                ? 'Some students were processed with warnings'
                : 'All students processed successfully for the new academic year'
              }
            </ThemedText>
          </LinearGradient>

          <ScrollView 
            style={styles.successModalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.successModalContent}
          >
            <View style={styles.successStatsContainer}>
              <View style={styles.successStatsGrid}>
                <View style={[styles.successStatCard, { backgroundColor: colors.inputBackground }]}>
                  <MaterialIcons name="people" size={20} color={colors.primary} />
                  <ThemedText style={[styles.successStatNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                    {summary?.totalProcessed || 0}
                  </ThemedText>
                  <ThemedText style={[styles.successStatLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Total
                  </ThemedText>
                </View>

                <View style={[styles.successStatCard, { backgroundColor: colors.inputBackground }]}>
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <ThemedText style={[styles.successStatNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                    {summary?.successful || 0}
                  </ThemedText>
                  <ThemedText style={[styles.successStatLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Successful
                  </ThemedText>
                </View>

                <View style={[styles.successStatCard, { backgroundColor: colors.inputBackground }]}>
                  <MaterialIcons name="warning" size={20} color="#F59E0B" />
                  <ThemedText style={[styles.successStatNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                    {summary?.failed || 0}
                  </ThemedText>
                  <ThemedText style={[styles.successStatLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Failed
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.successAcademicStats, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.successAcademicRow}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Academic Year:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: colors.primary, fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.academicYear || 'N/A'}
                  </ThemedText>
                </View>

                <View style={styles.successAcademicRow}>
                  <Feather name="trending-up" size={16} color="#10B981" />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Promoted:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: '#10B981', fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.promoted || 0}
                  </ThemedText>
                </View>

                <View style={styles.successAcademicRow}>
                  <FontAwesome5 name="user-graduate" size={16} color="#8B5CF6" />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Graduated:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: '#8B5CF6', fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.graduated || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.successCloseButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.successCloseButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
              Done
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Main End of Academic Year Component
export default function EndOfAcademicYear({ visible, onClose }) {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  // State for filters
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear())
  const [showAcademicYearPicker, setShowAcademicYearPicker] = useState(false)
  
  // State for students
  const [studentCount, setStudentCount] = useState(0)
  
  // State for UI
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // State for modals
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [processingSummary, setProcessingSummary] = useState(null)
  
  // Animations
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const slideAnimation = useRef(new Animated.Value(50)).current
  const scaleAnimation = useRef(new Animated.Value(0.9)).current
  
  // Toast notification
  const [toast, setToast] = useState(null)

  // Animate content on mount
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnimation, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnimation.setValue(0)
      slideAnimation.setValue(50)
      scaleAnimation.setValue(0.9)
    }
  }, [visible])

  // Toast notification functions
  const showToast = useCallback((message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Load student count using dedicated endpoint
  const loadStudentCount = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axiosApi.get('/students/for-endOfAcademicYear')
      
      if (response.data.success) {
        setStudentCount(response.data.count || 0)
      } else {
        throw new Error(response.data.message || 'Failed to load student count')
      }
    } catch (err) {
      console.error('Error loading student count:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load student count'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setStudentCount(0)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Load data when component mounts
  useEffect(() => {
    if (visible) {
      loadStudentCount()
    }
  }, [visible, loadStudentCount])

  // Refresh data
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadStudentCount()
  }, [loadStudentCount])

  // Handle process button press
  const handleProcessPress = useCallback(() => {
    if (studentCount === 0) {
      showToast('No students available to process', 'warning')
      return
    }

    if (!academicYear) {
      showToast('Please select academic year', 'warning')
      return
    }

    setShowConfirmModal(true)
  }, [studentCount, academicYear])

  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    setShowConfirmModal(false)
    setIsProcessing(true)

    try {
      const payload = {
        academicYear,
      }

      const response = await axiosApi.post('/students/endOfAcademicYear', payload)

      if (response.data.success || response.status === 207) {
        setProcessingSummary(response.data.summary)
        setShowSuccessModal(true)

        dispatch(triggerRefresh())
        
        // Reload student count after processing
        setTimeout(() => {
          loadStudentCount()
        }, 1000)
      }
    } catch (err) {
      if (err.response?.status === 207) {
        setProcessingSummary(err.response.data.summary)
        setShowSuccessModal(true)
      } else {
        showToast(
          err.response?.data?.message || err.message || 'Failed to process end of academic year',
          'error'
        )
      }
    } finally {
      setIsProcessing(false)
    }
  }, [academicYear, loadStudentCount, dispatch])

  const handleCancel = useCallback(() => {
    setShowConfirmModal(false)
  }, [])

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false)
    setProcessingSummary(null)
    onClose()
  }, [])

  const isYearCompleted = isAcademicYearCompleted(academicYear)

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
                activeOpacity={0.9}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.headerTitle}>
                <ThemedText style={[styles.title, { fontFamily: 'Poppins-SemiBold' }]}>
                  End of Academic Year
                </ThemedText>
                <ThemedText style={[styles.subtitle, { fontFamily: 'Poppins-Medium' }]}>
                  {studentCount > 0 
                    ? `${studentCount} total student${studentCount !== 1 ? 's' : ''}` 
                    : 'No students available'
                  }
                </ThemedText>
              </View>
              
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Loading Overlay */}
        {(isLoading || isProcessing) && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                {isProcessing ? 'Processing End of Year...' : 'Loading...'}
              </ThemedText>
              <ThemedText style={[styles.loadingSubtext, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                {isProcessing ? 'This may take a few moments' : 'Fetching student data'}
              </ThemedText>
            </View>
          </View>
        )}

        <Animated.View 
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* Main Content - Centered Student Count Card */}
            <View style={styles.centerContainer}>
              <Animated.View 
                style={[
                  styles.mainCard,
                  { 
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    transform: [{ scale: scaleAnimation }]
                  }
                ]}
              >
                {/* Academic Year Section */}
                <TouchableOpacity
                  style={[styles.yearSelector, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                  onPress={() => setShowAcademicYearPicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.yearSelectorLeft}>
                    <Feather name="calendar" size={24} color={colors.primary} />
                    <View>
                      <ThemedText style={[styles.yearSelectorLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                        Academic Year
                      </ThemedText>
                      <ThemedText style={[styles.yearSelectorValue, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                        {academicYear}
                      </ThemedText>
                      {isYearCompleted && (
                        <View style={[styles.yearCompletedBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                          <Feather name="check-circle" size={12} color={colors.textSecondary} />
                          <ThemedText style={[styles.yearCompletedText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                            Completed
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                  <Feather name="chevron-down" size={20} color={colors.primary} />
                </TouchableOpacity>

                {/* Student Count Display */}
                <View style={styles.studentCountContainer}>
                  <View style={[styles.studentCountIcon, { backgroundColor: colors.primary + '15' }]}>
                    <MaterialCommunityIcons name="account-group" size={48} color={colors.primary} />
                  </View>
                  
                  <View style={styles.studentCountNumbers}>
                    <ThemedText style={[styles.studentCountNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                      {studentCount}
                    </ThemedText>
                    <ThemedText style={[styles.studentCountLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                      {studentCount === 1 ? 'Student Ready for Processing' : 'Students Ready for Processing'}
                    </ThemedText>
                  </View>

                  {studentCount > 0 && (
                    <View style={[styles.promotionInfo, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
                      <MaterialIcons name="info-outline" size={16} color={colors.primary} />
                      <ThemedText style={[styles.promotionInfoText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                        All active students will be promoted to the next class
                      </ThemedText>
                    </View>
                  )}
                </View>

                {error && (
                  <View style={[styles.errorCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                    <Feather name="alert-triangle" size={20} color="#DC2626" />
                    <ThemedText style={[styles.errorText, { color: '#B91C1C', fontFamily: 'Poppins-Medium', flex: 1 }]}>
                      {error}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.errorRetryButton, { backgroundColor: '#DC2626' }]}
                      onPress={loadStudentCount}
                    >
                      <ThemedText style={[styles.errorRetryText, { fontFamily: 'Poppins-Medium' }]}>
                        Retry
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {!isLoading && studentCount === 0 && !error && (
                  <View style={styles.emptyStateContainer}>
                    <MaterialIcons name="school" size={60} color={colors.textSecondary} />
                    <ThemedText style={[styles.emptyStateTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                      No Students Available
                    </ThemedText>
                    <ThemedText style={[styles.emptyStateText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                      There are no active students to process at this time
                    </ThemedText>
                  </View>
                )}
              </Animated.View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Bottom Action Button */}
        {studentCount > 0 && !error && (
          <View style={styles.footer}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerGradient}
            >
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleProcessPress}
                activeOpacity={0.9}
                disabled={isLoading || isProcessing}
              >
                <MaterialCommunityIcons name="school" size={22} color="#FFFFFF" />
                <ThemedText style={[styles.footerButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                  Process End of Year ({studentCount})
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Modals */}
      <AcademicYearPickerModal
        visible={showAcademicYearPicker}
        onClose={() => setShowAcademicYearPicker(false)}
        onSelect={setAcademicYear}
        currentYear={academicYear}
      />

      <ConfirmationModal
        visible={showConfirmModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        studentCount={studentCount}
        academicYear={academicYear}
        isProcessing={isProcessing}
      />

      {processingSummary && (
        <SuccessResultModal
          visible={showSuccessModal}
          onClose={handleSuccessModalClose}
          summary={processingSummary}
        />
      )}

      {/* Toast Notification */}
      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={hideToast}
        position="bottom-center"
        duration={toast?.duration || 3000}
        showCloseButton={true}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: -2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
  },
  mainCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 32,
  },
  yearSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  yearSelectorLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  yearSelectorValue: {
    fontSize: 16,
  },
  yearCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  yearCompletedText: {
    fontSize: 10,
  },
  studentCountContainer: {
    alignItems: 'center',
    gap: 20,
  },
  studentCountIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentCountNumbers: {
    alignItems: 'center',
    gap: 8,
  },
  studentCountNumber: {
    fontSize: 64,
    lineHeight: 72,
  },
  studentCountLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  promotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  promotionInfoText: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
  },
  errorText: {
    fontSize: 13,
  },
  errorRetryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  errorRetryText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
  },
  footerGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 13,
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    borderRadius: 30,
    overflow: 'hidden',
  },
  pickerModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  pickerModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  pickerModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  pickerModalScroll: {
    maxHeight: height * 0.4,
  },
  pickerModalContent: {
    padding: 16,
    gap: 8,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  yearItemSelected: {
    borderWidth: 2,
  },
  yearItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  yearLabel: {
    fontSize: 16,
  },
  yearBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 10,
  },
  pickerModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  pickerCancelButtonText: {
    fontSize: 16,
  },
  pickerSelectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  pickerSelectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  confirmModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
  },
  confirmModalIconContainer: {
    marginBottom: 16,
  },
  confirmModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmDetailsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmDetailLabel: {
    flex: 1,
    fontSize: 14,
  },
  confirmDetailValue: {
    fontSize: 14,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  confirmTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  confirmTotalLabel: {
    fontSize: 16,
  },
  confirmTotalBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmTotalValue: {
    fontSize: 18,
  },
  confirmWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  confirmWarningText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelButtonText: {
    fontSize: 16,
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmActionButtonDisabled: {
    opacity: 0.5,
  },
  confirmActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  confirmProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    borderRadius: 30,
    overflow: 'hidden',
  },
  successModalScroll: {
    maxHeight: height * 0.5,
  },
  successModalContent: {
    padding: 20,
  },
  successModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  successModalIconContainer: {
    marginBottom: 16,
  },
  successModalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalTitle: {
    fontSize: 22,
    marginBottom: 4,
    textAlign: 'center',
  },
  successModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  successStatsContainer: {
    gap: 16,
  },
  successStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  successStatCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  successStatNumber: {
    fontSize: 20,
  },
  successStatLabel: {
    fontSize: 12,
  },
  successAcademicStats: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  successAcademicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successAcademicLabel: {
    flex: 1,
    fontSize: 13,
  },
  successAcademicValue: {
    fontSize: 14,
  },
  successCloseButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  successCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
})