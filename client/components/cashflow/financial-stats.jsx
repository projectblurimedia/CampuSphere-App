import { View, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'

const { width } = Dimensions.get('window')

const TIME_PERIODS = [
  { key: 'day', label: 'Today', icon: 'calendar-view-day' },
  { key: 'week', label: 'This Week', icon: 'calendar-view-week' },
  { key: 'month', label: 'This Month', icon: 'calendar-view-month' },
  { key: 'year', label: 'This Year', icon: 'calendar-month' },
  { key: 'all', label: 'All Time', icon: 'calendar-today' }
]

export default function FinancialStats({ 
  totalIncome = 0, 
  totalExpenses = 0, 
  netBalance = 0,
  timePeriod = 'month',
  onTimePeriodChange = () => {}
}) {
  const { colors } = useTheme()
  const [showFilter, setShowFilter] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriod)
  
  const safeTotalIncome = Number(totalIncome) || 0
  const safeTotalExpenses = Number(totalExpenses) || 0
  const safeNetBalance = Number(netBalance) || 0
  const safeProfitMargin = safeTotalIncome > 0 
    ? ((safeNetBalance / safeTotalIncome) * 100).toFixed(2) 
    : 0.00

  // Dynamic trend data based on time period
  const getTrendData = (period) => {
    const trends = {
      day: { 
        income: '+₹2,500', 
        incomePercent: '+3.2%', 
        expenses: '-₹1,200', 
        expensesPercent: '-2.1%', 
        balance: '+₹3,700', 
        balancePercent: '+5.4%', 
        margin: '+2.1%' 
      },
      week: { 
        income: '+₹15,800', 
        incomePercent: '+8.7%', 
        expenses: '-₹8,200', 
        expensesPercent: '-4.3%', 
        balance: '+₹24,000', 
        balancePercent: '+12.5%', 
        margin: '+4.8%' 
      },
      month: { 
        income: '+₹45,200', 
        incomePercent: '+12.5%', 
        expenses: '-₹28,500', 
        expensesPercent: '-5.2%', 
        balance: '+₹73,700', 
        balancePercent: '+15.0%', 
        margin: '+8.3%' 
      },
      year: { 
        income: '+₹456,800', 
        incomePercent: '+25.6%', 
        expenses: '-₹312,400', 
        expensesPercent: '-12.1%', 
        balance: '+₹769,200', 
        balancePercent: '+32.8%', 
        margin: '+18.7%' 
      },
      all: { 
        income: '+₹1,234,500', 
        incomePercent: '+35.2%', 
        expenses: '-₹789,300', 
        expensesPercent: '-18.4%', 
        balance: '+₹2,023,800', 
        balancePercent: '+48.6%', 
        margin: '+27.3%' 
      }
    }
    return trends[period] || trends.month
  }

  const trend = getTrendData(selectedPeriod)
  const isPositiveBalance = safeNetBalance >= 0
  const isPositiveMargin = parseFloat(safeProfitMargin) >= 0

  const handlePeriodSelect = (periodKey) => {
    setSelectedPeriod(periodKey)
    setShowFilter(false)
    onTimePeriodChange(periodKey)
  }

  const getCurrentPeriodLabel = () => {
    const period = TIME_PERIODS.find(p => p.key === selectedPeriod)
    return period ? period.label : 'This Month'
  }

  return (
    <View style={styles.statsContainer}>
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <MaterialIcons 
              name="insights" 
              size={20} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <View>
              <ThemedText type='subtitle' style={[styles.headerTitle, { color: colors.text }]}>
                Financial Stats
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Track your financial stats
              </ThemedText>
            </View>
          </View>
          
          {/* Filter Button */}
          <TouchableOpacity 
            style={[styles.filterButton, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border 
            }]}
            onPress={() => setShowFilter(true)}
            activeOpacity={.75}
          >
            <Feather name="filter" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.filterText, { color: colors.textSecondary }]}>
              {getCurrentPeriodLabel()}
            </ThemedText>
            <Feather name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={.75}
          onPress={() => setShowFilter(false)}
        >
          <View style={[styles.filterModal, { 
            backgroundColor: colors.cardBackground,
            shadowColor: colors.text
          }]}>
            <View style={styles.filterHeader}>
              <ThemedText type='subtitle' style={[styles.filterTitle, { color: colors.text }]}>
                Select Time Period
              </ThemedText>
              <TouchableOpacity activeOpacity={.75} onPress={() => setShowFilter(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {TIME_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.filterOption,
                    selectedPeriod === period.key && [styles.selectedOption, { 
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary
                    }]
                  ]}
                  onPress={() => handlePeriodSelect(period.key)}
                  activeOpacity={.75}
                >
                  <MaterialIcons 
                    name={period.icon} 
                    size={20} 
                    color={selectedPeriod === period.key ? 
                      colors.primary : 
                      colors.textSecondary
                    } 
                  />
                  <ThemedText style={[
                    styles.optionText,
                    { color: selectedPeriod === period.key ? 
                      colors.primary : 
                      colors.text 
                    }
                  ]}>
                    {period.label}
                  </ThemedText>
                  {selectedPeriod === period.key && (
                    <Feather 
                      name="check" 
                      size={18} 
                      color={colors.primary} 
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Stats Cards */}
      <View style={styles.row}>
        <View style={[styles.statCard, { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.text
        }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
            <MaterialIcons name="trending-up" size={22} color={colors.success} />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Income
            </ThemedText>
            <ThemedText type='title' style={[styles.statValue, { color: colors.success }]}>
              ₹{safeTotalIncome.toLocaleString('en-IN')}
            </ThemedText>
            <View style={styles.statTrend}>
              <Ionicons name="arrow-up" size={12} color={colors.success} />
              <ThemedText style={[styles.trendText, { color: colors.success }]}>
                {trend.incomePercent} from last {selectedPeriod}
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.text
        }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.danger + '15' }]}>
            <MaterialIcons name="trending-down" size={22} color={colors.danger} />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Expenses
            </ThemedText>
            <ThemedText type='title' style={[styles.statValue, { color: colors.danger }]}>
              ₹{safeTotalExpenses.toLocaleString('en-IN')}
            </ThemedText>
            <View style={styles.statTrend}>
              <Ionicons name="arrow-down" size={12} color={colors.danger} />
              <ThemedText style={[styles.trendText, { color: colors.danger }]}>
                {trend.expensesPercent} from last {selectedPeriod}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
     
      <View style={styles.row}>
        <View style={[styles.statCard, { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.text
        }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            <FontAwesome5 name="balance-scale" size={22} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Net Balance
            </ThemedText>
            <ThemedText type='title' style={[styles.statValue, { 
              color: isPositiveBalance ? colors.success : colors.danger
            }]}>
              ₹{safeNetBalance.toLocaleString('en-IN')}
            </ThemedText>
            <View style={styles.statTrend}>
              <Ionicons 
                name={isPositiveBalance ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={isPositiveBalance ? colors.success : colors.danger} 
              />
              <ThemedText style={[styles.trendText, { 
                color: isPositiveBalance ? colors.success : colors.danger
              }]}>
                {trend.balancePercent} from last {selectedPeriod}
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.text
        }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            <FontAwesome5 name="percentage" size={22} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Profit Margin
            </ThemedText>
            <ThemedText type='title' style={[styles.statValue, { 
              color: isPositiveMargin ? colors.success : colors.danger
            }]}>
              {safeProfitMargin}%
            </ThemedText>
            <View style={styles.statTrend}>
              <Ionicons 
                name={isPositiveMargin ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={isPositiveMargin ? colors.success : colors.danger}
              />
              <ThemedText style={[styles.trendText, { 
                color: isPositiveMargin ? colors.success : colors.danger
              }]}>
                {trend.margin} from last {selectedPeriod}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'column',
    marginVertical: 24,
    gap: 16,
  },
  headerContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleIcon: {
    // marginTop: 4,
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 11,
    opacity: 0.8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 12,
  },
  filterText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: .5,
  },
  statIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
  },
})