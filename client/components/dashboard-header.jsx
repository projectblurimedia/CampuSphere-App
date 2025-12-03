import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { Ionicons } from '@expo/vector-icons'

export default function DashboardHeader({ colors, dashboardColors }) {
  return (
    <View style={styles.header}>
      <View>
        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>Welcome to School Management</ThemedText>
      </View>
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={[
          styles.notificationBtn, 
          { 
            backgroundColor: dashboardColors.cardBg, 
            borderColor: dashboardColors.border 
          }
        ]}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.tint} />
        <View style={[styles.notificationBadge, { backgroundColor: dashboardColors.danger }]} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6c757d',
    marginTop: 4,
    fontSize: 14,
  },
  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})