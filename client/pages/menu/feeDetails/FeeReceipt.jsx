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
import { FontAwesome5, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { schoolDetails } from '@/schoolDetails.js'

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

  // Get metadata
  const getMetadata = () => {
    return receiptData?.payment?.metadata || {}
  }

  // Get payment type display
  const getPaymentTypeDisplay = () => {
    const metadata = getMetadata()
    
    switch(metadata.paymentType) {
      case 'term':
        return `Term ${metadata.termNumber} Payment`
      case 'currentYear':
        return 'Current Year Payment'
      case 'previousYear':
        return `Previous Year (${metadata.academicYear})`
      case 'allPreviousYears':
        return 'All Previous Years Payment'
      case 'total':
        return 'Total Outstanding Payment'
      default:
        return 'Payment'
    }
  }

  // Get paid amounts in this transaction
  const getPaidAmounts = () => {
    const metadata = getMetadata()
    
    return {
      school: metadata.paid?.school || 0,
      transport: metadata.paid?.transport || 0,
      hostel: metadata.paid?.hostel || 0,
      total: metadata.paid?.total || receiptData?.payment?.totalAmount || 0
    }
  }

  // Get remaining amounts (combined total)
  const getRemainingAmounts = () => {
    const metadata = getMetadata()
    
    return {
      school: metadata.remaining?.school || 0,
      transport: metadata.remaining?.transport || 0,
      hostel: metadata.remaining?.hostel || 0,
      total: metadata.remaining?.total || 0
    }
  }

  // Check if student uses transport
  const hasTransport = () => {
    const paid = getPaidAmounts()
    const remaining = getRemainingAmounts()
    return paid.transport > 0 || remaining.transport > 0
  }

  // Check if student uses hostel
  const hasHostel = () => {
    const paid = getPaidAmounts()
    const remaining = getRemainingAmounts()
    return paid.hostel > 0 || remaining.hostel > 0
  }

  // Check if fully paid
  const isFullyPaid = () => {
    const remaining = getRemainingAmounts()
    return remaining.total === 0
  }

  // Loading overlay
  const LoadingOverlay = () => (
    <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading receipt...</ThemedText>
      </View>
    </View>
  )

  // Empty state
  if (!receiptData && !loading) {
    return (
      <Modal visible={visible} statusBarTranslucent animationType="fade" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>
          
          <View style={styles.emptyStateContainer}>
            <Feather name="file-text" size={64} color={colors.textSecondary} />
            <ThemedText style={styles.emptyStateTitle}>No Receipt Data</ThemedText>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  const metadata = getMetadata()
  const paidAmounts = getPaidAmounts()
  const remainingAmounts = getRemainingAmounts()
  const transportExists = hasTransport()
  const hostelExists = hasHostel()
  const fullyPaid = isFullyPaid()

  return (
    <Modal statusBarTranslucent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
                <ThemedText style={styles.headerSubtitle}>{receiptData?.receiptNo || ''}</ThemedText>
              </View>
              
              <TouchableOpacity style={styles.downloadButton} onPress={onDownload} disabled={downloading}>
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
          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            
            {/* School Info Card - Enhanced Attractive Design */}
            <View style={[styles.card, styles.schoolCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.schoolHeader}>
                <View style={[styles.schoolIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <FontAwesome5 name="school" size={22} color={colors.primary} />
                </View>
                <View style={styles.schoolTitleContainer}>
                  <ThemedText style={styles.schoolName}>{schoolDetails.name}</ThemedText>
                </View>
              </View>
              
              <View style={styles.schoolDivider} />
              
              <View style={styles.schoolContactContainer}>
                <View style={styles.contactItem}>
                  <View style={[styles.contactIconBg, { backgroundColor: colors.primary + '10' }]}>
                    <Feather name="phone" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.contactTextContainer}>
                    <ThemedText style={styles.contactLabel}>Phone</ThemedText>
                    <ThemedText style={styles.contactValue}>{schoolDetails.phone}</ThemedText>
                  </View>
                </View>
                
                <View style={styles.contactItem}>
                  <View style={[styles.contactIconBg, { backgroundColor: colors.primary + '10' }]}>
                    <Feather name="mail" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.contactTextContainer}>
                    <ThemedText style={styles.contactLabel}>Email</ThemedText>
                    <ThemedText style={styles.contactValue}>{schoolDetails.email}</ThemedText>
                  </View>
                </View>
                
                <View style={styles.contactItem}>
                  <View style={[styles.contactIconBg, { backgroundColor: colors.primary + '10' }]}>
                    <Feather name="globe" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.contactTextContainer}>
                    <ThemedText style={styles.contactLabel}>Website</ThemedText>
                    <ThemedText style={styles.contactValue}>{schoolDetails.website}</ThemedText>
                  </View>
                </View>

                <View style={styles.contactItem}>
                  <View style={[styles.contactIconBg, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="location-sharp" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.contactTextContainer}>
                    <ThemedText style={styles.contactLabel}>Address</ThemedText>
                    <ThemedText style={styles.contactValue}>{schoolDetails.address}</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Receipt Info Card - Enhanced */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.receiptHeader}>
                <View style={styles.receiptTitleContainer}>
                  <MaterialIcons name="receipt" size={20} color={colors.primary} />
                  <ThemedText style={styles.receiptTitle}>FEE PAYMENT RECEIPT</ThemedText>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: fullyPaid ? colors.success + '20' : colors.warning + '20',
                  borderColor: fullyPaid ? colors.success : colors.warning
                }]}>
                  <ThemedText style={[styles.statusText, { color: fullyPaid ? colors.success : colors.warning }]}>
                    {fullyPaid ? '✓ FULLY PAID' : '⏳ PARTIAL'}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.receiptDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <ThemedText style={styles.receiptDate}>Date: {formatDate(receiptData.date)}</ThemedText>
              </View>
            </View>

            {/* Student Details Card - Enhanced with Parent Phone */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>STUDENT DETAILS</ThemedText>
              </View>
              
              <View style={styles.studentInfoGrid}>
                <View style={styles.infoCard}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Name</ThemedText>
                    <ThemedText style={styles.infoValue}>{receiptData.student?.name || ''}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Ionicons name="school-outline" size={16} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Class</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {receiptData.student?.displayClass || ''} - {receiptData.student?.section || ''}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Ionicons name="card-outline" size={16} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Parent Name</ThemedText>
                    <ThemedText style={styles.infoValue}>{receiptData.student?.parentName}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Parent Phone</ThemedText>
                    <ThemedText style={styles.infoValue}>{receiptData.student?.parentPhone || 'N/A'}</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment Details Card - Enhanced */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>PAYMENT DETAILS</ThemedText>
              </View>
              
              <View style={styles.paymentDetailsGrid}>
                <View style={styles.paymentDetailItem}>
                  <ThemedText style={styles.paymentDetailLabel}>Mode: </ThemedText>
                  <View style={styles.paymentDetailValueContainer}>
                    <MaterialIcons 
                      name={receiptData.payment?.mode === 'CASH' ? 'payments' : 'account-balance'} 
                      size={14} 
                      color={colors.primary} 
                    />
                    <ThemedText style={styles.paymentDetailValue}>
                      {receiptData.payment?.mode?.replace('_', ' ')}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.paymentDetailItem}>
                  <ThemedText style={styles.paymentDetailLabel}>Type: </ThemedText>
                  <View style={styles.paymentDetailValueContainer}>
                    <MaterialIcons name="payment" size={14} color={colors.primary} />
                    <ThemedText style={styles.paymentDetailValue}>
                      {getPaymentTypeDisplay()}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.paymentDetailItem}>
                  <ThemedText style={styles.paymentDetailLabel}>Received By: </ThemedText>
                  <View style={styles.paymentDetailValueContainer}>
                    <Ionicons name="person-outline" size={14} color={colors.primary} />
                    <ThemedText style={styles.paymentDetailValue}>
                      {receiptData.payment?.receivedBy}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* THIS TRANSACTION - PAID AMOUNTS - Enhanced */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                <ThemedText style={styles.sectionTitle}>THIS TRANSACTION</ThemedText>
              </View>
              
              <View style={styles.totalPaidContainer}>
                <ThemedText style={styles.totalPaidLabel}>Total Paid</ThemedText>
                <ThemedText style={[styles.totalPaidValue, { color: colors.success }]}>
                  {formatCurrency(paidAmounts.total)}
                </ThemedText>
              </View>
              
              <View style={styles.amountTable}>
                {/* School Fee */}
                {paidAmounts.school > 0 && (
                  <View style={styles.tableRow}>
                    <View style={styles.tableLabelContainer}>
                      <View style={[styles.feeIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Feather name="book" size={12} color={colors.primary} />
                      </View>
                      <ThemedText style={styles.tableLabel}>School Fee</ThemedText>
                    </View>
                    <ThemedText style={[styles.tableValue, { color: colors.primary }]}>
                      {formatCurrency(paidAmounts.school)}
                    </ThemedText>
                  </View>
                )}
                
                {/* Transport Fee */}
                {transportExists && paidAmounts.transport > 0 && (
                  <View style={styles.tableRow}>
                    <View style={styles.tableLabelContainer}>
                      <View style={[styles.feeIcon, { backgroundColor: colors.info + '20' }]}>
                        <Feather name="truck" size={12} color={colors.info} />
                      </View>
                      <ThemedText style={styles.tableLabel}>Transport Fee</ThemedText>
                    </View>
                    <ThemedText style={[styles.tableValue, { color: colors.info }]}>
                      {formatCurrency(paidAmounts.transport)}
                    </ThemedText>
                  </View>
                )}
                
                {/* Hostel Fee */}
                {hostelExists && paidAmounts.hostel > 0 && (
                  <View style={styles.tableRow}>
                    <View style={styles.tableLabelContainer}>
                      <View style={[styles.feeIcon, { backgroundColor: colors.warning + '20' }]}>
                        <Feather name="home" size={12} color={colors.warning} />
                      </View>
                      <ThemedText style={styles.tableLabel}>Hostel Fee</ThemedText>
                    </View>
                    <ThemedText style={[styles.tableValue, { color: colors.warning }]}>
                      {formatCurrency(paidAmounts.hostel)}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* REMAINING DUE - COMBINED TOTAL - Enhanced */}
            {remainingAmounts.total > 0 && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                  <ThemedText style={styles.sectionTitle}>REMAINING DUE</ThemedText>
                </View>
                
                <View style={styles.amountTable}>
                  {/* School Fee Remaining */}
                  {remainingAmounts.school > 0 && (
                    <View style={styles.tableRow}>
                      <View style={styles.tableLabelContainer}>
                        <View style={[styles.feeIcon, { backgroundColor: colors.danger + '20' }]}>
                          <Feather name="book" size={12} color={colors.danger} />
                        </View>
                        <ThemedText style={styles.tableLabel}>School Fee</ThemedText>
                      </View>
                      <ThemedText style={[styles.tableValue, { color: colors.danger }]}>
                        {formatCurrency(remainingAmounts.school)}
                      </ThemedText>
                    </View>
                  )}
                  
                  {/* Transport Fee Remaining */}
                  {transportExists && remainingAmounts.transport > 0 && (
                    <View style={styles.tableRow}>
                      <View style={styles.tableLabelContainer}>
                        <View style={[styles.feeIcon, { backgroundColor: colors.danger + '20' }]}>
                          <Feather name="truck" size={12} color={colors.danger} />
                        </View>
                        <ThemedText style={styles.tableLabel}>Transport Fee</ThemedText>
                      </View>
                      <ThemedText style={[styles.tableValue, { color: colors.danger }]}>
                        {formatCurrency(remainingAmounts.transport)}
                      </ThemedText>
                    </View>
                  )}
                  
                  {/* Hostel Fee Remaining */}
                  {hostelExists && remainingAmounts.hostel > 0 && (
                    <View style={styles.tableRow}>
                      <View style={styles.tableLabelContainer}>
                        <View style={[styles.feeIcon, { backgroundColor: colors.danger + '20' }]}>
                          <Feather name="home" size={12} color={colors.danger} />
                        </View>
                        <ThemedText style={styles.tableLabel}>Hostel Fee</ThemedText>
                      </View>
                      <ThemedText style={[styles.tableValue, { color: colors.danger }]}>
                        {formatCurrency(remainingAmounts.hostel)}
                      </ThemedText>
                    </View>
                  )}

                  {/* TOTAL OVERALL DUE */}
                  <View style={[styles.tableRow, styles.totalRow]}>
                    <ThemedText style={styles.totalLabel}>TOTAL REMAINING</ThemedText>
                    <View style={styles.totalValueContainer}>
                      <ThemedText style={[styles.totalValue, { color: colors.danger }]}>
                        {formatCurrency(remainingAmounts.total)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* YEARS FULLY PAID NOTIFICATION */}
            {metadata.yearsFullyPaid?.length > 0 && (
              <View style={[styles.card, styles.successCard, { backgroundColor: colors.success + '10' }]}>
                <View style={styles.fullyPaidContainer}>
                  <View style={[styles.fullyPaidIcon, { backgroundColor: colors.success + '20' }]}>
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  </View>
                  <ThemedText style={[styles.fullyPaidText, { color: colors.success }]}>
                    Fully cleared: {metadata.yearsFullyPaid.join(', ')}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* WAS FULLY PAID */}
            {metadata.wasFullyPaid && (
              <View style={[styles.card, styles.successCard, { backgroundColor: colors.success + '10' }]}>
                <View style={styles.fullyPaidContainer}>
                  <View style={[styles.fullyPaidIcon, { backgroundColor: colors.success + '20' }]}>
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  </View>
                  <ThemedText style={[styles.fullyPaidText, { color: colors.success }]}>
                    {metadata.academicYear} fully paid and cleared
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Footer */}
            <View style={[styles.card, styles.footerCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.footerContent}>
                <MaterialIcons name="computer" size={14} color="#999" />
                <ThemedText style={styles.footerNote}>
                  This is a computer generated receipt
                </ThemedText>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {/* Print Button */}
        {receiptData && !loading && (
          <TouchableOpacity 
            style={[styles.printFab, { backgroundColor: colors.primary }]} 
            onPress={onPrint} 
            disabled={printing}
            activeOpacity={0.8}
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
  container: { flex: 1 },
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
    fontFamily: 'Poppins-SemiBold',
  },
  headerSubtitle: {
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  schoolCard: {
  padding: 0,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: 'rgba(29, 155, 240, 0.1)',
  },
  schoolHeader: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  schoolIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    transform: [{ rotate: '0deg' }],
    borderWidth: 1,
    borderColor: 'rgba(29, 155, 240, 0.2)',
  },
  schoolTitleContainer: {
    flex: 1,
  },
  schoolName: {
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
    color: '#1D9BF0',
    marginBottom: 4,
    lineHeight: 24,
  },
  schoolDivider: {
    height: 1,
    backgroundColor: 'rgba(29, 155, 240, 0.1)',
    marginHorizontal: 16,
  },
  schoolContactContainer: {
    padding: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
    gap: 8,
  },
  contactIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 9,
    color: '#999',
    fontFamily: 'Poppins-Medium',
    marginBottom: -2,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  receiptDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  studentInfoGrid: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  paymentDetailsGrid: {
    gap: 12,
  },
  paymentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  paymentDetailLabel: {
    width: 90,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  paymentDetailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentDetailValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  totalPaidContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(40,167,69,0.05)',
    borderRadius: 12,
  },
  totalPaidLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  totalPaidValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  amountTable: { marginBottom: 8 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  feeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableLabel: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins-Medium',
  },
  tableValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#1D9BF0',
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  totalValueContainer: {
    backgroundColor: 'rgba(220,53,69,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  successCard: {
    borderColor: 'rgba(40,167,69,0.3)',
  },
  fullyPaidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullyPaidIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullyPaidText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  footerCard: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerNote: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins-Medium',
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
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
    marginTop: 16,
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
    height: 80,
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