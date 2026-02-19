import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  Keyboard,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  Ionicons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import StudentCard from '@/components/students/student-card'
import StudentAttendance from '@/pages/student/StudentAttendance'
import { useDebounce } from '@/utils/useDebounce'

export default function StudentsAttendanceStats({ visible, onClose }) {
  const { colors } = useTheme()
  const scrollViewRef = useRef(null)
  const searchInputRef = useRef(null)
  
  const [stats, setStats] = useState(null)
  const [schoolSummary, setSchoolSummary] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // Student Attendance Modal state
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentAttendance, setShowStudentAttendance] = useState(false)

  // Toast functions
  const showToast = (message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }

  const hideToast = () => {
    setToast(null)
  }

  // Fetch attendance statistics
  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const response = await axiosApi.get('/students/attendance-stats')

      if (response.data.success) {
        setStats(response.data.data?.classes || [])
        setSchoolSummary(response.data.data?.schoolSummary || null)
        setDateRange(response.data.data?.dateRange || null)
      } else {
        throw new Error(response.data.message || 'Failed to fetch statistics')
      }
    } catch (err) {
      console.error('Error fetching attendance stats:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load statistics'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      if (showLoading) setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Search students function
  const searchStudents = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setSearchLoading(true)
    setIsSearching(true)
    
    try {
      const response = await axiosApi.get('/students/quick-search', {
        params: { query, limit: 50 }
      })
      
      if (response.data.success) {
        setSearchResults(response.data.data)
      }
    } catch (err) {
      console.error('Search error:', err)
      showToast('Failed to search students', 'error')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchStudents(debouncedSearchQuery)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, searchStudents])

  // Initial load
  useEffect(() => {
    if (visible) {
      fetchStats()
      setSearchQuery('')
      setSelectedStudent(null)
    }
  }, [visible, fetchStats])

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    if (searchQuery.trim()) {
      setSearchQuery('')
      setSearchResults([])
      setIsSearching(false)
    } else {
      fetchStats(false)
    }
  }, [searchQuery, fetchStats])

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    searchInputRef.current?.focus()
  }, [])

  // Handle scroll view touch to dismiss keyboard
  const handleScrollViewTouch = useCallback(() => {
    if (!isSearchFocused) {
      Keyboard.dismiss()
    }
  }, [isSearchFocused])

  // Handle student press - Open StudentAttendance Modal
  const handleStudentPress = (student) => {
    setSelectedStudent(student)
    setShowStudentAttendance(true)
  }

  // Handle close student modal
  const handleCloseStudentModal = () => {
    setShowStudentAttendance(false)
    setSelectedStudent(null)
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get result text for search count
  const getResultText = (count) => {
    return count === 1 ? 'student' : 'students'
  }

  // Overall Stat Card Component
  const OverallStatCard = ({ title, value, icon, color }) => (
    <View style={[styles.overallCard, { borderLeftColor: color }]}>
      <View style={styles.overallCardHeader}>
        <View style={[styles.overallIconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <ThemedText style={styles.overallCardValue}>{value}</ThemedText>
      </View>
      <ThemedText style={styles.overallCardTitle}>{title}</ThemedText>
    </View>
  )

  // Class-Section Card Component
  const ClassSectionCard = ({ data }) => {
    const getAttendanceColor = (percentage) => {
      const percent = parseFloat(percentage)
      if (percent >= 90) return '#10b981'
      if (percent >= 75) return '#3b82f6'
      if (percent >= 60) return '#f59e0b'
      return '#ef4444'
    }

    const attendanceColor = getAttendanceColor(data.summary.overallAttendancePercentage)

    return (
      <View style={styles.classSectionCard}>
        <View style={styles.classSectionHeader}>
          <View style={styles.classSectionTitleContainer}>
            <View style={[styles.classBadge, { backgroundColor: colors.primary + '20' }]}>
              <ThemedText style={[styles.classText, { color: colors.primary }]}>
                {data.classLabel}
              </ThemedText>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: colors.inputBackground }]}>
              <ThemedText style={styles.sectionText}>Section {data.section}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.percentageContainer}>
          <View style={styles.percentageHeader}>
            <ThemedText style={styles.percentageLabel}>Attendance Rate</ThemedText>
            <ThemedText style={[styles.percentageValue, { color: attendanceColor }]}>
              {data.summary.overallAttendancePercentage}%
            </ThemedText>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: `${Math.min(100, parseFloat(data.summary.overallAttendancePercentage))}%`,
                  backgroundColor: attendanceColor
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Present</ThemedText>
            <ThemedText style={[styles.statValue, { color: '#10b981' }]}>{data.summary.totalPresent}</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Absent</ThemedText>
            <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>{data.summary.totalAbsent}</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>{data.summary.totalAttendanceRecords}</ThemedText>
          </View>
        </View>

        {data.summary.studentsWithAttendance === 0 && (
          <View style={styles.noDataBadge}>
            <Feather name="info" size={12} color="#f59e0b" />
            <ThemedText style={styles.noDataText}>No attendance data entered</ThemedText>
          </View>
        )}
      </View>
    )
  }

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
      zIndex: 10,
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
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 2,
    },
    // Search bar styles
    searchContainer: {
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      paddingHorizontal: 14,
      borderRadius: 24,
      borderWidth: 1,
      backgroundColor: colors.cardBackground,
      borderColor: isSearchFocused ? colors.primary : colors.border,
      borderWidth: isSearchFocused ? 2 : 1,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      paddingHorizontal: 0,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.text,
    },
    clearButton: {
      padding: 4,
      marginLeft: 6,
    },
    searchInfoText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginHorizontal: 20,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    dateRangeCard: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    dateRangeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dateRangeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dateRangeInfo: {
      justifyContent: 'center',
    },
    dateRangeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    dateRangeValue: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: 'Poppins-SemiBold',
    },
    dateRangeBadge: {
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    dateRangeBadgeText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: 'Poppins-SemiBold',
    },
    schoolSummarySection: {
      marginBottom: 10,
    },
    overallCardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    overallCard: {
      width: '48%',
      backgroundColor: colors.cardBackground,
      borderRadius: 6,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    overallCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    overallIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overallCardValue: {
      fontSize: 22,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
    },
    overallCardTitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 8,
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
    classSectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    classSectionHeader: {
      marginBottom: 12,
    },
    classSectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    classBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    classText: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    sectionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    sectionText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    percentageContainer: {
      marginBottom: 12,
    },
    percentageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    percentageLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    percentageValue: {
      fontSize: 14,
      fontFamily: 'Poppins-Bold',
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      padding: 8,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    statValue: {
      fontSize: 14,
      fontFamily: 'Poppins-Bold',
    },
    statDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
    },
    noDataBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 6,
    },
    noDataText: {
      fontSize: 11,
      color: '#f59e0b',
      fontFamily: 'Poppins-Medium',
    },
    searchInfoContainer: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
  })

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.headerTitle}>Attendance Statistics</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>
                    {isSearching ? 'Search Results' : 'Class-wise Overview'}
                  </ThemedText>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Search Bar - Inline Design */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={18}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search students by name..."
                placeholderTextColor={colors.textSecondary + '80'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                cursorColor={colors.primary}
                returnKeyType="search"
                clearButtonMode="never"
                autoCorrect={false}
                autoCapitalize="none"
                enablesReturnKeyAutomatically
              />

              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Search results info */}
          {isSearching && debouncedSearchQuery && (
            <ThemedText style={styles.searchInfoText}>
              Found {searchResults.length} {getResultText(searchResults.length)} for "{debouncedSearchQuery}"
            </ThemedText>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            onTouchStart={handleScrollViewTouch}
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
            {isSearching ? (
              // Search Results
              searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onPress={(selectedStudent) => {
                      handleStudentPress(selectedStudent)
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <ThemedText style={[styles.emptyMessage, { color: colors.textSecondary, marginTop: 12 }]}>
                    No students found matching "{debouncedSearchQuery}"
                  </ThemedText>
                </View>
              )
            ) : (
              // Class Stats
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText style={styles.loadingText}>
                    Loading attendance statistics...
                  </ThemedText>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-triangle" size={50} color="#dc2626" />
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              ) : !stats || stats.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="stats-chart-outline" size={70} color={colors.textSecondary} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>No Data Available</ThemedText>
                  <ThemedText style={styles.emptyMessage}>
                    No attendance records found in the system
                  </ThemedText>
                </View>
              ) : (
                <>
                  {/* Date Range Card - Inside ScrollView */}
                  {dateRange && (
                    <View style={styles.dateRangeCard}>
                      <View style={styles.dateRangeLeft}>
                        <View style={styles.dateRangeIconContainer}>
                          <Feather name="calendar" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.dateRangeInfo}>
                          <ThemedText style={styles.dateRangeLabel}>Attendance Period</ThemedText>
                          <ThemedText style={styles.dateRangeValue}>
                            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.dateRangeBadge}>
                        <ThemedText style={styles.dateRangeBadgeText}>
                          {dateRange.totalWorkingDays} days
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* School Summary */}
                  {schoolSummary && (
                    <View style={styles.schoolSummarySection}>
                      <View style={styles.overallCardsGrid}>
                        <OverallStatCard
                          title="Total Students"
                          value={schoolSummary.totalStudents}
                          icon="users"
                          color="#3b82f6"
                        />
                        <OverallStatCard
                          title="With Attendance"
                          value={schoolSummary.studentsWithAttendance}
                          icon="check-circle"
                          color="#10b981"
                        />
                        <OverallStatCard
                          title="Without Attendance"
                          value={schoolSummary.studentsWithoutAttendance}
                          icon="x-circle"
                          color="#ef4444"
                        />
                        <OverallStatCard
                          title="Attendance %"
                          value={`${schoolSummary.overallAttendancePercentage}%`}
                          icon="trending-up"
                          color="#8b5cf6"
                        />
                      </View>
                    </View>
                  )}

                  {/* Class-wise Attendance */}
                  <ThemedText style={styles.sectionTitle}>Class-wise Attendance</ThemedText>
                  {stats.map((item, index) => (
                    <ClassSectionCard
                      key={`${item.class}-${item.section}-${index}`}
                      data={item}
                    />
                  ))}
                </>
              )
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

      {/* Student Attendance Modal */}
      {selectedStudent && (
        <StudentAttendance
          visible={showStudentAttendance}
          onClose={handleCloseStudentModal}
          student={selectedStudent}
        />
      )}
    </>
  )
}