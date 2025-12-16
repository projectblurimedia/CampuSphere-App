import { useState } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  FlatList,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'
import FinancialStats from '@/components/cashflow/financial-stats'
import TransactionCard from '@/components/cashflow/transaction-card'
import TimeFilter from '@/components/cashflow/time-filter'
import CategoryFilter from '@/components/cashflow/category-filter'
import IncomeExpenseChart from '@/components/cashflow/income-expense-chart'
import QuickActions from '@/components/cashflow/quick-actions'

const transactionsData = [
  {
    id: '1',
    type: 'income',
    category: 'Tuition Fees',
    description: 'Monthly tuition fees - December',
    amount: 485000,
    date: 'Dec 5, 2024',
    paymentMethod: 'Online',
    reference: 'TXN-001234',
    status: 'Completed'
  },
  {
    id: '2',
    type: 'expense',
    category: 'Salaries',
    description: 'Teaching staff salaries - November',
    amount: 320000,
    date: 'Dec 1, 2024',
    paymentMethod: 'Bank Transfer',
    reference: 'SAL-112024',
    status: 'Completed'
  },
  {
    id: '3',
    type: 'expense',
    category: 'Infrastructure',
    description: 'Computer lab equipment',
    amount: 125000,
    date: 'Nov 28, 2024',
    paymentMethod: 'Cheque',
    reference: 'INF-00456',
    status: 'Completed'
  },
  {
    id: '4',
    type: 'income',
    category: 'Admission Fees',
    description: 'New student admission fees',
    amount: 75000,
    date: 'Nov 25, 2024',
    paymentMethod: 'Cash',
    reference: 'ADM-1124',
    status: 'Completed'
  },
  {
    id: '5',
    type: 'expense',
    category: 'Utilities',
    description: 'Electricity & Water bills',
    amount: 45000,
    date: 'Nov 20, 2024',
    paymentMethod: 'Online',
    reference: 'UTL-112024',
    status: 'Completed'
  },
  {
    id: '6',
    type: 'income',
    category: 'Donations',
    description: 'Annual alumni donation',
    amount: 100000,
    date: 'Nov 15, 2024',
    paymentMethod: 'Bank Transfer',
    reference: 'DON-1124',
    status: 'Pending'
  },
  {
    id: '7',
    type: 'expense',
    category: 'Maintenance',
    description: 'School building maintenance',
    amount: 35000,
    date: 'Nov 10, 2024',
    paymentMethod: 'Cash',
    reference: 'MNT-1124',
    status: 'Completed'
  },
  {
    id: '8',
    type: 'income',
    category: 'Transport Fees',
    description: 'Monthly bus fees collection',
    amount: 65000,
    date: 'Nov 5, 2024',
    paymentMethod: 'Online',
    reference: 'TRN-1124',
    status: 'Completed'
  },
  {
    id: '9',
    type: 'expense',
    category: 'Stationery',
    description: 'Books and stationery supplies',
    amount: 28000,
    date: 'Nov 2, 2024',
    paymentMethod: 'Cheque',
    reference: 'STN-1124',
    status: 'Completed'
  },
  {
    id: '10',
    type: 'income',
    category: 'Examination Fees',
    description: 'Annual examination fees',
    amount: 120000,
    date: 'Oct 28, 2024',
    paymentMethod: 'Online',
    reference: 'EXM-1024',
    status: 'Completed'
  },
]

const chartData = [
  { month: 'Jul', income: 420000, expenses: 380000 },
  { month: 'Aug', income: 450000, expenses: 395000 },
  { month: 'Sep', income: 480000, expenses: 410000 },
  { month: 'Oct', income: 510000, expenses: 425000 },
  { month: 'Nov', income: 540000, expenses: 460000 },
  { month: 'Dec', income: 585000, expenses: 485000 },
]

const timeFilters = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
]

const categories = ['All', 'Income', 'Expenses', 'Tuition', 'Salaries', 'Infrastructure', 'Utilities']

export default function Cashflow() {
  const { colors, isDark } = useTheme()
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const dashboardColors = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e9ecef',
    success: isDark ? '#34d399' : '#10b981',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    info: isDark ? '#60a5fa' : '#3b82f6',
    danger: isDark ? '#f87171' : '#ef4444',
    purple: isDark ? '#a78bfa' : '#8b5cf6',
    cyan: isDark ? '#22d3ee' : '#06b6d4',
  }

  const totalIncome = transactionsData
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpenses = transactionsData
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const netBalance = totalIncome - totalExpenses

  const filteredTransactions = transactionsData.filter(transaction => {
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Income' && transaction.type !== 'income') return false
      if (selectedCategory === 'Expenses' && transaction.type !== 'expense') return false
      if (!['Income', 'Expenses'].includes(selectedCategory) && 
          transaction.category !== selectedCategory) return false
    }
    
    return true
  })

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FinancialStats 
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netBalance={netBalance}
          dashboardColors={dashboardColors}
        />

        <QuickActions 
          dashboardColors={dashboardColors}
        />

        <IncomeExpenseChart 
          data={chartData}
          dashboardColors={dashboardColors}
        />

        <TimeFilter 
          timeFilters={timeFilters}
          selectedFilter={selectedTimeFilter}
          setSelectedFilter={setSelectedTimeFilter}
          dashboardColors={dashboardColors}
        />

        <CategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dashboardColors={dashboardColors}
        />

        <View style={styles.resultsHeader}>
          <ThemedText type='subtitle' style={[styles.resultsTitle, { color: colors.text }]}>
            Recent Transactions ({filteredTransactions.length})
          </ThemedText>
          <ThemedText style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
            Sorted by: Latest
          </ThemedText>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => (
            <TransactionCard 
              transaction={item} 
              dashboardColors={dashboardColors} 
            />
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Try changing your filter criteria
              </ThemedText>
            </View>
          }
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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