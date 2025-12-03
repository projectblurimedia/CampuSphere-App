import { View, StyleSheet, Dimensions } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { FontAwesome5, FontAwesome6, MaterialIcons, Feather } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function StatsGrid({ colors, dashboardColors }) {
  const statsData = [
    {
      title: 'Total Students',
      value: '1,248',
      change: '+5.2% this month',
      icon: <FontAwesome6 name="users" size={26} color="#ffffff" />,
      color: dashboardColors.info,
      trend: 'up',
      gradient: ['#3b82f6', '#1d4ed8'],
    },
    {
      title: 'Total Staff',
      value: '86',
      change: '+2 new hires',
      icon: <FontAwesome5 name="chalkboard-teacher" size={24} color="#ffffff" />,
      color: dashboardColors.purple,
      trend: 'up',
      gradient: ['#8b5cf6', '#7c3aed'],
    },
    {
      title: 'Monthly Revenue',
      value: '₹4.86L',
      change: '+12.5% from last month',
      icon: <MaterialIcons name="attach-money" size={28} color="#ffffff" />,
      color: dashboardColors.green,
      trend: 'up',
      gradient: ['#10b981', '#059669'],
    },
    {
      title: 'Attendance',
      value: '94.2%',
      change: '-1.8% from yesterday',
      icon: <FontAwesome6 name="clipboard-check" size={24} color="#ffffff" />,
      color: dashboardColors.orange,
      trend: 'down',
      gradient: ['#f97316', '#ea580c'],
    },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Overview</ThemedText>
        <ThemedText type="link" style={[styles.viewAll, { color: colors.tint }]}>This Month</ThemedText>
      </View>
      
      <View style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <View 
            key={index} 
            style={[
              styles.statCard, 
              { 
                backgroundColor: dashboardColors.cardBg,
              }
            ]}
          >
            {/* Top Row: Icon (left) and Value/Title (right column) */}
            <View style={styles.topRow}>
              {/* Icon on left */}
              <View style={[
                styles.iconContainer,
                {
                  backgroundColor: stat.gradient[0],
                  shadowColor: stat.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }
              ]}>
                <View style={[
                  styles.gradientIcon,
                  {
                    backgroundColor: stat.gradient[1],
                  }
                ]}>
                  {stat.icon}
                </View>
              </View>

              {/* Value and Title on right (in column) */}
              <View style={styles.valueTitleColumn}>
                <ThemedText type="title" style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </ThemedText>
                <ThemedText type="default" style={styles.statTitle}>
                  {stat.title}
                </ThemedText>
              </View>
            </View>

            {/* Bottom: Change container */}
            <View style={styles.changeContainer}>
              <View style={[
                styles.trendIndicator,
                { 
                  backgroundColor: stat.trend === 'up' ? 
                    dashboardColors.success + '20' : 
                    dashboardColors.danger + '20'
                }
              ]}>
                <Feather 
                  name={stat.trend === 'up' ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={stat.trend === 'up' ? dashboardColors.success : dashboardColors.danger} 
                />
              </View>
              <ThemedText 
                type="default" 
                style={[
                  styles.changeText, 
                  { 
                    color: stat.trend === 'up' ? dashboardColors.success : dashboardColors.danger,
                    fontWeight: '600'
                  }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {stat.change}
              </ThemedText>
            </View>

            {/* Decorative corner element */}
            <View style={[
              styles.cornerDecor,
              { 
                backgroundColor: stat.color + '10',
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 40,
              }
            ]} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#00000090',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 12,
  },
  gradientIcon: {
    width: 50,
    height: 50,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueTitleColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: -2,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  trendIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  cornerDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    zIndex: -1,
  },
})