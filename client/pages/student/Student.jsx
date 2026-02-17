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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather, MaterialIcons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState, useRef, useEffect, useCallback } from 'react'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import CreateStudent from '@/pages/menu/createStudent/CreateStudent'
import StudentFeeDetails from '@/pages/menu/feeDetails/StudentFeeDetails'
import StudentAttendance from './StudentAttendance'
import StudentMarks from './StudentMarks'

export default function Student({ student, onClose }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // UI state
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showMarksModal, setShowMarksModal] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Fetch complete student data
  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get(`/students/${student.id}`)
      
      if (response.data.success) {
        const data = response.data.data
        setStudentData(data)
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

  const handleDelete = () => {
    setShowMoreMenu(false)
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            showToast('Delete feature coming soon!', 'info')
          }
        }
      ]
    )
  }

  const moreActions = [
    { id: 1, icon: 'event-note', label: 'Attendance', color: '#4CAF50', action: 'attendance', handler: () => {
      setShowMoreMenu(false)
      setShowAttendanceModal(true)
    } },
    { id: 2, icon: 'school', label: 'Marks', color: '#2196F3', action: 'marks', handler: () => {
      setShowMoreMenu(false)
      setShowMarksModal(true)
    } },
    { id: 3, icon: 'attach-money', label: 'Fee Details', color: '#FF9800', action: 'fees', handler: handleFeeDetails },
    { id: 4, icon: 'edit', label: 'Edit Student', color: colors.primary, action: 'edit', handler: handleEdit },
    { id: 5, icon: 'assignment', label: 'View Reports', color: '#9C27B0', action: 'reports' },
    { id: 6, icon: 'delete', label: 'Delete Student', color: '#F44336', action: 'delete', handler: handleDelete },
  ]

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
    
    return (
      <View style={[styles.studentAvatar, { backgroundColor: '#fffffff6' }]}>
        <ThemedText style={[styles.avatarText, { color: '#1d9bf0' }]}>
          {name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
    )
  }

  const getStudentTypeIcon = (type) => {
    switch(type) {
      case 'DAY_SCHOLAR':
        return { icon: 'home', color: '#FF9800', label: 'Day Scholar' }
      case 'HOSTELLER':
        return { icon: 'apartment', color: '#9C27B0', label: 'Hosteller' }
      default:
        return { icon: 'school', color: colors.primary, label: type?.replace(/_/g, ' ') || 'Day Scholar' }
    }
  }

  const getGenderIcon = (gender) => {
    switch(gender) {
      case 'MALE':
        return { icon: 'male', color: '#2196F3' }
      case 'FEMALE':
        return { icon: 'female', color: '#E91E63' }
      default:
        return { icon: 'genderless', color: '#757575' }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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
            opacity,
            transform: [{ translateY }]
          }
        ]}
      >
        {moreActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.menuItem}
            onPress={() => handleMoreAction(action)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: `${action.color}15` }]}>
              <MaterialIcons name={action.icon} size={20} color={action.color} />
            </View>
            <ThemedText style={[styles.menuItemText, { color: colors.text, flex: 1 }]}>
              {action.label}
            </ThemedText>
            <Feather name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </Animated.View>
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
                <ThemedText type="subtitle" style={styles.title}>
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
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
            Loading student details...
          </ThemedText>
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
  const displayStudentType = studentData?.studentType || 'DAY_SCHOLAR'
  const displayIsUsingTransport = studentData?.isUsingSchoolTransport || false
  const displayIsUsingHostel = studentData?.isUsingSchoolHostel || false
  
  const studentTypeInfo = getStudentTypeIcon(displayStudentType)
  const genderInfo = getGenderIcon(displayGender)

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
              <ThemedText type="subtitle" style={styles.title}>
                Student Profile
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                All details of student
              </ThemedText>
            </View>
            
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowMoreMenu(!showMoreMenu)}
              activeOpacity={0.9}
            >
              <Entypo name="dots-three-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
        <View style={styles.contentContainer}>
          {/* Profile Card with same background as header */}
          <LinearGradient
            colors={[colors?.gradientStart, colors?.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.profileContent}>
              {renderAvatar()}
              
              <View style={styles.profileInfo}>
                <ThemedText style={styles.profileName}>
                  {displayName}
                </ThemedText>
                
                <View style={styles.profileBadges}>
                  <View style={styles.classBadge}>
                    <Ionicons name="school-outline" size={14} color="#FFFFFF" />
                    <ThemedText style={styles.badgeText}>
                      {displayClass} - {displaySection}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.rollBadge}>
                    <Ionicons name="id-card-outline" size={14} color="#FFFFFF" />
                    <ThemedText style={styles.badgeText}>
                      Roll: {displayRollNo || 'N/A'}
                    </ThemedText>
                  </View>
                </View>

                {/* Student Type Tags */}
                <View style={styles.tagsContainer}>
                  <View style={[styles.typeTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialIcons name={studentTypeInfo.icon} size={14} color="#FFFFFF" />
                    <ThemedText style={styles.tagText}>{studentTypeInfo.label}</ThemedText>
                  </View>
                  
                  {displayIsUsingTransport && (
                    <View style={[styles.typeTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Ionicons name="bus-outline" size={12} color="#FFFFFF" />
                      <ThemedText style={styles.tagText}>Transport</ThemedText>
                    </View>
                  )}
                  
                  {displayIsUsingHostel && (
                    <View style={[styles.typeTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Ionicons name="bed-outline" size={12} color="#FFFFFF" />
                      <ThemedText style={styles.tagText}>Hostel</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Student Details Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <ThemedText style={[styles  .sectionTitle, { color: colors.text }]}>
                  Student Details
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              {/* Gender */}
              <View style={styles.detailItem}>
                <View style={[styles.detailIconContainer, { backgroundColor: `${genderInfo.color}15` }]}>
                  <Ionicons name={genderInfo.icon} size={20} color={genderInfo.color} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Gender
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                    {displayGender?.charAt(0) + displayGender?.slice(1).toLowerCase() || 'N/A'}
                  </ThemedText>
                </View>
              </View>

              {/* Date of Birth */}
              <View style={styles.detailItem}>
                <View style={[styles.detailIconContainer, { backgroundColor: '#FF6B6B15' }]}>
                  <MaterialCommunityIcons name="cake-variant" size={20} color="#FF6B6B" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Date of Birth
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(displayDob)}
                  </ThemedText>
                </View>
              </View>

              {/* Admission No */}
              <View style={styles.detailItem}>
                <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="id-card-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Admission No
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                    {displayAdmissionNo || 'N/A'}
                  </ThemedText>
                </View>
              </View>

              {/* Village */}
              {displayVillage && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIconContainer, { backgroundColor: '#4CAF5015' }]}>
                    <Ionicons name="location-outline" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.detailContent}>
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Village
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                      {displayVillage}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Address */}
              {displayAddress && (
                <View style={[styles.detailItem, styles.fullWidth]}>
                  <View style={[styles.detailIconContainer, { backgroundColor: '#FF980015' }]}>
                    <Ionicons name="home-outline" size={20} color="#FF9800" />
                  </View>
                  <View style={styles.detailContent}>
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Address
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                      {displayAddress}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Parent Details Section */}
          {(displayParent || displayContact || displayContact2 || displayEmail) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="people" size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Parent Information
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                {/* Parent Name */}
                {displayParent && (
                  <View style={[styles.detailItem, styles.fullWidth]}>
                    <View style={[styles.detailIconContainer, { backgroundColor: '#9C27B015' }]}>
                      <Ionicons name="person-outline" size={20} color="#9C27B0" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Parent Name
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                        {displayParent}
                      </ThemedText>
                    </View>
                  </View>
                )}
                
                {/* Primary Contact */}
                {displayContact && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIconContainer, { backgroundColor: '#2196F315' }]}>
                      <Feather name="phone" size={20} color="#2196F3" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Primary Contact
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                        {displayContact}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Secondary Contact */}
                {displayContact2 && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIconContainer, { backgroundColor: '#4CAF5015' }]}>
                      <Feather name="phone" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Secondary Contact
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                        {displayContact2}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Email */}
                {displayEmail && (
                  <View style={[styles.detailItem, styles.fullWidth]}>
                    <View style={[styles.detailIconContainer, { backgroundColor: '#FF980015' }]}>
                      <Ionicons name="mail-outline" size={20} color="#FF9800" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Email
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                        {displayEmail}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMoreMenu(false)}
            activeOpacity={1}
          />
          {renderMoreMenu()}
        </>
      )}

      {/* Edit Modal */}
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

      {/* Fee Details Modal */}
      <StudentFeeDetails
        visible={showFeeDetails}
        onClose={() => setShowFeeDetails(false)}
        student={studentData || student}
        onPaymentSuccess={(result) => {
          showToast('Payment completed successfully', 'success')
          // Refresh student data to update fee details
          fetchStudentData()
        }}
      />

      {showAttendanceModal && (
        <StudentAttendance
          visible={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          student={studentData || student}
        />
      )}

      {showMarksModal && (
        <StudentMarks
          visible={showMarksModal}
          onClose={() => setShowMarksModal(false)}
          student={studentData || student}
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
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  studentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  rollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '48%',
  },
  fullWidth: {
    width: '100%',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  moreMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100, 
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 9999,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
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
    fontWeight: '500',
  },
})