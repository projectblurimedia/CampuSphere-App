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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome6, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { schoolDetails } from '@/schoolDetails'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { logoutEmployee } from '@/redux/employeeSlice'
import CreateEmployee from '@/pages/menu/createEmployee/CreateEmployee'
import BulkImportEmployees from '@/pages/menu/bulkImportEmployees/BulkImportEmployees'
import BirthdayEmployees from '@/pages/menu/birthdays/BirthdayEmployees'

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

export default function EmployeeMenu({ visible, onClose }) {
  const { theme, colors, changeTheme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  
  const [showCreateEmployee, setShowCreateEmployee] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  const [showBirthdays, setShowBirthdays] = useState(false)
  const [toast, setToast] = useState(null)
  const [themeModalVisible, setThemeModalVisible] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [childModalOpen, setChildModalOpen] = useState(false)
  
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  
  // Theme modal animations
  const modalScale = useRef(new Animated.Value(0.8)).current
  const modalOpacity = useRef(new Animated.Value(0)).current

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  
  useEffect(() => {
    if (visible && !childModalOpen) {
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
    } else if (!visible && !childModalOpen) {
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
  }, [visible, childModalOpen])

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

  const handleThemeSelect = (themeId) => {
    changeTheme(themeId)
    setTimeout(() => setThemeModalVisible(false), 300)
  }

  // Handle menu item press
  const handleMenuItemPress = (item) => {
    setChildModalOpen(true)
    
    // Close the side menu with animation
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
      onClose()
    })
    
    setTimeout(() => {
      switch(item.id) {
        case 1:
          setShowCreateEmployee(true)
          break
        case 2:
          setShowBulkCreate(true)
          break
        case 3:
          setShowBirthdays(true)
          break
        default:
          console.log('Unknown menu item')
      }
    }, 300)
  }

  // Handle child modal close
  const handleChildModalClose = (modalSetter) => {
    modalSetter(false)
    setChildModalOpen(false)
  }

  const menuItems = [
    { 
      id: 1, 
      title: 'Create Employee', 
      icon: 'person-add', 
      iconType: 'Ionicons', 
      gradient: ['#10b981', '#059669'], 
    },
    { 
      id: 2, 
      title: 'Bulk Create Employee', 
      icon: 'people', 
      iconType: 'Ionicons', 
      gradient: ['#3b82f6', '#2563eb'], 
    },
    { 
      id: 3,
      title: 'Birthdays', 
      icon: 'cake-candles', 
      iconType: 'FontAwesome6', 
      gradient: ['#ec4899', '#d946ef'], 
    },
  ]

  const sections = [
    {
      title: 'Employee Management',
      data: menuItems.filter(item => [1,2].includes(item.id)),
    },
    {
      title: 'Events',
      data: menuItems.filter(item => [3].includes(item.id)),
    },
    {
      title: 'App Settings',
      data: [
        { 
          id: 4, 
          title: 'App Theme', 
          icon: 'palette', 
          iconType: 'FontAwesome6', 
          gradient: [colors.gradientStart || '#5053ee', colors.gradientEnd || '#7346e5'], 
          value: getThemeLabel(),
          onPress: () => setThemeModalVisible(true)
        },
      ],
    },
    {
      title: 'Account',
      data: [
        { 
          id: 5, 
          title: 'Logout', 
          icon: 'log-out', 
          iconType: 'Feather', 
          gradient: ['#ef4444', '#dc2626'], 
          isLogout: true,
          onPress: handleLogout
        },
      ],
    },
  ]

  const getIcon = (type, name, size, color) => {
    const icons = {
      Ionicons: Ionicons,
      FontAwesome6: FontAwesome6,
      Feather: Feather,
    }
    const Icon = icons[type] || Ionicons
    return <Icon name={name} size={size} color={color} />
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
                  <Ionicons name="school" size={28} color="#FFFFFF" />
                  <View style={styles.headerText}>
                    <ThemedText style={styles.schoolName} numberOfLines={1}>
                      {schoolDetails?.name || 'School'}
                    </ThemedText>
                    <ThemedText style={styles.menuTitle}>
                      Employee Menu
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
            >
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
                    {section.title}
                  </ThemedText>
                  <View style={styles.items}>
                    {section.data.map((item) => (
                      item.isLogout ? (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          key={item.id}
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
                      ) : (
                        <TouchableOpacity
                          activeOpacity={.9} 
                          key={item.id}
                          style={[styles.item, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                          onPress={() => item.onPress ? item.onPress() : handleMenuItemPress(item)}
                        >
                          <View style={styles.itemContent}>
                            <LinearGradient colors={item.gradient} style={styles.icon}>
                              {getIcon(item.iconType, item.icon, 18, '#FFFFFF')}
                            </LinearGradient>
                            <View style={styles.itemText}>
                              <ThemedText type='subtitle' style={[styles.itemTitle, { color: colors.text }]}>
                                {item.title}
                              </ThemedText>
                              {item.value && (
                                <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                                  {item.value}
                                </ThemedText>
                              )}
                              {!item.value && (
                                <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                                  Tap to continue
                                </ThemedText>
                              )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                          </View>
                        </TouchableOpacity>
                      )
                    ))}
                  </View>
                </View>
              ))}

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

      {/* Theme Selection Modal */}
      <ThemeSelectionModal />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal />

      {/* Individual Feature Modals */}
      <CreateEmployee 
        visible={showCreateEmployee} 
        onClose={() => handleChildModalClose(setShowCreateEmployee)} 
      />

      <BulkImportEmployees 
        visible={showBulkCreate} 
        onClose={() => handleChildModalClose(setShowBulkCreate)} 
      />

      <BirthdayEmployees 
        visible={showBirthdays} 
        onClose={() => handleChildModalClose(setShowBirthdays)} 
      />

      {/* Toast Notification */}
      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={() => setToast(null)}
        position="bottom-center"
        duration={3000}
        showCloseButton={true}
      />
    </>
  )
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  backdropTouchable: StyleSheet.absoluteFillObject,
  backdrop: StyleSheet.absoluteFillObject,
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
      android: { elevation: 20 },
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
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  menuTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  section: { marginTop: 15 },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 6,
  },
  items: { paddingHorizontal: 15 },
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
      android: { elevation: 1 },
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
    marginBottom: -5,
  },
  itemValue: {
    fontSize: 12,
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
    paddingTop: 15,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 11,
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
  // Theme Modal Styles
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