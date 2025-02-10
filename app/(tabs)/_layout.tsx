import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { usePlayerStore } from "../../hooks/usePlayerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { songs } from "@/data/songs";

export default function TabLayout() {
  const { showPlayer } = usePlayerStore();
  const { currentSong, isPlaying, togglePlayPause } = useAudioPlayer(songs);
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
              borderTopWidth: 0,
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
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 40,
              }}
            >
              <FontAwesome
                name="home"
                size={24}
                color={focused ? "#4c1d95" : "#666"}
                style={
                  focused
                    ? {
                        textShadowColor: "#4c1d95",
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 20,
                        shadowColor: "#6d28d9",
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 20,
                        shadowOpacity: 0.8,
                      }
                    : {}
                }
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 40,
              }}
            >
              <FontAwesome
                name="search"
                size={24}
                color={focused ? "#4c1d95" : "#666"}
                style={
                  focused
                    ? {
                        textShadowColor: "#4c1d95",
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 20,
                        shadowColor: "#6d28d9",
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 20,
                        shadowOpacity: 0.8,
                      }
                    : {}
                }
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 40,
              }}
            >
              <MaterialCommunityIcons
                name="bookshelf"
                size={24}
                color={focused ? "#4c1d95" : "#666"}
                style={
                  focused
                    ? {
                        textShadowColor: "#4c1d95",
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 20,
                        shadowColor: "#6d28d9",
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 20,
                        shadowOpacity: 0.8,
                      }
                    : {}
                }
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
