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
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import Timetable from '@/pages/academics/Timetable'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function AcademicsMenu({ visible, onClose }) {
  const { theme, colors } = useTheme()
  const [showTimetableModal, setShowTimetableModal] = useState(false)
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
    }
  }, [visible])

  const menuItems = [
    { 
      id: 1, 
      title: 'Subjects & Courses', 
      icon: 'book', 
      iconType: 'MaterialIcons', 
      gradient: ['#10b981', '#059669'], 
      action: () => console.log('Subjects & Courses selected')
    },
    { 
      id: 2, 
      title: 'Timetable', 
      icon: 'schedule', 
      iconType: 'MaterialIcons', 
      gradient: ['#3b82f6', '#2563eb'], 
      action: () => setShowTimetableModal(true)
    },
    { 
      id: 3, 
      title: 'Assignments', 
      icon: 'assignment', 
      iconType: 'MaterialIcons', 
      gradient: ['#f59e0b', '#d97706'], 
      action: () => console.log('Assignments selected')
    },
    { 
      id: 4, 
      title: 'Exams & Results', 
      icon: 'grading', 
      iconType: 'MaterialIcons', 
      gradient: ['#ef4444', '#dc2626'], 
      action: () => console.log('Exams & Results selected')
    },
    { 
      id: 5,
      title: 'Study Materials', 
      icon: 'library-books', 
      iconType: 'MaterialIcons', 
      gradient: ['#8b5cf6', '#7c3aed'], 
      action: () => console.log('Study Materials selected')
    },
    { 
      id: 6, 
      title: 'Academic Calendar', 
      icon: 'event', 
      iconType: 'MaterialIcons', 
      gradient: ['#06b6d4', '#0891b2'], 
      action: () => console.log('Academic Calendar selected')
    },
  ]

  const sections = [
    {
      title: 'Curriculum',
      data: menuItems.filter(item => [1,2,3].includes(item.id)),
    },
    {
      title: 'Assessment & Resources',
      data: menuItems.filter(item => [4,5,6].includes(item.id)),
    },
  ]

  const getIcon = (type, name, size, color) => {
    const icons = {
      MaterialIcons: MaterialIcons,
    }
    const Icon = icons[type] || Ionicons
    return <Icon name={name} size={size} color={color} />
  }

  const handleMenuItemPress = (item) => {
    item.action()
  }

  const handleTimetableClose = () => {
    setShowTimetableModal(false)
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
                  <Ionicons name="school" size={28} color="#FFFFFF" />
                  <View style={styles.headerText}>
                    <ThemedText type='subtitle' style={styles.schoolName}>
                      Bluri High School
                    </ThemedText>
                    <ThemedText style={styles.menuTitle}>
                      Academics Menu
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

      <Timetable
        visible={showTimetableModal}
        onClose={handleTimetableClose}
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