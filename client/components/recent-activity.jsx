import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/themed-text'

export default function RecentActivity({ colors, dashboardColors }) {
  const activities = [
    { icon: '💰', title: 'Fee Payment Received', desc: 'Rahul Sharma paid ₹15,000', time: '10 min ago', color: dashboardColors.green },
    { icon: '📚', title: 'New Course Added', desc: 'Computer Science Grade 11', time: '1 hour ago', color: dashboardColors.info },
    { icon: '👨‍🏫', title: 'Staff Meeting', desc: 'Monthly staff meeting scheduled', time: '2 hours ago', color: dashboardColors.purple },
    { icon: '🏫', title: 'Parent-Teacher Meeting', desc: 'PTM scheduled for Friday', time: '5 hours ago', color: dashboardColors.orange },
    { icon: '📊', title: 'Exam Results Published', desc: 'Final term results are out', time: '1 day ago', color: dashboardColors.cyan },
  ]

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle">Recent Activity</ThemedText>
        <TouchableOpacity activeOpacity={0.8}>
          <ThemedText type="link" style={{ color: colors.tint, fontSize: 13 }}>See All</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={[styles.activityContainer, { 
        backgroundColor: dashboardColors.cardBg, 
        borderColor: dashboardColors.border 
      }]}>
        {activities.map((activity, index) => (
          <View 
            key={index} 
            style={[
              styles.activityItem, 
              index < 4 && [styles.activityBorder, { borderColor: dashboardColors.border }]
            ]}
          >
            <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
              <ThemedText style={{ fontSize: 20 }}>{activity.icon}</ThemedText>
            </View>
            <View style={styles.activityContent}>
              <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 14 }}>
                {activity.title}
              </ThemedText>
              <ThemedText type="default" style={{ color: colors.icon, fontSize: 13 }}>
                {activity.desc}
              </ThemedText>
            </View>
            <ThemedText 
              type="default" 
              style={[styles.activityTime, { color: colors.icon }]}
            >
              {activity.time}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityBorder: {
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.7,
  },
})