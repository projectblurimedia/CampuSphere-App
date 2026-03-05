import React, { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather, FontAwesome } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'

export default function UpcomingEvents({ limit = 4 }) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [toast, setToast] = useState(null)
  
  // Skeleton animation
  const [skeletonAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchUpcomingEvents()
    startSkeletonAnimation()
  }, [])

  const startSkeletonAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/events/upcoming', {
        params: {
          limit: limit,
          sortBy: 'date',
          sortOrder: 'asc'
        }
      })
      
      if (response.data.success) {
        setEvents(response.data.data)
      } else {
        showToast(response.data.message || 'Failed to load upcoming events', 'error')
        setEvents([])
      }
    } catch (error) {
      console.error('Fetch upcoming events error:', error)
      showToast(error.response?.data?.message || 'Failed to load upcoming events', 'error')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (dateString) => {
    const date = new Date(dateString)
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase()
    }
  }

  // Generate colors based on theme
  const getEventColor = (index) => {
    const themeColors = [
      colors.info || colors.tint,
      colors.success || '#4CAF50',
      colors.warning || '#FFC107',
      colors.error || '#F44336',
      colors.primary,
    ]
    return themeColors[index % themeColors.length]
  }

  const renderSkeletonItem = (index) => {
    const opacity = skeletonAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    })

    return (
      <View 
        key={`skeleton-${index}`}
        style={[
          styles.eventItem,
          index < 3 && [styles.eventBorder, { borderColor: colors.border }]
        ]}
      >
        <Animated.View 
          style={[
            styles.eventDate,
            { 
              backgroundColor: colors.inputBackground,
              opacity,
            }
          ]}
        />
        <View style={styles.eventContent}>
          <Animated.View 
            style={[
              {
                backgroundColor: colors.inputBackground,
                opacity,
                width: '70%',
                height: 16,
                borderRadius: 4,
                marginBottom: 8,
              }
            ]}
          />
          <Animated.View 
            style={[
              {
                backgroundColor: colors.inputBackground,
                opacity,
                width: '90%',
                height: 14,
                borderRadius: 4,
              }
            ]}
          />
        </View>
      </View>
    )
  }

  const renderEventItem = (event, index) => {
    const { day, month } = formatEventDate(event.date)
    const eventColor = getEventColor(index)
    
    return (
      <View 
        key={event.id || index}
        style={[
          styles.eventItem,
          index < events.length - 1 && [styles.eventBorder, { borderColor: colors.border }]
        ]}
      >
        <View style={[styles.eventDate, { backgroundColor: eventColor + '15' }]}>
          <ThemedText type="title" style={[styles.eventDay, { color: eventColor }]}>
            {day}
          </ThemedText>
          <ThemedText type="default" style={[styles.eventMonth, { color: eventColor }]}>
            {month}
          </ThemedText>
        </View>
        
        <View style={styles.eventContent}>
          <ThemedText 
            type="subtitle" 
            style={{ color: colors.text, fontSize: 16, marginBottom: -2 }}
            numberOfLines={1}
          >
            {event.title}
          </ThemedText>
          <ThemedText 
            style={{ color: colors.textSecondary, fontSize: 13 }}
            numberOfLines={1}
          >
            {event.description}
          </ThemedText>
        </View>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { 
      backgroundColor: colors.cardBackground,
      borderColor: colors.border 
    }]}>
      <Feather name="calendar" size={40} color={colors.textSecondary + '40'} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        No Upcoming Events
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        There are no upcoming events scheduled
      </ThemedText>
    </View>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.eventsContainer, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.border 
        }]}>
          {[1, 2, 3].map((_, index) => renderSkeletonItem(index))}
        </View>
      )
    }

    if (events.length === 0) {
      return renderEmptyState()
    }

    return (
      <View style={[styles.eventsContainer, { 
        backgroundColor: colors.cardBackground, 
        borderColor: colors.border 
      }]}>
        {events.slice(0, limit).map((event, index) => renderEventItem(event, index))}
      </View>
    )
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Events
          </ThemedText>
          {!loading && events.length > 0 && (
            <TouchableOpacity activeOpacity={0.8} onPress={fetchUpcomingEvents}>
              <FontAwesome name="refresh" size={20} color={colors.tint} />
            </TouchableOpacity>
          )}
        </View>
        
        {renderContent()}
      </View>

      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={() => setToast(null)}
        position="bottom-center"
        duration={3000}
        showCloseButton={true}
      />
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 0,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
  },
  eventsContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  eventBorder: {
    borderBottomWidth: 1,
  },
  eventDate: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: '700',
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: -6,
    textTransform: 'uppercase',
  },
  eventContent: {
    flex: 1,
    marginRight: 8,
  },
  emptyContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
})