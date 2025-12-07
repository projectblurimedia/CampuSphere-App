import { View, TouchableOpacity, StyleSheet, useColorScheme } from "react-native"
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated"
import { FontAwesome5, FontAwesome6, MaterialIcons, Feather } from "@expo/vector-icons"

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

const tintColor = '#1d9bf0'

const Colors = {
  light: {
    title: '#0d3755',
    text: '#11181C',
    background: '#fafdff',
    tint: tintColor,
    icon: '#496078',
    tabIconDefault: '#637785',
    tabIconSelected: tintColor,
    tabBarBackground: '#fafdff',
  },
  dark: {
    title: '#c1d7e7',
    text: '#ECEDEE',
    background: '#0c0f14',
    tint: tintColor,
    icon: '#cad5e0',
    tabIconDefault: '#728390',
    tabIconSelected: tintColor,
    tabBarBackground: '#0c0f14',
  },
}

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme || 'light']

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.tabBarBackground,
      shadowColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
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
                backgroundColor: isFocused ? colors.tint : "transparent",
                minWidth: isFocused ? 120 : 60,
              },
            ]}
          >
            {getIconByRouteName(
              route.name,
              isFocused ? colors.background : colors.tabIconDefault
            )}
            {isFocused && (
              <Animated.Text
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[styles.text, { color: colors.background }]}
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
    // Shadow for iOS
    shadowOffset: {
      width: 0,
      height: -5, // Negative height for top shadow
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20, // Shadow for Android
    borderTopWidth: 0, // Remove border top
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