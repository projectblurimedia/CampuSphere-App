import React from "react"
import { Tabs } from "expo-router"
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

  const role = employee?.designation?.toLowerCase() || "default"

  const allowedTabs = roleTabs[role] || roleTabs.default

  /* -------- INITIAL ROUTE LOGIC -------- */

  const getInitialRoute = () => {
    if (allowedTabs.includes("index")) return "index"
    if (allowedTabs.includes("students")) return "students"
    return allowedTabs[0]
  }

  const initialRoute = getInitialRoute()

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName={initialRoute}
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

      <Tabs.Screen
        name="students"
        options={{ title: "Students", tabBarIcon: () => null }}
      />

      <Tabs.Screen
        name="employees"
        options={{ title: "Employees", tabBarIcon: () => null }}
      />

      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: () => null }}
      />

      <Tabs.Screen
        name="cashflow"
        options={{ title: "Cashflow", tabBarIcon: () => null }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: () => null }}
      />

    </Tabs>
  )
}

function getIconNameForRoute(routeName) {
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