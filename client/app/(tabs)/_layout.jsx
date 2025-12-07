import React from "react"
import { Tabs } from "expo-router"
import CustomTabBar from '@/components/ui/CustomTabBar'

export default function _layout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tabs.Screen 
        name="students" 
        options={{ 
          title: "Students",
          headerShown: false 
        }} 
      />
      <Tabs.Screen 
        name="staff" 
        options={{ 
          title: "Staff",
          headerShown: false 
        }} 
      />
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Dashboard",
          headerShown: false 
        }} 
      />
      <Tabs.Screen 
        name="cashflow" 
        options={{ 
          title: "Cashflow",
          headerShown: false 
        }} 
      />
      <Tabs.Screen 
        name="academics" 
        options={{ 
          title: "Academics",
          headerShown: false 
        }} 
      />
    </Tabs>
  )
}