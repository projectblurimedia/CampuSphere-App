import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'
import { SafeAreaView } from 'react-native-safe-area-context'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const GRID_SPACING = 4
const GRID_COLUMNS = 3
const MAX_DOTS = 5

const GalleryModal = ({
  visible = false,
  onClose,
  currentGroupData = {},
  selectedImageIndex = 0,
  onImageIndexChange,
  initialViewMode = 'grid',
  headerTitle = '',
}) => {
  const { colors } = useTheme()
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [currentIndex, setCurrentIndex] = useState(selectedImageIndex)
  const [isChangingMode, setIsChangingMode] = useState(false)
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  const [imageToDelete, setImageToDelete] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [showDeleteOption, setShowDeleteOption] = useState(false)
  const scrollViewRef = useRef(null)
  const flatListRef = useRef(null)

  // Get title from props with fallback
  const title = headerTitle || currentGroupData?.title || 'Event Gallery'
  const { pics = [] } = currentGroupData || {}

  const gridItemSize = useMemo(() => {
    const totalSpacing = GRID_SPACING * (GRID_COLUMNS + 1)
    return (SCREEN_WIDTH - totalSpacing) / GRID_COLUMNS
  }, [])

  useEffect(() => {
    if (visible && pics.length > 0) {
      const clampedIndex = Math.max(0, Math.min(selectedImageIndex, pics.length - 1))
      setCurrentIndex(clampedIndex)

      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: clampedIndex * SCREEN_WIDTH,
          animated: false,
        })
      }
    }
  }, [selectedImageIndex, visible, pics.length])

  useEffect(() => {
    if (visible) {
      setViewMode(initialViewMode)
      setImageLoadErrors({})
    }
  }, [visible, initialViewMode])

  useEffect(() => {
    if (viewMode === 'grid' && flatListRef.current && pics.length > 0 && currentIndex >= 0) {
      const timer = setTimeout(() => {
        if (flatListRef.current && pics.length > 0) {
          try {
            flatListRef.current.scrollToIndex({
              index: Math.min(currentIndex, pics.length - 1),
              animated: false,
              viewPosition: 0.5,
            })
          } catch (error) {
            if (flatListRef.current) {
              const rowIndex = Math.floor(Math.min(currentIndex, pics.length - 1) / GRID_COLUMNS)
              const offset = rowIndex * (gridItemSize + GRID_SPACING)
              flatListRef.current.scrollToOffset({
                offset,
                animated: false,
              })
            }
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [viewMode, currentIndex, pics.length, gridItemSize])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
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
          position: 'relative',
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
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: 20,
          color: '#FFFFFF',
          marginBottom: -3,
        },
        subtitle: {
          marginTop: 4,
          fontSize: 12,
          color: 'rgba(255,255,255,0.9)',
        },
        emptySpace: {
          width: 44,
        },
        gridContainer: {
          flexGrow: 1,
          paddingTop: Platform.OS === 'ios' ? 140 : 120,
          paddingBottom: 20,
          paddingHorizontal: GRID_SPACING,
        },
        gridRow: {
          flexDirection: 'row',
          marginBottom: GRID_SPACING,
        },
        gridItem: {
          width: gridItemSize,
          height: gridItemSize,
          marginRight: GRID_SPACING,
          borderRadius: 8,
          overflow: 'hidden',
        },
        gridItemLastInRow: {
          marginRight: 0,
        },
        gridImage: {
          width: '100%',
          height: '100%',
        },
        gridImageError: {
          backgroundColor: '#f0f0f0',
          justifyContent: 'center',
          alignItems: 'center',
        },
        singleImageFullContainer: {
          flex: 1,
          backgroundColor: '#000000',
        },
        singleImageScroll: {
          flex: 1,
        },
        singleImagePage: {
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
        },
        singleImageWrapper: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        singleImage: {
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
        },
        singleImageError: {
          backgroundColor: '#1a1a1a',
          justifyContent: 'center',
          alignItems: 'center',
        },
        errorPlaceholder: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
        },
        errorText: {
          color: '#666',
          fontSize: 14,
          marginTop: 8,
        },
        bottomControlsWrapper: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 60,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 30,
        },
        bottomControlsInner: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(0,0,0,0.55)',
        },
        navArrowButtonSmall: {
          width: 32,
          height: 32,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
        },
        navArrowButtonDisabled: {
          opacity: 0.3,
        },
        paginationDotsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 10,
        },
        dotTiny: {
          width: 4,
          height: 4,
          borderRadius: 2,
          marginHorizontal: 2,
          backgroundColor: 'rgba(255,255,255,0.25)',
        },
        dotSmall: {
          width: 6,
          height: 6,
          borderRadius: 3,
          marginHorizontal: 3,
          backgroundColor: 'rgba(255,255,255,0.5)',
        },
        dotMedium: {
          width: 10,
          height: 6,
          borderRadius: 4,
          marginHorizontal: 4,
          backgroundColor: '#ffffff',
        },
      }),
    [colors, gridItemSize]
  )

  const handleImageError = useCallback((imageId) => {
    setImageLoadErrors(prev => ({ ...prev, [imageId]: true }))
  }, [])

  const handleGridImagePress = useCallback(
    (index) => {
      if (isChangingMode || pics.length === 0 || index >= pics.length) return
      const clampedIndex = Math.max(0, Math.min(index, pics.length - 1))
      setIsChangingMode(true)
      setCurrentIndex(clampedIndex)
      setViewMode('single')
      setShowDeleteOption(false)
      if (onImageIndexChange) onImageIndexChange(clampedIndex)
      setTimeout(() => setIsChangingMode(false), 300)
    },
    [isChangingMode, pics.length, onImageIndexChange]
  )

  const handleSingleImageScroll = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const newIndex = Math.round(offsetX / SCREEN_WIDTH)
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < pics.length) {
        setCurrentIndex(newIndex)
        if (onImageIndexChange) onImageIndexChange(newIndex)
      }
    },
    [currentIndex, pics.length, onImageIndexChange]
  )

  const handlePrevPress = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      if (onImageIndexChange) onImageIndexChange(newIndex)
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: newIndex * SCREEN_WIDTH,
          animated: true,
        })
      }
    }
  }, [currentIndex, onImageIndexChange])

  const handleNextPress = useCallback(() => {
    if (currentIndex < pics.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      if (onImageIndexChange) onImageIndexChange(newIndex)
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: newIndex * SCREEN_WIDTH,
          animated: true,
        })
      }
    }
  }, [currentIndex, pics.length, onImageIndexChange])

  const handleBackPress = useCallback(() => {
    if (isChangingMode) return
    if (viewMode === 'single') {
      setIsChangingMode(true)
      setViewMode('grid')
      setShowDeleteOption(false)
      setTimeout(() => setIsChangingMode(false), 300)
    } else {
      if (onClose) onClose()
    }
  }, [isChangingMode, viewMode, onClose])

  const handleDotPress = useCallback(
    (targetIndex) => {
      if (!scrollViewRef.current) return
      const clampedIndex = Math.max(0, Math.min(targetIndex, pics.length - 1))
      scrollViewRef.current.scrollTo({
        x: clampedIndex * SCREEN_WIDTH,
        animated: true,
      })
      setCurrentIndex(clampedIndex)
      if (onImageIndexChange) onImageIndexChange(clampedIndex)
    },
    [pics.length, onImageIndexChange]
  )

  const toggleDeleteOption = useCallback(() => {
    setShowDeleteOption(!showDeleteOption)
  }, [showDeleteOption])

  const openDeleteImageConfirmation = useCallback(() => {
    if (pics.length > 0 && currentIndex >= 0) {
      setImageToDelete({
        index: currentIndex,
        image: pics[currentIndex]
      })
      setDeleteModalVisible(true)
    }
  }, [pics, currentIndex])

  const handleDeleteImageConfirm = useCallback(() => {
    // This is just a placeholder - actual delete logic would be handled by parent
    // For now, we'll just close the modal
    setDeleteModalVisible(false)
    setImageToDelete(null)
    setShowDeleteOption(false)
    // You can add a callback prop here to notify parent about delete
  }, [])

  // Compute windowed dots
  const getWindowedDots = () => {
    const total = pics.length
    if (total === 0) return []

    if (total <= MAX_DOTS) {
      const center = currentIndex
      const dots = []
      for (let i = 0; i < total; i++) {
        const distance = Math.abs(i - center)
        let size = 'tiny'
        if (distance === 0) size = 'medium'
        else if (distance === 1) size = 'small'
        dots.push({ index: i, size, key: `dot-${i}` })
      }
      return dots
    }

    const center = currentIndex
    const half = Math.floor(MAX_DOTS / 2)

    let start = center - half
    let end = center + half

    if (start < 0) {
      end += -start
      start = 0
    } else if (end > total - 1) {
      const diff = end - (total - 1)
      start -= diff
      end = total - 1
    }

    const dots = []

    if (start > 0) {
      dots.push({ index: start - 1, size: 'tiny', key: 'dot-leading' })
    }

    for (let i = start; i <= end; i++) {
      const distance = Math.abs(i - center)
      let size = 'tiny'
      if (distance === 0) size = 'medium'
      else if (distance === 1) size = 'small'
      dots.push({ index: i, size, key: `dot-${i}` })
    }

    if (end < total - 1) {
      dots.push({ index: end + 1, size: 'tiny', key: 'dot-trailing' })
    }

    return dots
  }

  const Header = () => (
    <LinearGradient
      colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
      style={styles.header}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            disabled={isChangingMode}
          >
            <FontAwesome5
              name="chevron-left"
              size={20}
              color="#FFFFFF"
              style={{ marginLeft: -2 }}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <ThemedText type="subtitle" style={styles.title} numberOfLines={1}>
              {title}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {viewMode === 'grid' ? 'Event Photos' : `Photo ${currentIndex + 1} of ${pics.length}`}
            </ThemedText>
          </View>

          {viewMode === 'single' ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={toggleDeleteOption}
              disabled={isChangingMode}
            >
              <Feather
                name="more-vertical"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpace} />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  )

  const GridView = () => {
    if (pics.length === 0) {
      return (
        <View style={[styles.gridContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Feather name="image" size={48} color={colors.textSecondary} />
          <ThemedText style={{ marginTop: 16, color: colors.textSecondary }}>
            No photos available
          </ThemedText>
        </View>
      )
    }

    const gridData = []
    for (let i = 0; i < pics.length; i += GRID_COLUMNS) {
      gridData.push(pics.slice(i, i + GRID_COLUMNS))
    }

    const lastRowIndex = gridData.length - 1
    const lastRowItems = gridData[lastRowIndex] || []
    const remainingSpots = GRID_COLUMNS - lastRowItems.length

    return (
      <FlatList
        ref={flatListRef}
        data={gridData}
        keyExtractor={(_, index) => `row-${index}`}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: row, index: rowIndex }) => (
          <View style={styles.gridRow}>
            {row.map((item, colIndex) => {
              const absoluteIndex = rowIndex * GRID_COLUMNS + colIndex
              const imageId = item.id || item.publicId || `image-${absoluteIndex}`
              const hasError = imageLoadErrors[imageId]

              return (
                <TouchableOpacity
                  key={absoluteIndex}
                  style={[
                    styles.gridItem,
                    colIndex === row.length - 1 && styles.gridItemLastInRow,
                  ]}
                  onPress={() => handleGridImagePress(absoluteIndex)}
                  activeOpacity={0.9}
                >
                  {hasError ? (
                    <View style={[styles.gridImage, styles.gridImageError]}>
                      <Feather name="image" size={24} color="#999" />
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: item.url }} 
                      style={styles.gridImage} 
                      contentFit="cover"
                      onError={() => handleImageError(imageId)}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
            
            {/* Add empty spots to complete the last row */}
            {rowIndex === lastRowIndex && remainingSpots > 0 && (
              Array.from({ length: remainingSpots }).map((_, emptyIndex) => (
                <View
                  key={`empty-${emptyIndex}`}
                  style={[
                    styles.gridItem,
                    { backgroundColor: 'transparent' },
                    emptyIndex === remainingSpots - 1 && styles.gridItemLastInRow,
                  ]}
                />
              ))
            )}
          </View>
        )}
        onScrollToIndexFailed={({ index }) => {
          if (flatListRef.current && index >= 0) {
            setTimeout(() => {
              const offset = index * (gridItemSize + GRID_SPACING)
              flatListRef.current.scrollToOffset({
                offset,
                animated: false,
              })
            }, 100)
          }
        }}
        getItemLayout={(_, index) => ({
          length: gridItemSize + GRID_SPACING,
          offset: (gridItemSize + GRID_SPACING) * index,
          index,
        })}
      />
    )
  }

  const SingleImageView = () => {
    if (pics.length === 0) {
      return (
        <View style={styles.singleImageFullContainer}>
          <View style={[styles.singleImagePage, { justifyContent: 'center', alignItems: 'center' }]}>
            <ThemedText style={{ color: 'white' }}>No images to display</ThemedText>
          </View>
        </View>
      )
    }

    const dots = getWindowedDots()

    return (
      <View style={styles.singleImageFullContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.singleImageScroll}
          contentOffset={{ x: currentIndex * SCREEN_WIDTH, y: 0 }}
          onMomentumScrollEnd={handleSingleImageScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {pics.map((pic, index) => {
            const imageId = pic.id || pic.publicId || `image-${index}`
            const hasError = imageLoadErrors[imageId]

            return (
              <View key={index} style={styles.singleImagePage}>
                <View style={styles.singleImageWrapper}>
                  {hasError ? (
                    <View style={[styles.singleImageWrapper, styles.singleImageError]}>
                      <Feather name="image" size={48} color="#666" />
                      <ThemedText style={styles.errorText}>Failed to load image</ThemedText>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: pic.url }} 
                      style={styles.singleImage} 
                      contentFit="contain"
                      onError={() => handleImageError(imageId)}
                    />
                  )}
                </View>
              </View>
            )
          })}
        </ScrollView>

        {pics.length > 1 && (
          <View style={styles.bottomControlsWrapper}>
            <View style={styles.bottomControlsInner}>
              <TouchableOpacity
                onPress={handlePrevPress}
                disabled={currentIndex === 0}
                activeOpacity={0.9}
                style={[
                  styles.navArrowButtonSmall,
                  currentIndex === 0 && styles.navArrowButtonDisabled,
                ]}
              >
                <Ionicons name="chevron-back" size={18} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.paginationDotsRow}>
                {dots.map((dot) => {
                  let dotStyle = styles.dotTiny
                  if (dot.size === 'small') dotStyle = styles.dotSmall
                  if (dot.size === 'medium') dotStyle = styles.dotMedium

                  return (
                    <TouchableOpacity
                      key={dot.key}
                      onPress={() => handleDotPress(dot.index)}
                      activeOpacity={0.8}
                    >
                      <View style={dotStyle} />
                    </TouchableOpacity>
                  )
                })}
              </View>

              <TouchableOpacity
                onPress={handleNextPress}
                disabled={currentIndex === pics.length - 1}
                activeOpacity={0.9}
                style={[
                  styles.navArrowButtonSmall,
                  currentIndex === pics.length - 1 && styles.navArrowButtonDisabled,
                ]}
              >
                <Ionicons name="chevron-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delete option menu */}
        {showDeleteOption && (
          <View style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 140 : 120,
            right: 20,
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            padding: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 200,
          }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
              onPress={openDeleteImageConfirmation}
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
              <ThemedText style={{ color: '#EF4444', fontSize: 16 }}>Delete Image</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  if (!visible) return null

  return (
    <>
      <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.modalContainer}>
          <Header />
          {viewMode === 'grid' ? <GridView /> : <SingleImageView />}
        </View>
      </Modal>

      {/* Delete Image Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false)
          setImageToDelete(null)
        }}
        onConfirm={handleDeleteImageConfirm}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  )
}

export default GalleryModal