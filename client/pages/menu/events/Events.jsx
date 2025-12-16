import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  StatusBar,
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
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import GalleryModal from './GalleryModal'

export default function Events({ visible, onClose }) {
  const { colors } = useTheme()
  const [groupExpanded, setGroupExpanded] = useState({0: true, 1: true})
  const [galleryModalVisible, setGalleryModalVisible] = useState(false)
  const [currentGroupData, setCurrentGroupData] = useState({
    pics: [],
    title: '',
  })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [initialViewMode, setInitialViewMode] = useState('grid')
  
  const windowWidth = Dimensions.get('window').width
  const BASE_SIZE = windowWidth - 56 // Account for scrollContent padding (16*2) + groupPicsContainer padding (12*2)
  
  const [schoolInfo] = useState({
    // Gallery
    pictures: [
      {
        title: 'Annual Day 2024',
        pics: [
          { uri: 'https://picsum.photos/400/300?random=1', description: 'Students performing on stage' },
          { uri: 'https://picsum.photos/400/300?random=2', description: 'Prize distribution ceremony' },
          { uri: 'https://picsum.photos/400/300?random=3', description: 'Audience cheering' },
          { uri: 'https://picsum.photos/400/300?random=4', description: 'Cultural dance performance' },
          { uri: 'https://picsum.photos/400/300?random=5', description: 'Chief guest address' },
          { uri: 'https://picsum.photos/400/300?random=15', description: 'Group photo' },
        ]
      },
      {
        title: "Children's Day",
        pics: [
          { uri: 'https://picsum.photos/400/300?random=6', description: 'Kids in fancy dress competition' },
          { uri: 'https://picsum.photos/400/300?random=7', description: 'Outdoor games and fun activities' },
          { uri: 'https://picsum.photos/400/300?random=8', description: 'Special assembly program' },
          { uri: 'https://picsum.photos/400/300?random=9', description: 'Cake cutting celebration' },
          { uri: 'https://picsum.photos/400/300?random=10', description: 'Group photo with teachers' },
          { uri: 'https://picsum.photos/400/300?random=11', description: 'Drawing competition winners' },
          { uri: 'https://picsum.photos/400/300?random=12', description: 'Students performing skit' },
          { uri: 'https://picsum.photos/400/300?random=13', description: 'Fun games' },
          { uri: 'https://picsum.photos/400/300?random=14', description: 'Prize distribution' },
        ]
      },
    ],
  })

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 15,
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
      width: 45,
      height: 45,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    schoolHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
    },
    schoolName: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
      padding: 16,
    },
    // Gallery Styles
    groupsContainer: {
      gap: 12,
    },
    groupContainer: {
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'rgba(0,0,0,0.05)', 
    },
    groupPicsContainer: {
      padding: 12, 
    },
    noGallery: {
      padding: 20,
      alignItems: 'center',
    },
    noGalleryText: {
      fontSize: 14,
      textAlign: 'center',
    },
    extraOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    extraText: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
    },
  })

  function getCenteredTopOffsets(sizes) {
    const tops = [0]
    for (let i = 1; i < sizes.length; i++) {
      const prevTop = tops[i - 1]
      const prevHeight = sizes[i - 1]
      const currHeight = sizes[i]
      const top = prevTop + (prevHeight / 2) - (currHeight / 2)
      tops.push(top)
    }
    return tops
  }

  const GalleryPreview = ({ pics, groupIndex, groupTitle }) => {
    const numPics = pics.length
    if (numPics === 0) return null

    const ratios = [1, 0.8, 0.6, 0.4]
    const IMAGE_SIZES = ratios.map(r => BASE_SIZE * r)
    const displayItems = pics.slice(0, 4)
    const extraCount = Math.max(0, numPics - 4)
    const usedSizes = IMAGE_SIZES.slice(0, displayItems.length)
    const topOffsets = getCenteredTopOffsets(usedSizes)
    const containerHeight = Math.max(
      ...usedSizes.map((size, i) => topOffsets[i] + size)
    )

    const openModal = () => {
      setInitialViewMode('grid')
      setCurrentGroupData({
        pics,
        title: groupTitle,
      })
      setSelectedImageIndex(0)
      setGalleryModalVisible(true)
    }

    return (
      <TouchableOpacity
        style={[
          {
            width: BASE_SIZE,
            height: containerHeight,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'visible',
          }
        ]}
        onPress={openModal}
        activeOpacity={0.9}
      >
        <View style={{ position: 'relative' }}>
          {displayItems.map((pic, idx) => {
            const size = usedSizes[idx]
            const visualSize = size - 10
            const offset = topOffsets[idx]
            const left = (BASE_SIZE - visualSize) / 2
            const zIndex = idx + 1
            const rotationDegrees = idx === 0 ? '0deg' : (idx % 2 === 0 ? '4deg' : '-4deg')

            return (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  width: visualSize,
                  height: visualSize,
                  top: offset + 3,
                  left: left - 1,
                  borderRadius: 10,
                  zIndex,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.cardBackground,
                  transform: [{ rotate: rotationDegrees }],
                }}
              >
                <Image
                  source={{ uri: pic.uri }}
                  style={{ width: visualSize, height: visualSize }}
                />
                {idx === displayItems.length - 1 && extraCount > 0 && (
                  <View style={styles.extraOverlay}>
                    <ThemedText style={styles.extraText}>+{extraCount}</ThemedText>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </TouchableOpacity>
    )
  }

  const renderGallery = () => {
    const pictures = schoolInfo.pictures || []
    
    if (pictures.length === 0) {
      return (
        <View style={styles.noGallery}>
          <ThemedText style={[styles.noGalleryText, { color: colors.textSecondary }]}>
            No gallery events available
          </ThemedText>
        </View>
      )
    }

    return (
      <View style={styles.groupsContainer}>
        {pictures.map((group, gIndex) => (
          <View key={gIndex} style={[styles.groupContainer, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.groupHeader, { backgroundColor: colors.cardBackground }]}
              onPress={() => {
                LayoutAnimation.easeInEaseOut()
                const newExpanded = { ...groupExpanded }
                newExpanded[gIndex] = !newExpanded[gIndex]
                setGroupExpanded(newExpanded)
              }}
              activeOpacity={0.9}
            >
              <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 16 }}>
                {group.title} ({group.pics.length})
              </ThemedText>
              <Feather
                name={groupExpanded[gIndex] ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            
            {groupExpanded[gIndex] && (
              <View style={styles.groupPicsContainer}>
                <GalleryPreview pics={group.pics} groupIndex={gIndex} groupTitle={group.title} />
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  const handleClose = () => {
    setGalleryModalVisible(false)
    setInitialViewMode('grid')
    setSelectedImageIndex(0)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
     
        {/* Header with School Name */}
        <LinearGradient
          colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleClose}
              >
                <FontAwesome5
                  name="chevron-left"
                  size={22}
                  color="#FFFFFF"
                  style={{ transform: [{ translateX: -1 }] }}
                />
              </TouchableOpacity>
              <View style={styles.schoolHeaderInfo}>
                <FontAwesome5 name="images" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText type="title" style={styles.schoolName}>
                  School Events ({schoolInfo.pictures.length})
                </ThemedText>
              </View>
              <View style={{ width: 45 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderGallery()}
        </ScrollView>

        {/* Gallery Modal */}
        <GalleryModal
          visible={galleryModalVisible}
          onClose={() => setGalleryModalVisible(false)}
          currentGroupData={currentGroupData}
          selectedImageIndex={selectedImageIndex}
          onImageIndexChange={setSelectedImageIndex}
          initialViewMode={initialViewMode}
        />
      </View>
    </Modal>
  )
}