import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  BackHandler,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import SchoolInfo from './SchoolInfo'
import SchoolImages from './SchoolImages'
import BusDetails from './BusDetails'
import CreateSchool from './CreateSchool'
import axiosApi from '@/utils/axiosApi'

export default function SchoolProfile({ visible, onClose }) {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState('info')
  const [editModes, setEditModes] = useState({
    info: false,
    images: false,
    buses: false
  })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [discardModalVisible, setDiscardModalVisible] = useState(false)
  const [cancelEditModalVisible, setCancelEditModalVisible] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState(null)
  const [schoolExists, setSchoolExists] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  
  const [schoolInfo, setSchoolInfo] = useState({
    id: null,
    name: '',
    establishedYear: '',
    affiliation: '',
    board: '',
    principal: '',
    principalEmail: '',
    principalPhone: '',
    vicePrincipal: '',
    vicePrincipalEmail: '',
    vicePrincipalPhone: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    schoolHours: '',
    officeHours: '',
    workingDays: '',
    assemblyTime: '',
    facilities: '',
    mission: '',
    vision: '',
    motto: '',
    campusArea: '',
    libraryBooks: '',
    computerSystems: '',
    images: [],
    buses: []
  })

  // Track if there are unsaved changes
  const hasUnsavedChanges = Object.values(editModes).some(mode => mode === true)

  useEffect(() => {
    if (visible) {
      checkSchoolExists()
    }
  }, [visible])

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        handleBackPress()
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [visible, hasUnsavedChanges, schoolExists, showCreateModal])

  const checkSchoolExists = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/school')
      if (response.data.success && response.data.data) {
        const data = response.data.data
        // Ensure arrays exist
        const processedData = {
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
          buses: Array.isArray(data.buses) ? data.buses : []
        }
        
        // Check if school has any data (not just default empty values)
        const hasData = processedData.name || processedData.establishedYear || 
                       processedData.principal || processedData.address
        setSchoolExists(hasData)
        if (hasData) {
          setSchoolInfo(processedData)
        }
      } else {
        setSchoolExists(false)
        // Reset to empty state with arrays
        setSchoolInfo(prev => ({
          ...prev,
          images: [],
          buses: []
        }))
      }
    } catch (error) {
      console.error('Check school exists error:', error)
      setSchoolExists(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchSchoolProfile = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/school')
      if (response.data.success && response.data.data) {
        const data = response.data.data
        const processedData = {
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
          buses: Array.isArray(data.buses) ? data.buses : []
        }
        setSchoolInfo(processedData)
        setSchoolExists(true)
      }
    } catch (error) {
      console.error('Fetch school profile error:', error)
      showToast(error.response?.data?.message || 'Failed to load school profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchool = async (schoolData) => {
    try {
      setCreateLoading(true)
      
      const response = await axiosApi.post('/school', schoolData)
      
      if (response.data.success) {
        setShowCreateModal(false)
        const data = response.data.data
        const processedData = {
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
          buses: Array.isArray(data.buses) ? data.buses : []
        }
        setSchoolInfo(processedData)
        setSchoolExists(true)
        showToast('School profile created successfully!', 'success')
      } else {
        showToast(response.data.message || 'Failed to create school profile', 'error')
      }
    } catch (error) {
      console.error('Create school error:', error)
      showToast(error.response?.data?.message || 'Failed to create school profile', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  const handleBackPress = () => {
    if (showCreateModal) {
      setShowCreateModal(false)
    } else if (hasUnsavedChanges) {
      setDiscardModalVisible(true)
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setDiscardModalVisible(true)
    } else {
      onClose()
    }
  }

  const handleDiscardConfirm = () => {
    setDiscardModalVisible(false)
    setEditModes({ info: false, images: false, buses: false })
    fetchSchoolProfile()
    onClose()
  }

  const toggleEditMode = (tab) => {
    if (editModes[tab]) {
      // Turning off edit mode - check for unsaved changes
      if (tab === 'info') {
        // For info tab, we need to check if there are actual changes
        const hasChanges = JSON.stringify(schoolInfo) !== JSON.stringify(originalSchoolInfo)
        if (hasChanges) {
          setPendingTabChange(tab)
          setCancelEditModalVisible(true)
          return
        }
      }
      setEditModes(prev => ({ ...prev, [tab]: false }))
    } else {
      // Turning on edit mode - save original data for comparison
      if (tab === 'info') {
        setOriginalSchoolInfo({ ...schoolInfo })
      }
      setEditModes(prev => ({ ...prev, [tab]: true }))
    }
  }

  const [originalSchoolInfo, setOriginalSchoolInfo] = useState(null)

  const handleCancelEditConfirm = () => {
    setCancelEditModalVisible(false)
    if (pendingTabChange === 'info') {
      // Restore original data
      if (originalSchoolInfo) {
        setSchoolInfo(originalSchoolInfo)
      }
    }
    setEditModes(prev => ({ ...prev, [pendingTabChange]: false }))
    setPendingTabChange(null)
    setOriginalSchoolInfo(null)
  }

  const cancelEdit = (tab) => {
    setPendingTabChange(tab)
    setCancelEditModalVisible(true)
  }

  const saveSchoolInfo = async () => {
    try {
      setActionLoading(true)
      const { buses, images, ...schoolData } = schoolInfo
      
      const response = await axiosApi.put('/school', schoolData)
      if (response.data.success) {
        setEditModes(prev => ({ ...prev, info: false }))
        setOriginalSchoolInfo(null)
        showToast('School profile updated successfully!', 'success')
      } else {
        showToast(response.data.message || 'Failed to update school profile', 'error')
      }
    } catch (error) {
      console.error('Update school profile error:', error)
      showToast(error.response?.data?.message || 'Failed to update school profile', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const updateImages = useCallback((newImages) => {
    setSchoolInfo(prev => ({
      ...prev,
      images: Array.isArray(newImages) ? newImages : []
    }))
  }, [])

  const updateBuses = useCallback((newBuses) => {
    setSchoolInfo(prev => ({
      ...prev,
      buses: Array.isArray(newBuses) ? newBuses : []
    }))
  }, [])

  const handleInputChange = useCallback((field, value) => {
    setSchoolInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

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
      fontSize: 20,
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    editButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    createButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      marginHorizontal: 6,
      paddingVertical: 8,
    },
    tabIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
    },
    activeTabText: {},
    inactiveTabText: {
      color: colors.textSecondary,
    },
    contentContainer: {
      flex: 1,
    },
    actionButtonsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: colors.background,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    discardButton: {
      backgroundColor: '#ef4444',
    },
    saveButton: {
      backgroundColor: colors.tint || '#3b82f6',
      ...Platform.select({
        ios: {
          shadowColor: '#1d9bf0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    editModeBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#ef4444',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.5,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
    },
    createNowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    createNowText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  }), [colors])

  const tabs = [
    { 
      key: 'info', 
      label: 'Info', 
      icon: 'info', 
      iconFamily: 'Feather',
      iconColor: '#3b82f6',
      bgColor: '#3b82f620'
    },
    { 
      key: 'images', 
      label: 'Images', 
      icon: 'image', 
      iconFamily: 'Feather',
      iconColor: '#10b981',
      bgColor: '#10b98120'
    },
    { 
      key: 'buses', 
      label: 'Buses', 
      icon: 'bus-alt',
      iconFamily: 'FontAwesome5',
      iconColor: '#f59e0b',
      bgColor: '#f59e0b20'
    },
  ]

  const renderContent = () => {
    if (!schoolExists) {
      return (
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="school" size={80} color={colors.primary + '40'} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>
            No School Profile Yet
          </ThemedText>
          <ThemedText style={styles.emptyDescription}>
            Create your school profile to manage information, images, and transportation details all in one place.
          </ThemedText>
          <TouchableOpacity
            style={styles.createNowButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <ThemedText style={styles.createNowText}>
              Create School Profile
            </ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    // Ensure arrays exist before passing to components
    const safeImages = Array.isArray(schoolInfo.images) ? schoolInfo.images : []
    const safeBuses = Array.isArray(schoolInfo.buses) ? schoolInfo.buses : []

    switch (activeTab) {
      case 'info':
        return (
          <SchoolInfo
            schoolInfo={schoolInfo}
            isEditing={editModes.info}
            onInputChange={handleInputChange}
            colors={colors}
            loading={actionLoading}
          />
        )
      case 'images':
        return (
          <SchoolImages
            images={safeImages}
            isEditing={editModes.images}
            onImagesUpdate={updateImages}
            showToast={showToast}
            colors={colors}
            loading={actionLoading}
            setActionLoading={setActionLoading}
            schoolExists={schoolExists}
          />
        )
      case 'buses':
        return (
          <BusDetails
            buses={safeBuses}
            isEditing={editModes.buses}
            onBusesUpdate={updateBuses}
            showToast={showToast}
            colors={colors}
            loading={actionLoading}
            setActionLoading={setActionLoading}
            schoolExists={schoolExists}
          />
        )
      default:
        return null
    }
  }

  const getIconComponent = (iconFamily) => {
    switch (iconFamily) {
      case 'FontAwesome5': return FontAwesome5
      case 'MaterialCommunityIcons': return MaterialCommunityIcons
      case 'Feather':
      default: return Feather
    }
  }

  const renderTab = (tab) => {
    const IconComponent = getIconComponent(tab.iconFamily)
    const isActive = activeTab === tab.key
    const isEditing = editModes[tab.key]
    
    if (!schoolExists) return null
    
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          isActive && {
            borderBottomWidth: 2,
            borderBottomColor: tab.iconColor,
            backgroundColor: tab.bgColor,
          }
        ]}
        onPress={() => setActiveTab(tab.key)}
        disabled={actionLoading}
      >
        <View style={styles.tabIconContainer}>
          <IconComponent
            name={tab.icon}
            size={20}
            color={isActive ? tab.iconColor : colors.textSecondary}
          />
          {isEditing && <View style={styles.editModeBadge} />}
        </View>
        <ThemedText
          type='subtitle'
          style={[
            styles.tabText,
            isActive ? { color: tab.iconColor } : styles.inactiveTabText
          ]}
        >
          {tab.label}
        </ThemedText>
      </TouchableOpacity>
    )
  }

  const renderActionButtons = () => {
    if (!schoolExists) return null
    
    const currentEditMode = editModes[activeTab]
    
    if (!currentEditMode) return null

    const handleSave = () => {
      if (activeTab === 'info') {
        saveSchoolInfo()
      } else {
        setEditModes(prev => ({ ...prev, [activeTab]: false }))
        showToast('Changes saved successfully!', 'success')
      }
    }

    return (
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.discardButton, actionLoading && styles.disabledButton]}
            onPress={() => cancelEdit(activeTab)}
            disabled={actionLoading}
          >
            <Ionicons name="close-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>
              Discard
            </ThemedText>
          </TouchableOpacity>
       
          <TouchableOpacity
            style={[styles.button, styles.saveButton, actionLoading && styles.disabledButton]}
            onPress={handleSave}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <LoadingSpinner size={20} color="#FFFFFF" />
            ) : (
              <Feather name="check" size={20} color="#FFFFFF" />
            )}
            <ThemedText style={styles.buttonText}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleBackPress}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
     
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={[styles.backButton, actionLoading && styles.disabledButton]} 
                onPress={handleBackPress}
                disabled={actionLoading}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <ThemedText type='subtitle' style={styles.title}>Campus Profile</ThemedText>
                <ThemedText style={styles.subtitle}>
                  {schoolExists ? 'Manage school information' : 'Set up your school'}
                </ThemedText>
              </View>
              {schoolExists ? (
                <TouchableOpacity
                  style={[styles.editButton, actionLoading && styles.disabledButton]}
                  onPress={() => toggleEditMode(activeTab)}
                  disabled={actionLoading}
                >
                  <Feather
                    name={editModes[activeTab] ? "x" : "edit-2"}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.createButton, actionLoading && styles.disabledButton]}
                  onPress={() => setShowCreateModal(true)}
                  disabled={actionLoading}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {schoolExists && (
          <View style={styles.tabContainer}>
            {tabs.map(renderTab)}
          </View>
        )}

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size={40} color={colors.primary} message="Loading school profile..." />
            </View>
          ) : (
            renderContent()
          )}
        </View>

        {renderActionButtons()}

        {/* Discard Changes Confirmation Modal */}
        <ConfirmationModal
          visible={discardModalVisible}
          onClose={() => setDiscardModalVisible(false)}
          onConfirm={handleDiscardConfirm}
          title="Discard Changes"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmText="Discard"
          cancelText="Cancel"
          type="warning"
        />

        {/* Cancel Edit Confirmation Modal */}
        <ConfirmationModal
          visible={cancelEditModalVisible}
          onClose={() => {
            setCancelEditModalVisible(false)
            setPendingTabChange(null)
          }}
          onConfirm={handleCancelEditConfirm}
          title="Cancel Editing"
          message="Are you sure you want to cancel editing? All unsaved changes will be lost."
          confirmText="Discard"
          cancelText="Keep Editing"
          type="warning"
        />

        {/* Create School Modal */}
        <CreateSchool
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSchool}
          loading={createLoading}
          colors={colors}
          showToast={showToast}
        />

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