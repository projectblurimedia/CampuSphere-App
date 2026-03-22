import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather, MaterialIcons, MaterialCommunityIcons, Entypo, AntDesign, FontAwesome6 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import CreateStudent from '@/pages/menu/createStudent/CreateStudent'
import StudentFeeDetails from '@/pages/menu/feeDetails/StudentFeeDetails'
import StudentAttendance from './StudentAttendance'
import StudentMarks from './StudentMarks'
import { useDispatch } from 'react-redux'
import { triggerRefresh } from '@/redux/studentsRefreshSlice'

const { width, height } = Dimensions.get('window')

// ========== ROLE PERMISSIONS ==========
const rolePermissions = {
  chairperson: {
    canEdit: true,
    canInactivate: true,
    canViewFees: true,
    canViewAttendance: true,
    canViewMarks: true
  },
  accountant: {
    canEdit: true,
    canInactivate: true,
    canViewFees: true,
    canViewAttendance: true,
    canViewMarks: true
  },
  principal: {
    canEdit: false,
    canInactivate: false,
    canViewFees: false,
    canViewAttendance: true,
    canViewMarks: true
  },
  vice_principal: {
    canEdit: false,
    canInactivate: false,
    canViewFees: false,
    canViewAttendance: true,
    canViewMarks: true
  },
  default: {
    canEdit: false,
    canInactivate: false,
    canViewFees: false,
    canViewAttendance: true,
    canViewMarks: true
  }
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
      case 'inactive':
        return {
          title: 'Inactivate Student',
          icon: 'minus-circle',
          color: '#EF4444',
          message: `Mark ${student?.name || 'this student'} as inactive?`,
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
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlay, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onCancel}
          activeOpacity={1}
          disabled={isProcessing}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <View style={[styles.modalIcon, { backgroundColor: `${details.color}20` }]}>
            {isProcessing ? (
              <ActivityIndicator size="large" color={details.color} />
            ) : (
              <MaterialCommunityIcons name={details.icon} size={48} color={details.color} />
            )}
          </View>
          
          <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
            {isProcessing ? 'Processing...' : details.title}
          </ThemedText>
          
          {!isProcessing && (
            <>
              <ThemedText style={[styles.modalMessage, { color: colors.textSecondary }]}>
                {details.message}
              </ThemedText>

              {student && (
                <View style={[styles.confirmDetailsCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <View style={styles.confirmStudentRow}>
                    <View style={[styles.confirmStudentAvatar, { backgroundColor: details.color + '20' }]}>
                      <ThemedText style={[styles.confirmStudentAvatarText, { color: details.color }]}>
                        {student.name?.charAt(0) || student.firstName?.charAt(0) || 'S'}
                      </ThemedText>
                    </View>
                    <View style={styles.confirmStudentInfo}>
                      <ThemedText style={[styles.confirmStudentName, { color: colors.text }]}>
                        {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                      </ThemedText>
                      <ThemedText style={[styles.confirmStudentClass, { color: colors.textSecondary }]}>
                        {student.displayClass || student.class} - {student.section} | Roll: {student.rollNo || 'N/A'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.confirmDivider} />

                  {actionType === 'inactive' && (
                    <View style={styles.confirmWarningContainer}>
                      <Feather name="alert-triangle" size={14} color="#EF4444" />
                      <ThemedText style={[styles.confirmWarningText, { color: '#EF4444' }]}>
                        {details.warning}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          <View style={styles.modalButtons}>
            {!isProcessing && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.border }]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.modalButtonDelete, 
                { backgroundColor: details.color },
                isProcessing && styles.modalButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <View style={styles.modalProcessingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={styles.modalButtonTextDelete}>
                    Processing...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.modalButtonTextDelete}>
                  Inactivate
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

export default function Student({ student, onClose }) {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  
  // Get user role from Redux
  const { employee } = useSelector((state) => state.employee)
  const role = employee?.designation?.toLowerCase() || 'default'
  const permissions = rolePermissions[role] || rolePermissions.default
  
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // UI state
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showMarksModal, setShowMarksModal] = useState(false)
  
  // Inactive state
  const [showInactiveConfirmModal, setShowInactiveConfirmModal] = useState(false)
  const [isProcessingInactive, setIsProcessingInactive] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0.95)).current

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Check if user has permission for specific action
  const hasPermission = useCallback((action) => {
    switch(action) {
      case 'edit':
        return permissions.canEdit
      case 'inactive':
        return permissions.canInactivate
      case 'fees':
        return permissions.canViewFees
      case 'attendance':
        return permissions.canViewAttendance
      case 'marks':
        return permissions.canViewMarks
      default:
        return false
    }
  }, [permissions])

  // Fetch complete student data
  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get(`/students/${student.id}`)
      
      if (response.data.success) {
        const data = response.data.data
        setStudentData(data)
        
        // Animate content fade in
        Animated.parallel([
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnimation, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          })
        ]).start()
      } else {
        showToast(response.data.message || 'Failed to load student data', 'error')
      }
    } catch (error) {
      console.error('Error fetching student data:', error)
      let errorMessage = 'Failed to load student data'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load student data'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true)
    fetchStudentData()
  }

  useEffect(() => {
    if (student?.id) {
      fetchStudentData()
    }
  }, [student?.id])

  // Animate menu on show/hide
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: showMoreMenu ? 1 : 0,
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start()
  }, [showMoreMenu])

  const handleEdit = () => {
    setShowMoreMenu(false)
    setShowEditModal(true)
  }

  const handleFeeDetails = () => {
    setShowMoreMenu(false)
    setShowFeeDetails(true)
  }

  const handleInactiveClick = () => {
    setShowMoreMenu(false)
    setShowInactiveConfirmModal(true)
  }

  const handleInactiveConfirm = async () => {
    if (!studentData && !student) return

    setIsProcessingInactive(true)

    try {
      const studentId = studentData?.id || student?.id
      const response = await axiosApi.post(`/students/inactive/${studentId}`, {
        updatedBy: employee?.name || 'Admin',
        reason: 'Student marked inactive',
        note: 'Student inactivated from profile',
        archiveData: true
      })

      if (response.data.success) {
        setShowInactiveConfirmModal(false)
        showToast('Student inactivated successfully', 'success')
        dispatch(triggerRefresh())
        
        await fetchStudentData()
        
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setShowInactiveConfirmModal(false)
        showToast(response.data.message || 'Failed to inactivate student', 'error')
      }
    } catch (error) {
      console.error('Inactive error:', error)
      
      let errorMessage = 'Failed to inactivate student'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setShowInactiveConfirmModal(false)
      showToast(errorMessage, 'error')
    } finally {
      setIsProcessingInactive(false)
    }
  }

  const handleInactiveCancel = () => {
    setShowInactiveConfirmModal(false)
  }

  // Filter actions based on role permissions
  const getAvailableActions = () => {
    const allActions = [
      { 
        id: 1, 
        icon: 'calendar-check', 
        iconSet: MaterialCommunityIcons, 
        label: 'Attendance', 
        color: '#4CAF50', 
        action: 'attendance', 
        handler: () => {
          setShowMoreMenu(false)
          setShowAttendanceModal(true)
        } 
      },
      { 
        id: 2, 
        icon: 'star', 
        iconSet: MaterialIcons, 
        label: 'Marks', 
        color: '#2196F3', 
        action: 'marks', 
        handler: () => {
          setShowMoreMenu(false)
          setShowMarksModal(true)
        } 
      },
      { 
        id: 3, 
        icon: 'currency-inr', 
        iconSet: MaterialCommunityIcons, 
        label: 'Fee Details', 
        color: '#FF9800', 
        action: 'fees', 
        handler: handleFeeDetails 
      },
      { 
        id: 4, 
        icon: 'edit', 
        iconSet: MaterialIcons, 
        label: 'Edit Student', 
        color: colors.primary, 
        action: 'edit', 
        handler: handleEdit 
      },
      { 
        id: 6, 
        icon: 'delete', 
        iconSet: MaterialIcons, 
        label: 'Inactive Student', 
        color: '#F44336', 
        action: 'inactive', 
        handler: handleInactiveClick 
      },
    ]

    // Filter actions based on permissions
    return allActions.filter(action => hasPermission(action.action))
  }

  const moreActions = getAvailableActions()

  const handleMoreAction = (action) => {
    if (action.handler) {
      action.handler()
    } else {
      setShowMoreMenu(false)
      showToast(`${action.label} feature coming soon!`, 'info')
    }
  }

  const renderAvatar = () => {
    const name = studentData?.name || `${studentData?.firstName || ''} ${studentData?.lastName || ''}`.trim() || student.name || 'S'
    const profilePic = studentData?.profilePicUrl || student.profilePicUrl
    
    if (profilePic) {
      return (
        <Image source={{ uri: profilePic }} style={styles.studentAvatar} />
      )
    }
    
    const gradients = [
      ['#4158D0', '#C850C0'],
      ['#FF512F', '#F09819'],
      ['#11998e', '#38ef7d'],
      ['#834d9b', '#d04ed6'],
      ['#4776E6', '#8E54E9'],
      ['#FF416C', '#FF4B2B'],
    ]
    
    const gradientIndex = name.charCodeAt(0) % gradients.length
    const gradient = gradients[gradientIndex]
    
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.studentAvatar}
      >
        <ThemedText style={styles.avatarText}>
          {name.charAt(0).toUpperCase()}
        </ThemedText>
      </LinearGradient>
    )
  }

  const renderMoreMenu = () => {
    const translateY = slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-20, 0]
    })

    const opacity = slideAnimation

    return (
      <Animated.View 
        style={[
          styles.moreMenu, 
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            opacity,
            transform: [{ translateY }]
          }
        ]}
      >
        {moreActions.map((action, index) => {
          const IconComponent = action.iconSet || MaterialIcons
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.menuItem,
                index === moreActions.length - 1 && styles.lastMenuItem,
                { borderBottomColor: colors.border }
              ]}
              onPress={() => handleMoreAction(action)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${action.color}15` }]}>
                <IconComponent name={action.icon} size={20} color={action.color} />
              </View>
              <ThemedText style={[styles.menuItemText, { color: colors.text, flex: 1 }]}>
                {action.label}
              </ThemedText>
              <Feather name="chevron-right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )
        })}
      </Animated.View>
    )
  }

  const renderDetailCard = (icon, iconSet, title, value, color, bgColor, isFullWidth = false) => {
    const IconComponent = iconSet || Ionicons
    
    return (
      <View style={[
        styles.detailCard, 
        isFullWidth && styles.fullWidthCard,
        { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border 
        }
      ]}>
        <View style={[styles.detailIconWrapper, { backgroundColor: bgColor }]}>
          <IconComponent name={icon} size={22} color={color} />
        </View>
        <View style={styles.detailCardContent}>
          <ThemedText style={[styles.detailCardLabel, { color: colors.textSecondary }]}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.detailCardValue, { color: colors.text }]} numberOfLines={1}>
            {value || 'N/A'}
          </ThemedText>
        </View>
      </View>
    )
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors?.gradientStart, colors?.gradientEnd]}
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
                <ThemedText type='subtitle' style={styles.title}>
                  Student Profile
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  All details of student
                </ThemedText>
              </View>
              
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard]}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading student details...
            </ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const displayName = studentData?.name || `${studentData?.firstName || ''} ${studentData?.lastName || ''}`.trim() || student.name
  const displayClass = studentData?.displayClass || student.class
  const displaySection = studentData?.section || student.section
  const displayRollNo = studentData?.rollNo || student.rollNo
  const displayAdmissionNo = studentData?.admissionNo || student.admissionNo
  const displayDob = studentData?.dob || student.dob
  const displayVillage = studentData?.village
  const displayAddress = studentData?.address
  const displayParent = studentData?.parentName || student.parent
  const displayContact = studentData?.parentPhone || student.contact
  const displayContact2 = studentData?.parentPhone2
  const displayEmail = studentData?.parentEmail
  const displayGender = studentData?.gender || student.gender
  const displayBloodGroup = studentData?.bloodGroup
  const displayStudentType = studentData?.studentType || 'DAY_SCHOLAR'
  const displayIsUsingTransport = studentData?.isUsingSchoolTransport || false
  const displayIsUsingHostel = studentData?.isUsingSchoolHostel || false

  return (
    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
    
      <LinearGradient
        colors={[colors?.gradientStart, colors?.gradientEnd]}
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
              <ThemedText type='subtitle' style={styles.title}>
                Student Profile
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                All details of student
              </ThemedText>
            </View>
            
            {/* Only show more button if there are available actions */}
            {moreActions.length > 0 && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowMoreMenu(!showMoreMenu)}
                activeOpacity={0.9}
              >
                <Entypo name="dots-three-vertical" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* If no actions, show empty view for spacing */}
            {moreActions.length === 0 && <View style={{ width: 44 }} />}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { borderColor: colors.border, backgroundColor: colors?.cardBackground }]}>
            <View style={styles.profileContent}>
              {renderAvatar()}
              
              <View style={styles.profileInfo}>
                <ThemedText type='subtitle' style={[styles.profileName, { color: colors?.text }]}>
                  {displayName}
                </ThemedText>
                
                <View style={styles.classSectionContainer}>
                  <View style={[styles.classSectionBadge, { backgroundColor: colors?.inputBackground }]}>
                    <Ionicons name="school-outline" size={14} color={colors?.text} />
                    <ThemedText style={[styles.classSectionText, {color: colors?.textSecondary }]}>
                      {displayClass} - {displaySection}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions - Only show permitted actions */}
          <View style={styles.quickActions}>
            {hasPermission('attendance') && (
              <TouchableOpacity 
                style={[styles.quickAction, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}
                onPress={() => setShowAttendanceModal(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <MaterialCommunityIcons name="calendar-check" size={22} color={colors.primary} />
                </View>
                <ThemedText style={[styles.quickActionText, { color: colors.primary }]}>
                  Attendance
                </ThemedText>
              </TouchableOpacity>
            )}

            {hasPermission('marks') && (
              <TouchableOpacity 
                style={[styles.quickAction, { backgroundColor: '#FF980008', borderColor: '#FF980020' }]}
                onPress={() => setShowMarksModal(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#FF980015' }]}>
                  <MaterialIcons name="star" size={22} color="#FF9800" />
                </View>
                <ThemedText style={[styles.quickActionText, { color: '#FF9800' }]}>
                  Marks
                </ThemedText>
              </TouchableOpacity>
            )}

            {hasPermission('fees') && (
              <TouchableOpacity 
                style={[styles.quickAction, { backgroundColor: '#4CAF5008', borderColor: '#4CAF5020' }]}
                onPress={handleFeeDetails}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF5015' }]}>
                  <MaterialCommunityIcons name="currency-inr" size={22} color="#4CAF50" />
                </View>
                <ThemedText style={[styles.quickActionText, { color: '#4CAF50' }]}>
                  Fees
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Student Details Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}10` }]}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Student Details
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              {/* Gender and Roll No in same row */}
              <View style={styles.rowContainer}>
                {renderDetailCard(
                  displayGender === 'MALE' ? 'male' : displayGender === 'FEMALE' ? 'female' : 'genderless',
                  FontAwesome5,
                  'Gender',
                  displayGender?.charAt(0) + displayGender?.slice(1).toLowerCase(),
                  displayGender === 'MALE' ? '#2196F3' : displayGender === 'FEMALE' ? '#E91E63' : '#757575',
                  displayGender === 'MALE' ? '#2196F310' : displayGender === 'FEMALE' ? '#E91E6310' : '#75757510'
                )}

                {displayRollNo && renderDetailCard(
                  'id-card',
                  Ionicons,
                  'Roll No',
                  displayRollNo,
                  '#9C27B0',
                  '#9C27B010'
                )}
              </View>

              {renderDetailCard(
                'cake-variant',
                MaterialCommunityIcons,
                'Date of Birth',
                formatDate(displayDob),
                '#FF6B6B',
                '#FF6B6B10'
              )}

              {renderDetailCard(
                'id-card',
                MaterialCommunityIcons,
                'Admission No',
                displayAdmissionNo,
                colors.primary,
                `${colors.primary}10`
              )}

              {displayBloodGroup && renderDetailCard(
                'water',
                MaterialCommunityIcons,
                'Blood Group',
                displayBloodGroup,
                '#F44336',
                '#F4433610'
              )}

              {displayStudentType && renderDetailCard(
                displayStudentType === 'HOSTELLER' ? 'bed' : 'home',
                Ionicons,
                'Student Type',
                displayStudentType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                displayStudentType === 'HOSTELLER' ? '#9C27B0' : '#FF9800',
                displayStudentType === 'HOSTELLER' ? '#9C27B010' : '#FF980010'
              )}

              {displayVillage && renderDetailCard(
                'location',
                Ionicons,
                'Village',
                displayVillage,
                '#4CAF50',
                '#4CAF5010'
              )}

              {displayAddress && renderDetailCard(
                'home',
                Ionicons,
                'Address',
                displayAddress,
                '#FF9800',
                '#FF980010',
                true
              )}
            </View>
          </View>

          {/* Transport & Hostel Info */}
          {(displayIsUsingTransport || displayIsUsingHostel) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: '#00BCD410' }]}>
                    <MaterialCommunityIcons name="offer" size={18} color="#00a8ce" />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Facilities
                  </ThemedText>
                </View>
              </View>

              <View style={styles.facilitiesContainer}>
                {displayIsUsingTransport && (
                  <View style={[styles.facilityBadge, { backgroundColor: '#00BCD410' }]}>
                    <Ionicons name="bus-outline" size={16} color="#00BCD4" />
                    <ThemedText style={[styles.facilityText, { color: '#00BCD4' }]}>
                      School Transport
                    </ThemedText>
                  </View>
                )}
                
                {displayIsUsingHostel && (
                  <View style={[styles.facilityBadge, { backgroundColor: '#9C27B010' }]}>
                    <Ionicons name="bed-outline" size={16} color="#9C27B0" />
                    <ThemedText style={[styles.facilityText, { color: '#9C27B0' }]}>
                      Hostel Facility
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Parent Details Section */}
          {(displayParent || displayContact || displayContact2 || displayEmail) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: '#9C27B010' }]}>
                    <Ionicons name="people" size={18} color="#9C27B0" />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Parent Information
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                {displayParent && renderDetailCard(
                  'person-outline',
                  Ionicons,
                  'Parent Name',
                  displayParent,
                  '#9C27B0',
                  '#9C27B010',
                  true
                )}
                
                <View style={styles.rowContainer}>
                  {displayContact && renderDetailCard(
                    'call-outline',
                    Ionicons,
                    'Primary Contact',
                    displayContact,
                    '#2196F3',
                    '#2196F310'
                  )}

                  {displayContact2 && renderDetailCard(
                    'call-outline',
                    Ionicons,
                    'Secondary Contact',
                    displayContact2,
                    '#4CAF50',
                    '#4CAF5010'
                  )}
                </View>

                {displayEmail && renderDetailCard(
                  'mail-outline',
                  Ionicons,
                  'Email',
                  displayEmail,
                  '#FF9800',
                  '#FF980010',
                  true
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* More Menu Modal */}
      {showMoreMenu && moreActions.length > 0 && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMoreMenu(false)}
            activeOpacity={1}
          />
          {renderMoreMenu()}
        </>
      )}

      {/* Edit Modal - Only render if has permission */}
      {hasPermission('edit') && (
        <CreateStudent
          key={studentData?.id || student?.id}
          visible={showEditModal}
          onClose={(refresh) => {
            setShowEditModal(false)
            if (refresh) {
              fetchStudentData() 
            }
          }}
          studentData={studentData || student}
        />
      )}

      {/* Fee Details Modal - Only render if has permission */}
      {hasPermission('fees') && (
        <StudentFeeDetails
          visible={showFeeDetails}
          onClose={() => setShowFeeDetails(false)}
          student={studentData || student}
          onPaymentSuccess={(result) => {
            showToast('Payment completed successfully', 'success')
            fetchStudentData()
          }}
        />
      )}

      {/* Attendance Modal - Only render if has permission */}
      {hasPermission('attendance') && showAttendanceModal && (
        <StudentAttendance
          visible={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          student={studentData || student}
        />
      )}

      {/* Marks Modal - Only render if has permission */}
      {hasPermission('marks') && showMarksModal && (
        <StudentMarks
          visible={showMarksModal}
          onClose={() => setShowMarksModal(false)}
          student={studentData || student}
        />
      )}

      {/* Inactive Confirmation Modal - Only render if has permission */}
      {hasPermission('inactive') && (
        <ConfirmationModal
          visible={showInactiveConfirmModal}
          onConfirm={handleInactiveConfirm}
          onCancel={handleInactiveCancel}
          student={studentData || student}
          actionType="inactive"
          isProcessing={isProcessingInactive}
        />
      )}

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
  )
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 15,
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
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    zIndex: 1,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
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
    paddingBottom: 16,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    letterSpacing: 0.3,
  },
  classSectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  classSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  classSectionText: {
    fontSize: 13,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: 0.2,
    fontFamily: 'Poppins-SemiBold',
  },
  detailsGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  detailCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  fullWidthCard: {
    width: '100%',
  },
  detailIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCardContent: {
    flex: 1,
  },
  detailCardLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: -2,
  },
  detailCardValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  facilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  facilityText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  moreMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 9999,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 14,
  },
  // Confirmation Modal Styles - Matching Employee Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalButtonDelete: {
    backgroundColor: '#F44336',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  modalButtonTextDelete: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  modalProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontFamily: 'Poppins-SemiBold',
  },
  confirmStudentInfo: {
    flex: 1,
  },
  confirmStudentName: {
    fontSize: 16,
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  confirmStudentClass: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  confirmWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmWarningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
})