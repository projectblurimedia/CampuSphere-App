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
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  FontAwesome6,
} from '@expo/vector-icons'
import ThemeModal from '@/components/theme/ThemeModal'
import { useTheme } from '@/hooks/useTheme'
import SchoolProfile from '@/pages/menu/schoolProfile/SchoolProfile'
import SchoolStats from '@/pages/menu/schoolStats/SchoolStats'
import Events from '@/pages/menu/events/Events'
import CreateStudent from '@/pages/menu/createStudent/CreateStudent'
import CreateStaff from '@/pages/menu/createStaff/CreateStaff'
import Attendance from '@/pages/menu/attendance/Attendance'
import CollectFees from '@/pages/menu/collectFees/CollectFees'
import BulkImportStudents from '@/pages/menu/bulkImportStudents/BulkImportStudents'
import BulkImportStaff from '@/pages/menu/bulkImportStaff/BulkImportStaff'
import UploadMarks from '@/pages/menu/uploadMarks/UploadMarks'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function DashboardMenu({ visible, onClose }) {
  const { theme, colors } = useTheme()
  const [themeModalVisible, setThemeModalVisible] = useState(false)
  const [schoolProfileVisible, setSchoolProfileVisible] = useState(false)
  const [schoolStatsVisible, setSchoolStatsVisible] = useState(false)
  const [eventsVisible, setEventsVisible] = useState(false)
  const [createStudentVisible, setCreateStudentVisible] = useState(false)
  const [createStaffVisible, setCreateStaffVisible] = useState(false)
  const [markAttendanceVisible, setMarkAttendanceVisible] = useState(false)
  const [collectFeesVisible, setCollectFeesVisible] = useState(false)
  const [bulkImportStudentsVisible, setBulkImportStudentsVisible] = useState(false)
  const [bulkImportStaffVisible, setBulkImportStaffVisible] = useState(false)
  const [uploadMarksVisible, setUploadMarksVisible] = useState(false) // Add this state
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  
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
      setThemeModalVisible(false)
    }
  }, [visible])

  const menuItems = [
    { 
      id: 1, 
      title: 'School Profile', 
      icon: 'school', 
      iconType: 'Ionicons', 
      gradient: ['#3b82f6', '#2563eb'], 
      action: () => setSchoolProfileVisible(true) 
    },
    { 
      id: 2, 
      title: 'Events',
      icon: 'calendar-star',
      iconType: 'MaterialCommunityIcons', 
      gradient: ['#10b981', '#059669'], 
      action: () => setEventsVisible(true)
    },
    { 
      id: 3, 
      title: 'Stats', 
      icon: 'chart-bar', 
      iconType: 'FontAwesome5', 
      gradient: ['#8b5cf6', '#7c3aed'], 
      action: () => setSchoolStatsVisible(true) 
    },
    { 
      id: 4, 
      title: 'New Student', 
      icon: 'user-plus', 
      iconType: 'Feather', 
      gradient: ['#06b6d4', '#0891b2'], 
      action: () => setCreateStudentVisible(true) 
    },
    { 
      id: 5,
      title: 'Bulk Import Students', 
      icon: 'file-import', 
      iconType: 'FontAwesome5', 
      gradient: ['#10b981', '#059669'], 
      action: () => setBulkImportStudentsVisible(true) 
    },
    { 
      id: 6, 
      title: 'New Staff', 
      icon: 'user-tie', 
      iconType: 'FontAwesome5', 
      gradient: ['#8b5cf6', '#7c3aed'], 
      action: () => setCreateStaffVisible(true) 
    },
    { 
      id: 7,
      title: 'Bulk Import Staff', 
      icon: 'users', 
      iconType: 'FontAwesome5', 
      gradient: ['#f59e0b', '#d97706'], 
      action: () => setBulkImportStaffVisible(true) 
    },
    { 
      id: 8, 
      title: 'Mark Attendance', 
      icon: 'clipboard-check', 
      iconType: 'MaterialCommunityIcons', 
      gradient: ['#84cc16', '#65a30d'], 
      action: () => setMarkAttendanceVisible(true) 
    },
    { 
      id: 9, 
      title: 'Upload Marks', // New menu item
      icon: 'upload', 
      iconType: 'Feather', 
      gradient: ['#8b5cf6', '#7c3aed'], 
      action: () => setUploadMarksVisible(true) 
    },
    { 
      id: 10, 
      title: 'Collect Fees', 
      icon: 'dollar-sign', 
      iconType: 'FontAwesome5', 
      gradient: ['#f97316', '#ea580c'], 
      action: () => setCollectFeesVisible(true) 
    },
  ]

  const getIcon = (type, name, size, color) => {
    const icons = {
      Ionicons: Ionicons,
      FontAwesome5: FontAwesome5,
      MaterialCommunityIcons: MaterialCommunityIcons,
      Feather: Feather,
      MaterialIcons: MaterialIcons,
    }
    const Icon = icons[type] || Ionicons
    return <Icon name={name} size={size} color={color} />
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'system': return 'System Default'
      case 'light': return 'Light Mode'
      case 'dark': return 'Dark Mode'
      default: return 'System Default'
    }
  }

  const handleMenuItemPress = (item) => {
    item.action()
  }

  const handleLogout = () => {
    console.log('Logout pressed')
    onClose()
  }

  const handleSchoolProfileClose = () => {
    setSchoolProfileVisible(false)
  }

  const handleSchoolStatsClose = () => {
    setSchoolStatsVisible(false)
  }

  const handleEventsClose = () => {
    setEventsVisible(false)
  }

  const handleCreateStudentClose = () => {
    setCreateStudentVisible(false)
  }

  const handleCreateStaffClose = () => {
    setCreateStaffVisible(false)
  }

  const handleBulkImportStudentsClose = () => {
    setBulkImportStudentsVisible(false)
  }

  const handleBulkImportStaffClose = () => {
    setBulkImportStaffVisible(false)
  }

  const handleMarkAttendanceClose = () => {
    setMarkAttendanceVisible(false)
  }

  const handleCollectFeesClose = () => {
    setCollectFeesVisible(false)
  }

  const handleUploadMarksClose = () => {
    setUploadMarksVisible(false)
  }

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
                  <FontAwesome5 name="school" size={28} color="#FFFFFF" />
                  <View style={styles.headerText}>
                    <ThemedText type='subtitle' style={styles.schoolName}>
                      Bluri High School
                    </ThemedText>
                    <ThemedText style={styles.menuTitle}>
                      Dashboard Menu
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
              <View style={styles.section}>
                <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
                  Management
                </ThemedText>
                <View style={styles.items}>
                  {menuItems.map((item) => (
                    <TouchableOpacity
                      activeOpacity={.9} 
                      key={item.id}
                      style={[styles.item, { backgroundColor: colors.cardBackground }]}
                      onPress={() => handleMenuItemPress(item)}
                    >
                      <View style={styles.itemContent}>
                        <LinearGradient colors={item.gradient} style={styles.icon}>
                          {getIcon(item.iconType, item.icon, 18, '#FFFFFF')}
                        </LinearGradient>
                        <View style={styles.itemText}>
                          <ThemedText type='subtitle' style={[styles.itemTitle, { color: colors.text }]}>
                            {item.title}
                          </ThemedText>
                          <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                            View details
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
                  App Settings
                </ThemedText>
                <View style={styles.items}>
                  <TouchableOpacity
                    activeOpacity={.9} 
                    style={[styles.item, { backgroundColor: colors.cardBackground }]}
                    onPress={() => setThemeModalVisible(true)}
                  >
                    <View style={styles.itemContent}>
                      <View style={[styles.icon, { backgroundColor: colors.tint + '20' }]}>
                        <FontAwesome6 name="palette" size={18} color={colors.tint} />
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

              <TouchableOpacity
                style={styles.logout}
                onPress={handleLogout}
              >
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.logoutGradient}>
                  <Feather name="log-out" size={18} color="#FFFFFF" />
                  <ThemedText type='subtitle' style={styles.logoutText}>Logout</ThemedText>
                </LinearGradient>
              </TouchableOpacity>

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

          <ThemeModal
            visible={themeModalVisible}
            onClose={() => setThemeModalVisible(false)}
          />
        </View>
      </Modal>

      <SchoolProfile
        visible={schoolProfileVisible}
        onClose={handleSchoolProfileClose}
      />
      <SchoolStats
        visible={schoolStatsVisible}
        onClose={handleSchoolStatsClose}
      />
      <Events
        visible={eventsVisible}
        onClose={handleEventsClose}
      />
      <CreateStudent
        visible={createStudentVisible}
        onClose={handleCreateStudentClose}
      />
      <BulkImportStudents
        visible={bulkImportStudentsVisible}
        onClose={handleBulkImportStudentsClose}
      />
      <CreateStaff
        visible={createStaffVisible}
        onClose={handleCreateStaffClose}
      />
      <BulkImportStaff
        visible={bulkImportStaffVisible}
        onClose={handleBulkImportStaffClose}
      />
      <Attendance
        visible={markAttendanceVisible}
        onClose={handleMarkAttendanceClose}
      />
      <UploadMarks // Add this component
        visible={uploadMarksVisible}
        onClose={handleUploadMarksClose}
      />
      <CollectFees
        visible={collectFeesVisible}
        onClose={handleCollectFeesClose}
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
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
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
  section: { marginTop: 25 },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 12,
  },
  items: { paddingHorizontal: 15 },
  item: {
    borderRadius: 12,
    marginBottom: 8,
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
  logout: {
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
        shadowRadius: 8 
      },
      android: { elevation: 4 },
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
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 11,
    opacity: 0.5,
  },
})