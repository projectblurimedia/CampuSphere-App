import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const schoolInfo = {
  name: 'ST. MARY\'S SCHOOL',
  address: '123 Education Road, New Delhi - 110001',
  phone: '+91 98765 43210',
  email: 'info@stmarys.edu.in'
}

export default function FeeReceipt({ 
  visible, 
  onClose, 
  receiptData, 
  loading, 
  downloading, 
  printing,
  onDownload,
  onPrint 
}) {
  const { colors } = useTheme()

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0'
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Get current academic year
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

  // Calculate totals
  const calculateTotals = () => {
    if (!receiptData?.feeSummary) return {}
    
    const {
      discountedTotalFee = 0,
      currentYearTotalPaid = 0,
      previousYearFee = 0,
      previousYearPaid = 0
    } = receiptData.feeSummary

    const totalFee = discountedTotalFee + previousYearFee
    const totalPaid = currentYearTotalPaid + previousYearPaid
    const totalDue = totalFee - totalPaid

    return { totalFee, totalPaid, totalDue }
  }

  // Get payment breakdown from receipt data
  const getPaymentBreakdown = () => {
    if (!receiptData?.payment) return { 
      previousYear: { schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0 },
      currentYear: { schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0 }
    }

    const payment = receiptData.payment
    
    const previousYearBreakdown = {
      schoolFee: payment.previousYearBreakdown?.schoolFee || 0,
      transportFee: payment.previousYearBreakdown?.transportFee || 0,
      hostelFee: payment.previousYearBreakdown?.hostelFee || 0
    }
    previousYearBreakdown.total = previousYearBreakdown.schoolFee + previousYearBreakdown.transportFee + previousYearBreakdown.hostelFee
    
    const currentYearBreakdown = {
      schoolFee: payment.currentYearBreakdown?.schoolFee || 0,
      transportFee: payment.currentYearBreakdown?.transportFee || 0,
      hostelFee: payment.currentYearBreakdown?.hostelFee || 0
    }
    currentYearBreakdown.total = currentYearBreakdown.schoolFee + currentYearBreakdown.transportFee + currentYearBreakdown.hostelFee
    
    return {
      previousYear: previousYearBreakdown,
      currentYear: currentYearBreakdown
    }
  }

  const totals = calculateTotals()
  const paymentBreakdown = getPaymentBreakdown()
  const hasPreviousYearPayment = paymentBreakdown.previousYear.total > 0
  const hasCurrentYearPayment = paymentBreakdown.currentYear.total > 0
  const paymentType = receiptData?.payment?.type || ''
  const currentAcademicYear = getCurrentAcademicYear()

  // Check if transport or hostel fees exist
  const hasTransportFee = receiptData?.feeSummary?.discountedTransportFee > 0 || 
                         paymentBreakdown.currentYear.transportFee > 0 || 
                         paymentBreakdown.previousYear.transportFee > 0
  const hasHostelFee = receiptData?.feeSummary?.discountedHostelFee > 0 || 
                      paymentBreakdown.currentYear.hostelFee > 0 || 
                      paymentBreakdown.previousYear.hostelFee > 0

  // Log the breakdown for debugging
  console.log('Receipt Breakdown:', {
    previousYear: paymentBreakdown.previousYear,
    currentYear: paymentBreakdown.currentYear,
    totalPayment: receiptData?.payment?.totalAmount,
    hasTransportFee,
    hasHostelFee
  })

  // Loading overlay component
  const LoadingOverlay = () => (
    <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading receipt details...</ThemedText>
        <ThemedText style={styles.loadingSubtext}>Please wait a moment</ThemedText>
      </View>
    </View>
  )

  // Empty state when no data
  if (!receiptData && !loading) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                >
                  <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
                </View>
                
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>
          
          <View style={styles.emptyStateContainer}>
            <Feather name="file-text" size={64} color={colors.textSecondary} />
            <ThemedText style={styles.emptyStateTitle}>No Receipt Data</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Unable to load receipt information
            </ThemedText>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  // If no receiptData, don't render anything
  if (!receiptData) {
    return null
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              >
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                  {receiptData.receiptNo || ''}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.downloadButton}
                onPress={onDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="download" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {loading ? (
          <LoadingOverlay />
        ) : (
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={true}
          >
            {/* School Info */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.schoolInfo}>
                <ThemedText style={styles.schoolName}>{schoolInfo.name}</ThemedText>
                <ThemedText style={styles.schoolAddress}>{schoolInfo.address}</ThemedText>
                <ThemedText style={styles.schoolContact}>
                  {schoolInfo.phone} | {schoolInfo.email}
                </ThemedText>
              </View>
            </View>

            {/* Receipt Info */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.receiptHeader}>
                <View>
                  <ThemedText style={styles.receiptTitle}>FEE PAYMENT RECEIPT</ThemedText>
                  <ThemedText style={styles.receiptDate}>
                    Date: {formatDate(receiptData.date)}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (totals.totalDue === 0 ? colors.success : colors.warning) + '20' }]}>
                  <ThemedText style={[styles.statusText, { color: totals.totalDue === 0 ? colors.success : colors.warning }]}>
                    {totals.totalDue === 0 ? 'PAID' : 'PARTIAL'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Student Details */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.sectionTitle}>STUDENT DETAILS</ThemedText>
              <View style={styles.studentInfo}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Name:</ThemedText>
                  <ThemedText style={styles.infoValue}>{receiptData.student?.name || ''}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Class & Section:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {receiptData.student?.displayClass || ''} - {receiptData.student?.section || ''}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Admission No:</ThemedText>
                  <ThemedText style={styles.infoValue}>{receiptData.student?.admissionNo || ''}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Parent:</ThemedText>
                  <ThemedText style={styles.infoValue}>{receiptData.student?.parentName || ''}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Contact:</ThemedText>
                  <ThemedText style={styles.infoValue}>{receiptData.student?.parentPhone || ''}</ThemedText>
                </View>
              </View>
            </View>

            {/* Payment Details */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.sectionTitle}>PAYMENT DETAILS</ThemedText>
              <View style={styles.paymentInfo}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Receipt No:</ThemedText>
                  <ThemedText style={styles.infoValue}>{receiptData.receiptNo || ''}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Payment Mode:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {receiptData.payment?.mode ? receiptData.payment.mode.replace('_', ' ') : ''}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Payment Type:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {paymentType === 'total' ? 'Total Outstanding' :
                     paymentType === 'previousYear' ? 'Previous Year Only' :
                     paymentType === 'allPreviousYears' ? 'All Previous Years' :
                     paymentType === 'currentYear' ? 'Current Year' :
                     paymentType === 'term' ? `Term ${receiptData.payment?.termNumber || ''}` :
                     'Payment'}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Received By:</ThemedText>
                  <ThemedText style={styles.infoValue}>{receiptData.payment?.receivedBy || ''}</ThemedText>
                </View>
                {receiptData.payment?.transactionId ? (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Transaction ID:</ThemedText>
                    <ThemedText style={styles.infoValue}>{receiptData.payment.transactionId}</ThemedText>
                  </View>
                ) : null}
                {receiptData.payment?.chequeNo ? (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Cheque No:</ThemedText>
                    <ThemedText style={styles.infoValue}>{receiptData.payment.chequeNo}</ThemedText>
                  </View>
                ) : null}
                {receiptData.payment?.bankName ? (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Bank Name:</ThemedText>
                    <ThemedText style={styles.infoValue}>{receiptData.payment.bankName}</ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ===== THIS TRANSACTION BREAKDOWN ===== */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.sectionTitle}>THIS TRANSACTION BREAKDOWN</ThemedText>
              <ThemedText style={styles.totalPaymentHighlight}>
                Total Paid: {formatCurrency(receiptData.payment?.totalAmount)}
              </ThemedText>
              
              {/* Previous Year Payment Section - Show exact amounts paid to previous years */}
              {hasPreviousYearPayment && (
                <View style={styles.transactionSection}>
                  <View style={[styles.sectionHeader, { borderBottomColor: colors.warning + '40' }]}>
                    <MaterialIcons name="history" size={18} color={colors.warning} />
                    <ThemedText style={[styles.sectionHeaderText, { color: colors.warning }]}>
                      PREVIOUS YEAR PAYMENT
                    </ThemedText>
                  </View>
                  
                  <View style={styles.amountTable}>
                    {paymentBreakdown.previousYear.schoolFee > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableLabelContainer}>
                          <Feather name="book" size={12} color={colors.primary} />
                          <ThemedText style={styles.tableLabel}>School Fee:</ThemedText>
                        </View>
                        <ThemedText style={[styles.tableValue, { color: colors.warning, fontWeight: 'bold' }]}>
                          {formatCurrency(paymentBreakdown.previousYear.schoolFee)}
                        </ThemedText>
                      </View>
                    )}
                    
                    {hasTransportFee && paymentBreakdown.previousYear.transportFee > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableLabelContainer}>
                          <Feather name="truck" size={12} color={colors.info} />
                          <ThemedText style={styles.tableLabel}>Transport Fee:</ThemedText>
                        </View>
                        <ThemedText style={[styles.tableValue, { color: colors.warning, fontWeight: 'bold' }]}>
                          {formatCurrency(paymentBreakdown.previousYear.transportFee)}
                        </ThemedText>
                      </View>
                    )}
                    
                    {hasHostelFee && paymentBreakdown.previousYear.hostelFee > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableLabelContainer}>
                          <Feather name="home" size={12} color={colors.warning} />
                          <ThemedText style={styles.tableLabel}>Hostel Fee:</ThemedText>
                        </View>
                        <ThemedText style={[styles.tableValue, { color: colors.warning, fontWeight: 'bold' }]}>
                          {formatCurrency(paymentBreakdown.previousYear.hostelFee)}
                        </ThemedText>
                      </View>
                    )}
                    
                    <View style={[styles.tableRow, styles.tableTotalRow]}>
                      <ThemedText style={styles.tableTotalLabel}>Previous Year Total:</ThemedText>
                      <ThemedText style={[styles.tableTotalValue, { color: colors.warning }]}>
                        {formatCurrency(paymentBreakdown.previousYear.total)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}

              {/* Current Year Payment Section - Show exact amounts paid to current year */}
              {hasCurrentYearPayment && (
                <View style={[styles.transactionSection, hasPreviousYearPayment && { marginTop: 16 }]}>
                  <View style={[styles.sectionHeader, { borderBottomColor: colors.primary + '40' }]}>
                    <Feather name="calendar" size={18} color={colors.primary} />
                    <ThemedText style={[styles.sectionHeaderText, { color: colors.primary }]}>
                      CURRENT YEAR PAYMENT
                    </ThemedText>
                  </View>
                  
                  <View style={styles.amountTable}>
                    {paymentBreakdown.currentYear.schoolFee > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableLabelContainer}>
                          <Feather name="book" size={12} color={colors.primary} />
                          <ThemedText style={styles.tableLabel}>School Fee:</ThemedText>
                        </View>
                        <ThemedText style={[styles.tableValue, { color: colors.primary, fontWeight: 'bold' }]}>
                          {formatCurrency(paymentBreakdown.currentYear.schoolFee)}
                        </ThemedText>
                      </View>
                    )}
                    
                    {hasTransportFee && paymentBreakdown.currentYear.transportFee > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableLabelContainer}>
                          <Feather name="truck" size={12} color={colors.info} />
                          <ThemedText style={styles.tableLabel}>Transport Fee:</ThemedText>
                        </View>
                        <ThemedText style={[styles.tableValue, { color: colors.primary, fontWeight: 'bold' }]}>
                          {formatCurrency(paymentBreakdown.currentYear.transportFee)}
                        </ThemedText>
                      </View>
                    )}
                    
                    {hasHostelFee && paymentBreakdown.currentYear.hostelFee > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableLabelContainer}>
                          <Feather name="home" size={12} color={colors.warning} />
                          <ThemedText style={styles.tableLabel}>Hostel Fee:</ThemedText>
                        </View>
                        <ThemedText style={[styles.tableValue, { color: colors.primary, fontWeight: 'bold' }]}>
                          {formatCurrency(paymentBreakdown.currentYear.hostelFee)}
                        </ThemedText>
                      </View>
                    )}
                    
                    <View style={[styles.tableRow, styles.tableTotalRow]}>
                      <ThemedText style={styles.tableTotalLabel}>Current Year Total:</ThemedText>
                      <ThemedText style={[styles.tableTotalValue, { color: colors.primary }]}>
                        {formatCurrency(paymentBreakdown.currentYear.total)}
                      </ThemedText>
                    </View>
                    
                    {/* Show term number if applicable */}
                    {receiptData.payment?.termNumber && (
                      <View style={styles.termInfoRow}>
                        <ThemedText style={styles.termInfoText}>
                          Applied to Term {receiptData.payment.termNumber}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Grand Total of this transaction */}
              <View style={styles.transactionTotal}>
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>TOTAL PAID IN THIS TRANSACTION</ThemedText>
                  <ThemedText style={[styles.totalValue, { color: colors.success }]}>
                    {formatCurrency(receiptData.payment?.totalAmount)}
                  </ThemedText>
                </View>
                <View style={styles.breakdownSummary}>
                  <ThemedText style={styles.breakdownSummaryText}>
                    {hasPreviousYearPayment && `Previous Years: ${formatCurrency(paymentBreakdown.previousYear.total)}`}
                    {hasPreviousYearPayment && hasCurrentYearPayment && ' + '}
                    {hasCurrentYearPayment && `Current Year: ${formatCurrency(paymentBreakdown.currentYear.total)}`}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Fee Summary - Previous Year */}
            {receiptData.feeSummary?.previousYearDetails?.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <ThemedText style={styles.sectionTitle}>PREVIOUS YEARS SUMMARY</ThemedText>
                
                {receiptData.feeSummary.previousYearDetails.map((year, index) => (
                  <View key={index} style={styles.yearSummary}>
                    <View style={styles.yearHeader}>
                      <MaterialIcons name="history" size={14} color={colors.warning} />
                      <ThemedText style={styles.yearTitle}>{year.academicYear || ''}</ThemedText>
                    </View>
                    
                    <View style={styles.yearDetails}>
                      <View style={styles.yearRow}>
                        <ThemedText style={styles.yearLabel}>Total Fee:</ThemedText>
                        <ThemedText style={styles.yearValue}>{formatCurrency(year.originalTotalFee)}</ThemedText>
                      </View>
                      <View style={styles.yearRow}>
                        <ThemedText style={styles.yearLabel}>Total Paid:</ThemedText>
                        <ThemedText style={[styles.yearValue, { color: colors.success }]}>
                          {formatCurrency(year.totalPaid)}
                        </ThemedText>
                      </View>
                      {year.totalDue > 0 ? (
                        <View style={styles.yearRow}>
                          <ThemedText style={styles.yearLabel}>Remaining Due:</ThemedText>
                          <ThemedText style={[styles.yearValue, { color: colors.danger }]}>
                            {formatCurrency(year.totalDue)}
                          </ThemedText>
                        </View>
                      ) : (
                        <View style={styles.yearRow}>
                          <ThemedText style={styles.yearLabel}>Status:</ThemedText>
                          <ThemedText style={[styles.yearValue, { color: colors.success }]}>
                            Fully Paid
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                <View style={styles.totalSection}>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Previous Years Fee:</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: colors.warning }]}>
                      {formatCurrency(receiptData.feeSummary?.previousYearFee)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Paid:</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                      {formatCurrency(receiptData.feeSummary?.previousYearPaid)}
                    </ThemedText>
                  </View>
                  {receiptData.feeSummary?.previousYearDue > 0 && (
                    <View style={[styles.summaryRow, styles.dueSummaryRow]}>
                      <ThemedText style={styles.dueSummaryLabel}>Total Remaining Due:</ThemedText>
                      <ThemedText style={[styles.dueSummaryValue, { color: colors.danger }]}>
                        {formatCurrency(receiptData.feeSummary?.previousYearDue)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Fee Summary - Current Year */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.sectionTitle}>CURRENT YEAR SUMMARY</ThemedText>
              
              <View style={styles.currentYearDetails}>
                <View style={styles.amountTable}>
                  <View style={[styles.tableRow, styles.tableTotalRow]}>
                    <ThemedText style={styles.tableTotalLabel}>Total Current Year Fee:</ThemedText>
                    <ThemedText style={[styles.tableTotalValue, { color: colors.primary }]}>
                      {formatCurrency(receiptData.feeSummary?.discountedTotalFee)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.paymentSummary}>
                  <View style={styles.summaryRow}>
                    <View style={styles.tableLabelContainer}>
                      <Feather name="book" size={12} color={colors.primary} />
                      <ThemedText style={styles.summaryLabel}>School Fee Paid:</ThemedText>
                    </View>
                    <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
                      {formatCurrency(receiptData.feeSummary?.currentYearPaidSchool)}
                    </ThemedText>
                  </View>
                  
                  {hasTransportFee && receiptData.feeSummary?.currentYearPaidTransport > 0 && (
                    <View style={styles.summaryRow}>
                      <View style={styles.tableLabelContainer}>
                        <Feather name="truck" size={12} color={colors.info} />
                        <ThemedText style={styles.summaryLabel}>Transport Fee Paid:</ThemedText>
                      </View>
                      <ThemedText style={[styles.summaryValue, { color: colors.info }]}>
                        {formatCurrency(receiptData.feeSummary?.currentYearPaidTransport)}
                      </ThemedText>
                    </View>
                  )}
                  
                  {hasHostelFee && receiptData.feeSummary?.currentYearPaidHostel > 0 && (
                    <View style={styles.summaryRow}>
                      <View style={styles.tableLabelContainer}>
                        <Feather name="home" size={12} color={colors.warning} />
                        <ThemedText style={styles.summaryLabel}>Hostel Fee Paid:</ThemedText>
                      </View>
                      <ThemedText style={[styles.summaryValue, { color: colors.warning }]}>
                        {formatCurrency(receiptData.feeSummary?.currentYearPaidHostel)}
                      </ThemedText>
                    </View>
                  )}

                  <View style={[styles.summaryRow, styles.totalSection]}>
                    <ThemedText style={styles.summaryLabel}>Total Paid to Date:</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                      {formatCurrency(receiptData.feeSummary?.currentYearTotalPaid)}
                    </ThemedText>
                  </View>

                  {receiptData.feeSummary?.currentYearDue > 0 ? (
                    <View style={[styles.summaryRow, styles.dueSummaryRow]}>
                      <ThemedText style={styles.dueSummaryLabel}>Remaining Due:</ThemedText>
                      <ThemedText style={[styles.dueSummaryValue, { color: colors.danger }]}>
                        {formatCurrency(receiptData.feeSummary?.currentYearDue)}
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.summaryRow]}>
                      <ThemedText style={styles.summaryLabel}>Status:</ThemedText>
                      <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                        Fully Paid
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Overall Summary */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.sectionTitle}>OVERALL SUMMARY</ThemedText>
              
              <View style={styles.overallSummary}>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Total Fee (All Years):</ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency(totals.totalFee)}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Total Paid (All Years):</ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                    {formatCurrency(totals.totalPaid)}
                  </ThemedText>
                </View>
                
                {totals.totalDue > 0 ? (
                  <View style={[styles.summaryRow, styles.dueRow]}>
                    <ThemedText style={styles.dueLabel}>TOTAL REMAINING DUE:</ThemedText>
                    <ThemedText style={[styles.dueValue, { color: colors.danger }]}>
                      {formatCurrency(totals.totalDue)}
                    </ThemedText>
                  </View>
                ) : (
                  <View style={[styles.summaryRow, styles.paidRow]}>
                    <ThemedText style={styles.paidLabel}>STATUS:</ThemedText>
                    <ThemedText style={[styles.paidValue, { color: colors.success }]}>
                      FULLY PAID
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Footer Note */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.footerNote}>
                This is a computer generated receipt and does not require a physical signature.
              </ThemedText>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {/* Print FAB */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.printFab, { backgroundColor: colors.primary }]}
          onPress={onPrint}
          disabled={printing}
        >
          {printing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="printer" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
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
  downloadButton: {
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
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: -5,
    fontFamily: 'Poppins-SemiBold',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Poppins-Medium',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  schoolInfo: {
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1D9BF0',
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: 4,
  },
  schoolContact: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#1D9BF0',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  studentInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    flex: 0.4,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    flex: 0.6,
    textAlign: 'right',
  },
  paymentInfo: {
    gap: 8,
  },
  transactionSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  amountTable: {
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  tableLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  tableValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  tableTotalRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tableTotalLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  tableTotalValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
  transactionTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1D9BF0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  breakdownSummary: {
    marginTop: 4,
    alignItems: 'center',
  },
  breakdownSummaryText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    fontStyle: 'italic',
  },
  totalPaymentHighlight: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1D9BF0',
    textAlign: 'center',
    marginBottom: 16,
  },
  yearSummary: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  yearTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  yearDetails: {
    gap: 4,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  yearLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  yearValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  currentYearDetails: {
    gap: 12,
  },
  paymentSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  overallSummary: {
    gap: 8,
  },
  dueRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#dc3545',
  },
  dueLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  dueValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  paidRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#28a745',
  },
  paidLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  paidValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  footerNote: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#999',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  bottomSpacer: {
    height: 20,
    marginBottom: 150,
  },
  printFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dueSummaryRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(220, 53, 69, 0.3)',
  },
  dueSummaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  dueSummaryValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
  },
  termInfoRow: {
    marginTop: 8,
    paddingTop: 4,
    alignItems: 'center',
  },
  termInfoText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    fontStyle: 'italic',
  },
})