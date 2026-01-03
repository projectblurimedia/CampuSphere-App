import React from 'react'
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function StudentsMenu({ visible, onClose }) {
  const { colors } = useTheme()

  const menuItems = [
    { icon: 'person-add', title: 'Add New Student', color: '#10b981' },
    { icon: 'list', title: 'Student List', color: '#3b82f6' },
    { icon: 'checkmark-circle', title: 'Attendance', color: '#f59e0b' },
    { icon: 'bar-chart', title: 'Stats', color: '#8b5cf6' },
    { icon: 'card', title: 'Fees Management', color: '#ef4444' },
    { icon: 'document-text', title: 'Marks Report', color: '#84cc16' },
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
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="school-outline" size={28} color={colors.primary} />
            </View>
            <ThemedText type="subtitle" style={[styles.menuTitle, { color: colors.text }]}>
              Students Menu
            </ThemedText>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={onClose} 
              style={[styles.closeButton, { backgroundColor: colors.danger + 10 }]}
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
                onPress={() => {
                  console.log(`Selected: ${item.title}`)
                  onClose()
                }}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.menuItemContent}>
                  <ThemedText type="subtitle" style={[styles.menuItemText, { color: colors.text }]}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.menuItemSubtitle}>
                    Manage student details
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 22,
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