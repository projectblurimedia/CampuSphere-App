import { ScrollView, View } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import StatsGrid from '@/components/dashboard/stats-grid'
import QuickActions from '@/components/dashboard/quick-actions'
import RecentActivity from '@/components/dashboard/recent-activity'
import UpcomingEvents from '@/components/dashboard/upcoming-events'

export default function HomeScreen() {
  const { colors, isDark } = useTheme()

  const dashboardColors = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e9ecef',
    success: isDark ? '#34d399' : '#10b981',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    info: isDark ? '#60a5fa' : '#3b82f6',
    danger: isDark ? '#f87171' : '#ef4444',
    purple: isDark ? '#a78bfa' : '#8b5cf6',
    cyan: isDark ? '#22d3ee' : '#06b6d4',
    green: isDark ? '#34d399' : '#10b981',
    orange: isDark ? '#fb923c' : '#f97316',
    pink: isDark ? '#f472b6' : '#ec4899',
    teal: isDark ? '#2dd4bf' : '#14b8a6',
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <StatsGrid colors={colors} dashboardColors={dashboardColors} />
        <QuickActions colors={colors} dashboardColors={dashboardColors} />
        <RecentActivity colors={colors} dashboardColors={dashboardColors} />
        <UpcomingEvents colors={colors} dashboardColors={dashboardColors} />
      </ScrollView>
    </View>
  )
}