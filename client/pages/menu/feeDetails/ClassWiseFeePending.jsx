import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'

const staticStudents = [
  { 
    id: '1', 
    name: 'John Doe', 
    className: 'Class 1', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '2', 
    name: 'Jane Smith', 
    className: 'Class 1', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 80 
  },
  { 
    id: '3', 
    name: 'Bob Brown', 
    className: 'Class 1', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 60 
  },
  { 
    id: '4', 
    name: 'Alice Johnson', 
    className: 'Class 1', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '5', 
    name: 'Charlie Davis', 
    className: 'Class 1', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 40 
  },
  { 
    id: '6', 
    name: 'David Evans', 
    className: 'Class 2', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '7', 
    name: 'Eve Frank', 
    className: 'Class 2', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 75 
  },
  { 
    id: '8', 
    name: 'George Hall', 
    className: 'Class 2', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 90 
  },
  { 
    id: '9', 
    name: 'Hannah Green', 
    className: 'Class 2', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '10', 
    name: 'Ian Jack', 
    className: 'Class 2', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 30 
  },
  { 
    id: '11', 
    name: 'Jack King', 
    className: 'Class 3', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '12', 
    name: 'Lily Miller', 
    className: 'Class 3', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '13', 
    name: 'Mike Nelson', 
    className: 'Class 3', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 50 
  },
  { 
    id: '14', 
    name: 'Nina Oliver', 
    className: 'Class 3', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '15', 
    name: 'Oscar Perez', 
    className: 'Class 3', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 85 
  },
  { 
    id: '16', 
    name: 'Paul Quinn', 
    className: 'Class 3', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 0, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '17', 
    name: 'Quinn Rose', 
    className: 'Class 4', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 0, 'Second Term': 5000, 'Third Term': 5000 }, 
    transportFee: 2000,
    transportFeePaid: 70 
  },
  { 
    id: '18', 
    name: 'Rose Scott', 
    className: 'Class 4', 
    section: 'A', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 0, 'Second Term': 5000, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '19', 
    name: 'Scott Tom', 
    className: 'Class 4', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
  { 
    id: '20', 
    name: 'Tom Udo', 
    className: 'Class 4', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 45 
  },
  { 
    id: '21', 
    name: 'Udo Victor', 
    className: 'Class 4', 
    section: 'B', 
    academicYear: '2024-2025', 
    pending: { 'First Term': 5000, 'Second Term': 0, 'Third Term': 0 }, 
    transportFee: 2000,
    transportFeePaid: 100 
  },
]

export default function ClassWiseFeePending({ visible, onClose }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('First Term')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025')
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [showTermDropdown, setShowTermDropdown] = useState(false)
  const [showAcademicDropdown, setShowAcademicDropdown] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const searchInputRef = useRef(null)
  const termDropdownRef = useRef(null)
  const academicDropdownRef = useRef(null)

  const terms = ['First Term', 'Second Term', 'Third Term']
  const academicYears = useMemo(() => [...new Set(staticStudents.map(s => s.academicYear))], [])

  // Filter students by selected academic year
  const filteredStudents = useMemo(() => {
    return staticStudents.filter(s => s.academicYear === selectedAcademicYear)
  }, [selectedAcademicYear])

  // Get all unique class-section combinations
  const allSections = useMemo(() => {
    const sections = {}
    filteredStudents.forEach((s) => {
      const key = `${s.className}-${s.section}`
      if (!sections[key]) {
        sections[key] = { className: s.className, section: s.section, academicYear: s.academicYear, students: [] }
      }
      sections[key].students.push(s)
    })
    return Object.values(sections)
  }, [filteredStudents])

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSections
    }
    const lower = searchQuery.toLowerCase()
    return allSections.filter(
      (s) => s.className.toLowerCase().includes(lower) || s.section.toLowerCase().includes(lower)
    )
  }, [searchQuery, allSections])

  // Get current section data with automatic transport fee calculation based on selected term
  const currentSection = useMemo(() => {
    if (filteredSections.length === 0) return null
    const section = filteredSections[currentSectionIndex]
    
    const transportFeePerTerm = 2000 / 3
    
    const processedStudents = section.students.map((stu) => {
      const termFee = stu.pending[selectedTerm] || 0
      const transportFeePending = Math.max(0, transportFeePerTerm * ((100 - stu.transportFeePaid) / 100))
      const totalPending = termFee + transportFeePending
      
      return {
        ...stu,
        termFee,
        transportFeePending,
        totalPending,
        hasPendingFee: totalPending > 0
      }
    })

    const pendingStudents = processedStudents.filter(student => student.hasPendingFee)
    
    const totalTermPending = pendingStudents.reduce((sum, stu) => sum + stu.termFee, 0)
    const totalTransportPending = pendingStudents.reduce((sum, stu) => sum + stu.transportFeePending, 0)
    const totalPendingAmount = totalTermPending + totalTransportPending

    return { 
      ...section, 
      processedStudents,
      pendingStudents,
      totalTermPending,
      totalTransportPending,
      totalPendingAmount,
      pendingStudentsCount: pendingStudents.length
    }
  }, [filteredSections, currentSectionIndex, selectedTerm])

  useEffect(() => {
    setCurrentSectionIndex(0)
  }, [selectedAcademicYear, searchQuery])

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleDownloadSection = () => {
    if (!currentSection) return
    showToast(`Downloading ${currentSection.className} - ${currentSection.section} fee pending list`, 'success')
  }

  const handleDownloadAll = () => {
    showToast('Downloading all fee pending lists', 'success')
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      showToast('Data refreshed!', 'success')
    }, 1000)
  }, [])

  const handleNextSection = () => {
    if (currentSectionIndex < filteredSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    }
  }

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const renderStudentItem = (student) => (
    <View key={student.id} style={[styles.studentItemContainer, { 
      backgroundColor: colors.cardBackground, 
      borderColor: colors.border 
    }]}>
      <View style={styles.nameRow}>
        <ThemedText style={styles.rollNo}>{student.id}</ThemedText>
        <View style={styles.circleSeparator} />
        <ThemedText style={styles.studentName} numberOfLines={1}>
          {student.name}
        </ThemedText>
      </View>
      <View style={styles.feeRow}>
        <ThemedText style={styles.feeLabel}>Fee:</ThemedText>
        <ThemedText style={[styles.feeAmount, { color: student.termFee > 0 ? colors.warning : colors.success }]}>
          ₹{student.termFee.toLocaleString()}
        </ThemedText>
        <View style={styles.verticalLine} />
        <ThemedText style={styles.feeLabel}>Transport:</ThemedText>
        <ThemedText style={[styles.feeAmount, { color: student.transportFeePending > 0 ? colors.warning : colors.success }]}>
          ₹{student.transportFeePending.toFixed(0)}
        </ThemedText>
        <View style={styles.verticalLine} />
        <ThemedText style={[styles.feeLabel, styles.totalLabel]}>Total:</ThemedText>
        <ThemedText style={[styles.feeAmount, styles.totalAmount, { color: colors.danger }]}>
          ₹{student.totalPending.toFixed(0)}
        </ThemedText>
      </View>
    </View>
  )

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
      marginBottom: -5 
    },
    subtitle: { 
      marginTop: 4, 
      fontSize: 11, 
      color: 'rgba(255,255,255,0.9)' 
    },
    
    // Filter Container
    filterContainer: { 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 44,
      backgroundColor: colors.inputBackground,
      borderColor: colors.primary + '40',
    },
    searchIcon: { 
      marginRight: 8 
    },
    searchInput: { 
      flex: 1, 
      height: '100%', 
      fontSize: 14, 
      fontFamily: 'Poppins-Medium', 
      color: colors.text 
    },
    clearButton: { 
      padding: 4 
    },
    
    // Dropdown Containers
    termDropdownContainer: {
      flex: 1,
    },
    academicDropdownContainer: {
      flex: 1,
    },
    termDropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      backgroundColor: colors.inputBackground,
      borderColor: colors.primary + '40',
    },
    termButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    termButtonText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    dropdownIcon: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    
    // Download All Button
    downloadAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.success + '20',
      borderWidth: 1,
      borderColor: colors.success + '40',
    },
    downloadAllText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: colors.success,
    },
    
    // Dropdown Menu
    dropdownMenu: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    
    // Section Header
    sectionHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontFamily: 'Poppins-Bold',
      color: colors.textSecondary,
    },
    academicYearBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.primary + '10',
    },
    academicYearText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
    
    // Summary Cards
    summaryContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    summaryCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    summaryTitle: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // Student List Header
    studentListHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    studentListTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    studentCountBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    studentCountText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
    
    // Student List
    studentListContainer: {
      padding: 16,
    },
    
    // Student Item
    studentItemContainer: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 6,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    rollNo: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.textSecondary,
    },
    studentName: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      flex: 1,
    },
    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    feeLabel: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
      color: colors.textSecondary,
    },
    totalLabel: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
      color: colors.textSecondary,
    },
    feeAmount: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      minWidth: 45,
      textAlign: 'right',
    },
    totalAmount: {
      fontSize: 12,
      fontFamily: 'Poppins-Bold',
    },
    circleSeparator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.textSecondary,
      marginHorizontal: 6,
    },
    verticalLine: {
      width: 1.5,
      height: 16,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    
    // Navigation
    navigationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    navButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.primary,
    },
    sectionInfo: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    
    // Download Button
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      backgroundColor: colors.success + '20',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    downloadButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.success,
    },
    
    // Empty State
    emptyContainer: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 40, 
      paddingHorizontal: 20 
    },
    emptyTitle: { 
      fontSize: 18, 
      fontFamily: 'Poppins-SemiBold', 
      textAlign: 'center', 
      marginTop: 16,
      marginBottom: 8, 
      color: colors.text 
    },
    emptySubtitle: { 
      fontSize: 14, 
      fontFamily: 'Poppins-Medium', 
      textAlign: 'center', 
      marginBottom: 24, 
      color: colors.textSecondary 
    },
    
    // Loading
    loadingContainer: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: colors.background + 'CC' 
    },
    loadingText: { 
      marginTop: 12, 
      color: colors.textSecondary, 
      fontFamily: 'Poppins-Medium' 
    },
  })

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={onClose}>
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Class-Wise Fee Pending</ThemedText>
                <ThemedText style={styles.subtitle}>View pending fees by class and section</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        {/* Filters */}
        <View style={styles.filterContainer}>
          {/* Search Input - First Row */}
          <View style={styles.searchInputContainer}>
            <Feather name="search" size={18} color={colors.primary} style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              placeholder="Search class or section..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity activeOpacity={0.9} onPress={handleClearSearch} style={styles.clearButton}>
                <Feather name="x-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Second Row: Academic, Term, Download All */}
          <View style={styles.filterRow}>
            {/* Academic Year Dropdown */}
            <View style={styles.academicDropdownContainer}>
              <TouchableOpacity 
                style={styles.termDropdownButton}
                onPress={() => setShowAcademicDropdown(!showAcademicDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.termButtonContent}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <ThemedText style={styles.termButtonText}>
                    {selectedAcademicYear}
                  </ThemedText>
                </View>
                <Feather 
                  name={showAcademicDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              
              {showAcademicDropdown && (
                <View style={[styles.dropdownMenu, { borderColor: colors.border }]}>
                  {academicYears.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedAcademicYear(year)
                        setShowAcademicDropdown(false)
                      }}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.dropdownItemText}>
                        {year}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Term Dropdown */}
            <View style={styles.termDropdownContainer}>
              <TouchableOpacity 
                style={styles.termDropdownButton}
                onPress={() => setShowTermDropdown(!showTermDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.termButtonContent}>
                  <Feather name="book" size={16} color={colors.primary} />
                  <ThemedText style={styles.termButtonText}>
                    {selectedTerm.replace('Term', '').trim()}
                  </ThemedText>
                </View>
                <Feather 
                  name={showTermDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              
              {showTermDropdown && (
                <View style={[styles.dropdownMenu, { borderColor: colors.border }]}>
                  {terms.map((term) => (
                    <TouchableOpacity
                      key={term}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTerm(term)
                        setShowTermDropdown(false)
                      }}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.dropdownItemText}>
                        {term.replace('Term', '').trim()}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Download All Button */}
            <TouchableOpacity 
              style={styles.downloadAllButton}
              onPress={handleDownloadAll}
              activeOpacity={0.8}
            >
              <Feather name="download" size={16} color={colors.success} />
              <ThemedText style={styles.downloadAllText}>All</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[colors.primary]} 
              tintColor={colors.primary} 
            />
          }
          showsVerticalScrollIndicator={true}
        >
          {currentSection ? (
            <>
              {/* Current Section Header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <ThemedText style={styles.sectionTitle}>
                    {currentSection.className} - {currentSection.section}
                  </ThemedText>
                  <View style={styles.academicYearBadge}>
                    <Feather name="calendar" size={12} color={colors.primary} />
                    <ThemedText style={styles.academicYearText}>
                      {currentSection.academicYear}
                    </ThemedText>
                  </View>
                </View>
                
                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                  <View style={[styles.summaryCard, { borderColor: colors.warning + '40' }]}>
                    <View style={styles.summaryHeader}>
                      <FontAwesome5 name="money-check" size={14} color={colors.warning} />
                      <ThemedText style={styles.summaryTitle}>Term Fee</ThemedText>
                    </View>
                    <ThemedText style={[styles.summaryValue, { color: colors.warning }]}>
                      ₹{currentSection.totalTermPending.toFixed(0)}
                    </ThemedText>
                  </View>
                  
                  <View style={[styles.summaryCard, { borderColor: colors.warning + '40' }]}>
                    <View style={styles.summaryHeader}>
                      <FontAwesome5 name="bus" size={16} color={colors.warning} />
                      <ThemedText style={styles.summaryTitle}>Bus Fee</ThemedText>
                    </View>
                    <ThemedText style={[styles.summaryValue, { color: colors.warning }]}>
                      ₹{currentSection.totalTransportPending.toFixed(0)}
                    </ThemedText>
                  </View>
                  
                  <View style={[styles.summaryCard, { borderColor: colors.danger + '40' }]}>
                    <View style={styles.summaryHeader}>
                      <MaterialIcons name="account-balance" size={18} color={colors.danger} />
                      <ThemedText style={styles.summaryTitle}>Total</ThemedText>
                    </View>
                    <ThemedText style={[styles.summaryValue, { color: colors.danger }]}>
                      ₹{currentSection.totalPendingAmount.toFixed(0)}
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              {/* Student List Header */}
              <View style={styles.studentListHeader}>
                <ThemedText style={styles.studentListTitle}>Pending Students</ThemedText>
                <View style={styles.studentCountBadge}>
                  <ThemedText style={styles.studentCountText}>
                    {currentSection.pendingStudentsCount} students
                  </ThemedText>
                </View>
              </View>
              
              {/* Student List */}
              <View style={styles.studentListContainer}>
                {currentSection.pendingStudentsCount > 0 ? (
                  currentSection.pendingStudents.map((student) => renderStudentItem(student))
                ) : (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="check-circle" size={48} color={colors.success} />
                    <ThemedText style={styles.emptyTitle}>All Fees Cleared</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>
                      No pending fees for {currentSection.className} - {currentSection.section}
                    </ThemedText>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="school" size={48} color={colors.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No Classes Found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Try adjusting your search criteria
              </ThemedText>
            </View>
          )}
        </ScrollView>
        
        {/* Section Navigation */}
        {filteredSections.length > 0 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              style={[styles.navButton, currentSectionIndex === 0 && { opacity: 0.5 }]}
              onPress={handlePrevSection}
              disabled={currentSectionIndex === 0}
              activeOpacity={0.8}
            >
              <Feather name="chevron-left" size={18} color={colors.primary} />
              <ThemedText style={styles.navButtonText}>Previous</ThemedText>
            </TouchableOpacity>
            
            <ThemedText style={styles.sectionInfo}>
              {currentSectionIndex + 1} of {filteredSections.length}
            </ThemedText>
            
            <TouchableOpacity 
              style={[styles.navButton, currentSectionIndex === filteredSections.length - 1 && { opacity: 0.5 }]}
              onPress={handleNextSection}
              disabled={currentSectionIndex === filteredSections.length - 1}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.navButtonText}>Next</ThemedText>
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Download Current Section Button */}
        {currentSection && currentSection.pendingStudentsCount > 0 && (
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={handleDownloadSection}
            activeOpacity={0.8}
          >
            <Feather name="download" size={20} color={colors.success} />
            <ThemedText style={styles.downloadButtonText}>
              Download {currentSection.className} - {currentSection.section}
            </ThemedText>
          </TouchableOpacity>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading fee details...</ThemedText>
          </View>
        )}
        
        {/* Toast Notification */}
        <ToastNotification 
          visible={toast.visible} 
          type={toast.type} 
          message={toast.message} 
          duration={3000} 
          onHide={hideToast} 
          position="top-center" 
        />
      </View>
    </Modal>
  )
}