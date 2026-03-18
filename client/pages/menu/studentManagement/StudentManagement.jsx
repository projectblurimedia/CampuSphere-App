// screens/StudentManagement.js

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Dimensions,
  Image,
  ScrollView
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
import { ToastNotification } from '@/components/ui/ToastNotification'
import { useDebounce } from '@/utils/useDebounce'
import axiosApi from '@/utils/axiosApi'
import { useSelector } from 'react-redux'

const { width, height } = Dimensions.get('window')

// Helper function to get class order for sorting
const getClassOrder = (className) => {
  const orderMap = {
    'Pre-Nursery': 1,
    'Nursery': 2,
    'LKG': 3,
    'UKG': 4,
    'Class 1': 5,
    'Class 2': 6,
    'Class 3': 7,
    'Class 4': 8,
    'Class 5': 9,
    'Class 6': 10,
    'Class 7': 11,
    'Class 8': 12,
    'Class 9': 13,
    'Class 10': 14
  }
  return orderMap[className] || 999
}

// Helper function to get next class
const getNextClass = (currentClass) => {
  const classOrder = [
    'Pre-Nursery',
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10'
  ]

  const currentIndex = classOrder.indexOf(currentClass)
  if (currentIndex === -1) return null
  if (currentIndex === classOrder.length - 1) return 'Graduated'
  return classOrder[currentIndex + 1]
}

// Helper function to get previous class
const getPreviousClass = (currentClass) => {
  const classOrder = [
    'Pre-Nursery',
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10'
  ]

  const currentIndex = classOrder.indexOf(currentClass)
  if (currentIndex === -1) return null
  if (currentIndex === 0) return null
  return classOrder[currentIndex - 1]
}

// ========== CONFIRMATION MODAL COMPONENT ==========
const ConfirmationModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  student,
  actionType,
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

  const getActionDetails = () => {
    switch(actionType) {
      case 'promote':
        return {
          title: 'Promote Student',
          icon: 'arrow-up-circle',
          color: '#10B981',
          message: `Promote ${student?.name} to next class?`,
          nextClass: getNextClass(student?.displayClass || student?.class)
        }
      case 'demote':
        return {
          title: 'Demote Student',
          icon: 'arrow-down-circle',
          color: '#F59E0B',
          message: `Demote ${student?.name} to previous class?`,
          prevClass: getPreviousClass(student?.displayClass || student?.class)
        }
      case 'inactive':
        return {
          title: 'Inactivate Student',
          icon: 'minus-circle',
          color: '#EF4444',
          message: `Mark ${student?.name} as inactive?`,
          warning: 'This will clear current year fee and marks'
        }
      default:
        return {
          title: 'Confirm Action',
          icon: 'help-circle',
          color: colors.primary,
          message: 'Are you sure?'
        }
    }
  }

  const details = getActionDetails()
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
              colors={[details.color + '20', details.color + '10']}
              style={styles.confirmModalIcon}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={details.color} />
              ) : (
                <MaterialCommunityIcons name={details.icon} size={48} color={details.color} />
              )}
            </LinearGradient>
          </View>

          <ThemedText style={[styles.confirmModalTitle, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
            {isProcessing ? 'Processing...' : details.title}
          </ThemedText>

          {!isProcessing && (
            <>
              <ThemedText style={[styles.confirmModalMessage, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                {details.message}
              </ThemedText>

              {student && (
                <View style={[styles.confirmDetailsCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <View style={styles.confirmStudentRow}>
                    <View style={[styles.confirmStudentAvatar, { backgroundColor: details.color + '20' }]}>
                      <ThemedText style={[styles.confirmStudentAvatarText, { color: details.color, fontFamily: 'Poppins-SemiBold' }]}>
                        {student.name?.charAt(0) || 'S'}
                      </ThemedText>
                    </View>
                    <View style={styles.confirmStudentInfo}>
                      <ThemedText style={[styles.confirmStudentName, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                        {student.name}
                      </ThemedText>
                      <ThemedText style={[styles.confirmStudentClass, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                        {student.displayClass || student.class} - {student.section} | Roll: {student.rollNo || 'N/A'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.confirmDivider} />

                  {actionType === 'promote' && details.nextClass && (
                    <View style={styles.confirmDetailRow}>
                      <Feather name="arrow-up-circle" size={16} color="#10B981" />
                      <ThemedText style={[styles.confirmDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                        Will be promoted to:
                      </ThemedText>
                      <ThemedText style={[styles.confirmDetailValue, { color: '#10B981', fontFamily: 'Poppins-SemiBold' }]}>
                        {details.nextClass}
                      </ThemedText>
                    </View>
                  )}

                  {actionType === 'demote' && details.prevClass && (
                    <View style={styles.confirmDetailRow}>
                      <Feather name="arrow-down-circle" size={16} color="#F59E0B" />
                      <ThemedText style={[styles.confirmDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                        Will be demoted to:
                      </ThemedText>
                      <ThemedText style={[styles.confirmDetailValue, { color: '#F59E0B', fontFamily: 'Poppins-SemiBold' }]}>
                        {details.prevClass}
                      </ThemedText>
                    </View>
                  )}

                  {actionType === 'inactive' && (
                    <View style={styles.confirmWarningContainer}>
                      <Feather name="alert-triangle" size={14} color="#EF4444" />
                      <ThemedText style={[styles.confirmWarningText, { fontFamily: 'Poppins-Medium', color: '#EF4444' }]}>
                        {details.warning}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </>
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
                { backgroundColor: details.color },
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
                  {actionType === 'promote' ? 'Promote' : 
                   actionType === 'demote' ? 'Demote' : 'Inactivate'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// ========== SUCCESS RESULT MODAL COMPONENT ==========
const SuccessResultModal = ({ 
  visible, 
  onClose, 
  result,
  actionType
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

  const getActionColor = () => {
    switch(actionType) {
      case 'promote': return '#10B981'
      case 'demote': return '#F59E0B'
      case 'inactive': return '#EF4444'
      default: return colors.primary
    }
  }

  const getActionTitle = () => {
    switch(actionType) {
      case 'promote': return 'Promoted Successfully!'
      case 'demote': return 'Demoted Successfully!'
      case 'inactive': return 'Inactivated Successfully!'
      default: return 'Action Successful!'
    }
  }

  const actionColor = getActionColor()
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
            colors={[actionColor + '20', actionColor + '10']}
            style={styles.successModalHeader}
          >
            <View style={styles.successModalIconContainer}>
              <View style={[styles.successModalIcon, { backgroundColor: actionColor }]}>
                <Feather name="check" size={40} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText style={[styles.successModalTitle, { color: actionColor, fontFamily: 'Poppins-Bold' }]}>
              {getActionTitle()}
            </ThemedText>
          </LinearGradient>

          <ScrollView 
            style={styles.successModalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.successModalContent}
          >
            {result && (
              <View style={styles.successStatsContainer}>
                <View style={[styles.successStudentCard, { backgroundColor: colors.inputBackground }]}>
                  <View style={styles.successStudentRow}>
                    <View style={[styles.successStudentAvatar, { backgroundColor: actionColor + '20' }]}>
                      <ThemedText style={[styles.successStudentAvatarText, { color: actionColor, fontFamily: 'Poppins-Bold' }]}>
                        {result.student?.name?.charAt(0) || 'S'}
                      </ThemedText>
                    </View>
                    <View style={styles.successStudentInfo}>
                      <ThemedText style={[styles.successStudentName, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                        {result.student?.name}
                      </ThemedText>
                      <ThemedText style={[styles.successStudentAdmission, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                        {result.student?.admissionNo}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.successDivider} />

                  <View style={styles.successDetailGrid}>
                    {result.statistics && (
                      <>
                        <View style={styles.successDetailItem}>
                          <Feather name="check-circle" size={14} color="#10B981" />
                          <ThemedText style={[styles.successDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                            Attendance Cleared:
                          </ThemedText>
                          <ThemedText style={[styles.successDetailValue, { color: '#10B981', fontFamily: 'Poppins-SemiBold' }]}>
                            {result.statistics.attendanceRecordsCleared || 0}
                          </ThemedText>
                        </View>

                        <View style={styles.successDetailItem}>
                          <Feather name="award" size={14} color="#F59E0B" />
                          <ThemedText style={[styles.successDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                            Marks Cleared:
                          </ThemedText>
                          <ThemedText style={[styles.successDetailValue, { color: '#F59E0B', fontFamily: 'Poppins-SemiBold' }]}>
                            {result.statistics.marksRecordsCleared || 0}
                          </ThemedText>
                        </View>

                        {actionType !== 'inactive' && (
                          <View style={styles.successDetailItem}>
                            <MaterialCommunityIcons name="school" size={14} color="#8B5CF6" />
                            <ThemedText style={[styles.successDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                              New Class:
                            </ThemedText>
                            <ThemedText style={[styles.successDetailValue, { color: '#8B5CF6', fontFamily: 'Poppins-SemiBold' }]}>
                              {result.student?.newClass}
                            </ThemedText>
                          </View>
                        )}

                        <View style={styles.successDetailItem}>
                          <Feather name="dollar-sign" size={14} color="#3B82F6" />
                          <ThemedText style={[styles.successDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                            Current Year Fee Reset:
                          </ThemedText>
                          <ThemedText style={[styles.successDetailValue, { color: '#3B82F6', fontFamily: 'Poppins-SemiBold' }]}>
                            Yes
                          </ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.successCloseButton, { backgroundColor: actionColor }]}
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

// ========== TAB BUTTON COMPONENT ==========
const TabButton = ({ title, icon, isActive, onPress, color }) => {
  const { colors } = useTheme()
  
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        isActive && [styles.activeTabButton, { backgroundColor: color + '20' }]
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.tabIconContainer, { backgroundColor: isActive ? color : colors.textSecondary + '40' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={isActive ? '#FFFFFF' : colors.textSecondary} />
      </View>
      <ThemedText style={[
        styles.tabText,
        { color: isActive ? color : colors.textSecondary, fontFamily: 'Poppins-Medium' }
      ]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  )
}

// ========== MAIN COMPONENT ==========
export default function StudentManagement({ visible, onClose }) {
  const { colors } = useTheme()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('promote') // 'promote', 'demote', 'inactive'
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [actionResult, setActionResult] = useState(null)
  
  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  
  // Refs
  const searchInputRef = useRef(null)
  const flatListRef = useRef(null)
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const slideAnimation = useRef(new Animated.Value(50)).current

  // Use debounce for search (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

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
        })
      ]).start()
    } else {
      fadeAnimation.setValue(0)
      slideAnimation.setValue(50)
      handleClearSearch()
      setActiveTab('promote')
      setSelectedStudent(null)
      setShowConfirmModal(false)
      setShowSuccessModal(false)
    }
  }, [visible])

  // Toast functions
  const showToast = useCallback((message, type = 'error', duration = 3000) => {
    setToast({ visible: true, message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  // Get API endpoint based on active tab (Under /fees/)
  const getApiEndpoint = useCallback(() => {
    switch(activeTab) {
      case 'promote': return '/fees/promote'
      case 'demote': return '/fees/demote'
      case 'inactive': return '/fees/inactivate'
      default: return null
    }
  }, [activeTab])

  // Search students - SIMPLE: Just return search results without any filtering
  const searchStudents = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) { // Minimum 2 characters to search
      setFilteredStudents([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      // Use the same search endpoint as FeeDetails
      const response = await axiosApi.get('/fees/students/search', {
        params: {
          search: query,
          page: 1,
          limit: 50
        }
      })

      if (response.data.success) {
        const students = response.data.data || []
        setFilteredStudents(students)
        
        // Show toast only if no students found
        if (students.length === 0) {
          showToast('No students found', 'info')
        }
      } else {
        setSearchError(response.data.message || 'Search failed')
        showToast(response.data.message || 'Search failed', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      
      let errorMessage = 'Failed to search students'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required'
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied'
        } else if (error.response.status === 404) {
          errorMessage = 'Search endpoint not found'
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error, please try again later'
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.'
      } else {
        errorMessage = error.message || 'Network error'
      }

      setSearchError(errorMessage)
      showToast(errorMessage, 'error')
      setFilteredStudents([])
    } finally {
      setIsSearching(false)
    }
  }, [showToast])

  // Debounced search effect (only search when query length >= 2)
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      searchStudents(debouncedSearchQuery)
    } else {
      setFilteredStudents([])
      setSearchError(null)
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, searchStudents])

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setFilteredStudents([])
    setSearchError(null)
    setIsSearching(false)
  }, [])

  // Refresh search
  const handleRefresh = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setRefreshing(false)
      return
    }

    setRefreshing(true)
    try {
      await searchStudents(searchQuery)
      showToast('Search refreshed!', 'success')
    } catch (error) {
      showToast('Failed to refresh search', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [searchQuery, searchStudents, showToast])

  // Handle student selection
  const handleStudentSelect = useCallback((student) => {
    setSelectedStudent(student)
    setShowConfirmModal(true)
  }, [])

  const employee = useSelector(state => state.employee.employee)
  const teacherName = employee ? `${employee.firstName} ${employee.lastName}` : 'Teacher'

  // Handle confirmation (Use studentId in URL)
  const handleConfirm = useCallback(async () => {
    if (!selectedStudent) return

    setShowConfirmModal(false)
    setIsProcessing(true)

    try {
      const endpoint = getApiEndpoint()
      if (!endpoint) {
        throw new Error('Invalid action')
      }

      // Use studentId in URL like /fees/:studentId/promote
      const url = `${endpoint}/${selectedStudent.id}`
      
      const payload = {
        updatedBy: teacherName, 
        ...(activeTab === 'promote' && {
          newSection: selectedStudent.section,
          note: 'Promoted to next class'
        }),
        ...(activeTab === 'demote' && {
          targetClass: selectedStudent.class,
          targetSection: selectedStudent.section,
          reason: 'Demoted to previous class',
          note: 'Student demoted'
        }),
        ...(activeTab === 'inactive' && {
          reason: 'Student marked inactive',
          note: 'Student inactivated',
          archiveData: true
        })
      }

      const response = await axiosApi.post(url, payload)

      if (response.data.success) {
        setActionResult(response.data.data)
        setShowSuccessModal(true)
        
        // Clear search and refresh
        handleClearSearch()
        showToast(
          activeTab === 'promote' ? 'Student promoted successfully' :
          activeTab === 'demote' ? 'Student demoted successfully' : 
          'Student inactivated successfully',
          'success'
        )
      } else {
        showToast(response.data.message || 'Action failed', 'error')
      }
    } catch (error) {
      console.error('Action error:', error)
      
      let errorMessage = 'Failed to process action'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setIsProcessing(false)
      setSelectedStudent(null)
    }
  }, [selectedStudent, activeTab, getApiEndpoint, handleClearSearch, showToast])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setShowConfirmModal(false)
    setSelectedStudent(null)
  }, [])

  // Handle success modal close
  const handleSuccessClose = useCallback(() => {
    setShowSuccessModal(false)
    setActionResult(null)
  }, [])

  // Get tab colors
  const getTabColor = useCallback(() => {
    switch(activeTab) {
      case 'promote': return '#10B981'
      case 'demote': return '#F59E0B'
      case 'inactive': return '#EF4444'
      default: return colors.primary
    }
  }, [activeTab, colors])

  // Render student item
  const renderStudentItem = useCallback(({ item }) => {
    const tabColor = getTabColor()
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleStudentSelect(item)}
      >
        <View style={styles.studentHeader}>
          {/* Profile Icon with tab color */}
          <View style={[styles.studentIcon, { backgroundColor: tabColor + '20' }]}>
            <MaterialIcons name="person" size={24} color={tabColor} />
          </View>
          
          {/* Student Info */}
          <View style={styles.studentInfo}>
            <ThemedText style={[styles.studentName, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]} numberOfLines={1}>
              {item.name || `${item.firstName} ${item.lastName}`}
            </ThemedText>
            
            <View style={styles.studentMetaRow}>
              <View style={styles.studentClassBadge}>
                <MaterialIcons name="class" size={12} color={colors.textSecondary} />
                <ThemedText style={[styles.studentMetaText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                  {item.displayClass || item.class} - {item.section}
                </ThemedText>
              </View>
              
              <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
              
              {item.rollNo && (
                <>
                  <ThemedText style={[styles.studentMetaText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Roll: {item.rollNo}
                  </ThemedText>
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                </>
              )}
              
              <ThemedText style={[styles.studentMetaText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                {item.admissionNo}
              </ThemedText>
            </View>

            {/* Show next/previous class indicators based on tab (just for info) */}
            {activeTab === 'promote' && (
              <View style={styles.nextClassContainer}>
                <MaterialIcons name="arrow-upward" size={12} color="#10B981" />
                <ThemedText style={[styles.nextClassText, { color: '#10B981', fontFamily: 'Poppins-Medium' }]}>
                  Next: {getNextClass(item.displayClass || item.class) || 'N/A'}
                </ThemedText>
              </View>
            )}

            {activeTab === 'demote' && (
              <View style={styles.nextClassContainer}>
                <MaterialIcons name="arrow-downward" size={12} color="#F59E0B" />
                <ThemedText style={[styles.nextClassText, { color: '#F59E0B', fontFamily: 'Poppins-Medium' }]}>
                  Previous: {getPreviousClass(item.displayClass || item.class) || 'N/A'}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Action icon */}
          <View style={[styles.actionIcon, { backgroundColor: tabColor + '20' }]}>
            <MaterialIcons 
              name={
                activeTab === 'promote' ? 'arrow-upward' :
                activeTab === 'demote' ? 'arrow-downward' : 'block'
              } 
              size={18} 
              color={tabColor} 
            />
          </View>
        </View>
      </TouchableOpacity>
    )
  }, [activeTab, colors, handleStudentSelect, getTabColor])

  // Render empty component - SIMPLE messages, no "eligible" text
  const renderEmptyComponent = useCallback(() => {
    const tabColor = getTabColor()
    
    if (isSearching) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <ActivityIndicator size="large" color={tabColor} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
            Searching...
          </ThemedText>
        </View>
      )
    }

    if (searchError) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <MaterialIcons name="error-outline" size={48} color={tabColor} />
          <ThemedText style={[styles.emptyTitle, { color: tabColor, fontFamily: 'Poppins-SemiBold' }]}>
            Search Error
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
            {searchError}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: tabColor }]}
            onPress={() => searchStudents(searchQuery)}
          >
            <ThemedText style={[styles.retryButtonText, { fontFamily: 'Poppins-Medium' }]}>
              Retry Search
            </ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    if (searchQuery && searchQuery.length >= 2 && !isSearching && filteredStudents.length === 0) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
            No Students Found
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
            Try a different search term
          </ThemedText>
        </View>
      )
    }

    if (searchQuery && searchQuery.length < 2) {
      return (
        <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
          <MaterialIcons name="info-outline" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
            Type at least 2 characters
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
            Enter student name, class, or section to search
          </ThemedText>
        </View>
      )
    }

    return (
      <View style={[styles.emptyContainer, styles.emptyContainerCentered]}>
        <MaterialIcons 
          name={
            activeTab === 'promote' ? 'arrow-upward' :
            activeTab === 'demote' ? 'arrow-downward' : 'block'
          } 
          size={48} 
          color={tabColor} 
        />
        <ThemedText style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
          {activeTab === 'promote' ? 'Search Students to Promote' :
           activeTab === 'demote' ? 'Search Students to Demote' : 'Search Students to Inactivate'}
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
          {activeTab === 'promote' ? 'Enter student name to promote to next class' :
           activeTab === 'demote' ? 'Enter student name to demote to previous class' : 
           'Enter student name to mark as inactive'}
        </ThemedText>
      </View>
    )
  }, [searchQuery, isSearching, searchError, filteredStudents.length, activeTab, colors, getTabColor, searchStudents])

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient 
          colors={[colors.gradientStart, colors.gradientEnd]} 
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  handleClearSearch()
                  onClose()
                }}
                activeOpacity={0.9}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title} type='subtitle'>
                  Student Management
                </ThemedText>
                <ThemedText style={[styles.subtitle, { fontFamily: 'Poppins-Medium' }]}>
                  {activeTab === 'promote' ? 'Promote students to next class' :
                   activeTab === 'demote' ? 'Demote students to previous class' : 
                   'Mark students as inactive'}
                </ThemedText>
              </View>
              
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TabButton
            title="Promote"
            icon="arrow-up-circle"
            isActive={activeTab === 'promote'}
            onPress={() => {
              setActiveTab('promote')
              handleClearSearch()
            }}
            color="#10B981"
          />
          <TabButton
            title="Demote"
            icon="arrow-down-circle"
            isActive={activeTab === 'demote'}
            onPress={() => {
              setActiveTab('demote')
              handleClearSearch()
            }}
            color="#F59E0B"
          />
          <TabButton
            title="Inactive"
            icon="minus-circle"
            isActive={activeTab === 'inactive'}
            onPress={() => {
              setActiveTab('inactive')
              handleClearSearch()
            }}
            color="#EF4444"
          />
        </View>

        <Animated.View 
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[
              styles.searchInputContainer,
              { 
                backgroundColor: colors.inputBackground,
                borderColor: searchError ? getTabColor() : colors.border
              }
            ]}>
              <Feather 
                name={searchError ? "alert-circle" : "search"} 
                size={18} 
                color={searchError ? getTabColor() : colors.textSecondary} 
                style={styles.searchIcon} 
              />
              <TextInput
                ref={searchInputRef}
                placeholder={`Search by name, class, or section...`}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => searchQuery.length >= 2 && searchStudents(searchQuery)}
                style={[styles.searchInput, { color: colors.text, fontFamily: 'Poppins-Medium' }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={handleClearSearch} 
                  style={styles.clearButton}
                >
                  <Feather name="x-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            {searchQuery && searchQuery.length < 2 && (
              <ThemedText style={[styles.searchHintText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                Type at least 2 characters to search
              </ThemedText>
            )}
            {searchError && (
              <ThemedText style={[styles.searchErrorText, { color: getTabColor(), fontFamily: 'Poppins-Medium' }]}>
                {searchError}
              </ThemedText>
            )}
          </View>

          {/* Students List */}
          <FlatList
            ref={flatListRef}
            data={filteredStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id || item._id}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh} 
                colors={[getTabColor()]} 
                tintColor={getTabColor()} 
                enabled={!!searchQuery.trim() && searchQuery.length >= 2}
              />
            }
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ 
              flexGrow: 1, 
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: 20
            }}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            ListEmptyComponent={renderEmptyComponent}
          />
        </Animated.View>

        {/* Loading Overlay */}
        {(loading || isProcessing) && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="large" color={getTabColor()} />
              <ThemedText style={[styles.loadingText, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                {isProcessing ? 'Processing...' : 'Loading...'}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        student={selectedStudent}
        actionType={activeTab}
        isProcessing={isProcessing}
      />

      {/* Success Modal */}
      <SuccessResultModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        result={actionResult}
        actionType={activeTab}
      />

      {/* Toast Notification */}
      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        onHide={hideToast}
        position="top-center"
        duration={toast.duration || 3000}
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
    paddingBottom: 16,
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
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  activeTabButton: {
    // Background color will be set dynamically
  },
  tabIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  searchHintText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 16,
  },
  searchErrorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  studentCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    marginBottom: 4,
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  studentClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentMetaText: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  nextClassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nextClassText: {
    fontSize: 11,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  emptyContainerCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  // Modal Styles
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  confirmStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmStudentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmStudentAvatarText: {
    fontSize: 18,
  },
  confirmStudentInfo: {
    flex: 1,
  },
  confirmStudentName: {
    fontSize: 16,
    marginBottom: 2,
  },
  confirmStudentClass: {
    fontSize: 13,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  confirmDetailLabel: {
    flex: 1,
    fontSize: 14,
  },
  confirmDetailValue: {
    fontSize: 14,
  },
  confirmWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  confirmWarningText: {
    flex: 1,
    fontSize: 12,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelButtonText: {
    fontSize: 15,
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmActionButtonDisabled: {
    opacity: 0.5,
  },
  confirmActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  confirmProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.7,
    borderRadius: 30,
    overflow: 'hidden',
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
    textAlign: 'center',
  },
  successModalScroll: {
    maxHeight: height * 0.4,
  },
  successModalContent: {
    padding: 20,
  },
  successStatsContainer: {
    gap: 12,
  },
  successStudentCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  successStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successStudentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successStudentAvatarText: {
    fontSize: 20,
  },
  successStudentInfo: {
    flex: 1,
  },
  successStudentName: {
    fontSize: 16,
    marginBottom: 2,
  },
  successStudentAdmission: {
    fontSize: 12,
  },
  successDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  successDetailGrid: {
    gap: 10,
  },
  successDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successDetailLabel: {
    flex: 1,
    fontSize: 13,
  },
  successDetailValue: {
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