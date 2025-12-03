import { View, StyleSheet, Dimensions } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function FinancialStats({ 
  totalIncome = 0, 
  totalExpenses = 0, 
  netBalance = 0, 
  colors, 
  dashboardColors 
}) {
  // Ensure numbers are valid
  const safeTotalIncome = Number(totalIncome) || 0
  const safeTotalExpenses = Number(totalExpenses) || 0
  const safeNetBalance = Number(netBalance) || 0
  
  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { 
        backgroundColor: dashboardColors.cardBg,
        borderColor: dashboardColors.border,
        shadowColor: '#00000040'
      }]}>
        <View style={[styles.statIcon, { backgroundColor: dashboardColors.success + '15' }]}>
          <MaterialIcons name="trending-up" size={22} color={dashboardColors.success} />
        </View>
        <View style={styles.statContent}>
          <ThemedText style={[styles.statLabel, { color: colors.icon }]}>
            Total Income
          </ThemedText>
          <ThemedText style={[styles.statValue, { color: dashboardColors.success }]}>
            ₹{safeTotalIncome.toLocaleString('en-IN')}
          </ThemedText>
          <View style={styles.statTrend}>
            <Ionicons name="arrow-up" size={12} color={dashboardColors.success} />
            <ThemedText style={[styles.trendText, { color: dashboardColors.success }]}>
              +12.5% from last month
            </ThemedText>
          </View>
        </View>
      </View>
      
      <View style={[styles.statCard, { 
        backgroundColor: dashboardColors.cardBg,
        borderColor: dashboardColors.border,
        shadowColor: '#00000040'
      }]}>
        <View style={[styles.statIcon, { backgroundColor: dashboardColors.danger + '15' }]}>
          <MaterialIcons name="trending-down" size={22} color={dashboardColors.danger} />
        </View>
        <View style={styles.statContent}>
          <ThemedText style={[styles.statLabel, { color: colors.icon }]}>
            Total Expenses
          </ThemedText>
          <ThemedText style={[styles.statValue, { color: dashboardColors.danger }]}>
            ₹{safeTotalExpenses.toLocaleString('en-IN')}
          </ThemedText>
          <View style={styles.statTrend}>
            <Ionicons name="arrow-down" size={12} color={dashboardColors.danger} />
            <ThemedText style={[styles.trendText, { color: dashboardColors.danger }]}>
              -5.2% from last month
            </ThemedText>
          </View>
        </View>
      </View>
      
      <View style={[styles.statCard, { 
        backgroundColor: dashboardColors.cardBg,
        borderColor: dashboardColors.border,
        shadowColor: '#00000040'
      }]}>
        <View style={[styles.statIcon, { backgroundColor: dashboardColors.info + '15' }]}>
          <FontAwesome5 name="balance-scale" size={20} color={dashboardColors.info} />
        </View>
        <View style={styles.statContent}>
          <ThemedText style={[styles.statLabel, { color: colors.icon }]}>
            Net Balance
          </ThemedText>
          <ThemedText style={[styles.statValue, { 
            color: safeNetBalance >= 0 ? dashboardColors.success : dashboardColors.danger 
          }]}>
            ₹{safeNetBalance.toLocaleString('en-IN')}
          </ThemedText>
          <View style={styles.statTrend}>
            <Ionicons 
              name={safeNetBalance >= 0 ? "arrow-up" : "arrow-down"} 
              size={12} 
              color={safeNetBalance >= 0 ? dashboardColors.success : dashboardColors.danger} 
            />
            <ThemedText style={[styles.trendText, { 
              color: safeNetBalance >= 0 ? dashboardColors.success : dashboardColors.danger 
            }]}>
              {safeNetBalance >= 0 ? 'Profitable' : 'Deficit'}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    width: (width - 52) / 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: {
    width: 44,
    height: 44,
    marginBottom: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
})