import { View, StyleSheet, Dimensions } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width } = Dimensions.get('window')

export default function StaffStatsCards({ staffData, dashboardColors }) {
  const { colors } = useTheme()
  
  const teachingStaff = staffData.filter(s => s.type === 'Teaching').length
  const nonTeachingStaff = staffData.filter(s => s.type === 'Non-Teaching').length
  
  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { 
        backgroundColor: dashboardColors.cardBg,
        borderColor: dashboardColors.border,
        shadowColor: '#00000040'
      }]}>
        <View style={[styles.statIcon, { backgroundColor: dashboardColors.info + '15' }]}>
          <FontAwesome5 name="chalkboard-teacher" size={18} color={dashboardColors.info} />
        </View>
        <View>
          <ThemedText style={[styles.statValue, { color: colors.text }]}>
            {teachingStaff}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Teaching Staff
          </ThemedText>
        </View>
      </View>
      
      <View style={[styles.statCard, { 
        backgroundColor: dashboardColors.cardBg,
        borderColor: dashboardColors.border,
        shadowColor: '#00000040'
      }]}>
        <View style={[styles.statIcon, { backgroundColor: dashboardColors.success + '15' }]}>
          <MaterialCommunityIcons name="account-tie" size={20} color={dashboardColors.success} />
        </View>
        <View>
          <ThemedText style={[styles.statValue, { color: colors.text }]}>
            {nonTeachingStaff}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Non-Teaching
          </ThemedText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    width: (width - 60) / 2,
    gap: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    fontWeight: '500',
  },
})