import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'

export default function StudentsByBatch({ visible, onClose }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [students, setStudents] = useState([])
  const [batchStatistics, setBatchStatistics] = useState(null)
  const [selectedYear, setSelectedYear] = useState('')
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [dropdownVisible, setDropdownVisible] = useState(false)
  
  // Animations
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0.95)).current

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }

  // Get current academic year
  const getCurrentAcademicYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    // Academic year starts in June
    if (currentMonth >= 6) {
      return `${currentYear}-${currentYear + 1}`
    } else {
      return `${currentYear - 1}-${currentYear}`
    }
  }

  // Generate last 5 years + current academic year
  const generateAcademicYears = () => {
    const currentYear = getCurrentAcademicYear()
    const years = [currentYear]
    
    // Parse the current year to get the starting year
    const startYear = parseInt(currentYear.split('-')[0])
    
    // Generate previous 5 years
    for (let i = 1; i <= 5; i++) {
      const prevStart = startYear - i
      const prevEnd = prevStart + 1
      years.push(`${prevStart}-${prevEnd}`)
    }
    
    return years
  }

  // Fetch students for selected batch
  const fetchBatchStudents = useCallback(async (year = '') => {
    if (!year || year === '') {
      showToast('Please select an academic year', 'info')
      return
    }
    
    setLoading(true)
    try {
      const response = await axiosApi.get(`/students/graduated/batch/${year}`)

      if (response.data.success) {
        setStudents(response.data.data.students || [])
        setBatchStatistics(response.data.data.batch.statistics)
        
        // Animate content fade in
        Animated.parallel([
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnimation, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          })
        ]).start()
        
        if (response.data.data.students?.length === 0) {
          showToast(`No students found for ${year} batch`, 'info')
        }
      } else {
        showToast(response.data.message || 'Failed to fetch students', 'error')
        setStudents([])
        setBatchStatistics(null)
      }
    } catch (error) {
      console.error('Fetch students error:', error)
      let errorMessage = 'Failed to fetch students'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required'
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied'
        } else if (error.response.status === 404) {
          errorMessage = 'No students found for this batch'
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.'
      }
      
      showToast(errorMessage, 'error')
      setStudents([])
      setBatchStatistics(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize selected year to current academic year
  useEffect(() => {
    if (visible && !selectedYear) {
      const currentYear = getCurrentAcademicYear()
      setSelectedYear(currentYear)
    }
  }, [visible, selectedYear])

  const handleGetButtonPress = () => {
    if (selectedYear) {
      fetchBatchStudents(selectedYear)
    } else {
      showToast('Please select an academic year', 'info')
    }
  }

  const handleRefresh = useCallback(async () => {
    if (!selectedYear || students.length === 0) {
      setRefreshing(false)
      return
    }
    setRefreshing(true)
    await fetchBatchStudents(selectedYear)
    setRefreshing(false)
  }, [selectedYear, fetchBatchStudents, students.length])

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return first + last
  }

  const getAvatarColors = (name) => {
    const colorsList = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F39C12', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C'
    ]
    const index = name?.length % colorsList.length || 0
    return colorsList[index]
  }

  const renderStudentItem = useCallback(
    ({ item }) => {
      const initials = getInitials(item.firstName, item.lastName)
      const avatarColor = getAvatarColors(item.name || `${item.firstName || ''}${item.lastName || ''}`)
      
      return (
        <Animated.View 
          style={[
            styles.studentCard, 
            { 
              backgroundColor: colors.cardBackground, 
              borderColor: colors.border,
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          <View style={styles.studentHeader}>
            {/* Avatar with initials */}
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <ThemedText style={styles.avatarText}>{initials || '?'}</ThemedText>
            </View>
            
            {/* Name and Village */}
            <View style={styles.nameVillageContainer}>
              <ThemedText style={styles.studentName} numberOfLines={1}>
                {item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim()}
              </ThemedText>
              
              <View style={styles.villageRow}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <ThemedText style={styles.villageText} numberOfLines={1}>
                  {item.village || 'Village not specified'}
                </ThemedText>
              </View>
            </View>
          </View>
          
          {/* Father Name and Mobile Number - Centered in their containers */}
          <View style={[styles.detailsRow, { borderTopColor: colors.border }]}>
            <View style={styles.detailHalf}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.detailText} numberOfLines={1}>
                {item.parentName || 'N/A'}
              </ThemedText>
            </View>
            
            <View style={styles.detailHalf}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                {item.parentPhone || 'N/A'}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      )
    },
    [colors, fadeAnimation, scaleAnimation]
  )

  const renderStatCard = () => {
    if (!batchStatistics) return null

    return (
      <Animated.View 
        style={[
          styles.statCard, 
          { 
            backgroundColor: colors.cardBackground, 
            borderColor: colors.border,
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }]
          }
        ]}
      >
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={24} color={'#de3e08'} />
            <ThemedText style={styles.statValue}>{batchStatistics.totalStudents}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Students</ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name="male" size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{batchStatistics.maleStudents || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Boys</ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name="female" size={24} color={'#e10fa5'} />
            <ThemedText style={styles.statValue}>{batchStatistics.femaleStudents || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Girls</ThemedText>
          </View>
        </View>
      </Animated.View>
    )
  }

  const renderEmptyComponent = useCallback(() => {
    if (loading) return null

    return (
      <Animated.View 
        style={[
          styles.emptyContainer, 
          styles.emptyContainerCentered,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }]
          }
        ]}
      >
        <Ionicons name="school-outline" size={64} color={colors.primary + '40'} />
        <ThemedText style={styles.emptyTitle}>No Students Found</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          {selectedYear 
            ? `No students found for ${selectedYear} batch.`
            : 'Select a batch and click Get to view graduated students.'}
        </ThemedText>
      </Animated.View>
    )
  }, [loading, colors, selectedYear, fadeAnimation, scaleAnimation])

  const handleClearSearch = useCallback(() => {
    setSelectedYear('')
    setStudents([])
    setBatchStatistics(null)
  }, [])

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible)
  }

  const selectYear = (year) => {
    setSelectedYear(year)
    setDropdownVisible(false)
  }

  // Generate years for dropdown (last 5 + current)
  const dropdownYears = generateAcademicYears()

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background 
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
      justifyContent: 'space-between' 
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
      fontFamily: 'Poppins-SemiBold',
    },
    subtitle: { 
      marginTop: 4, 
      fontSize: 11, 
      fontFamily: 'Poppins-Medium',
      color: 'rgba(255,255,255,0.9)' 
    },
    yearSelectorContainer: { 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border,
      position: 'relative',
      zIndex: 1000,
    },
    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    yearSelectorButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.inputBackground,
      borderColor: colors.primary + '40',
    },
    getButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    getButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    yearSelectorText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    chooseBatchText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginTop: 8,
      marginLeft: 4,
    },
    dropdownMenu: {
      position: 'absolute',
      top: 70,
      left: 16,
      right: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 300,
      zIndex: 2000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    dropdownItemActive: {
      backgroundColor: colors.primary + '10',
    },
    dropdownItemActiveText: {
      color: colors.primary,
      fontFamily: 'Poppins-SemiBold',
    },
    statCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    statValue: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      marginTop: 4,
    },
    statLabel: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginTop: 2,
    },
    studentCard: {
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 12,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 0.5,
        },
      }),
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
    },
    nameVillageContainer: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 4,
    },
    villageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    villageText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      flex: 1,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      gap: 12,
    },
    detailHalf: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    detailText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    emptyContainer: {
      paddingHorizontal: 20,
    },
    emptyContainerCentered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 24,
      color: colors.textSecondary,
    },
  })

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.backButton}
                onPress={() => {
                  handleClearSearch()
                  onClose()
                }}
              >
                <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Graduated Students</ThemedText>
                <ThemedText style={styles.subtitle}>Students who completed 10th class</ThemedText>
              </View>

              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Academic Year Dropdown with Get Button */}
        <View style={styles.yearSelectorContainer}>
          <View style={styles.selectorRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.yearSelectorButton}
              onPress={toggleDropdown}
            >
              <ThemedText style={styles.yearSelectorText}>
                {selectedYear || 'Select Academic Year'}
              </ThemedText>
              <Feather name={dropdownVisible ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.getButton}
              onPress={handleGetButtonPress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="search" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.getButtonText}>Get</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.chooseBatchText}>
            ↓ Choose a batch and click Get to view graduated students
          </ThemedText>

          {dropdownVisible && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {dropdownYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.dropdownItem, selectedYear === year && styles.dropdownItemActive]}
                    onPress={() => selectYear(year)}
                  >
                    <ThemedText style={[styles.dropdownItemText, selectedYear === year && styles.dropdownItemActiveText]}>
                      {year}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Statistics Card - Three separate stats */}
        {batchStatistics && renderStatCard()}

        {/* Students List */}
        <FlatList
          data={students}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            students.length > 0 ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 12,
            paddingBottom: 80,
          }}
          ListEmptyComponent={renderEmptyComponent}
        />
      </View>

      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        duration={3000}
        onHide={hideToast}
        position="top-center"
      />
    </Modal>
  )
}