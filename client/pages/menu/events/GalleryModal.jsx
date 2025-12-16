import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  StatusBar,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const GRID_SPACING = 4
const GRID_COLUMNS = 3
const MAX_DOTS = 5 // max dots visible in bar

const GalleryModal = ({
  visible = false,
  onClose,
  currentGroupData = {},
  selectedImageIndex = 0,
  onImageIndexChange,
  initialViewMode = 'grid',
}) => {
  const { colors } = useTheme()
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [currentIndex, setCurrentIndex] = useState(selectedImageIndex)
  const [isChangingMode, setIsChangingMode] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const scrollViewRef = useRef(null)
  const flatListRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const { pics = [], title = 'Gallery' } = currentGroupData || {}

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
      setMenuVisible(false)
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
          paddingTop: Platform.OS === 'ios' ? 70 : 50,
          paddingBottom: 15,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        backButton: {
          width: 45,
          height: 45,
          borderRadius: 22,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          opacity: isChangingMode ? 0.5 : 1,
        },
        headerTitle: {
          flex: 1,
          marginHorizontal: 16,
        },
        titleText: {
          fontSize: 18,
          color: '#FFFFFF',
        },
        menuButton: {
          width: 45,
          height: 45,
          borderRadius: 22,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
        menuContainer: {
          position: 'absolute',
          top: Platform.OS === 'ios' ? 140 : 120,
          right: 20,
          backgroundColor: colors.cardBackground,
          padding: 8,
          borderRadius: 12,
          gap: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 1000,
          minWidth: 140,
        },
        menuOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          gap: 10,
        },
        menuOptionText: {
          color: colors.text,
          fontSize: 16,
          flex: 1,
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
        addButtonContainer: {
          backgroundColor: colors.primary || '#3b82f6',
          justifyContent: 'center',
          alignItems: 'center',
        },

        singleImageScroll: {
          flex: 1,
          backgroundColor: '#000000',
        },
        singleImagePage: {
          width: SCREEN_WIDTH,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        },
        singleImageContainer: {
          width: '100%',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        },
        singleImage: {
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
        },
        imageDescriptionContainer: {
          position: 'absolute',
          bottom: 110,
          left: 20,
          right: 20,
        },
        imageDescription: {
          color: 'white',
          fontSize: 16,
          textAlign: 'center',
          lineHeight: 22,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: 12,
          borderRadius: 10,
          overflow: 'hidden',
        },

        currentIndexIndicator: {
          position: 'absolute',
          top: 10,
          alignSelf: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          paddingHorizontal: 15,
          paddingVertical: 5,
          borderRadius: 15,
          zIndex: 20,
        },
        currentIndexText: {
          color: 'white',
          fontSize: 14,
          fontWeight: '600',
        },

        bottomControlsWrapper: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 40,
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
    [isChangingMode, colors, gridItemSize],
  )

  const handleGridImagePress = useCallback(
    (index) => {
      if (isChangingMode || pics.length === 0 || index >= pics.length) return
      const clampedIndex = Math.max(0, Math.min(index, pics.length - 1))
      setIsChangingMode(true)
      setCurrentIndex(clampedIndex)
      setViewMode('single')
      if (onImageIndexChange) onImageIndexChange(clampedIndex)
      setTimeout(() => setIsChangingMode(false), 300)
    },
    [isChangingMode, pics.length, onImageIndexChange],
  )

  const handleAddPicPress = useCallback(() => {
    console.log('Add new picture')
  }, [])

  const handleSingleImageScroll = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const newIndex = Math.round(offsetX / SCREEN_WIDTH)
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < pics.length) {
        setCurrentIndex(newIndex)
        if (onImageIndexChange) onImageIndexChange(newIndex)
      }
    },
    [currentIndex, pics.length, onImageIndexChange],
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
      setTimeout(() => setIsChangingMode(false), 300)
    } else {
      if (onClose) onClose()
    }
  }, [isChangingMode, viewMode, onClose])

  const handleMenuPress = useCallback((action) => {
    setMenuVisible(false)
    if (action === 'edit') {
      console.log('Edit gallery')
    } else if (action === 'delete') {
      console.log('Delete gallery')
    }
  }, [])

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
    [pics.length, onImageIndexChange],
  )

  // Compute windowed dots: up to 5 positions centered around currentIndex.
  const getWindowedDots = () => {
    const total = pics.length
    if (total === 0) return []

    if (total <= MAX_DOTS) {
      // Just show one dot per page, with scaled size for neighbors.
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

    // total > MAX_DOTS
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

    // if there are items before start, show tiny leading indicator
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

    // if there are items after end, show tiny trailing indicator
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
              size={22}
              color="#FFFFFF"
              style={{ transform: [{ translateX: -1 }] }}
            />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <ThemedText type="title" style={styles.titleText}>
              {title}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
            disabled={isChangingMode}
          >
            <Feather name="more-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleMenuPress('edit')}
              activeOpacity={0.7}
            >
              <Feather name="edit" size={18} color={colors.text || '#000'} />
              <ThemedText style={styles.menuOptionText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleMenuPress('delete')}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={18} color={colors.text || '#000'} />
              <ThemedText style={styles.menuOptionText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      )}
    </LinearGradient>
  )

  const GridView = () => {
    if (pics.length === 0) {
      return (
        <View style={[styles.gridContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ThemedText>No images available</ThemedText>
        </View>
      )
    }

    const gridData = []
    for (let i = 0; i < pics.length; i += GRID_COLUMNS) {
      gridData.push(pics.slice(i, i + GRID_COLUMNS))
    }

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

              return (
                <TouchableOpacity
                  key={absoluteIndex}
                  style={[
                    styles.gridItem,
                    colIndex === row.length - 1 && styles.gridItemLastInRow,
                  ]}
                  onPress={() => handleGridImagePress(absoluteIndex)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />
                </TouchableOpacity>
              )
            })}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={handleAddPicPress}
              activeOpacity={0.7}
            >
              <View style={[styles.gridImage, styles.addButtonContainer]}>
                <FontAwesome5 name="plus" size={30} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        }
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
        <View
          style={[styles.singleImageScroll, { justifyContent: 'center', alignItems: 'center' }]}
        >
          <ThemedText style={{ color: 'white' }}>No images to display</ThemedText>
        </View>
      )
    }

    const dots = getWindowedDots()

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {viewMode === 'single' && pics.length > 1 && (
          <View style={styles.currentIndexIndicator}>
            <ThemedText style={styles.currentIndexText}>
              {currentIndex + 1} / {pics.length}
            </ThemedText>
          </View>
        )}

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
          {pics.map((pic, index) => (
            <View key={index} style={styles.singleImagePage}>
              <View style={styles.singleImageContainer}>
                <Image source={{ uri: pic.uri }} style={styles.singleImage} resizeMode="contain" />
              </View>
              {pic.description && (
                <View style={styles.imageDescriptionContainer}>
                  <ThemedText style={styles.imageDescription} numberOfLines={3}>
                    {pic.description}
                  </ThemedText>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {pics.length > 1 && (
          <View style={styles.bottomControlsWrapper}>
            <View style={styles.bottomControlsInner}>
              {/* Left arrow */}
              <TouchableOpacity
                onPress={handlePrevPress}
                disabled={currentIndex === 0}
                activeOpacity={0.7}
                style={[
                  styles.navArrowButtonSmall,
                  currentIndex === 0 && styles.navArrowButtonDisabled,
                ]}
              >
                <Ionicons name="chevron-back" size={18} color="#ffffff" />
              </TouchableOpacity>

              {/* Windowed dots */}
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

              {/* Right arrow */}
              <TouchableOpacity
                onPress={handleNextPress}
                disabled={currentIndex === pics.length - 1}
                activeOpacity={0.7}
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
      </View>
    )
  }

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Header />
        {viewMode === 'grid' ? <GridView /> : <SingleImageView />}
      </View>
    </Modal>
  )
}

export default GalleryModal
