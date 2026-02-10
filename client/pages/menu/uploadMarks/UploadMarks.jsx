import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  Switch,
  LayoutAnimation,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { useSelector } from 'react-redux'

// Custom Dropdown Component with optimized rendering
const CustomDropdown = React.memo(({
  value,
  items,
  onSelect,
  placeholder = "Select an option",
  style,
  isLoading = false,
  width = '100%',
  showIcon = true,
}) => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(placeholder)
  
  // Update selected label with memoization
  useEffect(() => {
    if (value && items && items.length > 0) {
      const foundItem = items.find(item => item.value === value)
      setSelectedLabel(foundItem ? foundItem.label : placeholder)
    } else {
      setSelectedLabel(placeholder)
    }
  }, [value, items, placeholder])

  const handleSelect = useCallback((item) => {
    setSelectedLabel(item.label)
    onSelect(item.value)
    setIsOpen(false)
  }, [onSelect])

  const dropdownStyles = StyleSheet.create({
    customDropdownContainer: {
      marginBottom: 12,
      width: width,
    },
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderLeftWidth: 3,
      borderRadius: 6,
      borderTopRightRadius: 22,
      borderBottomRightRadius: 22,
      paddingHorizontal: 12,
      height: 50,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderLeftColor: colors.primary,
      justifyContent: 'space-between',
    },
    dropdownSelectedText: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      color: value ? colors.text : colors.textSecondary,
    },
    dropdownList: {
      position: 'absolute',
      top: 52,
      left: 0,
      right: 0,
      borderWidth: 1,
      borderRadius: 8,
      borderTopWidth: 0,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      backgroundColor: colors.inputBackground,
      borderColor: colors.primary + '30',
      maxHeight: 200,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dropdownItemText: {
      fontSize: 15,
      flex: 1,
    },
  })

  return (
    <View style={[dropdownStyles.customDropdownContainer, style]}>
      <TouchableOpacity
        style={[dropdownStyles.dropdownHeader, isLoading && { opacity: 0.5 }]}
        onPress={() => !isLoading && items.length > 0 && setIsOpen(!isOpen)}
        activeOpacity={0.7}
        disabled={isLoading || items.length === 0}
      >
        {showIcon && (
          <Feather name="chevron-down" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        )}
        <ThemedText style={dropdownStyles.dropdownSelectedText} numberOfLines={1}>
          {isLoading ? 'Loading...' : selectedLabel}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={colors.primary} />
      </TouchableOpacity>
     
      {isOpen && !isLoading && items.length > 0 && (
        <View style={dropdownStyles.dropdownList}>
          <ScrollView
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {items.map((item) => (
              <TouchableOpacity
                key={`${item.value}-${item.label}`}
                style={[
                  dropdownStyles.dropdownItem,
                  {
                    backgroundColor: value === item.value ? colors.primary + '15' : 'transparent',
                    borderLeftWidth: value === item.value ? 2 : 0,
                    borderLeftColor: colors.primary,
                  }
                ]}
                onPress={() => handleSelect(item)}
              >
                <ThemedText style={[
                  dropdownStyles.dropdownItemText,
                  {
                    color: value === item.value ? colors.primary : colors.text,
                    fontFamily: value === item.value ? 'Poppins-SemiBold' : 'Poppins-Medium'
                  }
                ]}>
                  {item.label}
                </ThemedText>
                {value === item.value && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
})

// Override Confirmation Modal Component
const OverrideConfirmationModal = React.memo(({
  visible,
  onConfirm,
  onCancel,
  markedCount,
  examName,
  subject,
  className,
  section,
  uploadedBy
}) => {
  const { colors } = useTheme()
 
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '90%',
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    warningIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#fee2e2',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fca5a5',
    },
    title: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
      marginBottom: 12,
      color: '#dc2626',
    },
    message: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.text,
      lineHeight: 22,
    },
    details: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    uploadedByRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    warningText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#dc2626',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#ffffff',
    },
  })

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.warningIcon}>
              <Feather name="alert-triangle" size={30} color="#dc2626" />
            </View>
          </View>
         
          <ThemedText style={styles.title}>Marks Already Uploaded</ThemedText>
         
          <ThemedText style={styles.message}>
            Marks for {examName} - {subject} already exist for {markedCount} students in {className}-{section}.
          </ThemedText>
         
          <ThemedText style={[styles.message, { color: '#dc2626', fontFamily: 'Poppins-SemiBold' }]}>
            Do you want to override?
          </ThemedText>
         
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Class-Section:</ThemedText>
              <ThemedText style={styles.detailValue}>{className}-{section}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Exam:</ThemedText>
              <ThemedText style={styles.detailValue}>{examName}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Subject:</ThemedText>
              <ThemedText style={styles.detailValue}>{subject}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Marked Students:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: '#dc2626' }]}>{markedCount} students</ThemedText>
            </View>
            <View style={styles.uploadedByRow}>
              <ThemedText style={styles.detailLabel}>Uploaded By:</ThemedText>
              <ThemedText style={styles.detailValue}>{uploadedBy}</ThemedText>
            </View>
          </View>
         
          <ThemedText style={styles.warningText}>
            This action will replace existing marks records
          </ThemedText>
         
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
           
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.confirmButtonText}>Override</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
})

// Delete Confirmation Modal Component
const DeleteConfirmationModal = React.memo(({
  visible,
  onConfirm,
  onCancel,
  examName,
  subject,
  className,
  section,
  uploadedBy,
  isDeleting = false
}) => {
  const { colors } = useTheme()
 
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '90%',
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    deleteIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#fee2e2',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fca5a5',
    },
    title: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
      marginBottom: 12,
      color: '#dc2626',
    },
    message: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.text,
      lineHeight: 22,
    },
    details: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    uploadedByRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    warningText: {
      fontSize: 13,
      color: '#dc2626',
      textAlign: 'center',
      marginTop: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    noteText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#dc2626',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      opacity: isDeleting ? 0.6 : 1,
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#ffffff',
    },
  })

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.deleteIcon}>
              {isDeleting ? (
                <ActivityIndicator size="large" color="#dc2626" />
              ) : (
                <Feather name="trash-2" size={30} color="#dc2626" />
              )}
            </View>
          </View>
         
          <ThemedText style={styles.title}>
            {isDeleting ? 'Deleting Marks...' : 'Delete Marks'}
          </ThemedText>
         
          <ThemedText style={styles.message}>
            {isDeleting
              ? `Deleting ${subject} marks for ${examName} in ${className}-${section}...`
              : `Are you sure you want to delete ${subject} marks for ${examName} in ${className}-${section}?`
            }
          </ThemedText>
         
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Class-Section:</ThemedText>
              <ThemedText style={styles.detailValue}>{className}-{section}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Exam:</ThemedText>
              <ThemedText style={styles.detailValue}>{examName}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Subject:</ThemedText>
              <ThemedText style={styles.detailValue}>{subject}</ThemedText>
            </View>
            {uploadedBy && (
              <View style={styles.uploadedByRow}>
                <ThemedText style={styles.detailLabel}>Uploaded By:</ThemedText>
                <ThemedText style={styles.detailValue}>{uploadedBy}</ThemedText>
              </View>
            )}
          </View>
         
          {!isDeleting && (
            <>
              <ThemedText style={styles.warningText}>
                This action cannot be undone
              </ThemedText>
             
              <ThemedText style={styles.noteText}>
                All marks records for this subject and exam will be permanently deleted
              </ThemedText>
            </>
          )}
         
          <View style={styles.buttonContainer}>
            {!isDeleting && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
           
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <ThemedText style={[styles.confirmButtonText, { marginLeft: 8 }]}>
                    Deleting...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.confirmButtonText}>Delete</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
})

// Statistics Card Component
const StatisticsCard = React.memo(({ statistics }) => {
  const { colors } = useTheme()
 
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    title: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
  })

  if (!statistics) return null

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Marks Statistics</ThemedText>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{statistics.average}</ThemedText>
          <ThemedText style={styles.statLabel}>Average</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{statistics.max}</ThemedText>
          <ThemedText style={styles.statLabel}>Highest</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{statistics.min}</ThemedText>
          <ThemedText style={styles.statLabel}>Lowest</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{statistics.filledCount}/{statistics.totalCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Filled</ThemedText>
        </View>
      </View>
    </View>
  )
})

// Existing Marks Status Component
const ExistingMarksStatus = React.memo(({ marksExist, checkingMarks }) => {
  const { colors } = useTheme()
 
  const styles = StyleSheet.create({
    container: {
      marginTop: 16,
      marginBottom: 16,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fbbf24',
      backgroundColor: '#fef3c7',
    },
    text: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 8,
      flex: 1,
      color: '#92400e',
    },
    note: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      marginLeft: 4,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      backgroundColor: colors.primary + '10',
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      marginLeft: 8,
      color: colors.primary,
    },
  })

  if (checkingMarks) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            Checking for existing marks...
          </ThemedText>
        </View>
      </View>
    )
  }

  if (!marksExist || !marksExist.exists) return null

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Feather name="alert-triangle" size={16} color="#92400e" />
        <ThemedText style={styles.text}>
          Marks already uploaded for {marksExist.totalMarked}/{marksExist.totalStudents} students
          {marksExist.uploadedBy && ` by ${marksExist.uploadedBy}`}
        </ThemedText>
      </View>
      <ThemedText style={styles.note}>
        You can override by submitting again
      </ThemedText>
    </View>
  )
})

// Student List Item Component - Redesigned
const StudentListItem = React.memo(({
  student,
  markValue,
  totalMarks,
  onMarkChange,
  onAbsentChange,
  index,
  marksExist = false,
  isAbsent = false
}) => {
  const { colors } = useTheme()
 
  const numericValue = parseFloat(markValue)
  const isInvalid = markValue.trim() !== '' && (isNaN(numericValue) || numericValue < 0 || numericValue > parseFloat(totalMarks))
  
  const styles = StyleSheet.create({
    studentCard: {
      backgroundColor: marksExist ? '#fff7ed' : colors.cardBackground,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: marksExist ? '#fb923c' : (isInvalid ? '#fca5a5' : colors.border),
      borderLeftWidth: 3,
      borderLeftColor: marksExist ? '#fb923c' : colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      minHeight: 110,
    },
    cardContent: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    rollNumberBadge: {
      backgroundColor: marksExist ? '#fed7aa' : (isInvalid ? '#fee2e2' : '#dbeafe'),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 10,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rollNumberText: {
      fontSize: 14,
      fontFamily: 'Poppins-Bold',
      color: marksExist ? '#c2410c' : (isInvalid ? '#dc2626' : '#1e40af')
    },
    studentName: {
      flex: 1,
      fontSize: 16,
      color: marksExist ? '#c2410c' : colors.text,
      fontFamily: 'Poppins-SemiBold',
      paddingTop: 2,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    absentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    absentLabel: {
      fontSize: 14,
      color: isAbsent ? '#dc2626' : colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginRight: 10,
    },
    marksContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
    },
    marksInput: {
      width: 70,
      borderWidth: 1,
      borderColor: isAbsent ? '#d1d5db' : (marksExist ? '#fb923c' : (isInvalid ? '#dc2626' : colors.border)),
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 16,
      color: isAbsent ? '#9ca3af' : (marksExist ? '#c2410c' : (isInvalid ? '#dc2626' : colors.text)),
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      backgroundColor: isAbsent ? '#f3f4f6' : (marksExist ? '#fed7aa' : (isInvalid ? '#fef2f2' : colors.inputBackground)),
    },
  })

  return (
    <View style={styles.studentCard}>
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <View style={styles.rollNumberBadge}>
            <ThemedText style={styles.rollNumberText}>#{student.rollNo || index + 1}</ThemedText>
          </View>
          <ThemedText style={styles.studentName} numberOfLines={2}>
            {student.name}
          </ThemedText>
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.absentContainer}>
            <ThemedText style={styles.absentLabel}>Absent:</ThemedText>
            <Switch
              value={isAbsent}
              onValueChange={(value) => onAbsentChange(student.id, value)}
              trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
              thumbColor={isAbsent ? '#dc2626' : '#f8fafc'}
              ios_backgroundColor="#d1d5db"
              style={{ transform: Platform.OS === 'ios' ? [{ scale: 0.8 }] : [] }}
            />
          </View>
          
          <View style={styles.marksContainer}>
            <TextInput
              style={styles.marksInput}
              value={markValue}
              onChangeText={(value) => onMarkChange(student.id, value)}
              placeholder="Marks"
              placeholderTextColor={isAbsent ? '#9ca3af' : (marksExist ? '#fb923c' : colors.textSecondary)}
              keyboardType="decimal-pad"
              maxLength={6}
              editable={!isAbsent}
            />
          </View>
        </View>
      </View>
    </View>
  )
})

// Students Loading Skeleton Component
const StudentsLoadingSkeleton = React.memo(() => {
  const { colors } = useTheme()
 
  const styles = StyleSheet.create({
    loadingCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
      minHeight: 110,
    },
    cardContent: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    rollNumberBadge: {
      width: 40,
      height: 30,
      borderRadius: 12,
      marginRight: 10,
      backgroundColor: colors.border + '50',
    },
    studentName: {
      flex: 1,
      height: 20,
      backgroundColor: colors.border + '50',
      borderRadius: 4,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    absentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    absentLabel: {
      height: 16,
      width: 50,
      backgroundColor: colors.border + '30',
      borderRadius: 4,
      marginRight: 10,
    },
    switchSkeleton: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.border + '50',
    },
    marksContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
    },
    marksInput: {
      width: 100,
      height: 40,
      backgroundColor: colors.border + '50',
      borderRadius: 8,
    },
  })

  return (
    <View style={styles.loadingCard}>
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <View style={styles.rollNumberBadge} />
          <View style={styles.studentName} />
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.absentContainer}>
            <View style={styles.absentLabel} />
            <View style={styles.switchSkeleton} />
          </View>
          <View style={styles.marksContainer}>
            <View style={styles.marksInput} />
          </View>
        </View>
      </View>
    </View>
  )
})

// Main Component
export default function UploadMarks({ visible, onClose }) {
  const { colors } = useTheme()
 
  // Get employee from Redux
  const employee = useSelector(state => state.employee.employee)
  const uploadedBy = useMemo(() =>
    employee ? `${employee.firstName} ${employee.lastName}` : 'Teacher',
    [employee]
  )
 
  // State for dropdown selections
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [examType, setExamType] = useState('formative-1')
  const [subject, setSubject] = useState('mathematics')
  const [totalMarks, setTotalMarks] = useState('100')
 
  // State for marks data
  const [marks, setMarks] = useState({})
  const [absences, setAbsences] = useState({})
  const [students, setStudents] = useState([])
  const [marksExist, setMarksExist] = useState(null)
 
  // State for loading and errors
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [hasLoadedStudents, setHasLoadedStudents] = useState(false)
  const [checkingMarks, setCheckingMarks] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
 
  // State for modals and toasts
  const [toast, setToast] = useState(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideData, setOverrideData] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // State for keyboard visibility
  const [keyboardVisible, setKeyboardVisible] = useState(false)
 
  // State for classes and sections
  const [classesAndSections, setClassesAndSections] = useState({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])

  // Refs to prevent unnecessary API calls
  const hasLoadedClassesRef = useRef(false)
  const prevSelectionsRef = useRef({
    class: null,
    section: null,
    examType: 'formative-1',
    subject: 'mathematics'
  })
  const isFetchingStudentsRef = useRef(false)
  const fetchTimeoutRef = useRef(null)
  const isFirstLoadRef = useRef(true)
  const scrollViewRef = useRef(null)
  const checkMarksTimeoutRef = useRef(null)

  // Memoized exam types and subjects
  const examTypes = useMemo(() => [
    { label: 'Formative Assessment 1', value: 'formative-1' },
    { label: 'Formative Assessment 2', value: 'formative-2' },
    { label: 'Formative Assessment 3', value: 'formative-3' },
    { label: 'Summative Assessment 1', value: 'summative-1' },
    { label: 'Summative Assessment 2', value: 'summative-2' },
    { label: 'Pre-Final Exam 1', value: 'pre-final-1' },
    { label: 'Pre-Final Exam 2', value: 'pre-final-2' },
    { label: 'Pre-Final Exam 3', value: 'pre-final-3' },
    { label: 'Final Examination', value: 'final' },
  ], [])

  const subjects = useMemo(() => [
    { label: 'Telugu', value: 'telugu' },
    { label: 'Mathematics', value: 'mathematics' },
    { label: 'Science', value: 'science' },
    { label: 'English', value: 'english' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Social Studies', value: 'social' },
    { label: 'Computer Science', value: 'computers' },
    { label: 'Physics', value: 'physics' },
    { label: 'Biology', value: 'biology' },
  ], [])

  // Toast notification functions
  const showToast = useCallback((message, type = 'error', duration = 3000) => {
    setToast({ message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Function to clear all marks
  const clearMarks = useCallback(() => {
    const clearedMarks = {}
    const clearedAbsences = {}
    students.forEach(student => {
      clearedMarks[student.id] = ''
      clearedAbsences[student.id] = false
    })
    setMarks(clearedMarks)
    setAbsences(clearedAbsences)
    setMarksExist(null)
  }, [students])

  // Function to load classes and sections from API
  const loadClassesAndSections = useCallback(async () => {
    if (hasLoadedClassesRef.current) return
    
    try {
      setIsLoadingClasses(true)
      const response = await axiosApi.get('/students/classes-sections')
     
      if (response.data.success) {
        const classesData = response.data.data
        setClassesAndSections(classesData)
       
        // Transform the data for dropdown
        const classesArray = Object.keys(classesData).map(className => {
          let classValue = className
          if (className.startsWith('Class ')) {
            classValue = className.split(' ')[1]
          }
         
          return {
            label: className,
            value: classValue
          }
        })
       
        // Sort classes properly
        const sortedClasses = classesArray.sort((a, b) => {
          const specialOrder = {
            'Pre-Nursery': 0,
            'Nursery': 1,
            'LKG': 2,
            'UKG': 3
          }
         
          const orderA = specialOrder[a.value] !== undefined ? specialOrder[a.value] :
                        specialOrder[a.label] !== undefined ? specialOrder[a.label] : 4
          const orderB = specialOrder[b.value] !== undefined ? specialOrder[b.value] :
                        specialOrder[b.label] !== undefined ? specialOrder[b.label] : 4
         
          if (orderA === 4 && orderB === 4) {
            const numA = parseInt(a.value) || parseInt(a.label?.split(' ')[1]) || 100
            const numB = parseInt(b.value) || parseInt(b.label?.split(' ')[1]) || 100
            return numA - numB
          }
         
          return orderA - orderB
        })
       
        setClasses(sortedClasses)
       
        // Set first class and section by default if none selected
        if (sortedClasses.length > 0 && !selectedClass) {
          const firstClass = sortedClasses[0]
          setSelectedClass(firstClass.value)
         
          const firstClassSections = classesData[firstClass.label] || ['A']
          const sectionsArray = firstClassSections.map(section => ({
            label: section,
            value: section
          }))
          setSections(sectionsArray)
          setSelectedSection(firstClassSections[0])
          
          // Update prev selections ref
          prevSelectionsRef.current = {
            ...prevSelectionsRef.current,
            class: firstClass.value,
            section: firstClassSections[0]
          }
        }
       
        hasLoadedClassesRef.current = true
      } else {
        throw new Error(response.data.message || 'Failed to load classes and sections')
      }
    } catch (err) {
      console.error('Error loading classes and sections:', err)
     
      // Fallback to hardcoded classes
      const fallbackClasses = [
        { label: 'Pre-Nursery', value: 'Pre-Nursery' },
        { label: 'Nursery', value: 'Nursery' },
        { label: 'LKG', value: 'LKG' },
        { label: 'UKG', value: 'UKG' },
        { label: 'Class 1', value: '1' },
        { label: 'Class 2', value: '2' },
        { label: 'Class 3', value: '3' },
        { label: 'Class 4', value: '4' },
        { label: 'Class 5', value: '5' },
        { label: 'Class 6', value: '6' },
        { label: 'Class 7', value: '7' },
        { label: 'Class 8', value: '8' },
        { label: 'Class 9', value: '9' },
        { label: 'Class 10', value: '10' },
        { label: 'Class 11', value: '11' },
        { label: 'Class 12', value: '12' },
      ]
     
      const fallbackClassSections = {
        'Pre-Nursery': ['A', 'B'],
        'Nursery': ['A', 'B'],
        'LKG': ['A', 'B'],
        'UKG': ['A', 'B'],
        'Class 1': ['A', 'B'],
        'Class 2': ['A', 'B'],
        'Class 3': ['A', 'B'],
        'Class 4': ['A', 'B'],
        'Class 5': ['A', 'B'],
        'Class 6': ['A', 'B'],
        'Class 7': ['A', 'B'],
        'Class 8': ['A', 'B'],
        'Class 9': ['A', 'B'],
        'Class 10': ['A', 'B'],
        'Class 11': ['A', 'B'],
        'Class 12': ['A', 'B'],
      }
     
      setClasses(fallbackClasses)
      setClassesAndSections(fallbackClassSections)
     
      if (fallbackClasses.length > 0 && !selectedClass) {
        const firstClass = fallbackClasses[0]
        setSelectedClass(firstClass.value)
       
        const firstClassSections = fallbackClassSections[firstClass.label] || ['A']
        const sectionsArray = firstClassSections.map(section => ({
          label: section,
          value: section
        }))
        setSections(sectionsArray)
        setSelectedSection(firstClassSections[0])
        
        // Update prev selections ref
        prevSelectionsRef.current = {
          ...prevSelectionsRef.current,
          class: firstClass.value,
          section: firstClassSections[0]
        }
      }
      
      hasLoadedClassesRef.current = true
    } finally {
      setIsLoadingClasses(false)
    }
  }, [selectedClass])

  // Function to update sections based on selected class
  const updateSectionsForClass = useCallback((className) => {
    if (!className || !classesAndSections || Object.keys(classesAndSections).length === 0) {
      return
    }
   
    const classItem = classes.find(c => c.value === className)
    if (!classItem) return
   
    const classLabel = classItem.label
    const classSections = classesAndSections[classLabel] || ['A']
   
    const sectionsArray = classSections.map(section => ({
      label: section,
      value: section
    }))
    setSections(sectionsArray)
   
    // If current section is not in new sections, reset to first section
    if (!selectedSection || !classSections.includes(selectedSection)) {
      setSelectedSection(classSections[0])
    }
  }, [classes, classesAndSections, selectedSection])

  // Function to fetch students for the selected class-section
  const fetchStudents = useCallback(async (forceRefresh = false) => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    
    // Check if we're already fetching
    if (isFetchingStudentsRef.current && !forceRefresh) {
      return
    }
    
    // Check if class and section are selected
    if (!selectedClass || !selectedSection) {
      setHasLoadedStudents(false)
      return
    }
    
    // Check if selections have actually changed
    const selectionsChanged = 
      prevSelectionsRef.current.class !== selectedClass ||
      prevSelectionsRef.current.section !== selectedSection
    
    if (!selectionsChanged && !forceRefresh && hasLoadedStudents) {
      return
    }
    
    // Update ref to prevent multiple calls
    prevSelectionsRef.current = {
      ...prevSelectionsRef.current,
      class: selectedClass,
      section: selectedSection
    }
    
    isFetchingStudentsRef.current = true
    setIsLoadingStudents(true)
    setError(null)
    setHasLoadedStudents(false)
    setMarksExist(null) // Clear marks exist when fetching new students
   
    try {
      const response = await axiosApi.get('/marks/students', {
        params: {
          className: selectedClass,
          section: selectedSection,
        }
      })
      
      if (response.data.success) {
        const formattedStudents = response.data.data.map(student => ({
          id: student.id,
          name: student.fullName || `${student.firstName} ${student.lastName}`.trim(),
          rollNo: student.rollNo || '',
        }))
        setStudents(formattedStudents)
       
        // Initialize marks and absences for all students
        const initialMarks = {}
        const initialAbsences = {}
        formattedStudents.forEach(student => {
          initialMarks[student.id] = ''
          initialAbsences[student.id] = false
        })
        setMarks(initialMarks)
        setAbsences(initialAbsences)
        
        // Set flag that students have been loaded
        setHasLoadedStudents(true)
        
        // Only show success toast if it's a manual refresh and not first load
        if (forceRefresh && !isFirstLoadRef.current) {
          showToast(`${formattedStudents.length} students loaded`, 'success', 2000)
        }
        
        isFirstLoadRef.current = false
      } else {
        const errorMsg = response.data.message || 'Failed to fetch students'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        setStudents([])
        setHasLoadedStudents(true) // Still set to true to avoid showing loading
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      const errorMsg = err.response?.data?.message || 'Network error. Please try again.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setStudents([])
      setHasLoadedStudents(true) // Still set to true to avoid showing loading
    } finally {
      setIsLoadingStudents(false)
      isFetchingStudentsRef.current = false
      setRefreshing(false)
    }
  }, [selectedClass, selectedSection, hasLoadedStudents, showToast])

  // Function to check if marks already exist (only when students are loaded)
  const checkMarksExist = useCallback(async () => {
    // Don't check if we don't have all required data or students haven't loaded
    if (!selectedClass || !selectedSection || !examType || !subject || !hasLoadedStudents || students.length === 0) {
      return
    }
    
    // Clear any existing timeout
    if (checkMarksTimeoutRef.current) {
      clearTimeout(checkMarksTimeoutRef.current)
    }
    
    // Don't check if selections haven't changed
    const selectionsChanged = 
      prevSelectionsRef.current.examType !== examType ||
      prevSelectionsRef.current.subject !== subject
    
    if (!selectionsChanged && marksExist !== null) {
      return
    }
    
    // Update ref
    prevSelectionsRef.current = {
      ...prevSelectionsRef.current,
      examType,
      subject
    }
    
    // Debounce the check by 500ms
    checkMarksTimeoutRef.current = setTimeout(async () => {
      setCheckingMarks(true)
     
      try {
        const response = await axiosApi.get('/marks/check', {
          params: {
            examType,
            subject,
            className: selectedClass,
            section: selectedSection
          }
        })
        
        if (response.data.success) {
          setMarksExist(response.data.data)
         
          if (response.data.data.exists) {
            loadExistingMarks(response.data.data)
          }
        }
      } catch (err) {
        console.error('Error checking marks:', err)
        // Don't clear marks on error, just don't update marksExist
      } finally {
        setCheckingMarks(false)
      }
    }, 500)
  }, [selectedClass, selectedSection, examType, subject, hasLoadedStudents, students.length, marksExist, loadExistingMarks])

  // Function to load existing marks
  const loadExistingMarks = useCallback((existingData) => {
    if (!existingData.markedStudents || !students.length) return
    
    const newMarks = {}
    const newAbsences = {}
   
    existingData.markedStudents.forEach(markedStudent => {
      newMarks[markedStudent.studentId] = markedStudent.marks?.toString() || ''
      newAbsences[markedStudent.studentId] = markedStudent.isAbsent || false
    })
   
    // Fill in any missing students as empty strings
    students.forEach(student => {
      if (!(student.id in newMarks)) {
        newMarks[student.id] = ''
        newAbsences[student.id] = false
      }
    })
   
    setMarks(newMarks)
    setAbsences(newAbsences)
  }, [students])

  // Function to update UI for override theme
  const updateUIForOverride = useCallback((existingData) => {
    // Animate the UI change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    
    // Update marks exist state with new data
    setMarksExist(prev => ({
      ...prev,
      ...existingData,
      exists: true
    }))
    
    // Update marks and absences if needed
    if (existingData.markedStudents) {
      const newMarks = { ...marks }
      const newAbsences = { ...absences }
      
      existingData.markedStudents.forEach(markedStudent => {
        newMarks[markedStudent.studentId] = markedStudent.marks?.toString() || ''
        newAbsences[markedStudent.studentId] = markedStudent.isAbsent || false
      })
      
      setMarks(newMarks)
      setAbsences(newAbsences)
    }
  }, [marks, absences])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      if (checkMarksTimeoutRef.current) {
        clearTimeout(checkMarksTimeoutRef.current)
      }
      // Reset refs
      hasLoadedClassesRef.current = false
      isFetchingStudentsRef.current = false
      isFirstLoadRef.current = true
    }
  }, [])

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true)
      }
    )
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false)
      }
    )
    
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  // Load classes and sections when modal opens
  useEffect(() => {
    if (visible && !hasLoadedClassesRef.current) {
      loadClassesAndSections()
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      if (checkMarksTimeoutRef.current) {
        clearTimeout(checkMarksTimeoutRef.current)
      }
    }
  }, [visible, loadClassesAndSections])

  // Update sections when class changes
  useEffect(() => {
    if (selectedClass && Object.keys(classesAndSections).length > 0) {
      updateSectionsForClass(selectedClass)
    }
  }, [selectedClass, classesAndSections, updateSectionsForClass])

  // Fetch students when class or section changes (with debounce)
  useEffect(() => {
    if (visible && selectedClass && selectedSection && !isLoadingClasses) {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      
      // Debounce the fetch to prevent rapid calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchStudents()
      }, 300)
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [visible, selectedClass, selectedSection, isLoadingClasses, fetchStudents])

  // Check marks exist when criteria changes (only after students are loaded)
  useEffect(() => {
    if (visible && selectedClass && selectedSection && examType && subject && hasLoadedStudents && students.length > 0) {
      checkMarksExist()
    }
    
    return () => {
      if (checkMarksTimeoutRef.current) {
        clearTimeout(checkMarksTimeoutRef.current)
      }
    }
  }, [visible, selectedClass, selectedSection, examType, subject, hasLoadedStudents, students.length, checkMarksExist])

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    if (selectedClass && selectedSection) {
      fetchStudents(true) // Force refresh
    } else {
      setRefreshing(false)
    }
  }, [selectedClass, selectedSection, fetchStudents])

  // Update marks when total marks changes
  const handleTotalMarksChange = useCallback((value) => {
    const cleanedValue = value.replace(/[^0-9]/g, '')
    setTotalMarks(cleanedValue)
   
    const numericTotal = parseFloat(cleanedValue) || 0
    if (numericTotal > 0) {
      const updatedMarks = { ...marks }
      let hasInvalidMarks = false
     
      Object.keys(updatedMarks).forEach(studentId => {
        const markValue = updatedMarks[studentId]
        if (markValue && !absences[studentId]) {
          const numericMark = parseFloat(markValue)
          if (!isNaN(numericMark) && numericMark > numericTotal) {
            updatedMarks[studentId] = numericTotal.toString()
            hasInvalidMarks = true
          }
        }
      })
     
      if (hasInvalidMarks) {
        setMarks(updatedMarks)
        showToast(`Some marks were adjusted to fit new total of ${numericTotal}`, 'warning')
      }
    }
  }, [marks, absences, showToast])

  // Update individual student marks
  const updateStudentMarks = useCallback((studentId, value) => {
    // If student is absent, clear the marks
    if (absences[studentId]) {
      setMarks(prev => ({
        ...prev,
        [studentId]: ''
      }))
      return
    }
    
    const cleanedValue = value.replace(/[^0-9.]/g, '')
   
    const numericValue = parseFloat(cleanedValue)
    const numericTotal = parseFloat(totalMarks)
   
    if (!isNaN(numericValue) && numericValue > numericTotal) {
      showToast(`Marks cannot exceed total marks (${totalMarks})`, 'error')
      return
    }
   
    setMarks(prev => ({
      ...prev,
      [studentId]: cleanedValue
    }))
  }, [totalMarks, absences, showToast])

  // Update student absent status
  const updateStudentAbsent = useCallback((studentId, isAbsent) => {
    setAbsences(prev => ({
      ...prev,
      [studentId]: isAbsent
    }))
    
    // If marked as absent, clear the marks
    if (isAbsent) {
      setMarks(prev => ({
        ...prev,
        [studentId]: ''
      }))
    }
  }, [])

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    const marksArray = Object.values(marks)
      .map(value => parseFloat(value))
      .filter(value => !isNaN(value) && value !== '')
    
    const absentCount = Object.values(absences).filter(isAbsent => isAbsent).length
    const totalCount = students.length
    const filledCount = marksArray.length + absentCount
   
    if (filledCount === 0) return null
   
    const total = marksArray.reduce((sum, mark) => sum + mark, 0)
    const average = marksArray.length > 0 ? total / marksArray.length : 0
    const max = marksArray.length > 0 ? Math.max(...marksArray) : 0
    const min = marksArray.length > 0 ? Math.min(...marksArray) : 0
   
    return {
      average: average.toFixed(2),
      max,
      min,
      filledCount,
      totalCount,
      absentCount,
      percentage: ((filledCount / totalCount) * 100).toFixed(1)
    }
  }, [marks, absences, students.length])

  // Handle save/upload marks
  const handleSave = async () => {
    // Validate total marks
    const totalMarksValue = parseFloat(totalMarks)
    if (isNaN(totalMarksValue) || totalMarksValue <= 0) {
      showToast('Please enter a valid total marks', 'error')
      return
    }
    
    // Validate all marks (only for non-absent students)
    const marksArray = Object.entries(marks)
    const invalidMarks = marksArray.filter(([studentId, markValue]) => {
      if (absences[studentId]) return false // Skip absent students
      const numericValue = parseFloat(markValue)
      return markValue.trim() === '' || isNaN(numericValue) || numericValue < 0 || numericValue > totalMarksValue
    })
   
    if (invalidMarks.length > 0) {
      showToast(`Please enter valid marks (0-${totalMarksValue}) for all present students`, 'error')
      return
    }
    
    if (students.length === 0) {
      showToast('No students found to upload marks', 'error')
      return
    }
   
    // Prepare marks data for backend
    const studentMarks = Object.entries(marks).map(([studentId, markValue]) => ({
      studentId: studentId.toString(),
      marks: absences[studentId] ? 0 : parseFloat(markValue || 0),
      isAbsent: absences[studentId]
    }))
   
    setSaving(true)
   
    try {
      const response = await axiosApi.post('/marks/upload', {
        examType,
        subject,
        className: selectedClass,
        section: selectedSection,
        totalMarks: totalMarksValue,
        studentMarks,
        uploadedBy
      })
      
      if (response.data.success) {
        // Immediately update UI for override theme
        updateUIForOverride({
          exists: true,
          totalMarked: response.data.data.processed,
          totalStudents: students.length,
          uploadedBy: uploadedBy
        })
        
        showToast(`Marks uploaded for ${response.data.data.processed} student${response.data.data.processed > 1 ? 's' : ''}`, 'success')
      } else {
        showToast(response.data.message || 'Failed to upload marks', 'error')
      }
    } catch (error) {
      if (error.response?.data?.canOverride) {
        // Show override confirmation modal
        setOverrideData({
          studentMarks,
          markedCount: error.response.data.data.totalMarked,
          examName: error.response.data.data.examTypeDisplay || examTypes.find(e => e.value === examType)?.label || examType,
          subject: error.response.data.data.subjectDisplay || subjects.find(s => s.value === subject)?.label || subject,
          className: selectedClass,
          section: selectedSection,
          uploadedBy: error.response.data.data.uploadedBy || uploadedBy,
          existingData: error.response.data.data
        })
        setShowOverrideModal(true)
      } else {
        showToast(
          error.response?.data?.message || 'Failed to upload marks. Please try again.',
          'error'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // Handle override confirm
  const handleOverrideConfirm = async () => {
    if (!overrideData) return
   
    setSaving(true)
    setShowOverrideModal(false)
   
    try {
      const response = await axiosApi.put('/marks/override', {
        examType,
        subject,
        className: selectedClass,
        section: selectedSection,
        totalMarks: parseFloat(totalMarks),
        studentMarks: overrideData.studentMarks,
        uploadedBy
      })
      
      if (response.data.success) {
        // Immediately update UI for override theme
        updateUIForOverride({
          exists: true,
          totalMarked: response.data.data.markedCount,
          totalStudents: students.length,
          uploadedBy: uploadedBy
        })
        
        showToast(`Marks overridden for ${response.data.data.markedCount} student${response.data.data.markedCount > 1 ? 's' : ''}`, 'success')
      } else {
        showToast(response.data.message || 'Failed to override marks', 'error')
      }
    } catch (error) {
      console.error('Error overriding marks:', error)
      showToast(
        error.response?.data?.message || 'Failed to override marks. Please try again.',
        'error'
      )
    } finally {
      setSaving(false)
      setOverrideData(null)
    }
  }

  const handleOverrideCancel = () => {
    setShowOverrideModal(false)
    setOverrideData(null)
  }

  // Handle delete marks
  const handleDeleteMarks = async () => {
    if (deleting) return
    
    if (!selectedClass || !selectedSection || !examType || !subject) {
      showToast('Please select class, section, exam type, and subject', 'error')
      return
    }
    
    if (!marksExist?.exists) {
      showToast('No marks found to delete', 'warning')
      setShowDeleteModal(false)
      return
    }
    
    setDeleting(true)
   
    try {
      const payload = {
        examType,
        subject,
        className: selectedClass,
        section: selectedSection,
        confirm: true
      }
     
      const response = await axiosApi.delete('/marks/class-section/batch', { data: payload })
      
      if (response.data.success) {
        showToast(`${subject} marks deleted successfully for ${response.data.data.results?.deletedCount || 0} students`, 'success')
       
        // Clear marks and refresh
        clearMarks()
        setMarksExist(null) // Clear marks exist state
       
        setTimeout(() => {
          setShowDeleteModal(false)
        }, 500)
      } else {
        showToast(response.data.message || 'Failed to delete marks', 'error')
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Error deleting marks:', error.response?.data || error)
     
      let errorMessage = 'Failed to delete marks. Please try again.'
     
      if (error.response?.status === 404) {
        errorMessage = 'Marks not found. They may have already been deleted.'
        clearMarks()
        setMarksExist(null)
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid request. Please check your selections.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network connection error. Please check your internet connection.'
      }
     
      showToast(errorMessage, 'error')
      setShowDeleteModal(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleting) return
    setShowDeleteModal(true)
  }

  const handleDeleteCancel = () => {
    if (deleting) return
    setShowDeleteModal(false)
  }

  // Render students list
  const renderStudents = useCallback(() => {
    if (isLoadingClasses) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            Loading classes and sections...
          </ThemedText>
        </View>
      )
    }
    
    // Show loading skeleton only when actively loading students
    if (isLoadingStudents && !hasLoadedStudents) {
      return (
        <View style={styles.studentListContainer}>
          {[...Array(5)].map((_, index) => (
            <StudentsLoadingSkeleton key={`skeleton-${index}`} />
          ))}
        </View>
      )
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={40} color="#dc2626" />
          <ThemedText style={styles.errorText}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchStudents(true)}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )
    }
    
    // Only show "No students found" if we've finished loading and have no students
    if (hasLoadedStudents && students.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="users" size={40} color={colors.textSecondary} />
          <ThemedText style={styles.noStudentsText}>
            {selectedClass && selectedSection ? `No students found for ${selectedClass}-${selectedSection}` : 'Please select class and section'}
          </ThemedText>
          {selectedClass && selectedSection && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchStudents(true)}
            >
              <ThemedText style={styles.retryButtonText}>Retry Loading</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )
    }
    
    // Show students if we have them
    if (hasLoadedStudents && students.length > 0) {
      return (
        <>
          {students.map((student, index) => (
            <StudentListItem
              key={student.id}
              student={student}
              markValue={marks[student.id] || ''}
              totalMarks={totalMarks}
              onMarkChange={updateStudentMarks}
              onAbsentChange={updateStudentAbsent}
              index={index}
              marksExist={marksExist?.exists}
              isAbsent={absences[student.id] || false}
            />
          ))}
        </>
      )
    }
    
    // Show nothing if we haven't loaded yet
    return null
  }, [
    isLoadingClasses, isLoadingStudents, hasLoadedStudents, error, students, marks, absences, totalMarks,
    colors, selectedClass, selectedSection, updateStudentMarks, updateStudentAbsent, 
    fetchStudents, marksExist
  ])

  // Get header gradient colors
  const getHeaderGradientColors = useCallback(() => {
    if (marksExist?.exists) {
      return ['#d85e00', '#d94206']
    }
    return [colors.gradientStart, colors.gradientEnd]
  }, [marksExist, colors])

  // Get save button gradient colors
  const getSaveButtonGradientColors = useCallback(() => {
    if (marksExist?.exists) {
      return ['#d85e00', '#d94206']
    }
    return [colors.gradientStart, colors.gradientEnd]
  }, [marksExist, colors])

  // Get header subtitle
  const getHeaderSubtitle = useCallback(() => {
    if (marksExist?.exists && marksExist?.uploadedBy) {
      return `Already uploaded by: ${marksExist.uploadedBy}`
    }
    return `Will be uploaded by: ${uploadedBy}`
  }, [marksExist, uploadedBy])

  // Render header delete button
  const renderHeaderMoreButton = useCallback(() => {
    if (!marksExist?.exists || deleting) return <View style={{ width: 44 }} />
   
    return (
      <TouchableOpacity
        style={[
          styles.moreButton,
          { opacity: deleting ? 0.5 : 1 }
        ]}
        onPress={handleDeleteConfirm}
        activeOpacity={0.7}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    )
  }, [marksExist, deleting, handleDeleteConfirm])

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
    moreButton: {
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
    },
    subtitle: {
      textAlign: 'center',
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: 400, 
    },
    card: {
      flex: 1,
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    formGroup: {
      // marginBottom: 22,
    },
    groupTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary + '30',
    },
    groupTitleChip: {
      paddingHorizontal: 0,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    groupTitleText: {
      fontSize: 16,
      color: colors.primary,
      letterSpacing: 0.5,
    },
    fieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    classSectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    classDropdown: {
      width: '69%',
    },
    sectionDropdown: {
      width: '29%',
    },
    examTypeRow: {
      marginBottom: 16,
    },
    subjectMarksRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    subjectDropdown: {
      width: '59%',
    },
    totalMarksWrapper: {
      width: '39%',
    },
    totalMarksLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Poppins-SemiBold',
    },
    totalMarksInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      borderTopRightRadius: 22,
      borderBottomRightRadius: 22,
      paddingHorizontal: 12,
      height: 50,
    },
    totalMarksInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      color: colors.text,
      textAlign: 'center',
      fontSize: 14,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    errorText: {
      textAlign: 'center',
      color: '#dc2626',
      marginTop: 12,
      fontSize: 14,
      paddingHorizontal: 20,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    noStudentsText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 20,
      fontSize: 14,
    },
    studentListContainer: {
      marginTop: 10,
    },
    footerWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerCard: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    saveBtnGradient: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnPressable: {
      flex: 1,
      width: '100%',
      height: '100%',
      paddingVertical: 16,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      marginLeft: 10,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      minWidth: 200,
    },
  })

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
        onShow={() => {
          // Reset states when modal opens
          setError(null)
          setMarksExist(null)
          setHasLoadedStudents(false)
          // Reset refs
          hasLoadedClassesRef.current = false
          isFetchingStudentsRef.current = false
          isFirstLoadRef.current = true
          
          // Load classes if not already loaded
          if (classes.length === 0) {
            loadClassesAndSections()
          }
        }}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <LinearGradient
            colors={getHeaderGradientColors()}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText type='subtitle' style={styles.title}>Upload Marks</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {getHeaderSubtitle()}
                  </ThemedText>
                </View>
                {renderHeaderMoreButton()}
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Checking marks overlay - only show if actively checking and students are loaded */}
          {checkingMarks && hasLoadedStudents && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingText}>
                  Checking for existing marks...
                </ThemedText>
              </View>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <View style={styles.groupTitleContainer}>
                  <View style={styles.groupTitleChip}>
                    <MaterialIcons name="school" size={22} color={colors.primary} />
                    <ThemedText type='subtitle' style={styles.groupTitleText}>
                      Exam Details
                    </ThemedText>
                  </View>
                </View>
                {/* Class & Section Row (70% Class, 30% Section) */}
                <View style={styles.classSectionRow}>
                  <View style={styles.classDropdown}>
                    <ThemedText style={styles.fieldLabel}>Class</ThemedText>
                    <CustomDropdown
                      value={selectedClass}
                      items={classes}
                      onSelect={(value) => {
                        setSelectedClass(value)
                        clearMarks() // Clear marks when class changes
                      }}
                      placeholder="Select Class"
                      isLoading={isLoadingClasses}
                      width="100%"
                      showIcon={true}
                    />
                  </View>
                  <View style={styles.sectionDropdown}>
                    <ThemedText style={styles.fieldLabel}>Section</ThemedText>
                    <CustomDropdown
                      value={selectedSection}
                      items={sections}
                      onSelect={(value) => {
                        setSelectedSection(value)
                        clearMarks() // Clear marks when section changes
                      }}
                      placeholder="Select Section"
                      isLoading={isLoadingClasses}
                      width="100%"
                      showIcon={false}
                    />
                  </View>
                </View>
                {/* Exam Type Row (Full Width) */}
                <View style={styles.examTypeRow}>
                  <ThemedText style={styles.fieldLabel}>Exam Type</ThemedText>
                  <CustomDropdown
                    value={examType}
                    items={examTypes}
                    onSelect={(value) => {
                      setExamType(value)
                      clearMarks() // Clear marks when exam type changes
                    }}
                    placeholder="Select Exam Type"
                    width="100%"
                    showIcon={true}
                  />
                </View>
                {/* Subject & Total Marks Row (60% Subject, 40% Marks) */}
                <View style={styles.subjectMarksRow}>
                  <View style={styles.subjectDropdown}>
                    <ThemedText style={styles.fieldLabel}>Subject</ThemedText>
                    <CustomDropdown
                      value={subject}
                      items={subjects}
                      onSelect={(value) => {
                        setSubject(value)
                        clearMarks() // Clear marks when subject changes
                      }}
                      placeholder="Select Subject"
                      width="100%"
                      showIcon={true}
                    />
                  </View>
                  <View style={styles.totalMarksWrapper}>
                    <ThemedText style={styles.totalMarksLabel}>Total Marks</ThemedText>
                    <View style={styles.totalMarksInputWrapper}>
                      <TextInput
                        style={styles.totalMarksInput}
                        value={totalMarks}
                        onChangeText={handleTotalMarksChange}
                        keyboardType="number-pad"
                        maxLength={3}
                        placeholder="100"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              </View>
              <ExistingMarksStatus marksExist={marksExist} checkingMarks={false} />
              <StatisticsCard statistics={calculateStatistics()} />
              <View style={styles.formGroup}>
                <View style={styles.groupTitleContainer}>
                  <View style={styles.groupTitleChip}>
                    <Feather name="users" size={22} color={colors.primary} />
                    <ThemedText type='subtitle' style={styles.groupTitleText}>
                      Enter Marks for Students
                      {hasLoadedStudents && students.length > 0 && (
                        <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
                          {' '}({students.length} students)
                        </ThemedText>
                      )}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.studentListContainer}>
                  {renderStudents()}
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.footerWrapper}>
            <View style={styles.footerCard}>
              <LinearGradient
                colors={getSaveButtonGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.9}
                  style={styles.saveBtnPressable}
                  disabled={saving || isLoadingStudents || isLoadingClasses || deleting || refreshing || checkingMarks || !hasLoadedStudents}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome5 name="upload" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.saveBtnText}>
                        {marksExist?.exists ? 'Override Marks' : 'Upload Marks'}
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
          
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
      {/* Override Confirmation Modal */}
      <OverrideConfirmationModal
        visible={showOverrideModal}
        onConfirm={handleOverrideConfirm}
        onCancel={handleOverrideCancel}
        markedCount={overrideData?.markedCount || 0}
        examName={overrideData?.examName || ''}
        subject={overrideData?.subject || ''}
        className={overrideData?.className || selectedClass}
        section={overrideData?.section || selectedSection}
        uploadedBy={overrideData?.uploadedBy || uploadedBy}
      />
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onConfirm={handleDeleteMarks}
        onCancel={handleDeleteCancel}
        examName={examTypes.find(e => e.value === examType)?.label || examType}
        subject={subjects.find(s => s.value === subject)?.label || subject}
        className={selectedClass}
        section={selectedSection}
        uploadedBy={marksExist?.uploadedBy || uploadedBy}
        isDeleting={deleting}
      />
    </>
  )
}