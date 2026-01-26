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

export default function StudentFeeDetails({ visible, onClose, student }) {
  const { colors } = useTheme()
  const [feeDetails, setFeeDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [expandedTerms, setExpandedTerms] = useState({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    if (visible && student) {
      fetchStudentFeeDetails()
    } else {
      setFeeDetails(null)
      setError(null)
      setSelectedTerm('all')
      setExpandedTerms({})
      setShowPaymentModal(false)
      setPaymentData(null)
    }
  }, [visible, student])

  const fetchStudentFeeDetails = async () => {
    if (!student?._id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await axiosApi.get(`/payments/students/${student._id}/fee-details`, {
        params: {
          academicYear: student.academicYear || '2024-2025'
        }
      })

      if (response.data.success) {
        setFeeDetails(response.data.data)
      } else {
        setError(response.data.message || 'Failed to load fee details')
        showToast(response.data.message || 'Failed to load fee details', 'error')
      }
    } catch (error) {
      console.error('Fetch fee details error:', error)
      
      let errorMessage = 'Failed to load fee details'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required'
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied'
        } else if (error.response.status === 404) {
          errorMessage = 'Student not found'
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error, please try again later'
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.'
      } else {
        errorMessage = error.message || 'Network error'
      }

      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePayNow = (termNumber = null, componentKey = null) => {
    if (!feeDetails) return
    
    let paymentDetails = {
      studentId: student._id,
      studentName: student.name,
      academicYear: student.academicYear || '2024-2025',
      term: termNumber,
      components: {},
      defaultAmounts: {}
    }
    
    const { components } = feeDetails.feeBreakdown
    
    if (termNumber) {
      // Pay for specific term
      paymentDetails.description = `Term ${termNumber} Payment`
      
      // Calculate remaining due for each component in this term
      Object.entries(components || {}).forEach(([key, component]) => {
        if (component && component.total > 0) {
          const remainingDue = calculateRemainingDueForComponent(key, termNumber)
          if (remainingDue > 0) {
            paymentDetails.defaultAmounts[key] = remainingDue
          }
        }
      })
    } else {
      // Pay all remaining for academic year
      paymentDetails.description = 'Full Academic Year Payment'
      
      // Calculate remaining due for each component across all terms
      Object.entries(components || {}).forEach(([key, component]) => {
        if (component && component.due > 0) {
          paymentDetails.defaultAmounts[key] = component.due
        }
      })
    }
    
    setPaymentData(paymentDetails)
    setShowPaymentModal(true)
  }

  const calculateRemainingDueForComponent = (componentKey, termNumber = null) => {
    if (!feeDetails?.feeBreakdown?.components) return 0
    
    const component = feeDetails.feeBreakdown.components[componentKey]
    if (!component) return 0
    
    if (termNumber) {
      // For specific term, calculate remaining using efficient distribution
      const termDistribution = component.termDistribution || {}
      const termDue = termDistribution[termNumber] || 0
      
      // Calculate paid amount for this term from payment history
      const componentLowerKey = componentKey.replace('Fee', '').toLowerCase()
      const paidThisTerm = feeDetails.paymentHistory
        ?.filter(p => {
          const description = p.description || ''
          return (
            description.includes(`Term ${termNumber}`) && 
            p[`${componentLowerKey}FeePaid`] > 0
          )
        })
        ?.reduce((sum, p) => sum + p[`${componentLowerKey}FeePaid`], 0) || 0
      
      return Math.max(0, termDue - paidThisTerm)
    } else {
      // For full year, return total due
      return component.due || 0
    }
  }

  const toggleTermExpansion = (termNumber) => {
    setExpandedTerms(prev => ({
      ...prev,
      [termNumber]: !prev[termNumber]
    }))
  }

  const getTermOptions = () => {
    if (!feeDetails?.feeTerms?.termDetails) return []
    
    const options = [
      { label: 'Overview', value: 'all', icon: 'grid-view' }
    ]
    
    feeDetails.feeTerms.termDetails.forEach(term => {
      options.push({
        label: `Term ${term.term}`,
        value: term.term.toString(),
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

  const calculatePaidForTermComponent = (componentKey, termNumber) => {
    if (!feeDetails?.paymentHistory) return 0
    
    const componentLowerKey = componentKey.replace('Fee', '').toLowerCase()
    
    return feeDetails.paymentHistory
      .filter(p => {
        const description = p.description || ''
        return (
          description.includes(`Term ${termNumber}`) && 
          p[`${componentLowerKey}FeePaid`] > 0
        )
      })
      .reduce((sum, p) => sum + p[`${componentLowerKey}FeePaid`], 0) || 0
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

  const renderAllTermsOverview = () => {
    if (!feeDetails?.feeBreakdown || !feeDetails?.feeTerms) return null
    
    const { components, summary } = feeDetails.feeBreakdown
    const { termDetails } = feeDetails.feeTerms
    
    return (
      <View style={styles.overviewContainer}>
        {/* Academic Year Summary */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Academic Year Summary</ThemedText>
            <View style={styles.totalTermsBadge}>
              <ThemedText style={styles.totalTermsText}>{termDetails?.length || 3} Terms</ThemedText>
            </View>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <FontAwesome5 name="rupee-sign" size={16} color={colors.primary} />
              </View>
              <View style={styles.summaryItemContent}>
                <ThemedText style={styles.summaryLabel}>Total Fee</ThemedText>
                <ThemedText style={styles.summaryValue}>₹{summary?.totalFee?.toLocaleString() || 0}</ThemedText>
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
            {termDetails?.map((term) => {
              const statusColor = getStatusColor(term.status)
              
              return (
                <TouchableOpacity
                  key={term.term}
                  style={styles.termStatusItem}
                  onPress={() => setSelectedTerm(term.term.toString())}
                  activeOpacity={0.9}
                >
                  <View style={styles.termStatusHeader}>
                    <View style={styles.termStatusInfo}>
                      <ThemedText style={styles.termStatusTitle}>Term {term.term}</ThemedText>
                      <ThemedText style={styles.termStatusDate}>
                        Due Amount: ₹{term.dueAmount?.toLocaleString() || 0}
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
                      onPress={() => handlePayNow(term.term)}
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
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Fee Components</ThemedText>
          </View>
          
          {Object.entries(components || {}).map(([key, component]) => {
            if (!component || component.total === 0) return null
            
            const termAmount = component.termAmount || 0
            
            return (
              <View key={key} style={styles.componentCard}>
                <View style={styles.componentHeader}>
                  <ThemedText style={styles.componentName}>
                    {key.replace('Fee', ' Fee')}
                  </ThemedText>
                  {component.discount > 0 && (
                    <View style={[styles.discountBadge, { backgroundColor: colors.warning + '20' }]}>
                      <Feather name="tag" size={12} color={colors.warning} />
                      <ThemedText style={[styles.discountText, { color: colors.warning }]}>
                        {component.discount}% off
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.componentDetails}>
                  <View style={styles.componentAmountRow}>
                    <View style={styles.componentAmountItem}>
                      <ThemedText style={styles.componentAmountLabel}>Total</ThemedText>
                      <ThemedText style={styles.componentAmountValue}>
                        ₹{component.total.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={styles.componentAmountItem}>
                      <ThemedText style={styles.componentAmountLabel}>Per Term</ThemedText>
                      <ThemedText style={[styles.componentAmountValue, { color: colors.primary }]}>
                        ₹{termAmount.toLocaleString()}
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
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  const renderSingleTermDetails = (termNumber) => {
    if (!feeDetails?.feeBreakdown || !feeDetails?.feeTerms?.termDetails) return null
    
    const termData = feeDetails.feeTerms.termDetails.find(t => t.term === termNumber)
    if (!termData) return null
    
    const { components } = feeDetails.feeBreakdown
    const status = termData.status
    const statusColor = getStatusColor(status)
    
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
                  Due Amount: ₹{termData.dueAmount?.toLocaleString() || 0}
                </ThemedText>
              </View>
              <View style={[styles.termStatusIndicator, { backgroundColor: statusColor }]}>
                <ThemedText style={styles.termStatusIndicatorText}>{status}</ThemedText>
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
                onPress={() => handlePayNow(termNumber)}
                activeOpacity={0.9}
              >
                <Feather name="credit-card" size={18} color="#FFFFFF" />
                <ThemedText style={styles.payNowText}>Pay Term {termNumber} ₹{termData.remainingAmount?.toLocaleString()}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Term Components */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <Feather name="layers" size={18} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Fee Components - Term {termNumber}</ThemedText>
          </View>
          
          {Object.entries(components || {}).map(([key, component]) => {
            if (!component || component.total === 0) return null
            
            // Get efficient distribution for this component
            const termDistribution = component.termDistribution || {}
            const termAmount = termDistribution[termNumber] || 0
            const paidThisTerm = calculatePaidForTermComponent(key, termNumber)
            const dueThisTerm = Math.max(0, termAmount - paidThisTerm)
            const percentagePaid = termAmount > 0 ? (paidThisTerm / termAmount * 100) : 0
            const componentStatus = paidThisTerm >= termAmount ? 'Paid' : paidThisTerm > 0 ? 'Partial' : 'Unpaid'
            const componentStatusColor = getStatusColor(componentStatus)
            
            return (
              <TouchableOpacity 
                key={key}
                style={[
                  styles.termComponentCard,
                  { backgroundColor: colors.inputBackground }
                ]}
                activeOpacity={0.9}
                onPress={() => toggleTermExpansion(`term-${termNumber}-${key}`)}
              >
                <View style={styles.termComponentHeader}>
                  <View style={styles.termComponentInfo}>
                    <View style={styles.termComponentTitleRow}>
                      <ThemedText style={styles.termComponentName}>
                        {key.replace('Fee', ' Fee')}
                      </ThemedText>
                      <View style={styles.componentStatusArrowContainer}>
                        <View style={[styles.componentStatusBadge, { backgroundColor: componentStatusColor + '20' }]}>
                          <ThemedText style={[styles.componentStatusText, { color: componentStatusColor }]}>
                            {componentStatus}
                          </ThemedText>
                        </View>
                        <MaterialIcons 
                          name={expandedTerms[`term-${termNumber}-${key}`] ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                          size={24} 
                          color={colors.textSecondary} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.termComponentDetails}>
                      <View style={styles.termComponentDetail}>
                        <FontAwesome5 name="rupee-sign" size={12} color={colors.textSecondary} />
                        <ThemedText style={styles.termComponentDetailText}>
                          Term Amount: ₹{termAmount.toLocaleString()}
                        </ThemedText>
                      </View>
                      {component.discount > 0 && (
                        <View style={styles.termComponentDetail}>
                          <Feather name="tag" size={12} color={colors.warning} />
                          <ThemedText style={[styles.termComponentDetailText, { color: colors.warning }]}>
                            Discount: {component.discount}%
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                <View style={styles.termComponentSummary}>
                  <View style={styles.termComponentAmounts}>
                    <View style={styles.termComponentAmount}>
                      <ThemedText style={styles.termComponentAmountLabel}>Paid</ThemedText>
                      <ThemedText style={[styles.termComponentAmountValue, { color: paidThisTerm > 0 ? colors.success : colors.textSecondary }]}>
                        ₹{paidThisTerm.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={styles.termDividerVertical} />
                    <View style={styles.termComponentAmount}>
                      <ThemedText style={styles.termComponentAmountLabel}>Due</ThemedText>
                      <ThemedText style={[styles.termComponentAmountValue, { color: dueThisTerm > 0 ? colors.danger : colors.success }]}>
                        ₹{dueThisTerm.toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.termComponentProgress}>
                    <View style={[styles.termComponentProgressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.termComponentProgressFill, 
                          { 
                            width: `${percentagePaid}%`,
                            backgroundColor: componentStatusColor 
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.termComponentProgressText}>
                      {percentagePaid.toFixed(1)}% Paid
                    </ThemedText>
                  </View>
                </View>
                
                {expandedTerms[`term-${termNumber}-${key}`] && (
                  <View style={styles.termComponentExpanded}>
                    <ThemedText style={styles.expandedTitle}>Payment Details</ThemedText>
                    
                    {feeDetails.paymentHistory
                      ?.filter(p => {
                        const componentLowerKey = key.replace('Fee', '').toLowerCase()
                        const description = p.description || ''
                        return (
                          description.includes(`Term ${termNumber}`) && 
                          p[`${componentLowerKey}FeePaid`] > 0
                        )
                      })
                      .map((payment, index) => (
                        <View key={payment.paymentId} style={styles.paymentDetailRow}>
                          <View style={styles.paymentDetailInfo}>
                            <View style={styles.paymentDetailHeader}>
                              <Feather name="credit-card" size={14} color={colors.text} />
                              <ThemedText style={styles.paymentDetailDate}>
                                {new Date(payment.date).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </ThemedText>
                            </View>
                            <ThemedText style={styles.paymentDetailReceipt}>
                              Receipt: {payment.receiptNo}
                            </ThemedText>
                          </View>
                          <ThemedText style={[styles.paymentDetailAmount, { color: colors.success }]}>
                            ₹{payment[`${key.replace('Fee', '').toLowerCase()}FeePaid`]?.toLocaleString() || 0}
                          </ThemedText>
                        </View>
                      ))}
                    
                    {feeDetails.paymentHistory
                      ?.filter(p => {
                        const componentLowerKey = key.replace('Fee', '').toLowerCase()
                        const description = p.description || ''
                        return (
                          description.includes(`Term ${termNumber}`) && 
                          p[`${componentLowerKey}FeePaid`] > 0
                        )
                      }).length === 0 && (
                      <View style={styles.noPaymentsContainer}>
                        <Feather name="info" size={16} color={colors.textSecondary} />
                        <ThemedText style={styles.noPaymentsText}>
                          No payments recorded for this component
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
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
          <Ionicons name="error-outline" size={48} color={colors.danger} />
          <ThemedText style={styles.errorTitle}>Failed to Load Details</ThemedText>
          <ThemedText style={styles.errorSubtitle}>{error}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchStudentFeeDetails}
            activeOpacity={0.9}
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
                {feeDetails.studentInfo?.displayClass || student.displayClass || student.class} • {feeDetails.studentInfo?.section || student.section}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.studentDetailsGrid}>
            <View style={styles.detailItem}>
              <Feather name="hash" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                {feeDetails.studentInfo?.admissionNo || student.admissionNo}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <Feather name="tag" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                Roll: {feeDetails.studentInfo?.rollNo || student.rollNo || 'N/A'}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <Feather name="home" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.detailText}>
                {feeDetails.studentInfo?.studentType || student.studentType || 'Day Scholar'}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Term Selector */}
        {renderTermSelector()}
        
        {/* Selected Term Content */}
        {selectedTerm === 'all' ? renderAllTermsOverview() : renderSingleTermDetails(parseInt(selectedTerm))}
        
        {/* Academic Year Info */}
        <View style={[styles.academicYearCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.academicYearHeader}>
            <Feather name="calendar" size={16} color={colors.primary} />
            <ThemedText style={styles.academicYearTitle}>
              Academic Year: {feeDetails.currentAcademicYear}
            </ThemedText>
          </View>
          <ThemedText style={styles.academicYearInfo}>
            Last updated: {new Date(feeDetails.feeRecordUpdatedAt).toLocaleDateString('en-IN')}
          </ThemedText>
        </View>
        
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
    title: { fontSize: 18, color: '#FFFFFF', marginBottom: -5 },
    subtitle: { marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.9)' },
    
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    
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
      width: 48,
      height: 48,
      borderRadius: 24,
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
      marginBottom: 4,
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
      flexDirection: 'row',
      alignItems: 'center',
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
      marginBottom: 16,
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
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    componentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    componentName: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    discountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    discountText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    componentDetails: {
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
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    termComponentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    termComponentInfo: {
      flex: 1,
      marginRight: 12,
    },
    termComponentTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    termComponentName: {
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
    termComponentDetails: {
      gap: 8,
    },
    termComponentDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    termComponentDetailText: {
      fontSize: 12,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    termComponentSummary: {
      marginTop: 12,
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
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 4,
    },
    termComponentAmountValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    termComponentProgress: {
      gap: 4,
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
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'right',
    },
    termComponentExpanded: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
      gap: 8,
    },
    expandedTitle: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    paymentDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    paymentDetailInfo: {
      flex: 1,
    },
    paymentDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    paymentDetailDate: {
      fontSize: 12,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    paymentDetailReceipt: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    paymentDetailAmount: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    noPaymentsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    noPaymentsText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      fontStyle: 'italic',
    },
    
    // Academic Year Card
    academicYearCard: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    academicYearHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    academicYearTitle: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    academicYearInfo: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
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
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
    },
    
    bottomSpacer: {
      height: 60,
    },
  })

  if (!student) return null

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
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
                    {student?.name || 'Student'} • {student.academicYear || '2024-2025'}
                  </ThemedText>
                </View>
                <View style={{ width: 44 }} />
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
        onPaymentSuccess={(paymentResult) => {
          showToast('Payment processed successfully', 'success')
          fetchStudentFeeDetails() 
        }}
      />
    </>
  ) 
}