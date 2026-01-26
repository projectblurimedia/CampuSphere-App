import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import BusFeeManagement from './BusFeeManagement'
import ClassFeeManagement from './ClassFeeManagement'
import HostelFeeManagement from './HostelFeeManagement'

// Import components
import HeaderComponent from './components/HeaderComponent'
import ClassFeeCard from './components/ClassFeeCard'
import BusFeeCard from './components/BusFeeCard'
import HostelFeeCard from './components/HostelFeeCard'
import AcademicYearDropdown from './components/AcademicYearDropdown'
import BulkUploadModal from './components/BulkUploadModal'
import EmptyState from './components/EmptyState'

// Import utils
import { academicYears, sortClassesByOrder } from './utils/classOrder'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function FeeManagement({ visible, onClose }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [busFeeModalVisible, setBusFeeModalVisible] = useState(false)
  const [classFeeModalVisible, setClassFeeModalVisible] = useState(false)
  const [hostelFeeModalVisible, setHostelFeeModalVisible] = useState(false)
  const [editingBusFee, setEditingBusFee] = useState(null)
  const [editingClassFee, setEditingClassFee] = useState(null)
  const [editingHostelFee, setEditingHostelFee] = useState(null)
  const [classFees, setClassFees] = useState([])
  const [busFees, setBusFees] = useState([])
  const [hostelFees, setHostelFees] = useState([])
  const [filteredClassFees, setFilteredClassFees] = useState([])
  const [filteredBusFees, setFilteredBusFees] = useState([])
  const [filteredHostelFees, setFilteredHostelFees] = useState([])
  const [activeTab, setActiveTab] = useState('class')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('All')
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
  
  const slideAnim = useRef(new Animated.Value(0)).current
  const searchInputRef = useRef(null)
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
      toValue: activeTab === 'class' ? 0 : activeTab === 'bus' ? 1 : 2,
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

      // Fetch hostel fees
      const hostelResponse = await axiosApi.get('/hostel-fees', {
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
        setHostelFees(hostelResponse.data.data?.hostelFees || [])
        setFilteredClassFees(sortedClassFees)
        setFilteredBusFees(busResponse.data.data?.busFees || [])
        setFilteredHostelFees(hostelResponse.data.data?.hostelFees || [])
      } else {
        const newClassFees = classResponse.data.data?.classFees || []
        const sortedNewClassFees = sortClassesByOrder(newClassFees)
        
        setClassFees(prev => {
          const combined = [...prev, ...sortedNewClassFees]
          return sortClassesByOrder(combined)
        })
        
        setBusFees(prev => [...prev, ...(busResponse.data.data?.busFees || [])])
        setHostelFees(prev => [...prev, ...(hostelResponse.data.data?.hostelFees || [])])
        setFilteredClassFees(prev => {
          const combined = [...prev, ...sortedNewClassFees]
          return sortClassesByOrder(combined)
        })
        setFilteredBusFees(prev => [...prev, ...(busResponse.data.data?.busFees || [])])
        setFilteredHostelFees(prev => [...prev, ...(hostelResponse.data.data?.hostelFees || [])])
      }

      // Update pagination info
      const classTotalPages = classResponse.data.data?.pagination?.pages || 1
      const busTotalPages = busResponse.data.data?.pagination?.pages || 1
      const hostelTotalPages = hostelResponse.data.data?.pagination?.pages || 1
      setTotalPages(Math.max(classTotalPages, busTotalPages, hostelTotalPages))
      setHasMore(pageNum < Math.max(classTotalPages, busTotalPages, hostelTotalPages))

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
        setFilteredHostelFees(hostelFees)
      } else {
        const filteredByYear = classFees.filter(fee => fee.academicYear === selectedAcademicYear)
        const sortedFilteredClassFees = sortClassesByOrder(filteredByYear)
        setFilteredClassFees(sortedFilteredClassFees)
        setFilteredBusFees(busFees.filter(fee => fee.academicYear === selectedAcademicYear))
        setFilteredHostelFees(hostelFees.filter(fee => fee.academicYear === selectedAcademicYear))
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
    } else if (activeTab === 'bus') {
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
    } else if (activeTab === 'hostel') {
      let filteredHostels = hostelFees
      
      // Filter by academic year if not "All"
      if (selectedAcademicYear !== 'All') {
        filteredHostels = filteredHostels.filter(fee => fee.academicYear === selectedAcademicYear)
      }
      
      // Filter by search query
      if (query.trim()) {
        filteredHostels = filteredHostels.filter(fee => 
          fee.hostelType?.toLowerCase().includes(lowerQuery) ||
          fee.hostelName?.toLowerCase().includes(lowerQuery) ||
          fee.feeAmount?.toString().includes(query) ||
          fee.roomType?.toLowerCase().includes(lowerQuery)
        )
      }
      
      setFilteredHostelFees(filteredHostels)
    }
  }, [activeTab, selectedAcademicYear, classFees, busFees, hostelFees])

  const handleYearSelect = async (year) => {
    setSelectedAcademicYear(year)
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

      const hostelResponse = await axiosApi.get('/hostel-fees', {
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
      setHostelFees(hostelResponse.data.data?.hostelFees || [])
      setFilteredClassFees(sortedClassFees)
      setFilteredBusFees(busResponse.data.data?.busFees || [])
      setFilteredHostelFees(hostelResponse.data.data?.hostelFees || [])

      // Update pagination info
      const classTotalPages = classResponse.data.data?.pagination?.pages || 1
      const busTotalPages = busResponse.data.data?.pagination?.pages || 1
      const hostelTotalPages = hostelResponse.data.data?.pagination?.pages || 1
      setTotalPages(Math.max(classTotalPages, busTotalPages, hostelTotalPages))
      setHasMore(1 < Math.max(classTotalPages, busTotalPages, hostelTotalPages))

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

  const handleAddHostelFee = useCallback(() => {
    setEditingHostelFee(null)
    setHostelFeeModalVisible(true)
  }, [])

  const handleEditHostelFee = useCallback((hostelFee) => {
    setEditingHostelFee(hostelFee)
    setHostelFeeModalVisible(true)
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

  const handleHostelFeeSave = async (data, isDeleted = false) => {
    try {
      if (isDeleted) {
        // Refresh data after deletion
        await loadData(1, true)
        showToast('Hostel fee deleted successfully!', 'success')
      } else if (data) {
        // Refresh data after save
        await loadData(1, true)
        showToast('Hostel fee saved successfully!', 'success')
      }
      
      setHostelFeeModalVisible(false)
      setEditingHostelFee(null)
    } catch (error) {
      console.error('Error handling hostel fee save:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update hostel fee.'
      showToast(errorMessage, 'error')
    }
  }

  const handleBulkUpload = async (file) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      // Create FormData
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      })

      // Determine endpoint based on active tab
      const endpoint = activeTab === 'class' 
        ? '/class-fees/bulk-upload' 
        : activeTab === 'bus' 
        ? '/bus-fees/bulk-upload' 
        : '/hostel-fees/bulk-upload'

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
        
        // Refresh data
        await loadData(1, true)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      const errorMessage = error.response?.data?.message || 'Failed to upload file. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadTemplate = async () => {
    try {
      setLoading(true)
      
      // Determine which template to download
      const endpoint = activeTab === 'class' 
        ? '/class-fees/download-template' 
        : activeTab === 'bus' 
        ? '/bus-fees/download-template'
        : '/hostel-fees/download-template'
      
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
      link.download = `${activeTab}_fees_template.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showToast('Template downloaded successfully!', 'success')
      
    } catch (error) {
      console.error('Error downloading template:', error)
      showToast('Failed to download template. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetUpload = () => {
    setUploadResult(null)
    setUploadProgress(0)
    setShowUploadModal(false)
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'class': return filteredClassFees
      case 'bus': return filteredBusFees
      case 'hostel': return filteredHostelFees
      default: return []
    }
  }

  const renderItem = useCallback(({ item }) => {
    switch (activeTab) {
      case 'class':
        return (
          <ClassFeeCard
            item={item}
            onPress={() => handleEditClassFee(item)}
            colors={colors}
          />
        )
      case 'bus':
        return (
          <BusFeeCard
            item={item}
            onPress={() => handleEditBusFee(item)}
            colors={colors}
          />
        )
      case 'hostel':
        return (
          <HostelFeeCard
            item={item}
            onPress={() => handleEditHostelFee(item)}
            colors={colors}
          />
        )
      default:
        return null
    }
  }, [activeTab, colors])

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
                <ThemedText style={styles.title}>Fee Management</ThemedText>
                <ThemedText style={styles.subtitle}>Manage class, bus & hostel fees</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={getCurrentData()}
          renderItem={renderItem}
          keyExtractor={(item) => `${activeTab}-fee-${item._id}`}
          ListHeaderComponent={
            <HeaderComponent
              colors={colors}
              searchQuery={searchQuery}
              handleSearch={handleSearch}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedAcademicYear={selectedAcademicYear}
              handleYearSelect={handleYearSelect}
              filteredClassFees={filteredClassFees}
              filteredBusFees={filteredBusFees}
              filteredHostelFees={filteredHostelFees}
              handleAddClassFee={handleAddClassFee}
              handleAddBusFee={handleAddBusFee}
              handleAddHostelFee={handleAddHostelFee}
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
            <EmptyState
              activeTab={activeTab}
              colors={colors}
              onAdd={
                activeTab === 'class' ? handleAddClassFee :
                activeTab === 'bus' ? handleAddBusFee :
                handleAddHostelFee
              }
              onUpload={() => setShowUploadModal(true)}
            />
          }
          ListFooterComponent={renderFooter}
        />

        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading fee management...</ThemedText>
          </View>
        )}

        {uploading && !showUploadModal && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Uploading file...</ThemedText>
          </View>
        )}

        <BusFeeManagement
          visible={busFeeModalVisible}
          onClose={() => {
            setBusFeeModalVisible(false)
            setEditingBusFee(null)
          }}
          onSave={handleBusFeeSave}
          initialData={editingBusFee}
          existingBusFees={busFees}
        />

        <ClassFeeManagement
          visible={classFeeModalVisible}
          onClose={() => {
            setClassFeeModalVisible(false)
            setEditingClassFee(null)
          }}
          onSave={handleClassFeeSave}
          initialData={editingClassFee}
          existingClassFees={classFees}
        />

        <HostelFeeManagement
          visible={hostelFeeModalVisible}
          onClose={() => {
            setHostelFeeModalVisible(false)
            setEditingHostelFee(null)
          }}
          onSave={handleHostelFeeSave}
          initialData={editingHostelFee}
          existingHostelFees={hostelFees}
        />

        {/* Bulk Upload Modal */}
        <BulkUploadModal
          visible={showUploadModal}
          activeTab={activeTab}
          colors={colors}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadResult={uploadResult}
          onDownloadTemplate={downloadTemplate}
          onUpload={handleBulkUpload}
          onClose={resetUpload}
          onRefresh={() => {
            resetUpload()
            loadData(1, true)
          }}
        />

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