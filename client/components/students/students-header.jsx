import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome6, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function StudentHeader({ dashboardColors }) {
  const { colors } = useTheme()
  
  return (
    <View style={[styles.header, { 
      backgroundColor: colors.background,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24 
    }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome6
              name="hands-holding-child" 
              size={22} 
              color={dashboardColors.info} 
            />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
              Student Section
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Manage all students
            </ThemedText>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.notificationBtn, { 
            backgroundColor: colors.cardBackground,
            borderColor: dashboardColors.border 
          }]}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.decorationRow}>
        <View style={[styles.dot, { backgroundColor: dashboardColors.info }]} />
        <View style={[styles.dot, { backgroundColor: dashboardColors.success }]} />
        <View style={[styles.dot, { backgroundColor: dashboardColors.warning }]} />
        <View style={[styles.dot, { backgroundColor: dashboardColors.purple }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  decorationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
})