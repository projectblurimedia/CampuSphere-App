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
import { Ionicons, Feather, FontAwesome6 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'expo-router'
import { logoutEmployee } from '@/redux/employeeSlice'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const themeOptions = [
  { 
    id: 'system', 
    label: 'System Default', 
    icon: 'settings',
    gradient: ['#667eea', '#764ba2']
  },
  { 
    id: 'light', 
    label: 'Light Mode', 
    icon: 'sun',
    gradient: ['#fbbf24', '#f59e0b']
  },
  { 
    id: 'dark', 
    label: 'Dark Mode', 
    icon: 'moon',
    gradient: ['#4f46e5', '#7c3aed']
  },
]

export default function ProfileMenu({ visible, onClose }) {
  const { theme, colors, changeTheme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()

  const { employee } = useSelector((state) => state.employee)
  
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const [themeModalVisible, setThemeModalVisible] = useState(false)
  
  // Theme modal animations
  const modalScale = useRef(new Animated.Value(0.8)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  
  // State for logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)

  // Handle main menu animations when visibility changes
  useEffect(() => {
    if (visible) {
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
      ]).start()
      // Close modals when main menu closes
      setTimeout(() => {
        setThemeModalVisible(false)
        setShowLogoutModal(false)
      }, 200)
    }
  }, [visible])

  // Handle theme modal animations
  useEffect(() => {
    if (themeModalVisible) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 0.8,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [themeModalVisible])

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  // Hide toast notification
  const hideToast = () => {
    setToast(null)
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    setLogoutLoading(true)
    try {
      await dispatch(logoutEmployee())
      setShowLogoutModal(false)
      showToast('Logged out successfully', 'success')
      setTimeout(() => {
        onClose()
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

  const getThemeLabel = () => {
    switch (theme) {
      case 'system': return 'System Default'
      case 'light': return 'Light Mode'
      case 'dark': return 'Dark Mode'
      default: return 'System Default'
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

  const handleThemeSelect = (themeId) => {
    changeTheme(themeId)
    setTimeout(() => setThemeModalVisible(false), 300)
  }

  // Theme Selection Modal Component
  const ThemeSelectionModal = () => {
    return (
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setThemeModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.themeOverlay}>
          <TouchableOpacity 
            style={styles.themeBackdrop}
            activeOpacity={1}
            onPress={() => setThemeModalVisible(false)}
          >
            <Animated.View 
              style={[
                styles.themeBackdropAnimated,
                { opacity: modalOpacity }
              ]}
            />
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              styles.themeModalContainer,
              { 
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <View style={[
              styles.themeModalContent,
              { backgroundColor: colors.cardBackground }
            ]}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.themeHeaderGradient}
              >
                <View style={styles.themeHeaderContent}>
                  <View style={styles.themeIconContainer}>
                    <FontAwesome6 name="palette" size={28} color="#FFFFFF" />
                  </View>
                  <ThemedText type='subtitle' style={styles.themeHeaderTitle}>
                    Choose Theme
                  </ThemedText>
                  <ThemedText style={styles.themeHeaderSubtitle}>
                    Select your preferred app theme
                  </ThemedText>
                </View>
              </LinearGradient>

              <View style={styles.themeOptionsContainer}>
                {themeOptions.map((option) => {
                  const isSelected = theme === option.id
                  
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.themeOption,
                        { 
                          backgroundColor: colors.cardBackground,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? colors.tint : colors.border,
                        }
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleThemeSelect(option.id)}
                    >
                      <LinearGradient
                        colors={option.gradient}
                        style={styles.themeOptionIcon}
                      >
                        <Feather name={option.icon} size={24} color="#FFFFFF" />
                      </LinearGradient>
                      
                      <View style={styles.themeOptionText}>
                        <ThemedText 
                          style={[
                            styles.themeOptionLabel,
                            { color: isSelected ? colors.tint : colors.text }
                          ]}
                        >
                          {option.label}
                        </ThemedText>
                      </View>
                      
                      {isSelected && (
                        <View style={[styles.themeSelected, { backgroundColor: colors.tint }]}>
                          <Feather name="check" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>

              <TouchableOpacity
                style={[styles.themeCloseBtn, { borderTopColor: colors.border }]}
                onPress={() => setThemeModalVisible(false)}
              >
                <ThemedText style={[styles.themeCloseText, { color: colors.textSecondary }]}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    )
  }

  // Logout Confirmation Modal Component
  const LogoutConfirmationModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmationModal, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.confirmationHeader}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.confirmationIcon}
            >
              <Feather name="log-out" size={28} color="#FFFFFF" />
            </LinearGradient>
            <ThemedText type="subtitle" style={[styles.confirmationTitle, { color: colors.text }]}>
              Confirm Logout
            </ThemedText>
            <ThemedText style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
              Are you sure you want to logout from your account?
            </ThemedText>
          </View>
          
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              onPress={() => setShowLogoutModal(false)}
              disabled={logoutLoading}
            >
              <ThemedText style={[styles.cancelBtnText, { color: colors.text }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirmLogout}
              disabled={logoutLoading}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.confirmBtnGradient}
              >
                {logoutLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="log-out" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.confirmBtnText}>
                      Logout
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <>
      {/* Side Menu Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={onClose}
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
                    <ThemedText style={styles.employeeName} numberOfLines={1}>
                      {getDisplayName()}
                    </ThemedText>
                    <ThemedText style={styles.employeeDesignation}>
                      {getDesignation()}
                    </ThemedText>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
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

              {/* App Settings Section */}
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  APP SETTINGS
                </ThemedText>
                <View style={styles.items}>
                  {/* Theme Option */}
                  <TouchableOpacity
                    activeOpacity={0.7} 
                    style={[styles.item, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={() => setThemeModalVisible(true)}
                  >
                    <View style={styles.itemContent}>
                      <View style={[styles.icon, { backgroundColor: colors.primary + '20' }]}>
                        <FontAwesome6 name="palette" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.itemText}>
                        <ThemedText style={[styles.itemTitle, { color: colors.text }]}>
                          App Theme
                        </ThemedText>
                        <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                          {getThemeLabel()}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Account Section */}
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  ACCOUNT
                </ThemedText>
                <View style={styles.items}>
                  {/* Logout Button */}
                  <TouchableOpacity
                    activeOpacity={.7}
                    onPress={handleLogout}
                  >
                    <LinearGradient 
                      colors={['#ef4444', '#dc2626']} 
                      style={styles.logoutGradient}
                    >
                      <Feather name="log-out" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.logoutText}>Logout</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                  Bluri Developers v2.4.1
                </ThemedText>
                <ThemedText style={[styles.footerCopyright, { color: colors.textSecondary }]}>
                  © 2026 All rights reserved
                </ThemedText>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <ThemeSelectionModal />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal />

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
  employeeName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  employeeDesignation: {
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
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
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
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Theme Modal Styles (matching your ThemeModal component)
  themeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  themeBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  themeBackdropAnimated: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  themeModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  themeModalContent: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  themeHeaderGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  themeHeaderContent: {
    alignItems: 'center',
  },
  themeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  themeHeaderTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  themeHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  themeOptionsContainer: {
    padding: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  themeOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  themeCloseBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  themeCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Logout Confirmation Modal Styles
  confirmationModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  confirmationHeader: {
    alignItems: 'center',
    padding: 30,
    paddingBottom: 20,
  },
  confirmationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmationMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
})