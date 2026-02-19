import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'expo-router'
import { logoutEmployee } from '@/redux/employeeSlice'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function ProfileMenu({ visible, onClose }) {
  const { colors } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()

  const { employee } = useSelector((state) => state.employee)
  
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const [isVisible, setIsVisible] = useState(visible)
  
  // State for logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  // Hide toast notification
  const hideToast = () => {
    setToast(null)
  }

  // Handle visibility changes and animation
  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      // Reset position before animating in
      translateX.setValue(SCREEN_WIDTH)
      backdropOpacity.setValue(0)
      
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      closeMenu()
    }
  }, [visible])

  const closeMenu = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: SCREEN_WIDTH,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false)
      onClose()
    })
  }

  const handleLogout = () => {
    // Close the side menu first
    setIsVisible(false)
    onClose()
    
    // Small delay to ensure menu is closed before opening modal
    setTimeout(() => {
      setShowLogoutModal(true)
    }, 300)
  }

  const confirmLogout = async () => {
    setLogoutLoading(true)
    try {
      await dispatch(logoutEmployee())
      setShowLogoutModal(false)
      showToast('Logged out successfully', 'success')
      setTimeout(() => {
        router.replace('/')
      }, 1500)
    } catch (error) {
      console.error('Error logging out:', error)
      showToast('Failed to logout', 'error')
      setShowLogoutModal(false)
    } finally {
      setLogoutLoading(false)
    }
  }

  const getInitials = () => {
    if (!employee) return 'U'
    const first = employee.firstName?.charAt(0) || ''
    const last = employee.lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
  }

  const getDisplayName = () => {
    if (!employee) return 'User'
    const firstName = employee.firstName || ''
    const lastName = employee.lastName || ''
    return `${firstName} ${lastName}`.trim() || 'User'
  }

  const getDesignation = () => {
    if (!employee?.designation) return 'Employee'
    
    const designationMap = {
      'Chairperson': 'Chairperson',
      'Principal': 'Principal',
      'Vice_Principal': 'Vice Principal',
      'Accountant': 'Accountant',
      'Teacher': 'Teacher',
      'Other': 'Other'
    }
    return designationMap[employee.designation] || employee.designation
  }

  const renderAvatar = () => {
    if (employee?.profilePicUrl) {
      return (
        <Image source={{ uri: employee.profilePicUrl }} style={styles.avatar} />
      )
    }
    
    // Generate gradient based on name
    const gradients = [
      ['#4158D0', '#C850C0'],
      ['#FF512F', '#F09819'],
      ['#11998e', '#38ef7d'],
      ['#834d9b', '#d04ed6'],
      ['#4776E6', '#8E54E9'],
      ['#FF416C', '#FF4B2B'],
    ]
    
    const name = employee?.firstName || 'U'
    const gradientIndex = (name.charCodeAt(0) || 65) % gradients.length
    const gradient = gradients[gradientIndex]
    
    return (
      <LinearGradient
        colors={gradient}
        style={styles.avatar}
      >
        <ThemedText style={styles.avatarText}>
          {getInitials()}
        </ThemedText>
      </LinearGradient>
    )
  }

  // Don't render anything if not visible and no modal open
  if (!isVisible && !visible && !showLogoutModal) {
    return null
  }

  return (
    <>
      {/* Side Menu Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={closeMenu}
          >
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: backdropOpacity,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
              ]}
            />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.cardBackground,
                transform: [{ translateX: translateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.header}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatarContainer}>
                    {renderAvatar()}
                  </View>
                  <View style={styles.headerText}>
                    <ThemedText style={styles.schoolName}>
                      {getDisplayName()}
                    </ThemedText>
                    <ThemedText style={styles.menuTitle}>
                      {getDesignation()}
                    </ThemedText>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={closeMenu}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Info Card */}
              <View style={[styles.profileCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.profileRow}>
                  <View style={[styles.profileIconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.profileInfo}>
                    <ThemedText style={[styles.profileLabel, { color: colors.textSecondary }]}>
                      Logged in as
                    </ThemedText>
                    <ThemedText style={[styles.profileName, { color: colors.text }]}>
                      {getDesignation()}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  ACCOUNT
                </ThemedText>
                <View style={styles.items}>
                  {/* Logout Option - Only Item */}
                  <TouchableOpacity
                    activeOpacity={0.7} 
                    style={[styles.item, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={handleLogout}
                  >
                    <View style={styles.itemContent}>
                      <View style={[styles.icon, { backgroundColor: '#F4433620' }]}>
                        <Feather name="log-out" size={20} color="#F44336" />
                      </View>
                      <View style={styles.itemText}>
                        <ThemedText style={[styles.itemTitle, { color: colors.text }]}>
                          Logout
                        </ThemedText>
                        <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                          Sign out from your account
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                  Bluri High School App v2.4.1
                </ThemedText>
                <ThemedText style={[styles.footerCopyright, { color: colors.textSecondary }]}>
                  © 2024 All rights reserved
                </ThemedText>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalIcon, { backgroundColor: '#F4433620' }]}>
              <Feather name="log-out" size={40} color="#F44336" />
            </View>
            
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Confirm Logout
            </ThemedText>
            
            <ThemedText style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to logout from your account?
            </ThemedText>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
                disabled={logoutLoading}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete, logoutLoading && { opacity: 0.5 }]}
                onPress={confirmLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.modalButtonTextDelete}>
                    Logout
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
    </>
  )
}

const styles = StyleSheet.create({
  modalContainer: { 
    flex: 1 
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: -4, height: 0 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 20 
      },
      android: { 
        elevation: 20 
      },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  headerText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  menuTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins-Regular',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 30 
  },
  profileCard: {
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  section: { 
    marginTop: 10 
  },
  sectionTitle: {
    fontSize: 12,
    marginLeft: 20,
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  items: { 
    paddingHorizontal: 15 
  },
  item: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4 
      },
      android: { 
        elevation: 1 
      },
    }),
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  footerCopyright: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    opacity: 0.5,
  },
  // Logout Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.85,
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