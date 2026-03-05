import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const Analytics = ({ visible, onClose }) => {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('This Month')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [reportData, setReportData] = useState({
    // Income Stats
    incomeTotal: 0,
    incomeTransactions: 0,
    avgIncome: 0,
    topIncomeCategory: { name: 'N/A', amount: 0 },
    
    // Expense Stats
    expenseTotal: 0,
    expenseTransactions: 0,
    avgExpense: 0,
    topExpenseCategory: { name: 'N/A', amount: 0 },
    
    // Net Stats
    netBalance: 0,
    netPercentage: 0,
    
    // Overall Stats
    totalTransactions: 0,
    highestSingleTransaction: { amount: 0, category: 'N/A', type: 'Income' },
    mostFrequentCategory: { name: 'N/A', count: 0, type: 'Income' },
    incomeExpenseRatio: 0,
  })

  const periods = [
    { 
      label: 'Today', 
      value: 'Today', 
      icon: 'calendar-today',
      color: '#58a6e2'
    },
    { 
      label: 'This Week', 
      value: 'This Week', 
      icon: 'calendar-week',
      color: '#f65ce9'
    },
    { 
      label: 'This Month', 
      value: 'This Month', 
      icon: 'calendar-month',
      color: '#10b981'
    },
    { 
      label: 'This Year', 
      value: 'This Year', 
      icon: 'calendar',
      color: '#f59e0b'
    }
  ]

  useEffect(() => {
    if (visible) {
      fetchAnalyticsData()
    }
  }, [visible, period])

  const getDateRange = () => {
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        break
      case 'This Week':
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        startDate = new Date(now.setDate(diff))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    return { startDate, endDate }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()
      const startISO = startDate.toISOString()
      const endISO = endDate.toISOString()

      // Fetch all data in parallel
      const [
        incomeResponse,
        expenseResponse,
        recentResponse,
        incomeBreakdown,
        expenseBreakdown
      ] = await Promise.all([
        axiosApi.get('/cashflow/total', {
          params: {
            type: 'Income',
            startDate: startISO,
            endDate: endISO
          }
        }),
        axiosApi.get('/cashflow/total', {
          params: {
            type: 'Expense',
            startDate: startISO,
            endDate: endISO
          }
        }),
        axiosApi.get('/cashflow/date-range', {
          params: {
            type: 'All',
            startDate: startISO,
            endDate: endISO,
            limit: 100
          }
        }),
        axiosApi.get('/cashflow/breakdown/category', {
          params: {
            type: 'Income',
            startDate: startISO,
            endDate: endISO
          }
        }),
        axiosApi.get('/cashflow/breakdown/category', {
          params: {
            type: 'Expense',
            startDate: startISO,
            endDate: endISO
          }
        })
      ])

      // Safely extract data
      const incomeTotal = incomeResponse.data?.data?.total || 0
      const expenseTotal = expenseResponse.data?.data?.total || 0
      const incomeCount = incomeResponse.data?.data?.count || 0
      const expenseCount = expenseResponse.data?.data?.count || 0
      const netBalance = incomeTotal - expenseTotal
      const netPercentage = incomeTotal > 0 ? ((netBalance / incomeTotal) * 100).toFixed(1) : 0
      const incomeExpenseRatio = expenseTotal > 0 ? (incomeTotal / expenseTotal).toFixed(2) : '∞'

      // Process transactions for highest and most frequent
      const allTransactions = recentResponse.data?.data || []
      
      // Find highest single transaction
      const highestTransaction = allTransactions.reduce((max, transaction) => {
        return (transaction.amount || 0) > (max.amount || 0) ? transaction : max
      }, { amount: 0, category: { name: 'N/A' }, type: 'Income' })

      // Find most frequent category
      const categoryCountMap = new Map()
      allTransactions.forEach(transaction => {
        const type = transaction.type || 'Income'
        const categoryName = transaction.category?.name || 'Unknown'
        const key = `${type}_${categoryName}`
        categoryCountMap.set(key, (categoryCountMap.get(key) || 0) + 1)
      })
      
      let mostFrequent = { count: 0, name: 'N/A', type: 'Income' }
      categoryCountMap.forEach((count, key) => {
        if (count > mostFrequent.count) {
          const [type, name] = key.split('_')
          mostFrequent = { count, name, type }
        }
      })

      // Get top categories
      const topIncomeCategory = incomeBreakdown.data?.data?.[0] ? {
        name: incomeBreakdown.data.data[0].categoryName || 'N/A',
        amount: incomeBreakdown.data.data[0].total || 0
      } : { name: 'N/A', amount: 0 }

      const topExpenseCategory = expenseBreakdown.data?.data?.[0] ? {
        name: expenseBreakdown.data.data[0].categoryName || 'N/A',
        amount: expenseBreakdown.data.data[0].total || 0
      } : { name: 'N/A', amount: 0 }

      setReportData({
        // Income Stats
        incomeTotal,
        incomeTransactions: incomeCount,
        avgIncome: incomeCount > 0 ? incomeTotal / incomeCount : 0,
        topIncomeCategory,
        
        // Expense Stats
        expenseTotal,
        expenseTransactions: expenseCount,
        avgExpense: expenseCount > 0 ? expenseTotal / expenseCount : 0,
        topExpenseCategory,
        
        // Net Stats
        netBalance,
        netPercentage,
        
        // Overall Stats
        totalTransactions: incomeCount + expenseCount,
        highestSingleTransaction: {
          amount: highestTransaction.amount || 0,
          category: highestTransaction.category?.name || 'Unknown',
          type: highestTransaction.type || 'Income'
        },
        mostFrequentCategory: mostFrequent,
        incomeExpenseRatio,
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStatCard = ({ title, value, icon, color, suffix = '', prefix = '', subtitle = '' }) => (
    <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <ThemedText style={[styles.statTitle, { color: colors.textSecondary }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.statValue, { color: colors.text }]}>
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}{suffix}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.statSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  )

  const renderDropdown = (items, selectedValue, onSelect, visible, onClose, title) => (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={[styles.dropdownOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={styles.dropdownContainer}
        >
          <View style={styles.dropdownHeader}>
            <ThemedText style={styles.dropdownTitle}>{title}</ThemedText>
          </View>

          <ScrollView style={styles.dropdownList}>
            {items.map((item) => {
              const isSelected = selectedValue === item.value
              const label = item.label
              const icon = item.icon
              const color = item.color || '#FFFFFF'

              return (
                <TouchableOpacity
                  key={item.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(item.value)
                    onClose()
                  }}
                >
                  <View style={styles.dropdownItemLeft}>
                    <View style={[styles.dropdownIcon, { backgroundColor: `${color}30` }]}>
                      <MaterialCommunityIcons name={icon} size={18} color={color} />
                    </View>
                    <ThemedText style={[
                      styles.dropdownItemText,
                      isSelected && { fontFamily: 'Poppins-SemiBold' }
                    ]}>
                      {label}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <View style={styles.dropdownCheck}>
                      <Feather name="check" size={14} color="#5053ee" />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </LinearGradient>
      </TouchableOpacity>
    </Modal>
  )

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 75 : 55,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    subtitle: {
      marginTop: 2,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    periodContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    periodLabel: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    periodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      minWidth: 140,
    },
    periodText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      width: (SCREEN_WIDTH - 52) / 2,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 0.5,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statTitle: {
      fontSize: 12,
      marginBottom: 4,
      textAlign: 'center',
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
    },
    statSubtitle: {
      fontSize: 10,
      marginTop: 2,
      textAlign: 'center',
    },
    highlightCard: {
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      borderWidth: 2,
      alignItems: 'center',
    },
    highlightCardTitle: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 12,
    },
    highlightCardValue: {
      fontSize: 30,
      fontFamily: 'Poppins-SemiBold',
    },
    highlightSubtext: {
      marginTop: 8,
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownContainer: {
      width: SCREEN_WIDTH * 0.85,
      maxHeight: SCREEN_WIDTH * 0.8,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 5,
    },
    dropdownHeader: {
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    dropdownTitle: {
      fontSize: 17,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    dropdownList: {
      maxHeight: 400,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    dropdownItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    dropdownIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownItemText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
      flex: 1,
    },
    dropdownCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
  }), [colors])

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>Financial Analytics</ThemedText>
              <ThemedText style={styles.subtitle}>Comprehensive financial reports</ThemedText>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: 16, color: colors.textSecondary }}>
              Loading analytics data...
            </ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Period Selector - Inside ScrollView */}
            <View style={styles.periodContainer}>
              <ThemedText style={styles.periodLabel}>Period:</ThemedText>
              <TouchableOpacity 
                style={styles.periodButton}
                onPress={() => setShowPeriodDropdown(true)}
              >
                <ThemedText style={styles.periodText}>{period}</ThemedText>
                <Feather name="chevron-down" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Net Balance Highlight Card */}
            <View style={[
              styles.highlightCard, 
              { 
                backgroundColor: reportData.netBalance >= 0 ? '#10b98110' : '#ef444410',
                borderColor: reportData.netBalance >= 0 ? '#10b98140' : '#ef444440'
              }
            ]}>
              <ThemedText style={[styles.highlightCardTitle, { 
                color: reportData.netBalance >= 0 ? '#10b981' : '#ef4444' 
              }]}>
                NET BALANCE ({reportData.netBalance >= 0 ? 'PROFIT' : 'LOSS'})
              </ThemedText>
              <ThemedText style={[styles.highlightCardValue, { 
                color: reportData.netBalance >= 0 ? '#10b981' : '#ef4444' 
              }]}>
                {reportData.netBalance >= 0 ? '+' : '-'}₹{Math.abs(reportData.netBalance).toLocaleString('en-IN')}
              </ThemedText>
              {reportData.incomeTotal > 0 && (
                <ThemedText style={[styles.highlightSubtext, { 
                  color: reportData.netBalance >= 0 ? '#10b981' : '#ef4444' 
                }]}>
                  {reportData.netPercentage >= 0 ? '+' : ''}{reportData.netPercentage}% of income
                </ThemedText>
              )}
            </View>

            {/* Income Section */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Income Overview</ThemedText>
              <View style={styles.statsGrid}>
                {renderStatCard({
                  title: 'Total Income',
                  value: reportData.incomeTotal,
                  icon: <Feather name="trending-up" size={24} color="#10b981" />,
                  color: '#10b981',
                  prefix: '₹'
                })}

                {renderStatCard({
                  title: 'Transactions',
                  value: reportData.incomeTransactions,
                  icon: <MaterialIcons name="receipt" size={24} color="#10b981" />,
                  color: '#10b981',
                })}

                {renderStatCard({
                  title: 'Avg/Transaction',
                  value: reportData.avgIncome,
                  icon: <FontAwesome5 name="rupee-sign" size={24} color="#10b981" />,
                  color: '#10b981',
                  prefix: '₹'
                })}

                {renderStatCard({
                  title: 'Top Category',
                  value: reportData.topIncomeCategory.amount,
                  icon: <Feather name="award" size={24} color="#f59e0b" />,
                  color: '#f59e0b',
                  prefix: '₹',
                  subtitle: reportData.topIncomeCategory.name
                })}
              </View>
            </View>

            {/* Expense Section */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Expense Overview</ThemedText>
              <View style={styles.statsGrid}>
                {renderStatCard({
                  title: 'Total Expense',
                  value: reportData.expenseTotal,
                  icon: <Feather name="trending-down" size={24} color="#ef4444" />,
                  color: '#ef4444',
                  prefix: '₹'
                })}

                {renderStatCard({
                  title: 'Transactions',
                  value: reportData.expenseTransactions,
                  icon: <MaterialIcons name="receipt" size={24} color="#ef4444" />,
                  color: '#ef4444',
                })}

                {renderStatCard({
                  title: 'Avg/Transaction',
                  value: reportData.avgExpense,
                  icon: <FontAwesome5 name="rupee-sign" size={24} color="#ef4444" />,
                  color: '#ef4444',
                  prefix: '₹'
                })}

                {renderStatCard({
                  title: 'Top Category',
                  value: reportData.topExpenseCategory.amount,
                  icon: <Feather name="award" size={24} color="#f59e0b" />,
                  color: '#f59e0b',
                  prefix: '₹',
                  subtitle: reportData.topExpenseCategory.name
                })}
              </View>
            </View>

            {/* Overall Statistics */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Overall Statistics</ThemedText>
              <View style={styles.statsGrid}>
                {renderStatCard({
                  title: 'Total Transactions',
                  value: reportData.totalTransactions,
                  icon: <MaterialIcons name="swap-vert" size={24} color="#8b5cf6" />,
                  color: '#8b5cf6',
                })}

                {renderStatCard({
                  title: 'Highest Transaction',
                  value: reportData.highestSingleTransaction.amount,
                  icon: <Feather name="maximize-2" size={24} color="#f59e0b" />,
                  color: '#f59e0b',
                  prefix: '₹',
                  subtitle: `${reportData.highestSingleTransaction.category} (${reportData.highestSingleTransaction.type})`
                })}

                {renderStatCard({
                  title: 'Most Frequent',
                  value: reportData.mostFrequentCategory.count,
                  icon: <Feather name="repeat" size={24} color="#3b82f6" />,
                  color: '#3b82f6',
                  subtitle: `${reportData.mostFrequentCategory.name} (${reportData.mostFrequentCategory.type})`
                })}

                {renderStatCard({
                  title: 'Income/Expense Ratio',
                  value: reportData.incomeExpenseRatio,
                  icon: <FontAwesome5 name="balance-scale" size={24} color="#10b981" />,
                  color: '#10b981',
                  suffix: 'x',
                  subtitle: 'Higher is better'
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Period Dropdown Modal with Icons */}
        {renderDropdown(
          periods,
          period,
          setPeriod,
          showPeriodDropdown,
          () => setShowPeriodDropdown(false),
          'Select Period'
        )}
      </View>
    </Modal>
  )
}

export default Analytics