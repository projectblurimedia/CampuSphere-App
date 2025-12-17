import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { ThemedInput } from '@/components/ui/themed-input'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  FontAwesome5,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome6,
  MaterialIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function Calendar({ visible, onClose }) {
  const { colors } = useTheme()
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', date: new Date(), description: '' })
  const [editEvent, setEditEvent] = useState({ title: '', date: new Date(), description: '' })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerType, setDatePickerType] = useState('add') // 'add' or 'edit'

  // Static events for December 2025
  const [events, setEvents] = useState([
    { id: 1, title: 'Winter Holiday Starts', date: '2025-12-20', description: 'School closed for holidays' },
    { id: 2, title: 'Staff Meeting', date: '2025-12-17', description: 'Admin staff meeting at 3 PM' },
    { id: 3, title: 'Sports Day', date: '2025-12-15', description: 'Annual sports event' },
    { id: 4, title: 'Parent-Teacher Meeting', date: '2025-12-10', description: 'PTM for all classes' },
    { id: 5, title: 'Christmas Celebration', date: '2025-12-25', description: 'School celebration' },
  ])

  const currentDate = new Date('2025-12-17') // Given current date

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

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.description) {
      const eventDate = new Date(newEvent.date)
      if (eventDate <= currentDate) {
        Alert.alert('Error', 'Event date must be in the future')
        return
      }
      setEvents([...events, { id: Date.now(), ...newEvent, date: eventDate.toISOString().split('T')[0] }])
      setNewEvent({ title: '', date: new Date(), description: '' })
      setAddModalVisible(false)
      Alert.alert('Success', 'Event added successfully!')
    } else {
      Alert.alert('Error', 'Please fill all fields')
    }
  }

  const handleEditEvent = () => {
    if (editEvent.title && editEvent.description) {
      const eventDate = new Date(editEvent.date)
      if (eventDate <= currentDate) {
        Alert.alert('Error', 'Event date must be in the future')
        return
      }
      setEvents(events.map(e => e.id === selectedEvent.id ? { ...editEvent, id: selectedEvent.id, date: eventDate.toISOString().split('T')[0] } : e))
      setEditModalVisible(false)
      setSelectedEvent(null)
      Alert.alert('Success', 'Event updated successfully!')
    } else {
      Alert.alert('Error', 'Please fill all fields')
    }
  }

  const handleDeleteEvent = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: () => {
        setEvents(events.filter(e => e.id !== id))
        Alert.alert('Success', 'Event deleted successfully!')
      }}
    ])
  }

  const openEdit = (event) => {
    const eventDate = new Date(event.date)
    setSelectedEvent(event)
    setEditEvent({ title: event.title, date: eventDate, description: event.description })
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

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate > currentDate
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate <= currentDate
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const renderEvent = (event, section) => {
    const eventDate = new Date(event.date)
    const isPast = eventDate <= currentDate
    const dayIndex = eventDate.getDay()
    const borderColor = weekdayColors[dayIndex]
    const statusColor = isPast ? '#9CA3AF' : '#10B981'
    return (
      <View key={event.id} style={[styles.eventCard, { borderLeftColor: borderColor, opacity: isPast ? 0.7 : 1 }]}>
        <View style={styles.eventTop}>
          <View style={styles.eventTitleContainer}>
            <ThemedText style={[styles.eventTitle, { color: isPast ? colors.textSecondary : colors.text }]} type='subtitle'>{event.title}</ThemedText>
            <LinearGradient
              colors={[weekdayColors[dayIndex] + '20', weekdayColors[dayIndex] + '20']}
              style={styles.dateBadge}
            >
              <ThemedText type='subtitle' style={[styles.dateBadgeText, { color: weekdayColors[dayIndex] }]}>{event.date}</ThemedText>
            </LinearGradient>
          </View>
          <ThemedText style={[styles.eventDesc, { color: isPast ? colors.textSecondary : colors.text }]} numberOfLines={2}>{event.description}</ThemedText>
        </View>
        <View style={styles.eventBottom}>
          <View style={[styles.eventStatusBadge, { backgroundColor: isPast ? '#F9FAFB' : '#ECFDF5', borderColor: statusColor }]}>
            <ThemedText style={[styles.eventStatus, { color: statusColor }]}>{isPast ? 'Completed' : 'Upcoming'}</ThemedText>
          </View>
          {!isPast && (
            <View style={styles.eventActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editAction]}
                onPress={() => openEdit(event)}
              >
                <Feather name="edit-2" size={14} color="#FFFFFF" />
                <ThemedText style={styles.actionText}>Edit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteAction]}
                onPress={() => handleDeleteEvent(event.id)}
              >
                <Feather name="trash-2" size={14} color="#FFFFFF" />
                <ThemedText style={styles.actionText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 15,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtnAndTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 45,
      height: 45,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary + '20',
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    eventCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    eventTop: {
      marginBottom: 12,
    },
    eventTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    eventTitle: {
      fontSize: 16,
      flex: 1,
      marginRight: 8,
    },
    dateBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    dateBadgeText: {
      fontSize: 12,
    },
    eventDesc: {
      fontSize: 14,
      lineHeight: 20,
    },
    eventBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    eventStatus: {
      fontSize: 12,
    },
    eventActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
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
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 0,
      width: SCREEN_WIDTH * 0.9,
      maxHeight: '85%',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    modalHeader: {
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    modalTitle: {
      fontSize: 18,
      color: colors.primary,
    },
    closeModalBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.border,
    },
    modalBody: {
      padding: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
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
      color: colors.textSecondary,
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
    datePickerBtn: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 8,
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
      textAlignVertical: 'top',
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    saveBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
  })

  const renderSection = (title, eventList) => (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons
            name={title === 'Upcoming Events' ? 'event' : 'history'} 
            size={20} 
            color={colors.primary} 
          />
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        </View>
        <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>
          {eventList.length} {title.toLowerCase()}
        </ThemedText>
      </View>
      <ScrollView nestedScrollEnabled>
        {eventList.map(event => renderEvent(event, title))}
      </ScrollView>
      {eventList.length === 0 && (
        <ThemedText style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
          No {title.toLowerCase()} events
        </ThemedText>
      )}
    </View>
  )

  const ModalHeader = ({ title, onClose }) => (
    <View style={styles.modalHeader}>
      <View style={styles.modalTitleContainer}>
        <MaterialCommunityIcons name="calendar-plus" size={28} color={colors.primary} />
        <ThemedText type='subtitle' style={styles.modalTitle}>{title}</ThemedText>
      </View>
      <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
        <Ionicons name="close" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  )

  const renderModalBody = (isAdd, eventData, setEventData, handleSubmit) => (
    <View style={styles.modalBody}>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Event Date</ThemedText>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            setDatePickerType(isAdd ? 'add' : 'edit')
            setShowDatePicker(true)
          }}
        >
          <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
          <ThemedText style={styles.dateText}>
            {eventData.date.toDateString()}
          </ThemedText>
          <View style={styles.datePickerBtn}>
            <Feather name="chevron-down" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        {showDatePicker && ((isAdd && datePickerType === 'add') || (!isAdd && datePickerType === 'edit')) && (
          <DateTimePicker
            value={eventData.date}
            mode="date"
            display="default"
            minimumDate={currentDate}
            onChange={onDateChange}
          />
        )}
      </View>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Event Title</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="file-text" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <ThemedInput
            style={[styles.input]}
            placeholder="Enter event title"
            value={eventData.title}
            onChangeText={(text) => setEventData({ ...eventData, title: text })}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Description</ThemedText>
        <View style={styles.inputWrapper}>
          <Feather name="align-left" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <ThemedInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter event description"
            multiline
            numberOfLines={4}
            value={eventData.description}
            onChangeText={(text) => setEventData({ ...eventData, description: text })}
          />
        </View>
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
        <ThemedText style={styles.saveBtnText}>{isAdd ? 'Save Event' : 'Update Event'}</ThemedText>
      </TouchableOpacity>
    </View>
  )

  return (
    <>
      <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <View style={styles.backBtnAndTitleContainer}>
                  <TouchableOpacity style={styles.backButton} onPress={onClose}>
                    <FontAwesome5 name="chevron-left" size={22} color="#FFFFFF" style={{ marginLeft: -2 }} />
                  </TouchableOpacity>
                  <ThemedText style={styles.title}>School Calendar</ThemedText>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.addButtonText}>Add Event</ThemedText>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {renderSection('Upcoming Events', upcomingEvents)}
            {renderSection('Past Events', pastEvents)}
          </ScrollView>
        </View>
      </Modal>

      <Modal 
        visible={addModalVisible} 
        transparent 
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setAddModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <ModalHeader title="Add New Event" onClose={() => setAddModalVisible(false)} />
              {renderModalBody(true, newEvent, setNewEvent, handleAddEvent)}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal 
        visible={editModalVisible} 
        transparent 
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <ModalHeader title="Edit Event" onClose={() => setEditModalVisible(false)} />
              {renderModalBody(false, editEvent, setEditEvent, handleEditEvent)}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}