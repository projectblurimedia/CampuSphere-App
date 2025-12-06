import { Tabs } from 'expo-router'
import React from 'react'
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import { useColorScheme } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const tintColor = Colors[colorScheme ?? 'light']?.tint
  const iconColor = Colors[colorScheme ?? 'light']?.icon

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: iconColor,
        headerShown: false,
        tabBarStyle: {
          height: 70, 
          paddingTop: 7,
          paddingBottom: 10,
          backgroundColor: Colors[colorScheme ?? 'light']?.tabBarBackground, 
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => <FontAwesome6 name="hands-holding-child" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="chalkboard-teacher" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cashflow"
        options={{
          title: 'Cash Flow',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="payments" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          title: 'Academics',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="payments" size={26} color={color} />,
        }}
      />
    </Tabs>
  )
}
