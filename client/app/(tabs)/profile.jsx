import { 
  View, 
  StyleSheet, 
  ScrollView, 
  StatusBar,
  Image,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width } = Dimensions.get('window')

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

// Helper function to get gender icon and color
const getGenderInfo = (gender) => {
  switch(gender) {
    case 'MALE':
      return { icon: 'male', color: '#3b82f6', bgColor: '#3b82f610' }
    case 'FEMALE':
      return { icon: 'female', color: '#ec4899', bgColor: '#ec489910' }
    default:
      return { icon: 'person-outline', color: '#757575', bgColor: '#75757510' }
  }
}

export default function Profile() {
  const { colors } = useTheme()
  
  const { employee } = useSelector((state) => state.employee)
  
  const [loading, setLoading] = useState(true)
  const [employeeData, setEmployeeData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)
  
  // Animations
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
    if (!employee?.id) {
      setLoading(false)
      return
    }

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
        showToast(response.data.message || 'Failed to load profile data', 'error')
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      let errorMessage = 'Failed to load profile data'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load profile data'
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
    fetchEmployeeData()
  }, [])

  const renderAvatar = () => {
    const firstName = employeeData?.firstName || employee?.firstName || ''
    const lastName = employeeData?.lastName || employee?.lastName || ''
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
    const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'U'
    
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard]}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const firstName = employeeData?.firstName || employee?.firstName || ''
  const lastName = employeeData?.lastName || employee?.lastName || ''
  const displayName = `${firstName} ${lastName}`.trim() || 'User'
  const displayEmail = employeeData?.email || employee?.email
  const displayPhone = employeeData?.phone || employee?.phone
  const displayDesignation = employeeData?.designation || employee?.designation
  const displayDesignationDisplay = getDesignationDisplay(displayDesignation)
  const displayGender = employeeData?.gender || employee?.gender || 'NOT_SPECIFIED'
  const genderInfo = getGenderInfo(displayGender)
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    
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
          {/* Profile Card - Simplified like students page */}
          <View style={[styles.profileCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            shadowColor: colors.shadow || '#00000040'
          }]}>
            <View style={styles.profileContent}>
              {renderAvatar()}
              
              <View style={styles.profileInfo}>
                <ThemedText type='subtitle' style={[styles.profileName, { color: colors?.text }]}>
                  {displayName}
                </ThemedText>
                
                <View style={styles.designationContainer}>
                  <View style={[styles.designationBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
                    <ThemedText style={[styles.designationText, { color: colors.primary }]}>
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
                  genderInfo.icon,
                  Ionicons,
                  'Gender',
                  displayGender?.charAt(0) + displayGender?.slice(1).toLowerCase(),
                  genderInfo.color,
                  genderInfo.bgColor
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
  container: {
    flex: 1,
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
    borderWidth: 2,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  designationText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
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
})