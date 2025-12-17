import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Custom Dropdown Component for Filter
const FilterDropdown = ({ isOpen, onClose, onSelect, selectedValue }) => {
  const { colors } = useTheme()
  
  const dropdownStyles = {
    dropdownOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    dropdownBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'flex-start',
      paddingTop: 120,
      paddingHorizontal: 16,
    },
    dropdownContainer: {
      borderRadius: 16,
      borderWidth: 1,
      maxHeight: 300,
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    dropdownHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownTitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemText: {
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
    },
  }
  
  const classes = ['All Classes', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)]
  
  if (!isOpen) return null
  
  return (
    <View style={dropdownStyles.dropdownOverlay}>
      <TouchableOpacity 
        style={dropdownStyles.dropdownBackdrop} 
        onPress={onClose} 
        activeOpacity={1}
      >
        <View style={dropdownStyles.dropdownContainer}>
          <View style={dropdownStyles.dropdownHeader}>
            <ThemedText style={dropdownStyles.dropdownTitle}>Select Class</ThemedText>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {classes.map((cls, index) => (
              <TouchableOpacity
                key={`class-dropdown-${index}`}
                style={[
                  dropdownStyles.dropdownItem,
                  { 
                    backgroundColor: selectedValue === (index === 0 ? 'All' : `${index + 1}`) ? colors.primary + '15' : 'transparent',
                    borderBottomWidth: index === classes.length - 1 ? 0 : 1,
                  }
                ]}
                onPress={() => {
                  onSelect(index === 0 ? 'All' : `${index + 1}`)
                  onClose()
                }}
              >
                <ThemedText style={[
                  dropdownStyles.dropdownItemText,
                  { 
                    color: selectedValue === (index === 0 ? 'All' : `${index + 1}`) ? colors.primary : colors.text,
                    fontFamily: selectedValue === (index === 0 ? 'All' : `${index + 1}`) ? 'Poppins-SemiBold' : 'Poppins-Medium'
                  }
                ]}>
                  {cls}
                </ThemedText>
                {selectedValue === (index === 0 ? 'All' : `${index + 1}`) && (
                  <Feather name="check-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </View>
  )
}

// Payment Modal Component
const PaymentModal = ({ 
  visible, 
  onClose, 
  student, 
  selectedFees, 
  onPaymentComplete 
}) => {
  const { colors } = useTheme()
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [amounts, setAmounts] = useState({})
  const [payAll, setPayAll] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const amountInputsRef = useRef({})
  
  // Initialize amounts based on selected fees
  useEffect(() => {
    if (!student || !selectedFees.length) return
    
    const initialAmounts = {}
    selectedFees.forEach(fee => {
      let feeData = null
      
      if (fee.academicYear === 'current') {
        // Current year fee
        feeData = student[fee.type]
      } else if (fee.academicYear.startsWith('prev-')) {
        // Previous year fee
        const yearIndex = parseInt(fee.academicYear.split('-')[1])
        if (student.previousYearFees && student.previousYearFees[yearIndex]) {
          feeData = student.previousYearFees[yearIndex][fee.type]
        }
      }
      
      if (feeData) {
        const feeKey = `${fee.academicYear}-${fee.type}`
        initialAmounts[feeKey] = feeData.due
      }
    })
    setAmounts(initialAmounts)
  }, [selectedFees, student])
  
  const calculateTotal = () => {
    if (!student) return 0
    
    if (payAll) {
      return student.totalDue
    }
    return Object.values(amounts).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)
  }
  
  const handlePayment = () => {
    if (!student) return
    
    const totalAmount = calculateTotal()
    if (totalAmount <= 0) {
      Alert.alert('Error', 'Please enter valid payment amounts')
      return
    }
    
    Alert.alert(
      'Payment Successful',
      `Payment of ₹${totalAmount.toLocaleString()} processed via ${paymentMode}`,
      [
        { 
          text: 'OK', 
          onPress: () => {
            onPaymentComplete(student.id, selectedFees, amounts, paymentMode, totalAmount)
            onClose()
          }
        }
      ]
    )
  }
  
  if (!visible || !student) return null
  
  const modalStyles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    },
    modalContainer: {
      width: SCREEN_WIDTH * 0.9,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: {
          elevation: 15,
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      color: colors.text,
    },
    scrollContent: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    studentProfile: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: student.profileColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 2,
      borderColor: student.profileColor + '40',
    },
    studentProfileText: {
      fontSize: 18,
      fontFamily: 'Poppins-Bold',
      color: student.profileColor,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    studentMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    feeInfo: {
      flex: 1,
    },
    feeName: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    feeDue: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    amountInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      width: 100,
      textAlign: 'center',
      color: colors.text,
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    payAllContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    payAllText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: colors.text,
    },
    modeContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 10,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    modeButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: 16,
      color: colors.text,
    },
    totalAmount: {
      fontSize: 22,
      fontFamily: 'Poppins-Bold',
      color: colors.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    payButton: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    payButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    noFeesText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginBottom: 20,
    },
    selectedFeesTitle: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
    },
  })
  
  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <ThemedText type='subtitle' style={modalStyles.modalTitle}>Make Payment</ThemedText>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          contentContainerStyle={modalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          onContentSizeChange={(width, height) => {
            setScrollEnabled(height > SCREEN_HEIGHT * .6)
          }}
        >
          {/* Student Info */}
          <View style={modalStyles.studentInfo}>
            <View style={modalStyles.studentProfile}>
              <ThemedText style={modalStyles.studentProfileText}>
                {student.name.charAt(0)}
              </ThemedText>
            </View>
            <View style={modalStyles.studentDetails}>
              <ThemedText style={modalStyles.studentName}>
                {student.name}
              </ThemedText>
              <ThemedText style={modalStyles.studentMeta}>
                Class {student.class} • Sec {student.section} • Roll: {student.rollNo}
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={modalStyles.selectedFeesTitle}>
            Selected Fees ({selectedFees.length})
          </ThemedText>
          
          <View style={modalStyles.payAllContainer}>
            <ThemedText style={modalStyles.payAllText}>Pay All Due Amounts</ThemedText>
            <Switch
              value={payAll}
              onValueChange={setPayAll}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#ffffff'}
              ios_backgroundColor={colors.border}
            />
          </View>
          
          {!payAll ? (
            selectedFees.length > 0 ? (
              selectedFees.map((fee, index) => {
                let feeData = null
                
                if (fee.academicYear === 'current') {
                  // Current year fee
                  feeData = student[fee.type]
                } else if (fee.academicYear.startsWith('prev-')) {
                  // Previous year fee
                  const yearIndex = parseInt(fee.academicYear.split('-')[1])
                  if (student.previousYearFees && student.previousYearFees[yearIndex]) {
                    feeData = student.previousYearFees[yearIndex][fee.type]
                  }
                }
                
                if (!feeData || feeData.due <= 0) return null
                
                const feeKey = `${fee.academicYear}-${fee.type}`
                
                return (
                  <View key={`fee-modal-${student.id}-${feeKey}-${index}`} style={modalStyles.feeRow}>
                    <View style={modalStyles.feeInfo}>
                      <ThemedText style={modalStyles.feeName}>{fee.label}</ThemedText>
                      <ThemedText style={modalStyles.feeDue}>
                        Due: ₹{feeData.due.toLocaleString()} • Total: ₹{feeData.amount.toLocaleString()}
                      </ThemedText>
                    </View>
                    <TextInput
                      ref={ref => amountInputsRef.current[feeKey] = ref}
                      style={modalStyles.amountInput}
                      value={amounts[feeKey]?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text) || 0
                        const clampedAmount = Math.min(Math.max(num, 0), feeData.due)
                        setAmounts(prev => ({
                          ...prev,
                          [feeKey]: clampedAmount
                        }))
                      }}
                      placeholder="Amount"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                      onFocus={() => setScrollEnabled(false)}
                      onBlur={() => setScrollEnabled(true)}
                    />
                  </View>
                )
              })
            ) : (
              <ThemedText style={modalStyles.noFeesText}>No fees selected</ThemedText>
            )
          ) : (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={{ color: colors.textSecondary, marginBottom: 8 }}>
                All due amounts will be paid:
              </ThemedText>
              <ThemedText style={{ color: colors.primary, fontSize: 18, fontFamily: 'Poppins-Bold' }}>
                ₹{student.totalDue.toLocaleString()}
              </ThemedText>
            </View>
          )}
          
          <ThemedText style={[modalStyles.sectionTitle, { marginTop: 16 }]}>Payment Mode:</ThemedText>
          <View style={modalStyles.modeContainer}>
            {['Cash', 'Online', 'Cheque'].map(mode => (
              <TouchableOpacity
                key={`mode-${mode}`}
                style={[
                  modalStyles.modeButton,
                  {
                    backgroundColor: paymentMode === mode ? colors.primary + '20' : colors.inputBackground,
                    borderColor: paymentMode === mode ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setPaymentMode(mode)}
              >
                <ThemedText style={[
                  modalStyles.modeButtonText,
                  { 
                    color: paymentMode === mode ? colors.primary : colors.text,
                    fontFamily: paymentMode === mode ? 'Poppins-SemiBold' : 'Poppins-Medium'
                  }
                ]}>
                  {mode}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={modalStyles.totalContainer}>
            <ThemedText style={modalStyles.totalLabel}>Total Payment:</ThemedText>
            <ThemedText style={modalStyles.totalAmount}>
              ₹{calculateTotal().toLocaleString()}
            </ThemedText>
          </View>
        </ScrollView>
        
        <View style={modalStyles.buttonContainer}>
          <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
            <ThemedText style={modalStyles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[modalStyles.payButton, { opacity: calculateTotal() > 0 ? 1 : 0.5 }]} 
            onPress={handlePayment}
            disabled={calculateTotal() <= 0}
          >
            <ThemedText style={modalStyles.payButtonText}>Confirm Payment</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// Updated static fees data
const staticFeesData = [
  { 
    id: 1, 
    name: 'John Abraham Smith Williams',
    class: '1', 
    section: 'A', 
    rollNo: '1',
    profileColor: '#3b82f6',
    academicYear: '2024-2025',
    term1: { 
      amount: 5000, 
      paid: 2000,
      due: 3000,
      status: 'partial',
      history: [
        { date: '2024-02-15', amount: 1000, mode: 'Cash' },
        { date: '2024-02-20', amount: 1000, mode: 'Online' }
      ]
    }, 
    term2: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    term3: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    transport: { 
      amount: 1000, 
      paid: 500,
      due: 500,
      status: 'partial',
      history: [
        { date: '2024-02-10', amount: 500, mode: 'Cash' }
      ]
    },
    previousYearFees: [
      {
        academicYear: '2023-2024',
        term1: { amount: 4500, paid: 0, due: 4500, status: 'due' },
        term2: { amount: 4500, paid: 2000, due: 2500, status: 'partial' },
        term3: { amount: 4500, paid: 4500, due: 0, status: 'paid' },
        transport: { amount: 900, paid: 900, due: 0, status: 'paid' }
      }
    ],
    alert: 'Previous year fees pending: ₹7000',
    totalDue: 15500
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    class: '1', 
    section: 'A', 
    rollNo: '2',
    profileColor: '#10b981',
    academicYear: '2024-2025',
    term1: { 
      amount: 5000, 
      paid: 5000,
      due: 0,
      status: 'paid',
      history: [
        { date: '2024-01-20', amount: 5000, mode: 'Online' }
      ]
    }, 
    term2: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    term3: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    transport: { 
      amount: 1000, 
      paid: 1000,
      due: 0,
      status: 'paid',
      history: [
        { date: '2024-01-25', amount: 1000, mode: 'Cash' }
      ]
    },
    previousYearFees: [],
    alert: '',
    totalDue: 10000
  },
  { 
    id: 3, 
    name: 'Bob Johnson', 
    class: '2', 
    section: 'B', 
    rollNo: '3',
    profileColor: '#f59e0b',
    academicYear: '2024-2025',
    term1: { 
      amount: 5000, 
      paid: 3000,
      due: 2000,
      status: 'partial',
      history: [
        { date: '2024-02-05', amount: 2000, mode: 'Online' },
        { date: '2024-02-12', amount: 1000, mode: 'Cash' }
      ]
    }, 
    term2: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    term3: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    transport: { 
      amount: 1000, 
      paid: 0,
      due: 1000,
      status: 'due',
      history: []
    },
    previousYearFees: [
      {
        academicYear: '2023-2024',
        term1: { amount: 4500, paid: 4500, due: 0, status: 'paid' },
        term2: { amount: 4500, paid: 3000, due: 1500, status: 'partial' },
        term3: { amount: 4500, paid: 4500, due: 0, status: 'paid' },
        transport: { amount: 900, paid: 900, due: 0, status: 'paid' }
      }
    ],
    alert: 'Previous year fees pending: ₹1500',
    totalDue: 9500
  },
  { 
    id: 4, 
    name: 'Alice Brown', 
    class: '3', 
    section: 'C', 
    rollNo: '1',
    profileColor: '#8b5cf6',
    academicYear: '2024-2025',
    term1: { 
      amount: 5000, 
      paid: 5000,
      due: 0,
      status: 'paid',
      history: [
        { date: '2024-01-18', amount: 5000, mode: 'Online' }
      ]
    }, 
    term2: { 
      amount: 5000, 
      paid: 5000,
      due: 0,
      status: 'paid',
      history: [
        { date: '2024-03-15', amount: 5000, mode: 'Online' }
      ]
    }, 
    term3: { 
      amount: 5000, 
      paid: 0,
      due: 5000,
      status: 'due',
      history: []
    }, 
    transport: { 
      amount: 1000, 
      paid: 1000,
      due: 0,
      status: 'paid',
      history: [
        { date: '2024-03-15', amount: 1000, mode: 'Cash' }
      ]
    },
    previousYearFees: [],
    alert: '',
    totalDue: 5000
  },
]

const statusColors = {
  paid: '#10b981',
  partial: '#f59e0b',
  due: '#ef4444',
}

const statusText = {
  paid: 'Paid',
  partial: 'Partial',
  due: 'Due',
}

export default function CollectFees({ visible, onClose }) {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('All')
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [filteredData, setFilteredData] = useState(staticFeesData)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedFees, setSelectedFees] = useState([])
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [expandedStudents, setExpandedStudents] = useState({})
  const [expandedAcademicYears, setExpandedAcademicYears] = useState({})
  const searchInputRef = useRef(null)

  useEffect(() => {
    filterData(searchQuery, selectedClass)
  }, [])

  const handleSearch = (query) => {
    setSearchQuery(query)
    filterData(query, selectedClass)
  }

  const handleClassFilter = (cls) => {
    setSelectedClass(cls)
    filterData(searchQuery, cls)
    setFilterDropdownOpen(false)
    Keyboard.dismiss()
  }

  const filterData = (query, cls) => {
    let filtered = staticFeesData
    if (cls !== 'All') {
      filtered = filtered.filter(item => item.class === cls)
    }
    if (query) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.rollNo.includes(query)
      )
    }
    setFilteredData(filtered)
  }

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }

  const toggleAcademicYearExpansion = (studentId, academicYear) => {
    const key = `${studentId}-${academicYear}`
    setExpandedAcademicYears(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handlePayFee = (student, feeType, feeLabel, academicYear = 'current', prevYearIndex = null) => {
    setSelectedStudent(student)
    setSelectedFees([{ 
      type: feeType, 
      label: feeLabel, 
      academicYear,
      prevYearIndex 
    }])
    setPaymentModalVisible(true)
  }

  const handlePayAll = (student) => {
    setSelectedStudent(student)
    const fees = []
    
    // Current year fees
    if (student.term1.due > 0) fees.push({ 
      type: 'term1', 
      label: 'Term 1', 
      academicYear: 'current' 
    })
    if (student.term2.due > 0) fees.push({ 
      type: 'term2', 
      label: 'Term 2', 
      academicYear: 'current' 
    })
    if (student.term3.due > 0) fees.push({ 
      type: 'term3', 
      label: 'Term 3', 
      academicYear: 'current' 
    })
    if (student.transport.due > 0) fees.push({ 
      type: 'transport', 
      label: 'Transport', 
      academicYear: 'current' 
    })
    
    // Previous year fees
    student.previousYearFees?.forEach((prevYear, yearIndex) => {
      const yearKey = `prev-${yearIndex}`
      if (prevYear.term1.due > 0) fees.push({ 
        type: 'term1', 
        label: `Term 1 (${prevYear.academicYear})`, 
        academicYear: yearKey,
        prevYearIndex: yearIndex
      })
      if (prevYear.term2.due > 0) fees.push({ 
        type: 'term2', 
        label: `Term 2 (${prevYear.academicYear})`, 
        academicYear: yearKey,
        prevYearIndex: yearIndex
      })
      if (prevYear.term3.due > 0) fees.push({ 
        type: 'term3', 
        label: `Term 3 (${prevYear.academicYear})`, 
        academicYear: yearKey,
        prevYearIndex: yearIndex
      })
      if (prevYear.transport.due > 0) fees.push({ 
        type: 'transport', 
        label: `Transport (${prevYear.academicYear})`, 
        academicYear: yearKey,
        prevYearIndex: yearIndex
      })
    })
    
    setSelectedFees(fees)
    setPaymentModalVisible(true)
  }

  const handlePaymentComplete = (studentId, fees, amounts, paymentMode, totalAmount) => {
    Alert.alert('Success', `Payment of ₹${totalAmount.toLocaleString()} recorded`)
    
    // In real app, update backend here
    filterData(searchQuery, selectedClass)
    setPaymentModalVisible(false)
    setSelectedStudent(null)
    setSelectedFees([])
  }

  const getClassLabel = () => {
    return selectedClass === 'All' ? 'Filter' : `Class ${selectedClass}`
  }

  const getClassIcon = () => {
    if (selectedClass === 'All') return 'filter'
    return 'users'
  }

  const renderPaymentHistory = (history, studentId, feeType) => {
    if (!history || history.length === 0) {
      return (
        <View key={`no-history-${studentId}-${feeType}`} style={styles.noHistoryContainer}>
          <ThemedText style={styles.noHistoryText}>No payment history</ThemedText>
        </View>
      )
    }

    return (
      <View key={`history-container-${studentId}-${feeType}`} style={styles.historyContainer}>
        {history.map((payment, index) => (
          <View key={`history-${studentId}-${feeType}-${index}`} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <MaterialCommunityIcons name="cash-check" size={16} color={colors.primary} />
              <ThemedText style={styles.historyDate}>{payment.date}</ThemedText>
            </View>
            <View style={styles.historyRight}>
              <ThemedText style={styles.historyAmount}>₹{payment.amount.toLocaleString()}</ThemedText>
              <View style={[styles.modeBadge, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText style={[styles.modeText, { color: colors.primary }]}>
                  {payment.mode}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>
    )
  }

  const renderFeeItem = (student, type, label, data, academicYear = 'current', prevYearIndex = null) => {
    const progress = data.paid / data.amount
    const isExpanded = expandedStudents[student.id]
    
    return (
      <View key={`fee-item-${student.id}-${type}-${academicYear}`} style={styles.feeItemCard}>
        <TouchableOpacity 
          style={styles.feeItemHeader}
          onPress={() => toggleStudentExpansion(student.id)}
          activeOpacity={0.7}
        >
          <View style={styles.feeItemTitleRow}>
            <ThemedText style={styles.feeItemTitle}>{label}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[data.status] + '20' }]}>
              <ThemedText style={[styles.statusText, { color: statusColors[data.status] }]}>
                {statusText[data.status]}
              </ThemedText>
            </View>
          </View>
          <Feather 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <ThemedText style={styles.progressLabel}>Paid: ₹{data.paid.toLocaleString()}</ThemedText>
            <ThemedText style={styles.progressLabel}>Due: ₹{data.due.toLocaleString()}</ThemedText>
            <ThemedText style={styles.progressLabel}>Total: ₹{data.amount.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress * 100}%`,
                  backgroundColor: statusColors[data.status]
                }
              ]} 
            />
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <ThemedText style={styles.historyTitle}>Payment History</ThemedText>
            {renderPaymentHistory(data.history, student.id, type)}
          </View>
        )}
        
        {data.due > 0 && (
          <TouchableOpacity 
            onPress={() => handlePayFee(student, type, label, academicYear, prevYearIndex)} 
            style={[styles.payButton, { backgroundColor: colors.primary }]}
          >
            <Feather name="credit-card" size={14} color="#FFFFFF" />
            <ThemedText style={styles.payButtonText}>
              Pay ₹{data.due.toLocaleString()}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderPreviousYearFees = (student, prevYear, yearIndex) => {
    const isExpanded = expandedAcademicYears[`${student.id}-${prevYear.academicYear}`]
    const totalDue = prevYear.term1.due + prevYear.term2.due + prevYear.term3.due + prevYear.transport.due
    
    if (totalDue === 0) return null
    
    return (
      <View key={`prev-year-${student.id}-${yearIndex}`} style={styles.previousYearContainer}>
        <TouchableOpacity 
          style={styles.previousYearHeader}
          onPress={() => toggleAcademicYearExpansion(student.id, prevYear.academicYear)}
          activeOpacity={0.7}
        >
          <View style={styles.previousYearTitleRow}>
            <MaterialIcons name="history" size={20} color="#f59e0b" />
            <ThemedText style={styles.previousYearTitle}>
              Previous Year: {prevYear.academicYear}
            </ThemedText>
          </View>
          <View style={styles.previousYearRight}>
            <ThemedText style={styles.previousYearDue}>
              Due: ₹{totalDue.toLocaleString()}
            </ThemedText>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.textSecondary} 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.previousYearFees}>
            {renderFeeItem(student, 'term1', `Term 1`, prevYear.term1, `prev-${yearIndex}`, yearIndex)}
            {renderFeeItem(student, 'term2', `Term 2`, prevYear.term2, `prev-${yearIndex}`, yearIndex)}
            {renderFeeItem(student, 'term3', `Term 3`, prevYear.term3, `prev-${yearIndex}`, yearIndex)}
            {renderFeeItem(student, 'transport', `Transport`, prevYear.transport, `prev-${yearIndex}`, yearIndex)}
          </View>
        )}
      </View>
    )
  }

  const renderStudent = ({ item, index }) => {
    const isExpanded = expandedStudents[item.id]
    
    return (
      <View style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <View style={[styles.profileIcon, { backgroundColor: item.profileColor + '20', borderColor: item.profileColor + '40' }]}>
              <ThemedText style={[styles.profileText, { color: item.profileColor }]}>
                {item.name.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.studentDetails}>
              <ThemedText 
                style={styles.studentName} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </ThemedText>
              <View style={styles.studentMeta}>
                <ThemedText style={[styles.studentClass, { color: colors.textSecondary }]}>
                  Class {item.class} • Sec {item.section} • Roll: {item.rollNo}
                </ThemedText>
              </View>
              <View style={styles.academicYearContainer}>
                <MaterialIcons name="calendar-today" size={12} color={colors.primary} />
                <ThemedText style={[styles.academicYear, { color: colors.primary }]}>
                  {item.academicYear}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={[styles.totalDueBadge, { backgroundColor: item.totalDue > 0 ? colors.primary + '15' : colors.success + '15' }]}>
            <ThemedText style={[styles.totalDueText, { color: item.totalDue > 0 ? colors.primary : colors.success }]}>
              ₹{item.totalDue.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.totalDueLabel, { color: colors.textSecondary }]}>
              Total Due
            </ThemedText>
          </View>
        </View>
        
        {item.alert ? (
          <View style={styles.alertContainer}>
            <Ionicons name="alert-circle" size={16} color="#f59e0b" />
            <ThemedText style={styles.alertText}>{item.alert}</ThemedText>
          </View>
        ) : null}
        
        <View style={styles.feesGrid}>
          {renderFeeItem(item, 'term1', 'Term 1', item.term1)}
          {renderFeeItem(item, 'term2', 'Term 2', item.term2)}
          {renderFeeItem(item, 'term3', 'Term 3', item.term3)}
          {renderFeeItem(item, 'transport', 'Transport', item.transport)}
        </View>
        
        {/* Previous Year Fees */}
        {item.previousYearFees?.map((prevYear, index) => 
          renderPreviousYearFees(item, prevYear, index)
        )}
        
        {/* Pay All Button at bottom */}
        {item.totalDue > 0 && (
          <TouchableOpacity 
            onPress={() => handlePayAll(item)}
            style={[styles.payAllButtonBottom, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="payment" size={18} color="#FFFFFF" />
            <ThemedText style={styles.payAllButtonText}>
              Pay All Due: ₹{item.totalDue.toLocaleString()}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.searchHeader}>
        <View style={styles.searchTitleContainer}>
          <FontAwesome5 name="search-dollar" size={24} color={colors.primary} />
          <ThemedText style={styles.searchTitle}>Search & Filter</ThemedText>
        </View>
        <ThemedText style={styles.searchSubtitle}>
          Find students by name, roll number or filter by class
        </ThemedText>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { 
          backgroundColor: colors.inputBackground, 
          borderColor: colors.primary + '40' 
        }]}>
          <Feather name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            placeholder="Search here"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <Feather name="x-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={[styles.filterButton, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.primary + '40',
            borderWidth: selectedClass !== 'All' ? 2 : 1,
          }]}
          onPress={() => {
            setFilterDropdownOpen(true)
            Keyboard.dismiss()
          }}
        >
          <Feather name={getClassIcon()} size={18} color={colors.primary} />
          <ThemedText style={[styles.filterButtonText, { 
            color: selectedClass !== 'All' ? colors.primary : colors.text,
            fontFamily: selectedClass !== 'All' ? 'Poppins-SemiBold' : 'Poppins-Medium'
          }]}>
            {getClassLabel()}
          </ThemedText>
          {selectedClass !== 'All' && (
            <View style={[styles.classBadge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.classBadgeText}>{selectedClass}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {searchQuery || selectedClass !== 'All' && (
        <View style={styles.resultsInfo}>
          <View style={styles.resultsInfoRow}>
            <Feather name="users" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.resultsText, { color: colors.textSecondary }]}>
              {filteredData.length} student{filteredData.length !== 1 ? 's' : ''} found
              {searchQuery ? ` for "${searchQuery}"` : ''}
              {selectedClass !== 'All' ? ` in Class ${selectedClass}` : ''}
            </ThemedText>
          </View>
          {(searchQuery || selectedClass !== 'All') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('')
                setSelectedClass('All')
                filterData('', 'All')
              }}
            >
              <Feather name="x" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.clearFiltersText}>Clear filters</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    title: {
      fontSize: 18,
      color: '#FFFFFF',
      marginBottom: -5,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    content: {
      flex: 1,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 8,
    },
    searchHeader: {
      marginBottom: 16,
    },
    searchTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    searchTitle: {
      fontSize: 18,
      color: colors.text,
    },
    searchSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    searchContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
    },
    clearButton: {
      padding: 4,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      gap: 8,
      minWidth: 90,
      justifyContent: 'center',
    },
    filterButtonText: {
      fontSize: 14,
    },
    classBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    classBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Poppins-Bold',
    },
    resultsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    resultsInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    resultsText: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
    },
    clearFiltersButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearFiltersText: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      color: colors.textSecondary,
    },
    studentCard: {
      borderRadius: 18,
      padding: 18,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    studentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profileIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 2,
    },
    profileText: {
      fontSize: 20,
      fontFamily: 'Poppins-Bold',
    },
    studentDetails: {
      flex: 1,
      marginRight: 8,
    },
    studentName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    studentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    studentClass: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
    },
    academicYearContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    academicYear: {
      fontSize: 11,
      fontFamily: 'Poppins-Medium',
    },
    totalDueBadge: {
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      minWidth: 80,
      borderWidth: 1,
      borderColor: colors.border,
    },
    totalDueText: {
      fontSize: 16,
      fontFamily: 'Poppins-Bold',
    },
    totalDueLabel: {
      fontSize: 10,
      fontFamily: 'Poppins-Medium',
      marginTop: 2,
    },
    payAllButtonBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
      marginTop: 16,
    },
    payAllButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
    },
    alertContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fef3c7',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#fbbf24',
    },
    alertText: {
      fontSize: 13,
      color: '#92400e',
      marginLeft: 8,
      flex: 1,
      fontFamily: 'Poppins-Medium',
    },
    feesGrid: {
      gap: 12,
      marginBottom: 16,
    },
    feeItemCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    feeItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    feeItemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    feeItemTitle: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    expandedContent: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    historyTitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    historyContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    historyDate: {
      fontSize: 12,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    historyRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    historyAmount: {
      fontSize: 14,
      color: colors.text,
    },
    modeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    modeText: {
      fontSize: 10,
    },
    noHistoryContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    noHistoryText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    payButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      gap: 8,
    },
    payButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
    },
    previousYearContainer: {
      backgroundColor: '#fff7ed',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#fdba74',
      marginBottom: 12,
      overflow: 'hidden',
    },
    previousYearHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
    },
    previousYearTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    previousYearTitle: {
      fontSize: 14,
      color: '#9a3412',
    },
    previousYearRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    previousYearDue: {
      fontSize: 13,
      fontFamily: 'Poppins-Medium',
      color: '#9a3412',
    },
    previousYearFees: {
      padding: 14,
      paddingTop: 0,
      gap: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      marginTop: 16,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  })

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      onRequestClose={onClose} 
      statusBarTranslucent
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={styles.title}>Collect Fees</ThemedText>
                <ThemedText style={styles.subtitle}>Manage student payments</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <FlatList
          data={filteredData}
          renderItem={renderStudent}
          keyExtractor={(item) => `student-${item.id}`}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchQuery || selectedClass !== 'All' ? (
                <>
                  <Feather name="users" size={60} color={colors.textSecondary} />
                  <ThemedText style={styles.emptyText}>
                    {searchQuery ? `No students found for "${searchQuery}"` : 'No students found'}
                    {selectedClass !== 'All' && ` in Class ${selectedClass}`}
                  </ThemedText>
                </>
              ) : (
                <>
                  <Feather name="search" size={60} color={colors.textSecondary} />
                  <ThemedText style={styles.emptyText}>
                    Enter a name or roll number to search
                  </ThemedText>
                </>
              )}
            </View>
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        />

        <FilterDropdown
          isOpen={filterDropdownOpen}
          onClose={() => setFilterDropdownOpen(false)}
          onSelect={handleClassFilter}
          selectedValue={selectedClass}
        />

        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => {
            setPaymentModalVisible(false)
            setSelectedStudent(null)
            setSelectedFees([])
          }}
          student={selectedStudent}
          selectedFees={selectedFees}
          onPaymentComplete={handlePaymentComplete}
        />
      </View>
    </Modal>
  )
}