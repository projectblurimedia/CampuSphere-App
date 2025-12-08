import React, { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function DashboardMenu({ visible, onClose, colors, dashboardColors }) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content')
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
      StatusBar.setBarStyle('dark-content')
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
    }
  }, [visible])

  // Theme options
  const themeOptions = [
    { id: 'system', label: 'System Default', icon: 'settings' },
    { id: 'light', label: 'Light Mode', icon: 'sun' },
    { id: 'dark', label: 'Dark Mode', icon: 'moon' },
  ]

  // School menu items
  const menuItems = [
    {
      id: 1,
      title: 'School Profile',
      icon: 'school',
      iconType: 'Ionicons',
      gradient: ['#3b82f6', '#2563eb'],
      value: 'Complete school information',
    },
    {
      id: 2,
      title: 'Academic Year',
      icon: 'calendar',
      iconType: 'Ionicons',
      gradient: ['#10b981', '#059669'],
      value: '2024-2025',
    },
    {
      id: 3,
      title: 'Principal',
      icon: 'account-tie',
      iconType: 'MaterialCommunityIcons',
      gradient: ['#8b5cf6', '#7c3aed'],
      value: 'Dr. Ramesh Kumar',
    },
    {
      id: 4,
      title: 'Total Students',
      icon: 'users',
      iconType: 'FontAwesome5',
      gradient: ['#06b6d4', '#0891b2'],
      value: '1,245 Students',
    },
    {
      id: 5,
      title: 'Total Staff',
      icon: 'chalkboard-teacher',
      iconType: 'FontAwesome5',
      gradient: ['#f97316', '#ea580c'],
      value: '68 Teachers',
    },
    {
      id: 6,
      title: 'School Hours',
      icon: 'clock',
      iconType: 'Feather',
      gradient: ['#ec4899', '#db2777'],
      value: '8:00 AM - 3:30 PM',
    },
    {
      id: 7,
      title: 'Contact',
      icon: 'phone',
      iconType: 'Feather',
      gradient: ['#10b981', '#059669'],
      value: '+91 98765 43210',
    },
    {
      id: 8,
      title: 'Address',
      icon: 'map-pin',
      iconType: 'Feather',
      gradient: ['#f59e0b', '#d97706'],
      value: 'Kannapuram, Kerala',
    },
  ]

  const getIconComponent = (iconType, iconName, size, color) => {
    switch (iconType) {
      case 'Ionicons':
        return <Ionicons name={iconName} size={size} color={color} />
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={size} color={color} />
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />
      case 'Feather':
        return <Feather name={iconName} size={size} color={color} />
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} size={size} color={color} />
      default:
        return <Ionicons name={iconName} size={size} color={color} />
    }
  }

  const handleThemeChange = (theme) => {
    console.log(`Theme changed to: ${theme}`)
    // You would update your theme context/store here
    onClose()
  }

  const handleLogout = () => {
    onClose()
    console.log('Logout pressed')
    // Add your logout logic here
  }

  const handleMenuItemPress = (item) => {
    console.log(`${item.title} pressed: ${item.value}`)
    onClose()
  }

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: colors?.cardBackground || '#FFFFFF' }]}
      activeOpacity={0.7}
      onPress={() => handleMenuItemPress(item)}
    >
      <View style={styles.menuItemContent}>
        <LinearGradient
          colors={item.gradient}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {getIconComponent(item.iconType, item.icon, 18, '#FFFFFF')}
        </LinearGradient>
        
        <View style={styles.menuTextContainer}>
          <ThemedText 
            type='subtitle'
            style={[styles.menuItemTitle, { color: colors?.text || '#11181C' }]}
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>
          <ThemedText 
            style={[styles.menuItemValue, { color: colors?.textSecondary || '#687076' }]}
            numberOfLines={1}
          >
            {item.value}
          </ThemedText>
        </View>
        
        <Ionicons name="chevron-forward" size={16} color={colors?.textSecondary || '#687076'} />
      </View>
    </TouchableOpacity>
  )

  const renderThemeOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.themeOption, { backgroundColor: colors?.cardBackground || '#FFFFFF' }]}
      activeOpacity={0.7}
      onPress={() => handleThemeChange(option.id)}
    >
      <View style={styles.themeOptionContent}>
        <View style={[styles.themeIconContainer, { backgroundColor: colors?.tint + '20' || '#1d9bf020' }]}>
          <Feather name={option.icon} size={18} color={colors?.tint || '#1d9bf0'} />
        </View>
        
        <View style={styles.themeTextContainer}>
          <ThemedText 
            style={[styles.themeOptionLabel, { color: colors?.text || '#11181C' }]}
            numberOfLines={1}
          >
            {option.label}
          </ThemedText>
        </View>
        
        <Ionicons name="chevron-forward" size={16} color={colors?.textSecondary || '#687076'} />
      </View>
    </TouchableOpacity>
  )

  const safeColors = colors || {
    tint: '#1d9bf0',
    cardBackground: '#FFFFFF',
    text: '#11181C',
    textSecondary: '#687076',
    border: '#E6E8EB',
  }

  const headerGradientColors = [safeColors.tint, '#0066cc']

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
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

        {/* Animated Menu */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              backgroundColor: safeColors.cardBackground,
              transform: [{ translateX: translateX }],
            },
          ]}
        >
          {/* Menu Header - FIXED POSITION */}
          <LinearGradient
            colors={headerGradientColors}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContainer}>
              <View style={styles.headerLeft}>
                <FontAwesome5 name="school" size={28} color="#FFFFFF" />
                <View style={styles.headerTextContainer}>
                  <ThemedText type='subtitle' style={styles.headerTitle}>
                    Bluri High School
                  </ThemedText>
                  <ThemedText style={styles.headerSubtitle}>
                    Dashboard Settings
                  </ThemedText>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Menu Items Scroll - FIXED HEIGHT */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* School Information Section */}
            <View style={styles.section}>
              <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors?.text || '#11181C' }]}>
                School Information
              </ThemedText>
              <View style={styles.menuItemsContainer}>
                {menuItems.map(renderMenuItem)}
              </View>
            </View>

            {/* Theme Section */}
            <View style={styles.section}>
              <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors?.text || '#11181C' }]}>
                App Theme
              </ThemedText>
              <View style={styles.themeOptionsContainer}>
                {themeOptions.map(renderThemeOption)}
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="log-out" size={18} color="#FFFFFF" />
                <ThemedText type='subtitle' style={styles.logoutText}>Logout</ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors?.textSecondary || '#687076' }]}>
                Bluri High School App v2.4.1
              </ThemedText>
              <ThemedText style={[styles.footerCopyright, { color: colors?.textSecondary || '#687076' }]}>
                © 2024 All rights reserved
              </ThemedText>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
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
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 65 : 45,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerContainer: {
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
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 12,
  },
  menuItemsContainer: {
    paddingHorizontal: 15,
  },
  menuItem: {
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconGradient: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  menuTextContainer: {
    flex: 1,
    marginRight: 8,
    minWidth: 0, // Important for text truncation
  },
  menuItemTitle: {
    fontSize: 14,
  },
  menuItemValue: {
    fontSize: 12,
    opacity: 0.7,
  },
  themeOptionsContainer: {
    paddingHorizontal: 15,
  },
  themeOption: {
    borderRadius: 12,
    marginBottom: 8,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  themeIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  themeTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  themeOptionLabel: {
    fontSize: 14,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  footerCopyright: {
    fontSize: 11,
    opacity: 0.5,
  },
})