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
  Dimensions,
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

const { width, height } = Dimensions.get('window')

// Term options
const TERM_OPTIONS = [
  { label: 'First Term', value: 'First Term' },
  { label: 'Second Term', value: 'Second Term' },
  { label: 'Third Term', value: 'Third Term' },
  { label: 'Previous Year Only', value: 'Previous Year' },
  { label: 'All Terms + Previous Year', value: 'All' },
]

export default function ClassWiseFeePending({ visible, onClose }) {
  const { colors } = useTheme()
  
  // State for dropdowns
  const [selectedClass, setSelectedClass] = useState('ALL')
  const [selectedSection, setSelectedSection] = useState('ALL')
  const [selectedTerm, setSelectedTerm] = useState('First Term')
  
  // Dropdown modal visibility
  const [showClassModal, setShowClassModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showTermModal, setShowTermModal] = useState(false)
  
  // State for classes and sections
  const [classesAndSections, setClassesAndSections] = useState({})
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  
  // State for data loading
  const [loadingState, setLoadingState] = useState('initial')
  const [refreshing, setRefreshing] = useState(false)
  const [classWiseData, setClassWiseData] = useState({ allStudents: [], classWiseBreakdown: [] })
  const [filteredSections, setFilteredSections] = useState([])
  
  // State for section student modal
  const [selectedSectionData, setSelectedSectionData] = useState(null)
  const [showSectionStudentsModal, setShowSectionStudentsModal] = useState(false)
  const [sectionStudents, setSectionStudents] = useState([])
  
  // Export states
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [downloadingSection, setDownloadingSection] = useState(false)
  const [printingSection, setPrintingSection] = useState(false)
  
  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  // Safe number formatter
  const safeNumber = useCallback((value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0
    }
    return Number(value)
  }, [])

  // Safe currency formatter
  const formatCurrency = useCallback((value) => {
    const num = safeNumber(value)
    return `₹${num.toLocaleString('en-IN')}`
  }, [safeNumber])

  // Load classes and sections from API
  const loadClassesAndSections = useCallback(async () => {
    try {
      setLoadingState('loadingClasses')

      const response = await axiosApi.get('/students/classes-sections')
      
      if (response.data.success) {
        const classesData = response.data.data
        setClassesAndSections(classesData)
        
        const classesArray = [
          { label: 'All Classes', value: 'ALL' },
          ...Object.keys(classesData).map(className => ({
            label: className,
            value: className === 'Pre-Nursery' || className === 'Nursery' || className === 'LKG' || className === 'UKG' 
              ? className 
              : className.split(' ')[1]
          }))
        ]
        
        const sortedClasses = classesArray.sort((a, b) => {
          if (a.value === 'ALL') return -1
          if (b.value === 'ALL') return 1
          
          const specialOrder = {
            'Pre-Nursery': 0,
            'Nursery': 1,
            'LKG': 2,
            'UKG': 3
          }
          
          const orderA = specialOrder[a.value] !== undefined ? specialOrder[a.value] : 4
          const orderB = specialOrder[b.value] !== undefined ? specialOrder[b.value] : 4
          
          if (orderA === 4 && orderB === 4) {
            const numA = parseInt(a.value) || 100
            const numB = parseInt(b.value) || 100
            return numA - numB
          }
          
          return orderA - orderB
        })
        
        setClasses(sortedClasses)
        await fetchClassWiseData()
        
      } else {
        throw new Error(response.data.message || 'Failed to load classes and sections')
      }
    } catch (err) {
      console.error('Error loading classes and sections:', err)
      showToast('Failed to load classes. Using default list.', 'warning')
      
      const fallbackClasses = [
        { label: 'All Classes', value: 'ALL' },
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
      ]
      
      const fallbackClassSections = {
        'Pre-Nursery': ['A', 'B', 'C'],
        'Nursery': ['A', 'B', 'C'],
        'LKG': ['A', 'B', 'C'],
        'UKG': ['A', 'B', 'C'],
        '1': ['A', 'B', 'C', 'D'],
        '2': ['A', 'B', 'C', 'D'],
        '3': ['A', 'B', 'C', 'D'],
        '4': ['A', 'B', 'C', 'D'],
        '5': ['A', 'B', 'C', 'D'],
        '6': ['A', 'B', 'C', 'D'],
        '7': ['A', 'B', 'C', 'D'],
        '8': ['A', 'B', 'C', 'D'],
        '9': ['A', 'B', 'C', 'D'],
        '10': ['A', 'B', 'C', 'D'],
      }
      
      setClasses(fallbackClasses)
      setClassesAndSections(fallbackClassSections)
      await fetchClassWiseData()
    }
  }, [])

  // Update sections based on selected class
  const updateSectionsForClass = (className) => {
    if (!className || className === 'ALL') {
      setSections([{ label: 'All Sections', value: 'ALL' }])
      setSelectedSection('ALL')
      return
    }
    
    if (!classesAndSections || Object.keys(classesAndSections).length === 0) return
    
    const classItem = classes.find(c => c.value === className)
    if (!classItem) return
    
    const classLabel = classItem.label
    const classSections = classesAndSections[classLabel] || []
    
    if (classSections.length > 0) {
      const sectionsArray = [
        { label: 'All Sections', value: 'ALL' },
        ...classSections.map(section => ({
          label: `Section ${section}`,
          value: section
        }))
      ]
      setSections(sectionsArray)
      setSelectedSection('ALL')
    } else {
      const defaultSections = [
        { label: 'All Sections', value: 'ALL' },
        { label: 'Section A', value: 'A' },
        { label: 'Section B', value: 'B' },
        { label: 'Section C', value: 'C' },
      ]
      setSections(defaultSections)
      setSelectedSection('ALL')
    }
  }

  useEffect(() => {
    if (visible) {
      loadClassesAndSections()
    } else {
      setLoadingState('initial')
      setFilteredSections([])
    }
  }, [visible, loadClassesAndSections])

  useEffect(() => {
    if (selectedClass && Object.keys(classesAndSections).length > 0) {
      updateSectionsForClass(selectedClass)
    }
  }, [selectedClass, classesAndSections])

  const getSelectedClassLabel = useCallback(() => {
    const option = classes.find(opt => opt.value === selectedClass)
    return option ? option.label : 'All Classes'
  }, [selectedClass, classes])

  const getSelectedSectionLabel = useCallback(() => {
    const option = sections.find(opt => opt.value === selectedSection)
    return option ? option.label : 'All Sections'
  }, [selectedSection, sections])

  // Fetch class-wise fee pending data
  const fetchClassWiseData = useCallback(async () => {
    try {
      setLoadingState('loadingFeeData')
      
      const params = {}
      
      if (selectedTerm === 'Previous Year') {
        params.termNumber = 1
        params.includePreviousYear = 'true'
      } else if (selectedTerm === 'All') {
        params.termNumber = 1
        params.includePreviousYear = 'true'
      } else {
        params.termNumber = TERM_OPTIONS.findIndex(t => t.value === selectedTerm) + 1
        params.includePreviousYear = 'true'
      }
      
      if (selectedClass !== 'ALL') {
        params.class = selectedClass
      }
      
      if (selectedSection !== 'ALL') {
        params.section = selectedSection
      }
      
      const response = await axiosApi.get('/fees/class-wise-pending', { params })
      
      if (response.data.success) {
        const data = response.data.data
        setClassWiseData(data)
        
        const sections = data.classWiseBreakdown || []
        
        const processedSections = sections.map(section => ({
          id: `${section.class}-${section.section}`,
          className: section.classLabel || 'Unknown',
          class: section.class || 'Unknown',
          section: section.section || 'Unknown',
          students: (section.students || []).map(student => ({
            id: student.id || `temp-${Math.random()}`,
            rollNo: student.rollNo || 'N/A',
            name: student.name || 'Unknown',
            term1Pending: safeNumber(student.term1Pending),
            term2Pending: safeNumber(student.term2Pending),
            term3Pending: safeNumber(student.term3Pending),
            termPending: safeNumber(student.termPending),
            previousYearFee: safeNumber(student.previousYearFee),
            totalPending: safeNumber(student.totalPending)
          })),
          term1Total: safeNumber(section.summary?.term1Total),
          term2Total: safeNumber(section.summary?.term2Total),
          term3Total: safeNumber(section.summary?.term3Total),
          previousYearTotal: safeNumber(section.summary?.previousYearTotal),
          selectedTermTotal: safeNumber(section.summary?.selectedTermTotal),
          totalPendingAmount: safeNumber(section.summary?.grandTotal),
          pendingStudentsCount: safeNumber(section.summary?.studentsWithPending),
          totalStudents: safeNumber(section.summary?.totalStudents)
        }))
        
        setFilteredSections(processedSections)
        setLoadingState('loaded')
        return data
      } else {
        throw new Error(response.data.message || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching class-wise data:', error)
      showToast(error.response?.data?.message || 'Failed to load data', 'error')
      setLoadingState('error')
      return { allStudents: [], classWiseBreakdown: [] }
    }
  }, [selectedTerm, selectedClass, selectedSection, showToast, safeNumber])

  const handleClassChange = useCallback(async (classValue) => {
    setSelectedClass(classValue)
    setShowClassModal(false)
    await fetchClassWiseData()
  }, [fetchClassWiseData])

  const handleSectionChange = useCallback(async (sectionValue) => {
    setSelectedSection(sectionValue)
    setShowSectionModal(false)
    await fetchClassWiseData()
  }, [fetchClassWiseData])

  const handleTermChange = useCallback(async (term) => {
    setSelectedTerm(term)
    setShowTermModal(false)
    await fetchClassWiseData()
  }, [fetchClassWiseData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchClassWiseData()
    setRefreshing(false)
    showToast('Data refreshed!', 'success')
  }, [fetchClassWiseData, showToast])

  const handleSectionPress = useCallback((section) => {
    if (!section) return
    
    const processedStudents = (section.students || []).map(student => ({
      id: student.id || `temp-${Math.random()}`,
      rollNo: student.rollNo || 'N/A',
      name: student.name || 'Unknown',
      term1Pending: safeNumber(student.term1Pending),
      term2Pending: safeNumber(student.term2Pending),
      term3Pending: safeNumber(student.term3Pending),
      previousYearFee: safeNumber(student.previousYearFee),
      totalPending: safeNumber(student.totalPending)
    }))
    
    setSelectedSectionData(section)
    setSectionStudents(processedStudents)
    setShowSectionStudentsModal(true)
  }, [safeNumber])

  // Prepare data for PDF with safe numbers
  const prepareOverallPDFData = useCallback(async () => {
    try {
      const sectionsData = filteredSections.map(section => ({
        className: section.className || 'Unknown',
        section: section.section || 'Unknown',
        term1Total: safeNumber(section.term1Total),
        term2Total: safeNumber(section.term2Total),
        term3Total: safeNumber(section.term3Total),
        previousYearTotal: safeNumber(section.previousYearTotal),
        totalPendingAmount: safeNumber(section.totalPendingAmount),
        pendingCount: safeNumber(section.pendingStudentsCount),
        totalStudents: safeNumber(section.totalStudents),
        students: (section.students || []).map(s => ({
          rollNo: s.rollNo || 'N/A',
          name: s.name || 'Unknown',
          term1Pending: safeNumber(s.term1Pending),
          term2Pending: safeNumber(s.term2Pending),
          term3Pending: safeNumber(s.term3Pending),
          previousYearFee: safeNumber(s.previousYearFee),
          totalPending: safeNumber(s.totalPending)
        }))
      }))

      return generateClassWisePDFHTML({
        selectedClass: getSelectedClassLabel(),
        selectedSection: getSelectedSectionLabel(),
        selectedTerm,
        sections: sectionsData,
        grandTotals: {
          totalSections: filteredSections.length,
          totalStudents: safeNumber(grandTotals.totalStudents),
          term1Total: safeNumber(grandTotals.term1Total),
          term2Total: safeNumber(grandTotals.term2Total),
          term3Total: safeNumber(grandTotals.term3Total),
          previousYearTotal: safeNumber(grandTotals.previousYearTotal),
          totalAmount: safeNumber(grandTotals.totalAmount)
        },
        generatedAt: new Date(),
        isOverallReport: true
      })
    } catch (error) {
      console.error('Error preparing overall PDF:', error)
      throw error
    }
  }, [filteredSections, selectedTerm, getSelectedClassLabel, getSelectedSectionLabel, grandTotals, safeNumber])

  const prepareSectionPDFData = useCallback(async (section) => {
    try {
      if (!section) return ''

      const sortedStudents = [...(section.students || [])]
        .sort((a, b) => {
          const rollA = parseInt(a.rollNo) || 0
          const rollB = parseInt(b.rollNo) || 0
          return rollA - rollB
        })
        .map(s => ({
          rollNo: s.rollNo || 'N/A',
          name: s.name || 'Unknown',
          term1Pending: safeNumber(s.term1Pending),
          term2Pending: safeNumber(s.term2Pending),
          term3Pending: safeNumber(s.term3Pending),
          previousYearFee: safeNumber(s.previousYearFee),
          totalPending: safeNumber(s.totalPending)
        }))

      const sectionsData = [{
        className: section.className || 'Unknown',
        section: section.section || 'Unknown',
        term1Total: safeNumber(section.term1Total),
        term2Total: safeNumber(section.term2Total),
        term3Total: safeNumber(section.term3Total),
        previousYearTotal: safeNumber(section.previousYearTotal),
        totalPendingAmount: safeNumber(section.totalPendingAmount),
        pendingCount: safeNumber(section.pendingStudentsCount),
        totalStudents: safeNumber(section.totalStudents),
        students: sortedStudents
      }]

      return generateClassWisePDFHTML({
        selectedClass: section.className || 'Unknown',
        selectedSection: `Section ${section.section || 'Unknown'}`,
        selectedTerm,
        sections: sectionsData,
        grandTotals: {
          totalSections: 1,
          totalStudents: safeNumber(section.pendingStudentsCount),
          term1Total: safeNumber(section.term1Total),
          term2Total: safeNumber(section.term2Total),
          term3Total: safeNumber(section.term3Total),
          previousYearTotal: safeNumber(section.previousYearTotal),
          totalAmount: safeNumber(section.totalPendingAmount)
        },
        generatedAt: new Date(),
        isOverallReport: false
      })
    } catch (error) {
      console.error('Error preparing section PDF:', error)
      throw error
    }
  }, [selectedTerm, safeNumber])

  const handleDownload = useCallback(async () => {
    try {
      setDownloading(true)
      showToast('Generating PDF...', 'info')

      const htmlContent = await prepareOverallPDFData()

      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent,
        width: 612,
        height: 792,
      })

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
  }, [prepareOverallPDFData, showToast])

  const handlePrint = useCallback(async () => {
    try {
      setPrinting(true)
      showToast('Preparing print...', 'info')

      const htmlContent = await prepareOverallPDFData()

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
  }, [prepareOverallPDFData, showToast])

  const handleSectionDownload = useCallback(async () => {
    if (!selectedSectionData) return
    
    try {
      setDownloadingSection(true)
      showToast('Generating section PDF...', 'info')

      const htmlContent = await prepareSectionPDFData(selectedSectionData)

      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent,
        width: 612,
        height: 792,
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save ${selectedSectionData.className} - Section ${selectedSectionData.section} Report`,
          UTI: 'com.adobe.pdf',
        })
        
        showToast('Section PDF downloaded successfully', 'success')
      } else {
        showToast('Sharing is not available on this device', 'error')
      }
    } catch (error) {
      console.error('Section download error:', error)
      showToast('Failed to download: ' + error.message, 'error')
    } finally {
      setDownloadingSection(false)
    }
  }, [selectedSectionData, prepareSectionPDFData, showToast])

  const handleSectionPrint = useCallback(async () => {
    if (!selectedSectionData) return
    
    try {
      setPrintingSection(true)
      showToast('Preparing section print...', 'info')

      const htmlContent = await prepareSectionPDFData(selectedSectionData)

      await Print.printAsync({ 
        html: htmlContent
      })
      
      showToast('Section print job sent successfully', 'success')
    } catch (error) {
      console.error('Section print error:', error)
      showToast('Failed to print: ' + error.message, 'error')
    } finally {
      setPrintingSection(false)
    }
  }, [selectedSectionData, prepareSectionPDFData, showToast])

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    let totalStudents = 0
    let term1Total = 0
    let term2Total = 0
    let term3Total = 0
    let previousYearTotal = 0
    let totalAmount = 0

    filteredSections.forEach(section => {
      totalStudents += safeNumber(section.pendingStudentsCount)
      term1Total += safeNumber(section.term1Total)
      term2Total += safeNumber(section.term2Total)
      term3Total += safeNumber(section.term3Total)
      previousYearTotal += safeNumber(section.previousYearTotal)
      // For total amount, sum all terms + previous year
      totalAmount += safeNumber(section.term1Total) + 
                    safeNumber(section.term2Total) + 
                    safeNumber(section.term3Total) + 
                    safeNumber(section.previousYearTotal)
    })

    return {
      totalSections: filteredSections.length,
      totalStudents,
      term1Total,
      term2Total,
      term3Total,
      previousYearTotal,
      totalAmount
    }
  }, [filteredSections, safeNumber])

  const renderSectionCard = ({ item }) => {
    const hasPending = safeNumber(item.pendingStudentsCount) > 0
    const hasPreviousYearPending = safeNumber(item.previousYearTotal) > 0
    
    // For "All" option, show all three terms
    const showAllTerms = selectedTerm === 'All'
    
    // Calculate total based on selection - FIXED: For "All", explicitly sum all terms + previous year
    let totalDisplay = 0
    if (selectedTerm === 'Previous Year') {
      totalDisplay = safeNumber(item.previousYearTotal)
    } else if (selectedTerm === 'All') {
      // Explicitly sum all three terms + previous year
      totalDisplay = safeNumber(item.term1Total) + 
                    safeNumber(item.term2Total) + 
                    safeNumber(item.term3Total) + 
                    safeNumber(item.previousYearTotal)
    } else {
      const termTotal = selectedTerm === 'First Term' ? safeNumber(item.term1Total) :
                      selectedTerm === 'Second Term' ? safeNumber(item.term2Total) :
                      safeNumber(item.term3Total)
      totalDisplay = termTotal + safeNumber(item.previousYearTotal)
    }
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.sectionCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.border,
          borderLeftColor: hasPreviousYearPending ? colors.warning : (hasPending ? colors.warning : colors.success),
          borderLeftWidth: 4,
        }]}
        onPress={() => handleSectionPress(item)}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialIcons 
              name={hasPreviousYearPending ? "history" : (hasPending ? "warning" : "check-circle")} 
              size={20} 
              color={hasPreviousYearPending ? colors.warning : (hasPending ? colors.warning : colors.success)} 
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
              {hasPending ? `${item.pendingStudentsCount} to be paid` : 'All Cleared'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.feeSummary}>
          {/* Show all three terms when "All" is selected */}
          {showAllTerms && (
            <>
              {safeNumber(item.term1Total) > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="money-check" size={12} color={colors.primary} />
                  <ThemedText style={styles.feeLabel}>Term 1:</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.primary }]}>
                    {formatCurrency(item.term1Total)}
                  </ThemedText>
                </View>
              )}
              {safeNumber(item.term2Total) > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="money-check" size={12} color={colors.primary} />
                  <ThemedText style={styles.feeLabel}>Term 2:</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.primary }]}>
                    {formatCurrency(item.term2Total)}
                  </ThemedText>
                </View>
              )}
              {safeNumber(item.term3Total) > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="money-check" size={12} color={colors.primary} />
                  <ThemedText style={styles.feeLabel}>Term 3:</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.primary }]}>
                    {formatCurrency(item.term3Total)}
                  </ThemedText>
                </View>
              )}
            </>
          )}
          
          {/* Show single term when specific term is selected */}
          {!showAllTerms && selectedTerm !== 'Previous Year' && (
            <>
              {selectedTerm === 'First Term' && safeNumber(item.term1Total) > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="money-check" size={12} color={colors.warning} />
                  <ThemedText style={styles.feeLabel}>Term 1:</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.warning }]}>
                    {formatCurrency(item.term1Total)}
                  </ThemedText>
                </View>
              )}
              {selectedTerm === 'Second Term' && safeNumber(item.term2Total) > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="money-check" size={12} color={colors.warning} />
                  <ThemedText style={styles.feeLabel}>Term 2:</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.warning }]}>
                    {formatCurrency(item.term2Total)}
                  </ThemedText>
                </View>
              )}
              {selectedTerm === 'Third Term' && safeNumber(item.term3Total) > 0 && (
                <View style={styles.feeItem}>
                  <FontAwesome5 name="money-check" size={12} color={colors.warning} />
                  <ThemedText style={styles.feeLabel}>Term 3:</ThemedText>
                  <ThemedText style={[styles.feeValue, { color: colors.warning }]}>
                    {formatCurrency(item.term3Total)}
                  </ThemedText>
                </View>
              )}
            </>
          )}
          
          {/* Previous Year Fee Row - Always show if exists */}
          {hasPreviousYearPending && (
            <View style={[styles.feeItem, { backgroundColor: colors.warning + '10' }]}>
              <MaterialIcons name="history" size={12} color={colors.warning} />
              <ThemedText style={styles.feeLabel}>Previous Year:</ThemedText>
              <ThemedText style={[styles.feeValue, { color: colors.warning }]}>
                {formatCurrency(item.previousYearTotal)}
              </ThemedText>
            </View>
          )}

          {/* Total Row */}
          {totalDisplay > 0 && (
            <View style={[styles.feeItem, { backgroundColor: colors.danger + '10', marginTop: 4 }]}>
              <MaterialIcons name="payments" size={12} color={colors.danger} />
              <ThemedText style={styles.feeLabel}>Total Pending:</ThemedText>
              <ThemedText style={[styles.feeValue, { color: colors.danger, fontWeight: 'bold' }]}>
                {formatCurrency(totalDisplay)}
              </ThemedText>
            </View>
          )}

          {/* If no fees at all, show message */}
          {!hasPending && !hasPreviousYearPending && (
            <View style={styles.feeItem}>
              <ThemedText style={[styles.feeLabel, { color: colors.textSecondary }]}>
                No pending fees
              </ThemedText>
            </View>
          )}
        </View>

        {hasPending && (
          <View style={styles.studentsPreview}>
            <ThemedText style={styles.previewTitle}>
              Tap to view {item.pendingStudentsCount} student{item.pendingStudentsCount > 1 ? 's' : ''} with pending fees
              {hasPreviousYearPending && ' (includes previous year)'}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderSectionStudentsModal = () => {
    const getColumns = () => {
      switch(selectedTerm) {
        case 'First Term':
          return ['Roll No', 'Student Name', 'Term 1', 'Previous Year', 'Total']
        case 'Second Term':
          return ['Roll No', 'Student Name', 'Term 2', 'Previous Year', 'Total']
        case 'Third Term':
          return ['Roll No', 'Student Name', 'Term 3', 'Previous Year', 'Total']
        case 'Previous Year':
          return ['Roll No', 'Student Name', 'Previous Year', 'Total']
        case 'All':
          return ['Roll No', 'Student Name', 'Term 1', 'Term 2', 'Term 3', 'Previous Year', 'Total']
        default:
          return ['Roll No', 'Student Name', 'Term 1', 'Previous Year', 'Total']
      }
    }

    const columns = getColumns()
    
    const getColumnWidth = (index) => {
      const totalColumns = columns.length
      if (totalColumns === 4) {
        if (index === 0) return 60
        if (index === 1) return 150
        if (index === 2) return 100
        return 90
      } else if (totalColumns === 5) {
        if (index === 0) return 60
        if (index === 1) return 140
        if (index === 2) return 90
        if (index === 3) return 100
        return 90
      } else {
        if (index === 0) return 50
        if (index === 1) return 130
        if (index === 2) return 75
        if (index === 3) return 75
        if (index === 4) return 75
        if (index === 5) return 90
        return 80
      }
    }

    return (
      <Modal
        visible={showSectionStudentsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSectionStudentsModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.studentsModalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.modalTitle}>
                  {selectedSectionData?.className || 'Unknown'} - Section {selectedSectionData?.section || 'Unknown'}
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  Total Students: {selectedSectionData?.totalStudents || 0} | Pending: {selectedSectionData?.pendingStudentsCount || 0}
                </ThemedText>
              </View>
              <TouchableOpacity 
                onPress={() => setShowSectionStudentsModal(false)} 
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionActionButtons}>
              <TouchableOpacity 
                style={[styles.sectionDownloadButton, { backgroundColor: colors.success }]}
                onPress={handleSectionDownload}
                disabled={downloadingSection || printingSection}
              >
                {downloadingSection ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="download" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.sectionActionButtonText}>Download</ThemedText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sectionPrintButton, { backgroundColor: colors.primary }]}
                onPress={handleSectionPrint}
                disabled={downloadingSection || printingSection}
              >
                {printingSection ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="printer" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.sectionActionButtonText}>Print</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ padding: 20 }}>
              <View>
                <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
                  {columns.map((col, index) => (
                    <ThemedText 
                      key={col}
                      style={[
                        styles.headerCell, 
                        { 
                          width: getColumnWidth(index),
                          backgroundColor: colors.primary,
                          color: '#FFFFFF',
                        }
                      ]}
                    >
                      {col}
                    </ThemedText>
                  ))}
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.tableRowsContainer}
                >
                  {sectionStudents.length > 0 ? (
                    sectionStudents.map((student, rowIndex) => {
                      const rowBackgroundColor = rowIndex % 2 === 0 ? colors.inputBackground : colors.cardBackground
                      
                      // Calculate total based on term selection
                      const totalForStudent = selectedTerm === 'Previous Year' 
                        ? safeNumber(student.previousYearFee)
                        : selectedTerm === 'All'
                          ? safeNumber(student.term1Pending) + safeNumber(student.term2Pending) + safeNumber(student.term3Pending) + safeNumber(student.previousYearFee)
                          : selectedTerm === 'First Term'
                            ? safeNumber(student.term1Pending) + safeNumber(student.previousYearFee)
                            : selectedTerm === 'Second Term'
                              ? safeNumber(student.term2Pending) + safeNumber(student.previousYearFee)
                              : safeNumber(student.term3Pending) + safeNumber(student.previousYearFee)
                      
                      return (
                        <View key={student.id} style={[styles.tableRow, { backgroundColor: rowBackgroundColor }]}>
                          <ThemedText style={[styles.tableCell, { width: getColumnWidth(0) }]}>
                            {student.rollNo}
                          </ThemedText>
                          
                          <ThemedText style={[styles.tableCell, { width: getColumnWidth(1), textAlign: 'left' }]} numberOfLines={1}>
                            {student.name}
                          </ThemedText>
                          
                          {selectedTerm === 'First Term' && (
                            <>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(2) }]}>
                                {formatCurrency(student.term1Pending)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(3), backgroundColor: colors.warning + '20', fontWeight: 'bold', color: colors.warning }]}>
                                {formatCurrency(student.previousYearFee)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(4), backgroundColor: colors.danger + '20', fontWeight: 'bold', color: colors.danger }]}>
                                {formatCurrency(totalForStudent)}
                              </ThemedText>
                            </>
                          )}
                          
                          {selectedTerm === 'Second Term' && (
                            <>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(2) }]}>
                                {formatCurrency(student.term2Pending)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(3), backgroundColor: colors.warning + '20', fontWeight: 'bold', color: colors.warning }]}>
                                {formatCurrency(student.previousYearFee)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(4), backgroundColor: colors.danger + '20', fontWeight: 'bold', color: colors.danger }]}>
                                {formatCurrency(totalForStudent)}
                              </ThemedText>
                            </>
                          )}
                          
                          {selectedTerm === 'Third Term' && (
                            <>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(2) }]}>
                                {formatCurrency(student.term3Pending)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(3), backgroundColor: colors.warning + '20', fontWeight: 'bold', color: colors.warning }]}>
                                {formatCurrency(student.previousYearFee)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(4), backgroundColor: colors.danger + '20', fontWeight: 'bold', color: colors.danger }]}>
                                {formatCurrency(totalForStudent)}
                              </ThemedText>
                            </>
                          )}
                          
                          {selectedTerm === 'Previous Year' && (
                            <>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(2), backgroundColor: colors.warning + '20', fontWeight: 'bold', color: colors.warning }]}>
                                {formatCurrency(student.previousYearFee)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(3), backgroundColor: colors.danger + '20', fontWeight: 'bold', color: colors.danger }]}>
                                {formatCurrency(student.previousYearFee)}
                              </ThemedText>
                            </>
                          )}
                          
                          {selectedTerm === 'All' && (
                            <>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(2) }]}>
                                {formatCurrency(student.term1Pending)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(3) }]}>
                                {formatCurrency(student.term2Pending)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(4) }]}>
                                {formatCurrency(student.term3Pending)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(5), backgroundColor: colors.warning + '20', fontWeight: 'bold', color: colors.warning }]}>
                                {formatCurrency(student.previousYearFee)}
                              </ThemedText>
                              <ThemedText style={[styles.tableCell, { width: getColumnWidth(6), backgroundColor: colors.danger + '20', fontWeight: 'bold', color: colors.danger }]}>
                                {formatCurrency(totalForStudent)}
                              </ThemedText>
                            </>
                          )}
                        </View>
                      )
                    })
                  ) : (
                    <View style={styles.noStudentsContainer}>
                      <MaterialIcons name="school" size={48} color={colors.textSecondary} />
                      <ThemedText style={styles.noStudentsText}>No students found</ThemedText>
                    </View>
                  )}
                </ScrollView>

                {sectionStudents.length > 0 && (
                  <View style={[styles.tableFooter, { backgroundColor: colors.primary + '20' }]}>
                    <ThemedText style={[styles.footerCell, { width: getColumnWidth(0) }]}>Total</ThemedText>
                    <ThemedText style={[styles.footerCell, { width: getColumnWidth(1) }]}></ThemedText>
                    
                    {selectedTerm === 'First Term' && (
                      <>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(2), fontWeight: 'bold' }]}>
                          {formatCurrency(selectedSectionData?.term1Total || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(3), backgroundColor: colors.warning + '30', fontWeight: 'bold', color: colors.warning }]}>
                          {formatCurrency(selectedSectionData?.previousYearTotal || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(4), backgroundColor: colors.danger + '30', fontWeight: 'bold', color: colors.danger }]}>
                          {formatCurrency((selectedSectionData?.term1Total || 0) + (selectedSectionData?.previousYearTotal || 0))}
                        </ThemedText>
                      </>
                    )}
                    
                    {selectedTerm === 'Second Term' && (
                      <>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(2), fontWeight: 'bold' }]}>
                          {formatCurrency(selectedSectionData?.term2Total || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(3), backgroundColor: colors.warning + '30', fontWeight: 'bold', color: colors.warning }]}>
                          {formatCurrency(selectedSectionData?.previousYearTotal || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(4), backgroundColor: colors.danger + '30', fontWeight: 'bold', color: colors.danger }]}>
                          {formatCurrency((selectedSectionData?.term2Total || 0) + (selectedSectionData?.previousYearTotal || 0))}
                        </ThemedText>
                      </>
                    )}
                    
                    {selectedTerm === 'Third Term' && (
                      <>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(2), fontWeight: 'bold' }]}>
                          {formatCurrency(selectedSectionData?.term3Total || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(3), backgroundColor: colors.warning + '30', fontWeight: 'bold', color: colors.warning }]}>
                          {formatCurrency(selectedSectionData?.previousYearTotal || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(4), backgroundColor: colors.danger + '30', fontWeight: 'bold', color: colors.danger }]}>
                          {formatCurrency((selectedSectionData?.term3Total || 0) + (selectedSectionData?.previousYearTotal || 0))}
                        </ThemedText>
                      </>
                    )}
                    
                    {selectedTerm === 'Previous Year' && (
                      <>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(2), backgroundColor: colors.warning + '30', fontWeight: 'bold', color: colors.warning }]}>
                          {formatCurrency(selectedSectionData?.previousYearTotal || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(3), backgroundColor: colors.danger + '30', fontWeight: 'bold', color: colors.danger }]}>
                          {formatCurrency(selectedSectionData?.previousYearTotal || 0)}
                        </ThemedText>
                      </>
                    )}
                    
                    {selectedTerm === 'All' && (
                      <>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(2), fontWeight: 'bold' }]}>
                          {formatCurrency(selectedSectionData?.term1Total || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(3), fontWeight: 'bold' }]}>
                          {formatCurrency(selectedSectionData?.term2Total || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(4), fontWeight: 'bold' }]}>
                          {formatCurrency(selectedSectionData?.term3Total || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(5), backgroundColor: colors.warning + '30', fontWeight: 'bold', color: colors.warning }]}>
                          {formatCurrency(selectedSectionData?.previousYearTotal || 0)}
                        </ThemedText>
                        <ThemedText style={[styles.footerCell, { width: getColumnWidth(6), backgroundColor: colors.danger + '30', fontWeight: 'bold', color: colors.danger }]}>
                          {formatCurrency(
                            (selectedSectionData?.term1Total || 0) + 
                            (selectedSectionData?.term2Total || 0) + 
                            (selectedSectionData?.term3Total || 0) + 
                            (selectedSectionData?.previousYearTotal || 0)
                          )}
                        </ThemedText>
                      </>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const renderDropdownModal = (visible, onClose, options, selectedValue, onSelect, title, isLoading = false) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Feather name="x" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.modalLoadingText}>Loading...</ThemedText>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border + '30' },
                    selectedValue === option.value && { backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => onSelect(option.value)}
                >
                  <ThemedText style={[
                    styles.modalItemText,
                    selectedValue === option.value && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
                  ]}>
                    {option.label}
                  </ThemedText>
                  {selectedValue === option.value && (
                    <Feather name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const getLoadingMessage = () => {
    switch(loadingState) {
      case 'loadingClasses':
        return 'Loading classes and sections...'
      case 'loadingFeeData':
        return 'Loading fee data...'
      default:
        return 'Loading...'
    }
  }

  const isActionDisabled = downloading || printing || filteredSections.length === 0

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
    title: { fontSize: 18, color: '#FFFFFF', marginBottom: -5, fontFamily: 'Poppins-SemiBold' },
    subtitle: { marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins-Medium' },
    
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
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    filterRowLast: { marginBottom: 0 },
    
    dropdownButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,    
    },
    dropdownButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    dropdownButtonText: { fontSize: 14, fontFamily: 'Poppins-Medium', color: colors.text, flex: 1 },
    
    termDropdownButton: {
      width: '49%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    
    actionButtonsContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    
    downloadButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.success,
      elevation: 3,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    downloadButtonText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF' },
    
    printButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: width * 0.85,
      maxHeight: height * 0.7,
      borderRadius: 24,
      overflow: 'hidden',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: colors.text },
    modalSubtitle: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.textSecondary, marginTop: 2 },
    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
    },
    modalScrollContent: { paddingVertical: 8 },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    modalItemText: { fontSize: 16, fontFamily: 'Poppins-Medium', color: colors.text },
    modalLoadingContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    modalLoadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary, fontFamily: 'Poppins-Medium' },
    
    studentsModalContent: {
      width: width * 0.95,
      maxHeight: height * 0.85,
      borderRadius: 24,
      overflow: 'hidden',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    headerCell: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: '#FFFFFF',
      textAlign: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRightWidth: 1,
      borderRightColor: 'rgba(255,255,255,0.2)',
    },
    tableRowsContainer: { paddingBottom: 0 },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableCell: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
      textAlign: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    tableFooter: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 0,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      marginTop: 4,
    },
    footerCell: {
      fontSize: 12,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      textAlign: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    sectionActionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionDownloadButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    sectionPrintButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    sectionActionButtonText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF' },
    noStudentsContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    noStudentsText: { marginTop: 12, fontSize: 14, fontFamily: 'Poppins-Medium', color: colors.textSecondary },
    
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    listTitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: colors.text },
    listCountBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    listCountText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: colors.primary },
    
    sectionCard: {
      borderRadius: 16,
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
      elevation: 2,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    sectionTitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: colors.text },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontFamily: 'Poppins-SemiBold' },
    
    feeSummary: { marginBottom: 12 },
    feeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
      marginBottom: 4,
    },
    feeLabel: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: colors.textSecondary, marginLeft: 8, width: 100 },
    feeValue: { fontSize: 13, fontFamily: 'Poppins-Bold', flex: 1, textAlign: 'right' },
    
    studentsPreview: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border + '30' },
    previewTitle: { fontSize: 12, fontFamily: 'Poppins-Medium', color: colors.primary, textAlign: 'center' },
    
    listContainer: { padding: 16, paddingBottom: 20 },
    
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
    emptyIcon: { marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins-SemiBold', textAlign: 'center', marginBottom: 8, color: colors.text },
    emptySubtitle: { fontSize: 14, fontFamily: 'Poppins-Medium', textAlign: 'center', marginBottom: 24, color: colors.textSecondary, lineHeight: 20 },
    
    loadingCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      minWidth: 200,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    loadingText: { marginTop: 12, color: colors.text, fontFamily: 'Poppins-Medium', fontSize: 14, textAlign: 'center' },
    
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    errorText: { fontSize: 16, fontFamily: 'Poppins-Medium', color: colors.danger, textAlign: 'center', marginBottom: 16 },
    retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  })

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
        
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowClassModal(true)}
              activeOpacity={0.8}
              disabled={loadingState === 'loadingClasses'}
            >
              <View style={styles.dropdownButtonContent}>
                <MaterialIcons name="class" size={18} color={colors.primary} />
                <ThemedText style={styles.dropdownButtonText} numberOfLines={1}>
                  {loadingState === 'loadingClasses' ? 'Loading classes...' : getSelectedClassLabel()}
                </ThemedText>
              </View>
              <Feather name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowSectionModal(true)}
              activeOpacity={0.8}
              disabled={loadingState === 'loadingClasses' || selectedClass === 'ALL'}
            >
              <View style={styles.dropdownButtonContent}>
                <MaterialIcons name="view-module" size={18} color={colors.primary} />
                <ThemedText style={styles.dropdownButtonText} numberOfLines={1}>
                  {loadingState === 'loadingClasses' ? 'Loading sections...' : getSelectedSectionLabel()}
                </ThemedText>
              </View>
              <Feather name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.filterRow, styles.filterRowLast]}>
            <TouchableOpacity 
              style={styles.termDropdownButton}
              onPress={() => setShowTermModal(true)}
              activeOpacity={0.8}
              disabled={loadingState === 'loadingClasses' || loadingState === 'loadingFeeData'}
            >
              <View style={styles.dropdownButtonContent}>
                <Feather name="book" size={18} color={colors.primary} />
                <ThemedText style={styles.dropdownButtonText} numberOfLines={1}>
                  {selectedTerm}
                </ThemedText>
              </View>
              <Feather name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={handleDownload}
                activeOpacity={0.8}
                disabled={isActionDisabled || loadingState !== 'loaded'}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="download" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.downloadButtonText}>
                      Download
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.printButton}
                onPress={handlePrint}
                activeOpacity={0.8}
                disabled={isActionDisabled || loadingState !== 'loaded'}
              >
                {printing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="printer" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {loadingState === 'loaded' && filteredSections.length > 0 && (
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
        )}
        
        {loadingState === 'loadingClasses' || loadingState === 'loadingFeeData' ? (
          <View style={styles.emptyContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                {getLoadingMessage()}
              </ThemedText>
            </View>
          </View>
        ) : loadingState === 'error' ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.danger} />
            <ThemedText style={styles.errorText}>
              Failed to load data. Please try again.
            </ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadClassesAndSections}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : filteredSections.length > 0 ? (
          <FlatList
            data={filteredSections}
            renderItem={renderSectionCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
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
        
        {renderDropdownModal(
          showClassModal,
          () => setShowClassModal(false),
          classes,
          selectedClass,
          handleClassChange,
          'Select Class',
          false
        )}
        
        {renderDropdownModal(
          showSectionModal,
          () => setShowSectionModal(false),
          sections,
          selectedSection,
          handleSectionChange,
          'Select Section',
          false
        )}
        
        {renderDropdownModal(
          showTermModal,
          () => setShowTermModal(false),
          TERM_OPTIONS,
          selectedTerm,
          handleTermChange,
          'Select Term'
        )}
        
        {renderSectionStudentsModal()}
        
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