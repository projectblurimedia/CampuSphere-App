import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import DateTimePicker from '@react-native-community/datetimepicker'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const Reports = ({ visible, onClose }) => {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [fetchingCategories, setFetchingCategories] = useState(false)
  const [fetchingItems, setFetchingItems] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Filters
  const [type, setType] = useState('All')
  const [category, setCategory] = useState({ _id: null, name: 'All Categories' })
  const [item, setItem] = useState({ _id: null, name: 'All Items' })
  const [dateRange, setDateRange] = useState('Date')
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
  const [datePickerFor, setDatePickerFor] = useState('start') // 'start', 'end'

  // Data
  const [categories, setCategories] = useState([{ _id: null, name: 'All Categories', type: 'All' }])
  const [items, setItems] = useState([{ _id: null, name: 'All Items' }])
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({ total: 0, count: 0, avg: 0 })
  
  const types = [
    { label: 'All', value: 'All', color: '#3b82f6', icon: 'swap-vert' },
    { label: 'Income', value: 'Income', color: '#10b981', icon: 'trending-up' },
    { label: 'Expense', value: 'Expense', color: '#ef4444', icon: 'trending-down' }
  ]
  
  const dateRanges = [
    { label: 'Date', value: 'Date', icon: 'calendar-today' },
    { label: 'Month', value: 'Month', icon: 'calendar-view-month' },
    { label: 'Year', value: 'Year', icon: 'calendar-today' },
    { label: 'Custom Range', value: 'Custom Range', icon: 'date-range' }
  ]
  
  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  // Generate years (last 10 years + current year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i).reverse()

  useEffect(() => {
    if (visible) {
      fetchCategories()
      // Set default dates
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
     
      setSelectedDate(yesterday) // Default to yesterday for Date
      setStartDate(yesterday) // Default to yesterday for Custom Range start
      setEndDate(today) // Default to today for Custom Range end
      setDateRange('Date')
      setCategory({ _id: null, name: 'All Categories' })
      setItem({ _id: null, name: 'All Items' })
    }
  }, [visible])

  useEffect(() => {
    fetchCategories()
    setCategory({ _id: null, name: 'All Categories' })
    setItem({ _id: null, name: 'All Items' })
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
    fetchRecords()
  }, [type, category._id, item._id, dateRange, selectedDate, startDate, endDate])

  const fetchCategories = async () => {
    try {
      setFetchingCategories(true)
      const response = await axiosApi.get('/cashflow/dropdown/categories', {
        params: { type: type === 'All' ? undefined : type }
      })
      setCategories([
        { _id: null, name: 'All Categories', type: 'All' },
        ...(response.data || []).filter(cat => cat._id !== null)
      ])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setFetchingCategories(false)
    }
  }

  const fetchItems = async () => {
    try {
      setFetchingItems(true)
      const categoryId = category._id || 'All'
      const response = await axiosApi.get('/cashflow/dropdown/items', {
        params: { categoryId }
      })
      setItems([
        { _id: null, name: 'All Items' },
        ...(response.data || []).filter(item => item._id !== null)
      ])
      setItem({ _id: null, name: 'All Items' })
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setFetchingItems(false)
    }
  }

  const getDateParams = () => {
    let start, end
    switch (dateRange) {
      case 'Date':
        start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
        end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59)
        break
      case 'Month':
        start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'Year':
        start = new Date(selectedDate.getFullYear(), 0, 1)
        end = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59)
        break
      case 'Custom Range':
        start = new Date(startDate)
        end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        break
      default:
        start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59)
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const { startDate: start, endDate: end } = getDateParams()
     
      const response = await axiosApi.get('/cashflow/filtered', {
        params: {
          type: type === 'All' ? undefined : type,
          categoryId: category._id || undefined,
          itemId: item._id || undefined,
          period: dateRange,
          startDate: start,
          endDate: end
        }
      })
      const data = response.data || []
      setRecords(data)
     
      // Calculate summary
      const total = data.reduce((sum, record) => sum + record.amount, 0)
      const count = data.length
      const avg = count > 0 ? total / count : 0
     
      setSummary({ total, count, avg })
    } catch (error) {
      console.error('Error fetching records:', error)
      setRecords([])
      setSummary({ total: 0, count: 0, avg: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    console.log('yet to ready')
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(false)
    if (date) {
      if (dateRange === 'Date') {
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
    if (dateRange === 'Date') {
      setShowDatePicker(true)
    } else if (dateRange === 'Month') {
      setShowMonthPicker(true)
    } else if (dateRange === 'Year') {
      setShowYearPicker(true)
    } else if (dateRange === 'Custom Range') {
      setShowCustomRangeModal(true)
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
        ]}>
          {label}
        </ThemedText>
      </View>
      <Feather name="chevron-down" size={16} color={disabled ? colors.textSecondary : colors.text} />
    </TouchableOpacity>
  )

  const renderDownloadButton = () => {
    const isCustom = dateRange === 'Custom Range'
    const label = isCustom ? '' : downloading ? 'Downloading...' : 'Download'
    const iconName = downloading ? 'hourglass-empty' : 'file-download'
    const buttonWidth = isCustom ? 50 : (SCREEN_WIDTH - 52) / 2
    
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          { 
            backgroundColor: colors.cardBackground, 
            width: buttonWidth, 
            justifyContent: 'center',
            opacity: downloading ? 0.7 : 1
          }
        ]}
        onPress={handleDownload}
        disabled={downloading}
      >
        <View style={[styles.filterButtonContent, { justifyContent: 'center' }]}>
          <MaterialIcons name={iconName} size={18} color={colors.text} />
          {!isCustom && (
            <ThemedText style={[styles.filterButtonText, { color: colors.text, marginLeft: 8 }]}>
              {label}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderCustomRangeModal = () => (
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
          style={[styles.customRangeModal, { borderRadius: 24 }]}
        >
          <View style={styles.customRangeHeader}>
            <ThemedText type="subtitle" style={[styles.customRangeTitle, { color: '#FFFFFF' }]}>
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
                style={[styles.datePickerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={() => {
                  setDatePickerFor('start')
                  setShowDatePicker(true)
                }}
              >
                <Feather name="calendar" size={18} color="#FFFFFF" />
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
                style={[styles.datePickerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
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
                  setDateRange('Custom Range')
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
  )

  const renderMonthPicker = () => (
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
          style={[styles.pickerModal, { borderRadius: 24 }]}
        >
          <View style={styles.pickerHeader}>
            <ThemedText type="subtitle" style={[styles.pickerTitle, { color: '#FFFFFF' }]}>
              Select Month
            </ThemedText>
            <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.monthGrid}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthItem,
                  { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  selectedDate.getMonth() === index && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                ]}
                onPress={() => handleMonthSelect(index)}
              >
                <ThemedText style={[
                  styles.monthText,
                  { color: selectedDate.getMonth() === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' }
                ]}>
                  {month.substring(0, 3)}
                </ThemedText>
                {selectedDate.getMonth() === index && (
                  <View style={[styles.selectedIndicator, { backgroundColor: '#FFFFFF' }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  )

  const renderYearPicker = () => (
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
          style={[styles.pickerModal, { borderRadius: 24 }]}
        >
          <View style={styles.pickerHeader}>
            <ThemedText type="subtitle" style={[styles.pickerTitle, { color: '#FFFFFF' }]}>
              Select Year
            </ThemedText>
            <TouchableOpacity onPress={() => setShowYearPicker(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.yearList}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearItem,
                  { borderBottomColor: 'rgba(255,255,255,0.2)' },
                  selectedDate.getFullYear() === year && { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                ]}
                onPress={() => handleYearSelect(year)}
              >
                <ThemedText style={[
                  styles.yearText,
                  { color: selectedDate.getFullYear() === year ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' }
                ]}>
                  {year}
                </ThemedText>
                {selectedDate.getFullYear() === year && (
                  <Feather name="check" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  )

  const renderDropdown = (items, selectedValue, onSelect, visible, onClose, title, getLabel = (item) => item.label || item.name || item, getValue = (item) => item.value || item._id || item) => (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.dropdownOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={[styles.dropdownContainer, { borderRadius: 24 }]}
        >
          <View style={[styles.dropdownHeader, { borderBottomColor: 'rgba(255,255,255,0.3)' }]}>
            <ThemedText type="subtitle" style={[styles.dropdownTitle, { color: '#FFFFFF' }]}>
              {title}
            </ThemedText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
         
          <ScrollView style={styles.dropdownList}>
            {items.map((item) => {
              const isSelected = selectedValue === getValue(item)
              const label = getLabel(item)
              const icon = item.icon
              const color = item.color || '#7619f0'
             
              return (
                <TouchableOpacity
                  key={getValue(item)}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: 'rgba(255,255,255,0.1)' },
                    isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                  ]}
                  onPress={() => {
                    onSelect(item)
                    onClose()
                  }}
                >
                  <View style={styles.dropdownItemLeft}>
                    {icon && (
                      <View style={[styles.dropdownIcon, { backgroundColor: 'rgba(255, 255, 255, .9)' }]}>
                        <MaterialIcons name={icon} size={18} color={color} />
                      </View>
                    )}
                    <ThemedText style={[
                      styles.dropdownItemText,
                      { color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' }
                    ]}>
                      {label}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <View style={[styles.dropdownCheck, { backgroundColor: '#FFFFFF' }]}>
                      <Feather name="check" size={14} color="#5053ee" />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  )

  const renderRecordItem = ({ item }) => (
    <View style={[styles.recordItem, { backgroundColor: colors.cardBackground }]}>
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
          {new Date(item.date).toLocaleDateString('en-IN')}
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
        <ThemedText style={[styles.recordDescription, { color: colors.textSecondary }]}>
          {item.description}
        </ThemedText>
      )}
      <View style={styles.recordBottomRow}>
        <ThemedText style={[styles.recordPerson, { color: colors.textSecondary }]}>
          {item.person}
        </ThemedText>
        <ThemedText style={[styles.recordAmount, {
          color: item.type === 'Income' ? '#10b981' : '#ef4444'
        }]}>
          {item.type === 'Income' ? '+' : '-'}₹{item.amount.toLocaleString()}
        </ThemedText>
      </View>
    </View>
  )

  const getAppliedDisplayDate = () => {
    if (dateRange === 'Date') {
      return selectedDate.toLocaleDateString('en-IN')
    } else if (dateRange === 'Month') {
      return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    } else if (dateRange === 'Year') {
      return selectedDate.getFullYear().toString()
    } else if (startDate && endDate) {
      return `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`
    }
    return 'Select dates'
  }

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 55,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
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
      fontFamily: 'Poppins-Bold',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
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
    },
    filterButtonText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
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
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
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
    },
    recordAmount: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
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
      maxHeight: SCREEN_WIDTH * 0.8,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 0.5,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
    },
    dropdownTitle: {
      fontSize: 17,
    },
    closeButton: {
      height: 30,
      width: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownList: {
      maxHeight: SCREEN_WIDTH * 0.8,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 1,
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
      flex: 1,
    },
    dropdownCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    pickerModal: {
      width: SCREEN_WIDTH * 0.9,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 0.5,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
    },
    pickerTitle: {
      fontSize: 18,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    monthItem: {
      width: (SCREEN_WIDTH * 0.9 - 96) / 3,
      height: 60,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    monthText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
    },
    selectedIndicator: {
      position: 'absolute',
      bottom: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    yearList: {
      maxHeight: 300,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    yearItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    yearText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
    customRangeModal: {
      width: SCREEN_WIDTH * 0.9,
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 0.5,
    },
    customRangeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    customRangeTitle: {
      fontSize: 18,
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
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    datePickerText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
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
      backgroundColor: 'transparent',
    },
    applyButton: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 0.5,
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
    },
  }), [colors])

  const datePickerWidth = dateRange === 'Custom Range' ? (SCREEN_WIDTH - 40 - 12 - 50) : (SCREEN_WIDTH - 52) / 2

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
              <ThemedText style={styles.title}>Financial Reports</ThemedText>
              <ThemedText style={styles.subtitle}>Detailed transaction reports</ThemedText>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={{ marginTop: 16, color: colors.textSecondary }}>
                Loading report data...
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
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
                  label: category.name,
                  onPress: () => setShowCategoryDropdown(true),
                  disabled: fetchingCategories
                })}
                {renderFilterButton({
                  icon: 'inventory',
                  label: item.name,
                  onPress: () => setShowItemDropdown(true),
                  disabled: !category._id || fetchingItems
                })}
                {renderFilterButton({
                  icon: dateRanges.find(d => d.value === dateRange)?.icon || 'calendar-today',
                  label: getAppliedDisplayDate(),
                  onPress: handleDateButtonPress,
                  customStyle: { width: datePickerWidth }
                })}
                {renderDownloadButton()}
              </View>
              {/* Summary Stats */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Total Amount</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    ₹{summary.total.toLocaleString()}
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
                  {records.length} records
                </ThemedText>
              </View>
              {records.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="file-text" size={48} color={colors.textSecondary} />
                  <ThemedText style={styles.emptyText}>
                    No transactions found for selected filters
                  </ThemedText>
                </View>
              ) : (
                <FlatList
                  data={records}
                  keyExtractor={(item) => item._id}
                  renderItem={renderRecordItem}
                  scrollEnabled={false}
                />
              )}
            </ScrollView>
          )}
        </View>
        {/* Type Dropdown */}
        {renderDropdown(
          types,
          type,
          (selected) => {
            setType(selected.value)
            setCategory({ _id: null, name: 'All Categories' })
            setItem({ _id: null, name: 'All Items' })
          },
          showTypeDropdown,
          () => setShowTypeDropdown(false),
          'Select Type'
        )}
        {/* Category Dropdown */}
        {renderDropdown(
          categories,
          category._id,
          (selected) => {
            setCategory(selected)
            setItem({ _id: null, name: 'All Items' })
          },
          showCategoryDropdown,
          () => setShowCategoryDropdown(false),
          'Select Category',
          (item) => item.name,
          (item) => item._id
        )}
        {/* Item Dropdown */}
        {renderDropdown(
          items,
          item._id,
          setItem,
          showItemDropdown,
          () => setShowItemDropdown(false),
          'Select Item',
          (item) => item.name,
          (item) => item._id
        )}
        {/* Date Range Dropdown */}
        {renderDropdown(
          dateRanges,
          dateRange,
          (selected) => {
            setDateRange(selected.value)
          },
          showDateRangeDropdown,
          () => setShowDateRangeDropdown(false),
          'Select Date Range'
        )}
        {/* Custom Range Modal */}
        {renderCustomRangeModal()}
        {/* Month Picker */}
        {renderMonthPicker()}
        {/* Year Picker */}
        {renderYearPicker()}
        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dateRange === 'Custom Range' ?
              (datePickerFor === 'start' ? startDate : endDate) :
              selectedDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
            themeVariant={colors.mode === 'dark' ? 'dark' : 'light'}
          />
        )}
      </View>
    </Modal>
  )
}

export default Reports