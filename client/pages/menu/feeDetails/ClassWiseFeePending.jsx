import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import { generateClassWisePDFHTML } from './generateClassWisePDFHTML'

// Class options with enum mapping
const CLASS_OPTIONS = [
  { label: 'All Classes', value: 'ALL' },
  { label: 'Pre-Nursery', value: 'PRE_NURSERY' },
  { label: 'Nursery', value: 'NURSERY' },
  { label: 'LKG', value: 'LKG' },
  { label: 'UKG', value: 'UKG' },
  { label: 'Class 1', value: 'CLASS_1' },
  { label: 'Class 2', value: 'CLASS_2' },
  { label: 'Class 3', value: 'CLASS_3' },
  { label: 'Class 4', value: 'CLASS_4' },
  { label: 'Class 5', value: 'CLASS_5' },
  { label: 'Class 6', value: 'CLASS_6' },
  { label: 'Class 7', value: 'CLASS_7' },
  { label: 'Class 8', value: 'CLASS_8' },
  { label: 'Class 9', value: 'CLASS_9' },
  { label: 'Class 10', value: 'CLASS_10' },
  { label: 'Class 11', value: 'CLASS_11' },
  { label: 'Class 12', value: 'CLASS_12' },
]

// Section options
const SECTION_OPTIONS = [
  { label: 'All Sections', value: 'ALL' },
  { label: 'Section A', value: 'A' },
  { label: 'Section B', value: 'B' },
  { label: 'Section C', value: 'C' },
  { label: 'Section D', value: 'D' },
  { label: 'Section E', value: 'E' },
]

// Term options
const TERM_OPTIONS = [
  { label: 'First Term', value: 'First Term' },
  { label: 'Second Term', value: 'Second Term' },
  { label: 'Third Term', value: 'Third Term' },
]

export default function ClassWiseFeePending({ visible, onClose }) {
  const { colors } = useTheme()
  
  // State for dropdowns
  const [selectedClass, setSelectedClass] = useState('ALL')
  const [selectedSection, setSelectedSection] = useState('ALL')
  const [selectedTerm, setSelectedTerm] = useState('First Term')
  
  // Dropdown visibility
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [showSectionDropdown, setShowSectionDropdown] = useState(false)
  const [showTermDropdown, setShowTermDropdown] = useState(false)
  
  // State for data
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [classWiseData, setClassWiseData] = useState([])
  const [filteredSections, setFilteredSections] = useState([])
  const [sectionStudents, setSectionStudents] = useState({})
  const [loadingStudents, setLoadingStudents] = useState({})
  
  // Export states
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  
  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  
  // Refs
  const classDropdownRef = useRef(null)
  const sectionDropdownRef = useRef(null)
  const termDropdownRef = useRef(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  // Get display label for selected class
  const getSelectedClassLabel = useCallback(() => {
    const option = CLASS_OPTIONS.find(opt => opt.value === selectedClass)
    return option ? option.label : 'All Classes'
  }, [selectedClass])

  // Get display label for selected section
  const getSelectedSectionLabel = useCallback(() => {
    const option = SECTION_OPTIONS.find(opt => opt.value === selectedSection)
    return option ? option.label : 'All Sections'
  }, [selectedSection])

  // Fetch class-wise fee pending data
  const fetchClassWiseData = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = {
        termNumber: TERM_OPTIONS.findIndex(t => t.value === selectedTerm) + 1
      }
      
      // Add class filter if not 'ALL'
      if (selectedClass !== 'ALL') {
        params.class = selectedClass
      }
      
      // Add section filter if not 'ALL'
      if (selectedSection !== 'ALL') {
        params.section = selectedSection
      }
      
      const response = await axiosApi.get('/fees/class-wise-payments', { params })
      
      if (response.data.success) {
        const data = response.data.data.classWisePayments || []
        setClassWiseData(data)
        return data
      } else {
        showToast(response.data.message || 'Failed to fetch data', 'error')
        return []
      }
    } catch (error) {
      console.error('Error fetching class-wise data:', error)
      showToast(error.response?.data?.message || 'Failed to load data', 'error')
      return []
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedClass, selectedSection, showToast])

  // Fetch students for a specific section
  const fetchSectionStudents = useCallback(async (className, section) => {
    const key = `${className}-${section}`
    
    if (sectionStudents[key] || loadingStudents[key]) return
    
    setLoadingStudents(prev => ({ ...prev, [key]: true }))
    
    try {
      const response = await axiosApi.get('/fees/students/search', {
        params: {
          class: className,
          section: section,
          limit: 100
        }
      })
      
      if (response.data.success) {
        const students = response.data.data || []
        
        // Process students with fee details
        const processedStudents = students.map(student => {
          const feeSummary = student.feeSummary || {}
          const termFee = feeSummary.schoolFee?.due || 0
          const transportFeePending = feeSummary.transportFee?.due || 0
          const hostelFeePending = feeSummary.hostelFee?.due || 0
          const totalPending = termFee + transportFeePending + hostelFeePending
          
          return {
            id: student.id,
            rollNo: student.rollNo || 'N/A',
            name: student.name,
            termFee,
            transportFeePending,
            hostelFeePending,
            totalPending,
            hasPendingFee: totalPending > 0,
            feeSummary
          }
        })
        
        setSectionStudents(prev => ({ ...prev, [key]: processedStudents }))
      }
    } catch (error) {
      console.error('Error fetching section students:', error)
      showToast('Failed to load students', 'error')
    } finally {
      setLoadingStudents(prev => ({ ...prev, [key]: false }))
    }
  }, [showToast])

  // Process data for display
  const processClassWiseData = useCallback((data) => {
    // Transform data to match the expected format
    const sections = data.map(item => ({
      id: `${item.class}-${item.section}`,
      className: item.classLabel || item.class,
      class: item.class,
      section: item.section,
      students: [],
      totalTermPending: item.totalAmount || 0,
      totalTransportPending: item.transportFeePaid || 0,
      totalHostelPending: item.hostelFeePaid || 0,
      totalPendingAmount: (item.totalAmount || 0) + (item.transportFeePaid || 0) + (item.hostelFeePaid || 0),
      pendingStudentsCount: item.paymentCount || 0,
    }))
    
    return sections
  }, [])

  // Load initial data
  useEffect(() => {
    if (visible) {
      setInitialLoading(true)
      fetchClassWiseData().then(data => {
        const processed = processClassWiseData(data)
        setFilteredSections(processed)
        setInitialLoading(false)
      })
    }
  }, [visible, fetchClassWiseData, selectedClass, selectedSection])

  // Handle filter changes
  const handleClassChange = useCallback(async (classValue) => {
    setSelectedClass(classValue)
    setShowClassDropdown(false)
    setInitialLoading(true)
    setSectionStudents({}) // Clear cached students
    
    const data = await fetchClassWiseData()
    const processed = processClassWiseData(data)
    setFilteredSections(processed)
    setInitialLoading(false)
  }, [fetchClassWiseData, processClassWiseData])

  const handleSectionChange = useCallback(async (sectionValue) => {
    setSelectedSection(sectionValue)
    setShowSectionDropdown(false)
    setInitialLoading(true)
    setSectionStudents({}) // Clear cached students
    
    const data = await fetchClassWiseData()
    const processed = processClassWiseData(data)
    setFilteredSections(processed)
    setInitialLoading(false)
  }, [fetchClassWiseData, processClassWiseData])

  const handleTermChange = useCallback(async (term) => {
    setSelectedTerm(term)
    setShowTermDropdown(false)
    setInitialLoading(true)
    setSectionStudents({}) // Clear cached students
    
    const data = await fetchClassWiseData()
    const processed = processClassWiseData(data)
    setFilteredSections(processed)
    setInitialLoading(false)
  }, [fetchClassWiseData, processClassWiseData])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setSectionStudents({}) // Clear cached students
    const data = await fetchClassWiseData()
    const processed = processClassWiseData(data)
    setFilteredSections(processed)
    setRefreshing(false)
    showToast('Data refreshed!', 'success')
  }, [fetchClassWiseData, processClassWiseData, showToast])

  // Fetch students for a section when needed
  const fetchSectionData = useCallback(async (section) => {
    if (!sectionStudents[section.id] && !loadingStudents[section.id]) {
      await fetchSectionStudents(section.class, section.section)
    }
  }, [sectionStudents, loadingStudents, fetchSectionStudents])

  // Load students for all sections when all classes/sections selected
  useEffect(() => {
    if (filteredSections.length > 0) {
      filteredSections.forEach(section => {
        fetchSectionData(section)
      })
    }
  }, [filteredSections, fetchSectionData])

  // Get students for a section
  const getSectionStudents = useCallback((sectionId) => {
    return sectionStudents[sectionId] || []
  }, [sectionStudents])

  // Get pending students for a section
  const getPendingStudents = useCallback((sectionId) => {
    const students = sectionStudents[sectionId] || []
    return students.filter(student => student.hasPendingFee)
  }, [sectionStudents])

  // Check if section has pending fees
  const hasPendingFees = useCallback((section) => {
    const pendingStudents = getPendingStudents(section.id)
    return pendingStudents.length > 0
  }, [getPendingStudents])

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    let totalStudents = 0
    let totalTermFee = 0
    let totalTransportFee = 0
    let totalHostelFee = 0
    let totalAmount = 0

    filteredSections.forEach(section => {
      const students = sectionStudents[section.id] || []
      const pendingStudents = students.filter(s => s.hasPendingFee)
      
      totalStudents += pendingStudents.length
      totalTermFee += section.totalTermPending
      totalTransportFee += section.totalTransportPending
      totalHostelFee += section.totalHostelPending
      totalAmount += section.totalPendingAmount
    })

    return {
      totalSections: filteredSections.length,
      totalStudents,
      totalTermFee,
      totalTransportFee,
      totalHostelFee,
      totalAmount
    }
  }, [filteredSections, sectionStudents])

  // Prepare data for PDF
  const preparePDFData = useCallback(async () => {
    const sectionsData = []
    
    for (const section of filteredSections) {
      // Ensure we have student data for this section
      if (!sectionStudents[section.id]) {
        await fetchSectionStudents(section.class, section.section)
      }
      
      const students = sectionStudents[section.id] || []
      const pendingStudents = students.filter(s => s.hasPendingFee)
      
      // Sort by roll number
      const sortedStudents = pendingStudents.sort((a, b) => {
        const rollA = parseInt(a.rollNo) || 0
        const rollB = parseInt(b.rollNo) || 0
        return rollA - rollB
      })
      
      sectionsData.push({
        className: section.className,
        section: section.section,
        totalTermPending: section.totalTermPending,
        totalTransportPending: section.totalTransportPending,
        totalHostelPending: section.totalHostelPending,
        totalPendingAmount: section.totalPendingAmount,
        pendingCount: pendingStudents.length,
        students: sortedStudents.map(s => ({
          rollNo: s.rollNo,
          name: s.name,
          termFee: s.termFee,
          transportFee: s.transportFeePending,
          hostelFee: s.hostelFeePending,
          totalPending: s.totalPending
        }))
      })
    }

    return generateClassWisePDFHTML({
      selectedClass: getSelectedClassLabel(),
      selectedSection: getSelectedSectionLabel(),
      selectedTerm,
      sections: sectionsData,
      grandTotals,
      schoolInfo: {
        name: 'Your School Name',
        address: 'School Address',
        phone: 'School Phone',
        email: 'school@email.com'
      },
      generatedAt: new Date()
    })
  }, [filteredSections, sectionStudents, selectedTerm, getSelectedClassLabel, getSelectedSectionLabel, grandTotals, fetchSectionStudents])

  // Handle Download
  const handleDownload = useCallback(async () => {
    try {
      setDownloading(true)
      showToast('Generating PDF...', 'info')

      const htmlContent = await preparePDFData()

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent,
        width: 612,
        height: 792,
      })

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Fee Pending Report',
          UTI: 'com.adobe.pdf',
        })
        
        showToast('PDF downloaded successfully', 'success')
      } else {
        showToast('Sharing is not available on this device', 'error')
      }
    } catch (error) {
      console.error('Download error:', error)
      showToast('Failed to download: ' + error.message, 'error')
    } finally {
      setDownloading(false)
    }
  }, [preparePDFData, showToast])

  // Handle Print
  const handlePrint = useCallback(async () => {
    try {
      setPrinting(true)
      showToast('Preparing print...', 'info')

      const htmlContent = await preparePDFData()

      // Print the document
      await Print.printAsync({ 
        html: htmlContent
      })
      
      showToast('Print job sent successfully', 'success')
    } catch (error) {
      console.error('Print error:', error)
      showToast('Failed to print: ' + error.message, 'error')
    } finally {
      setPrinting(false)
    }
  }, [preparePDFData, showToast])

  // Render section card for list
  const renderSectionCard = ({ item }) => {
    const pendingStudents = getPendingStudents(item.id)
    const isLoading = loadingStudents[item.id]
    const hasPending = pendingStudents.length > 0
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.sectionCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.border,
          borderLeftColor: hasPending ? colors.warning : colors.success,
          borderLeftWidth: 4,
        }]}
        onPress={() => fetchSectionData(item)}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialIcons 
              name={hasPending ? "warning" : "check-circle"} 
              size={20} 
              color={hasPending ? colors.warning : colors.success} 
            />
            <ThemedText style={styles.sectionTitle}>
              {item.className} - {item.section}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: hasPending ? colors.warning + '20' : colors.success + '20' 
          }]}>
            <ThemedText style={[styles.statusText, { 
              color: hasPending ? colors.warning : colors.success 
            }]}>
              {hasPending ? `${pendingStudents.length} to be paid` : 'All Cleared'}
            </ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingStudentsContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={styles.loadingStudentsText}>Loading students...</ThemedText>
          </View>
        ) : hasPending ? (
          <>
            <View style={styles.feeSummary}>
              <View style={styles.feeItem}>
                <FontAwesome5 name="money-check" size={12} color={colors.warning} />
                <ThemedText style={styles.feeLabel}>Term Fee</ThemedText>
                <ThemedText style={[styles.feeValue, { color: colors.warning }]}>
                  ₹{item.totalTermPending.toLocaleString()}
                </ThemedText>
              </View>
              {item.totalTransportPending > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="bus" size={12} color={colors.info} />
                  <ThemedText style={styles.feeLabel}>Transport</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.info }]}>
                    ₹{item.totalTransportPending.toLocaleString()}
                  </ThemedText>
                </View>
              )}
              {item.totalHostelPending > 0 && (
                <View style={styles.feeItem}>
                  <MaterialIcons name="account-balance" size={12} color={colors.danger} />
                  <ThemedText style={styles.feeLabel}>Hostel</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.danger }]}>
                    ₹{item.totalHostelPending.toLocaleString()}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Show first 2 students preview */}
            <View style={styles.studentsPreview}>
              {pendingStudents.slice(0, 2).map((student, index) => (
                <View key={student.id} style={styles.previewRow}>
                  <ThemedText style={styles.previewName} numberOfLines={1}>
                    {student.name}
                  </ThemedText>
                  <ThemedText style={styles.previewAmount}>
                    ₹{student.totalPending.toLocaleString()}
                  </ThemedText>
                </View>
              ))}
              {pendingStudents.length > 2 && (
                <ThemedText style={styles.moreText}>
                  +{pendingStudents.length - 2} more students
                </ThemedText>
              )}
            </View>
          </>
        ) : (
          <View style={styles.clearedContainer}>
            <MaterialIcons name="check-circle" size={16} color={colors.success} />
            <ThemedText style={styles.clearedText}>
              All fees cleared for this section
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    )
  }

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
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      color: 'rgba(255,255,255,0.9)',
      fontFamily: 'Poppins-Medium',
    },
    
    // Filter Container
    filterContainer: { 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    
    // Dropdowns - All equal width
    dropdownContainer: {
      flex: 1,
      position: 'relative',
      zIndex: 1000,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    buttonText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
      flex: 1,
    },
    
    // Action Buttons (Term Dropdown, Download, Print)
    actionButtonContainer: {
      flex: 1,
      position: 'relative',
      zIndex: 1000,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    actionButtonText: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
    },
    
    // Dropdown Menu
    dropdownMenu: {
      position: 'absolute',
      top: 48,
      left: 0,
      right: 0,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 2000,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      maxHeight: 300,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    dropdownItemLast: {
      borderBottomWidth: 0,
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primary + '10',
    },
    dropdownItemSelectedText: {
      color: colors.primary,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // List Header
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    listTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    listCountBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    listCountText: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
    },
    
    // Section Card
    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
      elevation: 2,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // Fee Summary
    feeSummary: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    feeItem: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
      minWidth: 80,
    },
    feeLabel: {
      fontSize: 9,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    feeValue: {
      fontSize: 12,
      fontFamily: 'Poppins-Bold',
    },
    
    // Students Preview
    studentsPreview: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    previewName: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    previewAmount: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.danger,
    },
    moreText: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      marginTop: 4,
    },
    
    // Cleared Container
    clearedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
      backgroundColor: colors.success + '10',
      borderRadius: 8,
    },
    clearedText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.success,
    },
    
    // Loading States
    loadingStudentsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
    },
    loadingStudentsText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    
    // List Container
    listContainer: {
      padding: 16,
      paddingBottom: 20,
    },
    
    // Empty State
    emptyContainer: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 60, 
      paddingHorizontal: 20 
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: { 
      fontSize: 18, 
      fontFamily: 'Poppins-SemiBold', 
      textAlign: 'center', 
      marginBottom: 8, 
      color: colors.text 
    },
    emptySubtitle: { 
      fontSize: 14, 
      fontFamily: 'Poppins-Medium', 
      textAlign: 'center', 
      marginBottom: 24, 
      color: colors.textSecondary,
      lineHeight: 20,
    },
    
    // Loading Overlay
    loadingContainer: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: colors.background + 'CC',
      zIndex: 1000,
    },
    loadingText: { 
      marginTop: 12, 
      color: colors.text, 
      fontFamily: 'Poppins-Medium' 
    },
    
    // Action Buttons Container
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    
    // Printer Icon
    printerButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 1000,
    },
  })

  const isActionDisabled = downloading || printing || filteredSections.length === 0

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={onClose}>
                <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Fee Pending Report</ThemedText>
                <ThemedText style={styles.subtitle}>Class & Section wise pending fees</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        {/* Filters - First Row: Class and Section */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {/* Class Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowClassDropdown(!showClassDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <MaterialIcons name="class" size={16} color={colors.textSecondary} />
                  <ThemedText style={styles.buttonText} numberOfLines={1}>
                    {getSelectedClassLabel()}
                  </ThemedText>
                </View>
                <Feather 
                  name={showClassDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showClassDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled>
                    {CLASS_OPTIONS.map((option, index) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.dropdownItem,
                          index === CLASS_OPTIONS.length - 1 && styles.dropdownItemLast,
                          selectedClass === option.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => handleClassChange(option.value)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[
                          styles.dropdownItemText,
                          selectedClass === option.value && styles.dropdownItemSelectedText
                        ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Section Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowSectionDropdown(!showSectionDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <MaterialIcons name="view-module" size={16} color={colors.textSecondary} />
                  <ThemedText style={styles.buttonText} numberOfLines={1}>
                    {getSelectedSectionLabel()}
                  </ThemedText>
                </View>
                <Feather 
                  name={showSectionDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showSectionDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled>
                    {SECTION_OPTIONS.map((option, index) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.dropdownItem,
                          index === SECTION_OPTIONS.length - 1 && styles.dropdownItemLast,
                          selectedSection === option.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => handleSectionChange(option.value)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[
                          styles.dropdownItemText,
                          selectedSection === option.value && styles.dropdownItemSelectedText
                        ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          
          {/* Second Row: Term Dropdown, Download, and Print */}
          <View style={styles.actionButtonsRow}>
            {/* Term Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowTermDropdown(!showTermDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Feather name="book" size={16} color={colors.textSecondary} />
                  <ThemedText style={styles.buttonText} numberOfLines={1}>
                    {selectedTerm}
                  </ThemedText>
                </View>
                <Feather 
                  name={showTermDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showTermDropdown && (
                <View style={styles.dropdownMenu}>
                  {TERM_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        index === TERM_OPTIONS.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => handleTermChange(option.value)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.dropdownItemText}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Download Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleDownload}
              activeOpacity={0.8}
              disabled={isActionDisabled}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="download" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>
                    Download
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
            
            {/* Print Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handlePrint}
              activeOpacity={0.8}
              disabled={isActionDisabled}
            >
              {printing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="printer" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>
                    Print
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* List Header */}
        <View style={styles.listHeader}>
          <ThemedText style={styles.listTitle}>
            {getSelectedClassLabel()} {selectedSection !== 'ALL' ? `- ${getSelectedSectionLabel()}` : ''}
          </ThemedText>
          <View style={styles.listCountBadge}>
            <ThemedText style={styles.listCountText}>
              {filteredSections.length} {filteredSections.length === 1 ? 'Section' : 'Sections'}
            </ThemedText>
          </View>
        </View>
        
        {initialLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.emptySubtitle, { marginTop: 16 }]}>
              Loading fee data...
            </ThemedText>
          </View>
        ) : filteredSections.length > 0 ? (
          <FlatList
            data={filteredSections}
            renderItem={renderSectionCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="school" size={64} color={colors.textSecondary} style={styles.emptyIcon} />
            <ThemedText style={styles.emptyTitle}>No Data Found</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              No fee data available for the selected filters
            </ThemedText>
          </View>
        )}
        
        {/* Printer Icon - Bottom Right */}
        <TouchableOpacity 
          style={styles.printerButton}
          onPress={handlePrint}
          activeOpacity={0.8}
          disabled={isActionDisabled}
        >
          {printing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome5 name="print" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        
        {/* Loading Overlay */}
        {(loading || refreshing) && !initialLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>
              {refreshing ? 'Refreshing...' : 'Loading...'}
            </ThemedText>
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