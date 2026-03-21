import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  Image,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, MaterialIcons, Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import StudentFeeDetails from '../feeDetails/StudentFeeDetails'

const { width, height } = Dimensions.get('window')

export default function StudentInactiveDetails({ visible, onClose, student, onReactivateSuccess }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [studentDetails, setStudentDetails] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  
  // Animations
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0.95)).current

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }

  // Fetch complete student data
  const fetchStudentData = useCallback(async () => {
    if (!student?.id) return
    
    try {
      setLoading(true)
      const response = await axiosApi.get(`/students/${student.id}`)
      
      if (response.data.success) {
        const data = response.data.data
        setStudentDetails(data)
        
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
  }, [student?.id])

  // Refresh data
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStudentData()
  }, [fetchStudentData])

  useEffect(() => {
    if (visible && student?.id) {
      fetchStudentData()
    }
  }, [visible, student?.id, fetchStudentData])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleFeeDetails = () => {
    setShowFeeDetails(true)
  }

  const renderAvatar = () => {
    const name = studentDetails?.name || `${studentDetails?.firstName || ''} ${studentDetails?.lastName || ''}`.trim() || student?.name || 'S'
    const profilePic = studentDetails?.profilePicUrl || student?.profilePicUrl
    
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
      <Modal visible={visible} statusBarTranslucent animationType="fade" onRequestClose={onClose} transparent>
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
                  <ThemedText style={styles.title}>
                    Inactive Student
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    Student details & information
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
      </Modal>
    )
  }

  const displayName = studentDetails?.name || `${studentDetails?.firstName || ''} ${studentDetails?.lastName || ''}`.trim() || student?.name
  const displayClass = studentDetails?.displayClass || student?.class
  const displaySection = studentDetails?.section || student?.section
  const displayRollNo = studentDetails?.rollNo || student?.rollNo
  const displayAdmissionNo = studentDetails?.admissionNo || student?.admissionNo
  const displayDob = studentDetails?.dob || student?.dob
  const displayVillage = studentDetails?.village
  const displayAddress = studentDetails?.address
  const displayParent = studentDetails?.parentName || student?.parentName
  const displayContact = studentDetails?.parentPhone || student?.parentPhone
  const displayContact2 = studentDetails?.parentPhone2
  const displayEmail = studentDetails?.parentEmail
  const displayGender = studentDetails?.gender || student?.gender
  const displayStudentType = studentDetails?.studentType || 'DAY_SCHOLAR'
  const displayIsUsingTransport = studentDetails?.isUsingSchoolTransport || false
  const displayIsUsingHostel = studentDetails?.isUsingSchoolHostel || false

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent statusBarTranslucent>
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
                <ThemedText style={styles.title}>
                  Inactive Student
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Student details & information
                </ThemedText>
              </View>
              
              <View style={{ width: 44 }} />
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
                  <ThemedText style={[styles.profileName, { color: colors?.text }]}>
                    {displayName}
                  </ThemedText>
                  
                  <View style={styles.classSectionContainer}>
                    <View style={[styles.classSectionBadge, { backgroundColor: colors?.inputBackground }]}>
                      <Ionicons name="school-outline" size={14} color={colors?.text} />
                      <ThemedText style={[styles.classSectionText, {color: colors?.textSecondary }]}>
                        {displayClass} - {displaySection}
                      </ThemedText>
                    </View>
                    <View style={[styles.inactiveBadge, { backgroundColor: colors.danger + '20' }]}>
                      <Ionicons name="alert-circle-outline" size={12} color={colors.danger} />
                      <ThemedText style={[styles.inactiveBadgeText, { color: colors.danger }]}>
                        Inactive
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Action - Fee Details Button */}
            <TouchableOpacity 
              style={[styles.feeButton, { backgroundColor: colors.primary }]}
              onPress={handleFeeDetails}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="currency-inr" size={22} color="#FFFFFF" />
              <ThemedText style={styles.feeButtonText}>View Fee Details</ThemedText>
              <Feather name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>

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

            {/* Academic History Section */}
            {studentDetails?.academicHistory?.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <View style={[styles.sectionIconContainer, { backgroundColor: '#9C27B010' }]}>
                      <Ionicons name="school-outline" size={18} color="#9C27B0" />
                    </View>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                      Academic History
                    </ThemedText>
                  </View>
                </View>

                {studentDetails.academicHistory.map((history, index) => (
                  <View key={index} style={[styles.academicItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.academicHeader}>
                      <ThemedText style={[styles.academicYear, { color: colors.text }]}>
                        {history.academicYear}
                      </ThemedText>
                      <ThemedText style={[styles.academicClass, { color: colors.textSecondary }]}>
                        {history.classLabel} - {history.section}
                      </ThemedText>
                    </View>
                    {history.summary && (
                      <View style={styles.academicStats}>
                        <View style={styles.academicStat}>
                          <Ionicons name="trending-up" size={12} color="#4CAF50" />
                          <ThemedText style={[styles.academicStatText, { color: colors.textSecondary }]}>
                            {history.summary.attendancePercentage || 0}%
                          </ThemedText>
                        </View>
                        <View style={styles.academicStat}>
                          <Ionicons name="star" size={12} color="#FF9800" />
                          <ThemedText style={[styles.academicStatText, { color: colors.textSecondary }]}>
                            {history.summary.marksPercentage || 0}%
                          </ThemedText>
                        </View>
                        <View style={styles.academicStat}>
                          <MaterialIcons name="grade" size={12} color="#9C27B0" />
                          <ThemedText style={[styles.academicStatText, { color: colors.textSecondary }]}>
                            {history.summary.overallResult || 'NA'}
                          </ThemedText>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <ToastNotification
          visible={toast.visible}
          type={toast.type}
          message={toast.message}
          duration={3000}
          onHide={hideToast}
          position="bottom-center"
          showCloseButton={true}
        />

        {/* Fee Details Modal */}
        <StudentFeeDetails
          visible={showFeeDetails}
          onClose={() => setShowFeeDetails(false)}
          student={studentDetails || student}
          onPaymentSuccess={(result) => {
            showToast('Payment completed successfully', 'success')
            fetchStudentData()
          }}
        />
      </View>
    </Modal>
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginBottom: -5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Medium',
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  feeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  feeButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
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
    fontFamily: 'Poppins-Medium',
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
  academicItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  academicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  academicYear: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  academicClass: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  academicStats: {
    flexDirection: 'row',
    gap: 16,
  },
  academicStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  academicStatText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
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