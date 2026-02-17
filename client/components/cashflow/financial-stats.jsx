import { View, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useState, useEffect } from 'react'
import axiosApi from '@/utils/axiosApi'

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
  profitMargin = 0,
  timePeriod = 'month',
  onTimePeriodChange = () => {}
}) {
  const { colors } = useTheme()
  const [showFilter, setShowFilter] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriod)
  const [trendData, setTrendData] = useState({
    income: '+0',
    incomePercent: '0%',
    expenses: '-0',
    expensesPercent: '0%',
    balance: '+0',
    balancePercent: '0%',
    margin: '0%'
  })
  const [loadingTrends, setLoadingTrends] = useState(false)
  
  const safeTotalIncome = Number(totalIncome) || 0
  const safeTotalExpenses = Number(totalExpenses) || 0
  const safeNetBalance = Number(netBalance) || 0
  const safeProfitMargin = Number(profitMargin) || 0

  const isPositiveBalance = safeNetBalance >= 0
  const isPositiveMargin = safeProfitMargin >= 0

  useEffect(() => {
    fetchTrendData(selectedPeriod)
  }, [selectedPeriod, totalIncome, totalExpenses])

  const fetchTrendData = async (period) => {
    try {
      setLoadingTrends(true)
      
      // Get previous period date range
      const now = new Date()
      let currentStart, previousStart, previousEnd

      switch (period) {
        case 'day':
          currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
          break
        case 'week':
          const day = now.getDay()
          const diff = now.getDate() - day + (day === 0 ? -6 : 1)
          currentStart = new Date(now.setDate(diff))
          currentStart.setHours(0, 0, 0, 0)
          previousStart = new Date(currentStart)
          previousStart.setDate(previousStart.getDate() - 7)
          previousEnd = new Date(currentStart)
          previousEnd.setDate(previousEnd.getDate() - 1)
          previousEnd.setHours(23, 59, 59, 999)
          break
        case 'month':
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          break
        case 'year':
          currentStart = new Date(now.getFullYear(), 0, 1)
          previousStart = new Date(now.getFullYear() - 1, 0, 1)
          previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
          break
        case 'all':
          // For all time, we can't calculate previous period
          setTrendData({
            income: '+0',
            incomePercent: '0%',
            expenses: '-0',
            expensesPercent: '0%',
            balance: '+0',
            balancePercent: '0%',
            margin: '0%'
          })
          setLoadingTrends(false)
          return
      }

      // Fetch previous period data
      const response = await axiosApi.get('/cashflow/total', {
        params: {
          type: 'All',
          startDate: previousStart.toISOString(),
          endDate: previousEnd.toISOString()
        }
      })

      const previousTotal = response.data?.data?.total || 0
      const previousIncome = response.data?.data?.income || 0
      const previousExpenses = response.data?.data?.expense || 0

      // Calculate percentage changes
      const incomeChange = previousIncome > 0 
        ? ((safeTotalIncome - previousIncome) / previousIncome * 100).toFixed(1)
        : safeTotalIncome > 0 ? '100' : '0'
      
      const expenseChange = previousExpenses > 0
        ? ((safeTotalExpenses - previousExpenses) / previousExpenses * 100).toFixed(1)
        : safeTotalExpenses > 0 ? '100' : '0'

      const balanceChange = previousTotal > 0
        ? ((safeNetBalance - previousTotal) / previousTotal * 100).toFixed(1)
        : safeNetBalance > 0 ? '100' : '0'

      setTrendData({
        income: `${safeTotalIncome >= previousIncome ? '+' : '-'}₹${Math.abs(safeTotalIncome - previousIncome).toLocaleString('en-IN')}`,
        incomePercent: `${incomeChange}%`,
        expenses: `${safeTotalExpenses >= previousExpenses ? '+' : '-'}₹${Math.abs(safeTotalExpenses - previousExpenses).toLocaleString('en-IN')}`,
        expensesPercent: `${expenseChange}%`,
        balance: `${safeNetBalance >= previousTotal ? '+' : '-'}₹${Math.abs(safeNetBalance - previousTotal).toLocaleString('en-IN')}`,
        balancePercent: `${balanceChange}%`,
        margin: `${isPositiveMargin ? '+' : ''}${safeProfitMargin.toFixed(1)}%`
      })

    } catch (error) {
      console.error('Error fetching trend data:', error)
      setTrendData({
        income: '+0',
        incomePercent: '0%',
        expenses: '-0',
        expensesPercent: '0%',
        balance: '+0',
        balancePercent: '0%',
        margin: '0%'
      })
    } finally {
      setLoadingTrends(false)
    }
  }

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
              {loadingTrends ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <>
                  <Ionicons name="arrow-up" size={12} color={colors.success} />
                  <ThemedText style={[styles.trendText, { color: colors.success }]}>
                    {trendData.incomePercent} from last {selectedPeriod}
                  </ThemedText>
                </>
              )}
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
              {loadingTrends ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <Ionicons name="arrow-down" size={12} color={colors.danger} />
                  <ThemedText style={[styles.trendText, { color: colors.danger }]}>
                    {trendData.expensesPercent} from last {selectedPeriod}
                  </ThemedText>
                </>
              )}
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
              ₹{Math.abs(safeNetBalance).toLocaleString('en-IN')}
              {!isPositiveBalance && ' (Loss)'}
            </ThemedText>
            <View style={styles.statTrend}>
              {loadingTrends ? (
                <ActivityIndicator size="small" color={isPositiveBalance ? colors.success : colors.danger} />
              ) : (
                <>
                  <Ionicons 
                    name={isPositiveBalance ? "arrow-up" : "arrow-down"} 
                    size={12} 
                    color={isPositiveBalance ? colors.success : colors.danger} 
                  />
                  <ThemedText style={[styles.trendText, { 
                    color: isPositiveBalance ? colors.success : colors.danger
                  }]}>
                    {trendData.balancePercent} from last {selectedPeriod}
                  </ThemedText>
                </>
              )}
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
              {Math.abs(safeProfitMargin).toFixed(2)}%
              {!isPositiveMargin && ' (Loss)'}
            </ThemedText>
            <View style={styles.statTrend}>
              {loadingTrends ? (
                <ActivityIndicator size="small" color={isPositiveMargin ? colors.success : colors.danger} />
              ) : (
                <>
                  <Ionicons 
                    name={isPositiveMargin ? "arrow-up" : "arrow-down"} 
                    size={12} 
                    color={isPositiveMargin ? colors.success : colors.danger}
                  />
                  <ThemedText style={[styles.trendText, { 
                    color: isPositiveMargin ? colors.success : colors.danger
                  }]}>
                    {trendData.margin} from last {selectedPeriod}
                  </ThemedText>
                </>
              )}
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
  titleIcon: {},
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