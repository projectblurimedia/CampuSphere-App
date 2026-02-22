import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import DateTimePicker from '@react-native-community/datetimepicker'
import axiosApi from '@/utils/axiosApi'
import FeeReceipt from './FeeReceipt'
import * as Sharing from 'expo-sharing'
import * as XLSX from 'xlsx'
import * as Print from 'expo-print'
import { File, Paths } from 'expo-file-system'
import { generateReceiptHTML, generatePrintHTML } from './receiptHtmlTemplates'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Custom Dropdown Component with fixed bottom positioning
const CustomDropdown = ({
  value,
  items,
  onSelect,
  placeholder = "Select an option",
  style,
  isLoading = false,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(placeholder)

  useEffect(() => {
    if (value && items?.length > 0) {
      const foundItem = items.find(item => item.value === value)
      setSelectedLabel(foundItem ? foundItem.label : placeholder)
    } else {
      setSelectedLabel(placeholder)
    }
  }, [value, items, placeholder])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (item) => {
    setSelectedLabel(item.label)
    onSelect(item.value)
    setIsOpen(false)
  }

  return (
    <View style={[styles.customDropdownContainer, style]}>
      <TouchableOpacity
        style={[
          styles.dropdownHeader,
          { 
            borderColor: colors.border,
            backgroundColor: colors.inputBackground
          }
        ]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
        disabled={isLoading || items.length === 0}
      >
        <ThemedText style={[
          styles.dropdownSelectedText,
          { color: value ? colors.text : colors.textSecondary }
        ]} numberOfLines={1}>
          {isLoading ? 'Loading...' : selectedLabel}
        </ThemedText>
        <Feather 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.primary} 
        />
      </TouchableOpacity>
      
      {isOpen && !isLoading && items.length > 0 && (
        <View style={[
          styles.dropdownList,
          styles.dropdownListBottom,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            shadowColor: '#000',
          }
        ]}>
          <ScrollView 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={styles.dropdownScroll}
            bounces={true}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.value.toString()}
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor: value === item.value ? colors.primary + '10' : 'transparent',
                  }
                ]}
                onPress={() => handleSelect(item)}
              >
                <ThemedText style={[
                  styles.dropdownItemText,
                  { 
                    color: value === item.value ? colors.primary : colors.text,
                    fontFamily: value === item.value ? 'Poppins-SemiBold' : 'Poppins-Medium'
                  }
                ]}>
                  {item.label}
                </ThemedText>
                {value === item.value && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// Memoized Payment Item Component - Removed eye icon, added initials avatar
const PaymentItem = React.memo(({ item, onPress, colors, formatDate, getPaymentModeColor, getPaymentModeIcon }) => {
  // Function to get initials from student name
  const getInitials = (name) => {
    if (!name) return '?'
    const nameParts = name.split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.paymentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={() => onPress(item)}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.studentInfo}>
          <View style={[styles.studentAvatar, { backgroundColor: '#1d9bf0' }]}>
            {item.student?.profilePicUrl ? (
              <Image 
                source={{ uri: item.student.profilePicUrl }} 
                style={styles.avatarImage}
              />
            ) : (
              <ThemedText style={styles.avatarText}>
                {getInitials(item.student?.name)}
              </ThemedText>
            )}
          </View>
          <View style={styles.studentDetails}>
            <ThemedText style={styles.studentName}>{item.student?.name || 'N/A'}</ThemedText>
            <View style={styles.classSectionRow}>
              <View style={styles.classSectionBadge}>
                <MaterialIcons name="class" size={10} color={colors.primary} />
                <ThemedText style={styles.classSectionText}>
                  {item.student?.displayClass || 'N/A'} - {item.student?.section || 'N/A'}
                </ThemedText>
              </View>
              <View style={styles.separatorDot} />
              <View style={styles.dateBadge}>
                <Feather name="calendar" size={10} color={colors.textSecondary} />
                <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.paymentInfoRow}>
          <View style={styles.paymentModeContainer}>
            <View style={[styles.paymentModeBadge, { backgroundColor: getPaymentModeColor(item.paymentMode) + '20' }]}>
              <FontAwesome5 
                name={getPaymentModeIcon(item.paymentMode)} 
                size={10} 
                color={getPaymentModeColor(item.paymentMode)} 
              />
              <ThemedText style={[styles.paymentModeText, { color: getPaymentModeColor(item.paymentMode) }]}>
                {item.paymentMode?.replace('_', ' ') || 'N/A'}
              </ThemedText>
            </View>
            
            <View style={[styles.receiptBadge, { backgroundColor: colors.primary + '10' }]}>
              <MaterialIcons name="receipt" size={10} color={colors.primary} />
              <ThemedText style={[styles.receiptText, { color: colors.primary }]}>
                {item.receiptNo || 'N/A'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.totalAmountContainer}>
            <ThemedText style={[styles.totalAmount, { color: colors.success }]}>
              ₹{item.totalAmount?.toLocaleString() || 0}
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
})

PaymentItem.displayName = 'PaymentItem'

export default function PaymentHistory({ visible, onClose }) {
  const { colors } = useTheme()
  
  // State for classes and sections
  const [classesAndSections, setClassesAndSections] = useState({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classItems, setClassItems] = useState([])
  const [sectionItems, setSectionItems] = useState([])
  
  // State for filters (temporary and applied)
  const [tempFilters, setTempFilters] = useState({
    startDate: null,
    endDate: null,
    class: 'ALL',
    section: 'ALL',
  })
  
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: null,
    endDate: null,
    class: 'ALL',
    section: 'ALL',
  })
  
  // UI States
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0) // New state for total records
  const [pagination, setPagination] = useState({
    current: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [exporting, setExporting] = useState(false)
  
  // Receipt states
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showFeeReceipt, setShowFeeReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)

  // Ref to track current request for race condition prevention
  const currentRequestRef = useRef(null)

  // Check if filters are applied (for orange dot)
  const hasActiveFilters = useMemo(() => {
    return appliedFilters.startDate || 
           appliedFilters.endDate || 
           appliedFilters.class !== 'ALL' || 
           appliedFilters.section !== 'ALL'
  }, [appliedFilters])

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  // Function to load classes and sections from API
  const loadClassesAndSections = useCallback(async () => {
    try {
      setIsLoadingClasses(true)

      const response = await axiosApi.get('/students/classes-sections')
      
      if (response.data.success) {
        const classesData = response.data.data
        setClassesAndSections(classesData)
        
        // Transform the data for dropdown - Include ALL option
        const classesArray = ['ALL', ...Object.keys(classesData)].map(className => {
          if (className === 'ALL') {
            return { label: 'All Classes', value: 'ALL' }
          }
          
          // Format class label based on class name
          let label = className
          if (className.startsWith('Class ')) {
            // Already in "Class X" format
            label = className
          } else if (className === 'Pre-Nursery' || className === 'Nursery' || className === 'LKG' || className === 'UKG') {
            // Keep as is for special classes
            label = className
          } else {
            // For numeric classes, add "Class " prefix
            label = `Class ${className}`
          }
          
          return {
            label,
            value: className === 'Pre-Nursery' || className === 'Nursery' || className === 'LKG' || className === 'UKG' 
              ? className 
              : className.split(' ')[1] || className // Extract number or keep as is
          }
        })
        
        // Sort classes: ALL first, then Pre-Nursery, Nursery, LKG, UKG, then Class 1-12
        const sortedClasses = classesArray.sort((a, b) => {
          if (a.value === 'ALL') return -1
          if (b.value === 'ALL') return 1
          
          // Define the correct order for non-numeric classes
          const specialOrder = {
            'Pre-Nursery': 0,
            'Nursery': 1,
            'LKG': 2,
            'UKG': 3
          }
          
          // Get order for both items
          const orderA = specialOrder[a.value] !== undefined ? specialOrder[a.value] : 4
          const orderB = specialOrder[b.value] !== undefined ? specialOrder[b.value] : 4
          
          // If both are numeric classes (after the special ones)
          if (orderA === 4 && orderB === 4) {
            // Extract numeric value and compare as numbers
            const numA = parseInt(a.value) || 100
            const numB = parseInt(b.value) || 100
            return numA - numB
          }
          
          return orderA - orderB
        })
        
        setClassItems(sortedClasses)
        
        // Update sections based on applied filters class
        updateSectionsForClass(appliedFilters.class, classesData)
      } else {
        throw new Error(response.data.message || 'Failed to load classes and sections')
      }
    } catch (err) {
      console.error('Error loading classes and sections:', err)
      showToast('Failed to load classes', 'warning')
      
      // Fallback to hardcoded classes if API fails
      const fallbackClasses = [
        { label: 'All Classes', value: 'ALL' },
        { label: 'Pre-Nursery', value: 'Pre-Nursery' },
        { label: 'Nursery', value: 'Nursery' },
        { label: 'LKG', value: 'LKG' },
        { label: 'UKG', value: 'UKG' },
        { label: 'Class 1', value: '1' },
        { label: 'Class 2', value: '2' },
        { label: 'Class 3', value: '3' },
        { label: 'Class 4', value: '4' },
        { label: 'Class 5', value: '5' },
        { label: 'Class 6', value: '6' },
        { label: 'Class 7', value: '7' },
        { label: 'Class 8', value: '8' },
        { label: 'Class 9', value: '9' },
        { label: 'Class 10', value: '10' },
      ]
      
      const fallbackClassSections = {
        'Pre-Nursery': ['A', 'B'],
        'Nursery': ['A', 'B'],
        'LKG': ['A', 'B'],
        'UKG': ['A', 'B'],
        '1': ['A', 'B'],
        '2': ['A', 'B'],
        '3': ['A', 'B'],
        '4': ['A', 'B'],
        '5': ['A', 'B'],
        '6': ['A', 'B'],
        '7': ['A', 'B'],
        '8': ['A', 'B'],
        '9': ['A', 'B'],
        '10': ['A', 'B'],
        '11': ['A', 'B'],
        '12': ['A', 'B'],
      }
      
      setClassItems(fallbackClasses)
      setClassesAndSections(fallbackClassSections)
      updateSectionsForClass(appliedFilters.class, fallbackClassSections)
    } finally {
      setIsLoadingClasses(false)
    }
  }, [showToast, appliedFilters.class])

  // Function to update sections based on selected class
  const updateSectionsForClass = useCallback((className, classesData = classesAndSections) => {
    if (!className || !classesData || Object.keys(classesData).length === 0) {
      // Default sections with ALL option
      setSectionItems([{ label: 'All Sections', value: 'ALL' }])
      return
    }
    
    if (className === 'ALL') {
      // When ALL classes selected, show ALL sections only
      setSectionItems([{ label: 'All Sections', value: 'ALL' }])
      return
    }
    
    // Find the class label that matches the value
    let classLabel = null
    const classItem = classItems.find(c => c.value === className)
    if (classItem) {
      classLabel = classItem.label.replace('Class ', '')
    } else {
      // Try to find by value
      for (const [key] of Object.entries(classesData)) {
        if (key === className || key.split(' ')[1] === className || key === `Class ${className}`) {
          classLabel = key
          break
        }
      }
    }
    
    if (!classLabel) {
      setSectionItems([{ label: 'All Sections', value: 'ALL' }])
      return
    }
    
    const classSections = classesData[classLabel] || []
    
    if (classSections.length > 0) {
      const sectionsArray = [
        { label: 'All Sections', value: 'ALL' },
        ...classSections.map(section => ({
          label: `Section ${section}`,
          value: section
        }))
      ]
      setSectionItems(sectionsArray)
    } else {
      // Default fallback
      setSectionItems([
        { label: 'All Sections', value: 'ALL' },
        { label: 'Section A', value: 'A' },
        { label: 'Section B', value: 'B' },
      ])
    }
  }, [classItems, classesAndSections])

  // Load classes and sections when component mounts or becomes visible
  useEffect(() => {
    if (visible) {
      loadClassesAndSections()
    }
  }, [visible, loadClassesAndSections])

  // Update sections when class changes in tempFilters
  useEffect(() => {
    if (showFilterModal && Object.keys(classesAndSections).length > 0) {
      updateSectionsForClass(tempFilters.class)
    }
  }, [tempFilters.class, classesAndSections, showFilterModal, updateSectionsForClass])

  // Update sections when class changes in appliedFilters (for stats display)
  useEffect(() => {
    if (Object.keys(classesAndSections).length > 0) {
      updateSectionsForClass(appliedFilters.class)
    }
  }, [appliedFilters.class, classesAndSections, updateSectionsForClass])

  // Fetch payment history with applied filters - with race condition prevention
  const fetchPaymentHistory = useCallback(async (page = 1, append = false) => {
    // Generate unique request ID
    const requestId = Date.now().toString()
    currentRequestRef.current = requestId
    
    // Don't show loading indicator if it's a refresh
    if (!append && !refreshing) {
      setLoading(true)
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      // Add date filters if present
      if (appliedFilters.startDate) {
        params.append('startDate', appliedFilters.startDate)
      }
      if (appliedFilters.endDate) {
        params.append('endDate', appliedFilters.endDate)
      }
      
      // Add class filter if not 'ALL'
      if (appliedFilters.class && appliedFilters.class !== 'ALL') {
        params.append('class', appliedFilters.class)
      }
      
      // Add section filter if not 'ALL'
      if (appliedFilters.section && appliedFilters.section !== 'ALL') {
        params.append('section', appliedFilters.section)
      }
      
      const response = await axiosApi.get(`/fees/payment-history?${params.toString()}`)
      
      // Check if this is still the current request
      if (currentRequestRef.current !== requestId) {
        console.log('Ignoring stale response for request:', requestId)
        return
      }
      
      if (response.data.success) {
        // Ensure we have data array even if empty
        const newPayments = response.data.data || []
        const newSummary = response.data.summary || null
        const newPagination = response.data.pagination || {
          current: page,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          total: newPayments.length
        }
        
        // Set total records from response
        setTotalRecords(response.data.total || newPayments.length || 0)
        
        // Enhance payments with previous year info if available
        const enhancedPayments = newPayments.map(payment => {
          // Check if this payment includes previous year metadata
          if (payment.metadata) {
            return {
              ...payment,
              isPreviousYearPayment: payment.metadata.paymentType === 'previousYear' || 
                                     payment.metadata.paymentType === 'allPreviousYears',
              previousYearInfo: payment.metadata.academicYear ? {
                academicYear: payment.metadata.academicYear,
                paymentType: payment.metadata.paymentType
              } : null
            }
          }
          return payment
        })
        
        if (append) {
          setPayments(prev => [...prev, ...enhancedPayments])
        } else {
          setPayments(enhancedPayments)
        }
        
        setSummary(newSummary)
        setPagination({
          current: newPagination.current || page,
          totalPages: newPagination.totalPages || 1,
          hasNext: newPagination.hasNext || false,
          hasPrev: newPagination.hasPrev || false,
        })
      } else {
        showToast(response.data.message || 'Failed to fetch payment history', 'error')
        // Clear data on error
        if (!append) {
          setPayments([])
          setSummary(null)
          setTotalRecords(0)
        }
      }
    } catch (error) {
      // Check if this is still the current request
      if (currentRequestRef.current !== requestId) {
        console.log('Ignoring stale error for request:', requestId)
        return
      }
      
      console.error('Error fetching payment history:', error)
      
      // Handle 500 error gracefully
      if (error.response?.status === 500) {
        showToast('Server error. Please try again later.', 'error')
      } else {
        showToast(error.response?.data?.message || 'Failed to load payment history', 'error')
      }
      
      // Clear data on error
      if (!append) {
        setPayments([])
        setSummary(null)
        setTotalRecords(0)
        setPagination({
          current: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        })
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setLoading(false)
        setInitialLoading(false)
        setRefreshing(false)
      }
    }
  }, [appliedFilters, showToast, refreshing])

  // Initial fetch when component becomes visible and classes are loaded
  useEffect(() => {
    if (visible && !isLoadingClasses) {
      setInitialLoading(true)
      setPayments([]) // Clear existing data
      setTotalRecords(0) // Reset total records
      fetchPaymentHistory(1, false)
    }
    
    // Cleanup function to cancel pending requests
    return () => {
      currentRequestRef.current = null
    }
  }, [visible, fetchPaymentHistory, isLoadingClasses])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setPayments([]) // Clear existing data
    setTotalRecords(0) // Reset total records
    fetchPaymentHistory(1, false)
  }, [fetchPaymentHistory])

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination.hasNext && !loading && !refreshing) {
      fetchPaymentHistory(pagination.current + 1, true)
    }
  }, [pagination, loading, refreshing, fetchPaymentHistory])

  // Handle date selection
  const handleDateChange = useCallback((event, selectedDate, type) => {
    if (type === 'start') {
      setShowStartDatePicker(false)
      if (selectedDate) {
        // Format date as YYYY-MM-DD for backend
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`
        
        setTempFilters(prev => ({ 
          ...prev, 
          startDate: formattedDate
        }))
      }
    } else {
      setShowEndDatePicker(false)
      if (selectedDate) {
        // Format date as YYYY-MM-DD for backend
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`
        
        setTempFilters(prev => ({ 
          ...prev, 
          endDate: formattedDate
        }))
      }
    }
  }, [])

  // Open filter modal - copy applied filters to temp
  const openFilterModal = useCallback(() => {
    setTempFilters({ ...appliedFilters })
    setShowFilterModal(true)
  }, [appliedFilters])

  // Clear all filters and close modal immediately
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      startDate: null,
      endDate: null,
      class: 'ALL',
      section: 'ALL',
    }
    setTempFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
    setShowFilterModal(false)
    // Cancel any pending requests
    currentRequestRef.current = null
    // Show loading immediately and fetch data
    setInitialLoading(true)
    setPayments([]) // Clear existing data
    setTotalRecords(0) // Reset total records
    fetchPaymentHistory(1, false)
    showToast('Filters cleared', 'success')
  }, [fetchPaymentHistory, showToast])

  // Apply filters - only if they're different
  const applyFilters = useCallback(() => {
    // Only update applied filters if they're different from temp filters
    if (JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters)) {
      setAppliedFilters({ ...tempFilters })
      setShowFilterModal(false)
      // Cancel any pending requests
      currentRequestRef.current = null
      // Show loading immediately and fetch data
      setInitialLoading(true)
      setPayments([]) // Clear existing data
      setTotalRecords(0) // Reset total records
      fetchPaymentHistory(1, false)
      showToast('Filters applied', 'success')
    } else {
      // If same filters, just close modal
      setShowFilterModal(false)
    }
  }, [tempFilters, appliedFilters, fetchPaymentHistory, showToast])

  // Cancel filter modal
  const cancelFilterModal = useCallback(() => {
    setShowFilterModal(false)
  }, [])

  const exportToExcel = useCallback(async () => {
    try {
      setExporting(true)

      const excelData = payments.map(payment => ({
        'Receipt No': payment.receiptNo,
        'Date': formatDate(payment.date),
        'Student Name': payment.student?.name || 'N/A',
        'Class': payment.student?.displayClass || 'N/A',
        'Section': payment.student?.section || 'N/A',
        'School Fee (₹)': payment.breakdown?.schoolFeePaid || 0,
        'Transport Fee (₹)': payment.breakdown?.transportFeePaid || 0,
        'Hostel Fee (₹)': payment.breakdown?.hostelFeePaid || 0,
        'Total Amount (₹)': payment.totalAmount,
        'Payment Mode': payment.paymentMode?.replace('_', ' ') || 'N/A',
        'Description': payment.description || '',
        'Received By': payment.receivedBy || 'N/A',
      }))

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Payment History")

      // Write to base64
      const wbout = XLSX.write(wb, { 
        type: 'base64', 
        bookType: "xlsx" 
      })

      // Modern API: Create file in cache directory
      const fileName = `payments_${Date.now()}.xlsx`
      const file = new File(Paths.cache, fileName);

      // Write the Excel data with base64 encoding
      await file.write(wbout, {
        encoding: 'base64'
      })

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Share Payment History',
          UTI: 'com.microsoft.excel.xlsx',
        })
        
        showToast('Export completed successfully', 'success')
      } else {
        showToast('Sharing is not available on this device', 'error')
      }
    } catch (error) {
      console.error('Export error:', error)
      showToast('Failed to export payment history: ' + error.message, 'error')
    } finally {
      setExporting(false)
    }
  }, [payments, formatDate, showToast])

  const generatePDFReceipt = async () => {
    if (!receiptData) return

    try {
      setDownloading(true)

      const htmlContent = generateReceiptHTML(receiptData)

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent })

      await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf', 
        dialogTitle: 'Share or save PDF',
      })

      setDownloading(false)

    } catch (error) {
      console.error('Error generating PDF:', error)
      showToast('Failed to generate PDF: ' + error.message, 'error')
      setDownloading(false)
    }
  }

  const handlePrintReceipt = async () => {
    if (!receiptData) return

    try {
      setPrinting(true)

      const htmlContent = generatePrintHTML(receiptData)

      // Print the receipt
      await Print.printAsync({
        html: htmlContent
      })

      setPrinting(false)

    } catch (error) {
      console.error('Error printing receipt:', error)
      showToast('Failed to print receipt', 'error')
      setPrinting(false)
    }
  }

  // Handle view receipt
  const handleViewReceipt = useCallback(async (payment) => {
    setSelectedPayment(payment)
    setReceiptData(null)
    setLoadingReceipt(true)
    setShowFeeReceipt(true)

    try {
      const response = await axiosApi.get(`/fees/receipt/${payment.id}`)
      
      if (response.data.success) {
        setReceiptData(response.data.data)
      } else {
        showToast('Failed to load receipt data', 'error')
        setShowFeeReceipt(false)
      }
    } catch (error) {
      console.error('Error fetching receipt:', error)
      showToast('Failed to load receipt', 'error')
      setShowFeeReceipt(false)
    } finally {
      setLoadingReceipt(false)
    }
  }, [showToast])

  // Handle close receipt
  const handleCloseFeeReceipt = useCallback(() => {
    setShowFeeReceipt(false)
    setTimeout(() => {
      setSelectedPayment(null)
      setReceiptData(null)
      setLoadingReceipt(false)
    }, 300)
  }, [])

  // Helper functions
  const formatCurrency = useCallback((amount) => {
    return `₹${amount?.toLocaleString() || 0}`
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }, [])

  const getPaymentModeColor = useCallback((mode) => {
    switch(mode) {
      case 'CASH': return '#4CAF50'
      case 'CARD': return '#2196F3'
      case 'ONLINE_PAYMENT': return '#9C27B0'
      case 'BANK_TRANSFER': return '#FF9800'
      case 'CHEQUE': return '#F44336'
      default: return colors.primary
    }
  }, [colors.primary])

  const getPaymentModeIcon = useCallback((mode) => {
    switch(mode) {
      case 'CASH': return 'money-bill-wave'
      case 'CARD': return 'credit-card'
      case 'ONLINE_PAYMENT': return 'mobile-alt'
      case 'BANK_TRANSFER': return 'university'
      case 'CHEQUE': return 'file-invoice'
      default: return 'money-bill-wave'
    }
  }, [])

  // Render payment item
  const renderPaymentItem = useCallback(({ item }) => (
    <PaymentItem
      item={item}
      onPress={handleViewReceipt}
      colors={colors}
      formatDate={formatDate}
      getPaymentModeColor={getPaymentModeColor}
      getPaymentModeIcon={getPaymentModeIcon}
    />
  ), [colors, handleViewReceipt, formatDate, getPaymentModeColor, getPaymentModeIcon])

  // Render filter modal
  const renderFilterModal = useCallback(() => (
    <Modal
      visible={showFilterModal}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      onRequestClose={cancelFilterModal}
    >
      <TouchableOpacity 
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        activeOpacity={1}
        onPress={cancelFilterModal}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Filter Payments</ThemedText>
            <TouchableOpacity onPress={cancelFilterModal}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={styles.modalScrollView}
          >
            {/* Date Range */}
            <View style={styles.filterSection}>
              <ThemedText style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>
                Date Range
              </ThemedText>
              <View style={styles.dateRangeRow}>
                <TouchableOpacity
                  style={[
                    styles.dateButton, 
                    { 
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                      flex: 1 
                    }
                  ]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <ThemedText style={[
                    styles.dateButtonText, 
                    { color: tempFilters.startDate ? colors.text : colors.textSecondary }
                  ]} numberOfLines={1}>
                    {tempFilters.startDate || 'Start Date'}
                  </ThemedText>
                </TouchableOpacity>

                <ThemedText style={[styles.dateRangeSeparator, { color: colors.textSecondary }]}>
                  to
                </ThemedText>

                <TouchableOpacity
                  style={[
                    styles.dateButton, 
                    { 
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                      flex: 1 
                    }
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <ThemedText style={[
                    styles.dateButtonText, 
                    { color: tempFilters.endDate ? colors.text : colors.textSecondary }
                  ]} numberOfLines={1}>
                    {tempFilters.endDate || 'End Date'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Class and Section */}
            <View style={styles.filterRow}>
              <View style={styles.filterHalf}>
                <ThemedText style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>
                  Class
                </ThemedText>
                <CustomDropdown
                  value={tempFilters.class}
                  items={classItems}
                  onSelect={(value) => {
                    setTempFilters(prev => ({ 
                      ...prev, 
                      class: value,
                      section: 'ALL' // Reset section when class changes
                    }))
                  }}
                  placeholder="Select Class"
                  isLoading={isLoadingClasses}
                />
              </View>
              
              <View style={styles.filterHalf}>
                <ThemedText style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>
                  Section
                </ThemedText>
                <CustomDropdown
                  value={tempFilters.section}
                  items={sectionItems}
                  onSelect={(value) => setTempFilters(prev => ({ ...prev, section: value }))}
                  placeholder="Select Section"
                  isLoading={isLoadingClasses}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.danger + '20' }]}
              onPress={clearFilters}
            >
              <ThemedText style={[styles.modalButtonText, { color: colors.danger }]}>
                Clear All
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={applyFilters}
            >
              <ThemedText style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                Apply Filters
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  ), [showFilterModal, colors, tempFilters, classItems, sectionItems, isLoadingClasses, clearFilters, applyFilters, cancelFilterModal])

  const renderStatsModal = useCallback(() => (
    <Modal
      visible={showStatsModal}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      onRequestClose={() => setShowStatsModal(false)}
    >
      <TouchableOpacity 
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        activeOpacity={1}
        onPress={() => setShowStatsModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Payment Statistics</ThemedText>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {summary ? (
              <>
                <View style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.statContent}>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Total Collections
                    </ThemedText>
                    <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                      {formatCurrency(summary.totalAmount)}
                    </ThemedText>
                    <ThemedText style={[styles.statSubtext, { color: colors.textSecondary }]}>
                      {summary.totalPayments || 0} transactions
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                    <MaterialIcons name="trending-up" size={24} color={colors.success} />
                  </View>
                  <View style={styles.statContent}>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Average Amount
                    </ThemedText>
                    <ThemedText style={[styles.statValue, { color: colors.success }]}>
                      {formatCurrency(summary.averageAmount)}
                    </ThemedText>
                    <ThemedText style={[styles.statSubtext, { color: colors.textSecondary }]}>
                      per transaction
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.statBreakdown, { backgroundColor: colors.inputBackground }]}>
                  <ThemedText style={[styles.statBreakdownTitle, { color: colors.text }]}>
                    Fee Breakdown
                  </ThemedText>
                  
                  <View style={[styles.statBreakdownItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.statBreakdownLeft}>
                      <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
                      <ThemedText style={[styles.statBreakdownLabel, { color: colors.textSecondary }]}>
                        School Fee
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.statBreakdownValue, { color: colors.warning }]}>
                      {formatCurrency(summary.totalSchoolFee || 0)}
                    </ThemedText>
                  </View>

                  <View style={[styles.statBreakdownItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.statBreakdownLeft}>
                      <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                      <ThemedText style={[styles.statBreakdownLabel, { color: colors.textSecondary }]}>
                        Transport Fee
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.statBreakdownValue, { color: colors.primary }]}>
                      {formatCurrency(summary.totalTransportFee || 0)}
                    </ThemedText>
                  </View>

                  <View style={[styles.statBreakdownItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.statBreakdownLeft}>
                      <View style={[styles.statDot, { backgroundColor: colors.secondary }]} />
                      <ThemedText style={[styles.statBreakdownLabel, { color: colors.textSecondary }]}>
                        Hostel Fee
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.statBreakdownValue, { color: colors.secondary }]}>
                      {formatCurrency(summary.totalHostelFee || 0)}
                    </ThemedText>
                  </View>
                </View>

                {(appliedFilters.startDate || appliedFilters.endDate) && (
                  <View style={[styles.statDateRange, { backgroundColor: colors.inputBackground }]}>
                    <MaterialIcons name="date-range" size={16} color={colors.primary} />
                    <ThemedText style={[styles.statDateRangeText, { color: colors.textSecondary }]}>
                      {appliedFilters.startDate || 'Start'} to {appliedFilters.endDate || 'End'}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.statFilterInfo}>
                  <View style={[styles.statFilterChip, { backgroundColor: colors.inputBackground }]}>
                    <MaterialIcons name="class" size={12} color={colors.primary} />
                    <ThemedText style={[styles.statFilterText, { color: colors.textSecondary }]}>
                      Class: {appliedFilters.class === 'ALL' ? 'All' : appliedFilters.class}
                    </ThemedText>
                  </View>
                  <View style={[styles.statFilterChip, { backgroundColor: colors.inputBackground }]}>
                    <MaterialIcons name="subtitles" size={12} color={colors.primary} />
                    <ThemedText style={[styles.statFilterText, { color: colors.textSecondary }]}>
                      Section: {appliedFilters.section === 'ALL' ? 'All' : appliedFilters.section}
                    </ThemedText>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.statLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={[styles.statLoadingText, { color: colors.textSecondary }]}>
                  Loading statistics...
                </ThemedText>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.statCloseButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowStatsModal(false)}
          >
            <ThemedText style={styles.statCloseButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  ), [showStatsModal, colors, summary, appliedFilters, formatCurrency])

  // Loading component
  const LoadingComponent = useCallback(() => (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText style={[styles.loadingText, { color: colors.text }]}>
        Loading payment history...
      </ThemedText>
    </View>
  ), [colors])

  // Empty component - only show when not loading and no data
  const EmptyComponent = useCallback(() => {
    if (loading || initialLoading || refreshing) return null
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="history" size={48} color={colors.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
          No Payment History
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {hasActiveFilters 
            ? 'No payments found matching your filters. Try clearing filters.' 
            : 'No payments have been recorded yet.'}
        </ThemedText>
        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.clearFilterButton, { backgroundColor: colors.primary }]}
            onPress={clearFilters}
          >
            <ThemedText style={styles.clearFilterButtonText}>Clear Filters</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    )
  }, [colors, loading, initialLoading, refreshing, hasActiveFilters, clearFilters])

  // Footer component
  const FooterComponent = useCallback(() => {
    if (loading && pagination.hasNext && !refreshing) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.footerLoaderText, { color: colors.textSecondary }]}>
            Loading more...
          </ThemedText>
        </View>
      )
    }
    return null
  }, [loading, pagination.hasNext, refreshing, colors])

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient 
          colors={[colors.gradientStart, colors.gradientEnd]} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]} 
                onPress={onClose}
              >
                <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Payment History</ThemedText>
                <ThemedText style={styles.subtitle}>
                  {initialLoading || loading ? 'Loading...' : `${totalRecords} ${totalRecords === 1 ? 'record' : 'records'} found`}
                </ThemedText>
              </View>
              
              <View>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]} 
                  onPress={openFilterModal}
                >
                  <Feather name="filter" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                {hasActiveFilters && <View style={styles.filterDot} />}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Main Content */}
        {initialLoading ? (
          <LoadingComponent />
        ) : (
          <FlatList
            data={payments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id || Math.random().toString()}
            contentContainerStyle={[
              styles.listContent,
              payments.length === 0 && { flex: 1, justifyContent: 'center' }
            ]}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh} 
                colors={[colors.primary]} 
                tintColor={colors.primary} 
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={EmptyComponent}
            ListFooterComponent={FooterComponent}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        )}

        {/* Action Buttons - Absolute positioned on bottom with primary color */}
        {payments.length > 0 && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowStatsModal(true)}
            >
              <MaterialIcons name="bar-chart" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Statistics</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={exportToExcel}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="download" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Export</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {renderFilterModal()}
        {renderStatsModal()}

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={tempFilters.startDate ? new Date(tempFilters.startDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => handleDateChange(event, date, 'start')}
            maximumDate={new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={tempFilters.endDate ? new Date(tempFilters.endDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => handleDateChange(event, date, 'end')}
            maximumDate={new Date()}
            minimumDate={tempFilters.startDate ? new Date(tempFilters.startDate) : undefined}
          />
        )}

        {/* Fee Receipt Modal */}
        <FeeReceipt
          visible={showFeeReceipt}
          onClose={handleCloseFeeReceipt}
          receiptData={receiptData}
          loading={loadingReceipt}
          downloading={downloading}
          printing={printing}
          onDownload={generatePDFReceipt}
          onPrint={handlePrintReceipt}
        />

        <ToastNotification 
          visible={toast.visible} 
          type={toast.type} 
          message={toast.message} 
          duration={3000} 
          onHide={hideToast} 
          position="top-center" 
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  title: { 
    fontSize: 18, 
    color: '#FFFFFF', 
    marginBottom: -5,
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: { 
    marginTop: 4, 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Poppins-Medium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  paymentCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  paymentHeader: {
    padding: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  classSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classSectionText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    opacity: 0.7,
  },
  separatorDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    opacity: 0.7,
  },
  paymentDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paymentModeText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  receiptText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    paddingHorizontal: 20,
    opacity: 0.7,
    marginBottom: 20,
  },
  clearFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  // Action Buttons Styles - Updated with primary color
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterHalf: {
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  dateRangeSeparator: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  // Dropdown styles
  customDropdownContainer: {
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  dropdownSelectedText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 2000,
  },
  dropdownListBottom: {
    marginTop: 6,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 1000,
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
  },
  // Stats modal styles
  statCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    opacity: 0.7,
  },
  statBreakdown: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  statBreakdownTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  statBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statBreakdownLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    opacity: 0.7,
  },
  statBreakdownValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  statDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statDateRangeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    opacity: 0.7,
  },
  statFilterInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statFilterText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    opacity: 0.7,
  },
  statLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  statLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  statCloseButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  statCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
})