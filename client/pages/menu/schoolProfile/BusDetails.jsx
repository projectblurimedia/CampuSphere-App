import React, { useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons'
import axiosApi from '@/utils/axiosApi'

const BusDetails = ({ buses, isEditing, onBusesUpdate, showToast, colors }) => {
  const [editingBus, setEditingBus] = useState(null)
  const [showBusModal, setShowBusModal] = useState(false)
  const [newRouteInput, setNewRouteInput] = useState('')
  const [busFormData, setBusFormData] = useState({
    name: '',
    busNumber: '',
    driverName: '',
    driverPhone: '',
    routes: ['']
  })

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
      paddingVertical: 60,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      minHeight: '60%',
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    modalTitleContainer: {
      flex: 1,
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
      paddingBottom: 20,
    },
    modalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 12,
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
      marginBottom: 8,
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
    },
    addRouteButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    routesList: {
      gap: 6,
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
    },
    deleteRouteButton: {
      padding: 4,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      borderColor: colors.border,
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
    },
  }), [colors])

  const openAddBusModal = () => {
    setEditingBus(null)
    setBusFormData({
      name: '',
      busNumber: '',
      driverName: '',
      driverPhone: '',
      routes: ['']
    })
    setNewRouteInput('')
    setShowBusModal(true)
  }

  const openEditBusModal = (bus) => {
    setEditingBus(bus)
    setBusFormData({
      name: bus.name,
      busNumber: bus.busNumber,
      driverName: bus.driverName,
      driverPhone: bus.driverPhone,
      routes: [...bus.routes]
    })
    setNewRouteInput('')
    setShowBusModal(true)
  }

  const handleBusInputChange = (field, value) => {
    setBusFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addRoute = () => {
    if (newRouteInput.trim()) {
      setBusFormData(prev => ({
        ...prev,
        routes: [...prev.routes, newRouteInput.trim()]
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

  const saveBus = async () => {
    if (!busFormData.name || !busFormData.busNumber || !busFormData.driverName || !busFormData.driverPhone) {
      showToast('Please fill all required fields', 'error')
      return
    }

    try {
      let response
      
      if (editingBus) {
        response = await axiosApi.put(`/school/buses/${editingBus._id}`, busFormData)
      } else {
        response = await axiosApi.post('/school/buses', busFormData)
      }
      
      if (response.data.success) {
        setShowBusModal(false)
        showToast(response.data.message, 'success')
        
        const updatedResponse = await axiosApi.get('/school')
        if (updatedResponse.data.success) {
          onBusesUpdate(updatedResponse.data.data.buses)
        }
      } else {
        showToast(response.data.message || 'Failed to save bus', 'error')
      }
    } catch (error) {
      console.error('Save bus error:', error)
      showToast(error.response?.data?.message || 'Failed to save bus', 'error')
    }
  }

  const deleteBus = async (busId) => {
    Alert.alert(
      'Delete Bus',
      'Are you sure you want to delete this bus?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axiosApi.delete(`/school/buses/${busId}`)
              if (response.data.success) {
                showToast('Bus deleted successfully!', 'success')
                
                const updatedResponse = await axiosApi.get('/school')
                if (updatedResponse.data.success) {
                  onBusesUpdate(updatedResponse.data.data.buses)
                }
              } else {
                showToast(response.data.message || 'Failed to delete bus', 'error')
              }
            } catch (error) {
              console.error('Delete bus error:', error)
              showToast(error.response?.data?.message || 'Failed to delete bus', 'error')
            }
          }
        }
      ]
    )
  }

  const renderBusCard = (bus, index) => (
    <View key={bus._id} style={styles.busCard}>
      <View style={styles.busHeader}>
        <View style={styles.busNumberBadge}>
          <View style={styles.busNumberCircle}>
            <ThemedText style={styles.busNumberCircleText}>
              {index + 1}
            </ThemedText>
          </View>
          <ThemedText style={styles.busName}>
            {bus.name}
          </ThemedText>
        </View>
        <View style={styles.busPlate}>
          <ThemedText style={styles.busPlateText}>
            {bus.busNumber}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.busRoutesContainer}>
        <ThemedText style={styles.busRoutesLabel}>Routes</ThemedText>
        <View style={styles.busRoutesList}>
          {bus.routes.map((route, routeIndex) => (
            <View key={routeIndex} style={styles.routeTag}>
              <ThemedText style={styles.routeTagText}>{route}</ThemedText>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.busInfoItem}>
        <ThemedText style={styles.busInfoLabel}>Driver</ThemedText>
        <ThemedText style={styles.busInfoValue}>{bus.driverName}</ThemedText>
      </View>
      
      <View style={styles.busInfoItem}>
        <ThemedText style={styles.busInfoLabel}>Contact</ThemedText>
        <ThemedText style={styles.busInfoValue}>{bus.driverPhone}</ThemedText>
      </View>
      
      {isEditing && (
        <View style={styles.busActions}>
          <TouchableOpacity 
            style={[styles.busActionButton, styles.busEditButton]}
            onPress={() => openEditBusModal(bus)}
          >
            <Feather name="edit" size={14} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, fontSize: 13 }}>
              Edit
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.busActionButton, styles.busDeleteButton]}
            onPress={() => deleteBus(bus._id)}
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
        
        {buses.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="bus" size={64} color={colors.textSecondary + '40'} style={styles.emptyIcon} />
            <ThemedText style={styles.emptyText}>No buses registered yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {isEditing ? 'Add buses to manage transportation' : 'No transportation available'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.busList}>
            {buses.map((bus, index) => renderBusCard(bus, index))}
          </View>
        )}
        
        {isEditing && (
          <TouchableOpacity
            style={styles.addBusButton}
            onPress={openAddBusModal}
          >
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <ThemedText style={styles.addBusText}>
              Add New Bus
            </ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bus Modal */}
      <Modal
        visible={showBusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBusModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalTitleIcon}>
                  <FontAwesome5 name="bus-alt" size={20} color={colors.primary} />
                </View>
                <ThemedText style={styles.modalTitle}>
                  {editingBus ? 'Edit Bus' : 'Add New Bus'}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowBusModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={styles.fieldLabel}>
                Bus Name <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.modalInputContainer}>
                <FontAwesome5 name="bus" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Main Town Bus"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.name}
                  onChangeText={(text) => handleBusInputChange('name', text)}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>
                Bus Number <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.modalInputContainer}>
                <FontAwesome5 name="hashtag" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., AP07 AB 1234"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.busNumber}
                  onChangeText={(text) => handleBusInputChange('busNumber', text)}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>
                Driver Name <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.modalInputContainer}>
                <FontAwesome5 name="user-tie" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter driver name"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.driverName}
                  onChangeText={(text) => handleBusInputChange('driverName', text)}
                />
              </View>

              <ThemedText style={styles.fieldLabel}>
                Driver Phone <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.modalInputContainer}>
                <Feather name="phone" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter driver phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.driverPhone}
                  onChangeText={(text) => handleBusInputChange('driverPhone', text)}
                  keyboardType="phone-pad"
                />
              </View>

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
                  />
                  <TouchableOpacity
                    style={styles.addRouteButton}
                    onPress={addRoute}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.routesList}>
                  {busFormData.routes.map((route, index) => (
                    <View key={index} style={styles.routeItem}>
                      <ThemedText style={styles.routeText}>{route}</ThemedText>
                      <TouchableOpacity
                        style={styles.deleteRouteButton}
                        onPress={() => deleteRoute(index)}
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
                style={styles.modalCancelButton}
                onPress={() => setShowBusModal(false)}
              >
                <ThemedText style={styles.modalCancelText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveBus}
              >
                <ThemedText style={styles.modalSaveText}>
                  {editingBus ? 'Update Bus' : 'Add Bus'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

export default BusDetails