import React from 'react'
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function StaffMenu({ visible, onClose }) {
  const { colors } = useTheme()

  const menuItems = [
    { icon: 'person-add', title: 'Add Staff Member', color: '#10b981' },
    { icon: 'people', title: 'Staff Directory', color: '#3b82f6' },
    { icon: 'calendar', title: 'Leave Management', color: '#f59e0b' },
    { icon: 'cash', title: 'Salary & Payroll', color: '#8b5cf6' },
    { icon: 'school', title: 'Training & Development', color: '#06b6d4' },
    { icon: 'settings', title: 'Staff Settings', color: '#6b7280' },
  ]

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.menuHeader}>
            <ThemedText type="title" style={styles.menuTitle}>Staff Menu</ThemedText>
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
                  <Ionicons name={item.icon} size={20} color={item.color} />
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