import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Ionicons, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import ConfirmationModal from './ConfirmationModal'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export default function FeePaymentModal({ visible, onClose, paymentData, student, feeDetails, onPaymentSuccess }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [transactionId, setTransactionId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [componentAmounts, setComponentAmounts] = useState({})
  const [totalAmount, setTotalAmount] = useState(0)
  const [validationErrors, setValidationErrors] = useState({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [animation] = useState(new Animated.Value(0))
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [receiptData, setReceiptData] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
      
      if (paymentData && student && feeDetails) {
        initializePaymentForm()
      }
    } else {
      animation.setValue(0)
      resetForm()
    }
  }, [visible])

  useEffect(() => {
    if (visible && paymentData && student && feeDetails) {
      initializePaymentForm()
    }
  }, [paymentData, feeDetails])

  const initializePaymentForm = () => {
    try {
      // Set default remarks
      setRemarks(paymentData.description || '')
      setValidationErrors({})
      
      // Initialize component amounts with remaining due amounts
      const initialAmounts = {}
      let total = 0
      
      // Calculate remaining due for each component
      Object.keys(paymentData.defaultAmounts || {}).forEach(key => {
        // Get the remaining due amount for this component
        const remainingDue = calculateRemainingDueForComponent(key)
        
        if (remainingDue > 0) {
          initialAmounts[key] = remainingDue.toString()
          total += remainingDue
        }
      })
      
      setComponentAmounts(initialAmounts)
      setTotalAmount(total)
      
    } catch (error) {
      console.error('Error initializing payment form:', error)
      showToast('Failed to initialize payment form', 'error')
    }
  }

  const calculateRemainingDueForComponent = (componentKey) => {
    if (!feeDetails?.feeBreakdown?.components || !paymentData?.term) {
      return paymentData.defaultAmounts[componentKey] || 0
    }
    
    const component = feeDetails.feeBreakdown.components[componentKey]
    if (!component) return 0
    
    if (paymentData.term) {
      // For term payment, calculate remaining for specific term
      const termAmount = component.termAmount || 0
      
      // Calculate paid amount for this term from payment history
      const componentLowerKey = componentKey.replace('Fee', '').toLowerCase()
      const paidThisTerm = feeDetails.paymentHistory
        ?.filter(p => {
          const description = p.description || ''
          return (
            description.includes(`Term ${paymentData.term}`) && 
            p[`${componentLowerKey}FeePaid`] > 0
          )
        })
        ?.reduce((sum, p) => sum + p[`${componentLowerKey}FeePaid`], 0) || 0
      
      return Math.max(0, termAmount - paidThisTerm)
    } else {
      // For full payment, return component due
      return component.due || 0
    }
  }

  const resetForm = () => {
    setPaymentMethod('cash')
    setTransactionId('')
    setRemarks('')
    setComponentAmounts({})
    setTotalAmount(0)
    setLoading(false)
    setValidationErrors({})
    setShowConfirmation(false)
    setReceiptModalVisible(false)
    setReceiptData(null)
  }

  const validateForm = () => {
    const errors = {}
    
    // Validate component amounts
    let hasValidAmount = false
    Object.entries(componentAmounts).forEach(([key, amount]) => {
      const numAmount = parseFloat(amount) || 0
      const maxAmount = getMaxAmount(key)
      
      if (numAmount > 0) {
        hasValidAmount = true
        
        if (numAmount > maxAmount) {
          errors[key] = `Amount cannot exceed ₹${maxAmount.toLocaleString()}`
        }
        
        if (numAmount < 0) {
          errors[key] = 'Amount cannot be negative'
        }
      }
    })
    
    if (!hasValidAmount) {
      errors.general = 'Please enter at least one fee amount'
    }
    
    if (totalAmount <= 0) {
      errors.total = 'Total amount must be greater than 0'
    }
    
    // Validate transaction ID for non-cash payments
    if (paymentMethod !== 'cash') {
      const tid = transactionId.trim()
      if (!tid) {
        errors.transactionId = 'Transaction ID is required'
      } else if (paymentMethod === 'card' && !/^\d{4,16}$/.test(tid)) {
        errors.transactionId = 'Please enter valid card last 4 digits'
      } else if (paymentMethod === 'upi' && !tid.includes('@')) {
        errors.transactionId = 'Please enter valid UPI ID'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAmountChange = (componentKey, value) => {
    // Allow only numbers and one decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const decimalCount = (cleanValue.match(/\./g) || []).length
    const finalValue = decimalCount > 1 ? cleanValue.slice(0, -1) : cleanValue
    
    // Update the component amount
    const newAmounts = { ...componentAmounts, [componentKey]: finalValue }
    setComponentAmounts(newAmounts)
    
    // Calculate total
    let total = 0
    Object.values(newAmounts).forEach(amount => {
      const numAmount = parseFloat(amount) || 0
      total += numAmount
    })
    setTotalAmount(total)
    
    // Clear validation error for this field
    if (validationErrors[componentKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[componentKey]
        return newErrors
      })
    }
  }

  const getMaxAmount = (componentKey) => {
    // Return remaining due amount as max
    return calculateRemainingDueForComponent(componentKey)
  }

  const getPaymentModeForApi = () => {
    switch (paymentMethod) {
      case 'cash': return 'Cash'
      case 'card': return 'Card'
      case 'upi': return 'Online Payment'
      case 'bank': return 'Bank Transfer'
      default: return 'Cash'
    }
  }

  const buildPaymentPayload = () => {
    const payload = {
      academicYear: paymentData.academicYear || student?.academicYear || '2024-2025',
      description: remarks.trim() || paymentData.description,
      paymentMode: getPaymentModeForApi(),
      term: paymentData.term || null,
      notes: remarks.trim() || 'Fee Payment',
      receivedBy: 'Admin' // This should come from your auth context
    }
    
    // Add component amounts
    Object.entries(componentAmounts).forEach(([key, amount]) => {
      const numAmount = parseFloat(amount) || 0
      if (numAmount > 0) {
        const apiKey = key === 'schoolFee' ? 'schoolFeePaid' :
                      key === 'transportFee' ? 'transportFeePaid' :
                      key === 'hostelFee' ? 'hostelFeePaid' : null
        
        if (apiKey) {
          payload[apiKey] = numAmount
        }
      }
    })
    
    // Add transaction details
    if (paymentMethod !== 'cash') {
      const tid = transactionId.trim()
      if (tid) {
        if (paymentMethod === 'card') {
          payload.chequeNo = tid
        } else if (paymentMethod === 'bank') {
          payload.bankName = 'Bank Transfer'
          payload.transactionId = tid
        } else if (paymentMethod === 'upi') {
          payload.transactionId = tid
        }
      }
    }
    
    return payload
  }

  const handlePaymentSubmit = () => {
    if (!paymentData || !student?._id) {
      showToast('Student information is missing', 'error')
      return
    }
    
    // Validate form
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error')
      return
    }
    
    // Show confirmation modal
    setShowConfirmation(true)
  }

  const processPayment = async () => {
    setShowConfirmation(false)
    setLoading(true)
    
    try {
      const payload = buildPaymentPayload()
      
      const response = await axiosApi.post(
        `/payments/students/${student._id}/payments`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.data.success) {
        const paymentResult = response.data.data
        
        showToast(`Payment of ₹${totalAmount.toLocaleString()} recorded successfully!`, 'success')
        
        // Store receipt data
        setReceiptData({
          receiptNo: paymentResult.receiptNo,
          paymentId: paymentResult.paymentId,
          totalAmount: totalAmount,
          date: new Date().toISOString(),
          studentName: student.name,
          admissionNo: student.admissionNo,
          receiptData: paymentResult.receiptData
        })
        
        // Show receipt modal after delay
        setTimeout(() => {
          setReceiptModalVisible(true)
        }, 500)
        
        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentResult)
        }
        
      } else {
        throw new Error(response.data.message || 'Payment failed')
      }
      
    } catch (error) {
      console.error('Payment submission error:', error)
      
      let errorMessage = 'Failed to process payment'
      
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid payment data'
            if (data.errors) {
              const errorList = Object.values(data.errors).join('\n')
              errorMessage = `Please fix the following:\n${errorList}`
            }
            break
          case 401:
            errorMessage = 'Authentication required'
            break
          case 403:
            errorMessage = 'You are not authorized to process payments'
            break
          case 404:
            errorMessage = 'Student not found'
            break
          case 409:
            errorMessage = 'Payment already exists or conflict occurred'
            break
          case 422:
            errorMessage = data.message || 'Payment validation failed'
            break
          case 500:
            errorMessage = 'Server error, please try again later'
            break
          default:
            errorMessage = data.message || `Payment failed (${status})`
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.'
      } else {
        errorMessage = error.message || 'Network error'
      }
      
      showToast(errorMessage, 'error')
      
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async () => {
    try {
      if (!receiptData?.paymentId) {
        showToast('Payment ID is missing', 'error')
        return
      }
      
      // Show loading
      setLoading(true)
      
      // For React Native, you need to:
      // 1. Download the PDF file
      // 2. Save it to device storage
      // 3. Open/share it
      
      const downloadRes = await FileSystem.downloadAsync(
        `${axiosApi.defaults.baseURL}/payments/students/${student._id}/receipt?paymentId=${receiptData.paymentId}`,
        FileSystem.documentDirectory + `Fee-Receipt-${receiptData.receiptNo}.pdf`
      )
      
      if (downloadRes.status === 200) {
        // For iOS/Android, use Sharing API to open/share the PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Fee Receipt - ${receiptData.receiptNo}`,
            UTI: 'com.adobe.pdf' // iOS only
          })
        } else {
          // Fallback for web or if sharing not available
          showToast('Receipt downloaded successfully', 'success')
        }
        
        setReceiptModalVisible(false)
      }
      
    } catch (error) {
      console.error('Receipt download error:', error)
      showToast('Failed to download receipt', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return 'money-bill-wave'
      case 'card': return 'credit-card'
      case 'upi': return 'mobile-alt'
      case 'bank': return 'university'
      default: return 'money-bill-wave'
    }
  }

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Cash'
      case 'card': return 'Card'
      case 'upi': return 'UPI'
      case 'bank': return 'Bank Transfer'
      default: return 'Cash'
    }
  }

  const getComponentTermAmount = (componentKey) => {
    if (!feeDetails?.feeBreakdown?.components) return 0
    
    const component = feeDetails.feeBreakdown.components[componentKey]
    if (!component) return 0
    
    return paymentData.term 
      ? component.termAmount || 0 
      : component.total || 0
  }

  const getComponentPaidAmount = (componentKey) => {
    if (!feeDetails?.paymentHistory || !paymentData?.term) return 0
    
    const componentLowerKey = componentKey.replace('Fee', '').toLowerCase()
    
    return feeDetails.paymentHistory
      ?.filter(p => {
        const description = p.description || ''
        return (
          description.includes(`Term ${paymentData.term}`) && 
          p[`${componentLowerKey}FeePaid`] > 0
        )
      })
      ?.reduce((sum, p) => sum + p[`${componentLowerKey}FeePaid`], 0) || 0
  }

  const renderComponentInputs = () => {
    if (!paymentData?.defaultAmounts) return null
    
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
        <View style={styles.cardHeader}>
          <Feather name="edit-2" size={18} color={colors.primary} />
          <ThemedText style={styles.cardTitle}>Payment Amounts</ThemedText>
        </View>
        
        <ThemedText style={styles.sectionSubtitle}>
          Enter amount to pay for each component (remaining due shown)
        </ThemedText>
        
        {Object.keys(paymentData.defaultAmounts || {}).map((key) => {
          const maxAmount = getMaxAmount(key)
          const currentAmount = parseFloat(componentAmounts[key] || 0)
          const termAmount = getComponentTermAmount(key)
          const paidAmount = getComponentPaidAmount(key)
          const error = validationErrors[key]
          
          if (maxAmount <= 0) return null // Skip if nothing due
          
          return (
            <View key={key} style={styles.componentInputRow}>
              <View style={styles.componentInputInfo}>
                <View style={styles.componentLabelRow}>
                  <ThemedText style={styles.componentInputLabel}>
                    {key.replace('Fee', ' Fee')}
                  </ThemedText>
                  {error && (
                    <MaterialIcons name="error-outline" size={14} color={colors.danger} />
                  )}
                </View>
                
                <View style={styles.componentDetails}>
                  {paymentData.term && (
                    <View style={styles.detailRow}>
                      <Feather name="calendar" size={11} color={colors.textSecondary} />
                      <ThemedText style={styles.detailText}>
                        Term {paymentData.term}: ₹{termAmount.toLocaleString()}
                      </ThemedText>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Feather name="check-circle" size={11} color={colors.success} />
                    <ThemedText style={styles.detailText}>
                      Paid: ₹{paidAmount.toLocaleString()}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Feather name="clock" size={11} color={colors.danger} />
                    <ThemedText style={[styles.detailText, { color: colors.danger }]}>
                      Remaining: ₹{maxAmount.toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
                
                {error && (
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                )}
              </View>
              
              <View style={styles.amountInputContainer}>
                <View style={styles.currencySymbol}>
                  <FontAwesome5 name="rupee-sign" size={12} color={colors.textSecondary} />
                </View>
                <TextInput
                  style={[
                    styles.amountInput, 
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: error ? colors.danger : colors.border,
                      color: colors.text
                    }
                  ]}
                  value={componentAmounts[key] || ''}
                  onChangeText={(value) => handleAmountChange(key, value)}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            </View>
          )
        })}
        
        <View style={styles.totalAmountRow}>
          <View style={styles.totalAmountLabelContainer}>
            <ThemedText style={styles.totalAmountLabel}>Total Payment</ThemedText>
            {validationErrors.total && (
              <ThemedText style={styles.errorText}>{validationErrors.total}</ThemedText>
            )}
          </View>
          <View style={styles.totalAmountContainer}>
            <FontAwesome5 name="rupee-sign" size={16} color={colors.primary} style={styles.totalCurrencySymbol} />
            <ThemedText style={[styles.totalAmountValue, { color: colors.primary }]}>
              {totalAmount.toLocaleString()}
            </ThemedText>
          </View>
        </View>
        
        {validationErrors.general && (
          <View style={styles.generalErrorContainer}>
            <MaterialIcons name="error-outline" size={16} color={colors.danger} />
            <ThemedText style={styles.generalErrorText}>{validationErrors.general}</ThemedText>
          </View>
        )}
      </View>
    )
  }

  const renderPaymentMethods = () => {
    const methods = [
      { key: 'cash', label: 'Cash', icon: 'money-bill-wave' },
      { key: 'card', label: 'Card', icon: 'credit-card' },
      { key: 'upi', label: 'UPI', icon: 'mobile-alt' },
      { key: 'bank', label: 'Bank', icon: 'university' }
    ]
    
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
        <View style={styles.cardHeader}>
          <Feather name="credit-card" size={18} color={colors.primary} />
          <ThemedText style={styles.cardTitle}>Payment Method</ThemedText>
        </View>
        
        <View style={styles.methodsGrid}>
          {methods.map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodCard,
                { 
                  backgroundColor: paymentMethod === method.key ? colors.primary : colors.inputBackground,
                  borderColor: paymentMethod === method.key ? colors.primary : colors.border,
                  transform: [{ scale: paymentMethod === method.key ? 1.02 : 1 }]
                }
              ]}
              onPress={() => {
                setPaymentMethod(method.key)
                // Auto-generate transaction ID for non-cash
                if (method.key !== 'cash') {
                  const date = new Date()
                  const timestamp = date.getTime()
                  const random = Math.floor(Math.random() * 10000)
                  setTransactionId(`TXN${timestamp}${random}`)
                } else {
                  setTransactionId('')
                }
              }}
              activeOpacity={0.8}
              disabled={loading}
            >
              <FontAwesome5 
                name={method.icon} 
                size={20} 
                color={paymentMethod === method.key ? '#FFFFFF' : colors.textSecondary} 
              />
              <ThemedText style={[
                styles.methodLabel,
                { color: paymentMethod === method.key ? '#FFFFFF' : colors.text }
              ]}>
                {method.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  const renderTransactionInputs = () => {
    if (paymentMethod === 'cash') return null
    
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
        <View style={styles.cardHeader}>
          <Feather name="hash" size={18} color={colors.primary} />
          <ThemedText style={styles.cardTitle}>Transaction Details</ThemedText>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <ThemedText style={styles.inputLabel}>
              {paymentMethod === 'card' ? 'Card Last 4 digits' : 
               paymentMethod === 'upi' ? 'UPI Transaction ID' : 
               'Transaction ID'}
            </ThemedText>
            {validationErrors.transactionId && (
              <MaterialIcons name="error-outline" size={14} color={colors.danger} />
            )}
          </View>
          
          <TextInput
            style={[
              styles.textInput, 
              { 
                backgroundColor: colors.inputBackground,
                borderColor: validationErrors.transactionId ? colors.danger : colors.border,
                color: colors.text
              }
            ]}
            value={transactionId}
            onChangeText={(text) => {
              setTransactionId(text)
              if (validationErrors.transactionId) {
                setValidationErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors.transactionId
                  return newErrors
                })
              }
            }}
            placeholder={
              paymentMethod === 'card' ? 'Enter card last 4 digits (e.g., 1234)' :
              paymentMethod === 'upi' ? 'Enter UPI transaction ID' :
              'Enter bank transaction reference'
            }
            placeholderTextColor={colors.textSecondary + '80'}
            keyboardType={paymentMethod === 'card' ? 'numeric' : 'default'}
            autoCapitalize="none"
            editable={!loading}
          />
          
          {validationErrors.transactionId && (
            <ThemedText style={styles.errorText}>{validationErrors.transactionId}</ThemedText>
          )}
          
          <ThemedText style={styles.inputHelper}>
            {paymentMethod === 'card' ? 'Enter the last 4 digits of the card used' :
             paymentMethod === 'upi' ? 'Enter UPI reference ID (e.g., 1234567890@upi)' :
             'Enter bank transfer reference number'}
          </ThemedText>
        </View>
      </View>
    )
  }

  const renderRemarksInput = () => {
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
        <View style={styles.cardHeader}>
          <Feather name="message-circle" size={18} color={colors.primary} />
          <ThemedText style={styles.cardTitle}>Remarks</ThemedText>
        </View>
        
        <TextInput
          style={[
            styles.textArea, 
            { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.text
            }
          ]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Add any remarks or notes about this payment..."
          placeholderTextColor={colors.textSecondary + '80'}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!loading}
        />
      </View>
    )
  }

  const renderStudentInfo = () => {
    if (!student) return null
    
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.studentHeader}>
          <View style={[styles.studentAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.studentInfo}>
            <ThemedText style={styles.studentName}>{student.name}</ThemedText>
            <ThemedText style={styles.studentDetails}>
              {student.displayClass || student.class} • {student.section}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.paymentInfo}>
          <View style={styles.paymentInfoItem}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText style={styles.paymentInfoText}>
              {paymentData.term ? `Term ${paymentData.term} Payment` : 'Full Academic Year Payment'}
            </ThemedText>
          </View>
          <View style={styles.paymentInfoItem}>
            <Feather name="hash" size={14} color={colors.textSecondary} />
            <ThemedText style={styles.paymentInfoText}>
              {student.admissionNo}
            </ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const renderReceiptModal = () => {
    if (!receiptData) return null
    
    return (
      <Modal
        visible={receiptModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReceiptModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.receiptModalOverlay}>
          <Animated.View 
            style={[
              styles.receiptModalContent,
              { 
                backgroundColor: colors.cardBackground,
                transform: [{ scale: animation }]
              }
            ]}
          >
            <View style={styles.receiptHeader}>
              <Feather name="check-circle" size={48} color={colors.success} />
              <ThemedText style={styles.receiptTitle}>Payment Successful!</ThemedText>
            </View>
            
            <View style={styles.receiptDetails}>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Receipt No:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.receiptNo}</ThemedText>
              </View>
              
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Amount:</ThemedText>
                <ThemedText style={[styles.receiptValue, { color: colors.success }]}>
                  ₹{receiptData.totalAmount.toLocaleString()}
                </ThemedText>
              </View>
              
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Student:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.studentName}</ThemedText>
              </View>
              
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Admission No:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.admissionNo}</ThemedText>
              </View>
              
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Date:</ThemedText>
                <ThemedText style={styles.receiptValue}>
                  {new Date(receiptData.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={[styles.receiptButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => {
                  setReceiptModalVisible(false)
                  onClose()
                }}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.receiptButtonText, { color: colors.text }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.receiptButton, { backgroundColor: colors.primary }]}
                onPress={downloadReceipt}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="download" size={18} color="#FFFFFF" />
                    <ThemedText style={[styles.receiptButtonText, { color: '#FFFFFF' }]}>
                      Download Receipt
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    )
  }

  const renderContent = () => {
    if (!paymentData || !student) {
      return (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>No payment data available</ThemedText>
        </View>
      )
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Student Info */}
        {renderStudentInfo()}

        {/* Component Inputs */}
        {renderComponentInputs()}

        {/* Payment Methods */}
        {renderPaymentMethods()}

        {/* Transaction Inputs */}
        {renderTransactionInputs()}

        {/* Remarks Input */}
        {renderRemarksInput()}

        {/* Payment Summary */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 12 }]}>
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={18} color={colors.primary} />
            <ThemedText style={styles.cardTitle}>Payment Summary</ThemedText>
          </View>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total Amount</ThemedText>
              <ThemedText style={styles.summaryValue}>₹{totalAmount.toLocaleString()}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Payment Method</ThemedText>
              <ThemedText style={styles.summaryValue}>{getPaymentMethodLabel(paymentMethod)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Transaction ID</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {paymentMethod === 'cash' ? 'N/A' : transactionId || 'Not entered'}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Payment Type</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {paymentData.term ? `Term ${paymentData.term}` : 'Full Year'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]}
            onPress={onClose}
            activeOpacity={0.9}
            disabled={loading}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { 
                backgroundColor: totalAmount > 0 ? colors.primary : colors.textSecondary,
                opacity: (loading || totalAmount <= 0) ? 0.6 : 1
              }
            ]}
            onPress={handlePaymentSubmit}
            activeOpacity={0.9}
            disabled={loading || totalAmount <= 0}
          >
            {loading ? (
              <>
                <Feather name="loader" size={16} color="#FFFFFF" />
                <ThemedText style={styles.submitButtonText}>Processing...</ThemedText>
              </>
            ) : (
              <>
                <Feather name="check-circle" size={18} color="#FFFFFF" />
                <ThemedText style={styles.submitButtonText}>
                  Pay ₹{totalAmount.toLocaleString()}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
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
    scrollContent: { paddingBottom: 100, paddingHorizontal: 16 },
    
    // Card styles
    card: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      marginTop: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 16,
    },
    
    // Student Info
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
    studentDetails: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    paymentInfo: {
      flexDirection: 'row',
      gap: 16,
    },
    paymentInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    paymentInfoText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    
    // Component Inputs
    componentInputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    componentInputInfo: {
      flex: 1,
      marginRight: 12,
    },
    componentLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    componentInputLabel: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    componentDetails: {
      gap: 4,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 120,
    },
    currencySymbol: {
      position: 'absolute',
      left: 10,
      zIndex: 1,
    },
    amountInput: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 30,
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      textAlign: 'right',
    },
    totalAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      marginTop: 8,
      borderTopWidth: 2,
      borderTopColor: colors.primary + '30',
    },
    totalAmountLabelContainer: {
      flex: 1,
    },
    totalAmountLabel: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    totalAmountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    totalCurrencySymbol: {
      marginRight: 4,
    },
    totalAmountValue: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
    },
    
    // Payment Methods
    methodsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    methodCard: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
    },
    methodLabel: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
    },
    
    // Inputs
    inputContainer: {
      marginTop: 8,
    },
    inputLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    inputLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    inputHelper: {
      fontSize: 11,
      color: colors.textSecondary + '80',
      fontFamily: 'Poppins-Medium',
      marginTop: 6,
      fontStyle: 'italic',
    },
    textInput: {
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    textArea: {
      minHeight: 80,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    
    // Error styling
    errorText: {
      fontSize: 11,
      color: colors.danger,
      fontFamily: 'Poppins-Medium',
      marginTop: 4,
    },
    generalErrorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      padding: 10,
      backgroundColor: colors.danger + '10',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.danger + '30',
    },
    generalErrorText: {
      fontSize: 12,
      color: colors.danger,
      fontFamily: 'Poppins-Medium',
      flex: 1,
    },
    
    // Payment Summary
    summaryContainer: {
      gap: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    summaryValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    
    // Action Buttons
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
    submitButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 10,
      gap: 8,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // Receipt Modal
    receiptModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    receiptModalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    receiptHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    receiptTitle: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      marginTop: 12,
      textAlign: 'center',
    },
    receiptDetails: {
      gap: 12,
      marginBottom: 24,
    },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    receiptLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    receiptValue: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    receiptActions: {
      flexDirection: 'row',
      gap: 12,
    },
    receiptButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      gap: 8,
    },
    receiptButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    
    // Loading State
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    
    bottomSpacer: {
      height: 60,
    },
  })

  return (
    <>
      <Modal 
        visible={visible} 
        animationType="slide" 
        onRequestClose={onClose} 
        statusBarTranslucent
      >
        <View style={styles.container}>
          <LinearGradient 
            colors={[colors.gradientStart, colors.gradientEnd]} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={styles.backButton} 
                  onPress={onClose}
                  disabled={loading}
                >
                  <FontAwesome5 
                    name="chevron-left" 
                    size={20} 
                    color="#FFFFFF" 
                    style={{ marginLeft: -2 }}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.title}>Make Payment</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {student?.name || 'Student'} • {student?.academicYear || '2024-2025'}
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
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={processPayment}
        title="Confirm Payment"
        message={`Are you sure you want to process payment of ₹${totalAmount.toLocaleString()}?`}
        confirmText="Confirm"
        cancelText="Cancel"
      />
      
      {/* Receipt Modal */}
      {renderReceiptModal()}
    </>
  )
}