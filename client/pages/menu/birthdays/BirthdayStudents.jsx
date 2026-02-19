import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  Ionicons,
  FontAwesome6,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

// Birthday Card Component
const BirthdayCard = ({ student }) => {
  const { colors } = useTheme()
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getAge = (dob) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCardGradient = () => {
    if (student.gender === 'FEMALE') {
      return ['#fce7f3', '#fbcfe8'] 
    } else if (student.gender === 'MALE') {
      return ['#edf9ff', '#b3dbfe'] 
    } else {
      return ['#f3e8ff', '#e9d5ff'] 
    }
  }

  // Determine text color based on gender
  const getTextColor = () => {
    if (student.gender === 'FEMALE') {
      return '#9d174d' // Dark pink
    } else if (student.gender === 'MALE') {
      return '#1e40af' // Dark blue
    } else {
      return '#6b21a8' // Dark purple
    }
  }

  // Determine badge color based on gender
  const getBadgeColor = () => {
    if (student.gender === 'FEMALE') {
      return '#ec4899' 
    } else if (student.gender === 'MALE') {
      return '#3ba5f6' 
    } else {
      return '#a855f7' 
    }
  }

  const textColor = getTextColor()
  const badgeColor = getBadgeColor()
  const cardGradient = getCardGradient()

  const styles = StyleSheet.create({
    birthdayCard: {
      marginBottom: 12,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    birthdayCardGradient: {
      borderRadius: 16,
    },
    birthdayCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    birthdayLeftSection: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    profilePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: badgeColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    profileInitials: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      color: '#FFFFFF',
    },
    birthdayInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: textColor,
      marginBottom: 4,
    },
    classBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.4)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    classText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      color: textColor,
      marginLeft: 4,
    },
    birthdayRightSection: {
      alignItems: 'flex-end',
    },
    ageBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: badgeColor,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 4,
    },
    ageText: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
      marginLeft: 4,
    },
    dobText: {
      fontSize: 10,
      color: textColor,
      fontFamily: 'Poppins-Medium',
    },
  })

  return (
    <View style={styles.birthdayCard}>
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.birthdayCardGradient}
      >
        <View style={styles.birthdayCardContent}>
          <View style={styles.birthdayLeftSection}>
            <View style={styles.profilePlaceholder}>
              <ThemedText style={styles.profileInitials}>
                {getInitials(student.name)}
              </ThemedText>
            </View>
            
            <View style={styles.birthdayInfo}>
              <ThemedText style={styles.studentName}>{student.name}</ThemedText>
              <View style={styles.classBadge}>
                <Ionicons name="school-outline" size={12} color={textColor} />
                <ThemedText style={styles.classText}>
                  {student.displayClass} - {student.section}
                </ThemedText>
              </View>
            </View>
          </View>
          
          <View style={styles.birthdayRightSection}>
            <View style={styles.ageBadge}>
              <FontAwesome6 name="cake-candles" size={16} color="#FFFFFF" />
              <ThemedText style={styles.ageText}>
                {getAge(student.dob)} yrs
              </ThemedText>
            </View>
            <ThemedText style={styles.dobText}>
              {formatDate(student.dob)}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

export default function BirthdayStudents({ visible, onClose }) {
  const { colors } = useTheme()
  
  const [birthdayStudents, setBirthdayStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    date: '',
  })

  // Toast notification functions
  const showToast = (message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }

  const hideToast = () => {
    setToast(null)
  }

  // Fetch birthday students
  const fetchBirthdayStudents = useCallback(async () => {
    if (!visible) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await axiosApi.get('/students/birthdays')

      if (response.data.success) {
        setBirthdayStudents(response.data.data || [])
        setStats({
          total: response.data.count || 0,
          date: response.data.date || new Date().toLocaleDateString(),
        })
      } else {
        throw new Error(response.data.message || 'Failed to fetch birthday students')
      }
    } catch (err) {
      console.error('Error fetching birthday students:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Network error. Please try again.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [visible])

  // Initial fetch
  useEffect(() => {
    if (visible) {
      fetchBirthdayStudents()
    }
  }, [visible])

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchBirthdayStudents()
  }, [fetchBirthdayStudents])

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
    headerTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
    },
    headerSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 2,
    },
    statsCard: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
      padding: 20,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    statsLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    statsInfo: {
      justifyContent: 'center',
    },
    statsLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    statsValue: {
      fontSize: 28,
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    statsRightSection: {
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 30,
    },
    statsDate: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: 'Poppins-Medium',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 0,
      paddingBottom: 40,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 14,
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    errorText: {
      textAlign: 'center',
      color: '#dc2626',
      marginTop: 12,
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
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
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <LinearGradient
          colors={['#ec4899', '#d946ef']} 
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.headerTitle}>Birthday Celebrations</ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                  Today's Celebrations
                </ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsLeftSection}>
            <View style={styles.statsIconContainer}>
              <Ionicons name="gift" size={24} color={colors.primary} />
            </View>
            <View style={styles.statsInfo}>
              <ThemedText style={styles.statsLabel}>Total Birthdays</ThemedText>
              <ThemedText style={styles.statsValue}>{stats.total}</ThemedText>
            </View>
          </View>
          <View style={styles.statsRightSection}>
            <ThemedText style={styles.statsDate}>{stats.date}</ThemedText>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={true}
        >
          {isLoading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                Checking for birthday students...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-triangle" size={50} color="#dc2626" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : birthdayStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="gift-outline" size={70} color={colors.textSecondary} />
              </View>
              <ThemedText style={styles.emptyTitle}>No Birthdays Today</ThemedText>
              <ThemedText style={styles.emptyMessage}>
                No students are celebrating their birthday today. Check back tomorrow!
              </ThemedText>
            </View>
          ) : (
            birthdayStudents.map((student) => (
              <BirthdayCard
                key={student.id}
                student={student}
              />
            ))
          )}
        </ScrollView>

        {/* Toast Notification */}
        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={hideToast}
          position="bottom-center"
          duration={toast?.duration || 3000}
          showCloseButton={true}
        />
      </View>
    </Modal>
  )
}