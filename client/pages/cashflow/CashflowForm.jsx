import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  StatusBar,
  Alert
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { LinearGradient } from 'expo-linear-gradient'
import axiosApi from '@/utils/axiosApi'
import { ToastNotification } from '@/components/ui/ToastNotification'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useSelector } from 'react-redux'
import ConfirmationModal from './ConfirmationModal'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const CashflowForm = ({ 
  visible, 
  onClose, 
  onSave,
  type, // 'Income' or 'Expense'
  title,
  subtitle,
  transaction = null,
  isEditing = false
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
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [itemLoading, setItemLoading] = useState(false)
  const [createCategoryLoading, setCreateCategoryLoading] = useState(false)
  const [createItemLoading, setCreateItemLoading] = useState(false)
  const [updateCategoryLoading, setUpdateCategoryLoading] = useState(false)
  const [updateItemLoading, setUpdateItemLoading] = useState(false)
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false)
  const [deleteItemLoading, setDeleteItemLoading] = useState(false)
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
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  
  // Edit/Delete modals
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showCategoryActionModal, setShowCategoryActionModal] = useState(false)
  const [showItemActionModal, setShowItemActionModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editItemName, setEditItemName] = useState('')
  const [showDeleteCategoryConfirmation, setShowDeleteCategoryConfirmation] = useState(false)
  const [showDeleteItemConfirmation, setShowDeleteItemConfirmation] = useState(false)

  const employee = useSelector(state => state.employee.employee)
  const teacherName = employee ? `${employee.firstName} ${employee.lastName}` : 'Accountant'

  // Get current user from Redux/context
  const getCurrentUser = useCallback(() => {
    return teacherName || 'Unknown Employee'
  }, [teacherName])

  const paymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Credit Card', 'Other']

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCategories(filtered)
    }
  }, [searchQuery, categories])

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items)
    } else {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredItems(filtered)
    }
  }, [searchQuery, items])

  // Load transaction data when editing
  useEffect(() => {
    if (visible && isEditing && transaction) {
      loadTransactionForEditing()
    }
  }, [visible, isEditing, transaction])

  // Reset form when modal opens (for new entries)
  useEffect(() => {
    if (visible && !isEditing) {
      resetForm()
      fetchCategories()
    }
  }, [visible, type])

  // Fetch items when category changes
  useEffect(() => {
    if (formData.category) {
      fetchItems(formData.category)
    } else {
      setItems([])
      setFilteredItems([])
      setFormData(prev => ({ ...prev, item: '' }))
    }
  }, [formData.category])

  const loadTransactionForEditing = async () => {
    try {
      // First fetch categories
      await fetchCategories()
      
      // Set form data from transaction
      const transactionDate = transaction.date ? new Date(transaction.date) : new Date()
      
      setFormData({
        type: transaction.type,
        category: transaction.category?.id || transaction.category?._id || '',
        item: transaction.item?.id || transaction.item?._id || '',
        amount: transaction.amount?.toString() || '',
        quantity: transaction.quantity?.toString() || '1',
        person: transaction.person || 'System',
        description: transaction.description || '',
        date: transactionDate,
        paymentMethod: transaction.paymentMethod || 'Cash'
      })

      // Fetch items for the selected category
      if (transaction.category?.id || transaction.category?._id) {
        await fetchItems(transaction.category.id || transaction.category._id)
      }
    } catch (error) {
      console.error('Error loading transaction for editing:', error)
      showToast('Failed to load transaction data', 'error')
    }
  }

  const resetForm = () => {
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
    setSearchQuery('')
  }

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true)
      const response = await axiosApi.get(`/cashflow/categories?type=${type}`)
      
      // Handle different response structures
      let categoriesData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          categoriesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data
        } else if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories
        }
      }
      
      // Ensure each category has _id field
      categoriesData = categoriesData.map(cat => ({
        _id: cat._id || cat.id,
        id: cat.id || cat._id,
        name: cat.name,
        type: cat.type,
        ...cat
      }))
      
      setCategories(categoriesData)
      setFilteredCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching categories:', error)
      showToast('Failed to load categories', 'error')
      setCategories([])
      setFilteredCategories([])
    } finally {
      setCategoryLoading(false)
    }
  }

  const fetchItems = async (categoryId) => {
    try {
      setItemLoading(true)
      const response = await axiosApi.get(`/cashflow/items/${categoryId}`)
      
      // Handle different response structures
      let itemsData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          itemsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          itemsData = response.data.data
        } else if (response.data.items && Array.isArray(response.data.items)) {
          itemsData = response.data.items
        }
      }
      
      // Ensure each item has _id field
      itemsData = itemsData.map(item => ({
        _id: item._id || item.id,
        id: item.id || item._id,
        name: item.name,
        categoryId: item.categoryId || item.category,
        ...item
      }))
      
      setItems(itemsData)
      setFilteredItems(itemsData)
    } catch (error) {
      console.error('Error fetching items:', error)
      setItems([])
      setFilteredItems([])
      showToast('Failed to load items', 'error')
    } finally {
      setItemLoading(false)
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
        categoryId: formData.category,  
        itemId: formData.item,          
        amount: parseFloat(formData.amount),
        quantity: parseInt(formData.quantity) || 1,
        person: getCurrentUser(),
        description: formData.description.trim(),
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        updatedBy: getCurrentUser() 
      }

      let response
      if (isEditing && transaction) {
        // Update existing transaction
        response = await axiosApi.put(`/cashflow/${transaction.id || transaction._id}`, payload)
      } else {
        // Create new transaction
        response = await axiosApi.post('/cashflow', payload)
      }
      
      if (response.data) {
        showToast(`${isEditing ? 'Updated' : 'Added'} successfully!`, 'success')
        onSave(response.data)
        
        // Reset form
        resetForm()
        
        setLoading(false)
        
        // Close modal after a delay to show toast
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} ${type.toLowerCase()}:`, error)
      
      // Check for duplicate error
      if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('already exists')) {
        showToast('This transaction already exists', 'error')
      } else {
        const errorMessage = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} ${type.toLowerCase()}. Please try again.`
        showToast(errorMessage, 'error')
      }
      setLoading(false)
    }
  }

  const handleClose = () => {
    const hasUnsavedChanges = formData.category || formData.item || formData.amount || 
                               formData.description;
    
    if (hasUnsavedChanges) {
      // Show custom confirmation modal instead of Alert
      setShowDiscardConfirmation(true)
    } else {
      resetForm()
      onClose()
    }
  }

  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false)

  const confirmDiscard = () => {
    setShowDiscardConfirmation(false)
    resetForm()
    onClose()
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

  // Category CRUD Operations
  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter category name', 'error')
      return
    }

    try {
      setCreateCategoryLoading(true)
      const payload = {
        name: newCategoryName.trim(),
        type: type
      }

      const response = await axiosApi.post('/cashflow/categories', payload)
      if (response.data) {
        showToast('Category created successfully!', 'success')
        
        // Refresh categories
        await fetchCategories()
        
        // Get the newly created category ID
        const newCategory = response.data.data || response.data
        const categoryId = newCategory._id || newCategory.id
        
        // Set the form data with the new category (automatically selected)
        setFormData(prev => ({ 
          ...prev, 
          category: categoryId,
          item: '' // Reset item when category changes
        }))
        
        // Close the input and dropdown
        setNewCategoryName('')
        setShowNewCategoryInput(false)
        setSearchQuery('')
        
        // Close the dropdown
        setShowCategoryDropdown(false)
      }
    } catch (error) {
      console.error('Error creating category:', error)
      
      // Check for duplicate error
      if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('already exists')) {
        showToast('A category with this name already exists', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create category. Please try again.'
        showToast(errorMessage, 'error')
      }
    } finally {
      setCreateCategoryLoading(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim()) {
      showToast('Please enter category name', 'error')
      return
    }

    if (!selectedCategory) return

    try {
      setUpdateCategoryLoading(true)
      const payload = {
        name: editCategoryName.trim(),
        type: type
      }

      const response = await axiosApi.put(`/cashflow/categories/${selectedCategory._id || selectedCategory.id}`, payload)
      
      showToast('Category updated successfully!', 'success')
      
      // Refresh categories
      await fetchCategories()
      
      // If the edited category is currently selected, update the form
      if (formData.category === (selectedCategory._id || selectedCategory.id)) {
        const updatedCategory = response.data.data || response.data
        setFormData(prev => ({ 
          ...prev, 
          category: updatedCategory._id || updatedCategory.id
        }))
      }
      
      // Close modals
      setShowEditCategoryModal(false)
      setShowCategoryActionModal(false)
      setSelectedCategory(null)
      setEditCategoryName('')
      
    } catch (error) {
      console.error('Error updating category:', error)
      
      // Check for duplicate error
      if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('already exists')) {
        showToast('A category with this name already exists', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to update category. Please try again.'
        showToast(errorMessage, 'error')
      }
    } finally {
      setUpdateCategoryLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      setDeleteCategoryLoading(true)
      
      await axiosApi.delete(`/cashflow/categories/${selectedCategory._id || selectedCategory.id}`)
      
      showToast('Category deleted successfully!', 'success')
      
      // Refresh categories
      await fetchCategories()
      
      // If the deleted category was selected, clear it
      if (formData.category === (selectedCategory._id || selectedCategory.id)) {
        setFormData(prev => ({ 
          ...prev, 
          category: '',
          item: ''
        }))
      }
      
      // Close modals
      setShowDeleteCategoryConfirmation(false)
      setShowCategoryActionModal(false)
      setSelectedCategory(null)
      
    } catch (error) {
      console.error('Error deleting category:', error)
      
      // Check if category has items or transactions
      if (error.response?.status === 400) {
        showToast('Cannot delete category with existing items or transactions', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete category. Please try again.'
        showToast(errorMessage, 'error')
      }
    } finally {
      setDeleteCategoryLoading(false)
    }
  }

  // Item CRUD Operations
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
      setCreateItemLoading(true)
      
      const payload = {
        name: newItemName.trim(),
        categoryId: formData.category 
      }

      const response = await axiosApi.post('/cashflow/items', payload)
      
      if (response.data) {
        showToast('Item created successfully!', 'success')
        
        // Refresh items for the current category
        await fetchItems(formData.category)
        
        // Get the newly created item ID
        const newItem = response.data.data || response.data
        const itemId = newItem._id || newItem.id
        
        // Set the form data with the new item (automatically selected)
        setFormData(prev => ({ 
          ...prev, 
          item: itemId 
        }))
        
        // Close the input and dropdown
        setNewItemName('')
        setShowNewItemInput(false)
        setSearchQuery('')
        
        // Close the dropdown
        setShowItemDropdown(false)
      }
    } catch (error) {
      console.error('Error creating item:', error)
      
      // Check for duplicate error
      if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('already exists')) {
        showToast('An item with this name already exists in this category', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create item. Please try again.'
        showToast(errorMessage, 'error')
      }
    } finally {
      setCreateItemLoading(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editItemName.trim()) {
      showToast('Please enter item name', 'error')
      return
    }

    if (!selectedItem) return

    try {
      setUpdateItemLoading(true)
      const payload = {
        name: editItemName.trim(),
        categoryId: selectedItem.categoryId
      }

      const response = await axiosApi.put(`/cashflow/items/${selectedItem._id || selectedItem.id}`, payload)
      
      showToast('Item updated successfully!', 'success')
      
      // Refresh items for the current category
      await fetchItems(selectedItem.categoryId)
      
      // If the edited item is currently selected, update the form
      if (formData.item === (selectedItem._id || selectedItem.id)) {
        const updatedItem = response.data.data || response.data
        setFormData(prev => ({ 
          ...prev, 
          item: updatedItem._id || updatedItem.id
        }))
      }
      
      // Close modals
      setShowEditItemModal(false)
      setShowItemActionModal(false)
      setSelectedItem(null)
      setEditItemName('')
      
    } catch (error) {
      console.error('Error updating item:', error)
      
      // Check for duplicate error
      if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('already exists')) {
        showToast('An item with this name already exists in this category', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to update item. Please try again.'
        showToast(errorMessage, 'error')
      }
    } finally {
      setUpdateItemLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return

    try {
      setDeleteItemLoading(true)
      
      await axiosApi.delete(`/cashflow/items/${selectedItem._id || selectedItem.id}`)
      
      showToast('Item deleted successfully!', 'success')
      
      // Refresh items for the current category
      await fetchItems(selectedItem.categoryId)
      
      // If the deleted item was selected, clear it
      if (formData.item === (selectedItem._id || selectedItem.id)) {
        setFormData(prev => ({ 
          ...prev, 
          item: ''
        }))
      }
      
      // Close modals
      setShowDeleteItemConfirmation(false)
      setShowItemActionModal(false)
      setSelectedItem(null)
      
    } catch (error) {
      console.error('Error deleting item:', error)
      
      // Check if item has transactions
      if (error.response?.status === 400) {
        showToast('Cannot delete item with existing transactions', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete item. Please try again.'
        showToast(errorMessage, 'error')
      }
    } finally {
      setDeleteItemLoading(false)
    }
  }

  // Long press handlers
  const handleCategoryLongPress = (category) => {
    setSelectedCategory(category)
    setShowCategoryActionModal(true)
  }

  const handleItemLongPress = (item) => {
    setSelectedItem(item)
    setShowItemActionModal(true)
  }

  const renderDropdownItem = ({ item, onSelect, isSelected, labelKey = 'name' }) => (
    <TouchableOpacity
      key={item._id || item.id}
      style={[
        styles.dropdownItem,
        isSelected && { backgroundColor: colors.primary + '15' }
      ]}
      onPress={() => onSelect(item)}
      onLongPress={() => {
        if (item._id) { // Only allow edit/delete for actual items (not "All Items")
          if (item.categoryId !== undefined) {
            // It's an item
            handleItemLongPress(item)
          } else {
            // It's a category
            handleCategoryLongPress(item)
          }
        }
      }}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.dropdownItemContent}>
        <View style={[styles.dropdownItemIcon, { backgroundColor: isSelected ? colors.primary + '20' : colors.primary + '10' }]}>
          <Feather 
            name={type === 'Income' ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={isSelected ? colors.primary : colors.textSecondary} 
          />
        </View>
        <ThemedText 
          style={[
            styles.dropdownItemText,
            isSelected && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
          ]}
        >
          {item[labelKey]}
        </ThemedText>
      </View>
      {isSelected && (
        <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  )

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
      <Feather name="search" size={18} color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery !== '' && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Feather name="x" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  )

  const renderCategoryActionModal = () => (
    <Modal
      transparent
      visible={showCategoryActionModal}
      animationType="fade"
      onRequestClose={() => {
        setShowCategoryActionModal(false)
        setSelectedCategory(null)
      }}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.actionModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowCategoryActionModal(false)
          setSelectedCategory(null)
        }}
      >
        <View style={[styles.actionModalContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.actionModalHeader}>
            <View style={[styles.actionModalIcon, { backgroundColor: colors.primary + '10' }]}>
              <Feather name="folder" size={24} color={colors.primary} />
            </View>
            <ThemedText style={[styles.actionModalTitle, { color: colors.text }]}>
              {selectedCategory?.name}
            </ThemedText>
            <ThemedText style={[styles.actionModalSubtitle, { color: colors.textSecondary }]}>
              Category Options
            </ThemedText>
          </View>

          <View style={styles.actionModalButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
              onPress={() => {
                setEditCategoryName(selectedCategory?.name || '')
                setShowEditCategoryModal(true)
                setShowCategoryActionModal(false)
              }}
            >
              <View style={[styles.actionButtonIcon, { backgroundColor: colors.primary }]}>
                <Feather name="edit-2" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.actionButtonTextContainer}>
                <ThemedText style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Edit Category
                </ThemedText>
                <ThemedText style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Rename this category
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ef444410' }]}
              onPress={() => {
                setShowDeleteCategoryConfirmation(true)
                setShowCategoryActionModal(false)
              }}
            >
              <View style={[styles.actionButtonIcon, { backgroundColor: '#ef4444' }]}>
                <Feather name="trash-2" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.actionButtonTextContainer}>
                <ThemedText style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Delete Category
                </ThemedText>
                <ThemedText style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Remove this category
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionCancelButton, { borderTopColor: colors.border }]}
            onPress={() => {
              setShowCategoryActionModal(false)
              setSelectedCategory(null)
            }}
          >
            <ThemedText style={[styles.actionCancelText, { color: colors.textSecondary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderItemActionModal = () => (
    <Modal
      transparent
      visible={showItemActionModal}
      animationType="fade"
      onRequestClose={() => {
        setShowItemActionModal(false)
        setSelectedItem(null)
      }}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.actionModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowItemActionModal(false)
          setSelectedItem(null)
        }}
      >
        <View style={[styles.actionModalContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.actionModalHeader}>
            <View style={[styles.actionModalIcon, { backgroundColor: colors.primary + '10' }]}>
              <Feather name="package" size={24} color={colors.primary} />
            </View>
            <ThemedText style={[styles.actionModalTitle, { color: colors.text }]}>
              {selectedItem?.name}
            </ThemedText>
            <ThemedText style={[styles.actionModalSubtitle, { color: colors.textSecondary }]}>
              Item Options
            </ThemedText>
          </View>

          <View style={styles.actionModalButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
              onPress={() => {
                setEditItemName(selectedItem?.name || '')
                setShowEditItemModal(true)
                setShowItemActionModal(false)
              }}
            >
              <View style={[styles.actionButtonIcon, { backgroundColor: colors.primary }]}>
                <Feather name="edit-2" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.actionButtonTextContainer}>
                <ThemedText style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Edit Item
                </ThemedText>
                <ThemedText style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Rename this item
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ef444410' }]}
              onPress={() => {
                setShowDeleteItemConfirmation(true)
                setShowItemActionModal(false)
              }}
            >
              <View style={[styles.actionButtonIcon, { backgroundColor: '#ef4444' }]}>
                <Feather name="trash-2" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.actionButtonTextContainer}>
                <ThemedText style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Delete Item
                </ThemedText>
                <ThemedText style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Remove this item permanently
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionCancelButton, { borderTopColor: colors.border }]}
            onPress={() => {
              setShowItemActionModal(false)
              setSelectedItem(null)
            }}
          >
            <ThemedText style={[styles.actionCancelText, { color: colors.textSecondary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderEditCategoryModal = () => (
    <Modal
      transparent
      visible={showEditCategoryModal}
      animationType="fade"
      onRequestClose={() => {
        setShowEditCategoryModal(false)
        setSelectedCategory(null)
        setEditCategoryName('')
      }}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.editModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowEditCategoryModal(false)
          setSelectedCategory(null)
          setEditCategoryName('')
        }}
      >
        <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.editModalHeader}>
            <View style={[styles.editModalIcon, { backgroundColor: colors.primary + '10' }]}>
              <Feather name="edit-2" size={24} color={colors.primary} />
            </View>
            <ThemedText style={[styles.editModalTitle, { color: colors.text }]}>
              Edit Category
            </ThemedText>
          </View>

          <View style={[styles.editModalInputContainer, { backgroundColor: colors.inputBackground }]}>
            <Feather name="folder" size={18} color={colors.primary} />
            <TextInput
              style={[styles.editModalInput, { color: colors.text }]}
              value={editCategoryName}
              onChangeText={setEditCategoryName}
              placeholder="Enter category name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              editable={!updateCategoryLoading}
            />
          </View>

          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={[styles.editModalButton, styles.editModalCancelButton, { borderColor: colors.border }]}
              onPress={() => {
                setShowEditCategoryModal(false)
                setSelectedCategory(null)
                setEditCategoryName('')
              }}
              disabled={updateCategoryLoading}
            >
              <ThemedText style={[styles.editModalButtonText, { color: colors.textSecondary }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.editModalButton, styles.editModalSaveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateCategory}
              disabled={updateCategoryLoading || !editCategoryName.trim()}
            >
              {updateCategoryLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.editModalButtonText, { color: '#FFFFFF' }]}>
                  Save Changes
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderEditItemModal = () => (
    <Modal
      transparent
      visible={showEditItemModal}
      animationType="fade"
      onRequestClose={() => {
        setShowEditItemModal(false)
        setSelectedItem(null)
        setEditItemName('')
      }}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.editModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowEditItemModal(false)
          setSelectedItem(null)
          setEditItemName('')
        }}
      >
        <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.editModalHeader}>
            <View style={[styles.editModalIcon, { backgroundColor: colors.primary + '10' }]}>
              <Feather name="package" size={24} color={colors.primary} />
            </View>
            <ThemedText style={[styles.editModalTitle, { color: colors.text }]}>
              Edit Item
            </ThemedText>
          </View>

          <View style={[styles.editModalInputContainer, { backgroundColor: colors.inputBackground }]}>
            <Feather name="package" size={18} color={colors.primary} />
            <TextInput
              style={[styles.editModalInput, { color: colors.text }]}
              value={editItemName}
              onChangeText={setEditItemName}
              placeholder="Enter item name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              editable={!updateItemLoading}
            />
          </View>

          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={[styles.editModalButton, styles.editModalCancelButton, { borderColor: colors.border }]}
              onPress={() => {
                setShowEditItemModal(false)
                setSelectedItem(null)
                setEditItemName('')
              }}
              disabled={updateItemLoading}
            >
              <ThemedText style={[styles.editModalButtonText, { color: colors.textSecondary }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.editModalButton, styles.editModalSaveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateItem}
              disabled={updateItemLoading || !editItemName.trim()}
            >
              {updateItemLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.editModalButtonText, { color: '#FFFFFF' }]}>
                  Save Changes
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderCategoryDropdown = () => (
    <Modal
      transparent
      visible={showCategoryDropdown}
      animationType="fade"
      onRequestClose={() => {
        setShowCategoryDropdown(false)
        setSearchQuery('')
        setNewCategoryName('')
        setShowNewCategoryInput(false)
      }}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowCategoryDropdown(false)
          setSearchQuery('')
          setNewCategoryName('')
          setShowNewCategoryInput(false)
        }}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.dropdownHeaderLeft}>
              <Feather name="folder" size={20} color={colors.primary} />
              <ThemedText style={[styles.dropdownTitle, { color: colors.text }]}>
                Select Category
              </ThemedText>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setShowCategoryDropdown(false)
                setSearchQuery('')
                setNewCategoryName('')
                setShowNewCategoryInput(false)
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Only show search and categories list when not creating new */}
          {!showNewCategoryInput && (
            <>
              {renderSearchBar()}
              
              <ScrollView 
                style={styles.dropdownList}
                showsVerticalScrollIndicator={false}
              >
                {/* Categories List */}
                {categoryLoading ? (
                  <View style={styles.loadingDropdown}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Loading categories...
                    </ThemedText>
                  </View>
                ) : filteredCategories && filteredCategories.length > 0 ? (
                  filteredCategories.map((item) => (
                    <React.Fragment key={item._id || item.id}>
                      {renderDropdownItem({
                        item,
                        onSelect: (selected) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            category: selected._id || selected.id,
                            item: '' // Reset item when category changes
                          }))
                          setShowCategoryDropdown(false)
                          setSearchQuery('')
                          if (errors.category) {
                            setErrors(prev => ({ ...prev, category: '' }))
                          }
                        },
                        isSelected: formData.category === (item._id || item.id)
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  <View style={styles.emptyDropdown}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
                      <Feather name="folder" size={32} color={colors.primary} />
                    </View>
                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                      No categories found
                    </ThemedText>
                    <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                      {searchQuery ? 'Try a different search term' : 'Create a new category to get started'}
                    </ThemedText>
                  </View>
                )}
                
                {/* Create New Category Option */}
                <View style={styles.createNewSection}>
                  <TouchableOpacity
                    style={[styles.createNewOption, { borderTopColor: colors.border }]}
                    onPress={() => setShowNewCategoryInput(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.createNewIcon, { backgroundColor: colors.primary + '10' }]}>
                      <Feather name="plus" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.createNewTextContainer}>
                      <ThemedText style={[styles.createNewTitle, { color: colors.text }]}>
                        Create New Category
                      </ThemedText>
                      <ThemedText style={[styles.createNewSubtitle, { color: colors.textSecondary }]}>
                        Add a custom category for {type.toLowerCase()}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}

          {/* Show only create new input when creating */}
          {showNewCategoryInput && (
            <View style={styles.createOnlyContainer}>
              <View style={[styles.createNewInputContainer, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.createNewInputRow}>
                  <Feather name="folder-plus" size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.createNewInput, { color: colors.text }]}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Enter category name"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                    editable={!createCategoryLoading}
                  />
                </View>
                <View style={styles.createNewActions}>
                  <TouchableOpacity 
                    style={[styles.createNewActionButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreateNewCategory}
                    disabled={createCategoryLoading}
                  >
                    {createCategoryLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#FFFFFF" />
                        <ThemedText style={styles.createNewActionText}>Create</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.createNewActionButton, { backgroundColor: colors.danger || '#ef4444' }]}
                    onPress={() => {
                      setNewCategoryName('')
                      setShowNewCategoryInput(false)
                    }}
                    disabled={createCategoryLoading}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.createNewActionText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  )

  const renderItemDropdown = () => (
    <Modal
      transparent
      visible={showItemDropdown}
      animationType="fade"
      onRequestClose={() => {
        setShowItemDropdown(false)
        setSearchQuery('')
        setNewItemName('')
        setShowNewItemInput(false)
      }}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowItemDropdown(false)
          setSearchQuery('')
          setNewItemName('')
          setShowNewItemInput(false)
        }}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.dropdownHeaderLeft}>
              <Feather name="package" size={20} color={colors.primary} />
              <ThemedText style={[styles.dropdownTitle, { color: colors.text }]}>
                Select Item
              </ThemedText>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setShowItemDropdown(false)
                setSearchQuery('')
                setNewItemName('')
                setShowNewItemInput(false)
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Only show search and items list when not creating new */}
          {!showNewItemInput && (
            <>
              {renderSearchBar()}
              
              <ScrollView 
                style={styles.dropdownList}
                showsVerticalScrollIndicator={false}
              >
                {/* Items List */}
                {itemLoading ? (
                  <View style={styles.loadingDropdown}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Loading items...
                    </ThemedText>
                  </View>
                ) : filteredItems && filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <React.Fragment key={item._id || item.id}>
                      {renderDropdownItem({
                        item,
                        onSelect: (selected) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            item: selected._id || selected.id 
                          }))
                          setShowItemDropdown(false)
                          setSearchQuery('')
                          if (errors.item) {
                            setErrors(prev => ({ ...prev, item: '' }))
                          }
                        },
                        isSelected: formData.item === (item._id || item.id)
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  <View style={styles.emptyDropdown}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
                      <Feather name="package" size={32} color={colors.primary} />
                    </View>
                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                      {formData.category ? 'No items found' : 'Select a category first'}
                    </ThemedText>
                    <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                      {formData.category 
                        ? (searchQuery ? 'Try a different search term' : 'Create a new item for this category')
                        : 'Please select a category to view items'}
                    </ThemedText>
                  </View>
                )}
                
                {/* Create New Item Option - Only show if category is selected */}
                {formData.category && (
                  <View style={styles.createNewSection}>
                    <TouchableOpacity
                      style={[styles.createNewOption, { borderTopColor: colors.border }]}
                      onPress={() => setShowNewItemInput(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.createNewIcon, { backgroundColor: colors.primary + '10' }]}>
                        <Feather name="plus" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.createNewTextContainer}>
                        <ThemedText style={[styles.createNewTitle, { color: colors.text }]}>
                          Create New Item
                        </ThemedText>
                        <ThemedText style={[styles.createNewSubtitle, { color: colors.textSecondary }]}>
                          Add a custom item for this category
                        </ThemedText>
                      </View>
                      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </>
          )}

          {/* Show only create new input when creating */}
          {showNewItemInput && (
            <View style={styles.createOnlyContainer}>
              <View style={[styles.createNewInputContainer, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.createNewInputRow}>
                  <Feather name="package" size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.createNewInput, { color: colors.text }]}
                    value={newItemName}
                    onChangeText={setNewItemName}
                    placeholder="Enter item name"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                    editable={!createItemLoading}
                  />
                </View>
                <View style={styles.createNewActions}>
                  <TouchableOpacity 
                    style={[styles.createNewActionButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreateNewItem}
                    disabled={createItemLoading}
                  >
                    {createItemLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#FFFFFF" />
                        <ThemedText style={styles.createNewActionText}>Create</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.createNewActionButton, { backgroundColor: colors.danger || '#ef4444' }]}
                    onPress={() => {
                      setNewItemName('')
                      setShowNewItemInput(false)
                    }}
                    disabled={createItemLoading}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.createNewActionText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
      <TouchableOpacity 
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowPaymentDropdown(false)}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.dropdownHeaderLeft}>
              <Feather name="credit-card" size={20} color={colors.primary} />
              <ThemedText style={[styles.dropdownTitle, { color: colors.text }]}>
                Select Payment Method
              </ThemedText>
            </View>
            <TouchableOpacity 
              onPress={() => setShowPaymentDropdown(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.dropdownList}>
            {paymentMethods.map((item, index) => (
              <TouchableOpacity
                key={`payment-${item}-${index}`}
                style={[
                  styles.dropdownItem,
                  formData.paymentMethod === item && { backgroundColor: colors.primary + '15' }
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, paymentMethod: item }))
                  setShowPaymentDropdown(false)
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownItemContent}>
                  <View style={[styles.dropdownItemIcon, { backgroundColor: formData.paymentMethod === item ? colors.primary + '20' : colors.primary + '10' }]}>
                    <Feather 
                      name={item === 'Cash' ? 'dollar-sign' : 'credit-card'} 
                      size={16} 
                      color={formData.paymentMethod === item ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <ThemedText 
                    style={[
                      styles.dropdownItemText,
                      formData.paymentMethod === item && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
                    ]}
                  >
                    {item}
                  </ThemedText>
                </View>
                {formData.paymentMethod === item && (
                  <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
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
      paddingBottom: 200,
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
      width: SCREEN_WIDTH * 0.9,
      maxHeight: SCREEN_HEIGHT * 0.8,
      borderRadius: 24,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
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
    },
    dropdownHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dropdownTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      padding: 0,
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
      borderBottomColor: colors.border + '20',
    },
    dropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    dropdownItemIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
      fontFamily: 'Poppins-Medium',
      flex: 1,
    },
    checkIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDropdown: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      fontFamily: 'Poppins-Medium',
    },
    loadingDropdown: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 14,
      marginTop: 12,
      fontFamily: 'Poppins-Medium',
    },
    createNewSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    createNewOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 8,
    },
    createNewIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createNewTextContainer: {
      flex: 1,
    },
    createNewTitle: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 4,
    },
    createNewSubtitle: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
    },
    createOnlyContainer: {
      padding: 20,
    },
    createNewInputContainer: {
      borderRadius: 16,
      padding: 16,
      gap: 16,
    },
    createNewInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    createNewInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      padding: 0,
    },
    createNewActions: {
      flexDirection: 'row',
      gap: 12,
    },
    createNewActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    createNewActionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Poppins-SemiBold',
    },
    // Action Modal Styles
    actionModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    actionModalContainer: {
      width: SCREEN_WIDTH * 0.85,
      borderRadius: 24,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    actionModalHeader: {
      alignItems: 'center',
      padding: 24,
    },
    actionModalIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    actionModalTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 4,
      textAlign: 'center',
    },
    actionModalSubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
    },
    actionModalButtons: {
      paddingHorizontal: 20,
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      gap: 16,
    },
    actionButtonIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonTextContainer: {
      flex: 1,
    },
    actionButtonTitle: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
      marginBottom: 2,
    },
    actionButtonSubtitle: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
    },
    actionCancelButton: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      marginTop: 8,
    },
    actionCancelText: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
    },
    // Edit Modal Styles
    editModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    editModalContainer: {
      width: SCREEN_WIDTH * 0.85,
      borderRadius: 24,
      overflow: 'hidden',
      padding: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    editModalHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    editModalIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    editModalTitle: {
      fontSize: 18,
      fontFamily: 'Poppins-SemiBold',
    },
    editModalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 20,
    },
    editModalInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Poppins-Medium',
      padding: 0,
    },
    editModalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    editModalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editModalCancelButton: {
      borderWidth: 1,
    },
    editModalSaveButton: {
      backgroundColor: colors.primary,
    },
    editModalButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins-SemiBold',
    },
  }), [colors, type])

  const renderContent = () => {
    if (categoryLoading && categories.length === 0) {
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
                    {formData.category ? 
                      categories.find(c => (c._id || c.id) === formData.category)?.name || 'Select Category' 
                      : 'Select Category'}
                  </ThemedText>
                </View>
                <Feather 
                  name="chevron-down" 
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
                    {formData.item ? 
                      items.find(i => (i._id || i.id) === formData.item)?.name || 'Select Item' 
                      : 'Select Item'}
                  </ThemedText>
                </View>
                <Feather 
                  name="chevron-down" 
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
                  name="chevron-down" 
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
                  formData.description.trim() && styles.focusedInput,
                  { minHeight: 80, textAlignVertical: 'top' }
                ]}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, description: text }))
                }}
                placeholder="Enter description (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              <Feather 
                name="file-text" 
                size={18} 
                color={colors.textSecondary} 
                style={[styles.dropdownIcon, { top: 20 }]}
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
              {loading ? 'Saving...' : isEditing ? 'Update' : `Add ${type}`}
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
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
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
        
        {/* Action Modals */}
        {renderCategoryActionModal()}
        {renderItemActionModal()}
        {renderEditCategoryModal()}
        {renderEditItemModal()}

        {/* Delete Confirmations */}
        <ConfirmationModal
          visible={showDeleteCategoryConfirmation}
          onClose={() => {
            setShowDeleteCategoryConfirmation(false)
            setSelectedCategory(null)
          }}
          onConfirm={handleDeleteCategory}
          title="Delete Category"
          message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonColor="#ef4444"
          loading={deleteCategoryLoading}
        />

        <ConfirmationModal
          visible={showDeleteItemConfirmation}
          onClose={() => {
            setShowDeleteItemConfirmation(false)
            setSelectedItem(null)
          }}
          onConfirm={handleDeleteItem}
          title="Delete Item"
          message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonColor="#ef4444"
          loading={deleteItemLoading}
        />

        {/* Discard Changes Confirmation */}
        <ConfirmationModal
          visible={showDiscardConfirmation}
          onClose={() => setShowDiscardConfirmation(false)}
          onConfirm={confirmDiscard}
          title="Discard Changes"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmText="Discard"
          cancelText="Keep Editing"
          confirmButtonColor="#ef4444"
        />

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