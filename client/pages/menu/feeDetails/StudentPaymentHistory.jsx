import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import { generateReceiptHTML, generatePrintHTML } from './receiptHtmlTemplates'
import FeeReceipt from './FeeReceipt'

export default function StudentPaymentHistory({ visible, onClose, student, paymentHistory = [] }) {
  const { colors } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showFeeReceipt, setShowFeeReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)

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

  const getFilteredPayments = () => {
    if (selectedFilter === 'all') return paymentHistory
    const termNum = parseInt(selectedFilter.replace('term', ''))
    return paymentHistory.filter(p => p.termNumber === termNum)
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    const isPartial = item.termNumber ? false : true
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.paymentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleViewReceipt(item)}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.receiptContainer}>
            <MaterialIcons name="receipt" size={18} color={colors.primary} />
            <ThemedText style={styles.receiptNo}>{item.receiptNo}</ThemedText>
          </View>
          <View style={[styles.termBadge, { backgroundColor: isPartial ? colors.warning + '20' : colors.primary + '20' }]}>
            <ThemedText style={[styles.termBadgeText, { color: isPartial ? colors.warning : colors.primary }]}>
              {item.termNumber ? `Term ${item.termNumber}` : 'Full Payment'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.paymentDateContainer}>
          <Feather name="calendar" size={12} color={colors.textSecondary} />
          <ThemedText style={styles.paymentDate}>{formatDate(item.date)}</ThemedText>
        </View>

        <View style={styles.paymentBreakdown}>
          {item.schoolFeePaid > 0 && (
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.breakdownLabel}>School Fee</ThemedText>
              <ThemedText style={styles.breakdownAmount}>₹{item.schoolFeePaid.toLocaleString()}</ThemedText>
            </View>
          )}
          {item.transportFeePaid > 0 && (
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.breakdownLabel}>Transport Fee</ThemedText>
              <ThemedText style={styles.breakdownAmount}>₹{item.transportFeePaid.toLocaleString()}</ThemedText>
            </View>
          )}
          {item.hostelFeePaid > 0 && (
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.breakdownLabel}>Hostel Fee</ThemedText>
              <ThemedText style={styles.breakdownAmount}>₹{item.hostelFeePaid.toLocaleString()}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.paymentFooter}>
          <View style={styles.paymentMethodContainer}>
            <FontAwesome5 name={getPaymentMethodIcon(item.paymentMode)} size={12} color={colors.textSecondary} />
            <ThemedText style={styles.paymentMethod}>{item.paymentMode.replace('_', ' ')}</ThemedText>
          </View>
          <View style={styles.totalAmountContainer}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={[styles.totalAmount, { color: colors.success }]}>
              ₹{item.totalAmount.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.viewReceiptButton}>
          <Feather name="eye" size={14} color={colors.primary} />
          <ThemedText style={[styles.viewReceiptText, { color: colors.primary }]}>
            View Receipt
          </ThemedText>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={48} color={colors.textSecondary} />
      <ThemedText style={styles.emptyTitle}>No Payment History</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        No payments have been recorded for this student yet.
      </ThemedText>
    </View>
  )

  const renderFilterButtons = () => {
    const filters = [
      { key: 'all', label: 'All' },
      { key: 'term1', label: 'Term 1' },
      { key: 'term2', label: 'Term 2' },
      { key: 'term3', label: 'Term 3' },
    ]

    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: selectedFilter === filter.key ? colors.primary : colors.inputBackground,
                  borderColor: selectedFilter === filter.key ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.8}
            >
              <ThemedText style={[
                styles.filterText,
                { color: selectedFilter === filter.key ? '#FFFFFF' : colors.text }
              ]}>
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
    title: { fontSize: 18, color: '#FFFFFF', marginBottom: -5 },
    subtitle: { marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.9)' },
    
    studentInfo: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    studentAvatar: {
      width: 50,
      height: 50,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    studentClass: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    
    filterContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    filterText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
    },
    
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    paymentCard: {
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      marginBottom: 12,
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
      gap: 6,
    },
    receiptNo: {
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    termBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    termBadgeText: {
      fontSize: 11,
      fontFamily: 'Poppins-SemiBold',
    },
    paymentDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    paymentDate: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    paymentBreakdown: {
      marginBottom: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border + '30',
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    breakdownLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    breakdownAmount: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
    },
    paymentFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    paymentMethodContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    paymentMethod: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    totalAmountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    totalLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    totalAmount: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
    viewReceiptButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    viewReceiptText: {
      fontSize: 13,
      fontFamily: 'Poppins-SemiBold',
    },
    
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginTop: 16,
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
                    {student?.name || 'Student'}
                  </ThemedText>
                </View>
                
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View style={styles.studentInfo}>
            <View style={styles.studentAvatar}>
              <MaterialIcons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.studentDetails}>
              <ThemedText style={styles.studentName}>
                {student?.name || 'Student'}
              </ThemedText>
              <ThemedText style={styles.studentClass}>
                 {student?.displayClass || student?.class} - {student?.section} • {student?.village}
              </ThemedText>
            </View>
          </View>

          {renderFilterButtons()}

          <FlatList
            data={getFilteredPayments()}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id || item.paymentId}
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