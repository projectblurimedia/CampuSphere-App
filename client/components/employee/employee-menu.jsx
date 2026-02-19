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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome6 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import CreateEmployee from '@/pages/menu/createEmployee/CreateEmployee'
import BulkImportEmployees from '@/pages/menu/bulkImportEmployees/BulkImportEmployees'
import BirthdayEmployees from '@/pages/menu/birthdays/BirthdayEmployees'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function EmployeeMenu({ visible, onClose }) {
  const { colors } = useTheme()
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const [isVisible, setIsVisible] = useState(visible)
  
  // State for individual modals
  const [showCreateEmployee, setShowCreateEmployee] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  const [showBirthdays, setShowBirthdays] = useState(false)

  // Track if any child modal is open
  const [childModalOpen, setChildModalOpen] = useState(false)

  // Handle visibility changes and animation
  useEffect(() => {
    if (visible && !childModalOpen) {
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
    } else if (!visible && !childModalOpen) {
      closeMenu()
    }
  }, [visible, childModalOpen])

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

  // Handle menu item press
  const handleMenuItemPress = (item) => {
    // Set child modal open flag to prevent menu from reopening
    setChildModalOpen(true)
    
    // Close the side menu immediately
    setIsVisible(false)
    onClose()
    
    // Small delay to ensure menu is closed before opening modal
    setTimeout(() => {
      // Open the respective modal based on item id
      switch(item.id) {
        case 1: // Create Employee
          setShowCreateEmployee(true)
          break
        case 2: // Bulk Create Employee
          setShowBulkCreate(true)
          break
        case 3: // Birthdays
          setShowBirthdays(true)
          break
        default:
          console.log('Unknown menu item')
      }
    }, 300) // Wait for menu close animation
  }

  // Handle child modal close
  const handleChildModalClose = (modalSetter) => {
    modalSetter(false)
    setChildModalOpen(false)
    // Don't reopen the menu automatically
  }

  // Menu items with the 3 requested options
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
  ]

  const getIcon = (type, name, size, color) => {
    const icons = {
      Ionicons: Ionicons,
      FontAwesome6: FontAwesome6,
    }
    const Icon = icons[type] || Ionicons
    return <Icon name={name} size={size} color={color} />
  }

  // Don't render anything if not visible and no child modal open
  if (!isVisible && !visible && !childModalOpen) {
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
                  <Ionicons name="school" size={28} color="#FFFFFF" />
                  <View style={styles.headerText}>
                    <ThemedText style={styles.schoolName}>
                      Bluri High School
                    </ThemedText>
                    <ThemedText style={styles.menuTitle}>
                      Employee Menu
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
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    {section.title}
                  </ThemedText>
                  <View style={styles.items}>
                    {section.data.map((item) => (
                      <TouchableOpacity
                        activeOpacity={0.7} 
                        key={item.id}
                        style={[styles.item, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                        onPress={() => handleMenuItemPress(item)}
                      >
                        <View style={styles.itemContent}>
                          <LinearGradient colors={item.gradient} style={styles.icon}>
                            {getIcon(item.iconType, item.icon, 18, '#FFFFFF')}
                          </LinearGradient>
                          <View style={styles.itemText}>
                            <ThemedText style={[styles.itemTitle, { color: colors.text }]}>
                              {item.title}
                            </ThemedText>
                            <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                              Tap to continue
                            </ThemedText>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                        </View>
                      </TouchableOpacity>
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
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  schoolName: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Poppins-Bold',
  },
  menuTitle: {
    fontSize: 12,
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
  section: { 
    marginTop: 20 
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 10,
    fontFamily: 'Poppins-SemiBold',
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
  },
  itemValue: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
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
})