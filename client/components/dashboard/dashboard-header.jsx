import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

export default function DashboardHeader({ colors, dashboardColors }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.tint + '10', colors.tint + '30']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Main header row */}
      <View style={styles.headerRow}>
        <View style={styles.schoolInfoContainer}>
          {/* School logo with gradient */}
          <LinearGradient
            colors={[colors.tint, '#3583dc']}
            style={styles.schoolLogo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="school" size={26} color="#ffffff" />
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="star" size={10} color="#ffd700" />
            </View>
          </LinearGradient>
          
          {/* School name and details */}
          <View style={styles.schoolInfo}>
            <ThemedText type="title" style={styles.schoolName}>
              Bluri High School
            </ThemedText>
            
            <View style={styles.schoolDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={12} color={colors.icon} />
                <ThemedText style={[styles.detailText, { color: colors.icon }]}>
                  Kannapuram
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.icon} />
                <ThemedText style={[styles.detailText, { color: colors.icon }]}>
                  Est. 2002
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Menu button */}
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.menuBtn, { backgroundColor: dashboardColors.cardBg }]}
        >
          <Ionicons name="menu" size={22} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* School motto - BELOW the main header row */}
      <View style={styles.mottoContainer}>
        <ThemedText style={[styles.schoolMotto, { color: colors.icon }]}>
          Excellence in Education • Character Building
        </ThemedText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 24,
  },
  headerRow: {
    padding: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  schoolInfoContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  schoolLogo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    opacity: .95,
    letterSpacing: -0.3,
  },
  schoolDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mottoContainer: {
    padding: 20,
    paddingTop: 15,
  },
  schoolMotto: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    opacity: 0.8,
    lineHeight: 18,
    textAlign: 'center',
  },
})