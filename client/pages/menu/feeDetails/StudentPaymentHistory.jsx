import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import { generateReceiptHTML, generatePrintHTML } from './receiptHtmlTemplates'
import FeeReceipt from './FeeReceipt'

export default function StudentPaymentHistory({ visible, onClose, student, paymentHistory = [] }) {
  const { colors } = useTheme()
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showFeeReceipt, setShowFeeReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)

  // Function to get initials from student name
  const getInitials = (name) => {
    if (!name) return '?'
    const nameParts = name.split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  // Separate effect for fetching receipt data
  useEffect(() => {
    if (showFeeReceipt && selectedPayment && !receiptData && !loadingReceipt) {
      fetchReceiptData()
    }
  }, [showFeeReceipt, selectedPayment])

  const fetchReceiptData = async () => {
    if (!selectedPayment) return
    
    setLoadingReceipt(true)
    try {
      const response = await axiosApi.get(`/fees/receipt/${selectedPayment.id || selectedPayment.paymentId}`)
      if (response.data.success) {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setReceiptData(response.data.data)
          setLoadingReceipt(false)
        }, 500)
      } else {
        setLoadingReceipt(false)
        showToast('Failed to load receipt data', 'error')
        setShowFeeReceipt(false)
      }
    } catch (error) {
      console.error('Error fetching receipt:', error)
      setLoadingReceipt(false)
      showToast('Failed to load receipt', 'error')
      setShowFeeReceipt(false)
    }
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CASH': return 'money-bill-wave'
      case 'CARD': return 'credit-card'
      case 'ONLINE_PAYMENT': return 'mobile-alt'
      case 'BANK_TRANSFER': return 'university'
      case 'CHEQUE': return 'file-invoice'
      default: return 'money-bill-wave'
    }
  }

  const getPaymentMethodColor = (method) => {
    switch(method) {
      case 'CASH': return '#4CAF50'
      case 'CARD': return '#2196F3'
      case 'ONLINE_PAYMENT': return '#9C27B0'
      case 'BANK_TRANSFER': return '#FF9800'
      case 'CHEQUE': return '#F44336'
      default: return colors.primary
    }
  }

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment)
    setReceiptData(null) // Clear previous receipt data
    setLoadingReceipt(false) // Reset loading state
    setShowFeeReceipt(true)
  }

  const generatePDFReceipt = async () => {
    if (!receiptData) return

    try {
      setDownloading(true)

      const htmlContent = generateReceiptHTML(receiptData)

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent })

      await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf', 
        dialogTitle: 'Share or save PDF',
      })

      setDownloading(false)

    } catch (error) {
      console.error('Error generating PDF:', error)
      showToast('Failed to generate PDF: ' + error.message, 'error')
      setDownloading(false)
    }
  }

  const handlePrintReceipt = async () => {
    if (!receiptData) return

    try {
      setPrinting(true)

      const htmlContent = generatePrintHTML(receiptData)

      // Print the receipt
      await Print.printAsync({
        html: htmlContent
      })

      setPrinting(false)

    } catch (error) {
      console.error('Error printing receipt:', error)
      showToast('Failed to print receipt', 'error')
      setPrinting(false)
    }
  }

  const handleCloseFeeReceipt = () => {
    setShowFeeReceipt(false)
    // Don't clear data immediately to allow smooth exit animation
    setTimeout(() => {
      setSelectedPayment(null)
      setReceiptData(null)
      setLoadingReceipt(false)
    }, 300)
  }

  const renderPaymentItem = ({ item }) => {
    const hasTerm = item.termNumber !== null && item.termNumber !== undefined
    
    // Get payment breakdown - check different possible structures
    const breakdown = item.breakdown || {}
    const schoolFeePaid = breakdown.schoolFeePaid || item.schoolFeePaid || 0
    const transportFeePaid = breakdown.transportFeePaid || item.transportFeePaid || 0
    const hostelFeePaid = breakdown.hostelFeePaid || item.hostelFeePaid || 0
    const totalAmount = item.totalAmount || schoolFeePaid + transportFeePaid + hostelFeePaid
    
    // Check if any fees are paid
    const hasAnyFee = schoolFeePaid > 0 || transportFeePaid > 0 || hostelFeePaid > 0
    
    // Get student snapshot if available
    const studentSnapshot = item.studentSnapshot || item.studentDetails || {}
    const hasSnapshot = studentSnapshot.firstName || studentSnapshot.name
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.paymentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleViewReceipt(item)}
      >
        {/* Header with Receipt No and Payment Mode */}
        <View style={styles.paymentHeader}>
          <View style={styles.receiptContainer}>
            <MaterialIcons name="receipt" size={16} color={colors.primary} />
            <ThemedText style={styles.receiptNo} numberOfLines={1}>
              {item.receiptNo || 'N/A'}
            </ThemedText>
          </View>
          <View style={[styles.paymentModeBadge, { backgroundColor: getPaymentMethodColor(item.paymentMode) + '15' }]}>
            <FontAwesome5 
              name={getPaymentMethodIcon(item.paymentMode)} 
              size={10} 
              color={getPaymentMethodColor(item.paymentMode)} 
            />
            <ThemedText style={[styles.paymentModeText, { color: getPaymentMethodColor(item.paymentMode) }]}>
              {item.paymentMode?.replace('_', ' ') || 'CASH'}
            </ThemedText>
          </View>
        </View>

        {/* Term Badge (if exists) */}
        {hasTerm && (
          <View style={styles.termBadgeContainer}>
            <View style={[styles.termBadge, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="looks-one" size={12} color={colors.primary} />
              <ThemedText style={[styles.termBadgeText, { color: colors.primary }]}>
                Term {item.termNumber}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Historical Student Info - Show if snapshot exists */}
        {hasSnapshot && (
          <View style={[styles.historicalInfo, { 
            backgroundColor: colors.warning + '10', 
            borderColor: colors.warning + '30',
            marginBottom: 12,
            padding: 8,
            borderRadius: 8,
            borderWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }]}>
            <MaterialIcons name="history" size={14} color={colors.warning} />
            <ThemedText style={[styles.historicalText, { 
              flex: 1,
              fontSize: 11,
              color: colors.text,
              fontFamily: 'Poppins-Medium',
              fontStyle: 'italic'
            }]}>
              At payment: {studentSnapshot.classLabel || studentSnapshot.class || 'N/A'} - {studentSnapshot.section || 'N/A'}
            </ThemedText>
          </View>
        )}

        {/* Fee Breakdown - Only show if there are fees paid */}
        {hasAnyFee && (
          <View style={[styles.paymentBreakdown, { 
            marginBottom: 16, 
            paddingVertical: 12,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border + '30',
            gap: 8
          }]}>
            {schoolFeePaid > 0 && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelContainer}>
                  <Ionicons name="book-outline" size={12} color={colors.primary} />
                  <ThemedText style={styles.breakdownLabel}>School Fee</ThemedText>
                </View>
                <ThemedText style={[styles.breakdownAmount, { color: colors.primary }]}>
                  ₹{schoolFeePaid.toLocaleString()}
                </ThemedText>
              </View>
            )}
            {transportFeePaid > 0 && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelContainer}>
                  <Ionicons name="bus-outline" size={12} color={colors.info} />
                  <ThemedText style={styles.breakdownLabel}>Transport Fee</ThemedText>
                </View>
                <ThemedText style={[styles.breakdownAmount, { color: colors.info }]}>
                  ₹{transportFeePaid.toLocaleString()}
                </ThemedText>
              </View>
            )}
            {hostelFeePaid > 0 && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelContainer}>
                  <Ionicons name="home-outline" size={12} color={colors.warning} />
                  <ThemedText style={styles.breakdownLabel}>Hostel Fee</ThemedText>
                </View>
                <ThemedText style={[styles.breakdownAmount, { color: colors.warning }]}>
                  ₹{hostelFeePaid.toLocaleString()}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* If no fees breakdown, show a simple message */}
        {!hasAnyFee && (
          <View style={[styles.paymentBreakdown, { 
            marginBottom: 16, 
            paddingVertical: 12,
            alignItems: 'center'
          }]}>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
              Payment details not available
            </ThemedText>
          </View>
        )}

        {/* Footer with Date and Total Amount */}
        <View style={styles.paymentFooter}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={12} color={colors.textSecondary} />
            <ThemedText style={styles.dateText}>
              {item.date ? formatDateOnly(item.date) : 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.totalContainer}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={[styles.totalAmount, { color: colors.success }]}>
              ₹{totalAmount.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        {/* Received By */}
        {item.receivedBy && (
          <View style={[styles.receivedBy, { 
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingTop: 8,
            marginTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border + '30'
          }]}>
            <Feather name="user-check" size={12} color={colors.textSecondary} />
            <ThemedText style={[styles.receivedByText, { 
              fontSize: 11,
              color: colors.textSecondary,
              fontFamily: 'Poppins-Medium'
            }]}>
              Received by: {item.receivedBy}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <MaterialIcons name="history" size={48} color={colors.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Payment History</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        No payments have been recorded for this student yet.
      </ThemedText>
    </View>
  )

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
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
    
    // Student Info Card - Exactly like in StudentFeeDetails
    studentInfoCard: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
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
      overflow: 'hidden',
      backgroundColor: '#1d9bf0',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
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
      gap: 6,
    },
    detailText: {
      fontSize: 10,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    
    // Payment Card
    paymentCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    receiptContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    receiptNo: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      flex: 1,
    },
    paymentModeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 6,
    },
    paymentModeText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    termBadgeContainer: {
      marginBottom: 12,
    },
    termBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 4,
      alignSelf: 'flex-start',
    },
    termBadgeText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    paymentBreakdown: {
      marginBottom: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border + '30',
      gap: 8,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    breakdownLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    breakdownAmount: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    paymentFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    totalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    totalLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    totalAmount: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
    },
    
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  })

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
                  <ThemedText style={styles.title}>Payment History</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {paymentHistory.length} {paymentHistory.length === 1 ? 'record' : 'records'}
                  </ThemedText>
                </View>
                
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Student Info Card - Exactly like in StudentFeeDetails */}
          <View style={styles.studentInfoCard}>
            <View style={styles.studentHeader}>
              <View style={styles.studentAvatar}>
                {student?.profilePicUrl ? (
                  <Image 
                    source={{ uri: student.profilePicUrl }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <ThemedText style={styles.avatarText}>
                    {getInitials(student?.name || student?.firstName || 'Student')}
                  </ThemedText>
                )}
              </View>
              
              <View style={styles.studentInfo}>
                <ThemedText style={styles.studentName} numberOfLines={1}>
                  {student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student'}
                </ThemedText>
                <ThemedText style={styles.studentClass}>
                  {student?.displayClass || student?.class || 'N/A'} - {student?.section || 'N/A'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.studentDetailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={12} color={colors.primary} />
                <ThemedText style={styles.detailText}>
                  {student?.studentType?.replace('_', ' ') || 'Day Scholar'}
                </ThemedText>
              </View>
              
              {student?.village && (
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={12} color={colors.info} />
                  <ThemedText style={styles.detailText}>{student.village}</ThemedText>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={12} color={colors.success} />
                <ThemedText style={styles.detailText}>{student?.parentPhone || 'N/A'}</ThemedText>
              </View>
            </View>
          </View>

          <FlatList
            data={paymentHistory}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id || item.paymentId || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={renderEmptyComponent}
          />
        </View>
      </Modal>

      <FeeReceipt
        visible={showFeeReceipt}
        onClose={handleCloseFeeReceipt}
        receiptData={receiptData}
        loading={loadingReceipt}
        downloading={downloading}
        printing={printing}
        onDownload={generatePDFReceipt}
        onPrint={handlePrintReceipt}
      />

      <ToastNotification 
        visible={toast.visible} 
        type={toast.type} 
        message={toast.message} 
        duration={3000} 
        onHide={hideToast} 
        position="top-center" 
      />
    </>
  )
}