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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const GalleryModal = ({
  visible,
  onClose,
  currentGroupData,
  selectedImageIndex,
  onImageIndexChange,
  initialViewMode = 'grid',
}) => {
  const { colors } = useTheme()
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [currentIndex, setCurrentIndex] = useState(selectedImageIndex)
  const [isChangingMode, setIsChangingMode] = useState(false)
  const scrollViewRef = useRef(null)
  const flatListRef = useRef(null)

  const { pics = [], title = '' } = currentGroupData

  // Sync currentIndex with prop and clamp
  useEffect(() => {
    if (visible && pics.length > 0) {
      const clampedIndex = Math.max(0, Math.min(selectedImageIndex, pics.length - 1))
      setCurrentIndex(clampedIndex)
    }
  }, [selectedImageIndex, visible, pics.length])

  // Reset viewMode when modal opens
  useEffect(() => {
    if (visible) {
      setViewMode(initialViewMode)
    }
  }, [visible, initialViewMode])

  // Scroll FlatList to currentIndex when switching back to grid
  useEffect(() => {
    if (viewMode === 'grid' && flatListRef.current && pics.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: currentIndex,
          animated: false,
          viewPosition: 0.5, // Center the item
        })
      }, 100) // Small delay for re-render
      return () => clearTimeout(timer)
    }
  }, [viewMode, currentIndex, pics.length])

  const styles = useMemo(() => StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: '#000000',
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
    
    // Grid View Styles
    gridContainer: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 140 : 120,
      paddingBottom: 20,
      paddingHorizontal: 8,
    },
    gridItemTouchable: {
      flex: 1,
      margin: 4,
      borderRadius: 8,
      overflow: 'hidden',
      aspectRatio: 1,
    },
    gridImage: {
      width: '100%',
      height: '100%',
    },
    
    // Single Image View Styles
    singleImageScroll: {
      flex: 1,
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
    },
    singleImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    imageDescriptionContainer: {
      position: 'absolute',
      bottom: 100,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
    },
    imageDescription: {
      color: 'white',
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 12,
      borderRadius: 8,
    },
    paginationContainer: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      zIndex: 50,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    activePaginationDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#FFFFFF',
    },
    pageIndicator: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 140 : 120,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      zIndex: 50,
    },
    pageIndicatorText: {
      color: 'white',
      fontSize: 14,
    },
  }), [isChangingMode])

  const handleGridImagePress = useCallback((index) => {
    if (isChangingMode || pics.length === 0) return
    const clampedIndex = Math.max(0, Math.min(index, pics.length - 1))
    setIsChangingMode(true)
    setCurrentIndex(clampedIndex)
    setViewMode('single')
    onImageIndexChange(clampedIndex)
    setTimeout(() => setIsChangingMode(false), 300)
  }, [isChangingMode, pics.length, onImageIndexChange])

  const handleSingleImageScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(offsetX / SCREEN_WIDTH)
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < pics.length) {
      setCurrentIndex(newIndex)
      onImageIndexChange(newIndex)
    }
  }, [currentIndex, pics.length, onImageIndexChange])

  const handleBackPress = useCallback(() => {
    if (isChangingMode) return
    if (viewMode === 'single') {
      setIsChangingMode(true)
      setViewMode('grid')
      setTimeout(() => setIsChangingMode(false), 300)
    } else {
      onClose()
    }
  }, [isChangingMode, viewMode, onClose])

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
          
          <View style={{ width: 45 }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  )

  const GridView = () => (
    <FlatList
      ref={flatListRef}
      data={pics}
      keyExtractor={(item, index) => index.toString()}
      numColumns={3}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.gridItemTouchable}
          onPress={() => handleGridImagePress(index)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.uri }} style={styles.gridImage} />
        </TouchableOpacity>
      )}
    />
  )

  const SingleImageView = () => (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.singleImageScroll}
      contentOffset={{ x: currentIndex * SCREEN_WIDTH, y: 0 }}
      onMomentumScrollEnd={handleSingleImageScroll}
      scrollEventThrottle={16}
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
  )

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <Header />
        
        {viewMode === 'grid' ? <GridView /> : <SingleImageView />}
        
        {/* Pagination Dots for Single Image View */}
        {viewMode === 'single' && pics.length > 1 && (
          <View style={styles.paginationContainer}>
            {pics.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.activePaginationDot
                ]}
              />
            ))}
          </View>
        )}
        
        {/* Page Indicator for Single Image View */}
        {viewMode === 'single' && pics.length > 0 && (
          <View style={styles.pageIndicator}>
            <ThemedText style={styles.pageIndicatorText}>
              {currentIndex + 1} / {pics.length}
            </ThemedText>
          </View>
        )}
      </View>
    </Modal>
  )
}

export default GalleryModal