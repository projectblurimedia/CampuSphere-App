import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Image,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import { ThemedInput } from '@/components/ui/themed-input'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const EventForm = ({ 
  visible, 
  onClose, 
  isEdit, 
  eventData, 
  onSubmit, 
  showToast, 
  colors,
  loading: externalLoading = false 
}) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    date: new Date(), 
    description: '', 
    images: [] 
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [errors, setErrors] = useState({})
  const [imageToRemove, setImageToRemove] = useState(null)
  const [removeImageModalVisible, setRemoveImageModalVisible] = useState(false)

  const currentDate = new Date()
  const sevenDaysBefore = new Date(currentDate)
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7)

  // Initialize form data only once when modal becomes visible
  const initializeForm = useCallback(() => {
    if (isEdit && eventData) {
      const eventDate = new Date(eventData.date)
      setFormData({ 
        title: eventData.title || '', 
        date: eventDate, 
        description: eventData.description || '', 
        images: eventData.images || [] 
      })
    } else if (!isEdit && !isInitialized) {
      setFormData({ 
        title: '', 
        date: new Date(), 
        description: '', 
        images: [] 
      })
    }
    setErrors({})
    setIsInitialized(true)
  }, [isEdit, eventData, isInitialized])

  useEffect(() => {
    if (visible) {
      initializeForm()
    } else {
      setIsInitialized(false)
      setErrors({})
      setImageToRemove(null)
      setRemoveImageModalVisible(false)
    }
  }, [visible, initializeForm])

  const pickImages = async () => {
    if (externalLoading) return
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        showToast('warning', 'Please grant permission to access photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - formData.images.length,
      })

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        }))
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }))
        showToast('success', `${newImages.length} image(s) added`)
      }
    } catch (error) {
      showToast('error', 'Failed to pick images')
    }
  }

  const openRemoveImageConfirmation = (index) => {
    setImageToRemove({ index, image: formData.images[index] })
    setRemoveImageModalVisible(true)
  }

  const handleRemoveImageConfirm = () => {
    if (!imageToRemove) return
    
    const newImages = [...formData.images]
    newImages.splice(imageToRemove.index, 1)
    setFormData(prev => ({ ...prev, images: newImages }))
    showToast('success', 'Image removed')
    setRemoveImageModalVisible(false)
    setImageToRemove(null)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required'
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (externalLoading) return
    
    if (!validateForm()) {
      showToast('warning', 'Please fix the errors in the form')
      return
    }

    if (isEdit && eventData) {
      const existingImages = eventData.images || []
      const currentImages = formData.images || []
      
      // Find images that were in existingImages but are not in currentImages
      const imagesToRemove = []
      
      existingImages.forEach(existingImage => {
        const stillExists = currentImages.some(currentImage => {
          if (currentImage.id) {
            return existingImage.id === currentImage.id
          }
          if (currentImage.url && existingImage.url) {
            return existingImage.url === currentImage.url
          }
          return false
        })
        
        if (!stillExists && existingImage.id) {
          imagesToRemove.push(existingImage.id)
        } else if (!stillExists && existingImage.publicId) {
          imagesToRemove.push(existingImage.publicId)
        }
      })
      
      // Separate new images (have uri but no id) from existing images
      const newImages = formData.images.filter(img => img.uri && !img.id && !img._id)
      
      onSubmit(eventData.id, formData, newImages, imagesToRemove)
    } else {
      onSubmit(formData, formData.images)
    }
  }

  const onDateChange = (event, selectedDate) => {
    if (externalLoading) return
    
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate })
    }
  }

  const renderImageGrid = (images) => {
    if (!images || images.length === 0) return null

    const imageSize = (SCREEN_WIDTH - 80) / 3

    return (
      <View style={styles.imagesGrid}>
        {images.map((img, index) => (
          <View key={index} style={styles.imageItemContainer}>
            <Image
              source={{ uri: img.url || img.uri }}
              style={{
                width: imageSize,
                height: 100,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: colors.primary + '30',
              }}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => openRemoveImageConfirmation(index)}
              disabled={externalLoading}
              activeOpacity={.9}
            >
              <Feather name="x" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 10 && (
          <TouchableOpacity 
            style={[styles.imagePickContainer, { width: imageSize, height: 100 }]} 
            onPress={pickImages}
            disabled={externalLoading}
            activeOpacity={.9}
          >
            <Feather name="plus" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (!visible) return null

  return (
    <>
      <Modal 
        visible={visible} 
        animationType="fade"
        onRequestClose={() => {
          if (!externalLoading) {
            onClose();
          }
        }}
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
            style={styles.modalHeader}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity 
                  style={[styles.modalCloseBtn, externalLoading && { opacity: 0.5 }]} 
                  onPress={() => {
                    if (!externalLoading) {
                      onClose();
                    }
                  }}
                  disabled={externalLoading}
                  activeOpacity={.9}
                >
                  <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" style={{ marginLeft: -2 }} />
                </TouchableOpacity>
                <View style={styles.modalTitleContainer}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    {isEdit ? 'Edit Event' : 'Create New Event'}
                  </ThemedText>
                  <ThemedText style={styles.modalSubtitle}>
                    {isEdit ? 'Update event details' : 'Add details for new school event'}
                  </ThemedText>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Event Title *</ThemedText>
              <View style={styles.inputWrapper}>
                <Feather name="file-text" size={20} color={colors.primary} style={styles.inputIcon} />
                <ThemedInput
                  style={[
                    styles.input, 
                    { borderColor: errors.title ? '#EF4444' : colors.primary + '50' }
                  ]}
                  placeholder="Enter event title"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={formData.title}
                  onChangeText={(text) => {
                    if (!externalLoading) {
                      setFormData({ ...formData, title: text })
                      if (errors.title) setErrors({ ...errors, title: null })
                    }
                  }}
                  editable={!externalLoading}
                />
              </View>
              {errors.title && (
                <ThemedText style={styles.errorText}>{errors.title}</ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Event Date *</ThemedText>
              <TouchableOpacity
                style={[styles.dateInput, { borderColor: colors.primary + '50' }]}
                onPress={() => !externalLoading && setShowDatePicker(true)}
                disabled={externalLoading}
                activeOpacity={.9}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                <ThemedText style={styles.dateText}>
                  {formData.date.toDateString()}
                </ThemedText>
                <MaterialCommunityIcons 
                  name="calendar-edit" 
                  size={20} 
                  color={colors.primary} 
                  style={styles.datePickerIcon}
                />
              </TouchableOpacity>
              {showDatePicker && !externalLoading && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="default"
                  minimumDate={sevenDaysBefore}
                  onChange={onDateChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Description *</ThemedText>
              <View style={styles.inputWrapper}>
                <Feather name="align-left" size={20} color={colors.primary} style={styles.inputIcon} />
                <ThemedInput
                  style={[
                    styles.input, 
                    styles.multilineInput, 
                    { borderColor: errors.description ? '#EF4444' : colors.primary + '50' }
                  ]}
                  placeholder="Enter event description"
                  placeholderTextColor={colors.textSecondary + '80'}
                  multiline
                  numberOfLines={5}
                  value={formData.description}
                  onChangeText={(text) => {
                    if (!externalLoading) {
                      setFormData({ ...formData, description: text })
                      if (errors.description) setErrors({ ...errors, description: null })
                    }
                  }}
                  editable={!externalLoading}
                />
              </View>
              {errors.description && (
                <ThemedText style={styles.errorText}>{errors.description}</ThemedText>
              )}
            </View>

            <View style={styles.imagesSection}>
              <View style={styles.imagesHeader}>
                <ThemedText style={styles.inputLabel}>Event Images (Optional)</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {formData.images.length} / 10 added
                </ThemedText>
              </View>
              
              {formData.images.length > 0 ? (
                renderImageGrid(formData.images)
              ) : (
                <TouchableOpacity 
                  style={[styles.imagePickContainer, { width: '100%', height: 120 }]} 
                  onPress={pickImages}
                  disabled={externalLoading}
                  activeOpacity={.9}
                >
                  <Feather name="image" size={32} color={colors.primary} />
                  <ThemedText style={{ color: colors.primary, marginTop: 8, fontSize: 14 }}>
                    Tap to add images
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, externalLoading && styles.saveBtnDisabled]} 
              onPress={handleSubmit}
              disabled={externalLoading}
              activeOpacity={.9}
            >
              <View style={styles.saveBtnContent}>
                {externalLoading ? (
                  <LoadingSpinner size={20} color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.saveBtnText}>
                    {isEdit ? 'Update Event' : 'Create Event'}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Remove Image Confirmation Modal */}
      <ConfirmationModal
        visible={removeImageModalVisible}
        onClose={() => {
          setRemoveImageModalVisible(false)
          setImageToRemove(null)
        }}
        onConfirm={handleRemoveImageConfirm}
        title="Remove Image"
        message="Are you sure you want to remove this image? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
        loading={externalLoading}
      />
    </>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 75 : 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  modalTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: -3,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  datePickerIcon: {
    marginLeft: 8,
  },
  input: {
    paddingLeft: 52,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: '#1d9bf0', 
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    height: 56, 
  },
  saveBtnContent: {
    height: 24, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  imagesSection: {
    marginBottom: 20,
  },
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imagePickContainer: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1d9bf0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageItemContainer: {
    position: 'relative',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
})

export default EventForm