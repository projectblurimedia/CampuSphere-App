import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function PaymentConfirmationModal ({ 
  visible, 
  onConfirm, 
  onCancel, 
  totalAmount,
  paymentMethod,
  paymentType,
  componentAmounts,
  student,
  paymentData,
  loading = false
}) {
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
      width: '98%',
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
    successIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#dcfce7',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#86efac',
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
      color: colors.text,
    },
    message: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    studentInfo: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    studentName: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    studentClass: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    detailsContainer: {
      gap: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    componentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      paddingLeft: 8,
    },
    componentLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    componentLabel: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    componentAmount: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 2,
      borderTopColor: colors.primary + '30',
    },
    totalLabel: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
      color: colors.text,
    },
    totalAmount: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      color: colors.primary,
    },
    warningText: {
      fontSize: 13,
      color: colors.warning,
      textAlign: 'center',
      marginTop: 12,
      fontFamily: 'Poppins-SemiBold',
    },
    noteText: {
      fontSize: 12,
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
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      opacity: loading ? 0.6 : 1,
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: '#ffffff',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
    paymentMethodBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'center',
      marginBottom: 8,
    },
    paymentMethodText: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
    },
  })

  const getPaymentMethodLabel = (method) => {
    const methods = {
      CASH: 'Cash',
      CARD: 'Card',
      ONLINE_PAYMENT: 'Online Payment',
      BANK_TRANSFER: 'Bank Transfer',
      CHEQUE: 'Cheque',
      OTHER: 'Other'
    }
    return methods[method] || method
  }

  const getPaymentTypeLabel = () => {
    if (paymentData?.term) {
      return `Term ${paymentData.term} Payment`
    } else if (paymentData?.paymentType === 'previousYear') {
      return `Previous Year (${paymentData.previousYearDetails?.academicYear || 'N/A'})`
    } else if (paymentData?.paymentType === 'allPreviousYears') {
      return 'All Previous Years'
    } else if (paymentData?.paymentType === 'currentYear') {
      return 'Current Year'
    } else {
      return 'Full Payment'
    }
  }

  const formatAmount = (amount) => {
    const num = parseInt(amount) || 0
    return num > 0 ? `₹${num.toLocaleString()}` : '-'
  }

  const components = [
    { key: 'schoolFee', label: 'School Fee', icon: 'book', color: colors.primary },
    { key: 'transportFee', label: 'Transport Fee', icon: 'truck', color: colors.info },
    { key: 'hostelFee', label: 'Hostel Fee', icon: 'home', color: colors.warning }
  ]

  const hasAnyPayment = Object.values(componentAmounts).some(amt => parseInt(amt) > 0)

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
            <View style={totalAmount > 0 ? styles.successIcon : styles.warningIcon}>
              {loading ? (
                <ActivityIndicator size="large" color={totalAmount > 0 ? colors.primary : '#dc2626'} />
              ) : (
                <Feather 
                  name={totalAmount > 0 ? "check-circle" : "alert-triangle"} 
                  size={30} 
                  color={totalAmount > 0 ? colors.primary : '#dc2626'} 
                />
              )}
            </View>
          </View>
          
          <ThemedText style={styles.title}>
            {loading ? 'Processing Payment...' : 'Confirm Payment'}
          </ThemedText>
          
          {!loading && (
            <>
              <ThemedText style={styles.message}>
                Please verify the payment details below
              </ThemedText>
              
              <View style={styles.paymentMethodBadge}>
                <Feather name="credit-card" size={14} color={colors.primary} />
                <ThemedText style={styles.paymentMethodText}>
                  {getPaymentMethodLabel(paymentMethod)}
                </ThemedText>
              </View>
            </>
          )}
          
          <View style={styles.studentInfo}>
            <ThemedText style={styles.studentName}>
              {student?.name || 'Student'}
            </ThemedText>
            <ThemedText style={styles.studentClass}>
              {student?.displayClass || student?.class} - {student?.section}
            </ThemedText>
            
            <View style={styles.divider} />
            
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={[styles.message, { marginTop: 12 }]}>
                  Please wait while we process your payment...
                </ThemedText>
              </View>
            ) : (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Payment Type:</ThemedText>
                  <ThemedText style={styles.detailValue}>{getPaymentTypeLabel()}</ThemedText>
                </View>
                
                {hasAnyPayment && (
                  <View style={{ marginTop: 8 }}>
                    <ThemedText style={[styles.detailLabel, { marginBottom: 6 }]}>Payment Breakdown:</ThemedText>
                    {components.map(({ key, label, icon, color }) => {
                      const amount = parseInt(componentAmounts[key] || 0)
                      if (amount <= 0) return null
                      
                      return (
                        <View key={key} style={styles.componentRow}>
                          <View style={styles.componentLabelContainer}>
                            <Feather name={icon} size={12} color={color} />
                            <ThemedText style={styles.componentLabel}>{label}</ThemedText>
                          </View>
                          <ThemedText style={[styles.componentAmount, { color }]}>
                            ₹{amount.toLocaleString()}
                          </ThemedText>
                        </View>
                      )
                    })}
                  </View>
                )}
                
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
                  <ThemedText style={styles.totalAmount}>
                    ₹{totalAmount.toLocaleString()}
                  </ThemedText>
                </View>
                
                {paymentData?.previousYearFee > 0 && (
                  <ThemedText style={styles.warningText}>
                    Includes previous year dues: ₹{paymentData.previousYearFee.toLocaleString()}
                  </ThemedText>
                )}
                
                <ThemedText style={styles.noteText}>
                  This action cannot be undone
                </ThemedText>
              </View>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            {!loading && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={loading}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <ThemedText style={[styles.confirmButtonText, { marginLeft: 8 }]}>
                    Processing...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.confirmButtonText}>
                  Confirm
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}