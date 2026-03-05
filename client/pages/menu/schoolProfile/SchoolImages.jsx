import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
} from '@expo/vector-icons'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import axiosApi from '@/utils/axiosApi'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAX_IMAGES = 8

const SchoolImages = ({ 
  images = [], 
  isEditing, 
  onImagesUpdate, 
  showToast, 
  colors, 
  loading, 
  setActionLoading,
  schoolExists 
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [imageToDelete, setImageToDelete] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [localImages, setLocalImages] = useState([])
  const [tempSelectedImages, setTempSelectedImages] = useState([])
  const [showSelectionModal, setShowSelectionModal] = useState(false)

  // Sync local images with props
  useEffect(() => {
    setLocalImages(Array.isArray(images) ? images : [])
  }, [images])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    headerText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 8,
    },
    imageItem: {
      width: (SCREEN_WIDTH - 48) / 3, // 3 columns with padding
      height: 100,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    schoolImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    addImageButton: {
      width: (SCREEN_WIDTH - 48) / 3, // Same size as image items
      height: 100,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 4,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageActions: {
      flexDirection: 'row',
      gap: 10,
    },
    imageActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary + '80',
      textAlign: 'center',
    },
    editNotice: {
      backgroundColor: colors.primary + '15',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    editNoticeText: {
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    imageModalContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    imageModalHeader: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 70 : 50,
      left: 20,
      right: 20,
      zIndex: 100,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    deleteButton: {
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
    imageModalImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      resizeMode: 'contain',
    },
    imagePagination: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    paginationDotActive: {
      backgroundColor: '#FFFFFF',
      width: 20,
    },
    slotsLeftText: {
      fontSize: 11,
      color: colors.primary,
      marginTop: 2,
    },
    multiSelectNotice: {
      backgroundColor: colors.info + '15',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.info + '30',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    multiSelectText: {
      fontSize: 13,
      color: colors.info,
      flex: 1,
    },
    // Selection modal styles
    selectionModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    selectionModalContent: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      minHeight: 200,
    },
    selectionModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    selectionModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    selectedImagesPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
      maxHeight: 200,
    },
    selectedImagePreview: {
      width: 80,
      height: 80,
      borderRadius: 8,
      position: 'relative',
    },
    selectedImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    removeSelectedImage: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    noSelectionText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 20,
    },
    selectionModalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
    },
    selectionModalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    uploadButton: {
      backgroundColor: colors.primary,
    },
    uploadButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    uploadButtonDisabled: {
      opacity: 0.5,
    },
    addMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: 20,
    },
    addMoreButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
  }), [colors])

  const pickImages = async () => {
    if (uploadLoading || loading || !schoolExists) return

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        showToast('Permission needed', 'Please grant permission to access your photo library.', 'warning')
        return
      }

      const remainingSlots = MAX_IMAGES - localImages.length
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: remainingSlots,
        base64: false,
      })

      if (!result.canceled && result.assets.length > 0) {
        setTempSelectedImages(result.assets)
        setShowSelectionModal(true)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      showToast(error.response?.data?.message || 'Failed to pick images', 'error')
    }
  }

  const handleUploadConfirm = async () => {
    if (tempSelectedImages.length === 0) return

    try {
      setUploadLoading(true)
      setActionLoading(true)
      setShowSelectionModal(false)

      const formData = new FormData()
      
      tempSelectedImages.forEach((asset, index) => {
        const filename = asset.uri.split('/').pop() || `image_${Date.now()}_${index}.jpg`
        
        let mimeType = 'image/jpeg'
        if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png'
        } else if (filename.toLowerCase().endsWith('.gif')) {
          mimeType = 'image/gif'
        } else if (filename.toLowerCase().endsWith('.webp')) {
          mimeType = 'image/webp'
        }
        
        formData.append('images', {
          uri: asset.uri,
          type: mimeType,
          name: filename,
        })
      })

      const response = await axiosApi.post('/school/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        const newImages = Array.isArray(response.data.data) ? response.data.data : []
        onImagesUpdate(newImages)
        setLocalImages(newImages)
        showToast(`${response.data.count || tempSelectedImages.length} image(s) uploaded successfully!`, 'success')
      } else {
        showToast(response.data.message || 'Failed to upload images', 'error')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      showToast(error.response?.data?.message || 'Failed to upload images', 'error')
    } finally {
      setUploadLoading(false)
      setActionLoading(false)
      setTempSelectedImages([])
    }
  }

  const handleUploadCancel = () => {
    setShowSelectionModal(false)
    setTempSelectedImages([])
  }

  const removeTempImage = (index) => {
    setTempSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const openDeleteConfirmation = (index, image) => {
    // Get the publicId if available
    let publicId = null
    
    if (image && typeof image === 'object') {
      publicId = image.publicId
    }

    setImageToDelete({ 
      index, 
      publicId 
    })
    setDeleteModalVisible(true)
  }

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return

    try {
      setDeleteModalVisible(false)
      setActionLoading(true)

      // Try to delete by publicId first (most efficient)
      if (imageToDelete.publicId) {
        try {
          const response = await axiosApi.delete(`/school/images/${imageToDelete.publicId}`)
          
          if (response.data.success) {
            const newImages = Array.isArray(response.data.data) ? response.data.data : []
            onImagesUpdate(newImages)
            setLocalImages(newImages)
            
            if (showImageModal) {
              setShowImageModal(false)
            }
            
            showToast('Image deleted successfully!', 'success')
            return
          }
        } catch (publicIdError) {
          console.log('PublicId deletion failed, trying index-based deletion')
          // Fall through to index-based deletion
        }
      }

      // Fallback to index-based deletion
      const response = await axiosApi.delete(`/school/images/index/${imageToDelete.index}`)
      
      if (response.data.success) {
        const newImages = Array.isArray(response.data.data) ? response.data.data : []
        onImagesUpdate(newImages)
        setLocalImages(newImages)
        
        if (showImageModal) {
          setShowImageModal(false)
        }
        
        showToast('Image deleted successfully!', 'success')
      } else {
        showToast(response.data.message || 'Failed to delete image', 'error')
      }
    } catch (error) {
      console.error('Delete image error:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to delete image'
      showToast(errorMessage, 'error')
    } finally {
      setActionLoading(false)
      setImageToDelete(null)
    }
  }

  const openImageModal = (index) => {
    setSelectedImageIndex(index)
    setShowImageModal(true)
  }

  const goToNextImage = () => {
    if (selectedImageIndex < localImages.length - 1) {
      setSelectedImageIndex(prev => prev + 1)
    }
  }

  const goToPrevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(prev => prev - 1)
    }
  }

  const getImageUrl = (image) => {
    if (!image) return null
    if (typeof image === 'string') return image
    if (image && image.url) return image.url
    return null
  }

  const renderImageItem = useCallback((image, index) => {
    const imageUrl = getImageUrl(image)
    if (!imageUrl) return null

    return (
      <TouchableOpacity 
        key={index} 
        style={styles.imageItem}
        onPress={() => openImageModal(index)}
        activeOpacity={0.7}
        delayPressIn={100}
      >
        <Image source={{ uri: imageUrl }} style={styles.schoolImage} />
        {isEditing && (
          <View style={styles.imageOverlay}>
            <View style={styles.imageActions}>
              <TouchableOpacity 
                style={[styles.imageActionButton, loading && styles.disabledButton]}
                onPress={(e) => {
                  e.stopPropagation()
                  openDeleteConfirmation(index, image)
                }}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }, [isEditing, loading, localImages])

  const renderImagesGrid = () => {
    const imageItems = []
    
    // Render existing images
    for (let i = 0; i < localImages.length; i++) {
      imageItems.push(renderImageItem(localImages[i], i))
    }

    // If in edit mode and less than MAX_IMAGES, show ONE plus button
    if (isEditing && localImages.length < MAX_IMAGES) {
      const remainingSlots = MAX_IMAGES - localImages.length
      
      imageItems.push(
        <TouchableOpacity
          key="add-button"
          style={[styles.addImageButton, (uploadLoading || loading) && styles.disabledButton]}
          onPress={pickImages}
          activeOpacity={0.7}
          disabled={uploadLoading || loading}
        >
          {uploadLoading ? (
            <LoadingSpinner size={24} color={colors.primary} />
          ) : (
            <>
              <Ionicons name="add-circle" size={32} color={colors.primary} />
              <ThemedText style={styles.addImageText}>
                {localImages.length === 0 ? 'Add Images' : `+${remainingSlots} more`}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      )
    }

    return (
      <View style={styles.imagesGrid}>
        {imageItems}
      </View>
    )
  }

  const renderEmptyState = () => {
    if (localImages.length > 0) return null
    
    if (isEditing) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={colors.textSecondary + '40'} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyText}>No school images yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Tap the + button below to add up to {MAX_IMAGES} images
          </ThemedText>
          {uploadLoading && (
            <View style={{ marginTop: 20 }}>
              <LoadingSpinner size={30} color={colors.primary} message="Uploading..." />
            </View>
          )}
        </View>
      )
    }
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={64} color={colors.textSecondary + '40'} style={styles.emptyIcon} />
        <ThemedText style={styles.emptyText}>No school images yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Ask administrator to add school images
        </ThemedText>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isEditing && (
          <View style={styles.multiSelectNotice}>
            <Ionicons name="images-outline" size={20} color={colors.info} />
            <ThemedText style={styles.multiSelectText}>
              You can select multiple images at once. Max {MAX_IMAGES} images total.
            </ThemedText>
          </View>
        )}

        {isEditing && localImages.length > 0 && (
          <View style={styles.editNotice}>
            <ThemedText style={styles.editNoticeText}>
              {localImages.length >= MAX_IMAGES 
                ? `Maximum ${MAX_IMAGES} images reached` 
                : `You can add up to ${MAX_IMAGES} images. ${MAX_IMAGES - localImages.length} slots left.`}
            </ThemedText>
          </View>
        )}
        
        <ThemedText style={styles.headerText}>
          School campus, events, and activities
        </ThemedText>
        
        {localImages.length > 0 || isEditing ? (
          renderImagesGrid()
        ) : (
          renderEmptyState()
        )}

        {/* Show a prominent add button below when no images and in edit mode */}
        {localImages.length === 0 && isEditing && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <TouchableOpacity
              style={[styles.addMoreButton, (uploadLoading || loading) && styles.disabledButton]}
              onPress={pickImages}
              activeOpacity={0.7}
              disabled={uploadLoading || loading}
            >
              {uploadLoading ? (
                <LoadingSpinner size={20} color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color={colors.primary} />
                  <ThemedText style={styles.addMoreButtonText}>
                    Add Images
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Image Selection Modal */}
      <Modal
        statusBarTranslucent
        visible={showSelectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleUploadCancel}
      >
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalContent}>
            <View style={styles.selectionModalHeader}>
              <ThemedText style={styles.selectionModalTitle}>
                Selected Images ({tempSelectedImages.length})
              </ThemedText>
              <TouchableOpacity 
                onPress={handleUploadCancel}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {tempSelectedImages.length > 0 ? (
              <>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 20 }}
                >
                  <View style={styles.selectedImagesPreview}>
                    {tempSelectedImages.map((asset, index) => (
                      <View key={index} style={styles.selectedImagePreview}>
                        <Image 
                          source={{ uri: asset.uri }} 
                          style={styles.selectedImage}
                        />
                        <TouchableOpacity
                          style={styles.removeSelectedImage}
                          onPress={() => removeTempImage(index)}
                        >
                          <Ionicons name="close" size={16} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.selectionModalActions}>
                  <TouchableOpacity
                    style={[styles.selectionModalButton, styles.cancelButton]}
                    onPress={handleUploadCancel}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      Discard
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.selectionModalButton, 
                      styles.uploadButton,
                      (uploadLoading || loading) && styles.uploadButtonDisabled
                    ]}
                    onPress={handleUploadConfirm}
                    activeOpacity={0.7}
                    disabled={uploadLoading || loading}
                  >
                    {uploadLoading ? (
                      <LoadingSpinner size={20} color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.uploadButtonText}>
                        Upload {tempSelectedImages.length} {tempSelectedImages.length === 1 ? 'Image' : 'Images'}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <ThemedText style={styles.noSelectionText}>
                No images selected
              </ThemedText>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal
        statusBarTranslucent
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>          
          <View style={styles.imageModalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowImageModal(false)}
              activeOpacity={0.7}
            >
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText style={[styles.title, { color: '#FFFFFF' }]}>
                School Images
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                {selectedImageIndex !== null ? `${selectedImageIndex + 1} of ${localImages.length}` : ''}
              </ThemedText>
            </View>
            {isEditing && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => {
                  if (selectedImageIndex !== null) {
                    openDeleteConfirmation(selectedImageIndex, localImages[selectedImageIndex])
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {selectedImageIndex !== null && localImages[selectedImageIndex] && (
            <Image
              source={{ uri: getImageUrl(localImages[selectedImageIndex]) }}
              style={styles.imageModalImage}
            />
          )}

          {localImages.length > 1 && (
            <View style={styles.imagePagination}>
              {localImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === selectedImageIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}

          {selectedImageIndex !== null && localImages.length > 1 && (
            <>
              {selectedImageIndex > 0 && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: SCREEN_HEIGHT / 2 - 30,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={goToPrevImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {selectedImageIndex < localImages.length - 1 && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: SCREEN_HEIGHT / 2 - 30,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={goToNextImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>

      {/* Delete Image Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false)
          setImageToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </>
  )
}

export default SchoolImages