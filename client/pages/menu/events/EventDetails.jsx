import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  FontAwesome5,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons'

const EventDetails = ({ visible, event, onClose, colors, weekdayColors, renderImageGrid, onGalleryOpen }) => {
  if (!visible || !event) return null

  const eventDate = new Date(event.date)
  const dayIndex = eventDate.getDay()
  const borderColor = weekdayColors[dayIndex]

  const styles = StyleSheet.create({
    viewModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
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
    viewModalBody: {
      flex: 1,
      padding: 20,
    },
    viewEventTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
    },
    viewEventDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    viewEventDesc: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 24,
      color: colors.text,
    },
    imagesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 80,
      justifyContent: 'center',
    },
    actionText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
  })

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.viewModalContainer}>
        <LinearGradient
          colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
          style={styles.modalHeader}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={onClose}
              >
                <FontAwesome5 name="chevron-left" size={20} color="#FFFFFF" style={{ marginLeft: -2 }} />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <ThemedText type="subtitle" style={styles.modalTitle}>Event Details</ThemedText>
                <ThemedText style={styles.modalSubtitle}>View event information</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView style={styles.viewModalBody} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 4,
              height: 40,
              backgroundColor: borderColor,
              borderRadius: 2,
              marginRight: 12,
            }} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.viewEventTitle}>
                {event.title}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialCommunityIcons name="calendar" size={16} color={borderColor} />
                <ThemedText style={[styles.viewEventDate, { color: borderColor, marginLeft: 8 }]}>
                  {event.formattedDate || event.date.split('T')[0]}
                </ThemedText>
              </View>
            </View>
          </View>
          
          <ThemedText style={styles.viewEventDesc}>
            {event.description}
          </ThemedText>
          
          {event.images && event.images.length > 0 && (
            <>
              <View style={styles.imagesHeader}>
                <ThemedText style={styles.inputLabel}>Event Gallery</ThemedText>
                <ThemedText style={{ color: borderColor, fontWeight: '600' }}>
                  {event.images.length} photos
                </ThemedText>
              </View>
              {renderImageGrid(event.images, true, event.title)}
              
              {event.images.length > 3 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { 
                    backgroundColor: borderColor, 
                    marginTop: 16,
                    alignSelf: 'center'
                  }]}
                  onPress={() => onGalleryOpen(event.images, 0, event.title)}
                >
                  <Feather name="grid" size={14} color="#FFFFFF" />
                  <ThemedText style={styles.actionText}>View All Photos</ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default EventDetails