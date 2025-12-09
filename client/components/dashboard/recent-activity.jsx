import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function RecentActivity({ dashboardColors }) {
  const { colors } = useTheme()
  
  const activities = [
    { 
      icon: '💰', 
      title: 'Fee Payment Received', 
      desc: 'Rahul Sharma paid ₹15,000 for term fees', 
      time: '10 minutes ago',
      color: dashboardColors.green,
      type: 'payment'
    },
    { 
      icon: '📚', 
      title: 'New Course Added', 
      desc: 'Computer Science Grade 11 curriculum updated', 
      time: '1 hour ago',
      color: dashboardColors.info,
      type: 'academic'
    },
    { 
      icon: '👨‍🏫', 
      title: 'Staff Meeting Completed', 
      desc: 'Monthly staff meeting concluded successfully', 
      time: '2 hours ago',
      color: dashboardColors.purple,
      type: 'meeting'
    },
    { 
      icon: '🏫', 
      title: 'Parent-Teacher Meeting', 
      desc: 'PTM scheduled for Friday, 3:00 PM', 
      time: '5 hours ago',
      color: dashboardColors.orange,
      type: 'event'
    },
    { 
      icon: '📊', 
      title: 'Exam Results Published', 
      desc: 'Final term results published on portal', 
      time: '1 day ago',
      color: dashboardColors.cyan,
      type: 'academic'
    },
  ]

  const getTypeLabel = (type) => {
    switch(type) {
      case 'payment': return 'Payment';
      case 'academic': return 'Academic';
      case 'meeting': return 'Meeting';
      case 'event': return 'Event';
      default: return 'Activity';
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={{ color: colors.text }}>Recent Activity</ThemedText>
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
              index < activities.length - 1 && [styles.activityDivider, { borderColor: dashboardColors.border }]
            ]}
          >
            <View style={styles.topRow}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
                <ThemedText style={{ fontSize: 20 }}>{activity.icon}</ThemedText>
              </View>
              
              <View style={styles.labelTitleColumn}>
                <View style={[styles.typeBadge, { backgroundColor: activity.color + '10' }]}>
                  <ThemedText style={[styles.typeText, { color: activity.color }]}>
                    {getTypeLabel(activity.type)}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" style={[styles.activityTitle, { color: colors.text }]}>
                  {activity.title}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="default" style={[styles.activityDesc, { color: colors.textSecondary }]}>
              {activity.desc}
            </ThemedText>

            <View style={styles.bottomRow}>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ opacity: 0.7 }} />
                <ThemedText 
                  type="default" 
                  style={[styles.activityTime, { color: colors.textSecondary }]}
                >
                  {activity.time}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                activeOpacity={0.6}
                style={[styles.detailsButton, { backgroundColor: activity.color + '10' }]}
              >
                <ThemedText 
                  type='subtitle'
                  style={[styles.detailsButtonText, { color: activity.color }]}
                >
                  Details
                </ThemedText>
                <Ionicons name="chevron-forward" size={12} color={activity.color} />
              </TouchableOpacity>
            </View>
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
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    padding: 20,
  },
  activityDivider: {
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelTitleColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  activityDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    opacity: 0.9,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 12,
  },
})