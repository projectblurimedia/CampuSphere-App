import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function QuickActions({ colors, dashboardColors }) {
  const actions = [
    {
      title: 'Add Student',
      icon: <MaterialIcons name="person-add" size={24} color="#fff" />,
      bgColor: dashboardColors.cyan,
      iconBg: dashboardColors.cyan + '15',
    },
    {
      title: 'Collect Fees',
      icon: <FontAwesome5 name="money-check-alt" size={20} color="#fff" />,
      bgColor: dashboardColors.pink,
      iconBg: dashboardColors.pink + '15',
    },
    {
      title: 'Mark Attendance',
      icon: <Ionicons name="calendar-outline" size={24} color="#fff" />,
      bgColor: dashboardColors.teal,
      iconBg: dashboardColors.teal + '15',
    },
    {
      title: 'Create Report',
      icon: <MaterialIcons name="assignment" size={24} color="#fff" />,
      bgColor: dashboardColors.warning,
      iconBg: dashboardColors.warning + '15',
    },
  ]

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <TouchableOpacity activeOpacity={0.8}>
          <ThemedText type="link">View All</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.quickActionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            activeOpacity={0.7}
            style={[
              styles.actionCard, 
              { 
                backgroundColor: action.iconBg,
                width: (width - 60) / 2,
              }
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
              {action.icon}
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
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    borderColor: 'transparent',
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
  },
})