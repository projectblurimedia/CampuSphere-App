import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function StatsCards({ statsData, dashboardColors }) {
  const { colors } = useTheme()
  
  const stats = statsData || {
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    avgClassSize: 0,
  }

  const cards = [
    {
      title: 'Total Classes',
      value: stats.totalClasses || 0,
      icon: <MaterialIcons name="class" size={22} color={dashboardColors.info} />,
      bgColor: dashboardColors.info + '15',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents || 0,
      icon: <FontAwesome5 name="user-graduate" size={20} color={dashboardColors.success} />,
      bgColor: dashboardColors.success + '15',
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers || 0,
      icon: <Ionicons name="people" size={22} color={dashboardColors.warning} />,
      bgColor: dashboardColors.warning + '15',
    },
    {
      title: 'Avg Class Size',
      value: stats.avgClassSize || 0,
      icon: <MaterialIcons name="groups" size={22} color={dashboardColors.purple} />,
      bgColor: dashboardColors.purple + '15',
    },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cards.map((card, index) => (
          <View 
            key={index} 
            style={[
              styles.card,
              { 
                backgroundColor: card.bgColor,
                borderColor: dashboardColors.border,
                shadowColor: '#00000000'
              }
            ]}
          >
            <View style={styles.cardHeader}>
              {card.icon}
              <ThemedText style={[styles.cardValue, { color: colors.text }]}>
                {card.value}
              </ThemedText>
            </View>
            <ThemedText style={[styles.cardTitle, { color: colors.textSecondary }]}>
              {card.title}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 13,
    opacity: 0.8,
    fontWeight: '500',
  },
})