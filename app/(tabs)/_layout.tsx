import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // 追加
import { usePlayerStore } from "../../hooks/usePlayerStore";

export default function TabLayout() {
  const { showPlayer } = usePlayerStore();
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: "bottom",
        headerStyle: {
          backgroundColor: "#000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          color: "#fff",
        },
        tabBarStyle: showPlayer
          ? { display: "none" }
          : {
              backgroundColor: "#000",
              borderTopColor: "#333",
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#666",
        tabBarShowLabel: false,
        tabBarItemStyle: {
          borderRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bookshelf" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
