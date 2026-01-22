import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import BusFeeSettings from './BusFeeSettings'
import ClassFeeSettings from './ClassFeeSettings'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const academicYears = [
  'All',
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
]

// Define class order from Pre Nursery to Class 12
const classOrder = {
  'pre nursery': 1,
  'nursery': 2,
  'kg': 3,
  'lkg': 4,
  'ukg': 5,
  'prep': 6,
  '1': 7,
  '2': 8,
  '3': 9,
  '4': 10,
  '5': 11,
  '6': 12,
  '7': 13,
  '8': 14,
  '9': 15,
  '10': 16,
  '11': 17,
  '12': 18,
  'i': 15, // Roman numerals support
  'ii': 16,
  'iii': 17,
  'iv': 18,
  'v': 19,
  'vi': 20,
  'vii': 21,
  'viii': 22,
  'ix': 23,
  'x': 24,
  'xi': 25,
  'xii': 26,
}

// Function to sort classes in proper order
const sortClassesByOrder = (fees) => {
  return [...fees].sort((a, b) => {
    const classA = (a.className || '').toString().toLowerCase().trim()
    const classB = (b.className || '').toString().toLowerCase().trim()
    
    // Extract numeric or named class
    const getClassValue = (className) => {
      // Remove non-alphanumeric characters and spaces
      const cleanClass = className.replace(/[^a-z0-9\s]/gi, '').toLowerCase().trim()
      
      // Check for pre nursery
      if (cleanClass.includes('pre') && cleanClass.includes('nursery')) return classOrder['pre nursery']
      
      // Check for nursery
      if (cleanClass.includes('nursery') && !cleanClass.includes('pre')) return classOrder['nursery']
      
      // Check for KG/LKG/UKG
      if (cleanClass.includes('kg')) {
        if (cleanClass.includes('lkg')) return classOrder['lkg']
        if (cleanClass.includes('ukg')) return classOrder['ukg']
        return classOrder['kg']
      }
      
      // Check for prep
      if (cleanClass.includes('prep')) return classOrder['prep']
      
      // Extract numeric part
      const numMatch = cleanClass.match(/\d+/)
      if (numMatch) {
        const num = parseInt(numMatch[0])
        if (num >= 1 && num <= 12) return classOrder[num.toString()]
      }
      
      // Check for roman numerals
      const romanMatch = cleanClass.match(/\b(i{1,3}|iv|v|vi{0,3}|ix|x|xi|xii)\b/i)
      if (romanMatch) {
        const roman = romanMatch[0].toLowerCase()
        if (classOrder[roman]) return classOrder[roman]
      }
      
      // Default: alphabetical
      return 100 + className.charCodeAt(0)
    }
    
    const valueA = getClassValue(classA)
    const valueB = getClassValue(classB)
    
    // First sort by order
    if (valueA !== valueB) return valueA - valueB
    
    // If same order, sort by academic year (newest first)
    const yearA = a.academicYear || ''
    const yearB = b.academicYear || ''
    return yearB.localeCompare(yearA)
  })
}

// Memoized Header Component
const HeaderComponent = React.memo(({
  colors,
  searchQuery,
  handleSearch,
  activeTab,
  setActiveTab,
  selectedAcademicYear,
  renderAcademicYearDropdown,
  filteredClassFees,
  filteredBusFees,
  handleAddClassFee,
  handleAddBusFee,
  setShowUploadModal,
  searchInputRef,
  slideAnim,
  flatListRef
}) => {
  const styles = useMemo(() => {
    return StyleSheet.create({
      headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 8,
      },
      searchRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
      },
      searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
      },
      searchIcon: {
        marginRight: 5,
      },
      searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        marginBottom: -3,
      },
      clearButton: {
        padding: 4,
      },
      tabsContainer: {
        marginBottom: 16,
        position: 'relative',
      },
      tabsWrapper: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        backgroundColor: colors.inputBackground,
      },
      tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
        position: 'relative',
      },
      activeTab: {
        backgroundColor: colors.background,
      },
      tabText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
      },
      tabBadge: {
        position: 'absolute',
        top: 6,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      tabBadgeText: {
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
      },
      tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 4,
        width: '50%',
        height: 3,
        borderRadius: 1.5,
      },
      actionButtonsContainer: {
        marginBottom: 5,
      },
      actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
      },
      bulkUploadButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
      },
      actionButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
      },
      resultsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      resultsText: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
      },
      clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
      },
      clearFiltersText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
        color: colors.textSecondary,
      },
    })
  }, [colors])

  const handleClearSearch = useCallback(() => {
    handleSearch('')
  }, [handleSearch])

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchInputContainer, { 
          backgroundColor: colors.inputBackground, 
          borderColor: colors.primary + '40',
          flex: 1
        }]}>
          <Feather name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            placeholder={`Search ${activeTab === 'class' ? 'class' : 'bus'} fees...`}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity 
              activeOpacity={.9}
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Feather name="x-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={{ flex: 1 }}>
          {renderAcademicYearDropdown()}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={[styles.tabsWrapper, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity 
            activeOpacity={.9}
            style={[styles.tab, activeTab === 'class' && styles.activeTab]}
            onPress={() => {
              setActiveTab('class')
              flatListRef.current?.scrollToOffset({ animated: true, offset: 0 })
            }}
          >
            <MaterialIcons 
              name="school" 
              size={20} 
              color={activeTab === 'class' ? colors.primary : colors.textSecondary} 
            />
            <ThemedText style={[
              styles.tabText, 
              { color: activeTab === 'class' ? colors.primary : colors.textSecondary }
            ]}>
              Class Fees
            </ThemedText>
            {filteredClassFees.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText style={[styles.tabBadgeText, { color: colors.primary }]}>
                  {filteredClassFees.length}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={.9}
            style={[styles.tab, activeTab === 'bus' && styles.activeTab]}
            onPress={() => {
              setActiveTab('bus')
              flatListRef.current?.scrollToOffset({ animated: true, offset: 0 })
            }}
          >
            <MaterialIcons 
              name="directions-bus" 
              size={20} 
              color={activeTab === 'bus' ? colors.success : colors.textSecondary} 
            />
            <ThemedText style={[
              styles.tabText, 
              { color: activeTab === 'bus' ? colors.success : colors.textSecondary }
            ]}>
              Bus Fees
            </ThemedText>
            {filteredBusFees.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.success + '20' }]}>
                <ThemedText style={[styles.tabBadgeText, { color: colors.success }]}>
                  {filteredBusFees.length}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Animated indicator bar at bottom */}
        <Animated.View 
          style={[
            styles.tabIndicator,
            { 
              backgroundColor: activeTab === 'class' ? colors.primary : colors.success,
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 190]
                })
              }]
            }
          ]}
        />
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            activeOpacity={.9}
            style={[
              styles.actionButton, 
              { 
                backgroundColor: activeTab === 'class' ? colors.primary + '15' : colors.success + '15', 
                borderColor: activeTab === 'class' ? colors.primary : colors.success,
                flex: 1,
                marginRight: 8
              }
            ]}
            onPress={activeTab === 'class' ? handleAddClassFee : handleAddBusFee}
          >
            <Feather name="plus" size={18} color={activeTab === 'class' ? colors.primary : colors.success} />
            <ThemedText style={[styles.actionButtonText, { 
              color: activeTab === 'class' ? colors.primary : colors.success 
            }]}>
              Add {activeTab === 'class' ? 'Class Fee' : 'Bus Fee'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={.9}
            style={[
              styles.bulkUploadButton,
              { 
                backgroundColor: activeTab === 'class' ? colors.primary + '15' : colors.success + '15',
                borderColor: activeTab === 'class' ? colors.primary : colors.success
              }
            ]}
            onPress={() => setShowUploadModal(true)}
          >
            <Feather name="upload" size={16} color={activeTab === 'class' ? colors.primary : colors.success} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

export default function CollectFees({ visible, onClose }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [busFeeModalVisible, setBusFeeModalVisible] = useState(false)
  const [classFeeModalVisible, setClassFeeModalVisible] = useState(false)
  const [editingBusFee, setEditingBusFee] = useState(null)
  const [editingClassFee, setEditingClassFee] = useState(null)
  const [classFees, setClassFees] = useState([])
  const [busFees, setBusFees] = useState([])
  const [filteredClassFees, setFilteredClassFees] = useState([])
  const [filteredBusFees, setFilteredBusFees] = useState([])
  const [activeTab, setActiveTab] = useState('class')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('All')
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 })
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info'
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  
  const slideAnim = useRef(new Animated.Value(0)).current
  const searchInputRef = useRef(null)
  const yearSelectorRef = useRef(null)
  const flatListRef = useRef(null)

  const showToast = (message, type = 'info') => {
    setToast({
      visible: true,
      message,
      type
    })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    // Animate tab indicator when tab changes
    Animated.timing(slideAnim, {
      toValue: activeTab === 'class' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [activeTab])

  // Load initial data
  useEffect(() => {
    if (visible) {
      loadData()
    }
  }, [visible])

  const loadData = async (pageNum = 1, isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true)
      } else if (pageNum === 1) {
        setLoading(true)
      }

      const limit = 20
      const offset = (pageNum - 1) * limit

      // Fetch class fees
      const classResponse = await axiosApi.get('/class-fees', {
        params: {
          page: pageNum,
          limit: limit,
          academicYear: selectedAcademicYear !== 'All' ? selectedAcademicYear : undefined,
          isActive: true
        }
      })

      // Fetch bus fees
      const busResponse = await axiosApi.get('/bus-fees', {
        params: {
          page: pageNum,
          limit: limit,
          academicYear: selectedAcademicYear !== 'All' ? selectedAcademicYear : undefined,
          isActive: true
        }
      })

      if (pageNum === 1) {
        const rawClassFees = classResponse.data.data?.classFees || []
        const sortedClassFees = sortClassesByOrder(rawClassFees)
        
        setClassFees(sortedClassFees)
        setBusFees(busResponse.data.data?.busFees || [])
        setFilteredClassFees(sortedClassFees)
        setFilteredBusFees(busResponse.data.data?.busFees || [])
      } else {
        const newClassFees = classResponse.data.data?.classFees || []
        const sortedNewClassFees = sortClassesByOrder(newClassFees)
        
        setClassFees(prev => {
          const combined = [...prev, ...sortedNewClassFees]
          return sortClassesByOrder(combined)
        })
        
        setBusFees(prev => [...prev, ...(busResponse.data.data?.busFees || [])])
        setFilteredClassFees(prev => {
          const combined = [...prev, ...sortedNewClassFees]
          return sortClassesByOrder(combined)
        })
        setFilteredBusFees(prev => [...prev, ...(busResponse.data.data?.busFees || [])])
      }

      // Update pagination info
      const classTotalPages = classResponse.data.data?.pagination?.pages || 1
      const busTotalPages = busResponse.data.data?.pagination?.pages || 1
      setTotalPages(Math.max(classTotalPages, busTotalPages))
      setHasMore(pageNum < Math.max(classTotalPages, busTotalPages))

    } catch (error) {
      console.error('Error loading fees:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load fees. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = useCallback(() => {
    setPage(1)
    setHasMore(true)
    loadData(1, true)
  }, [selectedAcademicYear])

  const handleLoadMore = () => {
    if (!hasMore || loading || refreshing) return
    
    const nextPage = page + 1
    setPage(nextPage)
    loadData(nextPage)
  }

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      // If no search query, just filter by academic year
      if (selectedAcademicYear === 'All') {
        const sortedClassFees = sortClassesByOrder(classFees)
        setFilteredClassFees(sortedClassFees)
        setFilteredBusFees(busFees)
      } else {
        const filteredByYear = classFees.filter(fee => fee.academicYear === selectedAcademicYear)
        const sortedFilteredClassFees = sortClassesByOrder(filteredByYear)
        setFilteredClassFees(sortedFilteredClassFees)
        setFilteredBusFees(busFees.filter(fee => fee.academicYear === selectedAcademicYear))
      }
      return
    }
    
    const lowerQuery = query.toLowerCase()
    
    // Filter based on active tab
    if (activeTab === 'class') {
      let filteredClasses = classFees
      
      // Filter by academic year if not "All"
      if (selectedAcademicYear !== 'All') {
        filteredClasses = filteredClasses.filter(fee => fee.academicYear === selectedAcademicYear)
      }
      
      // Filter by search query
      if (query.trim()) {
        filteredClasses = filteredClasses.filter(fee => 
          fee.className?.toLowerCase().includes(lowerQuery) ||
          fee.totalAnnualFee?.toString().includes(query)
        )
      }
      
      // Sort the filtered results
      const sortedFilteredClasses = sortClassesByOrder(filteredClasses)
      setFilteredClassFees(sortedFilteredClasses)
    } else {
      let filteredBuses = busFees
      
      // Filter by academic year if not "All"
      if (selectedAcademicYear !== 'All') {
        filteredBuses = filteredBuses.filter(fee => fee.academicYear === selectedAcademicYear)
      }
      
      // Filter by search query
      if (query.trim()) {
        filteredBuses = filteredBuses.filter(fee => 
          fee.villageName?.toLowerCase().includes(lowerQuery) ||
          fee.vehicleType?.toLowerCase().includes(lowerQuery) ||
          fee.feeAmount?.toString().includes(query) ||
          fee.distance?.toString().includes(query)
        )
      }
      
      setFilteredBusFees(filteredBuses)
    }
  }, [activeTab, selectedAcademicYear, classFees, busFees])

  const handleYearSelect = async (year) => {
    setSelectedAcademicYear(year)
    setShowYearDropdown(false)
    setSearchQuery('')
    setPage(1)
    setHasMore(true)

    try {
      setLoading(true)

      const limit = 20
      
      // Fetch filtered data
      const classResponse = await axiosApi.get('/class-fees', {
        params: {
          page: 1,
          limit: limit,
          academicYear: year !== 'All' ? year : undefined,
          isActive: true
        }
      })

      const busResponse = await axiosApi.get('/bus-fees', {
        params: {
          page: 1,
          limit: limit,
          academicYear: year !== 'All' ? year : undefined,
          isActive: true
        }
      })

      const rawClassFees = classResponse.data.data?.classFees || []
      const sortedClassFees = sortClassesByOrder(rawClassFees)
      
      setClassFees(sortedClassFees)
      setBusFees(busResponse.data.data?.busFees || [])
      setFilteredClassFees(sortedClassFees)
      setFilteredBusFees(busResponse.data.data?.busFees || [])

      // Update pagination info
      const classTotalPages = classResponse.data.data?.pagination?.pages || 1
      const busTotalPages = busResponse.data.data?.pagination?.pages || 1
      setTotalPages(Math.max(classTotalPages, busTotalPages))
      setHasMore(1 < Math.max(classTotalPages, busTotalPages))

    } catch (error) {
      console.error('Error loading filtered fees:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load filtered fees.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBusFee = useCallback(() => {
    setEditingBusFee(null)
    setBusFeeModalVisible(true)
  }, [])

  const handleEditBusFee = useCallback((busFee) => {
    setEditingBusFee(busFee)
    setBusFeeModalVisible(true)
  }, [])

  const handleAddClassFee = useCallback(() => {
    setEditingClassFee(null)
    setClassFeeModalVisible(true)
  }, [])

  const handleEditClassFee = useCallback((classFee) => {
    setEditingClassFee(classFee)
    setClassFeeModalVisible(true)
  }, [])

  const handleBusFeeSave = async (data, isDeleted = false) => {
    try {
      if (isDeleted) {
        // Refresh data after deletion
        await loadData(1, true)
        showToast('Bus fee deleted successfully!', 'success')
      } else if (data) {
        // Refresh data after save
        await loadData(1, true)
        showToast('Bus fee saved successfully!', 'success')
      }
      
      setBusFeeModalVisible(false)
      setEditingBusFee(null)
    } catch (error) {
      console.error('Error handling bus fee save:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update bus fee.'
      showToast(errorMessage, 'error')
    }
  }

  const handleClassFeeSave = async (data, isDeleted = false) => {
    try {
      if (isDeleted) {
        // Refresh data after deletion
        await loadData(1, true)
        showToast('Class fee deleted successfully!', 'success')
      } else if (data) {
        // Refresh data after save
        await loadData(1, true)
        showToast('Class fee saved successfully!', 'success')
      }
      
      setClassFeeModalVisible(false)
      setEditingClassFee(null)
    } catch (error) {
      console.error('Error handling class fee save:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update class fee.'
      showToast(errorMessage, 'error')
    }
  }

  const downloadTemplate = async () => {
    try {
      setLoading(true)
      
      // Determine which template to download
      const endpoint = activeTab === 'class' 
        ? '/class-fees/download-template' 
        : '/bus-fees/download-template'
      
      const response = await axiosApi.get(endpoint, {
        responseType: 'blob',
      })
      
      // Create blob from response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${activeTab === 'class' ? 'class_fees_template' : 'bus_fees_template'}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showToast('Template downloaded successfully!', 'success')
      setTemplateModalVisible(false)
      
    } catch (error) {
      console.error('Error downloading template:', error)
      showToast('Failed to download template. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async () => {
    try {
      // Pick Excel file
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '.xlsx',
          '.xls'
        ],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      
      // Validate file
      const validExtensions = ['.xlsx', '.xls']
      const fileExtension = asset.name.toLowerCase().slice(asset.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        showToast('Please select an Excel file (.xlsx or .xls)', 'error')
        return
      }
      
      if (asset.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error')
        return
      }

      setUploading(true)
      setUploadProgress(0)
      setUploadResult(null)

      // Get the actual file URI
      let fileUri = asset.uri;
      
      // For iOS, we might need to add file:// prefix
      if (Platform.OS === 'ios' && !fileUri.startsWith('file://')) {
        fileUri = `file://${fileUri}`;
      }
      
      // Create FormData
      const formData = new FormData();
      
      // Get the filename
      const fileName = asset.name || `${activeTab}_fees_${Date.now()}.xlsx`;
      
      // Append the file
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: asset.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      console.log('Uploading file:', fileName);

      // Upload to backend
      const endpoint = activeTab === 'class' ? '/class-fees/bulk-upload' : '/bus-fees/bulk-upload'
      const response = await axiosApi.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        },
      })

      if (response.data.success) {
        const results = response.data.data
        setUploadResult(results)
        
        let successMessage = `Bulk upload completed! `;
        if (results.created) successMessage += `Created: ${results.created}, `;
        if (results.updated) successMessage += `Updated: ${results.updated}`;
        
        showToast(successMessage, 'success')
        
        if (results.errors && results.errors.length > 0) {
          showToast(`${results.errors.length} errors occurred during upload. Check details below.`, 'warning')
        }
        
        // Refresh data
        await loadData(1, true)
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      let errorMessage = 'Failed to upload file';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.';
      } else {
        errorMessage = error.message || 'Failed to upload file';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const resetUpload = () => {
    setUploadResult(null)
    setUploadProgress(0)
    setShowUploadModal(false)
  }

  const renderUploadModal = () => (
    <Modal
      transparent
      visible={showUploadModal}
      animationType="fade"
      onRequestClose={() => {
        if (!uploading) {
          resetUpload()
        }
      }}
      statusBarTranslucent={true}
    >
      <View style={styles.uploadModalOverlay}>
        <View style={[styles.uploadModalContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.uploadModalHeader}>
            <View style={[styles.uploadModalIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Feather name="upload" size={24} color={colors.primary} />
            </View>
            <View style={styles.uploadModalTitleContainer}>
              <ThemedText type="title" style={[styles.uploadModalTitle, { color: colors.text }]}>
                Bulk Upload {activeTab === 'class' ? 'Class Fees' : 'Bus Fees'}
              </ThemedText>
              <ThemedText style={[styles.uploadModalSubtitle, { color: colors.textSecondary }]}>
                Upload Excel file with {activeTab === 'class' ? 'class fee' : 'bus fee'} data
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!uploading) resetUpload()
              }}
              disabled={uploading}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.uploadModalContent} showsVerticalScrollIndicator={false}>
            {/* Template Download */}
            <View style={[styles.stepCard, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '20' }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIcon, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialCommunityIcons name="file-download" size={20} color={colors.primary} />
                </View>
                <View style={styles.stepTextContainer}>
                  <ThemedText type="subtitle" style={[styles.stepTitle, { color: colors.primary }]}>
                    Step 1: Download Template
                  </ThemedText>
                  <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Download the Excel template with correct column structure
                  </ThemedText>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.downloadButton, { 
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary
                }]}
                onPress={downloadTemplate}
                disabled={loading}
              >
                <MaterialCommunityIcons name="file-excel" size={20} color={colors.primary} />
                <ThemedText style={[styles.downloadButtonText, { color: colors.primary }]}>
                  Download Excel Template
                </ThemedText>
              </TouchableOpacity>
              
              <View style={styles.templateInfoContainer}>
                <ThemedText type="caption" style={[styles.templateInfoTitle, { color: colors.text }]}>
                  Required Columns for {activeTab === 'class' ? 'Class Fees' : 'Bus Fees'}:
                </ThemedText>
                <View style={styles.columnsList}>
                  {activeTab === 'class' ? (
                    <>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>className</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>academicYear</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>totalAnnualFee</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="circle" size={12} color={colors.textSecondary} />
                        <ThemedText style={[styles.columnText, { color: colors.textSecondary }]}>totalTerms (optional)</ThemedText>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>villageName</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>distance</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>feeAmount</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="check" size={12} color={colors.success} />
                        <ThemedText style={[styles.columnText, { color: colors.text }]}>academicYear</ThemedText>
                      </View>
                      <View style={styles.columnItem}>
                        <Feather name="circle" size={12} color={colors.textSecondary} />
                        <ThemedText style={[styles.columnText, { color: colors.textSecondary }]}>vehicleType (optional)</ThemedText>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* File Upload */}
            <View style={[styles.stepCard, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '20' }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="upload-cloud" size={20} color={colors.primary} />
                </View>
                <View style={styles.stepTextContainer}>
                  <ThemedText type="subtitle" style={[styles.stepTitle, { color: colors.primary }]}>
                    Step 2: Upload File
                  </ThemedText>
                  <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Select your prepared Excel file. Existing records will be updated, new ones created.
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.uploadInstructions}>
                <ThemedText type="caption" style={[styles.instructionsTitle, { color: colors.text }]}>
                  File Requirements:
                </ThemedText>
                <View style={styles.instructionsList}>
                  <View style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <ThemedText style={[styles.instructionText, { color: colors.textSecondary }]}>
                      Excel format (.xlsx or .xls)
                    </ThemedText>
                  </View>
                  <View style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <ThemedText style={[styles.instructionText, { color: colors.textSecondary }]}>
                      Maximum file size: 10MB
                    </ThemedText>
                  </View>
                  <View style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <ThemedText style={[styles.instructionText, { color: colors.textSecondary }]}>
                      First row should contain headers
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.uploadFileButton, { 
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary,
                  borderStyle: 'dashed'
                }]}
                onPress={handleBulkUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <ThemedText style={[styles.uploadFileButtonText, { color: colors.primary }]}>
                      Uploading... {uploadProgress}%
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <Feather name="upload-cloud" size={24} color={colors.primary} />
                    <ThemedText style={[styles.uploadFileButtonText, { color: colors.primary }]}>
                      Select Excel File
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              
              {uploading && uploadProgress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          backgroundColor: colors.primary,
                          width: `${uploadProgress}%` 
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
                    {uploadProgress}% uploaded
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Upload Results */}
            {uploadResult && (
              <View style={[styles.resultCard, { 
                borderColor: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning : colors.success,
                backgroundColor: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning + '10' : colors.success + '10'
              }]}>
                <View style={styles.resultHeader}>
                  <View style={[styles.resultIconContainer, { 
                    backgroundColor: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning + '20' : colors.success + '20' 
                  }]}>
                    <Feather 
                      name={(uploadResult.errors && uploadResult.errors.length > 0) ? "alert-triangle" : "check-circle"} 
                      size={24} 
                      color={(uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning : colors.success} 
                    />
                  </View>
                  <View style={styles.resultTitleContainer}>
                    <ThemedText type="subtitle" style={[styles.resultTitle, { 
                      color: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning : colors.success
                    }]}>
                      {(uploadResult.errors && uploadResult.errors.length > 0) ? 'Upload Completed with Errors' : 'Upload Successful!'}
                    </ThemedText>
                    <ThemedText style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                      {uploadResult.created || uploadResult.updated ? 'Data processed successfully' : 'No data was processed'}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.resultStats}>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: colors.text }]}>
                      {(uploadResult.created || 0) + (uploadResult.updated || 0)}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Total Processed
                    </ThemedText>
                  </View>
                  
                  {uploadResult.created > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.success }]}>
                        {uploadResult.created}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Created
                      </ThemedText>
                    </View>
                  )}
                  
                  {uploadResult.updated > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.info }]}>
                        {uploadResult.updated}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Updated
                      </ThemedText>
                    </View>
                  )}
                  
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.error }]}>
                        {uploadResult.errors.length}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Errors
                      </ThemedText>
                    </View>
                  )}
                  
                  {uploadResult.skipped > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.textSecondary }]}>
                        {uploadResult.skipped}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Skipped
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <View style={styles.errorSection}>
                    <View style={styles.errorHeader}>
                      <Feather name="alert-circle" size={16} color={colors.error} />
                      <ThemedText style={[styles.errorTitle, { color: colors.text }]}>
                        Errors ({uploadResult.errors.length}):
                      </ThemedText>
                    </View>
                    <ScrollView style={styles.errorsList} showsVerticalScrollIndicator={false}>
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <View key={index} style={[styles.errorItem, { 
                          backgroundColor: colors.error + '10',
                          borderLeftColor: colors.error
                        }]}>
                          <ThemedText style={[styles.errorRow, { color: colors.text }]}>
                            Row {error.row}: 
                          </ThemedText>
                          <ThemedText style={[styles.errorText, { color: colors.error }]}>
                            {error.message || error.error}
                          </ThemedText>
                        </View>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <View style={styles.moreErrors}>
                          <ThemedText style={[styles.moreErrorsText, { color: colors.textSecondary }]}>
                            + {uploadResult.errors.length - 10} more errors...
                          </ThemedText>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
          
          <View style={[styles.uploadModalButtons, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.uploadModalButton, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }]}
              onPress={() => {
                if (uploadResult) {
                  // If we have results, just close
                  resetUpload()
                } else if (uploading) {
                  // If uploading, show confirmation
                  Alert.alert(
                    'Cancel Upload',
                    'Are you sure you want to cancel the upload?',
                    [
                      { text: 'No', style: 'cancel' },
                      { 
                        text: 'Yes', 
                        style: 'destructive',
                        onPress: () => {
                          setUploading(false)
                          setUploadProgress(0)
                          setShowUploadModal(false)
                        }
                      }
                    ]
                  )
                } else {
                  resetUpload()
                }
              }}
              disabled={uploading && !uploadResult}
            >
              <ThemedText style={[styles.uploadModalButtonText, { color: colors.text }]}>
                {uploadResult ? 'Close' : uploading ? 'Cancel' : 'Cancel Upload'}
              </ThemedText>
            </TouchableOpacity>
            
            {uploadResult && (
              <TouchableOpacity
                style={[styles.uploadModalButton, { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary
                }]}
                onPress={() => {
                  resetUpload()
                  loadData(1, true)
                }}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText style={[styles.uploadModalButtonText, { color: '#FFFFFF' }]}>
                  Refresh Data
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderClassFeeItem = useCallback(({ item }) => {
    const termAmount = item.totalAnnualFee / (item.totalTerms || 3)
    
    // Format class name display
    const formatClassName = (className) => {
      if (!className) return 'Class'
      
      const str = className.toString()
      // Capitalize first letter of each word
      return str.replace(/\b\w/g, char => char.toUpperCase())
    }
    
    return (
      <TouchableOpacity
        activeOpacity={.9}
        style={[styles.classFeeCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleEditClassFee(item)}
      >
        <View style={styles.classFeeHeader}>
          <View style={[styles.classIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="school" size={24} color={colors.primary} />
          </View>
          <View style={styles.classFeeInfo}>
            <ThemedText style={styles.className}>Class {formatClassName(item.className)}</ThemedText>
            <View style={styles.classMetaRow}>
              <View style={[styles.academicYearBadge, { backgroundColor: colors.primary + '10' }]}>
                <Feather name="calendar" size={10} color={colors.primary} />
                <ThemedText style={[styles.academicYearText, { color: colors.primary }]}>
                  {item.academicYear}
                </ThemedText>
              </View>
              <View style={[styles.termsBadge, { backgroundColor: colors.info + '10' }]}>
                <MaterialIcons name="layers" size={10} color={colors.info} />
                <ThemedText style={[styles.termsText, { color: colors.info }]}>
                  {item.totalTerms || 3} Terms
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={[styles.editIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="edit" size={16} color={colors.primary} />
          </View>
        </View>
        
        <View style={styles.feeAmountContainer}>
          <View style={styles.feeColumn}>
            <ThemedText style={styles.feeLabel}>Annual Fee</ThemedText>
            <ThemedText style={styles.annualFee}>₹{item.totalAnnualFee?.toLocaleString() || '0'}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.feeColumn}>
            <ThemedText style={styles.feeLabel}>Per Term</ThemedText>
            <ThemedText style={styles.termFee}>₹{termAmount.toLocaleString()}</ThemedText>
          </View>
        </View>
        
        {item.description && (
          <View style={[styles.descriptionContainer, { backgroundColor: colors.inputBackground }]}>
            <Feather name="file-text" size={12} color={colors.textSecondary} />
            <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    )
  }, [colors])

  const renderBusFeeItem = useCallback(({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={.9}
        style={[styles.busFeeCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleEditBusFee(item)}
      >
        <View style={styles.busFeeHeader}>
          <View style={[styles.busIcon, { backgroundColor: colors.success + '20' }]}>
            <MaterialIcons name="directions-bus" size={24} color={colors.success} />
          </View>
          <View style={styles.busFeeInfo}>
            <ThemedText style={styles.busVillage}>{item.villageName}</ThemedText>
            <View style={styles.busMeta}>
              <View style={[styles.distanceBadge, { backgroundColor: colors.success + '10' }]}>
                <Feather name="map-pin" size={10} color={colors.success} />
                <ThemedText style={[styles.distanceText, { color: colors.success }]}>
                  {item.distance} km
                </ThemedText>
              </View>
              <View style={[styles.vehicleBadge, { backgroundColor: colors.warning + '10' }]}>
                <MaterialIcons name="directions-car" size={10} color={colors.warning} />
                <ThemedText style={[styles.vehicleText, { color: colors.warning }]}>
                  {item.vehicleType || 'Bus'}
                </ThemedText>
              </View>
              <View style={[styles.yearBadge, { backgroundColor: colors.info + '10' }]}>
                <Feather name="calendar" size={10} color={colors.info} />
                <ThemedText style={[styles.yearText, { color: colors.info }]}>
                  {item.academicYear}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={[styles.editIconContainer, { backgroundColor: colors.success + '15' }]}>
            <Feather name="edit" size={16} color={colors.success} />
          </View>
        </View>
        
        <View style={[styles.busFeeAmountContainer, { backgroundColor: colors.inputBackground }]}>
          <View style={styles.busFeeInfoRow}>
            <FontAwesome5 name="rupee-sign" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.busFeeLabel, { color: colors.textSecondary }]}>
              Bus Fee:
            </ThemedText>
          </View>
          <ThemedText style={styles.busFeeAmount}>₹{item.feeAmount?.toLocaleString() || '0'}</ThemedText>
        </View>
        
        {item.description && (
          <View style={[styles.descriptionContainer, { backgroundColor: colors.inputBackground }]}>
            <Feather name="file-text" size={12} color={colors.textSecondary} />
            <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    )
  }, [colors])

  const renderAcademicYearDropdown = useCallback(() => {
    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          activeOpacity={.9}
          style={[styles.yearSelector, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.primary + '40' 
          }]}
          ref={yearSelectorRef}
          onPress={() => {
            yearSelectorRef.current.measure((x, y, width, height, pageX, pageY) => {
              setDropdownPosition({
                x: pageX,
                y: pageY + height + 8,
                width: width
              })
              setShowYearDropdown(true)
            })
          }}
        >
          <Feather name="calendar" size={16} color={colors.primary} />
          <ThemedText style={[styles.selectedYearText, { color: colors.text }]}>
            {selectedAcademicYear}
          </ThemedText>
          <Feather 
            name={showYearDropdown ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={showYearDropdown}
          animationType="fade"
          onRequestClose={() => setShowYearDropdown(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowYearDropdown(false)}
          >
            <ScrollView style={[
              styles.dropdownListModal,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                position: 'absolute',
                top: dropdownPosition.y,
                left: dropdownPosition.x,
                width: dropdownPosition.width,
                maxHeight: 300,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
              }
            ]}>
              {academicYears.map((year, index) => (
                <TouchableOpacity
                  key={year}
                  activeOpacity={.9}
                  style={[
                    styles.dropdownItem,
                    index === academicYears.length - 1 ? {} : { borderBottomColor: colors.border + '50' },
                    selectedAcademicYear === year && { backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <ThemedText style={[
                    styles.dropdownItemText,
                    selectedAcademicYear === year && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
                  ]}>
                    {year}
                  </ThemedText>
                  {selectedAcademicYear === year && (
                    <Feather name="check" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </Modal>
      </View>
    )
  }, [colors, selectedAcademicYear, showYearDropdown, dropdownPosition])

  const renderFooter = () => {
    if (!hasMore || loading || refreshing) return null
    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity 
          style={[styles.loadMoreButton, { backgroundColor: colors.primary + '15' }]}
          onPress={handleLoadMore}
        >
          <ThemedText style={[styles.loadMoreText, { color: colors.primary }]}>
            Load More
          </ThemedText>
          <Feather name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    title: {
      fontSize: 18,
      color: '#FFFFFF',
      marginBottom: -5,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    content: {
      flex: 1,
    },
    dropdownContainer: {
      position: 'relative',
    },
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    yearSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 15,
      height: 52,
    },
    selectedYearText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      flex: 1,
      marginLeft: 8,
    },
    dropdownListModal: {
      borderWidth: 1,
      maxHeight: 200,
      elevation: 5,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primary + '10',
    },
    dropdownItemText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    classFeeCard: {
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    classFeeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    classIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    classFeeInfo: {
      flex: 1,
    },
    className: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 8,
    },
    classMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    academicYearBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    academicYearText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    termsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    termsText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    editIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    feeAmountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    feeColumn: {
      flex: 1,
      alignItems: 'center',
    },
    divider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
    },
    feeLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    annualFee: {
      fontSize: 16,
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    termFee: {
      fontSize: 14,
      color: colors.secondary,
      fontFamily: 'Poppins-SemiBold',
    },
    busFeeCard: {
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    busFeeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    busIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    busFeeInfo: {
      flex: 1,
    },
    busVillage: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 8,
    },
    busMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    distanceText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    vehicleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    vehicleText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    yearBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    yearText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    busFeeAmountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
    },
    busFeeInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    busFeeLabel: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
    },
    busFeeAmount: {
      fontSize: 16,
      color: colors.success,
      fontFamily: 'Poppins-Bold',
    },
    descriptionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    descriptionText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      flex: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
    },
    addButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    uploadFromExcelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    uploadFromExcelText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background + 'CC',
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    loadMoreContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    loadMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    loadMoreText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    // Upload Modal Styles
    uploadModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    uploadModalContainer: {
      width: SCREEN_WIDTH * 0.9,
      maxHeight: '80%',
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 15,
        },
      }),
    },
    uploadModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    uploadModalIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    uploadModalTitleContainer: {
      flex: 1,
    },
    uploadModalTitle: {
      fontSize: 18,
      marginBottom: 2,
    },
    uploadModalSubtitle: {
      fontSize: 12,
    },
    closeButton: {
      padding: 4,
    },
    uploadModalContent: {
      maxHeight: 500,
      padding: 20,
    },
    stepCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    stepIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepTextContainer: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 15,
      marginBottom: 4,
    },
    stepDescription: {
      fontSize: 12,
      lineHeight: 16,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
    },
    downloadButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    templateInfoContainer: {
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
    },
    templateInfoTitle: {
      fontSize: 12,
      marginBottom: 8,
      fontFamily: 'Poppins-Medium',
    },
    columnsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    columnItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    columnText: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    uploadInstructions: {
      marginBottom: 16,
    },
    instructionsTitle: {
      fontSize: 12,
      marginBottom: 8,
      fontFamily: 'Poppins-Medium',
    },
    instructionsList: {
      gap: 6,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    instructionText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
    },
    uploadFileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 18,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 8,
    },
    uploadFileButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
    progressContainer: {
      marginTop: 8,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 11,
      textAlign: 'center',
      fontFamily: 'Poppins-Medium',
    },
    resultCard: {
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    resultIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    resultTitleContainer: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 16,
      marginBottom: 2,
    },
    resultSubtitle: {
      fontSize: 12,
    },
    resultStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
    },
    errorSection: {
      marginTop: 8,
    },
    errorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    errorTitle: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    errorsList: {
      maxHeight: 150,
    },
    errorItem: {
      borderRadius: 6,
      padding: 10,
      marginBottom: 6,
      borderLeftWidth: 3,
    },
    errorRow: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    errorText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
    },
    moreErrors: {
      alignItems: 'center',
      padding: 8,
    },
    moreErrorsText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
    },
    uploadModalButtons: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      gap: 12,
    },
    uploadModalButton: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    uploadModalButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
  })

  if (!visible) return null

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      onRequestClose={onClose} 
      statusBarTranslucent
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity activeOpacity={.9} style={styles.backButton} onPress={onClose}>
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Fee Settings</ThemedText>
                <ThemedText style={styles.subtitle}>Manage class and bus fees</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={activeTab === 'class' ? filteredClassFees : filteredBusFees}
          renderItem={activeTab === 'class' ? renderClassFeeItem : renderBusFeeItem}
          keyExtractor={(item) => activeTab === 'class' ? `class-fee-${item._id}` : `bus-fee-${item._id}`}
          ListHeaderComponent={
            <HeaderComponent
              colors={colors}
              searchQuery={searchQuery}
              handleSearch={handleSearch}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedAcademicYear={selectedAcademicYear}
              renderAcademicYearDropdown={renderAcademicYearDropdown}
              filteredClassFees={filteredClassFees}
              filteredBusFees={filteredBusFees}
              handleAddClassFee={handleAddClassFee}
              handleAddBusFee={handleAddBusFee}
              setShowUploadModal={setShowUploadModal}
              searchInputRef={searchInputRef}
              slideAnim={slideAnim}
              flatListRef={flatListRef}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <ThemedText style={{ color: colors.textSecondary }}>
                No data available
              </ThemedText>
            </View>
          }
          ListFooterComponent={renderFooter}
        />

        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading fee settings...</ThemedText>
          </View>
        )}

        {uploading && !showUploadModal && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Uploading file...</ThemedText>
          </View>
        )}

        <BusFeeSettings
          visible={busFeeModalVisible}
          onClose={() => {
            setBusFeeModalVisible(false)
            setEditingBusFee(null)
          }}
          onSave={handleBusFeeSave}
          initialData={editingBusFee}
          existingBusFees={busFees}
        />

        <ClassFeeSettings
          visible={classFeeModalVisible}
          onClose={() => {
            setClassFeeModalVisible(false)
            setEditingClassFee(null)
          }}
          onSave={handleClassFeeSave}
          initialData={editingClassFee}
          existingClassFees={classFees}
        />

        {/* Bulk Upload Modal */}
        {renderUploadModal()}

        {/* Toast Notification */}
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