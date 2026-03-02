import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, MaterialIcons, Ionicons, Feather, FontAwesome6, FontAwesome } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import FeePaymentModal from './FeePaymentModal'
import StudentPaymentHistory from './StudentPaymentHistory'

export default function StudentFeeDetails({ visible, onClose, student, onPaymentSuccess }) {
  const { colors } = useTheme()
  const [feeDetails, setFeeDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [expandedComponents, setExpandedComponents] = useState({})
  const [expandedPreviousYears, setExpandedPreviousYears] = useState({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [showStudentPaymentHistory, setShowStudentPaymentHistory] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    if (visible && student) {
      fetchStudentFeeDetails(student.id || student._id)
    } else {
      setFeeDetails(null)
      setError(null)
      setSelectedTab('overview')
      setExpandedComponents({})
      setExpandedPreviousYears({})
      setShowPaymentModal(false)
      setPaymentData(null)
      setPaymentHistory([])
    }
  }, [visible, student])

  const fetchStudentFeeDetails = async (studentId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axiosApi.get(`/fees/students/${studentId}/fee-details`)

      if (response.data.success) {
        setFeeDetails(response.data.data)
      } else {
        setError(response.data.message || 'Failed to fetch fee details')
        showToast(response.data.message || 'Failed to fetch fee details', 'error')
      }
    } catch (error) {
      console.error('Fetch fee details error:', error)
      
      let errorMessage = 'Failed to fetch fee details'
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Fee details not found for this student'
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required'
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error, please try again later'
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.'
      }

      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async () => {
    if (!student?.id) return
    
    setLoadingHistory(true)
    try {
      const response = await axiosApi.get(`/fees/students/${student.id}/payment-history`)
      
      if (response.data.success) {
        setPaymentHistory(response.data.data.payments || [])
        setShowStudentPaymentHistory(true)
      } else {
        showToast(response.data.message || 'Failed to fetch payment history', 'error')
      }
    } catch (error) {
      console.error('Fetch payment history error:', error)
      showToast('Failed to fetch payment history', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handlePayNow = (paymentType, data) => {
    if (!feeDetails) return
    
    const { summary, feeBreakdown, termWiseBreakdown, termDistribution, previousYearDetails } = feeDetails
    
    let paymentDetails = {
      studentId: student.id || student._id,
      studentName: student.name,
      academicYear: '2024-2025',
      description: '',
      defaultAmounts: {
        schoolFee: 0,
        transportFee: 0,
        hostelFee: 0
      },
      previousYearFee: summary?.previousYearFee || 0,
      currentYearDue: summary?.currentYearDue || 0,
      totalDue: summary?.totalDue || 0
    }
    
    switch(paymentType) {
      case 'total':
        let totalSchoolFeeDue = 0
        let totalTransportFeeDue = 0
        let totalHostelFeeDue = 0
        
        // Add current year dues
        if (feeBreakdown) {
          totalSchoolFeeDue += feeBreakdown.schoolFee?.due || 0
          totalTransportFeeDue += feeBreakdown.transportFee?.due || 0
          totalHostelFeeDue += feeBreakdown.hostelFee?.due || 0
        }
        
        // Add previous years dues by component
        if (previousYearDetails && previousYearDetails.length > 0) {
          previousYearDetails.forEach(year => {
            if (year.remainingBreakdown) {
              totalSchoolFeeDue += year.remainingBreakdown.school || 0
              totalTransportFeeDue += year.remainingBreakdown.transport || 0
              totalHostelFeeDue += year.remainingBreakdown.hostel || 0
            }
          })
        }
        
        paymentDetails = {
          ...paymentDetails,
          description: 'Full Payment (All Outstanding)',
          defaultAmounts: {
            schoolFee: totalSchoolFeeDue,
            transportFee: totalTransportFeeDue,
            hostelFee: totalHostelFeeDue
          },
          paymentType: 'total',
          totalDue: summary?.totalDue || 0
        }
        break
        
      case 'currentYear':
        const feeComp = feeBreakdown || {}
        
        paymentDetails = {
          ...paymentDetails,
          description: 'Current Year Full Payment',
          defaultAmounts: {
            schoolFee: feeComp.schoolFee?.due || 0,
            transportFee: feeComp.transportFee?.due || 0,
            hostelFee: feeComp.hostelFee?.due || 0
          },
          paymentType: 'currentYear'
        }
        break
        
      case 'term':
        const termNum = data.termNumber
        const termData = termWiseBreakdown?.[`term${termNum}`] || {}
        
        paymentDetails = {
          ...paymentDetails,
          term: termNum,
          description: `Term ${termNum} Payment`,
          defaultAmounts: {
            schoolFee: termData.components?.schoolFee?.remaining || 0,
            transportFee: termData.components?.transportFee?.remaining || 0,
            hostelFee: termData.components?.hostelFee?.remaining || 0
          },
          paymentType: 'term'
        }
        break
        
        case 'previousYear':
          const yearData = data.yearData
          
          // Get the accurate remaining amounts from remainingBreakdown
          const remainingBreakdown = yearData.remainingBreakdown || {
            school: 0,
            transport: 0,
            hostel: 0,
            total: yearData.totalDue || 0
          }
          
          console.log('Previous Year Payment - Frontend Setup:', {
            academicYear: yearData.academicYear,
            remainingBreakdown,
            totalDue: yearData.totalDue,
            schoolRemaining: remainingBreakdown.school,
            transportRemaining: remainingBreakdown.transport,
            hostelRemaining: remainingBreakdown.hostel
          })
          
          paymentDetails = {
            ...paymentDetails,
            previousYearIndex: data.yearIndex,
            description: `Previous Year (${yearData.academicYear}) Payment`,
            defaultAmounts: {
              schoolFee: remainingBreakdown.school,
              transportFee: remainingBreakdown.transport,
              hostelFee: remainingBreakdown.hostel
            },
            paymentType: 'previousYear',
            previousYearDetails: yearData,
            previousYearFee: remainingBreakdown.total,
            currentYearDue: 0,
            totalDue: remainingBreakdown.total,
            // Store the full remaining breakdown for reference
            remainingBreakdown: remainingBreakdown
          }
          
          console.log('Payment Details Set:', {
            defaultAmounts: paymentDetails.defaultAmounts,
            totalDue: paymentDetails.totalDue
          })
          break
        
      case 'allPreviousYears':
        let totalAllSchoolFeeDue = 0
        let totalAllTransportFeeDue = 0
        let totalAllHostelFeeDue = 0
        
        if (previousYearDetails && previousYearDetails.length > 0) {
          previousYearDetails.forEach(year => {
            if (year.remainingBreakdown) {
              totalAllSchoolFeeDue += year.remainingBreakdown.school || 0
              totalAllTransportFeeDue += year.remainingBreakdown.transport || 0
              totalAllHostelFeeDue += year.remainingBreakdown.hostel || 0
            }
          })
        }
        
        paymentDetails = {
          ...paymentDetails,
          description: 'All Previous Years Payment',
          defaultAmounts: {
            schoolFee: totalAllSchoolFeeDue,
            transportFee: totalAllTransportFeeDue,
            hostelFee: totalAllHostelFeeDue
          },
          paymentType: 'allPreviousYears',
          previousYearFee: summary?.previousYearFee,
          currentYearDue: 0,
          totalDue: summary?.previousYearFee
        }
        break
        
      case 'component':
        paymentDetails = {
          ...paymentDetails,
          ...data,
          paymentType: 'component'
        }
        break
        
      default:
        break
    }
    
    setPaymentData(paymentDetails)
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = (paymentResult) => {
    fetchStudentFeeDetails(student.id || student._id)
    
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentResult)
    }
    
    showToast('Payment processed successfully', 'success')
  }

  const toggleComponentExpansion = (componentKey) => {
    setExpandedComponents(prev => ({
      ...prev,
      [componentKey]: !prev[componentKey]
    }))
  }

  const togglePreviousYearExpansion = (yearIndex) => {
    setExpandedPreviousYears(prev => ({
      ...prev,
      [yearIndex]: !prev[yearIndex]
    }))
  }

  const getTabOptions = () => {
    const options = [
      { label: 'Overview', value: 'overview', icon: 'grid-view' }
    ]
    
    if (feeDetails?.previousYearDetails?.length > 0) {
      options.push({
        label: 'Previous Years',
        value: 'previous',
        icon: 'history',
        count: feeDetails.previousYearDetails.length
      })
    }

    if (feeDetails?.termWiseBreakdown) {
      Object.keys(feeDetails.termWiseBreakdown).forEach(termKey => {
        const term = feeDetails.termWiseBreakdown[termKey]
        const termNumber = termKey.replace('term', '')
        options.push({
          label: `Term ${termNumber}`,
          value: `term${termNumber}`,
          status: term.status
        })
      })
    }
    
    return options
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return colors.success
      case 'Partial': return colors.warning
      case 'Unpaid': return colors.danger
      default: return colors.textSecondary
    }
  }

  const renderPreviousYearDetails = () => {
    if (!feeDetails?.previousYearDetails || feeDetails.previousYearDetails.length === 0) {
      return null
    }

    const { previousYearDetails } = feeDetails

    return (
      <View style={styles.previousYearsContainer}>
        {previousYearDetails.map((year, index) => {
          const isExpanded = expandedPreviousYears[index]
          
          return (
            <View 
              key={index} 
              style={[
                styles.previousYearItem, 
                { 
                  backgroundColor: colors.inputBackground,
                  borderLeftColor: year.isFullyPaid ? colors.success : colors.warning,
                  borderLeftWidth: 4
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.previousYearHeader}
                onPress={() => togglePreviousYearExpansion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.previousYearHeaderLeft}>
                  <MaterialIcons name="history" size={18} color={year.isFullyPaid ? colors.success : colors.warning} />
                  <View>
                    <ThemedText style={styles.previousYearTitle}>
                      {year.academicYear}
                    </ThemedText>
                    <ThemedText style={styles.previousYearClass}>
                      {year.classLabel} • Section {year.section}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.previousYearHeaderRight}>
                  <View style={[
                    styles.previousYearStatusBadge, 
                    { backgroundColor: year.isFullyPaid ? colors.success + '20' : colors.warning + '20' }
                  ]}>
                    <ThemedText style={[
                      styles.previousYearStatusText, 
                      { color: year.isFullyPaid ? colors.success : colors.warning }
                    ]}>
                      {year.isFullyPaid ? 'Paid' : `Due: ₹${year.totalDue?.toLocaleString()}`}
                    </ThemedText>
                  </View>
                  <MaterialIcons 
                    name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.previousYearExpanded}>
                  {/* Summary Amounts */}
                  <View style={styles.previousYearAmounts}>
                    <View style={styles.previousYearAmount}>
                      <ThemedText style={styles.previousYearAmountLabel}>Original</ThemedText>
                      <ThemedText style={styles.previousYearAmountValue}>
                        ₹{year.originalTotalFee?.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={styles.previousYearAmount}>
                      <ThemedText style={styles.previousYearAmountLabel}>Discounted</ThemedText>
                      <ThemedText style={styles.previousYearAmountValue}>
                        ₹{year.discountedTotalFee?.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={styles.previousYearAmount}>
                      <ThemedText style={styles.previousYearAmountLabel}>Paid</ThemedText>
                      <ThemedText style={[styles.previousYearAmountValue, { color: colors.success }]}>
                        ₹{year.totalPaid?.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={styles.previousYearAmount}>
                      <ThemedText style={styles.previousYearAmountLabel}>Due</ThemedText>
                      <ThemedText style={[styles.previousYearAmountValue, { color: colors.danger }]}>
                        ₹{year.totalDue?.toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Term-wise Breakdown with Components - Only Show Unpaid/Partial Terms */}
                  {year.termPayments && (
                    <View style={styles.previousYearTermPayments}>
                      <ThemedText style={styles.previousYearSubtitle}>Outstanding Fees Breakdown</ThemedText>
                      
                      {/* Filter to show only terms with remaining balance */}
                      {Object.entries(year.termPayments).map(([termKey, termData]) => {
                        if (termData.remaining <= 0) return null // Skip fully paid terms
                        
                        const termNumber = termKey.replace('term', '')
                        
                        return (
                          <View key={termKey} style={styles.previousYearTermCard}>
                            <View style={styles.previousYearTermHeader}>
                              <ThemedText style={styles.previousYearTermTitle}>Term {termNumber}</ThemedText>
                              <View style={[
                                styles.termStatusBadge, 
                                { 
                                  backgroundColor: termData.remaining === 0 
                                    ? colors.success + '20' 
                                    : termData.paid > 0 
                                      ? colors.warning + '20' 
                                      : colors.danger + '20' 
                                }
                              ]}>
                                <ThemedText style={[
                                  styles.termStatusText, 
                                  { 
                                    color: termData.remaining === 0 
                                      ? colors.success 
                                      : termData.paid > 0 
                                        ? colors.warning 
                                        : colors.danger 
                                  }
                                ]}>
                                  {termData.remaining === 0 
                                    ? 'Paid' 
                                    : termData.paid > 0 
                                      ? 'Partial' 
                                      : 'Unpaid'}
                                </ThemedText>
                              </View>
                            </View>

                            {/* Component Breakdown - Only Show Components with Remaining Balance */}
                            {termData.components && (
                              <View style={styles.componentBreakdown}>
                                {/* School Fee - Only show if has remaining balance */}
                                {termData.components.schoolFee && 
                                termData.components.schoolFee.remaining > 0 && (
                                  <View style={styles.componentRow}>
                                    <View style={styles.componentLabelContainer}>
                                      <Feather name="book" size={12} color={colors.primary} />
                                      <ThemedText style={styles.componentLabel}>School Fee</ThemedText>
                                    </View>
                                    <View style={styles.componentAmounts}>
                                      <ThemedText style={[styles.componentAmount, { color: colors.danger }]}>
                                        ₹{termData.components.schoolFee.due.toLocaleString()}
                                      </ThemedText>
                                      <ThemedText style={styles.componentSeparator}>→</ThemedText>
                                      <ThemedText style={[styles.componentAmount, { color: colors.success }]}>
                                        ₹{termData.components.schoolFee.paid.toLocaleString()}
                                      </ThemedText>
                                      {termData.components.schoolFee.remaining > 0 && (
                                        <>
                                          <ThemedText style={styles.componentSeparator}>→</ThemedText>
                                          <ThemedText style={[styles.componentAmount, { color: colors.warning }]}>
                                            ₹{termData.components.schoolFee.remaining.toLocaleString()}
                                          </ThemedText>
                                        </>
                                      )}
                                    </View>
                                  </View>
                                )}

                                {/* Transport Fee - Only show if has remaining balance */}
                                {termData.components.transportFee && 
                                termData.components.transportFee.remaining > 0 && (
                                  <View style={styles.componentRow}>
                                    <View style={styles.componentLabelContainer}>
                                      <Feather name="truck" size={12} color={colors.info} />
                                      <ThemedText style={styles.componentLabel}>Transport Fee</ThemedText>
                                    </View>
                                    <View style={styles.componentAmounts}>
                                      <ThemedText style={[styles.componentAmount, { color: colors.danger }]}>
                                        ₹{termData.components.transportFee.due.toLocaleString()}
                                      </ThemedText>
                                      <ThemedText style={styles.componentSeparator}>→</ThemedText>
                                      <ThemedText style={[styles.componentAmount, { color: colors.success }]}>
                                        ₹{termData.components.transportFee.paid.toLocaleString()}
                                      </ThemedText>
                                      {termData.components.transportFee.remaining > 0 && (
                                        <>
                                          <ThemedText style={styles.componentSeparator}>→</ThemedText>
                                          <ThemedText style={[styles.componentAmount, { color: colors.warning }]}>
                                            ₹{termData.components.transportFee.remaining.toLocaleString()}
                                          </ThemedText>
                                        </>
                                      )}
                                    </View>
                                  </View>
                                )}

                                {/* Hostel Fee - Only show if has remaining balance */}
                                {termData.components.hostelFee && 
                                termData.components.hostelFee.remaining > 0 && (
                                  <View style={styles.componentRow}>
                                    <View style={styles.componentLabelContainer}>
                                      <Feather name="home" size={12} color={colors.warning} />
                                      <ThemedText style={styles.componentLabel}>Hostel Fee</ThemedText>
                                    </View>
                                    <View style={styles.componentAmounts}>
                                      <ThemedText style={[styles.componentAmount, { color: colors.danger }]}>
                                        ₹{termData.components.hostelFee.due.toLocaleString()}
                                      </ThemedText>
                                      <ThemedText style={styles.componentSeparator}>→</ThemedText>
                                      <ThemedText style={[styles.componentAmount, { color: colors.success }]}>
                                        ₹{termData.components.hostelFee.paid.toLocaleString()}
                                      </ThemedText>
                                      {termData.components.hostelFee.remaining > 0 && (
                                        <>
                                          <ThemedText style={styles.componentSeparator}>→</ThemedText>
                                          <ThemedText style={[styles.componentAmount, { color: colors.warning }]}>
                                            ₹{termData.components.hostelFee.remaining.toLocaleString()}
                                          </ThemedText>
                                        </>
                                      )}
                                    </View>
                                  </View>
                                )}
                              </View>
                            )}

                            {/* Term Total - Only show if term has remaining balance */}
                            <View style={styles.termTotalRow}>
                              <ThemedText style={styles.termTotalLabel}>Term Total</ThemedText>
                              <View style={styles.termTotalAmounts}>
                                <ThemedText style={styles.termTotalDue}>
                                  ₹{termData.due.toLocaleString()}
                                </ThemedText>
                                <ThemedText style={styles.termTotalSeparator}>→</ThemedText>
                                <ThemedText style={[styles.termTotalPaid, { color: colors.success }]}>
                                  ₹{termData.paid.toLocaleString()}
                                </ThemedText>
                                {termData.remaining > 0 && (
                                  <>
                                    <ThemedText style={styles.termTotalSeparator}>→</ThemedText>
                                    <ThemedText style={[styles.termTotalRemaining, { color: colors.warning }]}>
                                      ₹{termData.remaining.toLocaleString()}
                                    </ThemedText>
                                  </>
                                )}
                              </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={styles.termProgressContainer}>
                              <View style={[styles.termProgressBar, { backgroundColor: colors.border }]}>
                                <View 
                                  style={[
                                    styles.termProgressFill, 
                                    { 
                                      width: termData.due > 0 
                                        ? `${(termData.paid / termData.due * 100)}%` 
                                        : '0%',
                                      backgroundColor: termData.remaining === 0 
                                        ? colors.success 
                                        : termData.paid > 0 
                                          ? colors.warning 
                                          : colors.danger 
                                    }
                                  ]} 
                                />
                              </View>
                              <ThemedText style={styles.termProgressText}>
                                {termData.due > 0 
                                  ? `${((termData.paid / termData.due * 100)).toFixed(1)}% Paid` 
                                  : '0% Paid'}
                              </ThemedText>
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  )}

                  {/* Discounts - Only show if any discounts applied */}
                  {year.discounts && (year.discounts.school > 0 || year.discounts.transport > 0 || year.discounts.hostel > 0) && (
                    <View style={styles.previousYearDiscounts}>
                      <ThemedText style={styles.previousYearSubtitle}>Discounts Applied</ThemedText>
                      <View style={styles.previousYearDiscountsList}>
                        {year.discounts.school > 0 && (
                          <View style={[styles.discountChip, { backgroundColor: colors.primary + '20' }]}>
                            <Feather name="tag" size={10} color={colors.primary} />
                            <ThemedText style={[styles.discountChipText, { color: colors.primary }]}>
                              School: {year.discounts.school}%
                            </ThemedText>
                          </View>
                        )}
                        {year.discounts.transport > 0 && (
                          <View style={[styles.discountChip, { backgroundColor: colors.info + '20' }]}>
                            <Feather name="tag" size={10} color={colors.info} />
                            <ThemedText style={[styles.discountChipText, { color: colors.info }]}>
                              Transport: {year.discounts.transport}%
                            </ThemedText>
                          </View>
                        )}
                        {year.discounts.hostel > 0 && (
                          <View style={[styles.discountChip, { backgroundColor: colors.warning + '20' }]}>
                            <Feather name="tag" size={10} color={colors.warning} />
                            <ThemedText style={[styles.discountChipText, { color: colors.warning }]}>
                              Hostel: {year.discounts.hostel}%
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Pay Button - Only show if not fully paid */}
                  {!year.isFullyPaid && (
                    <TouchableOpacity 
                      style={[styles.payPreviousYearButton, { backgroundColor: colors.warning }]}
                      onPress={() => handlePayNow('previousYear', { yearIndex: index, yearData: year })}
                      activeOpacity={0.9}
                    >
                      <Feather name="credit-card" size={16} color="#FFFFFF" />
                      <ThemedText style={styles.payPreviousYearButtonText}>
                        Pay ₹{year.totalDue?.toLocaleString()} for {year.academicYear}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </View>
    )
  }

  const renderTabSelector = () => {
    const tabOptions = getTabOptions()
    
    return (
      <View style={styles.tabSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabOptions.map((option) => {
            const isSelected = selectedTab === option.value
            const statusColor = option.status ? getStatusColor(option.status) : colors.primary
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.tabOption,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setSelectedTab(option.value)}
                activeOpacity={0.9}
              >
                {option.icon === 'grid-view' && (
                  <MaterialIcons 
                    name="grid-view" 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 5 }} 
                  />
                )}
                {option.icon === 'history' && (
                  <MaterialIcons 
                    name="history" 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 5 }} 
                  />
                )}
                <ThemedText style={[
                  styles.tabOptionLabel,
                  { color: isSelected ? '#FFFFFF' : colors.text }
                ]}>
                  {option.label}
                </ThemedText>
                
                {option.count && (
                  <View style={[
                    styles.tabCountBadge,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }
                  ]}>
                    <ThemedText style={[
                      styles.tabCountText,
                      { color: isSelected ? '#FFFFFF' : colors.primary }
                    ]}>
                      {option.count}
                    </ThemedText>
                  </View>
                )}
                
                {option.status && option.value.startsWith('term') && (
                  <View style={[
                    styles.tabStatusBadge,
                    { 
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : statusColor + '20',
                      borderColor: isSelected ? 'rgba(255,255,255,0.3)' : statusColor + '40'
                    }
                  ]}>
                    <ThemedText style={[
                      styles.tabStatusText,
                      { color: isSelected ? '#FFFFFF' : statusColor }
                    ]}>
                      {option.status === 'Unpaid' ? 'U' : 
                       option.status === 'Partial' ? 'P' : 
                       option.status === 'Paid' ? '✓' : ''}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderComponentTermBreakdown = (componentKey, componentName, termData, termNumber) => {
    const status = termData.status
    const statusColor = getStatusColor(status)
    
    const componentDue = termData.components?.[componentKey]?.due || 0
    const componentPaid = termData.components?.[componentKey]?.paid || 0
    const componentRemaining = termData.components?.[componentKey]?.remaining || 0
    const componentDiscount = termData.components?.[componentKey]?.discount || 0
    
    if (componentDue === 0 && componentPaid === 0) return null
    
    return (
      <View key={componentKey} style={styles.termComponentCard}>
        <View style={styles.termComponentHeader}>
          <View style={styles.termComponentInfo}>
            <View style={styles.termComponentTitleRow}>
              <ThemedText style={styles.termComponentName}>{componentName}</ThemedText>
              {componentDiscount > 0 && (
                <View style={[styles.discountBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Feather name="tag" size={10} color={colors.warning} />
                  <ThemedText style={[styles.discountText, { color: colors.warning }]}>
                    {componentDiscount}% off
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.termComponentSummary}>
          <View style={styles.termComponentAmounts}>
            <View style={styles.termComponentAmount}>
              <ThemedText style={styles.termComponentAmountLabel}>Due</ThemedText>
              <ThemedText style={[styles.termComponentAmountValue, { color: colors.danger }]}>
                ₹{componentDue.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.termDividerVertical} />
            <View style={styles.termComponentAmount}>
              <ThemedText style={styles.termComponentAmountLabel}>Paid</ThemedText>
              <ThemedText style={[styles.termComponentAmountValue, { color: colors.success }]}>
                ₹{componentPaid.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.termDividerVertical} />
            <View style={styles.termComponentAmount}>
              <ThemedText style={styles.termComponentAmountLabel}>Remaining</ThemedText>
              <ThemedText style={[styles.termComponentAmountValue, { color: colors.danger }]}>
                ₹{componentRemaining.toLocaleString()}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.termComponentProgress}>
            <View style={[styles.termComponentProgressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.termComponentProgressFill, 
                  { 
                    width: componentDue > 0 ? `${(componentPaid / componentDue * 100)}%` : '0%',
                    backgroundColor: statusColor 
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.termComponentProgressText}>
              {componentDue > 0 ? `${((componentPaid / componentDue * 100)).toFixed(1)}%` : '0%'} Paid
            </ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const renderOverviewTab = () => {
    if (!feeDetails) return null
    
    const { summary, feeBreakdown, termWiseBreakdown, previousYearDetails } = feeDetails
    const components = feeBreakdown || {}
    
    return (
      <View style={styles.overviewContainer}>
        {/* Fee Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Fee Summary</ThemedText>
            <View style={styles.totalTermsBadge}>
              <ThemedText style={styles.totalTermsText}>{summary?.terms || 3} Terms</ThemedText>
            </View>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <FontAwesome5 name="rupee-sign" size={16} color={colors.primary} />
              </View>
              <View style={styles.summaryItemContent}>
                <ThemedText style={styles.summaryLabel}>Current Year Total</ThemedText>
                <ThemedText style={styles.summaryValue}>₹{summary?.discountedTotalFee?.toLocaleString() || 0}</ThemedText>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '20' }]}>
                <Feather name="check-circle" size={16} color={colors.success} />
              </View>
              <View style={styles.summaryItemContent}>
                <ThemedText style={styles.summaryLabel}>Total Paid</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                  ₹{summary?.totalPaid?.toLocaleString() || 0}
                </ThemedText>
              </View>
            </View>
          </View>

                    {/* Previous Year Fee */}
          {summary?.previousYearFee > 0 && (
            <View style={styles.dueSection}>
              <View style={styles.dueSectionRow}>
                <View style={[styles.summaryIconContainer, { backgroundColor: colors.warning + '20', width: 32, height: 32 }]}>
                  <MaterialIcons name="history" size={16} color={colors.warning} />
                </View>
                <View style={styles.dueSectionContent}>
                  <ThemedText style={styles.dueSectionLabel}>Previous Years Pending</ThemedText>
                  <ThemedText style={[styles.dueSectionValue, { color: colors.warning }]}>
                    ₹{summary?.previousYearFee?.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
              
              {/* Pay Previous Years Button */}
              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: colors.warning }]}
                onPress={() => handlePayNow('allPreviousYears')}
                activeOpacity={0.9}
              >
                <Feather name="credit-card" size={16} color="#FFFFFF" />
                <ThemedText style={styles.payButtonText}>
                  Pay Previous Years ₹{summary?.previousYearFee?.toLocaleString()}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Current Year Due */}
          {summary?.currentYearDue > 0 && (
            <View style={styles.dueSection}>
              <View style={styles.dueSectionRow}>
                <View style={[styles.summaryIconContainer, { backgroundColor: colors.primary + '20', width: 32, height: 32 }]}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                </View>
                <View style={styles.dueSectionContent}>
                  <ThemedText style={styles.dueSectionLabel}>Current Year Due</ThemedText>
                  <ThemedText style={[styles.dueSectionValue, { color: colors.primary }]}>
                    ₹{summary?.currentYearDue?.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
              
              {/* Pay Current Year Button */}
              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: colors.primary }]}
                onPress={() => handlePayNow('currentYear')}
                activeOpacity={0.9}
              >
                <Feather name="calendar" size={16} color="#FFFFFF" />
                <ThemedText style={styles.payButtonText}>
                  Pay Current Year ₹{summary?.currentYearDue?.toLocaleString()}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Total Due */}
          {summary?.totalDue > 0 && (
            <View style={styles.totalDueSection}>
              <View style={styles.totalDueRow}>
                <View style={[styles.summaryIconContainer, { backgroundColor: colors.danger + '20', width: 36, height: 36 }]}>
                  <Feather name="alert-circle" size={18} color={colors.danger} />
                </View>
                <View style={styles.totalDueContent}>
                  <ThemedText style={styles.totalDueLabel}>Total Outstanding</ThemedText>
                  <ThemedText style={[styles.totalDueValue, { color: summary?.totalDue > 0 ? colors.danger : colors.success }]}>
                    ₹{summary?.totalDue?.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
              
              {/* Pay Total Button */}
              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: colors.danger, marginTop: 8 }]}
                onPress={() => handlePayNow('total')}
                activeOpacity={0.9}
              >
                <Feather name="credit-card" size={16} color="#FFFFFF" />
                <ThemedText style={styles.payButtonText}>
                  Pay Total ₹{summary?.totalDue?.toLocaleString()}
                </ThemedText>
              </TouchableOpacity>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <ThemedText style={styles.progressLabel}>Overall Payment Progress</ThemedText>
                  <ThemedText style={styles.progressPercentage}>
                    {summary?.overallPercentagePaid || 0}%
                  </ThemedText>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${summary?.overallPercentagePaid || 0}%`,
                        backgroundColor: summary?.overallPercentagePaid == 100 ? colors.success : colors.primary 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Terms Status Overview */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="list-alt" size={20} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Current Year Terms</ThemedText>
          </View>
          
          <View style={styles.termsStatusContainer}>
            {termWiseBreakdown && Object.keys(termWiseBreakdown).map((termKey) => {
              const term = termWiseBreakdown[termKey]
              const termNumber = termKey.replace('term', '')
              const statusColor = getStatusColor(term.status)
              
              return (
                <TouchableOpacity
                  key={termKey}
                  style={styles.termStatusItem}
                  onPress={() => setSelectedTab(`term${termNumber}`)}
                  activeOpacity={0.9}
                >
                  <View style={styles.termStatusHeader}>
                    <View style={styles.termStatusInfo}>
                      <ThemedText style={styles.termStatusTitle}>Term {termNumber}</ThemedText>
                      <ThemedText style={styles.termStatusDate}>
                        Due Date: {term.dueDate ? new Date(term.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                      </ThemedText>
                    </View>
                    <View style={[styles.termStatusBadgeLarge, { backgroundColor: statusColor + '20' }]}>
                      <ThemedText style={[styles.termStatusTextLarge, { color: statusColor }]}>
                        {term.status}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.termStatusAmounts}>
                    <View style={styles.termStatusAmount}>
                      <ThemedText style={styles.termAmountLabel}>Due</ThemedText>
                      <ThemedText style={styles.termAmountValue}>₹{term.dueAmount?.toLocaleString() || 0}</ThemedText>
                    </View>
                    <View style={styles.termStatusAmount}>
                      <ThemedText style={styles.termAmountLabel}>Paid</ThemedText>
                      <ThemedText style={[styles.termAmountValue, { color: colors.success }]}>
                        ₹{term.paidAmount?.toLocaleString() || 0}
                      </ThemedText>
                    </View>
                    <View style={styles.termStatusAmount}>
                      <ThemedText style={styles.termAmountLabel}>Remaining</ThemedText>
                      <ThemedText style={[styles.termAmountValue, { color: colors.danger }]}>
                        ₹{term.remainingAmount?.toLocaleString() || 0}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={[styles.termProgressContainer, { marginTop: 8 }]}>
                    <View style={[styles.termProgressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.termProgressFill, 
                          { 
                            width: term.dueAmount > 0 ? `${(term.paidAmount / term.dueAmount * 100)}%` : '0%',
                            backgroundColor: statusColor 
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.termProgressText}>
                      {term.dueAmount > 0 ? `${((term.paidAmount / term.dueAmount * 100)).toFixed(1)}%` : '0%'} Paid
                    </ThemedText>
                  </View>
                  
                  {term.remainingAmount > 0 && (
                    <TouchableOpacity 
                      style={[styles.termPayButton, { backgroundColor: statusColor }]}
                      onPress={() => handlePayNow('term', { termNumber: parseInt(termNumber) })}
                      activeOpacity={0.9}
                    >
                      <Feather name="credit-card" size={14} color="#FFFFFF" />
                      <ThemedText style={styles.termPayButtonText}>
                        Pay Term {termNumber} ₹{term.remainingAmount?.toLocaleString()}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Previous Years Summary Card */}
        {previousYearDetails?.length > 0 && (
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.warning + '40', marginTop: 12 }]}
            onPress={() => setSelectedTab('previous')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="history" size={20} color={colors.warning} />
              <ThemedText style={styles.cardTitle}>Previous Years</ThemedText>
              <View style={[styles.totalTermsBadge, { backgroundColor: colors.warning + '20' }]}>
                <ThemedText style={[styles.totalTermsText, { color: colors.warning }]}>
                  {previousYearDetails.length} Year{previousYearDetails.length > 1 ? 's' : ''}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.previousYearsSummaryList}>
              {previousYearDetails.slice(0, 2).map((year, index) => (
                <View key={index} style={styles.previousYearsSummaryItem}>
                  <ThemedText style={styles.previousYearsSummaryYear}>{year.academicYear}</ThemedText>
                  <ThemedText style={[styles.previousYearsSummaryAmount, { color: year.isFullyPaid ? colors.success : colors.warning }]}>
                    {year.isFullyPaid ? 'Paid' : `₹${year.totalDue?.toLocaleString()}`}
                  </ThemedText>
                </View>
              ))}
              {previousYearDetails.length > 2 && (
                <ThemedText style={styles.previousYearsSummaryMore}>
                  +{previousYearDetails.length - 2} more years
                </ThemedText>
              )}
            </View>
            
            <View style={styles.viewAllButton}>
              <ThemedText style={[styles.viewAllButtonText, { color: colors.warning }]}>
                View All Previous Years
              </ThemedText>
              <MaterialIcons name="arrow-forward" size={16} color={colors.warning} />
            </View>
          </TouchableOpacity>
        )}

        {/* Fee Components Breakdown */}
        {components && Object.keys(components).length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.cardTitle}>Current Year Fee Components</ThemedText>
            </View>
            
            {Object.entries(components).map(([key, component]) => {
              if (!component || component.discounted === 0) return null
              
              const componentName = key === 'schoolFee' ? 'School Fee' :
                                   key === 'transportFee' ? 'Transport Fee' :
                                   key === 'hostelFee' ? 'Hostel Fee' : key
              const status = component.due === 0 ? 'Paid' : component.paid > 0 ? 'Partial' : 'Unpaid'
              const statusColor = getStatusColor(status)
              
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.componentCard,
                    { backgroundColor: colors.inputBackground }
                  ]}
                  activeOpacity={0.9}
                  onPress={() => toggleComponentExpansion(key)}
                >
                  <View style={styles.componentHeader}>
                    <View style={styles.componentTitleRow}>
                      <ThemedText style={styles.componentName}>
                        {componentName}
                      </ThemedText>
                      <View style={styles.componentStatusArrowContainer}>
                        <View style={[styles.componentStatusBadge, { backgroundColor: statusColor + '20' }]}>
                          <ThemedText style={[styles.componentStatusText, { color: statusColor }]}>
                            {status}
                          </ThemedText>
                        </View>
                        <MaterialIcons 
                          name={expandedComponents[key] ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                          size={24} 
                          color={colors.textSecondary} 
                        />
                      </View>
                    </View>
                    
                    {component.discount > 0 && (
                      <View style={[styles.discountBadge, { backgroundColor: colors.warning + '20' }]}>
                        <Feather name="tag" size={12} color={colors.warning} />
                        <ThemedText style={[styles.discountText, { color: colors.warning }]}>
                          {component.discount}% off (₹{component.discountAmount?.toLocaleString()})
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.componentSummary}>
                    <View style={styles.componentAmountRow}>
                      <View style={styles.componentAmountItem}>
                        <ThemedText style={styles.componentAmountLabel}>Original</ThemedText>
                        <ThemedText style={styles.componentAmountValue}>
                          ₹{component.original?.toLocaleString()}
                        </ThemedText>
                      </View>
                      <View style={styles.componentAmountItem}>
                        <ThemedText style={styles.componentAmountLabel}>Discounted</ThemedText>
                        <ThemedText style={[styles.componentAmountValue, { color: colors.success }]}>
                          ₹{component.discounted?.toLocaleString()}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.componentProgress}>
                      <View style={styles.componentProgressInfo}>
                        <ThemedText style={styles.componentProgressLabel}>Payment Progress</ThemedText>
                        <ThemedText style={styles.componentProgressPercentage}>
                          {component.percentagePaid || 0}%
                        </ThemedText>
                      </View>
                      <View style={[styles.componentProgressBar, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.componentProgressFill, 
                            { 
                              width: `${component.percentagePaid || 0}%`,
                              backgroundColor: component.percentagePaid == 100 ? colors.success : colors.primary 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.componentPaymentBreakdown}>
                      <View style={styles.componentPaymentItem}>
                        <Feather name="check" size={14} color={colors.success} />
                        <ThemedText style={styles.componentPaymentText}>
                          Paid: ₹{component.paid?.toLocaleString() || 0}
                        </ThemedText>
                      </View>
                      <View style={styles.componentPaymentItem}>
                        <Feather name="clock" size={14} color={colors.danger} />
                        <ThemedText style={styles.componentPaymentText}>
                          Due: ₹{component.due?.toLocaleString() || 0}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  
                  {expandedComponents[key] && (
                    <View style={styles.componentExpanded}>
                      <ThemedText style={styles.expandedTitle}>Term-wise Breakdown</ThemedText>
                      {feeDetails.termDistribution && Object.keys(feeDetails.termDistribution).map(termNum => {
                        const termData = feeDetails.termDistribution[termNum]
                        const termComponentDue = termData?.[key] || 0
                        const termComponentPaid = termData?.[`${key}Paid`] || 0
                        
                        if (termComponentDue === 0) return null
                        
                        const termStatus = termComponentPaid >= termComponentDue ? 'Paid' : 
                                          termComponentPaid > 0 ? 'Partial' : 'Unpaid'
                        const termStatusColor = getStatusColor(termStatus)
                        
                        return (
                          <View key={termNum} style={styles.termBreakdownItem}>
                            <View style={styles.termBreakdownHeader}>
                              <ThemedText style={styles.termBreakdownTitle}>Term {termNum}</ThemedText>
                              <View style={[styles.termBreakdownStatus, { backgroundColor: termStatusColor + '20' }]}>
                                <ThemedText style={[styles.termBreakdownStatusText, { color: termStatusColor }]}>
                                  {termStatus}
                                </ThemedText>
                              </View>
                            </View>
                            
                            <View style={styles.termBreakdownAmounts}>
                              <View style={styles.termBreakdownAmount}>
                                <ThemedText style={styles.termBreakdownAmountLabel}>Due</ThemedText>
                                <ThemedText style={styles.termBreakdownAmountValue}>
                                  ₹{termComponentDue.toLocaleString()}
                                </ThemedText>
                              </View>
                              <View style={styles.termBreakdownAmount}>
                                <ThemedText style={styles.termBreakdownAmountLabel}>Paid</ThemedText>
                                <ThemedText style={[styles.termBreakdownAmountValue, { color: colors.success }]}>
                                  ₹{termComponentPaid.toLocaleString()}
                                </ThemedText>
                              </View>
                              <View style={styles.termBreakdownAmount}>
                                <ThemedText style={styles.termBreakdownAmountLabel}>Remaining</ThemedText>
                                <ThemedText style={[styles.termBreakdownAmountValue, { color: colors.danger }]}>
                                  ₹{(termComponentDue - termComponentPaid).toLocaleString()}
                                </ThemedText>
                              </View>
                            </View>
                            
                            <View style={styles.termBreakdownProgress}>
                              <View style={[styles.termBreakdownProgressBar, { backgroundColor: colors.border }]}>
                                <View 
                                  style={[
                                    styles.termBreakdownProgressFill, 
                                    { 
                                      width: termComponentDue > 0 ? `${(termComponentPaid / termComponentDue * 100)}%` : '0%',
                                      backgroundColor: termStatusColor 
                                    }
                                  ]} 
                                />
                              </View>
                              <ThemedText style={styles.termBreakdownProgressText}>
                                {termComponentDue > 0 ? `${((termComponentPaid / termComponentDue * 100)).toFixed(1)}%` : '0%'} Paid
                              </ThemedText>
                            </View>
                            
                            {termComponentDue - termComponentPaid > 0 && (
                              <TouchableOpacity 
                                style={[styles.termBreakdownPayButton, { backgroundColor: colors.primary }]}
                                onPress={() => handlePayNow('component', { 
                                  term: parseInt(termNum),
                                  defaultAmounts: {
                                    schoolFee: key === 'schoolFee' ? termComponentDue - termComponentPaid : 0,
                                    transportFee: key === 'transportFee' ? termComponentDue - termComponentPaid : 0,
                                    hostelFee: key === 'hostelFee' ? termComponentDue - termComponentPaid : 0
                                  },
                                  description: `Term ${termNum} - ${componentName}`
                                })}
                              >
                                <Feather name="credit-card" size={12} color="#FFFFFF" />
                                <ThemedText style={styles.termBreakdownPayText}>
                                  Pay Term {termNum} {componentName}
                                </ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>
    )
  }

  const renderTermTab = (termNumber) => {
    if (!feeDetails?.termWiseBreakdown) return null
    
    const termKey = `term${termNumber}`
    const termData = feeDetails.termWiseBreakdown[termKey]
    const termDistribution = feeDetails.termDistribution?.[termNumber] || {}
    
    if (!termData) return null
    
    const statusColor = getStatusColor(termData.status)
    
    return (
      <View style={styles.termDetailsContainer}>
        {/* Term Header */}
        <View style={[styles.termHeaderCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: statusColor + '40',
          borderLeftWidth: 4,
          borderLeftColor: statusColor
        }]}>
          <View style={styles.termHeaderContent}>
            <View style={styles.termHeaderRow}>
              <View style={styles.termTitleContainer}>
                <ThemedText style={styles.termTitle}>Term {termNumber}</ThemedText>
                <ThemedText style={styles.termDueDate}>
                  Due Date: {termData.dueDate ? new Date(termData.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                </ThemedText>
              </View>
              <View style={[styles.termStatusIndicator, { backgroundColor: statusColor }]}>
                <ThemedText style={styles.termStatusIndicatorText}>{termData.status}</ThemedText>
              </View>
            </View>
            
            <View style={styles.termAmountOverview}>
              <View style={styles.termAmountItem}>
                <ThemedText style={styles.termAmountLabel}>Due Amount</ThemedText>
                <ThemedText style={styles.termAmountValue}>₹{termData.dueAmount?.toLocaleString() || 0}</ThemedText>
              </View>
              <View style={styles.termDivider} />
              <View style={styles.termAmountItem}>
                <ThemedText style={styles.termAmountLabel}>Paid Amount</ThemedText>
                <ThemedText style={[styles.termAmountValue, { color: colors.success }]}>
                  ₹{termData.paidAmount?.toLocaleString() || 0}
                </ThemedText>
              </View>
              <View style={styles.termDivider} />
              <View style={styles.termAmountItem}>
                <ThemedText style={styles.termAmountLabel}>Remaining</ThemedText>
                <ThemedText style={[styles.termAmountValue, { color: colors.danger }]}>
                  ₹{termData.remainingAmount?.toLocaleString() || 0}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.termProgressContainer}>
              <View style={[styles.termProgressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.termProgressFill, 
                    { 
                      width: termData.dueAmount > 0 ? `${(termData.paidAmount / termData.dueAmount * 100)}%` : '0%',
                      backgroundColor: statusColor 
                    }
                  ]} 
                />
              </View>
              <ThemedText style={styles.termProgressText}>
                {termData.dueAmount > 0 ? `${((termData.paidAmount / termData.dueAmount * 100)).toFixed(1)}%` : '0%'} Paid
              </ThemedText>
            </View>
            
            {termData.remainingAmount > 0 && (
              <TouchableOpacity 
                style={[styles.payNowButton, { backgroundColor: colors.primary, marginTop: 0 }]}
                onPress={() => handlePayNow('term', { termNumber: parseInt(termNumber) })}
                activeOpacity={0.9}
              >
                <Feather name="credit-card" size={18} color="#FFFFFF" />
                <ThemedText style={styles.payNowText}>Pay Term {termNumber} ₹{termData.remainingAmount?.toLocaleString()}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Component-wise breakdown for this term */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <Feather name="pie-chart" size={18} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Term {termNumber} - Fee Components</ThemedText>
          </View>
          
          {/* School Fee Component */}
          {termDistribution.schoolFee > 0 && (
            renderComponentTermBreakdown('schoolFee', 'School Fee', {
              status: termData.status,
              components: termData.components || {}
            }, termNumber)
          )}
          
          {/* Transport Fee Component */}
          {termDistribution.transportFee > 0 && (
            renderComponentTermBreakdown('transportFee', 'Transport Fee', {
              status: termData.status,
              components: termData.components || {}
            }, termNumber)
          )}
          
          {/* Hostel Fee Component */}
          {termDistribution.hostelFee > 0 && (
            renderComponentTermBreakdown('hostelFee', 'Hostel Fee', {
              status: termData.status,
              components: termData.components || {}
            }, termNumber)
          )}
        </View>

        {/* Quick Pay Options */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <Feather name="zap" size={18} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Quick Pay Options</ThemedText>
          </View>
          
          {termDistribution.schoolFee - (termDistribution.schoolFeePaid || 0) > 0 && (
            <TouchableOpacity 
              style={[styles.quickPayOption, { backgroundColor: colors.inputBackground }]}
              onPress={() => handlePayNow('component', { 
                term: parseInt(termNumber),
                defaultAmounts: {
                  schoolFee: termDistribution.schoolFee - (termDistribution.schoolFeePaid || 0),
                  transportFee: 0,
                  hostelFee: 0
                },
                description: `Term ${termNumber} - School Fee`
              })}
            >
              <View style={styles.quickPayInfo}>
                <ThemedText style={styles.quickPayLabel}>Pay School Fee</ThemedText>
                <ThemedText style={styles.quickPayAmount}>
                  ₹{(termDistribution.schoolFee - (termDistribution.schoolFeePaid || 0)).toLocaleString()}
                </ThemedText>
              </View>
              <Feather name="arrow-right-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          {termDistribution.transportFee - (termDistribution.transportFeePaid || 0) > 0 && (
            <TouchableOpacity 
              style={[styles.quickPayOption, { backgroundColor: colors.inputBackground }]}
              onPress={() => handlePayNow('component', { 
                term: parseInt(termNumber),
                defaultAmounts: {
                  schoolFee: 0,
                  transportFee: termDistribution.transportFee - (termDistribution.transportFeePaid || 0),
                  hostelFee: 0
                },
                description: `Term ${termNumber} - Transport Fee`
              })}
            >
              <View style={styles.quickPayInfo}>
                <ThemedText style={styles.quickPayLabel}>Pay Transport Fee</ThemedText>
                <ThemedText style={styles.quickPayAmount}>
                  ₹{(termDistribution.transportFee - (termDistribution.transportFeePaid || 0)).toLocaleString()}
                </ThemedText>
              </View>
              <Feather name="arrow-right-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          {termDistribution.hostelFee - (termDistribution.hostelFeePaid || 0) > 0 && (
            <TouchableOpacity 
              style={[styles.quickPayOption, { backgroundColor: colors.inputBackground }]}
              onPress={() => handlePayNow('component', { 
                term: parseInt(termNumber),
                defaultAmounts: {
                  schoolFee: 0,
                  transportFee: 0,
                  hostelFee: termDistribution.hostelFee - (termDistribution.hostelFeePaid || 0)
                },
                description: `Term ${termNumber} - Hostel Fee`
              })}
            >
              <View style={styles.quickPayInfo}>
                <ThemedText style={styles.quickPayLabel}>Pay Hostel Fee</ThemedText>
                <ThemedText style={styles.quickPayAmount}>
                  ₹{(termDistribution.hostelFee - (termDistribution.hostelFeePaid || 0)).toLocaleString()}
                </ThemedText>
              </View>
              <Feather name="arrow-right-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  const renderPreviousYearsTab = () => {
    if (!feeDetails?.previousYearDetails || feeDetails.previousYearDetails.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={48} color={colors.textSecondary} />
          <ThemedText style={styles.emptyText}>No previous year records found</ThemedText>
        </View>
      )
    }

    return (
      <View style={styles.previousYearsTabContainer}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.warning }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="history" size={20} color={colors.warning} />
            <ThemedText style={styles.cardTitle}>Previous Years Summary</ThemedText>
            <View style={[styles.totalTermsBadge, { backgroundColor: colors.warning + '20' }]}>
              <ThemedText style={[styles.totalTermsText, { color: colors.warning }]}>
                Total Due: ₹{feeDetails.summary?.previousYearFee?.toLocaleString() || 0}
              </ThemedText>
            </View>
          </View>
          
          {/* Pay All Previous Years Button */}
          {feeDetails.summary?.previousYearFee > 0 && (
            <TouchableOpacity 
              style={[styles.payAllPreviousButton, { backgroundColor: colors.warning }]}
              onPress={() => handlePayNow('allPreviousYears')}
              activeOpacity={0.9}
            >
              <Feather name="credit-card" size={18} color="#FFFFFF" />
              <ThemedText style={styles.payAllPreviousButtonText}>
                Pay All Previous Years ₹{feeDetails.summary?.previousYearFee?.toLocaleString()}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {renderPreviousYearDetails()}
      </View>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading fee details...</ThemedText>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.danger} />
          <ThemedText style={styles.errorTitle}>Failed to Load Details</ThemedText>
          <ThemedText style={styles.errorSubtitle}>{error}</ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchStudentFeeDetails(student.id || student._id)}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )
    }

    if (!feeDetails) {
      return (
        <View style={styles.loadingContainer}>
          <Ionicons name="receipt" size={48} color={colors.textSecondary} />
          <ThemedText style={styles.loadingText}>No fee details available</ThemedText>
        </View>
      )
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.studentInfoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.studentHeader}>
            <View style={[styles.studentAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.studentInfo}>
              <ThemedText style={styles.studentName}>
                {feeDetails.studentInfo?.name || student.name}
              </ThemedText>
              <ThemedText style={styles.studentClass}>
                {feeDetails.studentInfo?.displayClass || student.displayClass || student.class} - {feeDetails.studentInfo?.section || student.section}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.studentDetailsGrid}>
            <View style={styles.detailItem}>
              <FontAwesome6 name="person" size={16} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                {feeDetails.studentInfo?.parentName}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome name="phone" size={16} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                {feeDetails.studentInfo?.parentPhone}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Tab Selector */}
        {renderTabSelector()}
        
        {/* Selected Tab Content */}
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'previous' && renderPreviousYearsTab()}
        {selectedTab.startsWith('term') && renderTermTab(parseInt(selectedTab.replace('term', '')))}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    )
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    historyButton: {
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
    
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },
    
    // Student Info
    studentInfoCard: {
      marginHorizontal: 0,
      marginTop: 16,
      marginBottom: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    studentAvatar: {
      width: 50,
      height: 50,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    studentClass: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    studentDetailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    detailItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    detailText: {
      fontSize: 11,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      marginLeft: 6,
    },
    
    // Tab Selector
    tabSelectorContainer: {
      marginHorizontal: 0,
      marginBottom: 16,
    },
    tabScrollContent: {
      paddingVertical: 8,
      paddingRight: 16,
    },
    tabOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 25,
      borderWidth: 1,
      marginRight: 8,
      minHeight: 44,
    },
    tabOptionLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      marginRight: 8,
    },
    tabCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 4,
    },
    tabCountText: {
      fontSize: 11,
      fontFamily: 'Poppins-Bold',
    },
    tabStatusBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabStatusText: {
      fontSize: 11,
      fontFamily: 'Poppins-Bold',
    },
    
    // Overview
    overviewContainer: {
      paddingHorizontal: 0,
    },
    card: {
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginLeft: 10,
      flex: 1,
    },
    totalTermsBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    totalTermsText: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginBottom: 16,
    },
    summaryItem: {
      width: '47%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      padding: 8,
      borderRadius: 10,
      marginBottom: 8,
      marginHorizontal: 4,
    },
    summaryIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    summaryItemContent: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
    },
    
    // Due Section Styles
    dueSection: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
      paddingBottom: 16,
    },
    dueSectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    dueSectionContent: {
      flex: 1,
    },
    dueSectionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    dueSectionValue: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
    },
    
    // Total Due Section
    totalDueSection: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 2,
      borderTopColor: colors.primary + '30',
    },
    totalDueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    totalDueContent: {
      flex: 1,
    },
    totalDueLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    totalDueValue: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
    },
    
    // Pay Button
    payButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
      width: '100%',
    },
    payButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
      fontSize: 14,
    },
    
    progressContainer: {
      marginTop: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    progressPercentage: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    
    // Pay Now Button
    payNowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 16,
      gap: 8,
    },
    payNowText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
      fontSize: 15,
    },
    
    // Previous Years Section
    previousYearsContainer: {
      gap: 12,
    },
    previousYearItem: {
      borderRadius: 10,
      marginBottom: 8,
      overflow: 'hidden',
    },
    previousYearHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
    },
    previousYearHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    previousYearHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    previousYearTitle: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    previousYearClass: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    previousYearStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    previousYearStatusText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    previousYearExpanded: {
      padding: 12,
      paddingTop: 0,
      gap: 12,
    },
    previousYearAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    previousYearAmount: {
      alignItems: 'center',
      flex: 1,
    },
    previousYearAmountLabel: {
      fontSize: 9,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    previousYearAmountValue: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    previousYearTermPayments: {
      marginTop: 8,
    },
    previousYearSubtitle: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 6,
    },
    
    // Term Cards in Previous Year
    previousYearTermCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border + '50',
    },
    previousYearTermHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    previousYearTermTitle: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    termStatusText: {
      fontSize: 10,
      fontFamily: 'Poppins-SemiBold',
    },
    componentBreakdown: {
      gap: 6,
      marginBottom: 8,
    },
    componentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    componentLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 2,
    },
    componentLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    componentAmounts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 3,
      justifyContent: 'flex-end',
    },
    componentAmount: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    componentSeparator: {
      fontSize: 10,
      color: colors.textSecondary,
      marginHorizontal: 2,
    },
    termTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    termTotalLabel: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termTotalAmounts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    termTotalDue: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termTotalPaid: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    termTotalRemaining: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    termTotalSeparator: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    
    // Term Progress
    termProgressContainer: {
      marginTop: 8,
    },
    termProgressBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 2,
    },
    termProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    termProgressText: {
      fontSize: 9,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'right',
    },
    
    previousYearTerms: {
      gap: 4,
    },
    previousYearTerm: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    previousYearTermLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    previousYearTermValue: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    previousYearDiscounts: {
      marginTop: 8,
    },
    previousYearDiscountsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    discountChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 2,
    },
    discountChipText: {
      fontSize: 9,
      fontFamily: 'Poppins-Medium',
    },
    payPreviousYearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    payPreviousYearButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
      fontSize: 12,
    },
    
    // Previous Years Summary Card
    previousYearsSummaryList: {
      marginBottom: 8,
    },
    previousYearsSummaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    previousYearsSummaryYear: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    previousYearsSummaryAmount: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    previousYearsSummaryMore: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginTop: 4,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 8,
      gap: 4,
    },
    viewAllButtonText: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // Previous Years Tab
    previousYearsTabContainer: {
      gap: 12,
    },
    payAllPreviousButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    payAllPreviousButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
      fontSize: 14,
    },
    
    // Terms Status
    termsStatusContainer: {
      gap: 12,
    },
    termStatusItem: {
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      padding: 12,
    },
    termStatusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    termStatusInfo: {
      flex: 1,
    },
    termStatusTitle: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    termStatusDate: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    termStatusBadgeLarge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginLeft: 12,
    },
    termStatusTextLarge: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    termStatusAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    termStatusAmount: {
      alignItems: 'center',
      flex: 1,
    },
    termAmountLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    termAmountValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termProgressContainer: {
      marginTop: 8,
    },
    termProgressBar: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    termProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    termProgressText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'right',
    },
    termPayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 14,
      gap: 6,
    },
    termPayButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-SemiBold',
      fontSize: 13,
    },
    
    // Component Card
    componentCard: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    componentHeader: {
      marginBottom: 12,
    },
    componentTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    componentName: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    componentStatusArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    componentStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    componentStatusText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    discountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
      alignSelf: 'flex-start',
    },
    discountText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    componentSummary: {
      gap: 12,
    },
    componentAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    componentAmountItem: {
      flex: 1,
    },
    componentAmountLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    componentAmountValue: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    componentProgress: {
      gap: 8,
    },
    componentProgressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    componentProgressLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    componentProgressPercentage: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    componentProgressBar: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    componentProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    componentPaymentBreakdown: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    componentPaymentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    componentPaymentText: {
      fontSize: 12,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    componentExpanded: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
      gap: 12,
    },
    expandedTitle: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    
    // Term Breakdown
    termBreakdownItem: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    termBreakdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    termBreakdownTitle: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termBreakdownStatus: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    termBreakdownStatusText: {
      fontSize: 10,
      fontFamily: 'Poppins-SemiBold',
    },
    termBreakdownAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    termBreakdownAmount: {
      alignItems: 'center',
      flex: 1,
    },
    termBreakdownAmountLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    termBreakdownAmountValue: {
      fontSize: 12,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termBreakdownProgress: {
      marginBottom: 8,
    },
    termBreakdownProgressBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 2,
    },
    termBreakdownProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    termBreakdownProgressText: {
      fontSize: 9,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'right',
    },
    termBreakdownPayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      borderRadius: 6,
      gap: 4,
    },
    termBreakdownPayText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // Term Details
    termDetailsContainer: {
      paddingHorizontal: 0,
    },
    termHeaderCard: {
      borderRadius: 4,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,        
      padding: 16,
      borderWidth: 1,
      marginBottom: 12,
    },
    termHeaderContent: {
      gap: 16,
    },
    termHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    termTitleContainer: {
      flex: 1,
    },
    termTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      marginBottom: 8,
    },
    termDueDate: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    termStatusIndicator: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    termStatusIndicatorText: {
      fontSize: 12,
      fontFamily: 'Poppins-Bold',
      color: '#FFFFFF',
    },
    termAmountOverview: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    termAmountItem: {
      alignItems: 'center',
      flex: 1,
    },
    termAmountLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    termAmountValue: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
    },
    termDividerVertical: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
    },
    
    // Term Component
    termComponentCard: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.inputBackground,
    },
    termComponentHeader: {
      marginBottom: 8,
    },
    termComponentInfo: {
      flex: 1,
    },
    termComponentTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    termComponentName: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termComponentSummary: {
      gap: 8,
    },
    termComponentAmounts: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    termComponentAmount: {
      alignItems: 'center',
      flex: 1,
    },
    termComponentAmountLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    termComponentAmountValue: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    termComponentProgress: {
      gap: 2,
    },
    termComponentProgressBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    termComponentProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    termComponentProgressText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'right',
    },
    
    // Quick Pay
    quickPayOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      marginBottom: 4,
    },
    quickPayInfo: {
      flex: 1,
    },
    quickPayLabel: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
      marginBottom: 4,
    },
    quickPayAmount: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
    },
    
    // Retry Button
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
    },
    
    // Loading & Error States
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.danger,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorSubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
    },
    
    bottomSpacer: {
      height: 20,
    },
  })

  if (!student) return null

  return (
    <>
      <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <View style={styles.container}>
          <LinearGradient 
            colors={[colors.gradientStart, colors.gradientEnd]} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 
                    name="chevron-left" 
                    size={20} 
                    color="#FFFFFF" 
                    style={{ marginLeft: -2 }}
                  />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.title}>Fee Details</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {student?.name || student?.firstName || 'Student'}
                  </ThemedText>
                </View>
                
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={styles.historyButton} 
                  onPress={fetchPaymentHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="history" size={22} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
          
          {renderContent()}
          
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
      
      <FeePaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentData}
        student={student}
        feeDetails={feeDetails}
        onPaymentSuccess={handlePaymentComplete}
      />

      <StudentPaymentHistory
        visible={showStudentPaymentHistory}
        onClose={() => setShowStudentPaymentHistory(false)}
        student={student}
        paymentHistory={paymentHistory}
      />
    </>
  )
}