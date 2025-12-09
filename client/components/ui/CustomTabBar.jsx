import { View, TouchableOpacity, StyleSheet } from "react-native"
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated"
import { FontAwesome5, FontAwesome6, MaterialIcons, Feather } from "@expo/vector-icons"
import { useTheme } from '@/hooks/useTheme'

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme()

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.tabBarBackground,
      shadowColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    }]}>
      {state.routes.map((route, index) => {
        if (["_sitemap", "+not-found"].includes(route.name)) return null

        const { options } = descriptors[route.key]
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name

        const isFocused = state.index === index

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

        const getIconByRouteName = (routeName, color) => {
          switch (routeName) {
            case "students":
              return <FontAwesome6 name="hands-holding-child" size={22} color={color} />
            case "staff":
              return <FontAwesome5 name="chalkboard-teacher" size={20} color={color} />
            case "index":
              return <MaterialIcons name="dashboard" size={24} color={color} />
            case "cashflow":
              return <MaterialIcons name="payments" size={22} color={color} />
            case "academics":
              return <MaterialIcons name="school" size={22} color={color} />
            default:
              return <Feather name="home" size={20} color={color} />
          }
        }

        return (
          <AnimatedTouchableOpacity
            layout={LinearTransition.springify().mass(0.5)}
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              { 
                backgroundColor: isFocused ? colors.tabBarActive : "transparent",
                minWidth: isFocused ? 120 : 60,
              },
            ]}
          >
            {getIconByRouteName(
              route.name,
              isFocused ? '#FFFFFF' : colors.tabBarInactive
            )}
            {isFocused && (
              <Animated.Text
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[styles.text, { color: '#FFFFFF' }]}
              >
                {label}
              </Animated.Text>
            )}
          </AnimatedTouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    borderTopWidth: 0,
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
    fontWeight: "700",
    fontSize: 11,
    maxWidth: 80,
  },
})

export default CustomTabBar