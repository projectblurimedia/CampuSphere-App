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
import { FontAwesome5, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons'
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
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [expandedComponents, setExpandedComponents] = useState({})
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
      setSelectedTerm('all')
      setExpandedComponents({})
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

  const handlePayNow = (termNumber = null) => {
    if (!feeDetails) return
    
    const { summary, feeBreakdown, termWiseBreakdown, termDistribution } = feeDetails
    
    // Calculate due amounts for each component
    let schoolFeeDue = feeBreakdown?.schoolFee?.due || 0
    let transportFeeDue = feeBreakdown?.transportFee?.due || 0
    let hostelFeeDue = feeBreakdown?.hostelFee?.due || 0
    
    // If term is specified, get component-wise due amounts from termDistribution
    if (termNumber && termDistribution && termDistribution[termNumber]) {
      const termData = termDistribution[termNumber]
      schoolFeeDue = Math.max(0, (termData.schoolFee || 0) - (termData.schoolFeePaid || 0))
      transportFeeDue = Math.max(0, (termData.transportFee || 0) - (termData.transportFeePaid || 0))
      hostelFeeDue = Math.max(0, (termData.hostelFee || 0) - (termData.hostelFeePaid || 0))
    }
    
    const paymentDetails = {
      studentId: student.id || student._id,
      studentName: student.name,
      academicYear: '2024-2025',
      term: termNumber,
      description: termNumber ? `Term ${termNumber} Payment` : 'Full Academic Year Payment',
      defaultAmounts: {
        schoolFee: schoolFeeDue,
        transportFee: transportFeeDue,
        hostelFee: hostelFeeDue
      }
    }
    
    setPaymentData(paymentDetails)
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = (paymentResult) => {
    // Refresh fee details after payment
    fetchStudentFeeDetails(student.id || student._id)
    
    // Notify parent component
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

  const getTermOptions = () => {
    if (!feeDetails?.termWiseBreakdown) return []
    
    const options = [
      { label: 'Overview', value: 'all', icon: 'grid-view' }
    ]
    
    Object.keys(feeDetails.termWiseBreakdown).forEach(termKey => {
      const term = feeDetails.termWiseBreakdown[termKey]
      const termNumber = termKey.replace('term', '')
      options.push({
        label: `Term ${termNumber}`,
        value: termNumber,
        status: term.status
      })
    })
    
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

  const renderTermSelector = () => {
    const termOptions = getTermOptions()
    
    return (
      <View style={styles.termSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.termScrollContent}
        >
          {termOptions.map((option) => {
            const isSelected = selectedTerm === option.value
            const statusColor = getStatusColor(option.status)
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.termOption,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setSelectedTerm(option.value)}
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
                <ThemedText style={[
                  styles.termOptionLabel,
                  { color: isSelected ? '#FFFFFF' : colors.text }
                ]}>
                  {option.icon === 'grid-view' ? 'Overview' : option.label}
                </ThemedText>
                
                {option.status && option.value !== 'all' && (
                  <View style={[
                    styles.termStatusBadge,
                    { 
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : statusColor + '20',
                      borderColor: isSelected ? 'rgba(255,255,255,0.3)' : statusColor + '40'
                    }
                  ]}>
                    <ThemedText style={[
                      styles.termStatusText,
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
    
    // Get component-specific data for this term
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

  const renderAllTermsOverview = () => {
    if (!feeDetails) return null
    
    const { summary, feeBreakdown, termWiseBreakdown } = feeDetails
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
                <ThemedText style={styles.summaryLabel}>Total Fee</ThemedText>
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
            
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.danger + '20' }]}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
              </View>
              <View style={styles.summaryItemContent}>
                <ThemedText style={styles.summaryLabel}>Total Due</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.danger }]}>
                  ₹{summary?.totalDue?.toLocaleString() || 0}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Feather name="percent" size={16} color={colors.primary} />
              </View>
              <View style={styles.summaryItemContent}>
                <ThemedText style={styles.summaryLabel}>Paid %</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {summary?.overallPercentagePaid || 0}%
                </ThemedText>
              </View>
            </View>
          </View>
          
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
          
          {/* Pay Now Button */}
          {summary?.totalDue > 0 && (
            <TouchableOpacity 
              style={[styles.payNowButton, { backgroundColor: colors.primary }]}
              onPress={() => handlePayNow()}
              activeOpacity={0.9}
            >
              <Feather name="credit-card" size={18} color="#FFFFFF" />
              <ThemedText style={styles.payNowText}>Pay Total Due ₹{summary?.totalDue?.toLocaleString()}</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Terms Status Overview */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="list-alt" size={20} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Terms Status</ThemedText>
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
                  onPress={() => setSelectedTerm(termNumber)}
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
                      onPress={() => handlePayNow(parseInt(termNumber))}
                      activeOpacity={0.9}
                    >
                      <Feather name="credit-card" size={14} color="#FFFFFF" />
                      <ThemedText style={styles.termPayButtonText}>
                        Pay ₹{term.remainingAmount?.toLocaleString()}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Fee Components Breakdown */}
        {components && Object.keys(components).length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.cardTitle}>Fee Components</ThemedText>
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
                                onPress={() => handlePayNow(parseInt(termNum))}
                              >
                                <Feather name="credit-card" size={12} color="#FFFFFF" />
                                <ThemedText style={styles.termBreakdownPayText}>
                                  Pay Term {termNum}
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

  const renderSingleTermDetails = (termNumber) => {
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
                onPress={() => handlePayNow(parseInt(termNumber))}
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
              onPress={() => {
                const paymentDetails = {
                  studentId: student.id || student._id,
                  studentName: student.name,
                  academicYear: '2024-2025',
                  term: termNumber,
                  description: `Term ${termNumber} - School Fee`,
                  defaultAmounts: {
                    schoolFee: termDistribution.schoolFee - (termDistribution.schoolFeePaid || 0),
                    transportFee: 0,
                    hostelFee: 0
                  }
                }
                setPaymentData(paymentDetails)
                setShowPaymentModal(true)
              }}
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
              onPress={() => {
                const paymentDetails = {
                  studentId: student.id || student._id,
                  studentName: student.name,
                  academicYear: '2024-2025',
                  term: termNumber,
                  description: `Term ${termNumber} - Transport Fee`,
                  defaultAmounts: {
                    schoolFee: 0,
                    transportFee: termDistribution.transportFee - (termDistribution.transportFeePaid || 0),
                    hostelFee: 0
                  }
                }
                setPaymentData(paymentDetails)
                setShowPaymentModal(true)
              }}
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
              onPress={() => {
                const paymentDetails = {
                  studentId: student.id || student._id,
                  studentName: student.name,
                  academicYear: '2024-2025',
                  term: termNumber,
                  description: `Term ${termNumber} - Hostel Fee`,
                  defaultAmounts: {
                    schoolFee: 0,
                    transportFee: 0,
                    hostelFee: termDistribution.hostelFee - (termDistribution.hostelFeePaid || 0)
                  }
                }
                setPaymentData(paymentDetails)
                setShowPaymentModal(true)
              }}
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
        {/* Student Info */}
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
              <Feather name="home" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                {feeDetails.studentInfo?.studentType || student.studentType || 'Day Scholar'}
              </ThemedText>
            </View>
            {feeDetails.studentInfo?.usesTransport && (
              <View style={styles.detailItem}>
                <Feather name="truck" size={14} color={colors.textSecondary} />
                <ThemedText style={styles.detailText}>
                  {feeDetails.studentInfo?.village || 'Transport'}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        
        {/* Term Selector */}
        {renderTermSelector()}
        
        {/* Selected Term Content */}
        {selectedTerm === 'all' ? renderAllTermsOverview() : renderSingleTermDetails(parseInt(selectedTerm))}
        
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
    title: { fontSize: 18, color: '#FFFFFF', marginBottom: -5 },
    subtitle: { marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.9)' },
    
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    
    // Student Info
    studentInfoCard: {
      marginHorizontal: 16,
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
    
    // Term Selector
    termSelectorContainer: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    termScrollContent: {
      paddingVertical: 8,
      paddingRight: 16,
    },
    termOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      paddingLeft: 15,
      paddingVertical: 5,
      borderRadius: 25,
      borderWidth: 1,
      marginRight: 8,
      minHeight: 44,
    },
    termOptionLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      marginRight: 8,
    },
    termStatusBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    termStatusText: {
      fontSize: 11,
      fontFamily: 'Poppins-Bold',
    },
    
    // Overview
    overviewContainer: {
      paddingHorizontal: 16,
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
      padding: 12,
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
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
    },
    progressContainer: {
      marginTop: 0,
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
      paddingHorizontal: 16,
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
                    {student?.firstName || 'Student'}
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