import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons'
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
  })

  const periods = ['Today', 'This Week', 'This Month', 'This Year']

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
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
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
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    return { startDate, endDate }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()

      // Fetch income data
      const [incomeResponse, expenseResponse, recentResponse, incomeBreakdown, expenseBreakdown] = await Promise.all([
        axiosApi.get('/cashflow/total', {
          params: {
            type: 'Income',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        axiosApi.get('/cashflow/total', {
          params: {
            type: 'Expense',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        axiosApi.get('/cashflow/date-range', {
          params: {
            type: 'All',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        axiosApi.get('/cashflow/breakdown/category', {
          params: {
            type: 'Income',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        axiosApi.get('/cashflow/breakdown/category', {
          params: {
            type: 'Expense',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        })
      ])

      const incomeTotal = incomeResponse.data?.total || 0
      const expenseTotal = expenseResponse.data?.total || 0
      const incomeCount = incomeResponse.data?.count || 0
      const expenseCount = expenseResponse.data?.count || 0
      const netBalance = incomeTotal - expenseTotal
      const netPercentage = incomeTotal > 0 ? (netBalance / incomeTotal * 100).toFixed(1) : 0

      // Find highest single transaction from recent data
      const allTransactions = recentResponse.data || []
      const highestTransaction = allTransactions.reduce((max, transaction) => {
        return transaction.amount > max.amount ? transaction : max
      }, { amount: 0, category: { name: 'N/A' }, type: 'Income' })

      // Find most frequent category
      const categoryCounts = {}
      allTransactions.forEach(transaction => {
        const key = `${transaction.type}_${transaction.category?.name || 'Unknown'}`
        categoryCounts[key] = (categoryCounts[key] || 0) + 1
      })
      
      let mostFrequent = { count: 0, name: 'N/A', type: 'Income' }
      Object.entries(categoryCounts).forEach(([key, count]) => {
        if (count > mostFrequent.count) {
          const [type, name] = key.split('_')
          mostFrequent = { count, name, type }
        }
      })

      setReportData({
        // Income Stats
        incomeTotal,
        incomeTransactions: incomeCount,
        avgIncome: incomeCount > 0 ? incomeTotal / incomeCount : 0,
        topIncomeCategory: incomeBreakdown.data?.[0] ? {
          name: incomeBreakdown.data[0]._id.categoryName,
          amount: incomeBreakdown.data[0].total
        } : { name: 'N/A', amount: 0 },
        
        // Expense Stats
        expenseTotal,
        expenseTransactions: expenseCount,
        avgExpense: expenseCount > 0 ? expenseTotal / expenseCount : 0,
        topExpenseCategory: expenseBreakdown.data?.[0] ? {
          name: expenseBreakdown.data[0]._id.categoryName,
          amount: expenseBreakdown.data[0].total
        } : { name: 'N/A', amount: 0 },
        
        // Net Stats
        netBalance,
        netPercentage,
        
        // Overall Stats
        totalTransactions: incomeCount + expenseCount,
        highestSingleTransaction: {
          amount: highestTransaction.amount,
          category: highestTransaction.category?.name || 'Unknown',
          type: highestTransaction.type
        },
        mostFrequentCategory: mostFrequent,
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
        <ThemedText type="subtitle" style={[styles.statValue, { color: colors.text }]}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </ThemedText>
        {subtitle && (
          <ThemedText style={[styles.statSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </ThemedText>
        )}
      </View>
    </View>
  )

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 55,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
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
      fontSize: 22,
      color: '#FFFFFF',
      fontFamily: 'Poppins-Bold',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
    },
    periodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    periodTextLabel: {
      fontSize: 14,
      color: '#FFFFFF',
      fontFamily: 'Poppins-Medium',
    },
    periodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      minWidth: 120,
    },
    periodText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontFamily: 'Poppins-Medium',
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
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
      marginBottom: 16,
    },
    statCard: {
      minWidth: (SCREEN_WIDTH - 52) / 2,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: .5,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    statContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    statTitle: {
      fontSize: 12,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
    },
    statSubtitle: {
      fontSize: 10,
      marginTop: 2,
    },
    highlightCard: {
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
      justifyContent: 'center',
      alignItems: 'center'
    },
    highlightCardTitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginBottom: 12,
    },
    highlightCardValue: {
      fontSize: 24,
      fontFamily: 'Poppins-Bold',
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
      width: SCREEN_WIDTH * 0.8,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: .5,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
  }), [colors])

  return (
    <Modal
      visible={visible}
      animationType="slide"
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

          <View style={styles.periodRow}>
            <ThemedText style={styles.periodTextLabel}>Period:</ThemedText>
            <TouchableOpacity 
              style={styles.periodButton}
              onPress={() => setShowPeriodDropdown(true)}
            >
              <ThemedText style={styles.periodText}>{period}</ThemedText>
              <Feather name="chevron-down" size={18} color="#FFFFFF" />
            </TouchableOpacity>
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
            {/* Net Balance Highlight Card */}
            <View style={[
              styles.highlightCard, 
              { 
                backgroundColor: reportData.netBalance >= 0 ? '#10b98120' : '#ef444420',
                borderWidth: 2,
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
                {reportData.netBalance >= 0 ? '+' : '-'}₹{Math.abs(reportData.netBalance).toLocaleString()}
              </ThemedText>
              {reportData.incomeTotal > 0 && (
                <ThemedText style={{ 
                  color: reportData.netBalance >= 0 ? '#10b981' : '#ef4444',
                  marginTop: 8,
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium'
                }}>
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
                  subtitle: 'Income entries'
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
                  subtitle: 'Expense entries'
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
                  subtitle: 'All entries'
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
                  value: reportData.expenseTotal > 0 ? (reportData.incomeTotal / reportData.expenseTotal).toFixed(2) : '∞',
                  icon: <FontAwesome5 name="balance-scale" size={24} color="#10b981" />,
                  color: '#10b981',
                  suffix: 'x',
                  subtitle: 'Higher is better'
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Period Dropdown */}
        <Modal
          transparent
          visible={showPeriodDropdown}
          animationType="fade"
          onRequestClose={() => setShowPeriodDropdown(false)}
          statusBarTranslucent
        >
          <View style={[styles.dropdownOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={styles.dropdownContainer}>
              {periods.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownItem,
                    period === item && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setPeriod(item)
                    setShowPeriodDropdown(false)
                  }}
                >
                  <ThemedText style={[
                    styles.dropdownItemText,
                    period === item && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
                  ]}>
                    {item}
                  </ThemedText>
                  {period === item && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  )
}

export default Analytics