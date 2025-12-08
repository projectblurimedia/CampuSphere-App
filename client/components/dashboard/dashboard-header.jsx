import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import DashboardMenu from './dashboard-menu'

export default function DashboardHeader({ colors, dashboardColors }) {
  const [menuVisible, setMenuVisible] = useState(false)

  // Safe colors with fallbacks
  const safeColors = colors || {
    title: '#0d3755',
    text: '#11181C',
    background: '#fafdff',
    tint: '#1d9bf0',
    icon: '#496078',
    textSecondary: '#687076',
    cardBackground: '#FFFFFF',
    border: '#E6E8EB',
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: safeColors.cardBackground || '#FFFFFF' }]}>
        {/* Subtle border */}
        <View style={[styles.border, { borderColor: safeColors.border || '#E6E8EB' }]} />
        
        {/* Main content */}
        <View style={styles.content}>
          {/* School logo with elegant design */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={[safeColors.tint, '#0066cc']}
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
                <ThemedText type="title" style={[styles.schoolName, { color: safeColors.title }]}>
                  Bluri High School
                </ThemedText>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <View style={[styles.iconContainer, { backgroundColor: safeColors.tint + '20' }]}>
                    <Ionicons name="location" size={12} color={safeColors.tint} />
                  </View>
                  <ThemedText style={[styles.detailText, { color: safeColors.textSecondary || '#687076' }]}>
                    Kannapuram
                  </ThemedText>
                </View>
                
                <View style={[styles.separator, { backgroundColor: safeColors.border || '#E6E8EB' }]} />
                
                <View style={styles.detailItem}>
                  <View style={[styles.iconContainer, { backgroundColor: safeColors.tint + '20' }]}>
                    <Ionicons name="calendar" size={12} color={safeColors.tint} />
                  </View>
                  <ThemedText style={[styles.detailText, { color: safeColors.textSecondary || '#687076' }]}>
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
            onPress={() => setMenuVisible(true)}
          >
            <View style={[styles.menuButtonContainer, { 
              backgroundColor: safeColors.background || '#fafdff',
              borderColor: safeColors.border || '#E6E8EB' 
            }]}>
              <Ionicons name="menu" size={20} color={safeColors.tint} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Separator above motto */}
        <View style={[styles.mottoSeparator, { backgroundColor: safeColors.border || '#E6E8EB' }]} />
        
        {/* School motto with enhanced styling */}
        <View style={styles.mottoContainer}>
          <View style={[styles.mottoDecoration, { backgroundColor: safeColors.tint + '20' }]} />
          <ThemedText style={[styles.mottoText, { color: safeColors.textSecondary || '#687076' }]}>
            Excellence in Education • Character Building
          </ThemedText>
          <View style={[styles.mottoDecoration, { backgroundColor: safeColors.tint + '20' }]} />
        </View>
        
        {/* Bottom accent line */}
        <View style={[styles.bottomAccent, { backgroundColor: safeColors.tint }]} />
      </View>

      {/* Dashboard Menu */}
      <DashboardMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        colors={safeColors}
        dashboardColors={dashboardColors}
      />
    </>
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