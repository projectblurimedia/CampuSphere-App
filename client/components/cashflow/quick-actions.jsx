import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import { ToastNotification } from '@/components/ui/ToastNotification'
import Dashboard from '@/components/dynamicModals/Dashboard'

const { width } = Dimensions.get('window')

export default function QuickActions({ actions = [] }) {
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

  const handleModalClose = () => {
    setActiveModal(null)
    showToast('Operation completed successfully', 'success')
    // Refresh dashboard data
    if (navigation.getParent()?.params?.refresh) {
      navigation.getParent().params.refresh()
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
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                {getIcon(action.iconType || 'MaterialIcons', action.icon, 24, '#fff')}
              </View>
              <ThemedText 
                type="defaultSemiBold" 
                style={[styles.actionTitle, { color: colors.text }]}
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
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
})