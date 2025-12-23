import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
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
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import GalleryModal from './GalleryModal'
import EventCard from './EventCard'
import EventForm from './EventForm'
import EventDetails from './EventDetails'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import eventApi from '@/api/eventApi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function Events({ visible, onClose }) {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState('today')
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

  // API States
  const [calendarEvents, setCalendarEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Tab configuration
  const tabs = [
    { 
      key: 'today', 
      label: 'Today', 
      icon: 'calendar-today',
      iconColor: '#3B82F6',
      bgColor: '#3B82F610'
    },
    { 
      key: 'upcoming', 
      label: 'Upcoming', 
      icon: 'calendar-clock',
      iconColor: '#10B981',
      bgColor: '#10B98110'
    },
    { 
      key: 'past', 
      label: 'Past', 
      icon: 'history',
      iconColor: '#F59E0B',
      bgColor: '#F59E0B10'
    }
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
      marginHorizontal: 2,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
  }), [colors])

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  // Hide toast notification
  const hideToast = () => {
    setToast(null)
  }

  // Fetch events for current tab from API
  const fetchEventsForTab = async (tabKey) => {
    try {
      setLoading(true)
      let response
      switch (tabKey) {
        case 'today':
          response = await eventApi.getTodaysEvents()
          break
        case 'upcoming':
          response = await eventApi.getUpcomingEvents()
          break
        case 'past':
          response = await eventApi.getPastEvents()
          break
        default:
          response = await eventApi.getAllEvents()
      }
      if (response.success) {
        setCalendarEvents(response.data)
      } else {
        showToast(response.message || 'Failed to load events', 'error')
      }
    } catch (error) {
      console.error('Fetch events error:', error)
      let errorMessage = 'Failed to load events'
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.'
      } else {
        errorMessage = error.message || 'Failed to load events'
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load events when component mounts or tab changes
  useEffect(() => {
    if (visible) {
      setActiveTab('today')
      fetchEventsForTab('today')
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      fetchEventsForTab(activeTab)
    }
  }, [activeTab])

  // Event handlers
  const handleAddEvent = (newEventData, images) => {
    setActionLoading(true)
    eventApi.createEvent(newEventData, images)
      .then(response => {
        if (response.success) {
          showToast('Event created successfully!', 'success')
          fetchEventsForTab(activeTab)
          setAddModalVisible(false)
        } else {
          showToast(response.message || 'Failed to create event', 'error')
        }
      })
      .catch(error => {
        console.error('Create event error:', error)
        let errorMessage = 'Failed to create event'
        
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
        } else if (error.request) {
          errorMessage = 'No response from server. Check your internet connection.'
        } else {
          errorMessage = error.message || 'Failed to create event'
        }
        
        showToast(errorMessage, 'error')
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleEditEvent = (eventId, eventData, newImages, imagesToRemove) => {
    setActionLoading(true)
    eventApi.updateEvent(eventId, eventData, newImages, imagesToRemove)
      .then(response => {
        if (response.success) {
          showToast('Event updated successfully!', 'success')
          fetchEventsForTab(activeTab)
          setEditModalVisible(false)
          setSelectedEvent(null)
        } else {
          showToast(response.message || 'Failed to update event', 'error')
        }
      })
      .catch(error => {
        console.error('Update event error:', error)
        let errorMessage = 'Failed to update event'
        
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
        } else if (error.request) {
          errorMessage = 'No response from server. Check your internet connection.'
        } else {
          errorMessage = error.message || 'Failed to update event'
        }
        
        showToast(errorMessage, 'error')
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleDeleteEvent = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          setActionLoading(true)
          eventApi.deleteEvent(id)
            .then(response => {
              if (response.success) {
                showToast('Event deleted successfully!', 'success')
                fetchEventsForTab(activeTab)
              } else {
                showToast(response.message || 'Failed to delete event', 'error')
              }
            })
            .catch(error => {
              console.error('Delete event error:', error)
              let errorMessage = 'Failed to delete event'
              
              if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred'
              } else if (error.request) {
                errorMessage = 'No response from server. Check your internet connection.'
              } else {
                errorMessage = error.message || 'Failed to delete event'
              }
              
              showToast(errorMessage, 'error')
            })
            .finally(() => {
              setActionLoading(false)
            })
        }
      }
    ])
  }

  const openViewEvent = (event) => {
    if (actionLoading) return
    setSelectedEvent(event)
    setViewModalVisible(true)
  }

  const openEditEvent = (event) => {
    if (actionLoading) return
    setSelectedEvent(event)
    setEditModalVisible(true)
  }

  const openAddEvent = () => {
    if (actionLoading) return
    setAddModalVisible(true)
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

  // Render event list
  const renderEventList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} color={colors.primary} message="Loading events..." />
        </View>
      )
    }

    const emptyMessage = activeTab === 'today' 
      ? 'No events today' 
      : activeTab === 'upcoming' 
        ? 'No upcoming events' 
        : 'No past events'

    if (calendarEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyText, { marginTop: 16 }]}>
            {emptyMessage}
          </ThemedText>
        </View>
      )
    }

    return (
      <FlatList
        data={calendarEvents}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            tab={activeTab}
            onView={openViewEvent}
            onEdit={openEditEvent}
            onDelete={handleDeleteEvent}
            colors={colors}
            weekdayColors={weekdayColors}
            renderImageGrid={renderImageGrid}
            actionLoading={actionLoading}
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => fetchEventsForTab(activeTab)}
      />
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
        onPress={() => {
          if (!actionLoading) {
            setActiveTab(tab.key)
          }
        }}
        disabled={actionLoading}
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

  // Weekday colors (defined here for use in EventCard)
  const weekdayColors = [
    '#FF6B6B', // Sunday
    '#4ECDC4', // Monday
    '#45B7D1', // Tuesday
    '#96CEB4', // Wednesday
    '#f9b82c', // Thursday
    '#FF9FF3', // Friday
    '#54A0FF', // Saturday
  ]

  // Handle close
  const handleClose = () => {
    if (!actionLoading) {
      setGalleryModalVisible(false)
      setAddModalVisible(false)
      setEditModalVisible(false)
      setViewModalVisible(false)
      onClose()
    }
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
                <TouchableOpacity 
                  style={[styles.backButton, actionLoading && { opacity: 0.5 }]} 
                  onPress={handleClose}
                  disabled={actionLoading}
                >
                  <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" style={{ marginLeft: -2 }} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <ThemedText type="subtitle" style={styles.title}>Events</ThemedText>
                  <ThemedText style={styles.subtitle}>Manage school events</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, actionLoading && { opacity: 0.5 }]}
                  onPress={openAddEvent}
                  disabled={actionLoading}
                >
                  <Feather name="plus" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {tabs.map(renderTab)}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {renderEventList()}
          </View>

          {/* Toast Notification - INSIDE the main modal but with absolute positioning */}
          <ToastNotification
            visible={!!toast}
            type={toast?.type}
            message={toast?.message}
            onHide={hideToast}
            position="bottom-center"
            duration={3000}
            showCloseButton={true}
          />
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
      <EventForm
        visible={addModalVisible}
        onClose={() => {
          if (!actionLoading) {
            setAddModalVisible(false)
          }
        }}
        isEdit={false}
        eventData={{}}
        onSubmit={handleAddEvent}
        showToast={showToast}
        colors={colors}
        loading={actionLoading}
      />

      {/* Edit Event Modal */}
      <EventForm
        visible={editModalVisible}
        onClose={() => {
          if (!actionLoading) {
            setEditModalVisible(false)
            setSelectedEvent(null)
          }
        }}
        isEdit={true}
        eventData={selectedEvent}
        onSubmit={handleEditEvent}
        showToast={showToast}
        colors={colors}
        loading={actionLoading}
      />

      {/* View Event Modal */}
      <EventDetails
        visible={viewModalVisible}
        event={selectedEvent}
        onClose={() => setViewModalVisible(false)}
        colors={colors}
        weekdayColors={weekdayColors}
        renderImageGrid={renderImageGrid}
        onGalleryOpen={(images, index, title) => {
          setSelectedEventImages(images)
          setSelectedImageIndex(index)
          setInitialViewMode('grid')
          setGalleryTitle(title)
          setGalleryModalVisible(true)
        }}
      />
    </>
  )
}