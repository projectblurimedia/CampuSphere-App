import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import * as DocumentPicker from 'expo-document-picker'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const Timetable = ({ visible, onClose }) => {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)

  // Filters
  const [selectedClass, setSelectedClass] = useState({ value: null, name: 'Select Class' })
  const [selectedSection, setSelectedSection] = useState({ value: null, name: 'Select Section' })

  // Dropdown states
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [showSectionDropdown, setShowSectionDropdown] = useState(false)

  // Data
  const [classes, setClasses] = useState([{ value: null, name: 'Select Class' }])
  const [sections, setSections] = useState([{ value: null, name: 'Select Section' }])
  const [timetable, setTimetable] = useState([])
  const [timeSlots, setTimeSlots] = useState([])

  useEffect(() => {
    if (visible) {
      fetchClasses()
      setSelectedClass({ value: null, name: 'Select Class' })
      setSelectedSection({ value: null, name: 'Select Section' })
    }
  }, [visible])

  useEffect(() => {
    if (selectedClass.value) {
      fetchSections()
    } else {
      setSections([{ value: null, name: 'Select Section' }])
      setSelectedSection({ value: null, name: 'Select Section' })
    }
  }, [selectedClass.value])

  useEffect(() => {
    if (selectedClass.value && selectedSection.value) {
      fetchTimetable()
    } else {
      setTimetable([])
      setTimeSlots([])
    }
  }, [selectedClass.value, selectedSection.value])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/timetable/classes')
      setClasses([
        { value: null, name: 'Select Class' },
        ...response.data.map(cls => ({ value: cls, name: cls }))
      ])
    } catch (error) {
      console.error('Error fetching classes:', error)
      setToast({
        type: 'error',
        message: 'Failed to fetch classes'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/timetable/sections', {
        params: { class: selectedClass.value }
      })
      setSections([
        { value: null, name: 'Select Section' },
        ...response.data.map(sec => ({ value: sec, name: sec }))
      ])
      setSelectedSection({ value: null, name: 'Select Section' })
    } catch (error) {
      console.error('Error fetching sections:', error)
      setToast({
        type: 'error',
        message: 'Failed to fetch sections'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/timetable', {
        params: {
          class: selectedClass.value,
          section: selectedSection.value
        }
      })
      const data = response.data || []
      setTimetable(data)
      
      // Extract unique time slots from timetable
      if (data.length > 0) {
        const slots = []
        data.forEach(day => {
          day.slots.forEach(slot => {
            if (!slots.includes(slot.timings)) {
              slots.push(slot.timings)
            }
          })
        })
        setTimeSlots(slots.sort((a, b) => {
          // Simple time sorting - you might want to improve this based on your time format
          return a.localeCompare(b)
        }))
      }
    } catch (error) {
      console.error('Error fetching timetable:', error)
      setTimetable([])
      setTimeSlots([])
      setToast({
        type: 'error',
        message: 'Failed to fetch timetable'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    try {
      setUploading(true)
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        const formData = new FormData()
        formData.append('excelFile', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType
        })
        const response = await axiosApi.post('/timetable/bulk-import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (response.data.success) {
          setToast({
            type: 'success',
            message: response.data.message
          })
          // Refresh classes after upload
          fetchClasses()
        } else {
          setToast({
            type: 'error',
            message: response.data.message
          })
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      setToast({
        type: 'error',
        message: 'Failed to upload timetable'
      })
    } finally {
      setUploading(false)
    }
  }

  const getSubjectForDayAndTime = (day, time) => {
    const dayData = timetable.find(d => d.day === day)
    if (!dayData) return null
    
    const slot = dayData.slots.find(s => s.timings === time)
    return slot || null
  }

  // Check if a time slot is a break for all days
  const isBreakTimeSlot = (time) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    for (const day of days) {
      const subject = getSubjectForDayAndTime(day, time)
      // If any day has a subject that's not a break, then this time slot is not a break
      if (subject && subject.type && subject.type.toLowerCase() !== 'break') {
        return false
      }
      // If any day has no subject (null), then it's not consistently a break
      if (!subject) {
        return false
      }
    }
    
    // Check if at least one day has a break
    for (const day of days) {
      const subject = getSubjectForDayAndTime(day, time)
      if (subject && subject.type && subject.type.toLowerCase() === 'break') {
        return true
      }
    }
    
    return false
  }

  const renderFilterButton = ({ icon, label, onPress, disabled = false, customStyle = {} }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: colors.cardBackground },
        disabled && { opacity: 0.5 },
        customStyle
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.filterButtonContent}>
        <MaterialIcons name={icon} size={18} color={disabled ? colors.textSecondary : colors.text} />
        <ThemedText style={[
          styles.filterButtonText,
          { color: disabled ? colors.textSecondary : colors.text }
        ]}>
          {label}
        </ThemedText>
      </View>
      <Feather name="chevron-down" size={16} color={disabled ? colors.textSecondary : colors.text} />
    </TouchableOpacity>
  )

  const renderDropdown = (items, selectedValue, onSelect, visible, onClose, title) => (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.dropdownOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={[styles.dropdownContainer, { borderRadius: 24 }]}
        >
          <View style={[styles.dropdownHeader, { borderBottomColor: 'rgba(255,255,255,0.3)' }]}>
            <ThemedText type="subtitle" style={[styles.dropdownTitle, { color: '#FFFFFF' }]}>
              {title}
            </ThemedText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
         
          <ScrollView style={styles.dropdownList}>
            {items.map((item) => {
              const isSelected = selectedValue === item.value
              return (
                <TouchableOpacity
                  key={item.value || 'null'}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: 'rgba(255,255,255,0.1)' },
                    isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                  ]}
                  onPress={() => {
                    onSelect({ value: item.value, name: item.name })
                    onClose()
                  }}
                >
                  <View style={styles.dropdownItemLeft}>
                    <ThemedText style={[
                      styles.dropdownItemText,
                      { color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' }
                    ]}>
                      {item.name}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <View style={[styles.dropdownCheck, { backgroundColor: '#FFFFFF' }]}>
                      <Feather name="check" size={14} color="#5053ee" />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  )

  const renderTimetableTable = () => {
    // Define the days in order
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.tableScrollView}
        contentContainerStyle={styles.tableContentContainer}
      >
        <View style={styles.tableContainer}>
          {/* Table Header - Time Slots */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.dayTimeCell, styles.headerCell]}>
              <ThemedText style={[styles.headerText, { color: '#5053ee' }]}>
                Day/Time
              </ThemedText>
            </View>
            {timeSlots.map((time, index) => {
              const isBreak = isBreakTimeSlot(time)
              
              return (
                <View 
                  key={`time-${index}`} 
                  style={[
                    styles.timeHeaderCell, 
                    styles.headerCell,
                    isBreak && styles.breakHeaderCell
                  ]}
                >
                  {isBreak ? (
                    <ThemedText 
                      style={[styles.breakText, { color: '#FFFFFF' }]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      BREAK
                    </ThemedText>
                  ) : (
                    <ThemedText 
                      style={[styles.headerText, { color: '#FFFFFF' }]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {time}
                    </ThemedText>
                  )}
                </View>
              )
            })}
          </View>
          
          {/* Table Rows - Days */}
          {days.map((day, dayIndex) => {
            const dayData = timetable.find(d => d.day === day)
            
            return (
              <View 
                key={day} 
                style={[
                  styles.tableRow,
                  { minHeight: 90 },
                  dayIndex % 2 === 0 && { backgroundColor: 'rgba(80, 83, 238, 0.05)' }
                ]}
              >
                {/* Day Cell - First Column */}
                <View style={[styles.dayTimeCell, styles.dayCell]}>
                  <ThemedText 
                    style={[styles.dayText, { color: colors.text }]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    {day}
                  </ThemedText>
                </View>
                
                {/* Subject Cells for each time slot */}
                {timeSlots.map((time, timeIndex) => {
                  const subject = getSubjectForDayAndTime(day, time)
                  const isBreak = isBreakTimeSlot(time)
                  
                  return (
                    <View 
                      key={`${day}-${time}`} 
                      style={[
                        styles.timeCell,
                        styles.subjectCell,
                        isBreak && styles.breakCell,
                        { 
                          borderLeftWidth: timeIndex === 0 ? 1 : 0,
                          borderLeftColor: colors.border 
                        }
                      ]}
                    >
                      {isBreak ? (
                        <View style={styles.breakContainer}>
                          <ThemedText 
                            style={[styles.breakBigText, { color: '#dc2626' }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            BREAK
                          </ThemedText>
                        </View>
                      ) : subject ? (
                        <View style={styles.subjectContainer}>
                          <ThemedText 
                            style={[styles.subjectName, { color: colors.text }]}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {subject.name}
                          </ThemedText>
                          {subject.staffName && (
                            <ThemedText 
                              style={[styles.teacherName, { color: colors.primary }]}
                              numberOfLines={2}
                              adjustsFontSizeToFit
                              minimumFontScale={0.7}
                            >
                              {subject.staffName}
                            </ThemedText>
                          )}
                          {subject.type && subject.type !== 'period' && subject.type.toLowerCase() !== 'break' && (
                            <ThemedText 
                              style={[styles.slotType, { color: colors.textSecondary }]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.6}
                            >
                              ({subject.type})
                            </ThemedText>
                          )}
                        </View>
                      ) : (
                        <View style={styles.emptyCell}>
                          <ThemedText style={[styles.emptyCellText, { color: colors.textSecondary }]}>
                            -
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
      </ScrollView>
    )
  }

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 55,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
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
      fontFamily: 'Poppins-Bold',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
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
    filtersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    filterButton: {
      width: (SCREEN_WIDTH - 52) / 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    filterButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterButtonText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    timetableHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    timetableTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    tableScrollView: {
      flex: 1,
    },
    tableContentContainer: {
      paddingBottom: 20,
    },
    tableContainer: {
      minWidth: Math.max(SCREEN_WIDTH - 40, 120 + (timeSlots.length * 140)),
    },
    tableRow: {
      flexDirection: 'row',
      minHeight: 90,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableHeader: {
      backgroundColor: '#5053ee',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    headerCell: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRightWidth: 1,
      borderRightColor: 'rgba(255, 255, 255, 0.3)',
    },
    breakHeaderCell: {
      backgroundColor: '#ef4444', // Red background for break headers
    },
    headerText: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
    },
    breakText: {
      fontSize: 14,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
    },
    dayTimeCell: {
      width: 120,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.cardBackground,
      borderRightWidth: 2,
      borderRightColor: colors.border,
    },
    dayCell: {
      backgroundColor: colors.cardBackground,
    },
    dayText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
    },
    timeHeaderCell: {
      width: 140, // Increased width for time columns
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 8,
    },
    timeCell: {
      width: 140, // Increased width for subject cells
      padding: 6,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    subjectCell: {
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
    },
    breakCell: {
      backgroundColor: '#fef2f2', // Light red background for break cells
      borderRightColor: '#fecaca',
    },
    subjectContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 4,
    },
    breakContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fef2f2',
      borderRadius: 6,
      padding: 4,
    },
    subjectName: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      marginBottom: 3,
    },
    teacherName: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 2,
    },
    slotType: {
      fontSize: 10,
      fontFamily: 'Poppins-Regular',
      textAlign: 'center',
    },
    breakBigText: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
      fontWeight: '900',
    },
    emptyCell: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyCellText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      fontFamily: 'Poppins-Medium',
    },
    dropdownOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownContainer: {
      width: SCREEN_WIDTH * 0.85,
      maxHeight: SCREEN_WIDTH * 0.8,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 0.5,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
    },
    dropdownTitle: {
      fontSize: 17,
    },
    closeButton: {
      height: 30,
      width: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownList: {
      maxHeight: SCREEN_WIDTH * 0.8,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    dropdownItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    dropdownItemText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      flex: 1,
    },
    dropdownCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [colors, timeSlots.length])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#5053ee', '#7346e5']}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>Timetable</ThemedText>
              <ThemedText style={styles.subtitle}>Class schedules</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleUpload}
              disabled={uploading}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={{ marginTop: 16, color: colors.textSecondary }}>
                Loading timetable data...
              </ThemedText>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.filtersContainer}>
                {renderFilterButton({
                  icon: 'school',
                  label: selectedClass.name,
                  onPress: () => setShowClassDropdown(true)
                })}
                {renderFilterButton({
                  icon: 'group',
                  label: selectedSection.name,
                  onPress: () => setShowSectionDropdown(true),
                  disabled: !selectedClass.value
                })}
              </View>
              <View style={styles.timetableHeader}>
                <ThemedText style={styles.timetableTitle}>
                  Class Schedule
                </ThemedText>
              </View>
              {timetable.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="calendar" size={48} color={colors.textSecondary} />
                  <ThemedText style={styles.emptyText}>
                    No timetable found for selected class and section
                  </ThemedText>
                </View>
              ) : (
                renderTimetableTable()
              )}
            </View>
          )}
        </View>
        {/* Class Dropdown */}
        {renderDropdown(
          classes,
          selectedClass.value,
          setSelectedClass,
          showClassDropdown,
          () => setShowClassDropdown(false),
          'Select Class'
        )}
        {/* Section Dropdown */}
        {renderDropdown(
          sections,
          selectedSection.value,
          setSelectedSection,
          showSectionDropdown,
          () => setShowSectionDropdown(false),
          'Select Section'
        )}
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

export default Timetable