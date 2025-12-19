import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal,
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
import SchoolInfo from './SchoolInfo'
import SchoolImages from './SchoolImages'
import BusDetails from './BusDetails'
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
  const [toast, setToast] = useState(null)
  
  const [schoolInfo, setSchoolInfo] = useState({
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

  useEffect(() => {
    if (visible) {
      fetchSchoolProfile()
    }
  }, [visible])

  const fetchSchoolProfile = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/school')
      if (response.data.success) {
        setSchoolInfo(response.data.data)
      } else {
        showToast('Failed to load school profile', 'error')
      }
    } catch (error) {
      console.error('Fetch school profile error:', error)
      showToast(error.response?.data?.message || 'Failed to load school profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  const handleClose = () => {
    const hasUnsavedChanges = Object.values(editModes).some(mode => mode === true)
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setEditModes({ info: false, images: false, buses: false })
              onClose()
              fetchSchoolProfile()
            }
          }
        ]
      )
    } else {
      onClose()
    }
  }

  const toggleEditMode = (tab) => {
    setEditModes(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }))
  }

  const cancelEdit = (tab) => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setEditModes(prev => ({ ...prev, [tab]: false }))
            if (tab === 'info') {
              fetchSchoolProfile()
            }
          }
        }
      ]
    )
  }

  const saveSchoolInfo = async () => {
    try {
      setLoading(true)
      const { buses, images, ...schoolData } = schoolInfo
      
      const response = await axiosApi.put('/school', schoolData)
      if (response.data.success) {
        setEditModes(prev => ({ ...prev, info: false }))
        showToast('School profile updated successfully!', 'success')
      } else {
        showToast(response.data.message || 'Failed to update school profile', 'error')
      }
    } catch (error) {
      console.error('Update school profile error:', error)
      showToast(error.response?.data?.message || 'Failed to update school profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateImages = (newImages) => {
    setSchoolInfo(prev => ({
      ...prev,
      images: newImages
    }))
  }

  const updateBuses = (newBuses) => {
    setSchoolInfo(prev => ({
      ...prev,
      buses: newBuses
    }))
  }

  const handleInputChange = (field, value) => {
    setSchoolInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
    activeTab: {
      // Border color will be set dynamically based on active tab
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
    activeTabText: {
      // Color will be set dynamically based on active tab
    },
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
      borderWidth: 1,
    },
    saveButton: {
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    toastContainer: {
      position: 'absolute',
      zIndex: 10000,
    },
    editModeBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 12,
      height: 12,
      borderRadius: 8,
      backgroundColor: '#ef4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    editModeBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
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
    switch (activeTab) {
      case 'info':
        return (
          <SchoolInfo
            schoolInfo={schoolInfo}
            isEditing={editModes.info}
            onInputChange={handleInputChange}
            colors={colors}
          />
        )
      case 'images':
        return (
          <SchoolImages
            images={schoolInfo.images}
            isEditing={editModes.images}
            onImagesUpdate={updateImages}
            showToast={showToast}
            colors={colors}
          />
        )
      case 'buses':
        return (
          <BusDetails
            buses={schoolInfo.buses}
            isEditing={editModes.buses}
            onBusesUpdate={updateBuses}
            showToast={showToast}
            colors={colors}
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
      >
        <View style={styles.tabIconContainer}>
          <IconComponent
            name={tab.icon}
            size={20}
            color={isActive ? tab.iconColor : colors.textSecondary}
          />
          {isEditing && (
            <View style={styles.editModeBadge}>
              <ThemedText style={styles.editModeBadgeText}></ThemedText>
            </View>
          )}
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
            style={[styles.button, styles.discardButton, { borderColor: colors.border, backgroundColor: colors?.danger || '#ef4444' }]}
            onPress={() => cancelEdit(activeTab)}
          >
            <Ionicons name="trash-outline" size={20} color={'#FFFFFF'} />
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Discard
            </ThemedText>
          </TouchableOpacity>
       
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: colors.tint || '#3b82f6' }]}
            onPress={handleSave}
          >
            <Feather name="save" size={20} color="#FFFFFF" />
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Save Changes
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
      onRequestClose={handleClose}
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
              <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <ThemedText type='subtitle' style={styles.title}>Campus Profile</ThemedText>
                <ThemedText style={styles.subtitle}>Manage school information</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => toggleEditMode(activeTab)}
              >
                <Feather
                  name={editModes[activeTab] ? "x" : "edit-2"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.tabContainer}>
          {tabs.map(renderTab)}
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size={40} color={colors.primary} />
            </View>
          ) : (
            renderContent()
          )}
        </View>

        {renderActionButtons()}

        {/* Toast Notification - Fixed positioning at bottom right */}
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