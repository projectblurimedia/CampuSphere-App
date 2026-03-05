import { useState, useEffect, useCallback } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'
import FinancialStats from '@/components/cashflow/financial-stats'
import TransactionCard from '@/components/cashflow/transaction-card'
import QuickActions from '@/components/cashflow/quick-actions'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'

export default function Cashflow() {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    profitMargin: 0
  })
  const [timePeriod, setTimePeriod] = useState('month')
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchDashboardData = useCallback(async (period = timePeriod, showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      // Get date range based on period
      const now = new Date()
      let startDate, endDate
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
          break
        case 'week':
          const day = now.getDay()
          const diff = now.getDate() - day + (day === 0 ? -6 : 1)
          startDate = new Date(now.setDate(diff))
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(now)
          endDate.setDate(startDate.getDate() + 6)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      }

      // Fetch transactions
      const transactionsResponse = await axiosApi.get('/cashflow/date-range', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 15,
          sort: '-date'
        }
      })

      // Check if response has data
      if (!transactionsResponse.data) {
        throw new Error('Invalid response from server')
      }

      const transactionsData = transactionsResponse.data?.data || []
      setTransactions(transactionsData)

      // Calculate stats
      let totalIncome = 0
      let totalExpenses = 0

      transactionsData.forEach(transaction => {
        if (transaction.type === 'Income') {
          totalIncome += transaction.amount || 0
        } else if (transaction.type === 'Expense') {
          totalExpenses += transaction.amount || 0
        }
      })

      const netBalance = totalIncome - totalExpenses
      const profitMargin = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0

      setStats({
        totalIncome,
        totalExpenses,
        netBalance,
        profitMargin
      })

      if (!showLoading && transactionsData.length === 0) {
        showToast('No transactions found for this period', 'info')
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      
      // Set empty data on error
      setTransactions([])
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        profitMargin: 0
      })
      
      // Show error toast
      if (error.response) {
        const status = error.response.status
        if (status === 401) {
          showToast('Unauthorized access. Please login again.', 'error')
        } else if (status === 403) {
          showToast('You do not have permission to view this data', 'error')
        } else if (status === 404) {
          showToast('API endpoint not found', 'error')
        } else if (status >= 500) {
          showToast('Server error. Please try again later.', 'error')
        } else {
          showToast(error.response.data?.message || 'Failed to load dashboard data', 'error')
        }
      } else if (error.request) {
        showToast('Network error. Please check your connection.', 'error')
      } else {
        showToast(error.message || 'An unexpected error occurred', 'error')
      }
    } finally {
      if (showLoading) setLoading(false)
      setRefreshing(false)
    }
  }, [timePeriod])

  useEffect(() => {
    fetchDashboardData()
  }, [timePeriod])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchDashboardData(timePeriod, false)
  }, [timePeriod])

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period)
  }

  const quickActions = [
    {
      title: 'Add Income',
      icon: 'add-circle',
      iconType: 'MaterialIcons',
      bgColor: colors.success,
      route: 'AddIncome'
    },
    {
      title: 'Add Expense',
      icon: 'remove-circle',
      iconType: 'MaterialIcons',
      bgColor: colors.danger,
      route: 'AddExpense'
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      iconType: 'MaterialIcons',
      bgColor: colors.purple || '#8b5cf6',
      route: 'Analytics'
    },
    {
      title: 'Reports',
      icon: 'description',
      iconType: 'MaterialIcons',
      bgColor: colors.warning,
      route: 'Reports'
    }
  ]

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading cashflow details...
          </ThemedText>
        </View>
        
        {/* Toast Notification */}
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={() => setToast(null)}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <FinancialStats 
          totalIncome={stats.totalIncome}
          totalExpenses={stats.totalExpenses}
          netBalance={stats.netBalance}
          profitMargin={stats.profitMargin}
          timePeriod={timePeriod}
          onTimePeriodChange={handleTimePeriodChange}
        />

        <QuickActions 
          actions={quickActions}
        />

        <View style={styles.resultsHeader}>
          <ThemedText type='subtitle' style={[styles.resultsTitle, { color: colors.text }]}>
            Recent Transactions ({transactions.length})
          </ThemedText>
          <ThemedText style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
            Latest 15 records
          </ThemedText>
        </View>

        <FlatList
          data={transactions}
          renderItem={({ item }) => (
            <TransactionCard 
              transaction={item} 
            />
          )}
          keyExtractor={item => item.id || item._id || Math.random().toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Add your first income or expense transaction
              </ThemedText>
            </View>
          }
        />
      </ScrollView>

      {/* Toast Notification */}
      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={() => setToast(null)}
        position="bottom-center"
        duration={3000}
        showCloseButton={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultsSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
})