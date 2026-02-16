import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import { schoolInfo, generateCashflowReportHTML } from './cashflowReportHtml'
import CashflowForm from './CashflowForm'
import ConfirmationModal from './ConfirmationModal'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const Reports = ({ visible, onClose }) => {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchingCategories, setFetchingCategories] = useState(false)
  const [fetchingItems, setFetchingItems] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Toast notification
  const [toast, setToast] = useState(null)

  // Selected transaction for modal
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  // Edit mode
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)

  // Delete confirmation modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)

  // Filters
  const [type, setType] = useState('All')
  const [category, setCategory] = useState({ _id: null, name: 'All Categories' })
  const [item, setItem] = useState({ _id: null, name: 'All Items' })
  const [dateRange, setDateRange] = useState('Month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())

  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false)
  const [datePickerFor, setDatePickerFor] = useState('start')

  // Data
  const [categories, setCategories] = useState([{ _id: null, name: 'All Categories' }])
  const [items, setItems] = useState([{ _id: null, name: 'All Items' }])
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({ 
    total: 0, 
    count: 0, 
    avg: 0,
    totalIncome: 0,
    totalExpense: 0,
    incomeCount: 0,
    expenseCount: 0,
    netBalance: 0
  })
  const [pagination, setPagination] = useState({
    current: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    limit: 50
  })

  const types = [
    { label: 'All', value: 'All', color: '#3b82f6', icon: 'swap-vert' },
    { label: 'Income', value: 'Income', color: '#10b981', icon: 'trending-up' },
    { label: 'Expense', value: 'Expense', color: '#ef4444', icon: 'trending-down' }
  ]

  const dateRanges = [
    { label: 'Today', value: 'Today', icon: 'calendar-today' },
    { label: 'Month', value: 'Month', icon: 'calendar-month' },
    { label: 'Year', value: 'Year', icon: 'calendar-today' },
    { label: 'Custom Range', value: 'Custom Range', icon: 'calendar-month' }
  ]

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Generate years
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  useEffect(() => {
    if (visible) {
      initializeDates()
      fetchCategories()
    }
  }, [visible])

  useEffect(() => {
    setCategory({ _id: null, name: 'All Categories' })
    setItem({ _id: null, name: 'All Items' })
    fetchCategories()
  }, [type])

  useEffect(() => {
    if (category._id) {
      fetchItems()
    } else {
      setItems([{ _id: null, name: 'All Items' }])
      setItem({ _id: null, name: 'All Items' })
    }
  }, [category._id])

  useEffect(() => {
    if (visible) {
      fetchRecords(1)
    }
  }, [
    type,
    category._id,
    item._id,
    dateRange,
    selectedDate,
    startDate,
    endDate
  ])

  const initializeDates = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setSelectedDate(today)
    setStartDate(firstDayOfMonth)
    setEndDate(lastDayOfMonth)
    setDateRange('Month')
  }

  const fetchCategories = async () => {
    try {
      setFetchingCategories(true)
      const response = await axiosApi.get('/cashflow/dropdown/categories', {
        params: { type: type === 'All' ? undefined : type }
      })

      const categoryList = (response.data?.data || [])
        .filter(cat => cat._id !== null)
        .map(cat => ({
          _id: cat._id,
          name: cat.name,
          type: cat.type
        }))

      setCategories([
        { _id: null, name: 'All Categories' },
        ...categoryList
      ])
    } catch (error) {
      console.error('Error fetching categories:', error)
      showToast('Failed to load categories', 'error')
    } finally {
      setFetchingCategories(false)
    }
  }

  const fetchItems = async () => {
    try {
      setFetchingItems(true)
      const response = await axiosApi.get('/cashflow/dropdown/items', {
        params: { categoryId: category._id }
      })

      const itemList = (response.data?.data || [])
        .filter(item => item._id !== null)
        .map(item => ({
          _id: item._id,
          name: item.name,
          categoryId: item.categoryId
        }))

      setItems([
        { _id: null, name: 'All Items' },
        ...itemList
      ])
    } catch (error) {
      console.error('Error fetching items:', error)
      showToast('Failed to load items', 'error')
    } finally {
      setFetchingItems(false)
    }
  }

  const getDateParams = useCallback(() => {
    const params = {}

    switch (dateRange) {
      case 'Today':
        params.startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
        params.endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999)
        break
      case 'Month':
        params.startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        params.endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'Year':
        params.startDate = new Date(selectedDate.getFullYear(), 0, 1)
        params.endDate = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      case 'Custom Range':
        params.startDate = new Date(startDate)
        params.endDate = new Date(endDate)
        params.endDate.setHours(23, 59, 59, 999)
        break
      default:
        params.startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        params.endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    return {
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString()
    }
  }, [dateRange, selectedDate, startDate, endDate])

  const fetchRecords = async (page = 1, showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const { startDate: start, endDate: end } = getDateParams()

      const response = await axiosApi.get('/cashflow/filtered', {
        params: {
          type: type === 'All' ? undefined : type,
          categoryId: category._id || undefined,
          itemId: item._id || undefined,
          period: dateRange,
          startDate: start,
          endDate: end,
          page,
          limit: 50
        }
      })

      const responseData = response.data || {}
      const recordsList = responseData.data || []
      
      setRecords(recordsList)
      
      // Calculate detailed summary
      let totalIncome = 0
      let totalExpense = 0
      let incomeCount = 0
      let expenseCount = 0

      recordsList.forEach(record => {
        if (record.type === 'Income') {
          totalIncome += record.amount || 0
          incomeCount++
        } else if (record.type === 'Expense') {
          totalExpense += record.amount || 0
          expenseCount++
        }
      })

      const total = recordsList.reduce((sum, record) => sum + (record.amount || 0), 0)
      const count = recordsList.length
      const avg = count > 0 ? total / count : 0
      const netBalance = totalIncome - totalExpense

      setSummary({ 
        total, 
        count, 
        avg,
        totalIncome,
        totalExpense,
        incomeCount,
        expenseCount,
        netBalance
      })
      
      // Set pagination
      if (responseData.pagination) {
        setPagination(responseData.pagination)
      }
    } catch (error) {
      console.error('Error fetching records:', error)
      setRecords([])
      setSummary({ 
        total: 0, 
        count: 0, 
        avg: 0,
        totalIncome: 0,
        totalExpense: 0,
        incomeCount: 0,
        expenseCount: 0,
        netBalance: 0
      })
      showToast('Failed to load records', 'error')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchRecords(1, false)
    setRefreshing(false)
  }, [type, category, item, dateRange, selectedDate, startDate, endDate])

  const fetchAllRecordsForPDF = async () => {
    try {
      const { startDate: start, endDate: end } = getDateParams()

      const response = await axiosApi.get('/cashflow/date-range', {
        params: {
          type: type === 'All' ? undefined : type,
          categoryId: category._id || undefined,
          itemId: item._id || undefined,
          startDate: start,
          endDate: end,
          limit: 1000 // Fetch up to 1000 records
        }
      })

      return response.data?.data || []
    } catch (error) {
      console.error('Error fetching records for PDF:', error)
      throw error
    }
  }

  const generatePDFData = async () => {
    // Fetch all records for the PDF
    const allRecords = await fetchAllRecordsForPDF()

    if (allRecords.length === 0) {
      showToast('No records to generate PDF for the selected filters', 'warning')
      return null
    }

    // Calculate summary for all records
    let totalIncome = 0
    let totalExpense = 0
    let incomeCount = 0
    let expenseCount = 0

    allRecords.forEach(record => {
      if (record.type === 'Income') {
        totalIncome += record.amount || 0
        incomeCount++
      } else if (record.type === 'Expense') {
        totalExpense += record.amount || 0
        expenseCount++
      }
    })

    const total = allRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
    const count = allRecords.length
    const avg = count > 0 ? total / count : 0
    const netBalance = totalIncome - totalExpense

    // Prepare data for PDF
    return {
      records: allRecords,
      summary: {
        total,
        count,
        avg,
        totalIncome,
        totalExpense,
        incomeCount,
        expenseCount,
        netBalance
      },
      filters: {
        type: type === 'All' ? 'All Types' : type,
        category: category.name,
        item: item.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      dateRange: dateRange,
      generatedAt: new Date(),
      schoolInfo: schoolInfo
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true)

      const pdfData = await generatePDFData()
      
      if (!pdfData) return

      const htmlContent = generateCashflowReportHTML(pdfData)

      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent,
        fileName: `cashflow_report_${new Date().getTime()}.pdf`
      })

      await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf', 
        dialogTitle: 'Share PDF Report',
      })

      showToast('PDF generated successfully', 'success')

    } catch (error) {
      console.error('Error generating PDF:', error)
      showToast('Failed to generate PDF: ' + error.message, 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrintPDF = async () => {
    try {
      setPrinting(true)

      const pdfData = await generatePDFData()
      
      if (!pdfData) return

      const htmlContent = generateCashflowReportHTML(pdfData)

      // Print the report directly
      await Print.printAsync({
        html: htmlContent,
        printerUrl: null, // Use default printer
      })

    } catch (error) {
      console.error('Error printing PDF:', error)
      showToast('Failed to print: ' + error.message, 'error')
    } finally {
      setPrinting(false)
    }
  }

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false)
    setTimeout(() => {
      setSelectedTransaction(null)
    }, 300)
  }

  const handleEditTransaction = () => {
    setEditingTransaction(selectedTransaction)
    setShowEditForm(true)
    handleCloseTransactionModal()
  }

  const handleDeleteTransaction = () => {
    setTransactionToDelete(selectedTransaction)
    setShowDeleteConfirmation(true)
    handleCloseTransactionModal()
  }

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      setDeleteLoading(true)
      
      // Call API to delete transaction
      await axiosApi.delete(`/cashflow/${transactionToDelete.id || transactionToDelete._id}`)
      
      // Refresh records
      await fetchRecords(pagination.current)
      
      // Show success message
      showToast('Transaction deleted successfully', 'success')
      
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showToast('Failed to delete transaction', 'error')
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirmation(false)
      setTransactionToDelete(null)
    }
  }

  const handleEditComplete = () => {
    setShowEditForm(false)
    setEditingTransaction(null)
    // Refresh records after edit
    fetchRecords(pagination.current)
    showToast('Transaction updated successfully', 'success')
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(false)
    if (date) {
      if (dateRange === 'Today') {
        setSelectedDate(date)
      } else if (datePickerFor === 'start') {
        setStartDate(date)
        if (date > endDate) {
          setEndDate(date)
        }
      } else {
        setEndDate(date)
        if (date < startDate) {
          setStartDate(date)
        }
      }
    }
  }

  const handleMonthSelect = (monthIndex) => {
    setShowMonthPicker(false)
    const newDate = new Date(selectedDate)
    newDate.setMonth(monthIndex)
    setSelectedDate(newDate)
  }

  const handleYearSelect = (year) => {
    setShowYearPicker(false)
    const newDate = new Date(selectedDate)
    newDate.setFullYear(year)
    setSelectedDate(newDate)
  }

  const handleDateButtonPress = () => {
    if (dateRange === 'Today') {
      setShowDatePicker(true)
    } else if (dateRange === 'Month') {
      setShowMonthPicker(true)
    } else if (dateRange === 'Year') {
      setShowYearPicker(true)
    } else if (dateRange === 'Custom Range') {
      setShowCustomRangeModal(true)
    }
  }

  const handleLoadMore = () => {
    if (pagination.hasNext && !loading) {
      fetchRecords(pagination.current + 1)
    }
  }

  const renderFilterButton = ({ icon, label, onPress, disabled = false, customStyle = {} }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: colors.cardBackground },
        disabled && { opacity: 0.5 },
        customStyle
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.filterButtonContent}>
        <MaterialIcons name={icon} size={18} color={disabled ? colors.textSecondary : colors.text} />
        <ThemedText style={[
          styles.filterButtonText,
          { color: disabled ? colors.textSecondary : colors.text }
        ]} numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <Feather name="chevron-down" size={16} color={disabled ? colors.textSecondary : colors.text} />
    </TouchableOpacity>
  )

  const renderRecordItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handleTransactionPress(item)}
      style={[styles.recordItem, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.recordRow}>
        <View style={[
          styles.recordIcon,
          { backgroundColor: item.type === 'Income' ? '#10b981' : '#ef4444' }
        ]}>
          <Feather
            name={item.type === 'Income' ? 'trending-up' : 'trending-down'}
            size={18}
            color={'aliceblue'}
          />
        </View>
        <ThemedText style={[styles.recordCategory, { color: colors.text }]}>
          {item.category?.name || 'Unknown'}
        </ThemedText>
        <ThemedText style={[styles.recordDate, { color: colors.textSecondary }]}>
          {new Date(item.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </ThemedText>
      </View>
      <View style={styles.recordRow}>
        <ThemedText style={[styles.recordItemName, { color: colors.text }]}>
          {item.item?.name || 'Unknown'}
        </ThemedText>
        <ThemedText style={[styles.recordQuantity, { color: colors.textSecondary }]}>
          Qty: {item.quantity}
        </ThemedText>
      </View>
      {item.description && (
        <ThemedText style={[styles.recordDescription, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.description}
        </ThemedText>
      )}
      <View style={styles.recordBottomRow}>
        <ThemedText style={[styles.recordPerson, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.person}
        </ThemedText>
        <ThemedText style={[styles.recordAmount, {
          color: item.type === 'Income' ? '#10b981' : '#ef4444'
        }]}>
          {item.type === 'Income' ? '+' : '-'}₹{item.amount.toLocaleString()}
        </ThemedText>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="file-text" size={48} color={colors.textSecondary} />
      <ThemedText style={styles.emptyText}>
        No transactions found for selected filters
      </ThemedText>
    </View>
  )

  const getAppliedDisplayDate = () => {
    if (dateRange === 'Today') {
      return selectedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } else if (dateRange === 'Month') {
      return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    } else if (dateRange === 'Year') {
      return selectedDate.getFullYear().toString()
    } else if (dateRange === 'Custom Range') {
      return `${startDate.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })} - ${endDate.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })}`
    }
    return dateRange
  }

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
      fontSize: 20,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 100,
    },
    filtersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    filterButton: {
      width: (SCREEN_WIDTH - 52) / 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    filterButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    filterButtonText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      flex: 1,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    recordsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    recordsTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    recordsCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    recordItem: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    recordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    recordBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    recordIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    recordCategory: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      flex: 1,
    },
    recordDate: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    recordItemName: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      flex: 1,
    },
    recordQuantity: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    recordDescription: {
      fontSize: 13,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    recordPerson: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      flex: 1,
      marginRight: 8,
    },
    recordAmount: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      minHeight: 200,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      fontFamily: 'Poppins-Medium',
    },
    dropdownOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownContainer: {
      width: SCREEN_WIDTH * 0.85,
      maxHeight: SCREEN_HEIGHT * 0.7,
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
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    pickerModal: {
      width: SCREEN_WIDTH * .9,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 5,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    pickerTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      padding: 20,
      gap: 10,
    },
    monthItem: {
      width: (SCREEN_WIDTH * 0.9 - 80) / 3,
      height: 70,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    monthItemSelected: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
    },
    monthText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
    },
    monthTextSelected: {
      color: '#5053ee',
      fontFamily: 'Poppins-SemiBold',
    },
    yearList: {
      maxHeight: 300,
      paddingHorizontal: 20,
    },
    yearItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.15)',
      borderRadius: 8,
      marginBottom: 4,
    },
    yearItemSelected: {
      backgroundColor: '#FFFFFF',
    },
    yearText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
    },
    yearTextSelected: {
      color: '#5053ee',
      fontFamily: 'Poppins-SemiBold',
    },
    customRangeModal: {
      width: SCREEN_WIDTH * 0.9,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 5,
    },
    customRangeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    customRangeTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    datePickerContainer: {
      gap: 20,
      marginBottom: 30,
    },
    datePickerSection: {
      gap: 8,
    },
    datePickerLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      marginLeft: 4,
      color: '#FFFFFF',
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    datePickerText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
    },
    customRangeButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    customRangeButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
      backgroundColor: 'transparent',
    },
    applyButton: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    customRangeButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
    errorText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      marginBottom: 20,
      textAlign: 'center',
      color: '#ff6b6b',
    },
    loadMoreButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      backgroundColor: colors.primary + '20',
    },
    loadMoreText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
    // Floating Action Buttons
    floatingButtonsContainer: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      flexDirection: 'row',
      gap: 12,
    },
    floatingButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    downloadButton: {
      backgroundColor: colors.primary,
    },
    printButton: {
      backgroundColor: '#10b981',
    },
    // Transaction Modal Styles
    transactionModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    transactionModalContent: {
      width: SCREEN_WIDTH * 0.9,
      maxHeight: SCREEN_HEIGHT * 0.8,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 5,
    },
    transactionModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    transactionModalTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    transactionScrollView: {
      maxHeight: SCREEN_HEIGHT * 0.6,
      padding: 20,
    },
    transactionTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    transactionTypeText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 8,
    },
    transactionDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    transactionDetailLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
      opacity: 0.7,
    },
    transactionDetailValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
      textAlign: 'right',
      flex: 1,
      marginLeft: 16,
    },
    transactionAmountContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      marginVertical: 16,
      alignItems: 'center',
    },
    transactionAmountLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
      opacity: 0.8,
      marginBottom: 4,
    },
    transactionAmountValue: {
      fontSize: 20,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
    },
    transactionDescriptionBox: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 50,
    },
    transactionDescriptionLabel: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
      opacity: 0.7,
      marginBottom: 8,
    },
    transactionDescriptionText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: '#FFFFFF',
      fontStyle: 'italic',
    },
    transactionModalFooter: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.3)',
    },
    transactionModalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    editButton: {
      backgroundColor: '#3b82f6',
    },
    deleteButton: {
      backgroundColor: '#ef4444',
    },
    transactionModalButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
    },
  }), [colors])

  const datePickerWidth = dateRange === 'Custom Range' ? 
    SCREEN_WIDTH - 40 : (SCREEN_WIDTH - 52) / 2

  const renderDropdown = (items, selectedValue, onSelect, visible, onClose, title, getLabel = (item) => item.label || item.name, getValue = (item) => item.value || item._id) => (
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
              const isSelected = selectedValue === getValue(item)
              const label = getLabel(item)
              const icon = item.icon

              return (
                <TouchableOpacity
                  key={getValue(item)}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(item)
                    onClose()
                  }}
                >
                  <View style={styles.dropdownItemLeft}>
                    {icon && (
                      <View style={styles.dropdownIcon}>
                        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
                      </View>
                    )}
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

  const renderTransactionModal = () => (
    <Modal
      transparent
      visible={showTransactionModal}
      animationType="fade"
      onRequestClose={handleCloseTransactionModal}
      statusBarTranslucent
    >
      <View style={[styles.transactionModalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={styles.transactionModalContent}
        >
          <View style={styles.transactionModalHeader}>
            <ThemedText style={styles.transactionModalTitle}>Transaction Details</ThemedText>
            <TouchableOpacity onPress={handleCloseTransactionModal}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {selectedTransaction && (
            <ScrollView style={styles.transactionScrollView}>
              {/* Type Badge */}
              <View style={[styles.transactionTypeBadge, { 
                backgroundColor: selectedTransaction.type === 'Income' ? '#10b981' : '#ef4444' 
              }]}>
                <Feather 
                  name={selectedTransaction.type === 'Income' ? 'trending-up' : 'trending-down'} 
                  size={24} 
                  color={'#FFFFFF'} 
                />
                <ThemedText style={[styles.transactionTypeText, { 
                  color: '#FFFFFF' 
                }]}>
                  {selectedTransaction.type}
                </ThemedText>
              </View>

              {/* Details */}
              <View style={styles.transactionDetailRow}>
                <ThemedText style={styles.transactionDetailLabel}>Date</ThemedText>
                <ThemedText style={styles.transactionDetailValue}>
                  {new Date(selectedTransaction.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </ThemedText>
              </View>

              <View style={styles.transactionDetailRow}>
                <ThemedText style={styles.transactionDetailLabel}>Category</ThemedText>
                <ThemedText style={styles.transactionDetailValue}>
                  {selectedTransaction.category?.name || 'N/A'}
                </ThemedText>
              </View>

              <View style={styles.transactionDetailRow}>
                <ThemedText style={styles.transactionDetailLabel}>Item</ThemedText>
                <ThemedText style={styles.transactionDetailValue}>
                  {selectedTransaction.item?.name || 'N/A'}
                </ThemedText>
              </View>

              <View style={styles.transactionDetailRow}>
                <ThemedText style={styles.transactionDetailLabel}>Person</ThemedText>
                <ThemedText style={styles.transactionDetailValue}>
                  {selectedTransaction.person || 'N/A'}
                </ThemedText>
              </View>

              <View style={styles.transactionDetailRow}>
                <ThemedText style={styles.transactionDetailLabel}>Payment Method</ThemedText>
                <ThemedText style={styles.transactionDetailValue}>
                  {selectedTransaction.paymentMethod?.replace('_', ' ') || 'CASH'}
                </ThemedText>
              </View>

              <View style={styles.transactionDetailRow}>
                <ThemedText style={styles.transactionDetailLabel}>Quantity</ThemedText>
                <ThemedText style={styles.transactionDetailValue}>
                  {selectedTransaction.quantity || 1}
                </ThemedText>
              </View>

              {/* Amount */}
              <View style={[styles.transactionAmountContainer, { 
                backgroundColor: selectedTransaction.type === 'Income' ? '#10b981' : '#ef4444' 
              }]}>
                <ThemedText style={styles.transactionAmountLabel}>Amount</ThemedText>
                <ThemedText style={styles.transactionAmountValue}>
                  {selectedTransaction.type === 'Income' ? '+' : '-'}₹{selectedTransaction.amount.toLocaleString()}
                </ThemedText>
              </View>

              {/* Description - Only show if exists */}
              {selectedTransaction.description && selectedTransaction.description.trim() !== '' && (
                <View style={[styles.transactionDescriptionBox, { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                }]}>
                  <ThemedText style={styles.transactionDescriptionLabel}>Description</ThemedText>
                  <ThemedText style={styles.transactionDescriptionText}>
                    {selectedTransaction.description}
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          )}

          {/* Edit and Delete Buttons */}
          <View style={styles.transactionModalFooter}>
            <TouchableOpacity
              style={[styles.transactionModalButton, styles.editButton]}
              onPress={handleEditTransaction}
            >
              <Feather name="edit-2" size={18} color="#FFFFFF" />
              <ThemedText style={styles.transactionModalButtonText}>Edit</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.transactionModalButton, styles.deleteButton]}
              onPress={handleDeleteTransaction}
            >
              <Feather name="trash-2" size={18} color="#FFFFFF" />
              <ThemedText style={styles.transactionModalButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  )

  const renderDeleteConfirmationModal = () => (
    <ConfirmationModal
      visible={showDeleteConfirmation}
      onClose={() => {
        setShowDeleteConfirmation(false)
        setTransactionToDelete(null)
      }}
      onConfirm={confirmDeleteTransaction}
      title="Delete Transaction"
      message="Are you sure you want to delete this transaction? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      confirmButtonColor="#ef4444"
      loading={deleteLoading}
    />
  )

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
              <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>Financial Reports</ThemedText>
              <ThemedText style={styles.subtitle}>Detailed transaction reports</ThemedText>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Filters */}
          <View style={styles.filtersContainer}>
            {renderFilterButton({
              icon: types.find(t => t.value === type)?.icon || 'swap-vert',
              label: types.find(t => t.value === type)?.label || 'All',
              onPress: () => setShowTypeDropdown(true)
            })}
            {renderFilterButton({
              icon: 'date-range',
              label: dateRange,
              onPress: () => setShowDateRangeDropdown(true)
            })}
            {renderFilterButton({
              icon: 'category',
              label: category.name.length > 15 ? category.name.substring(0, 12) + '...' : category.name,
              onPress: () => setShowCategoryDropdown(true),
              disabled: fetchingCategories
            })}
            {renderFilterButton({
              icon: 'inventory',
              label: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name,
              onPress: () => setShowItemDropdown(true),
              disabled: !category._id || fetchingItems
            })}
            {renderFilterButton({
              icon: dateRanges.find(d => d.value === dateRange)?.icon || 'calendar-today',
              label: getAppliedDisplayDate(),
              onPress: handleDateButtonPress,
              customStyle: { width: datePickerWidth }
            })}
          </View>

          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Amount</ThemedText>
              <ThemedText style={styles.summaryValue}>
                ₹{summary.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Transactions</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {summary.count}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Average</ThemedText>
              <ThemedText style={styles.summaryValue}>
                ₹{summary.avg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </ThemedText>
            </View>
          </View>

          {/* Records List */}
          <View style={styles.recordsHeader}>
            <ThemedText style={styles.recordsTitle}>
              Transactions
            </ThemedText>
            <ThemedText style={styles.recordsCount}>
              {summary.count} records
            </ThemedText>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : records.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <FlatList
                data={records}
                keyExtractor={(item) => item.id || item._id || Math.random().toString()}
                renderItem={renderRecordItem}
                scrollEnabled={false}
              />
              {pagination.hasNext && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                >
                  <ThemedText style={styles.loadMoreText}>
                    Load More
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={styles.floatingButtonsContainer}>
          {/* Print Button */}
          <TouchableOpacity
            style={[styles.floatingButton, styles.printButton]}
            onPress={handlePrintPDF}
            disabled={printing}
          >
            {printing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="printer" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Download Button */}
          <TouchableOpacity
            style={[styles.floatingButton, styles.downloadButton]}
            onPress={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="file-download" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Dropdowns */}
        {renderDropdown(
          types,
          type,
          (selected) => setType(selected.value),
          showTypeDropdown,
          () => setShowTypeDropdown(false),
          'Select Type'
        )}

        {renderDropdown(
          dateRanges,
          dateRange,
          (selected) => setDateRange(selected.value),
          showDateRangeDropdown,
          () => setShowDateRangeDropdown(false),
          'Select Date Range'
        )}

        {renderDropdown(
          categories,
          category._id,
          (selected) => setCategory(selected),
          showCategoryDropdown,
          () => setShowCategoryDropdown(false),
          'Select Category'
        )}

        {renderDropdown(
          items,
          item._id,
          setItem,
          showItemDropdown,
          () => setShowItemDropdown(false),
          'Select Item'
        )}

        {/* Custom Range Modal */}
        <Modal
          transparent
          visible={showCustomRangeModal}
          animationType="fade"
          onRequestClose={() => setShowCustomRangeModal(false)}
          statusBarTranslucent
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <LinearGradient
              colors={['#5053ee', '#7346e5']}
              style={styles.customRangeModal}
            >
              <View style={styles.customRangeHeader}>
                <ThemedText style={[styles.customRangeTitle, { color: '#FFFFFF' }]}>
                  Select Custom Range
                </ThemedText>
                <TouchableOpacity onPress={() => setShowCustomRangeModal(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerSection}>
                  <ThemedText style={[styles.datePickerLabel, { color: '#FFFFFF' }]}>
                    From Date
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255,255,255,0.4)' }]}
                    onPress={() => {
                      setDatePickerFor('start')
                      setShowDatePicker(true)
                    }}
                  >
                    <MaterialCommunityIcons name="calendar" size={18} color="#FFFFFF" />
                    <ThemedText style={[styles.datePickerText, { color: '#FFFFFF' }]}>
                      {startDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerSection}>
                  <ThemedText style={[styles.datePickerLabel, { color: '#FFFFFF' }]}>
                    To Date
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255,255,255,0.4)' }]}
                    onPress={() => {
                      setDatePickerFor('end')
                      setShowDatePicker(true)
                    }}
                  >
                    <Feather name="calendar" size={18} color="#FFFFFF" />
                    <ThemedText style={[styles.datePickerText, { color: '#FFFFFF' }]}>
                      {endDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {startDate > endDate && (
                <ThemedText style={[styles.errorText, { color: '#ff6b6b' }]}>
                  Start date cannot be after end date
                </ThemedText>
              )}

              <View style={styles.customRangeButtons}>
                <TouchableOpacity
                  style={[styles.customRangeButton, styles.cancelButton, { borderColor: 'rgba(255,255,255,0.4)' }]}
                  onPress={() => setShowCustomRangeModal(false)}
                >
                  <ThemedText style={[styles.customRangeButtonText, { color: '#FFFFFF' }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.customRangeButton,
                    styles.applyButton,
                    {
                      backgroundColor: '#FFFFFF',
                      opacity: startDate > endDate ? 0.5 : 1
                    }
                  ]}
                  onPress={() => {
                    if (startDate <= endDate) {
                      setShowCustomRangeModal(false)
                    }
                  }}
                  disabled={startDate > endDate}
                >
                  <ThemedText style={[styles.customRangeButtonText, { color: '#5053ee' }]}>
                    Apply Range
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {/* Month Picker */}
        <Modal
          transparent
          visible={showMonthPicker}
          animationType="fade"
          onRequestClose={() => setShowMonthPicker(false)}
          statusBarTranslucent
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <LinearGradient
              colors={['#5053ee', '#7346e5']}
              style={styles.pickerModal}
            >
              <View style={styles.pickerHeader}>
                <ThemedText style={[styles.pickerTitle, { color: '#FFFFFF' }]}>
                  Select Month
                </ThemedText>
                <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.monthGrid}>
                {months.map((month, index) => {
                  const isSelected = selectedDate.getMonth() === index
                  return (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthItem,
                        isSelected && styles.monthItemSelected
                      ]}
                      onPress={() => handleMonthSelect(index)}
                    >
                      <ThemedText style={[
                        styles.monthText,
                        isSelected && styles.monthTextSelected
                      ]}>
                        {month.substring(0, 3)}
                      </ThemedText>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {/* Year Picker */}
        <Modal
          transparent
          visible={showYearPicker}
          animationType="fade"
          onRequestClose={() => setShowYearPicker(false)}
          statusBarTranslucent
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <LinearGradient
              colors={['#5053ee', '#7346e5']}
              style={styles.pickerModal}
            >
              <View style={styles.pickerHeader}>
                <ThemedText style={[styles.pickerTitle, { color: '#FFFFFF' }]}>
                  Select Year
                </ThemedText>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.yearList}>
                {years.map((year) => {
                  const isSelected = selectedDate.getFullYear() === year
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearItem,
                        isSelected && styles.yearItemSelected
                      ]}
                      onPress={() => handleYearSelect(year)}
                    >
                      <ThemedText style={[
                        styles.yearText,
                        isSelected && styles.yearTextSelected
                      ]}>
                        {year}
                      </ThemedText>
                      {isSelected && (
                        <Feather name="check" size={18} color="#5053ee" />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </LinearGradient>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dateRange === 'Today' ? selectedDate : (datePickerFor === 'start' ? startDate : endDate)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
            themeVariant={colors.mode === 'dark' ? 'dark' : 'light'}
          />
        )}

        {/* Transaction Details Modal */}
        {renderTransactionModal()}

        {/* Delete Confirmation Modal */}
        {renderDeleteConfirmationModal()}

        {/* Edit Form */}
        {editingTransaction && (
          <CashflowForm
            visible={showEditForm}
            onClose={() => {
              setShowEditForm(false)
              setEditingTransaction(null)
            }}
            onSave={handleEditComplete}
            type={editingTransaction.type}
            title="Edit Transaction"
            subtitle="Update transaction details"
            transaction={editingTransaction}
            isEditing={true}
          />
        )}

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
    </Modal>
  )
}

export default Reports