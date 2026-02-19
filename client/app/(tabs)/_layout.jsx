import React from "react"
import { Tabs } from "expo-router"
import CustomTabBar from '@/components/ui/CustomTabBar'
import CustomHeader from '@/components/ui/CustomHeader'
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: ({ route, options }) => {
          const iconName = getIconNameForRoute(route.name)
          return (
            <CustomHeader 
              title={options.title || route.name}
              showBackButton={false}
              iconName={iconName}
              currentRoute={route.name} 
            />
          )
        },
        headerShown: true,
        statusBarStyle: 'light',
      }}
      initialRouteName="index"
    >
      <Tabs.Screen 
        name="students" 
        options={{ 
          title: "Students",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="employees" 
        options={{ 
          title: "Employees",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="cashflow" 
        options={{ 
          title: "Cashflow",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  )
}

function getIconNameForRoute(routeName) {
  switch(routeName) {
    case 'students':
      return 'students'
    case 'employees':
      return 'employees'
    case 'index':
      return 'home'
    case 'cashflow':
      return 'cashflow'
    case 'profile':
      return 'profile'
    default:
      return 'school'
  }
}