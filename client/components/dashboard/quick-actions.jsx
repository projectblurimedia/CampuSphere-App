import React, { useState } from 'react'
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import { ToastNotification } from '@/components/ui/ToastNotification'
import Dashboard from '@/components/dynamicModals/Dashboard'

const { width } = Dimensions.get('window')

export default function QuickActions() {
  const { colors } = useTheme()
  const navigation = useNavigation()
  
  // Modal state
  const [activeModal, setActiveModal] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleActionPress = (action) => {
    setActiveModal(action.route)
  }

  const handleModalClose = (success = true) => {
    setActiveModal(null)
    if (success) {
      if (navigation.getParent()?.params?.refresh) {
        navigation.getParent().params.refresh()
      }
    }
  }

  const getIcon = (type, name, size, color) => {
    const icons = {
      MaterialIcons,
      FontAwesome5,
      Ionicons,
      Feather
    }
    const Icon = icons[type] || MaterialIcons
    return <Icon name={name} size={size} color={color} />
  }

  const actions = [
    {
      title: 'New Student',
      icon: 'person-add',
      iconType: 'MaterialIcons',
      bgColor: colors.success,
      route: 'createStudent'
    },
    {
      title: 'New Employee',
      icon: 'user-tie', 
      iconType: 'FontAwesome5', 
      bgColor: colors.info,
      route: 'createEmployee'
    },
    {
      title: 'Fee Details',
      icon: 'currency-rupee',
      iconType: 'MaterialIcons',
      bgColor: colors.warning,
      route: 'feeDetails'
    },
    {
      title: 'Management',
      icon: 'people',
      iconType: 'MaterialIcons',
      bgColor: colors.purple || '#8b5cf6',
      route: 'studentManagement'
    }
  ]

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </ThemedText>
          <TouchableOpacity activeOpacity={0.8}>
            <ThemedText type="link" style={{ color: colors.tint }}></ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickActionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              activeOpacity={0.7}
              onPress={() => handleActionPress(action)}
              style={[
                styles.actionCard, 
                { 
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  width: (width - 60) / 2,
                }
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor + '20' }]}>
                <View style={[styles.iconInner, { backgroundColor: action.bgColor }]}>
                  {getIcon(action.iconType, action.icon, 22, '#ffffff')}
                </View>
              </View>
              <ThemedText 
                type="defaultSemiBold" 
                style={[styles.actionTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {action.title}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dynamic Modal Loader */}
      <Dashboard
        visible={!!activeModal}
        onClose={handleModalClose}
        componentName={activeModal}
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
  section: {
    marginTop: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
})