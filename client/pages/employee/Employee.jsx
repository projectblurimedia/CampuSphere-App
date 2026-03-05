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
  Dimensions,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather, MaterialIcons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState, useRef, useEffect, useCallback } from 'react'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import CreateEmployee from '@/pages/menu/createEmployee/CreateEmployee'

const { width, height } = Dimensions.get('window')

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper function to calculate age
const calculateAge = (dob) => {
  if (!dob) return 'N/A'
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Helper function to get designation display name
const getDesignationDisplay = (designation) => {
  const designationMap = {
    'Chairperson': 'Chairperson',
    'Principal': 'Principal',
    'Vice_Principal': 'Vice Principal',
    'Accountant': 'Accountant',
    'Teacher': 'Teacher',
    'Other': 'Other'
  }
  return designationMap[designation] || designation
}

export default function Employee({ employee, onClose }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [employeeData, setEmployeeData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // UI state
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
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

  // Fetch complete employee data
  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get(`/employees/${employee.id}`)
      
      if (response.data.success) {
        const data = response.data.data
        setEmployeeData(data)
        
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
        showToast(response.data.message || 'Failed to load employee data', 'error')
      }
    } catch (error) {
      console.error('Error fetching employee data:', error)
      let errorMessage = 'Failed to load employee data'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load employee data'
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
    fetchEmployeeData()
  }

  useEffect(() => {
    if (employee?.id) {
      fetchEmployeeData()
    }
  }, [employee?.id])

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
    // Small delay to ensure menu closes before opening edit modal
    setTimeout(() => {
      setShowEditModal(true)
    }, 200)
  }

  const handleDelete = () => {
    setShowMoreMenu(false)
    // Open custom delete confirmation modal
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setDeleteLoading(true)
    try {
      const response = await axiosApi.delete(`/employees/${employee.id}`)
      if (response.data.success) {
        setShowDeleteModal(false)
        showToast('Employee deleted successfully', 'success')
        setTimeout(() => {
          onClose(true) // Pass true to indicate deletion
        }, 1500)
      } else {
        showToast(response.data.message || 'Failed to delete employee', 'error')
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      showToast('Failed to delete employee', 'error')
      setShowDeleteModal(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle edit modal close
  const handleEditModalClose = (refresh = false) => {
    setShowEditModal(false)
    if (refresh) {
      fetchEmployeeData()
    }
  }

  const moreActions = [
    { id: 1, icon: 'edit', iconSet: MaterialIcons, label: 'Edit Employee', color: colors.primary, action: 'edit', handler: handleEdit },
    { id: 2, icon: 'delete', iconSet: MaterialIcons, label: 'Delete Employee', color: '#F44336', action: 'delete', handler: handleDelete },
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
    const firstName = employeeData?.firstName || employee?.firstName || ''
    const lastName = employeeData?.lastName || employee?.lastName || ''
    const name = `${firstName} ${lastName}`.trim() || 'E'
    const profilePic = employeeData?.profilePicUrl || employee?.profilePicUrl
    
    if (profilePic) {
      return (
        <Image source={{ uri: profilePic }} style={styles.employeeAvatar} />
      )
    }
    
    // Generate consistent gradient based on name
    const gradients = [
      ['#4158D0', '#C850C0'],
      ['#FF512F', '#F09819'],
      ['#11998e', '#38ef7d'],
      ['#834d9b', '#d04ed6'],
      ['#4776E6', '#8E54E9'],
      ['#FF416C', '#FF4B2B'],
    ]
    
    const gradientIndex = (firstName.charCodeAt(0) || 65) % gradients.length
    const gradient = gradients[gradientIndex]
    
    // Get initials
    const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'E'
    
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.employeeAvatar}
      >
        <ThemedText style={styles.avatarText}>
          {initials}
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
                onPress={() => onClose()}
                activeOpacity={0.9}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.headerTitle}>
                <ThemedText type='subtitle' style={styles.title}>
                  Employee Profile
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  All details of employee
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
              Loading employee details...
            </ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const firstName = employeeData?.firstName || employee?.firstName || ''
  const lastName = employeeData?.lastName || employee?.lastName || ''
  const displayName = `${firstName} ${lastName}`.trim()
  const displayEmail = employeeData?.email || employee?.email
  const displayPhone = employeeData?.phone || employee?.phone
  const displayDesignation = employeeData?.designation || employee?.designation
  const displayDesignationDisplay = getDesignationDisplay(displayDesignation)
  const displayGender = employeeData?.gender || employee?.gender || 'NOT_SPECIFIED'
  const displayDob = employeeData?.dob || employee?.dob
  const displayAge = calculateAge(displayDob)
  const displayAddress = employeeData?.address || employee?.address
  const displayVillage = employeeData?.village || employee?.village
  const displayJoiningDate = employeeData?.joiningDate || employee?.joiningDate
  const displayQualification = employeeData?.qualification || employee?.qualification
  const displayAadharNumber = employeeData?.aadharNumber || employee?.aadharNumber
  const displayPanNumber = employeeData?.panNumber || employee?.panNumber
  const displayIsActive = employeeData?.isActive !== undefined ? employeeData?.isActive : employee?.isActive

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
              onPress={() => onClose()}
              activeOpacity={0.9}
            >
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <ThemedText type='subtitle' style={styles.title}>
                Employee Profile
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                All details of employee
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
                
                <View style={styles.designationContainer}>
                  <View style={[styles.designationBadge, { backgroundColor: colors?.inputBackground }]}>
                    <Ionicons name="briefcase-outline" size={14} color={colors?.textSecondary} />
                    <ThemedText style={[styles.designationText, { color: colors?.textSecondary }]}>
                      {displayDesignationDisplay}
                    </ThemedText>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: displayIsActive ? '#10b98120' : '#ef444420' }]}>
                    <View style={[styles.statusDot, { backgroundColor: displayIsActive ? '#10b981' : '#ef4444' }]} />
                    <ThemedText style={[styles.statusText, { color: displayIsActive ? '#10b981' : '#ef4444' }]}>
                      {displayIsActive ? 'Active' : 'Inactive'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Personal Details Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#9C27B010' }]}>
                  <Ionicons name="person" size={18} color="#9C27B0" />
                </View>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Personal Details
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.rowContainer}>
                {renderDetailCard(
                  displayGender === 'MALE' ? 'male' : displayGender === 'FEMALE' ? 'female' : 'genderless',
                  Ionicons,
                  'Gender',
                  displayGender?.charAt(0) + displayGender?.slice(1).toLowerCase(),
                  displayGender === 'MALE' ? '#2196F3' : displayGender === 'FEMALE' ? '#E91E63' : '#757575',
                  displayGender === 'MALE' ? '#2196F310' : displayGender === 'FEMALE' ? '#E91E6310' : '#75757510'
                )}

                {renderDetailCard(
                  'cake-variant',
                  MaterialCommunityIcons,
                  'Age',
                  displayAge !== 'N/A' ? `${displayAge} years` : 'N/A',
                  '#FF6B6B',
                  '#FF6B6B10'
                )}
              </View>

              <View style={styles.rowContainer}>
                {renderDetailCard(
                  'cake-variant',
                  MaterialCommunityIcons,
                  'Date of Birth',
                  formatDate(displayDob),
                  '#FF9800',
                  '#FF980010'
                )}

                {renderDetailCard(
                  'calendar',
                  Ionicons,
                  'Joining Date',
                  formatDate(displayJoiningDate),
                  '#4CAF50',
                  '#4CAF5010'
                )}
              </View>

              {displayQualification && renderDetailCard(
                'school-outline',
                Ionicons,
                'Qualification',
                displayQualification,
                '#00BCD4',
                '#00BCD410',
                true
              )}
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}10` }]}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                </View>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Contact Information
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              {renderDetailCard(
                'call-outline',
                Ionicons,
                'Phone',
                displayPhone,
                '#2196F3',
                '#2196F310'
              )}

              {renderDetailCard(
                'mail-outline',
                Ionicons,
                'Email',
                displayEmail,
                '#FF9800',
                '#FF980010'
              )}

              {displayVillage && renderDetailCard(
                'location-outline',
                Ionicons,
                'Village/Town',
                displayVillage,
                '#4CAF50',
                '#4CAF5010'
              )}

              {displayAddress && renderDetailCard(
                'home-outline',
                Ionicons,
                'Address',
                displayAddress,
                '#9C27B0',
                '#9C27B010',
                true
              )}
            </View>
          </View>

          {/* Identity Documents Section */}
          {(displayAadharNumber || displayPanNumber) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: '#FF980010' }]}>
                    <MaterialCommunityIcons name="card-account-details" size={18} color="#FF9800" />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Identity Documents
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                {displayAadharNumber && renderDetailCard(
                  'card-account-details',
                  MaterialCommunityIcons,
                  'Aadhar Number',
                  displayAadharNumber,
                  '#2196F3',
                  '#2196F310'
                )}

                {displayPanNumber && renderDetailCard(
                  'card-account-details',
                  MaterialCommunityIcons,
                  'PAN Number',
                  displayPanNumber,
                  '#9C27B0',
                  '#9C27B010'
                )}
              </View>
            </View>
          )}
        </Animated.View>
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

      {/* Edit Employee Modal */}
      <CreateEmployee
        key={employeeData?.id || employee?.id}
        visible={showEditModal}
        onClose={handleEditModalClose}
        employeeData={employeeData || employee}
        isEditMode={true}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalIcon, { backgroundColor: '#F4433620' }]}>
              <MaterialIcons name="delete" size={40} color="#F44336" />
            </View>
            
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Delete Employee
            </ThemedText>
            
            <ThemedText style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete {displayName}? This action cannot be undone.
            </ThemedText>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.border }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete, deleteLoading && { opacity: 0.5 }]}
                onPress={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.modalButtonTextDelete}>
                    Delete
                  </ThemedText>
                )}
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
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Poppins-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 106,
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
  employeeAvatar: {
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
    fontFamily: 'Poppins-Bold',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    fontFamily: 'Poppins-SemiBold',
  },
  designationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  designationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  designationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Medium',
  },
  detailCardValue: {
    fontSize: 14,
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
    width: 220,
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
    fontFamily: 'Poppins-Medium',
  },
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
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
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 24,
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
    borderRadius: 12,
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
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  modalButtonTextDelete: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
})