import { View, StyleSheet, Dimensions } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'

const { width } = Dimensions.get('window')

export default function IncomeExpenseChart({ data = [], colors, dashboardColors }) {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : []
  
  // Find max value for scaling
  const maxValue = safeData.length > 0 ? 
    Math.max(...safeData.map(item => Math.max(item.income || 0, item.expenses || 0))) : 
    1
  
  return (
    <View style={[styles.chartContainer, { 
      backgroundColor: dashboardColors.cardBg,
      borderColor: dashboardColors.border
    }]}>
      <View style={styles.chartHeader}>
        <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
          Income vs Expenses
        </ThemedText>
        <ThemedText style={[styles.chartPeriod, { color: colors.icon }]}>
          Last 6 months
        </ThemedText>
      </View>
      
      <View style={styles.chart}>
        {safeData.map((item, index) => {
          const income = item.income || 0
          const expenses = item.expenses || 0
          const incomeHeight = (income / maxValue) * 80
          const expensesHeight = (expenses / maxValue) * 80
          
          return (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barContainer}>
                <View style={[styles.incomeBar, { 
                  height: incomeHeight, 
                  backgroundColor: dashboardColors.success 
                }]} />
                <View style={[styles.expenseBar, { 
                  height: expensesHeight, 
                  backgroundColor: dashboardColors.danger 
                }]} />
              </View>
              <ThemedText style={[styles.monthLabel, { color: colors.text }]}>
                {item.month || 'N/A'}
              </ThemedText>
            </View>
          )
        })}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: dashboardColors.success }]} />
          <ThemedText style={[styles.legendText, { color: colors.text }]}>
            Income
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: dashboardColors.danger }]} />
          <ThemedText style={[styles.legendText, { color: colors.text }]}>
            Expenses
          </ThemedText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chartContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#00000040',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartPeriod: {
    fontSize: 12,
    opacity: 0.8,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barGroup: {
    alignItems: 'center',
    width: (width - 80) / 6,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 80,
    marginBottom: 8,
  },
  incomeBar: {
    width: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    opacity: 0.8,
  },
  expenseBar: {
    width: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    opacity: 0.8,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
})