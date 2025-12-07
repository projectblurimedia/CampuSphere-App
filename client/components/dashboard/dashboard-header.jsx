import { View, StyleSheet, TouchableOpacity, Platform, useColorScheme } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const Colors = {
  light: {
    title: '#0d3755',
    text: '#11181C',
    textSecondary: '#687076',
    background: '#fafdff',
    tint: '#1d9bf0',
    icon: '#496078',
    tabIconDefault: '#637785',
    tabIconSelected: '#1d9bf0',
    tabBarBackground: '#fafdff',
    cardBackground: '#FFFFFF',
    border: '#E6E8EB',
    accent: '#1d9bf0',
  },
  dark: {
    title: '#c1d7e7',
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0c0f14',
    tint: '#1d9bf0',
    icon: '#cad5e0',
    tabIconDefault: '#728390',
    tabIconSelected: '#1d9bf0',
    tabBarBackground: '#0c0f14',
    cardBackground: '#1A1D21',
    border: '#2D3748',
    accent: '#1d9bf0',
  },
}

export default function DashboardHeader() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme || 'light']
  
  // Dashboard specific colors derived from theme
  const dashboardColors = {
    primary: colors.tint,
    secondary: colors.textSecondary,
    background: colors.cardBackground,
    border: colors.border,
    accent: colors.accent,
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {/* Elegant gradient background */}
      <LinearGradient
        colors={[colors.tint + '08', colors.tint + '02', colors.cardBackground]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Subtle border */}
      <View style={[styles.border, { borderColor: colors.border }]} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* School logo with elegant design */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={[colors.tint, colors.tint + 'CC']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="school" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="star" size={10} color="#FFFFFF" />
            </View>
          </View>
          
          <View style={styles.schoolInfo}>
            <View style={styles.schoolHeader}>
              <ThemedText type="title" style={[styles.schoolName, { color: colors.title }]}>
                Bluri High School
              </ThemedText>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint + '10' }]}>
                  <Ionicons name="location" size={12} color={colors.tint} />
                </View>
                <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                  Kannapuram
                </ThemedText>
              </View>
              
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              
              <View style={styles.detailItem}>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint + '10' }]}>
                  <Ionicons name="calendar" size={12} color={colors.tint} />
                </View>
                <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                  Est. 2002
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
        
        {/* Enhanced Menu button with bars icon */}
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.menuButton}
        >
          <View style={[styles.menuButtonContainer, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
            <Ionicons name="menu" size={20} color={colors.tint} />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Separator above motto */}
      <View style={[styles.mottoSeparator, { backgroundColor: colors.border }]} />
      
      {/* School motto with enhanced styling */}
      <View style={styles.mottoContainer}>
        <View style={[styles.mottoDecoration, { backgroundColor: colors.tint + '20' }]} />
        <ThemedText style={[styles.mottoText, { color: colors.textSecondary }]}>
          Excellence in Education • Character Building
        </ThemedText>
        <View style={[styles.mottoDecoration, { backgroundColor: colors.tint + '20' }]} />
      </View>
      
      {/* Bottom accent line */}
      <View style={[styles.bottomAccent, { backgroundColor: colors.tint }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        shadowColor: '#000',
      },
    }),
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 20,
    pointerEvents: 'none',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logoWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  schoolInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginRight: 8,
    marginBottom: -8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  separator: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
  },
  menuButton: {
    marginLeft: 8,
  },
  menuButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mottoSeparator: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  mottoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mottoDecoration: {
    width: 24,
    height: 1,
    borderRadius: 0.5,
  },
  mottoText: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    marginHorizontal: 12,
    textAlign: 'center',
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  bottomAccent: {
    height: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
})