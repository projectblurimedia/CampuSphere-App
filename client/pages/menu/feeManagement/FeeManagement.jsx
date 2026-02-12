import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  Modal,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions
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
import BulkUploadModal from './components/BulkUploadModal'
import EmptyState from './components/EmptyState'

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
  
  // New state for loading step
  const [loadingStep, setLoadingStep] = useState('')
  
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
    Animated.timing(slideAnim, {
      toValue: activeTab === 'class' ? 0 : activeTab === 'bus' ? 1 : 2,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [activeTab])

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

      setLoadingStep('Fetching class fees...')
      // Fetch class fees
      const classResponse = await axiosApi.get('/fee-structure/class', {
        params: {
          page: pageNum,
          limit: limit,
          isActive: true
        }
      })

      setLoadingStep('Fetching bus fees...')
      // Fetch bus fees
      const busResponse = await axiosApi.get('/fee-structure/bus', {
        params: {
          page: pageNum,
          limit: limit,
          isActive: true
        }
      })

      setLoadingStep('Fetching hostel fees...')
      // Fetch hostel fees
      const hostelResponse = await axiosApi.get('/fee-structure/hostel', {
        params: {
          page: pageNum,
          limit: limit,
          isActive: true
        }
      })

      setLoadingStep('Processing fee data...')

      if (pageNum === 1) {
        const sortedClassFees = classResponse.data.data || []
        
        setClassFees(sortedClassFees)
        setBusFees(busResponse.data.data || [])
        setHostelFees(hostelResponse.data.data || [])
        setFilteredClassFees(sortedClassFees)
        setFilteredBusFees(busResponse.data.data || [])
        setFilteredHostelFees(hostelResponse.data.data || [])
      } else {
        const sortedNewClassFees = classResponse.data.data || [] 
        
        setClassFees(prev => {
          const combined = [...prev, ...sortedNewClassFees]
          return combined
        })
        
        setBusFees(prev => [...prev, ...(busResponse.data.data || [])])
        setHostelFees(prev => [...prev, ...(hostelResponse.data.data || [])])
        
        setFilteredClassFees(prev => {
          const combined = [...prev, ...sortedNewClassFees]
          return combined
        })
        setFilteredBusFees(prev => [...prev, ...(busResponse.data.data || [])])
        setFilteredHostelFees(prev => [...prev, ...(hostelResponse.data.data || [])])
      }

      // Update pagination info
      const classPagination = classResponse.data.pagination || {}
      const busPagination = busResponse.data.pagination || {}
      const hostelPagination = hostelResponse.data.pagination || {}
      
      setTotalPages(Math.max(
        classPagination.totalPages || 1,
        busPagination.totalPages || 1,
        hostelPagination.totalPages || 1
      ))
      setHasMore(pageNum < Math.max(
        classPagination.totalPages || 1,
        busPagination.totalPages || 1,
        hostelPagination.totalPages || 1
      ))

    } catch (error) {
      console.error('Error loading fees:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load fees. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingStep('')
    }
  }

  const handleRefresh = useCallback(() => {
    setPage(1)
    setHasMore(true)
    loadData(1, true)
  }, [])

  const handleLoadMore = () => {
    if (!hasMore || loading || refreshing) return
    const nextPage = page + 1
    setPage(nextPage)
    loadData(nextPage)
  }

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      if (activeTab === 'class') {
        setFilteredClassFees(classFees)
      } else if (activeTab === 'bus') {
        setFilteredBusFees(busFees)
      } else if (activeTab === 'hostel') {
        setFilteredHostelFees(hostelFees)
      }
      return
    }
    
    const lowerQuery = query.toLowerCase()
    
    if (activeTab === 'class') {
      let filtered = classFees.filter(fee => 
        fee.className?.toLowerCase().includes(lowerQuery) ||
        fee.totalAnnualFee?.toString().includes(query)
      )
      setFilteredClassFees(filtered)
    } else if (activeTab === 'bus') {
      let filtered = busFees.filter(fee => 
        fee.villageName?.toLowerCase().includes(lowerQuery) ||
        fee.feeAmount?.toString().includes(query) ||
        fee.distance?.toString().includes(query)
      )
      setFilteredBusFees(filtered)
    } else if (activeTab === 'hostel') {
      let filtered = hostelFees.filter(fee => 
        fee.className?.toLowerCase().includes(lowerQuery) ||
        fee.totalAnnualFee?.toString().includes(query)
      )
      setFilteredHostelFees(filtered)
    }
  }, [activeTab, classFees, busFees, hostelFees])

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
        await loadData(1, true)
        showToast('Bus fee deleted successfully!', 'success')
      } else if (data) {
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
        await loadData(1, true)
        showToast('Class fee deleted successfully!', 'success')
      } else if (data) {
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
        await loadData(1, true)
        showToast('Hostel fee deleted successfully!', 'success')
      } else if (data) {
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
      setUploadResult(null)

      const formData = new FormData()
      
      // IMPORTANT: Use 'file' as field name to match multer configuration
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      
      // Add createdBy from user context if available
      formData.append('createdBy', 'system')

      // CORRECT ENDPOINTS - use bulk
      let endpoint
      if (activeTab === 'class') {
        endpoint = '/fee-structure/class/bulk'
      } else if (activeTab === 'bus') {
        endpoint = '/fee-structure/bus/bulk'
      } else {
        endpoint = '/fee-structure/hostel/bulk'
      }

      console.log(`Uploading to endpoint: ${endpoint}`)
      console.log(`File: ${file.name}, Size: ${file.size || 'unknown'}`)

      const response = await axiosApi.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          )
          setUploadProgress(percentCompleted)
        },
      })

      console.log('Upload response:', JSON.stringify(response.data, null, 2))

      if (response.data.success) {
        // Set the upload result from the response structure
        setUploadResult({
          total: response.data.summary?.total || 0,
          success: response.data.summary?.success || 0,
          failed: response.data.summary?.failed || 0,
          skipped: response.data.summary?.skipped || 0,
          errors: response.data.summary?.errors || []
        })
        
        // Show detailed toast message with success and failure counts
        const successCount = response.data.summary?.success || 0
        const failedCount = response.data.summary?.failed || 0
        const skippedCount = response.data.summary?.skipped || 0
        
        let successMessage = `Bulk upload completed! ✅ ${successCount} imported`
        if (failedCount > 0) successMessage += `, ❌ ${failedCount} failed`
        if (skippedCount > 0) successMessage += `, ⏭️ ${skippedCount} skipped`
        
        showToast(successMessage, failedCount > 0 ? 'warning' : 'success')
        
        // Refresh data to show new fees
        await loadData(1, true)
      } else {
        throw new Error(response.data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      
      // Check if it's a multer field error
      if (error.response?.data?.error?.includes('LIMIT_UNEXPECTED_FILE')) {
        showToast('Server expects field name "file". Please update API configuration.', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to upload file. Please try again.'
        showToast(errorMessage, 'error')
      }
      
      setUploadResult({
        total: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [{
          row: 0,
          reason: error.response?.data?.message || error.message || 'Upload failed'
        }]
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
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
    if (!hasMore) return null
    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity 
          style={[styles.loadMoreButton, { backgroundColor: colors.primary + '15' }]}
          onPress={handleLoadMore}
          disabled={loading || refreshing}
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
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      minWidth: 200,
    },
    loadingText: {
      marginTop: 12,
      color: colors.text,
      textAlign: 'center',
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    loadingStepText: {
      marginTop: 8,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 12,
      fontStyle: 'italic',
      fontFamily: 'Poppins-Regular',
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
          keyExtractor={(item) => `${activeTab}-fee-${item.id}`}
          ListHeaderComponent={
            <HeaderComponent
              colors={colors}
              searchQuery={searchQuery}
              handleSearch={handleSearch}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
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
            !loading ? (
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
            ) : null
          }
          ListFooterComponent={renderFooter}
        />

        {/* Loading overlay with step information - Same style as Attendance component */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                Loading fee management...
              </ThemedText>
              {loadingStep ? (
                <ThemedText style={styles.loadingStepText}>
                  {loadingStep}
                </ThemedText>
              ) : null}
            </View>
          </View>
        )}

        {uploading && !showUploadModal && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                Uploading file...
              </ThemedText>
              <ThemedText style={styles.loadingStepText}>
                {uploadProgress}% complete
              </ThemedText>
            </View>
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

        <BulkUploadModal
          visible={showUploadModal}
          activeTab={activeTab}
          colors={colors}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadResult={uploadResult}
          onUpload={handleBulkUpload}
          onClose={resetUpload}
          onRefresh={() => {
            resetUpload()
            loadData(1, true)
          }}
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