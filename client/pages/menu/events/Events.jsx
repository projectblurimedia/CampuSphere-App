import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Image,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import GalleryModal from './GalleryModal'
import { ThemedInput } from '@/components/ui/themed-input'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import eventApi from '@/api/eventApi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function Events({ visible, onClose }) {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [galleryModalVisible, setGalleryModalVisible] = useState(false)
  const [selectedEventImages, setSelectedEventImages] = useState([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [initialViewMode, setInitialViewMode] = useState('grid')
  const [galleryTitle, setGalleryTitle] = useState('')
  
  // Event Modals State
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    date: new Date(), 
    description: '', 
    images: [] 
  })
  const [editEvent, setEditEvent] = useState({ 
    title: '', 
    date: new Date(), 
    description: '', 
    images: [] 
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerType, setDatePickerType] = useState('add')

  // API States
  const [calendarEvents, setCalendarEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState({
    visible: false,
    type: 'info',
    message: '',
    position: 'bottom-center'
  })

  const currentDate = new Date()

  // Weekday colors
  const weekdayColors = [
    '#FF6B6B', // Sunday
    '#4ECDC4', // Monday
    '#45B7D1', // Tuesday
    '#96CEB4', // Wednesday
    '#f9b82c', // Thursday
    '#FF9FF3', // Friday
    '#54A0FF', // Saturday
  ]

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
      position: 'relative',
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
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      color: '#FFFFFF',
      marginBottom: -3,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    addButton: {
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
      marginLeft: 6,
    },
    inactiveTabText: {
      color: colors.textSecondary,
    },
    contentContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
      padding: 16,
    },
    // Event Card Styles
    eventCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 0,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border + '30',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    eventHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    eventTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    eventTitle: {
      fontSize: 16,
      flex: 1,
      color: colors.text,
    },
    dateBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    eventBody: {
      padding: 16,
    },
    eventDesc: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    // Image Grid Styles
    imageGrid: {
      marginTop: 8,
    },
    imageRow: {
      flexDirection: 'row',
      gap: 8,
    },
    imageContainer: {
      flex: 1,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: 100,
    },
    extraImagesOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    extraCount: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    eventFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '20',
      backgroundColor: colors.cardBackground + '80',
    },
    eventStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: colors.cardBackground,
    },
    eventStatus: {
      fontSize: 12,
      fontWeight: '600',
    },
    eventActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 80,
      justifyContent: 'center',
    },
    editAction: {
      backgroundColor: '#3B82F6',
    },
    deleteAction: {
      backgroundColor: '#EF4444',
    },
    actionText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      paddingTop: Platform.OS === 'ios' ? 75 : 55,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    modalCloseBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    modalTitleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 20,
      color: '#FFFFFF',
      marginBottom: -3,
    },
    modalSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    modalBody: {
      flex: 1,
      padding: 20,
    },
    // Input Styles
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    inputWrapper: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: 16,
      top: 16,
      zIndex: 1,
    },
    dateInput: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    dateText: {
      color: colors.text,
      fontSize: 16,
      flex: 1,
      marginLeft: 12,
    },
    datePickerIcon: {
      marginLeft: 8,
    },
    input: {
      paddingLeft: 52,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 16,
    },
    multilineInput: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    saveBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 30,
      opacity: 1,
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    imagesSection: {
      marginBottom: 20,
    },
    imagesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    imagePickContainer: {
      width: (SCREEN_WIDTH - 80) / 3,
      height: 100,
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary + '50',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
    },
    imageItemContainer: {
      position: 'relative',
    },
    removeImageBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#EF4444',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      borderWidth: 2,
      borderColor: colors.background,
    },
    // View Event Modal Styles
    viewModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    viewModalBody: {
      flex: 1,
      padding: 20,
    },
    viewEventTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
    },
    viewEventDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    viewEventDesc: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 24,
      color: colors.text,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [colors])

  // Show toast notification
  const showToast = (type, message, position = 'bottom-right') => {
    setToast({
      visible: true,
      type,
      message,
      position
    })
  }

  // Hide toast notification
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventApi.getAllEvents()
      if (response.success) {
        setCalendarEvents(response.data)
      } else {
        showToast('error', response.message || 'Failed to load events')
      }
    } catch (error) {
      showToast('error', error.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  // Filter events
  const upcomingEvents = calendarEvents.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate > currentDate
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  const pastEvents = calendarEvents.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate <= currentDate
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  // Load events when component mounts or tab changes
  useEffect(() => {
    if (visible) {
      fetchEvents()
    }
  }, [visible])

  // Event handlers
  const pickImages = async (isAdd) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant permission to access photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      })

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        }))
        
        if (isAdd) {
          setNewEvent(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
          }))
        } else {
          setEditEvent(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
          }))
        }
      }
    } catch (error) {
      showToast('error', 'Failed to pick images')
    }
  }

  const removeImage = (index, isAdd) => {
    if (isAdd) {
      const newImages = [...newEvent.images]
      newImages.splice(index, 1)
      setNewEvent(prev => ({ ...prev, images: newImages }))
    } else {
      const newImages = [...editEvent.images]
      newImages.splice(index, 1)
      setEditEvent(prev => ({ ...prev, images: newImages }))
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      showToast('warning', 'Please enter event title')
      return
    }
    
    if (!newEvent.description.trim()) {
      showToast('warning', 'Please enter event description')
      return
    }

    try {
      setActionLoading(true)
      const response = await eventApi.createEvent(newEvent, newEvent.images)
      if (response.success) {
        showToast('success', 'Event created successfully!')
        setCalendarEvents(prev => [response.data, ...prev])
        setNewEvent({ title: '', date: new Date(), description: '', images: [] })
        setAddModalVisible(false)
      } else {
        showToast('error', response.message || 'Failed to create event')
      }
    } catch (error) {
      showToast('error', error.message || 'Failed to create event')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditEvent = async () => {
    if (!editEvent.title.trim()) {
      showToast('warning', 'Please enter event title')
      return
    }
    
    if (!editEvent.description.trim()) {
      showToast('warning', 'Please enter event description')
      return
    }

    try {
      setActionLoading(true)
      
      // Get original event images
      const existingImages = selectedEvent?.images || []
      const currentImages = editEvent.images || []
      
      // Find images that were in existingImages but are not in currentImages
      const imagesToRemove = []
      
      existingImages.forEach(existingImage => {
        // Check if this image still exists in currentImages
        const stillExists = currentImages.some(currentImage => {
          // If currentImage has _id (from existing images), compare by _id
          if (currentImage._id) {
            return existingImage._id === currentImage._id
          }
          // If currentImage has url but no _id (might be from same source), compare by url
          if (currentImage.url) {
            return existingImage.url === currentImage.url
          }
          // If currentImage has uri (new image), it's not in existing images
          return false
        })
        
        // If image doesn't exist in currentImages, mark it for removal
        if (!stillExists && existingImage._id) {
          imagesToRemove.push(existingImage._id)
        }
      })
      
      // Separate new images (have uri but no _id) from existing images
      const newImages = editEvent.images.filter(img => img.uri && !img._id)
      
      const response = await eventApi.updateEvent(
        selectedEvent._id,
        {
          title: editEvent.title,
          date: editEvent.date,
          description: editEvent.description
        },
        newImages,
        imagesToRemove
      )
      
      if (response.success) {
        showToast('success', 'Event updated successfully!')
        setCalendarEvents(prev => prev.map(e => 
          e._id === selectedEvent._id ? response.data : e
        ))
        setEditModalVisible(false)
        setSelectedEvent(null)
        
        // Reset edit event state
        setEditEvent({ 
          title: '', 
          date: new Date(), 
          description: '', 
          images: [] 
        })
      } else {
        showToast('error', response.message || 'Failed to update event')
      }
    } catch (error) {
      console.error('Update event error:', error)
      showToast('error', error.message || 'Failed to update event')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEvent = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            setActionLoading(true)
            const response = await eventApi.deleteEvent(id)
            
            if (response.success) {
              showToast('success', 'Event deleted successfully!')
              setCalendarEvents(prev => prev.filter(e => e._id !== id))
            } else {
              showToast('error', response.message || 'Failed to delete event')
            }
          } catch (error) {
            showToast('error', error.message || 'Failed to delete event')
          } finally {
            setActionLoading(false)
          }
        }
      }
    ])
  }

  const openViewEvent = (event) => {
    setSelectedEvent(event)
    setViewModalVisible(true)
  }

  const openEditEvent = (event) => {
    const eventDate = new Date(event.date)
    setSelectedEvent(event)
    setEditEvent({ 
      title: event.title, 
      date: eventDate, 
      description: event.description, 
      images: event.images || [] 
    })
    setEditModalVisible(true)
  }

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      if (datePickerType === 'add') {
        setNewEvent({ ...newEvent, date: selectedDate })
      } else {
        setEditEvent({ ...editEvent, date: selectedDate })
      }
    }
  }

  // Render image grid
  const renderImageGrid = (images, isClickable = true, eventTitle = '') => {
    if (!images || images.length === 0) return null

    const displayImages = images.slice(0, 3)
    const extraCount = images.length - 3

    return (
      <View style={styles.imageGrid}>
        <View style={styles.imageRow}>
          {displayImages.map((img, index) => (
            <TouchableOpacity
              key={index}
              style={styles.imageContainer}
              onPress={() => {
                if (isClickable) {
                  setSelectedEventImages(images)
                  setSelectedImageIndex(index)
                  setInitialViewMode('grid')
                  setGalleryTitle(eventTitle)
                  setGalleryModalVisible(true)
                }
              }}
              activeOpacity={isClickable ? 0.7 : 1}
            >
              <Image 
                source={{ uri: img.url || img.uri }} 
                style={styles.image}
                resizeMode="cover"
              />
              
              {index === 2 && extraCount > 0 && (
                <View style={styles.extraImagesOverlay}>
                  <ThemedText style={styles.extraCount}>+{extraCount}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  // Render event card
  const renderEventCard = (event) => {
    const eventDate = new Date(event.date)
    const isPast = eventDate <= currentDate
    const dayIndex = eventDate.getDay()
    const borderColor = weekdayColors[dayIndex]
    const statusColor = isPast ? '#9CA3AF' : '#10B981'
    const hasImages = event.images && event.images.length > 0

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => openViewEvent(event)}
        activeOpacity={0.9}
      >
        {/* Event Header */}
        <LinearGradient
          colors={[borderColor + '15', borderColor + '05']}
          style={styles.eventHeader}
        >
          <View style={styles.eventTitleContainer}>
            <ThemedText style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </ThemedText>
            <View style={[styles.dateBadge, { backgroundColor: borderColor + '20' }]}>
              <MaterialCommunityIcons name="calendar" size={14} color={borderColor} />
              <ThemedText style={[styles.dateBadgeText, { color: borderColor }]}>
                {event.formattedDate || event.date.split('T')[0]}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Event Body */}
        <View style={styles.eventBody}>
          <ThemedText style={styles.eventDesc} numberOfLines={2}>
            {event.description}
          </ThemedText>
          {hasImages && renderImageGrid(event.images, true, event.title)}
        </View>

        {/* Event Footer with actions */}
        <View style={styles.eventFooter}>
          <View style={[styles.eventStatusBadge, { borderColor: statusColor }]}>
            <ThemedText style={[styles.eventStatus, { color: statusColor }]}>
              {isPast ? 'Completed' : 'Upcoming'}
            </ThemedText>
          </View>
          <View style={styles.eventActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editAction]}
              onPress={() => openEditEvent(event)}
              disabled={actionLoading}
            >
              <Feather name="edit-2" size={14} color="#FFFFFF" />
              <ThemedText style={styles.actionText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteAction]}
              onPress={() => handleDeleteEvent(event._id)}
              disabled={actionLoading}
            >
              <Feather name="trash-2" size={14} color="#FFFFFF" />
              <ThemedText style={styles.actionText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Render event list
  const renderEventList = () => {
    const events = activeTab === 'upcoming' ? upcomingEvents : pastEvents

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} color={colors.primary} message="Loading events..." />
        </View>
      )
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyText, { marginTop: 16 }]}>
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} events
          </ThemedText>
        </View>
      )
    }

    return (
      <FlatList
        data={events}
        renderItem={({ item }) => renderEventCard(item)}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchEvents}
      />
    )
  }

  // Render modal header
  const ModalHeader = ({ title, subtitle, onClose }) => (
    <LinearGradient
      colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
      style={styles.modalHeader}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.modalHeaderRow}>
          <TouchableOpacity 
            style={styles.modalCloseBtn} 
            onPress={onClose}
            disabled={actionLoading}
          >
            <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.modalTitleContainer}>
            <ThemedText type="subtitle" style={styles.modalTitle}>{title}</ThemedText>
            {subtitle && (
              <ThemedText style={styles.modalSubtitle}>{subtitle}</ThemedText>
            )}
          </View>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  )

  // Render modal body for add/edit
  const renderEventModalBody = (isAdd, eventData, setEventData, handleSubmit) => {
    const images = eventData.images || []
    
    return (
      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Event Title *</ThemedText>
          <View style={styles.inputWrapper}>
            <Feather name="file-text" size={20} color={colors.primary} style={styles.inputIcon} />
            <ThemedInput
              style={[styles.input, { borderColor: colors.primary + '50' }]}
              placeholder="Enter event title"
              placeholderTextColor={colors.textSecondary + '80'}
              value={eventData.title}
              onChangeText={(text) => setEventData({ ...eventData, title: text })}
              editable={!actionLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Event Date *</ThemedText>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: colors.primary + '50' }]}
            onPress={() => {
              if (!actionLoading) {
                setDatePickerType(isAdd ? 'add' : 'edit')
                setShowDatePicker(true)
              }
            }}
            disabled={actionLoading}
          >
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
            <ThemedText style={styles.dateText}>
              {eventData.date.toDateString()}
            </ThemedText>
            <MaterialCommunityIcons 
              name="calendar-edit" 
              size={20} 
              color={colors.primary} 
              style={styles.datePickerIcon}
            />
          </TouchableOpacity>
          {showDatePicker && ((isAdd && datePickerType === 'add') || (!isAdd && datePickerType === 'edit')) && (
            <DateTimePicker
              value={eventData.date}
              mode="date"
              display="default"
              minimumDate={isAdd ? currentDate : new Date()}
              onChange={onDateChange}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Description *</ThemedText>
          <View style={styles.inputWrapper}>
            <Feather name="align-left" size={20} color={colors.primary} style={styles.inputIcon} />
            <ThemedInput
              style={[styles.input, styles.multilineInput, { borderColor: colors.primary + '50' }]}
              placeholder="Enter event description"
              placeholderTextColor={colors.textSecondary + '80'}
              multiline
              numberOfLines={5}
              value={eventData.description}
              onChangeText={(text) => setEventData({ ...eventData, description: text })}
              editable={!actionLoading}
            />
          </View>
        </View>

        <View style={styles.imagesSection}>
          <View style={styles.imagesHeader}>
            <ThemedText style={styles.inputLabel}>Event Images (Optional)</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
              {images.length} added
            </ThemedText>
          </View>
          
          {images.length > 0 ? (
            <View style={styles.imagesGrid}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageItemContainer}>
                  <Image
                    source={{ uri: img.url || img.uri }}
                    style={{
                      width: (SCREEN_WIDTH - 80) / 3,
                      height: 100,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.primary + '30',
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(index, isAdd)}
                    disabled={actionLoading}
                  >
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.imagePickContainer} 
                onPress={() => pickImages(isAdd)}
                disabled={actionLoading}
              >
                <Feather name="plus" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.imagePickContainer, { width: '100%', height: 120 }]} 
              onPress={() => pickImages(isAdd)}
              disabled={actionLoading}
            >
              <Feather name="image" size={32} color={colors.primary} />
              <ThemedText style={{ color: colors.primary, marginTop: 8, fontSize: 14 }}>
                Tap to add images
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, actionLoading && styles.saveBtnDisabled]} 
          onPress={handleSubmit}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <LoadingSpinner size={20} color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.saveBtnText}>
              {isAdd ? 'Create Event' : 'Update Event'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // Render view event modal
  const renderViewEventModal = () => {
    if (!selectedEvent) return null

    const eventDate = new Date(selectedEvent.date)
    const dayIndex = eventDate.getDay()
    const borderColor = weekdayColors[dayIndex]

    return (
      <Modal
        visible={viewModalVisible}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.viewModalContainer}>
          <ModalHeader 
            title="Event Details" 
            subtitle="View event information"
            onClose={() => setViewModalVisible(false)}
          />
          <ScrollView style={styles.viewModalBody} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 4,
                height: 40,
                backgroundColor: borderColor,
                borderRadius: 2,
                marginRight: 12,
              }} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.viewEventTitle}>
                  {selectedEvent.title}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MaterialCommunityIcons name="calendar" size={16} color={borderColor} />
                  <ThemedText style={[styles.viewEventDate, { color: borderColor, marginLeft: 8 }]}>
                    {selectedEvent.formattedDate || selectedEvent.date.split('T')[0]}
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <ThemedText style={styles.viewEventDesc}>
              {selectedEvent.description}
            </ThemedText>
            
            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <>
                <View style={styles.imagesHeader}>
                  <ThemedText style={styles.inputLabel}>Event Gallery</ThemedText>
                  <ThemedText style={{ color: borderColor, fontWeight: '600' }}>
                    {selectedEvent.images.length} photos
                  </ThemedText>
                </View>
                {renderImageGrid(selectedEvent.images, true, selectedEvent.title)}
                
                {selectedEvent.images.length > 3 && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { 
                      backgroundColor: borderColor, 
                      marginTop: 16,
                      alignSelf: 'center'
                    }]}
                    onPress={() => {
                      setSelectedEventImages(selectedEvent.images)
                      setSelectedImageIndex(0)
                      setInitialViewMode('grid')
                      setGalleryTitle(selectedEvent.title)
                      setGalleryModalVisible(true)
                    }}
                  >
                    <Feather name="grid" size={14} color="#FFFFFF" />
                    <ThemedText style={styles.actionText}>View All Photos</ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    )
  }

  // Render tabs
  const renderTab = (tab) => {
    const IconComponent = MaterialCommunityIcons
    const isActive = activeTab === tab.key
    
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          isActive && {
            borderBottomWidth: 3,
            borderBottomColor: tab.iconColor,
            backgroundColor: tab.bgColor,
          }
        ]}
        onPress={() => setActiveTab(tab.key)}
        disabled={loading}
      >
        <View style={styles.tabIconContainer}>
          <IconComponent
            name={tab.icon}
            size={20}
            color={isActive ? tab.iconColor : colors.textSecondary}
          />
        </View>
        <ThemedText
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

  // Handle close
  const handleClose = () => {
    setGalleryModalVisible(false)
    setAddModalVisible(false)
    setEditModalVisible(false)
    setViewModalVisible(false)
    onClose()
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.container}>     
          {/* Header */}
          <LinearGradient
            colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                  <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" style={{ marginLeft: -2 }} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <ThemedText type="subtitle" style={styles.title}>Events</ThemedText>
                  <ThemedText style={styles.subtitle}>Manage school events</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setAddModalVisible(true)}
                  disabled={loading || actionLoading}
                >
                  <Feather name="plus" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {renderTab({ 
              key: 'upcoming', 
              label: 'Upcoming', 
              icon: 'calendar-clock',
              iconColor: '#10b981',
              bgColor: '#10b98110'
            })}
            {renderTab({ 
              key: 'past', 
              label: 'Past', 
              icon: 'history',
              iconColor: '#f59e0b',
              bgColor: '#f59e0b10'
            })}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {renderEventList()}
          </View>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <GalleryModal
        visible={galleryModalVisible}
        onClose={() => setGalleryModalVisible(false)}
        currentGroupData={{ pics: selectedEventImages, title: galleryTitle }}
        selectedImageIndex={selectedImageIndex}
        onImageIndexChange={setSelectedImageIndex}
        initialViewMode={initialViewMode}
        headerTitle={galleryTitle || 'Event Gallery'}
      />

      {/* Add Event Modal */}
      <Modal 
        visible={addModalVisible} 
        animationType="slide"
        onRequestClose={() => !actionLoading && setAddModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <ModalHeader 
            title="Create New Event" 
            subtitle="Add details for new school event"
            onClose={() => !actionLoading && setAddModalVisible(false)} 
          />
          {renderEventModalBody(true, newEvent, setNewEvent, handleAddEvent)}
        </View>
      </Modal>

      <Modal 
        visible={editModalVisible} 
        animationType="slide"
        onRequestClose={() => !actionLoading && setEditModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <ModalHeader 
            title="Edit Event" 
            subtitle="Update event details"
            onClose={() => !actionLoading && setEditModalVisible(false)} 
          />
          {renderEventModalBody(false, editEvent, setEditEvent, handleEditEvent)}
        </View>
      </Modal>

      {/* View Event Modal */}
      {renderViewEventModal()}

      {/* Toast Notification */}
      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        position={toast.position}
        onHide={hideToast}
      />
    </>
  )
}