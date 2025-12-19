import React, { useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Ionicons,
  FontAwesome5,
} from '@expo/vector-icons'
import axiosApi from '@/utils/axiosApi'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const SchoolImages = ({ images, isEditing, onImagesUpdate, showToast, colors }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
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
      justifyContent: 'space-between',
    },
    imageItem: {
      width: '48%',
      height: 120,
      marginBottom: 8,
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
      width: '48%',
      height: 120,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageText: {
      fontSize: 14,
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
      paddingVertical: 60,
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
    editModeIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#ef4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    editModeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  }), [colors])

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.')
        return
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        const imageUrl = result.assets[0].uri
        
        try {
          const response = await axiosApi.post('/school/images', { imageUrl })
          if (response.data.success) {
            onImagesUpdate(response.data.data)
            showToast('Image added successfully!', 'success')
          }
        } catch (error) {
          console.error('Upload image error:', error)
          showToast(error.response?.data?.message || 'Failed to upload image', 'error')
        }
      }
    } catch (error) {
      console.error('Image picker error:', error)
      showToast('Failed to pick image', 'error')
    }
  }

  const deleteImage = async (index) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axiosApi.delete(`/school/images/${index}`)
              if (response.data.success) {
                onImagesUpdate(response.data.data)
                showToast('Image deleted successfully!', 'success')
              } else {
                showToast(response.data.message || 'Failed to delete image', 'error')
              }
            } catch (error) {
              console.error('Delete image error:', error)
              showToast(error.response?.data?.message || 'Failed to delete image', 'error')
            }
          }
        }
      ]
    )
  }

  const openImageModal = (index) => {
    setSelectedImageIndex(index)
    setShowImageModal(true)
  }

  const goToNextImage = () => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(prev => prev + 1)
    }
  }

  const goToPrevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(prev => prev - 1)
    }
  }

  const renderImageItem = (image, index) => (
    <TouchableOpacity 
      key={index} 
      style={styles.imageItem}
      onPress={() => openImageModal(index)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: image }} style={styles.schoolImage} />
      {isEditing && (
        <View style={styles.imageOverlay}>
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={styles.imageActionButton}
              onPress={(e) => {
                e.stopPropagation()
                deleteImage(index)
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderImagesGrid = () => {
    if (images.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={colors.textSecondary + '40'} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyText}>No school images yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {isEditing ? 'Tap the + button to add images' : 'Ask administrator to add school images'}
          </ThemedText>
        </View>
      )
    }

    const MAX_IMAGES = 8
    const currentImages = images?.length || 0
    const placeholders = []
    const imagesToShow = Math.min(currentImages, MAX_IMAGES)

    // Render existing images
    for (let i = 0; i < imagesToShow; i++) {
      placeholders.push(renderImageItem(images[i], i))
    }

    // If in edit mode and there's space for more images, show add button
    if (isEditing && currentImages < MAX_IMAGES) {
      placeholders.push(
        <TouchableOpacity
          key="add-button"
          style={styles.addImageButton}
          onPress={pickImage}
        >
          <Ionicons name="add-circle" size={32} color={colors.primary} />
          <ThemedText style={styles.addImageText}>Add Image</ThemedText>
          {currentImages < MAX_IMAGES && (
            <ThemedText style={{ fontSize: 11, color: colors.primary, marginTop: 2 }}>
              {MAX_IMAGES - currentImages} slots left
            </ThemedText>
          )}
        </TouchableOpacity>
      )
    }

    return (
      <View style={styles.imagesGrid}>
        {placeholders}
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
          <View style={styles.editNotice}>
            <ThemedText style={styles.editNoticeText}>
              {images.length >= 8 ? 'Maximum 8 images reached' : `You can add up to 8 images. ${8 - images.length} slots available.`}
            </ThemedText>
          </View>
        )}
        
        <ThemedText style={styles.headerText}>
          School campus, events, and activities
        </ThemedText>
        
        {renderImagesGrid()}
      </ScrollView>

      {/* Image Modal */}
      <Modal
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
            >
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText style={[styles.title, { color: '#FFFFFF' }]}>
                School Images
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                {selectedImageIndex !== null ? `${selectedImageIndex + 1} of ${images.length}` : ''}
              </ThemedText>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {selectedImageIndex !== null && (
            <Image
              source={{ uri: images[selectedImageIndex] }}
              style={styles.imageModalImage}
            />
          )}

          <View style={styles.imagePagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === selectedImageIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>

          {selectedImageIndex !== null && (
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
                >
                  <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {selectedImageIndex < images.length - 1 && (
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
                >
                  <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>
    </>
  )
}

export default SchoolImages