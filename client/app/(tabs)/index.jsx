import React, { useState, useCallback } from 'react'
import { ScrollView, View, RefreshControl } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import StatsGrid from '@/components/dashboard/stats-grid'
import UpcomingEvents from '@/components/dashboard/upcoming-events'
import QuickActions from '@/components/dashboard/quick-actions'
import { ToastNotification } from '@/components/ui/ToastNotification'

export default function HomeScreen() {
  const { colors } = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Trigger refresh in child components by updating key
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      showToast('Failed to refresh dashboard', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <StatsGrid key={`stats-${refreshKey}`} />
        <QuickActions key={`actions-${refreshKey}`} />
        <UpcomingEvents key={`events-${refreshKey}`} />
      </ScrollView>

      <ToastNotification
        visible={!!toast}
        type={toast?.type}
        message={toast?.message}
        onHide={() => setToast(null)}
        position="bottom-center"
        duration={3000}
        showCloseButton={true}
      />
    </View>
  )
}