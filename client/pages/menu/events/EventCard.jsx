import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons'

const EventCard = ({ event, tab, onView, onEdit, onDelete, colors, weekdayColors, renderImageGrid }) => {
  const dayIndex = new Date(event.date).getDay()
  const borderColor = weekdayColors[dayIndex]
  const hasImages = event.images && event.images.length > 0

  // Format date to "Wed Dec 23, 2025" format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  }

  const formattedDate = event.formattedDate || formatDate(event.date)

  const styles = StyleSheet.create({
    eventCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 0,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border + '30',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    eventHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    eventTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    eventTitle: {
      fontSize: 18,
      flex: 1,
      color: colors.text,
    },
    dateBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: borderColor + '20',
    },
    dateBadgeText: {
      fontSize: 12,
      marginLeft: 4,
      color: borderColor,
    },
    eventBody: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    eventDesc: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    eventFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '20',
      backgroundColor: colors.cardBackground + '80',
    },
    eventActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 10,
      flex: 1,
    },
    editAction: {
      backgroundColor: '#3B82F6',
    },
    deleteAction: {
      backgroundColor: '#EF4444',
    },
    actionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  })

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onView(event)}
      activeOpacity={0.9}
    >
      {/* Event Header */}
      <LinearGradient
        colors={[borderColor + '25', borderColor + '10']}
        style={styles.eventHeader}
      >
        <View style={styles.eventTitleContainer}>
          <ThemedText type='subtitle' style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </ThemedText>
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons name="calendar" size={14} color={borderColor} />
            <ThemedText type='subtitle' style={styles.dateBadgeText}>
              {formattedDate}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* Event Body */}
      <View style={styles.eventBody}>
        <ThemedText type='subtitle' style={styles.eventDesc} numberOfLines={2}>
          {event.description}
        </ThemedText>
        {hasImages && renderImageGrid(event.images, true, event.title)}
      </View>

      {/* Event Footer with full-width action buttons */}
      <View style={styles.eventFooter}>
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editAction]}
            onPress={() => onEdit(event)}
          >
            <Feather name="edit-2" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteAction]}
            onPress={() => onDelete(event._id)}
          >
            <Feather name="trash-2" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default EventCard