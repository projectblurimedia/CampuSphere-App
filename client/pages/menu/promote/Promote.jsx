import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  SectionList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { 
  FontAwesome5, 
  Ionicons, 
  Feather, 
  MaterialIcons, 
  MaterialCommunityIcons,
  Entypo 
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { useSelector } from 'react-redux'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'

const { width, height } = Dimensions.get('window')

// Helper function to get current academic year
const getCurrentAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

// Helper function to check if academic year is completed
const isAcademicYearCompleted = (year) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const [startYear] = year.split('-').map(Number)
  
  if (startYear < currentYear) return true
  if (startYear === currentYear && currentMonth < 6) return true
  return false
}

// Helper function to get class order for sorting
const getClassOrder = (className) => {
  const orderMap = {
    'Pre-Nursery': 1,
    'Nursery': 2,
    'LKG': 3,
    'UKG': 4,
    'Class 1': 5,
    'Class 2': 6,
    'Class 3': 7,
    'Class 4': 8,
    'Class 5': 9,
    'Class 6': 10,
    'Class 7': 11,
    'Class 8': 12,
    'Class 9': 13,
    'Class 10': 14
  }
  return orderMap[className] || 999
}

// Helper function to get next class
const getNextClass = (currentClass) => {
  const classOrder = [
    'Pre-Nursery',
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10'
  ]

  const currentIndex = classOrder.indexOf(currentClass)
  if (currentIndex === -1) return null
  if (currentIndex === classOrder.length - 1) return 'Graduated'
  return classOrder[currentIndex + 1]
}

// Academic Year Picker Modal Component
const AcademicYearPickerModal = ({ 
  visible, 
  onClose, 
  onSelect,
  currentYear 
}) => {
  const { colors } = useTheme()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  // Generate academic years
  const generateAcademicYears = () => {
    const years = []
    const currentYearNum = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    for (let i = currentYearNum - 5; i <= currentYearNum + 5; i++) {
      const yearStr = `${i}-${i + 1}`
      const isCurrent = yearStr === getCurrentAcademicYear()
      const isCompleted = i < currentYearNum || (i === currentYearNum && currentMonth >= 6)
      
      years.push({
        label: yearStr,
        value: yearStr,
        isCurrent,
        isCompleted
      })
    }
    return years
  }

  const academicYears = generateAcademicYears()

  const handleSelect = () => {
    onSelect(selectedYear)
    onClose()
  }

  const backdropOpacity = fadeAnim
  const modalScale = scaleAnim

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlayCentered, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.pickerModalContainerCentered,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <LinearGradient
            colors={[colors.gradientStart + '20', colors.gradientEnd + '10']}
            style={styles.pickerModalHeader}
          >
            <View style={[styles.pickerModalIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <MaterialCommunityIcons name="calendar-range" size={28} color={colors.primary} />
            </View>
            <ThemedText style={[styles.pickerModalTitle, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
              Select Academic Year
            </ThemedText>
            <ThemedText style={[styles.pickerModalSubtitle, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
              Choose the academic year for promotion
            </ThemedText>
          </LinearGradient>

          <ScrollView 
            style={styles.pickerModalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerModalContent}
          >
            {academicYears.map((year) => (
              <TouchableOpacity
                key={year.value}
                style={[
                  styles.yearItem,
                  selectedYear === year.value && styles.yearItemSelected,
                  { borderColor: selectedYear === year.value ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedYear(year.value)}
                activeOpacity={0.7}
              >
                <View style={styles.yearItemLeft}>
                  <View style={[
                    styles.yearRadio,
                    { borderColor: selectedYear === year.value ? colors.primary : colors.border }
                  ]}>
                    {selectedYear === year.value && (
                      <View style={[styles.yearRadioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View>
                    <ThemedText style={[
                      styles.yearLabel,
                      { color: selectedYear === year.value ? colors.primary : colors.text, fontFamily: 'Poppins-Medium' }
                    ]}>
                      {year.label}
                    </ThemedText>
                    <View style={styles.yearBadgeContainer}>
                      {year.isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.primary + '20' }]}>
                          <MaterialIcons name="star" size={12} color={colors.primary} />
                          <ThemedText style={[styles.currentBadgeText, { color: colors.primary, fontFamily: 'Poppins-Medium' }]}>
                            Current
                          </ThemedText>
                        </View>
                      )}
                      {year.isCompleted && !year.isCurrent && (
                        <View style={[styles.completedBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                          <Feather name="check-circle" size={12} color={colors.textSecondary} />
                          <ThemedText style={[styles.completedBadgeText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                            Completed
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {selectedYear === year.value && (
                  <Animated.View>
                    <Feather name="check" size={20} color={colors.primary} />
                  </Animated.View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.pickerModalFooter}>
            <TouchableOpacity
              style={[styles.pickerCancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.pickerCancelButtonText, { color: colors.textSecondary, fontFamily: 'Poppins-SemiBold' }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pickerSelectButton, { backgroundColor: colors.primary }]}
              onPress={handleSelect}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.pickerSelectButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                Select Year
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Promotion Confirmation Modal Component
const PromotionConfirmationModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  selectedCount,
  selectedClasses,
  academicYear,
  isProcessing = false
}) => {
  const { colors } = useTheme()
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  // Group selected classes by class-section
  const classGroups = {}
  selectedClasses.forEach(item => {
    const key = `${item.class}-${item.section}`
    if (!classGroups[key]) {
      classGroups[key] = {
        class: item.class,
        section: item.section,
        count: 0
      }
    }
    classGroups[key].count++
  })

  const backdropOpacity = fadeAnim
  const modalScale = scaleAnim

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlayCentered, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onCancel}
          activeOpacity={1}
          disabled={isProcessing}
        />
        <Animated.View 
          style={[
            styles.confirmModalContainerCentered,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <View style={styles.confirmModalIconContainer}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.confirmModalIcon}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="school" size={36} color="#FFFFFF" />
              )}
            </LinearGradient>
          </View>

          <ThemedText style={[styles.confirmModalTitle, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
            {isProcessing ? 'Processing Promotion...' : 'Confirm Promotion'}
          </ThemedText>

          <ThemedText style={[styles.confirmModalMessage, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
            {isProcessing 
              ? `Please wait while we promote ${selectedCount} student${selectedCount !== 1 ? 's' : ''}`
              : `Are you sure you want to promote ${selectedCount} student${selectedCount !== 1 ? 's' : ''}?`
            }
          </ThemedText>

          {!isProcessing && (
            <View style={[styles.confirmDetailsCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={styles.confirmDetailRow}>
                <Feather name="calendar" size={16} color={colors.textSecondary} />
                <ThemedText style={[styles.confirmDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                  Academic Year:
                </ThemedText>
                <ThemedText style={[styles.confirmDetailValue, { color: colors.primary, fontFamily: 'Poppins-SemiBold' }]}>
                  {academicYear}
                </ThemedText>
              </View>

              <View style={styles.confirmDivider} />

              {Object.values(classGroups).map(({ class: className, section, count }) => (
                <View key={`${className}-${section}`} style={styles.confirmDetailRow}>
                  <Ionicons name="people" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.confirmDetailLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    {className} - {section}:
                  </ThemedText>
                  <ThemedText style={[styles.confirmDetailValue, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                    {count} student{count !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              ))}

              <View style={styles.confirmDivider} />

              <View style={styles.confirmTotalRow}>
                <ThemedText style={[styles.confirmTotalLabel, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                  Total Selected:
                </ThemedText>
                <View style={[styles.confirmTotalBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ThemedText style={[styles.confirmTotalValue, { color: colors.primary, fontFamily: 'Poppins-Bold' }]}>
                    {selectedCount}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {!isProcessing && (
            <View style={styles.confirmWarningContainer}>
              <Feather name="info" size={14} color="#F59E0B" />
              <ThemedText style={[styles.confirmWarningText, { fontFamily: 'Poppins-Medium' }]}>
                This will archive attendance, marks, and set up new class fees
              </ThemedText>
            </View>
          )}

          <View style={styles.confirmModalButtons}>
            {!isProcessing && (
              <TouchableOpacity
                style={[styles.confirmCancelButton, { borderColor: colors.border }]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.confirmCancelButtonText, { color: colors.textSecondary, fontFamily: 'Poppins-SemiBold' }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmActionButton, 
                { backgroundColor: colors.primary },
                isProcessing && styles.confirmActionButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <View style={styles.confirmProcessingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[styles.confirmActionButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                    Processing...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={[styles.confirmActionButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                  Promote Now
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Success Result Modal Component
const SuccessResultModal = ({ 
  visible, 
  onClose, 
  results,
  summary
}) => {
  const { colors } = useTheme()
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const hasErrors = summary?.failed > 0

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  const backdropOpacity = fadeAnim
  const modalScale = scaleAnim

  const getStatusColor = (status) => {
    switch(status) {
      case 'Promoted': return '#10B981'
      case 'Demoted': return '#F59E0B'
      case 'Graduated': return '#8B5CF6'
      default: return colors.textSecondary
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Promoted': return 'arrow-up'
      case 'Demoted': return 'arrow-down'
      case 'Graduated': return 'check'
      default: return 'circle'
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlayCentered, { opacity: backdropOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.successModalContainerCentered,
            { 
              backgroundColor: colors.cardBackground,
              transform: [{ scale: modalScale }]
            }
          ]}
        >
          <LinearGradient
            colors={hasErrors ? ['#FEE2E2', '#FECACA'] : ['#D1FAE5', '#A7F3D0']}
            style={styles.successModalHeader}
          >
            <View style={styles.successModalIconContainer}>
              <View style={[
                styles.successModalIcon,
                { backgroundColor: hasErrors ? '#EF4444' : '#10B981' }
              ]}>
                {hasErrors ? (
                  <Feather name="alert-triangle" size={32} color="#FFFFFF" />
                ) : (
                  <Feather name="check" size={32} color="#FFFFFF" />
                )}
              </View>
            </View>
            <ThemedText style={[styles.successModalTitle, { color: hasErrors ? '#B91C1C' : '#065F46', fontFamily: 'Poppins-Bold' }]}>
              {hasErrors ? 'Partial Success' : 'Promotion Complete!'}
            </ThemedText>
            <ThemedText style={[styles.successModalSubtitle, { color: hasErrors ? '#991B1B' : '#047857', fontFamily: 'Poppins-Medium' }]}>
              {hasErrors 
                ? 'Some students were promoted with warnings'
                : 'All students promoted successfully'
              }
            </ThemedText>
          </LinearGradient>

          <ScrollView 
            style={styles.successModalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.successModalContent}
          >
            <View style={styles.successStatsContainer}>
              <View style={styles.successStatsGrid}>
                <View style={[styles.successStatCard, { backgroundColor: colors.inputBackground }]}>
                  <MaterialIcons name="people" size={20} color={colors.primary} />
                  <ThemedText style={[styles.successStatNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                    {summary?.totalProcessed || 0}
                  </ThemedText>
                  <ThemedText style={[styles.successStatLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Total
                  </ThemedText>
                </View>

                <View style={[styles.successStatCard, { backgroundColor: colors.inputBackground }]}>
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <ThemedText style={[styles.successStatNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                    {summary?.successful || 0}
                  </ThemedText>
                  <ThemedText style={[styles.successStatLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Successful
                  </ThemedText>
                </View>

                <View style={[styles.successStatCard, { backgroundColor: colors.inputBackground }]}>
                  <MaterialIcons name="warning" size={20} color="#F59E0B" />
                  <ThemedText style={[styles.successStatNumber, { color: colors.text, fontFamily: 'Poppins-Bold' }]}>
                    {summary?.failed || 0}
                  </ThemedText>
                  <ThemedText style={[styles.successStatLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Failed
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.successAcademicStats, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.successAcademicRow}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Academic Year:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: colors.primary, fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.academicYear || 'N/A'}
                  </ThemedText>
                </View>

                <View style={styles.successAcademicRow}>
                  <Feather name="trending-up" size={16} color="#10B981" />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Promoted:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: '#10B981', fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.promoted || 0}
                  </ThemedText>
                </View>

                <View style={styles.successAcademicRow}>
                  <FontAwesome5 name="user-graduate" size={16} color="#8B5CF6" />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Graduated:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: '#8B5CF6', fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.graduated || 0}
                  </ThemedText>
                </View>

                <View style={styles.successAcademicRow}>
                  <Feather name="award" size={16} color="#F59E0B" />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Avg Attendance:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: '#F59E0B', fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.averageAttendance || 0}%
                  </ThemedText>
                </View>

                <View style={styles.successAcademicRow}>
                  <Feather name="bar-chart-2" size={16} color="#3B82F6" />
                  <ThemedText style={[styles.successAcademicLabel, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                    Avg Marks:
                  </ThemedText>
                  <ThemedText style={[styles.successAcademicValue, { color: '#3B82F6', fontFamily: 'Poppins-SemiBold' }]}>
                    {summary?.averageMarks || 0}%
                  </ThemedText>
                </View>
              </View>
            </View>

            {results && results.length > 0 && (
              <View style={styles.successResultsContainer}>
                <View style={styles.successResultsHeader}>
                  <MaterialIcons name="list" size={18} color={colors.primary} />
                  <ThemedText style={[styles.successResultsTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                    Promoted Students
                  </ThemedText>
                  <View style={[styles.successResultsBadge, { backgroundColor: colors.primary + '20' }]}>
                    <ThemedText style={[styles.successResultsCount, { color: colors.primary, fontFamily: 'Poppins-SemiBold' }]}>
                      {results.length}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.successResultsList}>
                  {results.map((student, index) => (
                    <View 
                      key={student.id || index} 
                      style={[styles.successResultItem, { borderBottomColor: colors.border }]}
                    >
                      <View style={styles.successResultLeft}>
                        <View style={[
                          styles.successResultIcon,
                          { backgroundColor: getStatusColor(student.status) + '20' }
                        ]}>
                          <Feather 
                            name={getStatusIcon(student.status)} 
                            size={14} 
                            color={getStatusColor(student.status)} 
                          />
                        </View>
                        <View style={styles.successResultInfo}>
                          <ThemedText style={[styles.successResultName, { color: colors.text, fontFamily: 'Poppins-Medium' }]}>
                            {student.name}
                          </ThemedText>
                          <View style={styles.successResultMeta}>
                            <View style={styles.successResultClass}>
                              <MaterialIcons name="class" size={12} color={colors.textSecondary} />
                              <ThemedText style={[styles.successResultClassText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                                {student.archivedRecord?.classLabel}
                              </ThemedText>
                            </View>
                            <View style={styles.successResultAttendance}>
                              <Feather name="users" size={12} color={colors.textSecondary} />
                              <ThemedText style={[styles.successResultMetaText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                                {student.archivedRecord?.attendancePercentage || 0}%
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={[
                        styles.successResultStatus,
                        { backgroundColor: getStatusColor(student.status) + '20' }
                      ]}>
                        <ThemedText style={[styles.successResultStatusText, { color: getStatusColor(student.status), fontFamily: 'Poppins-SemiBold' }]}>
                          {student.status}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.successCloseButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.successCloseButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
              Done
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Main Promote Component
export default function Promote({ visible, onClose }) {
  const { colors } = useTheme()
  
  // Get employee from Redux
  const employee = useSelector(state => state.employee.employee)
  const teacherName = employee ? `${employee.firstName} ${employee.lastName}` : 'Teacher'
  
  // State for filters
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear())
  const [showAcademicYearPicker, setShowAcademicYearPicker] = useState(false)
  
  // State for students
  const [studentsByClassSection, setStudentsByClassSection] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState({})
  const [sectionSelection, setSectionSelection] = useState({})
  
  // State for UI
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // State for modals
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [promotionResults, setPromotionResults] = useState(null)
  const [promotionSummary, setPromotionSummary] = useState(null)
  
  // Animations
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const slideAnimation = useRef(new Animated.Value(50)).current
  
  // Toast notification
  const [toast, setToast] = useState(null)

  // Animate content on mount
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnimation, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnimation.setValue(0)
      slideAnimation.setValue(50)
    }
  }, [visible])

  // Toast notification functions
  const showToast = useCallback((message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Load all students grouped by class and section
  const loadAllStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axiosApi.get('/students')
      
      if (response.data.success) {
        const students = response.data.data
        setAllStudents(students)
        
        // Group students by class and section
        const grouped = {}
        students.forEach(student => {
          const className = student.displayClass || student.class
          const section = student.section
          const key = `${className}-${section}`
          
          if (!grouped[key]) {
            grouped[key] = {
              class: className,
              section: section,
              displayTitle: `${className} - ${section}`,
              students: [],
              nextClass: getNextClass(className)
            }
          }
          
          grouped[key].students.push({
            ...student,
            uniqueId: `${student.id}-${key}`,
          })
        })
        
        // Convert to array for SectionList with proper sorting
        const sections = Object.values(grouped)
          .sort((a, b) => {
            const classCompare = getClassOrder(a.class) - getClassOrder(b.class)
            if (classCompare !== 0) return classCompare
            return a.section.localeCompare(b.section)
          })
          .map(section => ({
            title: section.displayTitle,
            class: section.class,
            section: section.section,
            nextClass: section.nextClass,
            data: section.students.sort((a, b) => {
              return (a.rollNo || a.firstName || '').localeCompare(b.rollNo || b.firstName || '')
            })
          }))
        
        setStudentsByClassSection(sections)
        
        // Initialize selections
        const initialSelected = {}
        const initialSectionSelection = {}
        
        students.forEach(student => {
          initialSelected[student.id] = false
        })
        
        sections.forEach(section => {
          initialSectionSelection[section.title] = false
        })
        
        setSelectedStudents(initialSelected)
        setSectionSelection(initialSectionSelection)
        
      } else {
        throw new Error(response.data.message || 'Failed to load students')
      }
    } catch (err) {
      console.error('Error loading students:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load students'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setStudentsByClassSection([])
      setAllStudents([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Load students when component mounts
  useEffect(() => {
    if (visible) {
      loadAllStudents()
    }
  }, [visible])

  // Refresh data
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadAllStudents()
  }, [])

  // Handle select all in a section
  const handleSelectSection = useCallback((sectionTitle) => {
    setSectionSelection(prev => {
      const newSectionSelection = !prev[sectionTitle]
      
      // Find all students in this section
      const section = studentsByClassSection.find(s => s.title === sectionTitle)
      if (section) {
        setSelectedStudents(prevSelected => {
          const newSelected = { ...prevSelected }
          section.data.forEach(student => {
            newSelected[student.id] = newSectionSelection
          })
          return newSelected
        })
      }
      
      return {
        ...prev,
        [sectionTitle]: newSectionSelection
      }
    })
  }, [studentsByClassSection])

  // Handle individual student selection
  const handleSelectStudent = useCallback((studentId, sectionTitle) => {
    setSelectedStudents(prev => {
      const newSelection = {
        ...prev,
        [studentId]: !prev[studentId]
      }
      
      // Check if all students in this section are selected
      const section = studentsByClassSection.find(s => s.title === sectionTitle)
      if (section) {
        const allSelected = section.data.every(student => newSelection[student.id])
        setSectionSelection(prevSection => ({
          ...prevSection,
          [sectionTitle]: allSelected
        }))
      }
      
      return newSelection
    })
  }, [studentsByClassSection])

  // Get selected student count
  const getSelectedCount = useCallback(() => {
    return Object.values(selectedStudents).filter(Boolean).length
  }, [selectedStudents])

  // Get selected students by class-section
  const getSelectedByClassSection = useCallback(() => {
    const selected = []
    Object.entries(selectedStudents).forEach(([id, isSelected]) => {
      if (isSelected) {
        const student = allStudents.find(s => s.id === id)
        if (student) {
          selected.push({
            id: student.id,
            name: student.name || `${student.firstName} ${student.lastName}`.trim(),
            class: student.displayClass || student.class,
            section: student.section,
            nextClass: getNextClass(student.displayClass || student.class)
          })
        }
      }
    })
    return selected
  }, [allStudents, selectedStudents])

  // Handle promote button press
  const handlePromotePress = useCallback(() => {
    const selectedCount = getSelectedCount()
    
    if (selectedCount === 0) {
      showToast('Please select at least one student to promote', 'warning')
      return
    }

    if (!academicYear) {
      showToast('Please select academic year', 'warning')
      return
    }

    setShowConfirmModal(true)
  }, [getSelectedCount, academicYear])

  // Handle promotion confirmation
  const handlePromoteConfirm = useCallback(async () => {
    setShowConfirmModal(false)
    setIsProcessing(true)

    const selectedIds = allStudents
      .filter(student => selectedStudents[student.id])
      .map(student => student.id)

    try {
      const payload = {
        studentIds: selectedIds,
        academicYear,
        action: 'promote' // Always promote
      }

      const response = await axiosApi.post('/students/promote', payload)

      if (response.data.success || response.status === 207) {
        setPromotionResults(response.data.data?.results || [])
        setPromotionSummary(response.data.summary)
        setShowSuccessModal(true)
        
        // Reload students after promotion
        setTimeout(() => {
          loadAllStudents()
        }, 1000)
      }
    } catch (err) {
      if (err.response?.status === 207) {
        setPromotionResults(err.response.data.data?.results || [])
        setPromotionSummary(err.response.data.summary)
        setShowSuccessModal(true)
      } else {
        showToast(
          err.response?.data?.message || err.message || 'Failed to promote students',
          'error'
        )
      }
    } finally {
      setIsProcessing(false)
    }
  }, [allStudents, selectedStudents, academicYear])

  const handlePromoteCancel = useCallback(() => {
    setShowConfirmModal(false)
  }, [])

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false)
    setPromotionResults(null)
    setPromotionSummary(null)
    onClose()
  }, [])

  const selectedCount = getSelectedCount()
  const selectedByClassSection = getSelectedByClassSection()
  const isYearCompleted = isAcademicYearCompleted(academicYear)

  // Render section header
  const renderSectionHeader = useCallback(({ section: { title, class: className, section: sectionName, nextClass } }) => {
    const isSectionSelected = sectionSelection[title] || false
    const sectionStudents = studentsByClassSection.find(s => s.title === title)?.data || []
    const sectionSelectedCount = sectionStudents.filter(s => selectedStudents[s.id]).length
    
    return (
      <TouchableOpacity 
        style={[styles.sectionHeader, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        onPress={() => handleSelectSection(title)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[
            styles.sectionCheckbox,
            { 
              borderColor: isSectionSelected ? colors.primary : colors.border,
              backgroundColor: isSectionSelected ? colors.primary + '20' : 'transparent',
            }
          ]}>
            {isSectionSelected && (
              <Feather name="check" size={16} color={colors.primary} />
            )}
          </View>
          <View>
            <ThemedText style={[styles.sectionHeaderTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
              {className} - {sectionName}
            </ThemedText>
            {nextClass && nextClass !== 'Graduated' && (
              <View style={styles.nextClassBadge}>
                <MaterialIcons name="arrow-forward" size={12} color={colors.primary} />
                <ThemedText style={[styles.nextClassText, { color: colors.primary, fontFamily: 'Poppins-Medium' }]}>
                  Next: {nextClass}
                </ThemedText>
              </View>
            )}
            {nextClass === 'Graduated' && (
              <View style={[styles.graduationBadge, { backgroundColor: '#8B5CF620' }]}>
                <Feather name="graduation-cap" size={12} color="#8B5CF6" />
                <ThemedText style={[styles.graduationText, { color: '#8B5CF6', fontFamily: 'Poppins-Medium' }]}>
                  Graduating
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.sectionHeaderRight}>
          <ThemedText style={[styles.sectionSelectedCount, { color: colors.primary, fontFamily: 'Poppins-Medium' }]}>
            {sectionSelectedCount}/{sectionStudents.length}
          </ThemedText>
        </View>
      </TouchableOpacity>
    )
  }, [sectionSelection, selectedStudents, studentsByClassSection, handleSelectSection])

  // Render student item - SIMPLIFIED: Only checkbox, avatar, and name
  const renderStudent = useCallback(({ item, section }) => {
    const isSelected = selectedStudents[item.id] || false
    
    return (
      <TouchableOpacity 
        style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleSelectStudent(item.id, section.title)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.studentCheckbox,
          { 
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
          }
        ]}>
          {isSelected && (
            <Feather name="check" size={16} color={colors.primary} />
          )}
        </View>
        
        <View style={styles.studentAvatar}>
          {item.profilePicUrl ? (
            <Image source={{ uri: item.profilePicUrl }} style={styles.studentAvatarImage} />
          ) : (
            <View style={[styles.studentAvatarPlaceholder, { backgroundColor: '#1d9bf0' }]}>
              <ThemedText style={[styles.studentAvatarText, { fontFamily: 'Poppins-SemiBold' }]}>
                {(item.firstName?.[0] || '') + (item.lastName?.[0] || '')}
              </ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.studentInfo}>
          <ThemedText style={[styles.studentName, { color: colors.text, fontFamily: 'Poppins-Medium' }]} numberOfLines={1}>
            {item.firstName} {item.lastName}
          </ThemedText>
        </View>
      </TouchableOpacity>
    )
  }, [selectedStudents, handleSelectStudent])

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
                activeOpacity={0.9}
              >
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.headerTitle}>
                <ThemedText style={[styles.title, { fontFamily: 'Poppins-SemiBold' }]}>
                  Promote Students
                </ThemedText>
                <ThemedText style={[styles.subtitle, { fontFamily: 'Poppins-Medium' }]}>
                  {selectedCount > 0 
                    ? `${selectedCount} student${selectedCount !== 1 ? 's' : ''} selected` 
                    : 'Select students to promote'
                  }
                </ThemedText>
              </View>
              
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Loading Overlay */}
        {(isLoading || isProcessing) && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                {isProcessing ? 'Processing Promotion...' : 'Loading Students...'}
              </ThemedText>
              <ThemedText style={[styles.loadingSubtext, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                {isProcessing ? 'This may take a few moments' : 'Fetching student data'}
              </ThemedText>
            </View>
          </View>
        )}

        <Animated.View 
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* Academic Year Section */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.sectionHeaderContainer, { borderColor: colors.border }]}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons name="calendar-range" size={20} color={colors.primary} />
                </View>
                <ThemedText style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                  Academic Year
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.yearSelector, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                onPress={() => setShowAcademicYearPicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.yearSelectorLeft}>
                  <Feather name="calendar" size={20} color={colors.primary} />
                  <View>
                    <ThemedText style={[styles.yearSelectorLabel, { color: colors.text, fontFamily: 'Poppins-Medium' }]}>
                      {academicYear}
                    </ThemedText>
                    {isYearCompleted && (
                      <View style={[styles.yearCompletedBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                        <Feather name="check-circle" size={12} color={colors.textSecondary} />
                        <ThemedText style={[styles.yearCompletedText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                          Completed
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <Feather name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Students List Section */}
            {studentsByClassSection.length > 0 ? (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={[styles.sectionHeaderContainer, { borderColor: colors.border }]}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={20} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                    Students by Class & Section
                  </ThemedText>
                  {selectedCount > 0 && (
                    <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '20' }]}>
                      <ThemedText style={[styles.sectionBadgeText, { color: colors.primary, fontFamily: 'Poppins-Medium' }]}>
                        {selectedCount} Selected
                      </ThemedText>
                    </View>
                  )}
                </View>

                <SectionList
                  sections={studentsByClassSection}
                  renderItem={renderStudent}
                  renderSectionHeader={renderSectionHeader}
                  keyExtractor={(item) => item.uniqueId || item.id}
                  scrollEnabled={false}
                  SectionSeparatorComponent={() => <View style={{ height: 16 }} />}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              </View>
            ) : !isLoading && (
              <View style={[styles.emptyStateCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="school" size={60} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyStateTitle, { color: colors.text, fontFamily: 'Poppins-SemiBold' }]}>
                  No Students Found
                </ThemedText>
                <ThemedText style={[styles.emptyStateText, { color: colors.textSecondary, fontFamily: 'Poppins-Medium' }]}>
                  There are no active students in the system to promote
                </ThemedText>
              </View>
            )}

            {error && (
              <View style={[styles.errorCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                <Feather name="alert-triangle" size={24} color="#DC2626" />
                <ThemedText style={[styles.errorText, { color: '#B91C1C', fontFamily: 'Poppins-Medium' }]}>
                  {error}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.errorRetryButton, { backgroundColor: '#DC2626' }]}
                  onPress={loadAllStudents}
                >
                  <ThemedText style={[styles.errorRetryText, { fontFamily: 'Poppins-Medium' }]}>
                    Try Again
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Bottom Action Button */}
        {studentsByClassSection.length > 0 && (
          <View style={styles.footer}>
            <LinearGradient
              colors={selectedCount === 0 ? ['#D1D5DB', '#9CA3AF'] : [colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerGradient}
            >
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handlePromotePress}
                activeOpacity={0.9}
                disabled={isLoading || isProcessing || selectedCount === 0}
              >
                <MaterialCommunityIcons name="school" size={22} color="#FFFFFF" />
                <ThemedText style={[styles.footerButtonText, { fontFamily: 'Poppins-SemiBold' }]}>
                  Promote {selectedCount > 0 ? `(${selectedCount})` : ''}
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Modals */}
      <AcademicYearPickerModal
        visible={showAcademicYearPicker}
        onClose={() => setShowAcademicYearPicker(false)}
        onSelect={setAcademicYear}
        currentYear={academicYear}
      />

      <PromotionConfirmationModal
        visible={showConfirmModal}
        onConfirm={handlePromoteConfirm}
        onCancel={handlePromoteCancel}
        selectedCount={selectedCount}
        selectedClasses={selectedByClassSection}
        academicYear={academicYear}
        isProcessing={isProcessing}
      />

      {promotionSummary && (
        <SuccessResultModal
          visible={showSuccessModal}
          onClose={handleSuccessModalClose}
          results={promotionResults}
          summary={promotionSummary}
        />
      )}

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
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: -2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sectionBadgeText: {
    fontSize: 12,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  yearSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearSelectorLabel: {
    fontSize: 16,
  },
  yearCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  yearCompletedText: {
    fontSize: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
  },
  nextClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nextClassText: {
    fontSize: 11,
  },
  graduationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  graduationText: {
    fontSize: 10,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSelectedCount: {
    fontSize: 14,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginLeft: 36,
  },
  studentCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  studentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  studentAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  errorRetryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorRetryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
  },
  footerGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 13,
  },
  // Centered Modal Styles
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    borderRadius: 30,
    overflow: 'hidden',
  },
  confirmModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
  },
  successModalContainerCentered: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    borderRadius: 30,
    overflow: 'hidden',
  },
  successModalScroll: {
    maxHeight: height * 0.5,
  },
  successModalContent: {
    padding: 20,
  },
  pickerModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  pickerModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  pickerModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  pickerModalScroll: {
    maxHeight: height * 0.4,
  },
  pickerModalContent: {
    padding: 16,
    gap: 8,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  yearItemSelected: {
    borderWidth: 2,
  },
  yearItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  yearLabel: {
    fontSize: 16,
  },
  yearBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 10,
  },
  pickerModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  pickerCancelButtonText: {
    fontSize: 16,
  },
  pickerSelectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  pickerSelectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  confirmModalIconContainer: {
    marginBottom: 16,
  },
  confirmModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmDetailsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmDetailLabel: {
    flex: 1,
    fontSize: 14,
  },
  confirmDetailValue: {
    fontSize: 14,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  confirmTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  confirmTotalLabel: {
    fontSize: 16,
  },
  confirmTotalBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmTotalValue: {
    fontSize: 18,
  },
  confirmWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  confirmWarningText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelButtonText: {
    fontSize: 16,
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmActionButtonDisabled: {
    opacity: 0.5,
  },
  confirmActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  confirmProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  successModalIconContainer: {
    marginBottom: 16,
  },
  successModalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalTitle: {
    fontSize: 22,
    marginBottom: 4,
    textAlign: 'center',
  },
  successModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  successStatsContainer: {
    gap: 16,
  },
  successStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  successStatCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  successStatNumber: {
    fontSize: 20,
  },
  successStatLabel: {
    fontSize: 12,
  },
  successAcademicStats: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  successAcademicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successAcademicLabel: {
    flex: 1,
    fontSize: 13,
  },
  successAcademicValue: {
    fontSize: 14,
  },
  successResultsContainer: {
    marginTop: 16,
  },
  successResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  successResultsTitle: {
    flex: 1,
    fontSize: 16,
  },
  successResultsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  successResultsCount: {
    fontSize: 12,
  },
  successResultsList: {
    maxHeight: 200,
  },
  successResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  successResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  successResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successResultInfo: {
    flex: 1,
  },
  successResultName: {
    fontSize: 14,
    marginBottom: 2,
  },
  successResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successResultClass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successResultClassText: {
    fontSize: 11,
  },
  successResultAttendance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successResultMetaText: {
    fontSize: 11,
  },
  successResultStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  successResultStatusText: {
    fontSize: 11,
  },
  successCloseButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  successCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
})