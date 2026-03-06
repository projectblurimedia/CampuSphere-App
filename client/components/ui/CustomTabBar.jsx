import { View, TouchableOpacity, StyleSheet, Platform, Image } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated"
import { FontAwesome5, FontAwesome6, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "@/hooks/useTheme"
import { useSelector } from "react-redux"

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

const roleTabs = {
  default: ["students", "profile"],
  principal: ["students", "employees", "profile"],
  vice_principal: ["students", "employees", "profile"],
  accountant: ["students", "employees", "cashflow", "index", "profile"],
  chairperson: ["students", "employees", "cashflow", "index", "profile"],
}

const CustomTabBar = ({ state, navigation }) => {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const { employee } = useSelector((state) => state.employee)

  const role = employee?.designation?.toLowerCase() || "default"

  const allowedTabs = roleTabs[role] || roleTabs.default

  const getProfileImage = (isFocused = false) => {
    const color = isFocused ? "#FFFFFF" : colors.tabBarInactive

    if (employee?.profilePicUrl) {
      return (
        <Image
          source={{ uri: employee.profilePicUrl }}
          style={[
            styles.profileImage,
            isFocused && styles.profileImageFocused,
          ]}
        />
      )
    }

    return (
      <MaterialCommunityIcons
        name="account-circle"
        size={22}
        color={color}
      />
    )
  }

  /* ---------------- ICONS ---------------- */

  const getIconByRouteName = (routeName, color, isFocused) => {
    switch (routeName) {
      case "students":
        return <FontAwesome6 name="hands-holding-child" size={22} color={color} />

      case "employees":
        return <FontAwesome5 name="chalkboard-teacher" size={18} color={color} />

      case "index":
        return <MaterialIcons name="dashboard" size={24} color={color} />

      case "cashflow":
        return <MaterialIcons name="payments" size={22} color={color} />

      case "profile":
        return getProfileImage(isFocused)

      default:
        return null
    }
  }

  /* ---------------- LABELS ---------------- */

  const getLabelByRouteName = (routeName) => {
    switch (routeName) {
      case "students":
        return "Students"
      case "employees":
        return "Employees"
      case "index":
        return "Dashboard"
      case "cashflow":
        return "Cashflow"
      case "profile":
        return "Profile"
      default:
        return routeName
    }
  }

  /* ---------------- FILTER ROUTES ---------------- */

  const visibleRoutes = state.routes.filter((route) => {
    if (["_sitemap", "+not-found"].includes(route.name)) return false
    return allowedTabs.includes(route.name)
  })

  if (visibleRoutes.length === 0) return null

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          paddingBottom:
            Platform.OS === "ios"
              ? insets.bottom
              : Math.max(insets.bottom, 12),
          shadowColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.1)",
        },
      ]}
    >
      <View style={styles.innerContainer}>
        {visibleRoutes.map((route) => {
          const isFocused = state.routes[state.index].key === route.key

          const label = getLabelByRouteName(route.name)

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const icon = getIconByRouteName(
            route.name,
            isFocused ? "#FFFFFF" : colors.tabBarInactive,
            isFocused
          )

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              layout={LinearTransition.springify().mass(0.5)}
              onPress={onPress}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isFocused
                    ? colors.tabBarActive
                    : "transparent",
                  minWidth: isFocused ? 120 : 60,
                },
              ]}
              activeOpacity={0.7}
            >
              {icon}

              {isFocused && (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={[styles.text, { color: "#FFFFFF" }]}
                  numberOfLines={1}
                >
                  {label}
                </Animated.Text>
              )}
            </AnimatedTouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  innerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabItem: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginHorizontal: 2,
  },
  text: {
    marginLeft: 6,
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    maxWidth: 80,
    marginBottom: -2,
  },
  profileImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "transparent",
  },
  profileImageFocused: {
    borderColor: "#FFFFFF",
  },
})

export default CustomTabBar