// app/components/CustomTabBar.jsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }) {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light']?.tint;
  const iconColor = Colors[colorScheme ?? 'light']?.icon;
  const backgroundColor = Colors[colorScheme ?? 'light']?.background;

  // Calculate tab width
  const tabWidth = (width - 40) / 5; // 40 is total horizontal padding

  const allTabs = [
    { 
      name: 'students', 
      label: 'Students', 
      icon: (color) => (
        <FontAwesome6 name="hands-holding-child" size={24} color={color} />
      )
    },
    { 
      name: 'staff', 
      label: 'Staff', 
      icon: (color) => (
        <FontAwesome5 name="chalkboard-teacher" size={22} color={color} />
      )
    },
    { 
      name: 'index', 
      label: 'Dashboard', 
      icon: (color, isFocused) => (
        <View style={[
          styles.dashboardIconContainer,
          isFocused && styles.dashboardIconContainerFocused
        ]}>
          <MaterialIcons 
            name="dashboard" 
            size={28} 
            color={isFocused ? '#FFFFFF' : color} 
          />
        </View>
      ),
      isCenter: true
    },
    { 
      name: 'cashflow', 
      label: 'Cash Flow', 
      icon: (color) => (
        <MaterialIcons name="payments" size={24} color={color} />
      )
    },
    { 
      name: 'settings', 
      label: 'Settings', 
      icon: (color) => (
        <MaterialIcons name="settings" size={22} color={color} />
      )
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Floating background for center tab */}
      <View style={styles.floatingBackground}>
        {/* Glass effect tab bar */}
        <BlurView
          intensity={85}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.tabBar}
        >
          {/* Background overlay for enhanced glass effect */}
          <View style={[
            styles.glassOverlay,
            { 
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(25, 25, 25, 0.8)' 
                : 'rgba(255, 255, 255, 0.9)' 
            }
          ]} />
          
          {/* Border top for separation */}
          <View style={[
            styles.borderTop,
            { 
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(0, 0, 0, 0.08)' 
            }
          ]} />
          
          {/* Container for all tabs */}
          <View style={styles.tabsContainer}>
            {allTabs.map((tab, index) => {
              const route = state.routes.find((r) => r.name === tab.name);
              const isFocused = state.index === state.routes.findIndex((r) => r.name === tab.name);
              
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(tab.name);
                }
              };

              if (tab.isCenter) {
                return (
                  <TouchableOpacity
                    key={tab.name}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    onPress={onPress}
                    style={styles.centerTabWrapper}
                  >
                    {/* Floating circular background - only visible when selected */}
                    <View style={[
                      styles.centerTabBackground,
                      isFocused && { backgroundColor: tintColor },
                      !isFocused && { 
                        backgroundColor: colorScheme === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.05)' 
                      }
                    ]}>
                      <View style={styles.centerTabContent}>
                        {tab.icon(isFocused ? '#FFFFFF' : iconColor, isFocused)}
                        <Text style={[
                          styles.centerLabel,
                          { 
                            color: isFocused ? '#FFFFFF' : iconColor,
                            fontSize: isFocused ? 11 : 10
                          }
                        ]}>
                          {tab.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={tab.name}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={onPress}
                  style={[styles.tab, { width: tabWidth }]}
                >
                  <View style={styles.tabContent}>
                    {tab.icon(isFocused ? tintColor : iconColor)}
                    <Text style={[
                      styles.label,
                      { color: isFocused ? tintColor : iconColor }
                    ]}>
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 90,
  },
  floatingBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 15,
    position: 'relative',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerTabWrapper: {
    position: 'absolute',
    left: '50%',
    marginLeft: -40,
    bottom: 15,
    zIndex: 10,
  },
  centerTabBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  centerTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dashboardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dashboardIconContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  centerLabel: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});