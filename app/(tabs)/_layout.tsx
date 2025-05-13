import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/components/common/Header";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useHeaderStore } from "@/hooks/useHeaderStore";
import { useAudioStore } from "@/hooks/useAudioStore";
import PlayerContainer from "@/components/player/PlayerContainer";

export default function TabLayout() {
  const { showPlayer } = usePlayerStore();
  const { showHeader } = useHeaderStore();
  const { currentSong } = useAudioStore();

  return (
    <>
      {showHeader && <Header />}
      <Tabs
        screenOptions={{
          tabBarPosition: "bottom",
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff" },
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
          tabBarItemStyle: { borderRadius: 10 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
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
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="magnify"
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
        <Tabs.Screen
          name="genre/[genre]"
          options={{
            headerShown: false,
            href: null,
          }}
        />
        <Tabs.Screen
          name="playlist/[playlistId]"
          options={{
            headerShown: false,
            href: null,
          }}
        />
        <Tabs.Screen
          name="song/[songId]"
          options={{
            headerShown: false,
            href: null,
          }}
        />
      </Tabs>
      <PlayerContainer />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 40,
  },
});
