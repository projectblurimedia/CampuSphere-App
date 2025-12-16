import React from 'react'
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function AcademicsMenu({ visible, onClose }) {
  const { colors } = useTheme()

  const menuItems = [
    { icon: 'book', title: 'Subjects & Courses', color: '#10b981' },
    { icon: 'schedule', title: 'Timetable', color: '#3b82f6' },
    { icon: 'assignment', title: 'Assignments', color: '#f59e0b' },
    { icon: 'grading', title: 'Exams & Results', color: '#ef4444' },
    { icon: 'library-books', title: 'Study Materials', color: '#8b5cf6' },
    { icon: 'event', title: 'Academic Calendar', color: '#06b6d4' },
  ]

  return (
    <Modal
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.menuHeader}>
            <ThemedText type="title" style={styles.menuTitle}>Academics Menu</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  console.log(`Selected: ${item.title}`)
                  onClose()
                }}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <MaterialIcons name={item.icon} size={20} color={item.color} />
                </View>
                <ThemedText style={[styles.menuItemText, { color: colors.text }]}>
                  {item.title}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
})