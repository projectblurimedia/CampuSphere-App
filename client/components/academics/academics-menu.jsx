// pages/academics/AcademicsMenu.jsx
import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import Timetable from '@/pages/academics/Timetable'

export default function AcademicsMenu({ visible, onClose }) {
  const { colors } = useTheme()
  const [showTimetableModal, setShowTimetableModal] = useState(false)

  const menuItems = [
    { 
      icon: 'book', 
      title: 'Subjects & Courses', 
      color: '#10b981', 
      subtitle: 'Manage subjects and course details',
      action: () => console.log('Subjects & Courses selected')
    },
    { 
      icon: 'schedule', 
      title: 'Timetable', 
      color: '#3b82f6', 
      subtitle: 'View and manage class schedules',
      action: () => setShowTimetableModal(true)
    },
    { 
      icon: 'assignment', 
      title: 'Assignments', 
      color: '#f59e0b', 
      subtitle: 'Create and track assignments',
      action: () => console.log('Assignments selected')
    },
    { 
      icon: 'grading', 
      title: 'Exams & Results', 
      color: '#ef4444', 
      subtitle: 'Manage exams and view results',
      action: () => console.log('Exams & Results selected')
    },
    { 
      icon: 'library-books', 
      title: 'Study Materials', 
      color: '#8b5cf6', 
      subtitle: 'Upload and access study resources',
      action: () => console.log('Study Materials selected')
    },
    { 
      icon: 'event', 
      title: 'Academic Calendar', 
      color: '#06b6d4', 
      subtitle: 'View important dates and events',
      action: () => console.log('Academic Calendar selected')
    },
  ]

  const handleItemPress = (item) => {
    item.action()
  }

  const handleTimetableClose = () => {
    setShowTimetableModal(false)
    onClose()
  }

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="school-outline" size={22} color={colors.primary} />
              </View>
              <ThemedText type="subtitle" style={[styles.menuTitle, { color: colors.text }]}>
                Academics Menu
              </ThemedText>
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={onClose} 
                style={[styles.closeButton, { backgroundColor: colors.danger + '10' }]}
              >
                <Ionicons name="close" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.menuItem, 
                    { 
                      borderBottomColor: colors.border,
                      backgroundColor: index % 2 === 0 ? colors.surface : 'transparent'
                    }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <MaterialIcons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <ThemedText type="subtitle" style={[styles.menuItemText, { color: colors.text }]}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.menuItemSubtitle}>
                      {item.subtitle}
                    </ThemedText>
                  </View>
                  <View style={styles.menuItemArrow}>
                    <Ionicons 
                      name="chevron-forward-outline" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 5,
    paddingBottom: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 20,
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 17,
  },
  menuItemSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  menuItemArrow: {
    paddingLeft: 8,
    opacity: 0.6,
  },
})