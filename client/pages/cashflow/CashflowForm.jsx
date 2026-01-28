import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Alert,
  StatusBar,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import DateTimePicker from '@react-native-community/datetimepicker'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const CashflowForm = ({ 
  visible, 
  onClose, 
  onSave,
  type, // 'Income' or 'Expense'
  title,
  subtitle
}) => {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    type: type,
    category: '',
    item: '',
    amount: '',
    quantity: '1',
    person: 'System',
    description: '',
    date: new Date(),
    paymentMethod: 'Cash'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [showNewItemInput, setShowNewItemInput] = useState(false)

  const paymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Credit Card', 'Other']

  useEffect(() => {
    if (visible) {
      fetchCategories()
      // Reset form when modal opens
      setFormData({
        type: type,
        category: '',
        item: '',
        amount: '',
        quantity: '1',
        person: 'System',
        description: '',
        date: new Date(),
        paymentMethod: 'Cash'
      })
      setErrors({})
      setNewCategoryName('')
      setNewItemName('')
      setShowNewCategoryInput(false)
      setShowNewItemInput(false)
    }
  }, [visible, type])

  useEffect(() => {
    if (formData.category) {
      fetchItems(formData.category)
    } else {
      setItems([])
      setFormData(prev => ({ ...prev, item: '' }))
    }
  }, [formData.category])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get(`/cashflow/categories?type=${type}`)
      if (response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      showToast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async (categoryId) => {
    try {
      const response = await axiosApi.get(`/cashflow/items/${categoryId}`)
      if (response.data) {
        setItems(response.data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      setItems([])
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    if (!formData.item) {
      newErrors.item = 'Item is required'
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Enter valid amount'
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        type: type,
        category: formData.category,
        item: formData.item,
        amount: parseFloat(formData.amount),
        quantity: parseInt(formData.quantity) || 1,
        person: formData.person,
        description: formData.description.trim(),
        date: formData.date,
        paymentMethod: formData.paymentMethod
      }

      const response = await axiosApi.post('/cashflow', payload)
      
      if (response.data) {
        showToast(`${type} added successfully!`, 'success')
        onSave(response.data)
        
        // Reset form
        setFormData({
          type: type,
          category: '',
          item: '',
          amount: '',
          quantity: '1',
          person: 'System',
          description: '',
          date: new Date(),
          paymentMethod: 'Cash'
        })
        
        setLoading(false)
        
        // Close modal after a delay to show toast
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error(`Error adding ${type.toLowerCase()}:`, error)
      const errorMessage = error.response?.data?.message || `Failed to add ${type.toLowerCase()}. Please try again.`
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  const handleClose = () => {
    const hasUnsavedChanges = formData.category || formData.item || formData.amount || 
                               formData.description;
    
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              onClose()
            }
          }
        ]
      )
    } else {
      onClose()
    }
  }

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }))
      if (errors.date) {
        setErrors(prev => ({ ...prev, date: '' }))
      }
    }
  }

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter category name', 'error')
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: newCategoryName.trim(),
        type: type
      }

      const response = await axiosApi.post('/cashflow/categories', payload)
      
      if (response.data) {
        showToast('Category created successfully!', 'success')
        setNewCategoryName('')
        setShowNewCategoryInput(false)
        fetchCategories() // Refresh categories
      }
    } catch (error) {
      console.error('Error creating category:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create category. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewItem = async () => {
    if (!newItemName.trim()) {
      showToast('Please enter item name', 'error')
      return
    }

    if (!formData.category) {
      showToast('Please select a category first', 'error')
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: newItemName.trim(),
        category: formData.category
      }

      const response = await axiosApi.post('/cashflow/items', payload)
      
      if (response.data) {
        showToast('Item created successfully!', 'success')
        setNewItemName('')
        setShowNewItemInput(false)
        fetchItems(formData.category) // Refresh items
      }
    } catch (error) {
      console.error('Error creating item:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create item. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderDropdownItem = ({ item, onSelect, isSelected, labelKey = 'name', valueKey = '_id' }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        isSelected && { backgroundColor: colors.primary + '20' }
      ]}
      onPress={() => onSelect(item)}
    >
      <ThemedText 
        style={[
          styles.dropdownItemText,
          isSelected && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
        ]}
      >
        {item[labelKey]}
      </ThemedText>
      {isSelected && (
        <Feather name="check" size={18} color={colors.primary} />
      )}
    </TouchableOpacity>
  )

  const renderCategoryDropdown = () => (
    <Modal
      transparent
      visible={showCategoryDropdown}
      animationType="fade"
      onRequestClose={() => setShowCategoryDropdown(false)}
      statusBarTranslucent
    >
      <View style={styles.dropdownOverlay}>
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.dropdownHeader, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.primary }]}>
              Select Category
            </ThemedText>
            <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dropdownList}>
            {categories.map((item) => (
              <React.Fragment key={item._id}>
                {renderDropdownItem({
                  item,
                  onSelect: (selected) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      category: selected._id,
                      item: '' // Reset item when category changes
                    }))
                    setShowCategoryDropdown(false)
                    if (errors.category) {
                      setErrors(prev => ({ ...prev, category: '' }))
                    }
                  },
                  isSelected: formData.category === item._id
                })}
              </React.Fragment>
            ))}
            
            {showNewCategoryInput ? (
              <View style={styles.createNewSection}>
                <View style={styles.createNewInputRow}>
                  <TextInput
                    style={[styles.createNewInput, { borderColor: colors.border, color: colors.text }]}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Enter new category name"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />
                  <View style={styles.createNewButtons}>
                    <TouchableOpacity 
                      style={[styles.createNewButton, styles.checkButton, { backgroundColor: colors.primary }]}
                      onPress={handleCreateNewCategory}
                      disabled={loading}
                    >
                      <Feather name="check" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.createNewButton, styles.deleteButton, { backgroundColor: colors.danger || '#ef4444' }]}
                      onPress={() => {
                        setNewCategoryName('')
                        setShowNewCategoryInput(false)
                      }}
                      disabled={loading}
                    >
                      <Feather name="x" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.createNewOption, { borderColor: colors.border }]}
                onPress={() => setShowNewCategoryInput(true)}
              >
                <Feather name="plus-circle" size={18} color={colors.primary} />
                <ThemedText style={[styles.createNewText, { color: colors.primary }]}>
                  Create New Category
                </ThemedText>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const renderItemDropdown = () => (
    <Modal
      transparent
      visible={showItemDropdown}
      animationType="fade"
      onRequestClose={() => setShowItemDropdown(false)}
      statusBarTranslucent
    >
      <View style={styles.dropdownOverlay}>
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.dropdownHeader, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.primary }]}>
              Select Item
            </ThemedText>
            <TouchableOpacity onPress={() => setShowItemDropdown(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dropdownList}>
            {items.length > 0 ? (
              items.map((item) => (
                <React.Fragment key={item._id}>
                  {renderDropdownItem({
                    item,
                    onSelect: (selected) => {
                      setFormData(prev => ({ ...prev, item: selected._id }))
                      setShowItemDropdown(false)
                      if (errors.item) {
                        setErrors(prev => ({ ...prev, item: '' }))
                      }
                    },
                    isSelected: formData.item === item._id
                  })}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyDropdown}>
                <Feather name="package" size={32} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No items found for this category
                </ThemedText>
              </View>
            )}
            
            {showNewItemInput ? (
              <View style={styles.createNewSection}>
                <View style={styles.createNewInputRow}>
                  <TextInput
                    style={[styles.createNewInput, { borderColor: colors.border, color: colors.text }]}
                    value={newItemName}
                    onChangeText={setNewItemName}
                    placeholder="Enter new item name"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />
                  <View style={styles.createNewButtons}>
                    <TouchableOpacity 
                      style={[styles.createNewButton, styles.checkButton, { backgroundColor: colors.primary }]}
                      onPress={handleCreateNewItem}
                      disabled={loading}
                    >
                      <Feather name="check" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.createNewButton, styles.deleteButton, { backgroundColor: colors.danger || '#ef4444' }]}
                      onPress={() => {
                        setNewItemName('')
                        setShowNewItemInput(false)
                      }}
                      disabled={loading}
                    >
                      <Feather name="x" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.createNewOption, { borderColor: colors.border }]}
                onPress={() => setShowNewItemInput(true)}
                disabled={!formData.category}
              >
                <Feather name="plus-circle" size={18} color={colors.primary} />
                <ThemedText style={[styles.createNewText, { 
                  color: formData.category ? colors.primary : colors.textSecondary 
                }]}>
                  Create New Item
                </ThemedText>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const renderPaymentDropdown = () => (
    <Modal
      transparent
      visible={showPaymentDropdown}
      animationType="fade"
      onRequestClose={() => setShowPaymentDropdown(false)}
      statusBarTranslucent
    >
      <View style={styles.dropdownOverlay}>
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.dropdownHeader, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={[styles.dropdownTitle, { color: colors.primary }]}>
              Select Payment Method
            </ThemedText>
            <TouchableOpacity onPress={() => setShowPaymentDropdown(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dropdownList}>
            {paymentMethods.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownItem,
                  formData.paymentMethod === item && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, paymentMethod: item }))
                  setShowPaymentDropdown(false)
                }}
              >
                <ThemedText 
                  style={[
                    styles.dropdownItemText,
                    formData.paymentMethod === item && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
                  ]}
                >
                  {item}
                </ThemedText>
                {formData.paymentMethod === item && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 75 : 55,
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
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Poppins-SemiBold',
    },
    requiredStar: {
      color: colors.danger || '#ef4444',
      fontSize: 16,
      marginLeft: 2,
    },
    inputWrapper: {
      position: 'relative',
      marginTop: 5,
    },
    dropdownInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
    },
    focusedInput: {
      borderColor: colors.primary,
    },
    errorInput: {
      borderColor: colors.danger || '#ef4444',
    },
    dropdownIcon: {
      position: 'absolute',
      right: 16,
      top: 14,
    },
    errorText: {
      fontSize: 12,
      color: colors.danger || '#ef4444',
      marginTop: 6,
      fontFamily: 'Poppins-Medium',
    },
    rowContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 15,
    },
    halfContainer: {
      flex: 1,
    },
    buttonContainer: {
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 16,
      gap: 8,
      backgroundColor: colors.inputBackground,
      borderWidth: 1.5,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    saveButton: {
      flex: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 16,
      gap: 8,
      backgroundColor: type === 'Income' ? '#10b981' : '#ef4444',
      ...Platform.select({
        ios: {
          shadowColor: type === 'Income' ? '#10b981' : '#ef4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownContainer: {
      width: SCREEN_WIDTH * 0.85,
      maxHeight: SCREEN_HEIGHT * 0.7,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownTitle: {
      fontSize: 17,
      fontFamily: 'Poppins-SemiBold',
    },
    dropdownList: {
      maxHeight: SCREEN_HEIGHT * 0.5,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
    },
    emptyDropdown: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
    },
    createNewSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
      backgroundColor: colors.inputBackground + '50',
    },
    createNewInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    createNewInput: {
      flex: 1,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
    },
    createNewButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    createNewButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    checkButton: {},
    deleteButton: {},
    createNewOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
      backgroundColor: colors.inputBackground + '50',
    },
    createNewText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
  }), [colors, type])

  const renderContent = () => {
    if (loading && categories.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} color={colors.primary} />
          <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>
            Loading categories...
          </ThemedText>
        </View>
      )
    }

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                Category <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setShowCategoryDropdown(true)}>
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.dropdownInput,
                    errors.category && styles.errorInput,
                    !errors.category && formData.category && styles.focusedInput
                  ]}
                >
                  <ThemedText
                    style={{
                      color: formData.category ? colors.text : colors.textSecondary,
                      fontSize: 15,
                      fontFamily: 'Poppins-Medium',
                    }}
                  >
                    {formData.category ? categories.find(c => c._id === formData.category)?.name || 'Select Category' : 'Select Category'}
                  </ThemedText>
                </View>
                <Feather 
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>
            {errors.category && (
              <ThemedText style={styles.errorText}>{errors.category}</ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                Item <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
            </View>
            <TouchableOpacity 
              onPress={() => setShowItemDropdown(true)}
              disabled={!formData.category}
            >
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.dropdownInput,
                    !formData.category && { backgroundColor: colors.inputBackground + '80' },
                    errors.item && styles.errorInput,
                    !errors.item && formData.item && styles.focusedInput
                  ]}
                >
                  <ThemedText
                    style={{
                      color: formData.item ? colors.text : colors.textSecondary,
                      fontSize: 15,
                      fontFamily: 'Poppins-Medium',
                      opacity: !formData.category ? 0.6 : 1,
                    }}
                  >
                    {formData.item ? items.find(i => i._id === formData.item)?.name || 'Select Item' : 'Select Item'}
                  </ThemedText>
                </View>
                <Feather 
                  name={showItemDropdown ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={!formData.category ? colors.textSecondary + '80' : colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>
            {errors.item && (
              <ThemedText style={styles.errorText}>{errors.item}</ThemedText>
            )}
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfContainer}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.label}>
                  Amount (₹) <ThemedText style={styles.requiredStar}>*</ThemedText>
                </ThemedText>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.dropdownInput,
                    errors.amount && styles.errorInput,
                    !errors.amount && formData.amount.trim() && styles.focusedInput
                  ]}
                  value={formData.amount}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, amount: text }))
                    if (errors.amount) {
                      setErrors(prev => ({ ...prev, amount: '' }))
                    }
                  }}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <FontAwesome5 
                  name="rupee-sign" 
                  size={18} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </View>
              {errors.amount && (
                <ThemedText style={styles.errorText}>{errors.amount}</ThemedText>
              )}
            </View>

            <View style={styles.halfContainer}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.label}>
                  Quantity
                </ThemedText>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.dropdownInput,
                    formData.quantity.trim() && styles.focusedInput
                  ]}
                  value={formData.quantity}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, quantity: text }))
                  }}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <MaterialIcons 
                  name="format-list-numbered" 
                  size={18} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                Date <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.dropdownInput,
                    errors.date && styles.errorInput,
                    !errors.date && formData.date && styles.focusedInput
                  ]}
                >
                  <ThemedText
                    style={{
                      color: colors.text,
                      fontSize: 15,
                      fontFamily: 'Poppins-Medium',
                    }}
                  >
                    {formData.date.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </ThemedText>
                </View>
                <Feather 
                  name="calendar" 
                  size={18} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>
            {errors.date && (
              <ThemedText style={styles.errorText}>{errors.date}</ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                Payment Method
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setShowPaymentDropdown(true)}>
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.dropdownInput,
                    formData.paymentMethod && styles.focusedInput
                  ]}
                >
                  <ThemedText
                    style={{
                      color: colors.text,
                      fontSize: 15,
                      fontFamily: 'Poppins-Medium',
                    }}
                  >
                    {formData.paymentMethod}
                  </ThemedText>
                </View>
                <Feather 
                  name={showPaymentDropdown ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={colors.textSecondary} 
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                Description
              </ThemedText>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.dropdownInput,
                  formData.description.trim() && styles.focusedInput
                ]}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, description: text }))
                }}
                placeholder="Enter description (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                minHeight={80}
              />
              <Feather 
                name="file-text" 
                size={18} 
                color={colors.textSecondary} 
                style={styles.dropdownIcon}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  const renderActionButtons = () => {
    return (
      <View style={styles.buttonContainer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Ionicons name="close" size={20} color={colors.text} />
            <ThemedText style={[styles.buttonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
       
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="check" size={20} color="#FFFFFF" />
            )}
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              {loading ? 'Saving...' : `Add ${type}`}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
     
        <LinearGradient
          colors={type === 'Income' ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleClose}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText type='subtitle' style={styles.title}>{title}</ThemedText>
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>

        {renderActionButtons()}

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
            themeVariant={colors.mode === 'dark' ? 'dark' : 'light'}
          />
        )}

        {renderCategoryDropdown()}
        {renderItemDropdown()}
        {renderPaymentDropdown()}

        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={() => setToast(null)}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </View>
    </Modal>
  )
}

export default CashflowForm