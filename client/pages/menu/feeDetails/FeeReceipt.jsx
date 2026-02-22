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
import { schoolInfo } from './receiptHtmlTemplates'

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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
            style={styles.receiptHeader}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.receiptHeaderRow}>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={styles.receiptBackButton} 
                  onPress={onClose}
                >
                  <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText style={styles.receiptHeaderTitle}>Payment Receipt</ThemedText>
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
          style={styles.receiptHeader}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.receiptHeaderRow}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.receiptBackButton} 
                onPress={onClose}
              >
                <FontAwesome5 name="chevron-left" style={{ marginLeft: -2 }} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.receiptHeaderTitle}>Payment Receipt</ThemedText>
                {receiptData && (
                  <ThemedText style={styles.receiptHeaderSubtitle}>
                    {receiptData.receiptNo}
                  </ThemedText>
                )}
              </View>
              
              {/* Only Download Icon in Header when data is loaded */}
              {receiptData && (
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={styles.receiptDownloadButton}
                  onPress={onDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="download" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
              {!receiptData && <View style={{ width: 44 }} />}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {loading ? (
          <LoadingOverlay />
        ) : receiptData ? (
          <ScrollView 
            style={styles.receiptContent}
            showsVerticalScrollIndicator={true}
          >
            {/* School Info */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.schoolInfo}>
                <ThemedText style={styles.schoolName}>{schoolInfo.name}</ThemedText>
                <ThemedText style={styles.schoolAddress}>{schoolInfo.address}</ThemedText>
                <ThemedText style={styles.schoolContact}>
                  {schoolInfo.phone} | {schoolInfo.email}
                </ThemedText>
              </View>
            </View>

            {/* Receipt Title */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.receiptTitleContainer}>
                <ThemedText style={styles.receiptMainTitle}>FEE PAYMENT RECEIPT</ThemedText>
                <View style={[styles.receiptStatusBadge, { backgroundColor: colors.success + '20' }]}>
                  <ThemedText style={[styles.receiptStatusText, { color: colors.success }]}>
                    {receiptData.feeSummary?.paymentStatus || 'Paid'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Student Details */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.receiptSectionTitle}>Student Details</ThemedText>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Name:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.student?.name}</ThemedText>
              </View>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Class & Section:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.student?.displayClass || receiptData.student?.classLabel} - {receiptData.student?.section}</ThemedText>
              </View>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Parent Name:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.student?.parentName}</ThemedText>
              </View>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Parent Phone:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.student?.parentPhone}</ThemedText>
              </View>
            </View>

            {/* Payment Details */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.receiptSectionTitle}>Payment Details</ThemedText>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Receipt No:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.receiptNo}</ThemedText>
              </View>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Date:</ThemedText>
                <ThemedText style={styles.receiptValue}>
                  {formatDate(receiptData.date)}
                </ThemedText>
              </View>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Payment Mode:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.payment?.mode?.replace('_', ' ')}</ThemedText>
              </View>
              {receiptData.payment?.termNumber && (
                <View style={styles.receiptRow}>
                  <ThemedText style={styles.receiptLabel}>Term:</ThemedText>
                  <ThemedText style={styles.receiptValue}>Term {receiptData.payment.termNumber}</ThemedText>
                </View>
              )}
              
              {/* Show Previous Year Info if this is a previous year payment */}
              {receiptData.payment?.isPreviousYear && (
                <View style={[styles.previousYearBadge, { backgroundColor: colors.warning + '20' }]}>
                  <MaterialIcons name="history" size={14} color={colors.warning} />
                  <ThemedText style={[styles.previousYearBadgeText, { color: colors.warning }]}>
                    Previous Year Payment {receiptData.payment?.previousYearInfo?.academicYear ? `(${receiptData.payment.previousYearInfo.academicYear})` : ''}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Fee Breakdown */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.receiptSectionTitle}>Fee Breakdown</ThemedText>
              
              <View style={styles.breakdownHeader}>
                <ThemedText style={styles.breakdownHeaderComponent}>Component</ThemedText>
                <ThemedText style={styles.breakdownHeaderAmount}>Amount (₹)</ThemedText>
              </View>

              {receiptData.payment?.breakdown?.schoolFee > 0 && (
                <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownComponent}>School Fee</ThemedText>
                  <ThemedText style={styles.breakdownAmountValue}>
                    {receiptData.payment.breakdown.schoolFee.toLocaleString()}
                  </ThemedText>
                </View>
              )}

              {receiptData.payment?.breakdown?.transportFee > 0 && (
                <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownComponent}>Transport Fee</ThemedText>
                  <ThemedText style={styles.breakdownAmountValue}>
                    {receiptData.payment.breakdown.transportFee.toLocaleString()}
                  </ThemedText>
                </View>
              )}

              {receiptData.payment?.breakdown?.hostelFee > 0 && (
                <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownComponent}>Hostel Fee</ThemedText>
                  <ThemedText style={styles.breakdownAmountValue}>
                    {receiptData.payment.breakdown.hostelFee.toLocaleString()}
                  </ThemedText>
                </View>
              )}

              <View style={styles.totalBreakdownRow}>
                <ThemedText style={styles.totalBreakdownLabel}>TOTAL</ThemedText>
                <ThemedText style={[styles.totalBreakdownValue, { color: colors.success }]}>
                  ₹{receiptData.payment?.totalAmount?.toLocaleString()}
                </ThemedText>
              </View>
            </View>

            {/* Transaction Details */}
            {(receiptData.payment?.transactionId || receiptData.payment?.chequeNo || receiptData.payment?.referenceNo) && (
              <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
                <ThemedText style={styles.receiptSectionTitle}>Transaction Details</ThemedText>
                
                {receiptData.payment?.transactionId && (
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Transaction ID:</ThemedText>
                    <ThemedText style={styles.receiptValue}>{receiptData.payment.transactionId}</ThemedText>
                  </View>
                )}
                
                {receiptData.payment?.chequeNo && (
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Cheque No:</ThemedText>
                    <ThemedText style={styles.receiptValue}>{receiptData.payment.chequeNo}</ThemedText>
                  </View>
                )}
                
                {receiptData.payment?.bankName && (
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Bank:</ThemedText>
                    <ThemedText style={styles.receiptValue}>{receiptData.payment.bankName}</ThemedText>
                  </View>
                )}
                
                {receiptData.payment?.referenceNo && (
                  <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Reference No:</ThemedText>
                    <ThemedText style={styles.receiptValue}>{receiptData.payment.referenceNo}</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Description */}
            {receiptData.payment?.description && (
              <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
                <ThemedText style={styles.receiptSectionTitle}>Description</ThemedText>
                <ThemedText style={styles.descriptionText}>{receiptData.payment.description}</ThemedText>
              </View>
            )}

            {/* Received By */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.receiptRow}>
                <ThemedText style={styles.receiptLabel}>Received By:</ThemedText>
                <ThemedText style={styles.receiptValue}>{receiptData.payment?.receivedBy}</ThemedText>
              </View>
            </View>

            {/* Fee Summary - Reorganized in correct order */}
            {receiptData.feeSummary && (
              <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
                <ThemedText style={styles.receiptSectionTitle}>Fee Summary</ThemedText>
                
                {/* 1. Current Year Fee */}
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Current Year Fee:</ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
                    ₹{receiptData.feeSummary.discountedTotalFee?.toLocaleString()}
                  </ThemedText>
                </View>
                
                {/* 2. Previous Year Fee (if applicable) */}
                {receiptData.feeSummary.previousYearFee > 0 && (
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Previous Year Fee:</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: colors.warning }]}>
                      ₹{receiptData.feeSummary.previousYearFee?.toLocaleString()}
                    </ThemedText>
                  </View>
                )}
                
                {/* 3. Grand Total */}
                <View style={[styles.summaryRow, styles.grandTotalRow]}>
                  <ThemedText style={styles.grandTotalLabel}>Grand Total:</ThemedText>
                  <ThemedText style={[styles.grandTotalValue, { color: colors.text }]}>
                    ₹{(receiptData.feeSummary.discountedTotalFee + receiptData.feeSummary.previousYearFee).toLocaleString()}
                  </ThemedText>
                </View>
                
                {/* 4. Total Paid */}
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Total Paid:</ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                    ₹{receiptData.feeSummary.totalPaid?.toLocaleString()}
                  </ThemedText>
                </View>
                
                {/* 5. Total Due */}
                <View style={[styles.summaryRow, styles.totalDueRow]}>
                  <ThemedText style={styles.totalDueLabel}>Total Due:</ThemedText>
                  <ThemedText style={[styles.totalDueValue, { color: receiptData.feeSummary.totalDue > 0 ? colors.danger : colors.success }]}>
                    ₹{receiptData.feeSummary.totalDue?.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Footer Note */}
            <View style={[styles.receiptCard, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.footerNote}>
                This is a computer generated receipt and does not require a physical signature.
              </ThemedText>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : null}

        {/* Print FAB positioned at bottom right - only show when data is loaded */}
        {receiptData && (
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
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  receiptHeader: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  receiptDownloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  receiptHeaderTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: -5,
    fontFamily: 'Poppins-SemiBold',
  },
  receiptHeaderSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  receiptContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  receiptCard: {
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
    marginBottom: 2,
  },
  schoolContact: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'Poppins-Medium',
  },
  receiptTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptMainTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  receiptStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiptStatusText: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1D9BF0',
    marginBottom: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    flex: 0.4,
  },
  receiptValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    flex: 0.6,
    textAlign: 'right',
  },
  previousYearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  previousYearBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1D9BF0',
    marginBottom: 8,
  },
  breakdownHeaderComponent: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#1D9BF0',
  },
  breakdownHeaderAmount: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#1D9BF0',
  },
  breakdownComponent: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  breakdownAmountValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  totalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1D9BF0',
  },
  totalBreakdownLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  totalBreakdownValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  descriptionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  grandTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1D9BF0',
    borderBottomWidth: 1,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  totalDueRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#dc3545',
  },
  totalDueLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  totalDueValue: {
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
})