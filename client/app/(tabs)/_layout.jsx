import React, { useState, useEffect, useMemo } from "react"
import { Tabs, useRouter } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import CustomTabBar from "@/components/ui/CustomTabBar"
import CustomHeader from "@/components/ui/CustomHeader"
import { useSelector } from "react-redux"

/* -------- ROLE TAB CONFIG -------- */
const roleTabs = {
  default: ["students", "profile"],
  principal: ["students", "employees", "profile"],
  vice_principal: ["students", "employees", "profile"],
  accountant: ["students", "employees", "cashflow", "index", "profile"],
  chairperson: ["students", "employees", "cashflow", "index", "profile"],
}

export default function TabLayout() {
  const { employee } = useSelector((state) => state.employee)
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [allowedTabs, setAllowedTabs] = useState([])
  const [hasRedirected, setHasRedirected] = useState(false)

  // Memoize role and allowed tabs to prevent unnecessary recalculations
  const role = useMemo(() => {
    return employee?.designation?.toLowerCase() || "default"
  }, [employee?.designation])

  const tabs = useMemo(() => {
    return roleTabs[role] || roleTabs.default
  }, [role])

  useEffect(() => {
    if (employee !== undefined) {
      setAllowedTabs(tabs)
      setIsReady(true)
    }
  }, [employee, tabs])

  // Handle initial redirect to the correct first tab
  useEffect(() => {
    if (isReady && allowedTabs.length > 0 && !hasRedirected) {
      // Determine the correct initial route based on role
      let initialRoute = allowedTabs[0]
      
      // For default role (teachers), prioritize students over index
      if (role === "default") {
        if (allowedTabs.includes("students")) {
          initialRoute = "students"
        }
      }
      
      // Only redirect if we're not already on the correct route
      setHasRedirected(true)
      
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        router.replace(`/(tabs)/${initialRoute}`)
      }, 100)
    }
  }, [isReady, allowedTabs, role, hasRedirected, router])

  const getIconNameForRoute = (routeName) => {
    switch (routeName) {
      case "students":
        return "students"
      case "employees":
        return "employees"
      case "index":
        return "home"
      case "cashflow":
        return "cashflow"
      case "profile":
        return "profile"
      default:
        return "school"
    }
  }

  // Show loading while determining role
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName="students" // Set a default initial route
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
        statusBarStyle: "light",
      }}
    >
      {/* Students Tab */}
      <Tabs.Screen
        name="students"
        options={{ 
          title: "Students", 
          tabBarIcon: () => null,
          href: allowedTabs.includes("students") ? "/(tabs)/students" : null
        }}
      />

      {/* Employees Tab */}
      <Tabs.Screen
        name="employees"
        options={{ 
          title: "Employees", 
          tabBarIcon: () => null,
          href: allowedTabs.includes("employees") ? "/(tabs)/employees" : null
        }}
      />

      {/* Dashboard/Index Tab */}
      <Tabs.Screen
        name="index"
        options={{ 
          title: "Dashboard", 
          tabBarIcon: () => null,
          href: allowedTabs.includes("index") ? "/(tabs)/index" : null
        }}
      />

      {/* Cashflow Tab */}
      <Tabs.Screen
        name="cashflow"
        options={{ 
          title: "Cashflow", 
          tabBarIcon: () => null,
          href: allowedTabs.includes("cashflow") ? "/(tabs)/cashflow" : null
        }}
      />

      {/* Profile Tab - Always available */}
      <Tabs.Screen
        name="profile"
        options={{ 
          title: "Profile", 
          tabBarIcon: () => null,
          href: "/(tabs)/profile"
        }}
      />
    </Tabs>
  )
}