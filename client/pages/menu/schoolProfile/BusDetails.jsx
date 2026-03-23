import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import axiosApi from '@/utils/axiosApi'

const BusDetails = ({ 
  buses = [], 
  isEditing, 
  onBusesUpdate, 
  showToast, 
  colors, 
  loading, 
  setActionLoading,
  schoolExists 
}) => {
  const [editingBus, setEditingBus] = useState(null)
  const [showBusModal, setShowBusModal] = useState(false)
  const [newRouteInput, setNewRouteInput] = useState('')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [busToDelete, setBusToDelete] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [localBuses, setLocalBuses] = useState([])
  
  const [busFormData, setBusFormData] = useState({
    name: '',
    busNumber: '',
    driverName: '',
    driverPhone: '',
    routes: []
  })

  // Sync local buses with props
  useEffect(() => {
    setLocalBuses(Array.isArray(buses) ? buses : [])
  }, [buses])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    headerText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    busList: {
      gap: 12,
    },
    busCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    busHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    busNumberBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    busNumberCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    busNumberCircleText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    busName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    busPlate: {
      backgroundColor: '#fbbf24',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    busPlateText: {
      color: '#78350f',
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 1,
    },
    busRoutesContainer: {
      marginBottom: 12,
    },
    busRoutesLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    busRoutesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    routeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    routeTagText: {
      fontSize: 11,
      color: colors.primary,
      marginRight: 4,
    },
    busInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border + '30',
      marginBottom: 8,
    },
    busInfoLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '500',
    },
    busInfoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'right',
    },
    busActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    busActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    busEditButton: {
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    busDeleteButton: {
      backgroundColor: '#ef4444' + '15',
      borderWidth: 1,
      borderColor: '#ef4444',
    },
    addBusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: 'dashed',
      gap: 10,
      marginTop: 16,
      backgroundColor: colors.primary + '08',
      borderColor: colors.primary,
    },
    addBusText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary + '80',
      textAlign: 'center',
    },
    addFirstButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    addFirstText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalTitleIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    modalScrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 200,
    },
    modalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 16,
      paddingHorizontal: 14,
      height: 50,
      backgroundColor: colors.inputBackground,
    },
    modalInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 0,
      fontFamily: 'Poppins-Medium',
    },
    inputError: {
      borderColor: '#ef4444',
      borderWidth: 1.5,
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      marginTop: -12,
      marginBottom: 12,
      marginLeft: 14,
    },
    routesContainer: {
      marginBottom: 16,
    },
    routesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    routeInputContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    routeInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
    },
    addRouteButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 48,
    },
    routesList: {
      gap: 8,
      maxHeight: 200,
    },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    deleteRouteButton: {
      padding: 4,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: '#ef4444',
    },
    modalCancelText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '500',
    },
    modalSaveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    modalSaveText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '500',
    },
    requiredStar: {
      color: '#ef4444',
    },
    fieldLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '500',
    },
    disabledButton: {
      opacity: 0.5,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
  }), [colors])

  const validateForm = () => {
    const errors = {}
    
    if (!busFormData.name.trim()) {
      errors.name = 'Bus name is required'
    }
    if (!busFormData.busNumber.trim()) {
      errors.busNumber = 'Bus number is required'
    }
    if (!busFormData.driverName.trim()) {
      errors.driverName = 'Driver name is required'
    }
    if (!busFormData.driverPhone.trim()) {
      errors.driverPhone = 'Driver phone is required'
    } else if (!/^\d{10}$/.test(busFormData.driverPhone.replace(/\D/g, ''))) {
      errors.driverPhone = 'Phone number must be 10 digits'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openAddBusModal = () => {
    setEditingBus(null)
    setBusFormData({
      name: '',
      busNumber: '',
      driverName: '',
      driverPhone: '',
      routes: []
    })
    setFormErrors({})
    setNewRouteInput('')
    setShowBusModal(true)
  }

  const openEditBusModal = (bus) => {
    setEditingBus(bus)
    setBusFormData({
      name: bus.name || '',
      busNumber: bus.busNumber || '',
      driverName: bus.driverName || '',
      driverPhone: bus.driverPhone || '',
      routes: Array.isArray(bus.routes) ? [...bus.routes] : []
    })
    setFormErrors({})
    setNewRouteInput('')
    setShowBusModal(true)
  }

  const handleBusInputChange = (field, value) => {
    setBusFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const addRoute = () => {
    if (newRouteInput.trim()) {
      const routeToAdd = newRouteInput.trim()
      setBusFormData(prev => ({
        ...prev,
        routes: [...prev.routes, routeToAdd]
      }))
      setNewRouteInput('')
    }
  }

  const deleteRoute = (index) => {
    setBusFormData(prev => ({
      ...prev,
      routes: prev.routes.filter((_, i) => i !== index)
    }))
  }

  // Check if bus number already exists
  const isBusNumberDuplicate = (busNumber, excludeBusId = null) => {
    return localBuses.some(bus => 
      bus.busNumber === busNumber && 
      bus.id !== excludeBusId
    )
  }

  const saveBus = async () => {
    if (!validateForm()) {
      showToast('Please fill all required fields correctly', 'warning')
      return
    }

    // Check for duplicate bus number
    const isDuplicate = isBusNumberDuplicate(
      busFormData.busNumber.trim(), 
      editingBus?.id
    )
    
    if (isDuplicate) {
      setFormErrors(prev => ({ 
        ...prev, 
        busNumber: 'Bus number already exists' 
      }))
      showToast('Bus number already exists! Please use a different bus number.', 'error')
      return
    }

    try {
      setSaveLoading(true)
      setActionLoading(true)
      
      let response
      
      if (editingBus) {
        response = await axiosApi.put(`/school/buses/${editingBus.id}`, busFormData)
      } else {
        response = await axiosApi.post('/school/buses', busFormData)
      }
      
      if (response.data.success) {
        setShowBusModal(false)
        showToast(response.data.message, 'success')
        
        // Refresh buses
        const updatedResponse = await axiosApi.get('/school')
        if (updatedResponse.data.success) {
          const newBuses = Array.isArray(updatedResponse.data.data.buses) 
            ? updatedResponse.data.data.buses 
            : []
          onBusesUpdate(newBuses)
          setLocalBuses(newBuses)
        }
      } else {
        showToast(response.data.message || 'Failed to save bus', 'error')
      }
    } catch (error) {
      console.error('Save bus error:', error)
      
      // Handle duplicate bus number from server response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save bus'
      
      if (errorMessage.toLowerCase().includes('bus number already exists') || 
          errorMessage.toLowerCase().includes('already exists')) {
        setFormErrors(prev => ({ 
          ...prev, 
          busNumber: 'Bus number already exists' 
        }))
        showToast('Bus number already exists! Please use a different bus number.', 'error')
      } else if (error.response?.status === 400) {
        showToast(errorMessage, 'error')
      } else {
        showToast('Failed to save bus. Please try again.', 'error')
      }
    } finally {
      setSaveLoading(false)
      setActionLoading(false)
    }
  }

  const openDeleteConfirmation = (bus) => {
    setBusToDelete(bus)
    setDeleteModalVisible(true)
  }

  const handleDeleteConfirm = async () => {
    if (!busToDelete) return

    try {
      setDeleteModalVisible(false)
      setActionLoading(true)

      const response = await axiosApi.delete(`/school/buses/${busToDelete.id}`)
      if (response.data.success) {
        showToast('Bus deleted successfully!', 'success')
        
        const updatedResponse = await axiosApi.get('/school')
        if (updatedResponse.data.success) {
          const newBuses = Array.isArray(updatedResponse.data.data.buses) 
            ? updatedResponse.data.data.buses 
            : []
          onBusesUpdate(newBuses)
          setLocalBuses(newBuses)
        }
      } else {
        showToast(response.data.message || 'Failed to delete bus', 'error')
      }
    } catch (error) {
      console.error('Delete bus error:', error)
      showToast(error.response?.data?.message || 'Failed to delete bus', 'error')
    } finally {
      setActionLoading(false)
      setBusToDelete(null)
    }
  }

  const renderBusCard = useCallback((bus, index) => {
    if (!bus || !bus.id) return null
    
    return (
      <View key={bus.id} style={styles.busCard}>
        <View style={styles.busHeader}>
          <View style={styles.busNumberBadge}>
            <View style={styles.busNumberCircle}>
              <ThemedText style={styles.busNumberCircleText}>
                {index + 1}
              </ThemedText>
            </View>
            <ThemedText style={styles.busName}>
              {bus.name || 'Unnamed Bus'}
            </ThemedText>
          </View>
          <View style={styles.busPlate}>
            <ThemedText style={styles.busPlateText}>
              {bus.busNumber || 'N/A'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.busRoutesContainer}>
          <ThemedText style={styles.busRoutesLabel}>Routes</ThemedText>
          <View style={styles.busRoutesList}>
            {Array.isArray(bus.routes) && bus.routes.length > 0 ? (
              bus.routes.map((route, routeIndex) => (
                <View key={routeIndex} style={styles.routeTag}>
                  <ThemedText style={styles.routeTagText}>{route}</ThemedText>
                </View>
              ))
            ) : (
              <View style={styles.routeTag}>
                <ThemedText style={styles.routeTagText}>No routes specified</ThemedText>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.busInfoItem}>
          <ThemedText style={styles.busInfoLabel}>Driver</ThemedText>
          <ThemedText style={styles.busInfoValue}>{bus.driverName || 'Not specified'}</ThemedText>
        </View>
        
        <View style={styles.busInfoItem}>
          <ThemedText style={styles.busInfoLabel}>Contact</ThemedText>
          <ThemedText style={styles.busInfoValue}>{bus.driverPhone || 'Not specified'}</ThemedText>
        </View>
        
        {isEditing && (
          <View style={styles.busActions}>
            <TouchableOpacity 
              style={[styles.busActionButton, styles.busEditButton, loading && styles.disabledButton]}
              onPress={() => openEditBusModal(bus)}
              disabled={loading}
            >
              <Feather name="edit" size={14} color={colors.primary} />
              <ThemedText style={{ color: colors.primary, fontSize: 13 }}>
                Edit
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.busActionButton, styles.busDeleteButton, loading && styles.disabledButton]}
              onPress={() => openDeleteConfirmation(bus)}
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
              <ThemedText style={{ color: '#ef4444', fontSize: 13 }}>
                Delete
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }, [isEditing, loading, styles, colors])

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText style={styles.headerText}>
          School transportation details
        </ThemedText>
        
        {localBuses.length === 0 ? (
          isEditing ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="bus" size={64} color={colors.textSecondary + '40'} style={styles.emptyIcon} />
              <ThemedText style={styles.emptyText}>No buses registered yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Add your first bus to manage transportation
              </ThemedText>
              <TouchableOpacity
                style={[styles.addFirstButton, (saveLoading || loading) && styles.disabledButton]}
                onPress={openAddBusModal}
                disabled={saveLoading || loading}
              >
                {saveLoading ? (
                  <ActivityIndicator size={'small'} color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color={colors.primary} />
                    <ThemedText style={styles.addFirstText}>Add First Bus</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="bus" size={64} color={colors.textSecondary + '40'} style={styles.emptyIcon} />
              <ThemedText style={styles.emptyText}>No buses registered yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Ask administrator to add bus information
              </ThemedText>
            </View>
          )
        ) : (
          <>
            <View style={styles.busList}>
              {localBuses.map((bus, index) => renderBusCard(bus, index))}
            </View>
            
            {isEditing && (
              <TouchableOpacity
                style={[styles.addBusButton, (saveLoading || loading) && styles.disabledButton]}
                onPress={openAddBusModal}
                disabled={saveLoading || loading}
              >
                <Ionicons name="add-circle" size={22} color={colors.primary} />
                <ThemedText style={styles.addBusText}>
                  Add Another Bus
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Bus Modal with KeyboardAvoidingView */}
      <Modal
        statusBarTranslucent
        visible={showBusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !saveLoading && setShowBusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalTitleIcon}>
                  <FontAwesome5 name="bus-alt" size={20} color={colors.primary} />
                </View>
                <ThemedText style={styles.modalTitle}>
                  {editingBus ? 'Edit Bus' : 'Add New Bus'}
                </ThemedText>
              </View>
              <TouchableOpacity 
                onPress={() => !saveLoading && setShowBusModal(false)}
                disabled={saveLoading}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ maxHeight: '70%' }} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Bus Name */}
              <ThemedText style={styles.fieldLabel}>
                Bus Name <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={[styles.modalInputContainer, formErrors.name && styles.inputError]}>
                <FontAwesome5 name="bus" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Main Town Bus"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.name}
                  onChangeText={(text) => handleBusInputChange('name', text)}
                  editable={!saveLoading}
                  returnKeyType="next"
                />
              </View>
              {formErrors.name && (
                <ThemedText style={styles.errorText}>{formErrors.name}</ThemedText>
              )}

              {/* Bus Number */}
              <ThemedText style={styles.fieldLabel}>
                Bus Number <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={[styles.modalInputContainer, formErrors.busNumber && styles.inputError]}>
                <FontAwesome5 name="hashtag" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., AP07 AB 1234"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.busNumber}
                  onChangeText={(text) => handleBusInputChange('busNumber', text)}
                  editable={!saveLoading}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              </View>
              {formErrors.busNumber && (
                <ThemedText style={styles.errorText}>{formErrors.busNumber}</ThemedText>
              )}

              {/* Driver Name */}
              <ThemedText style={styles.fieldLabel}>
                Driver Name <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={[styles.modalInputContainer, formErrors.driverName && styles.inputError]}>
                <FontAwesome5 name="user-tie" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter driver name"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.driverName}
                  onChangeText={(text) => handleBusInputChange('driverName', text)}
                  editable={!saveLoading}
                  returnKeyType="next"
                />
              </View>
              {formErrors.driverName && (
                <ThemedText style={styles.errorText}>{formErrors.driverName}</ThemedText>
              )}

              {/* Driver Phone */}
              <ThemedText style={styles.fieldLabel}>
                Driver Phone <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={[styles.modalInputContainer, formErrors.driverPhone && styles.inputError]}>
                <Feather name="phone" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.driverPhone}
                  onChangeText={(text) => handleBusInputChange('driverPhone', text)}
                  keyboardType="phone-pad"
                  editable={!saveLoading}
                  maxLength={10}
                  returnKeyType="next"
                />
              </View>
              {formErrors.driverPhone && (
                <ThemedText style={styles.errorText}>{formErrors.driverPhone}</ThemedText>
              )}

              {/* Routes Section */}
              <View style={styles.routesContainer}>
                <View style={styles.routesHeader}>
                  <ThemedText style={styles.fieldLabel}>
                    Routes
                  </ThemedText>
                </View>
                <View style={styles.routeInputContainer}>
                  <TextInput
                    style={styles.routeInput}
                    placeholder="Add a route (e.g., Main Town)"
                    placeholderTextColor={colors.textSecondary}
                    value={newRouteInput}
                    onChangeText={setNewRouteInput}
                    editable={!saveLoading}
                    onSubmitEditing={addRoute}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[styles.addRouteButton, saveLoading && styles.disabledButton]}
                    onPress={addRoute}
                    disabled={saveLoading}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.routesList}>
                  {busFormData.routes.map((route, index) => (
                    <View key={index} style={styles.routeItem}>
                      <ThemedText style={styles.routeText}>{route}</ThemedText>
                      <TouchableOpacity
                        style={[styles.deleteRouteButton, saveLoading && styles.disabledButton]}
                        onPress={() => deleteRoute(index)}
                        disabled={saveLoading}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, saveLoading && styles.disabledButton]}
                onPress={() => setShowBusModal(false)}
                disabled={saveLoading}
              >
                <ThemedText style={styles.modalCancelText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, saveLoading && styles.disabledButton]}
                onPress={saveBus}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size={'small'} color={'#ffffff'} />
                ) : (
                  <ThemedText style={styles.modalSaveText}>
                    {editingBus ? 'Update Bus' : 'Add Bus'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Bus Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false)
          setBusToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Bus"
        message={`Are you sure you want to delete the bus "${busToDelete?.name || 'this bus'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </>
  )
}

export default BusDetails