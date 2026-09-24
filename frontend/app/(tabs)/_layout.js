import { Tabs } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { StyleSheet, Pressable } from "react-native";
import { renderIcon } from "../../components/TabComponent";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#000",
        tabBarPressColor: "transparent",
        tabBarActiveBackgroundColor: "transparent",
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{
              color: "transparent",
            }}
          />
        ),
        tabBarStyle: styles.tabs,
        tabBarItemStyle: {
          padding: 9,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: renderIcon("house", "#f08c00"),
        }}
      />
      <Tabs.Screen
        name="physical"
        options={{
          tabBarIcon: renderIcon("dumbbell", "#e03131"),
        }}
      />
      <Tabs.Screen
        name="mental"
        options={{
          tabBarIcon: renderIcon("brain", "#6741d9"),
        }}
      />
      <Tabs.Screen
        name="spiritual"
        options={{
          tabBarIcon: renderIcon("seedling", "#2b8a3e"),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: renderIcon("user-group", "#1971c2"),
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  tabs: {
    height: 60,
    marginBottom: 70,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
  },
});
