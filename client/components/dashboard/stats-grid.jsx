import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, FontAwesome6, MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'

const { width } = Dimensions.get('window')

export default function StatsGrid() {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [statsData, setStatsData] = useState([])

  // Skeleton animation
  const [skeletonAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchDashboardStats()
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

  const fetchDashboardStats = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await axiosApi.get('/stats/dashboard')
      
      if (response.data.success) {
        setStatsData(response.data.data)
      } else {
        showToast(response.data.message || 'Failed to load statistics', 'error')
      }
    } catch (error) {
      console.error('Fetch dashboard stats error:', error)
      showToast(error.response?.data?.message || 'Failed to load statistics', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardStats(true)
  }

  const getIconComponent = (iconFamily, iconName, size, color) => {
    switch (iconFamily) {
      case 'FontAwesome6':
        return <FontAwesome6 name={iconName} size={size} color={color} />
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={size} color={color} />
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} size={size} color={color} />
      default:
        return <FontAwesome6 name={iconName} size={size} color={color} />
    }
  }

  const renderSkeletonCard = (index) => {
    const opacity = skeletonAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    })

    return (
      <View 
        key={`skeleton-${index}`} 
        style={[
          styles.statCard, 
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            width: (width - 40 - 10) / 2,
          }
        ]}
      >
        <View style={styles.topRow}>
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.inputBackground,
                opacity,
              }
            ]}
          />

          <View style={styles.valueTitleColumn}>
            <Animated.View 
              style={[
                styles.skeletonValue,
                {
                  backgroundColor: colors.inputBackground,
                  opacity,
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.skeletonTitle,
                {
                  backgroundColor: colors.inputBackground,
                  opacity,
                  marginTop: 8,
                }
              ]}
            />
          </View>
        </View>

        <View style={[
          styles.cornerDecor,
          { 
            backgroundColor: colors.textSecondary + '10',
          }
        ]} />
      </View>
    )
  }

  const renderStatCard = (stat, index) => (
    <View 
      key={index} 
      style={[
        styles.statCard, 
        { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          width: (width - 40 - 10) / 2,
        }
      ]}
    >
      <View style={styles.topRow}>
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: stat.gradient[0],
            shadowColor: stat.color,
          }
        ]}>
          <View style={[
            styles.gradientIcon,
            {
              backgroundColor: stat.gradient[1],
            }
          ]}>
            {getIconComponent(stat.iconFamily, stat.icon, 20, '#ffffff')}
          </View>
        </View>

        <View style={styles.valueTitleColumn}>
          <ThemedText type="title" style={[styles.statValue, { color: colors.text }]}>
            {stat.value}
          </ThemedText>
          <ThemedText type="default" style={[styles.statTitle, { color: colors.textSecondary }]}>
            {stat.title}
          </ThemedText>
        </View>
      </View>

      <View style={[
        styles.cornerDecor,
        { 
          backgroundColor: stat.color + '10',
        }
      ]} />
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
        Overview
      </ThemedText>
      {!loading && statsData.length > 0 && (
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <FontAwesome
            name="refresh" 
            size={22} 
            color={colors.tint} 
            style={refreshing && styles.refreshIconRotating}
          />
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <>
      <View style={styles.container}>
        {renderHeader()}
        
        <View style={styles.statsGrid}>
          {loading ? (
            // Show 4 skeleton cards while loading
            [1, 2, 3, 4].map((_, index) => renderSkeletonCard(index))
          ) : statsData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="bar-chart-2" size={48} color={colors.textSecondary + '40'} />
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                No Statistics Available
              </ThemedText>
              <ThemedText style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                Statistics will appear here once data is available
              </ThemedText>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.tint + '20' }]}
                onPress={handleRefresh}
              >
                <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
                  Retry
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            statsData.map((stat, index) => renderStatCard(stat, index))
          )}
        </View>
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
  container: {
    paddingHorizontal: 20,
    marginVertical: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
  },
  refreshIconRotating: {
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#00000090',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientIcon: {
    width: 45,
    height: 45,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueTitleColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  cornerDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    zIndex: -1,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 40,
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  // Skeleton styles
  skeletonValue: {
    width: 60,
    height: 24,
    borderRadius: 4,
  },
  skeletonTitle: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
})