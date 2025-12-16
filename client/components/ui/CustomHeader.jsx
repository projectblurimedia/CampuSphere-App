import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, FontAwesome5, MaterialIcons, FontAwesome6 } from '@expo/vector-icons'
import { ThemedText } from '@/components/ui/themed-text'
import { useNavigation } from 'expo-router'
import { useTheme } from '@/hooks/useTheme'
import DashboardMenu from '@/components/dashboard/dashboard-menu'
import StudentsMenu from '@/components/students/students-menu'
import StaffMenu from '@/components/staff/staff-menu'
import CashflowMenu from '@/components/cashflow/cashflow-menu'
import AcademicsMenu from '@/components/academics/academics-menu'

export default function CustomHeader({ title, showBackButton = false, iconName = 'school', currentRoute = 'index' }) {
  const navigation = useNavigation()
  const { colors, isDark } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  const handleMenuPress = () => {
    setMenuVisible(true)
  }

  const handleCloseMenu = () => {
    setMenuVisible(false)
  }

  const renderIcon = (name, size = 22, color = '#ffffff') => {
    switch(name) {
      case 'students':
        return <FontAwesome6 name="hands-holding-child" size={20} color={color} />
      case 'staff':
        return <FontAwesome5 name="chalkboard-teacher" size={18} color={color} />
      case 'home':
        return <MaterialIcons name="dashboard" size={size} color={color} />
      case 'cashflow':
        return <MaterialIcons name="payments" size={size} color={color} />
      case 'academics':
        return <MaterialIcons name="school" size={size} color={color} />
      default:
        return <MaterialIcons name="school" size={size} color={color} />
    }
  }

  // Dashboard menu colors
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

  // Render appropriate menu based on current route
  const renderMenu = () => {
    switch(currentRoute) {
      case 'index':
        return (
          <DashboardMenu
            visible={menuVisible}
            onClose={handleCloseMenu}
            dashboardColors={dashboardColors}
          />
        )
      case 'students':
        return (
          <StudentsMenu
            visible={menuVisible}
            onClose={handleCloseMenu}
          />
        )
      case 'staff':
        return (
          <StaffMenu
            visible={menuVisible}
            onClose={handleCloseMenu}
          />
        )
      case 'cashflow':
        return (
          <CashflowMenu
            visible={menuVisible}
            onClose={handleCloseMenu}
          />
        )
      case 'academics':
        return (
          <AcademicsMenu
            visible={menuVisible}
            onClose={handleCloseMenu}
          />
        )
      default:
        return (
          <DashboardMenu
            visible={menuVisible}
            onClose={handleCloseMenu}
            dashboardColors={dashboardColors}
          />
        )
    }
  }

  return (
    <>
      {Platform.OS === 'android' && (
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
      )}
      
      <LinearGradient
        colors={[colors?.gradientStart, colors?.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <View style={styles.leftSection}>
            {showBackButton ? (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={26} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconContainer}>
                {renderIcon(iconName, 26)}
              </View>
            )}
          </View>

          <View style={styles.centerSection}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.schoolName}>Bluri High School</ThemedText>
          </View>

          {/* Right section: Only 3 bars menu button */}
          <View style={styles.rightSection}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={handleMenuPress}
            >
              <Ionicons name="menu" size={26} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomAccent} />
      </LinearGradient>

      {renderMenu()}
    </>
  )
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    ...Platform.select({
      ios: {
        height: 110,
      },
      android: {
        height: 110,
      },
    }),
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    flex: 1,
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  schoolName: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  bottomAccent: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
})