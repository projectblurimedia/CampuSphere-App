import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function UpcomingEvents({ dashboardColors }) {
  const { colors } = useTheme()
  
  const events = [
    { date: '15', month: 'DEC', title: 'Annual Sports Day', time: '9:00 AM', color: dashboardColors.info },
    { date: '18', month: 'DEC', title: 'Science Exhibition', time: '10:00 AM', color: dashboardColors.green },
    { date: '22', month: 'DEC', title: 'Winter Vacation Starts', time: 'All Day', color: dashboardColors.warning },
    { date: '25', month: 'DEC', title: 'Christmas Celebration', time: '11:00 AM', color: dashboardColors.danger },
  ]

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={{ color: colors.text }}>Upcoming Events</ThemedText>
        <TouchableOpacity activeOpacity={0.8}>
          <ThemedText type="link" style={{ color: colors.tint }}>Calendar</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={[styles.eventsContainer, { 
        backgroundColor: dashboardColors.cardBg, 
        borderColor: dashboardColors.border 
      }]}>
        {events.map((event, index) => (
          <View 
            key={index} 
            style={[
              styles.eventItem, 
              index < 3 && [styles.eventBorder, { borderColor: dashboardColors.border }]
            ]}
          >
            <View style={[styles.eventDate, { backgroundColor: event.color + '15' }]}>
              <ThemedText type="title" style={[styles.eventDay, { color: event.color }]}>
                {event.date}
              </ThemedText>
              <ThemedText type="default" style={[styles.eventMonth, { color: event.color }]}>
                {event.month}
              </ThemedText>
            </View>
            <View style={styles.eventContent}>
              <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 15 }}>
                {event.title}
              </ThemedText>
              <ThemedText type="default" style={{ color: colors.textSecondary, fontSize: 13 }}>
                {event.time}
              </ThemedText>
            </View>
            <TouchableOpacity activeOpacity={0.6}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 0,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  eventBorder: {
    borderBottomWidth: 1,
  },
  eventDate: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: {
    fontSize: 22,
    fontWeight: '700',
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -10,
  },
  eventContent: {
    flex: 1,
  },
})