import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/components/common/Header";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";
import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import PlayerContainer from "@/components/player/PlayerContainer";

export default function TabLayout() {
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const showHeader = useHeaderStore((state) => state.showHeader);
  const { colors } = useThemeStore();

  const getFocusedIconStyle = () => ({
    textShadowColor: colors.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.8,
  });

  return (
    <>
      {showHeader && <Header />}
      <Tabs
        screenOptions={{
          tabBarPosition: "bottom",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          tabBarStyle: showPlayer
            ? { display: "none" }
            : {
                backgroundColor: colors.background,
                borderTopWidth: 0,
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
              },
          tabBarActiveTintColor: colors.activeTab,
          tabBarInactiveTintColor: colors.subText,
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
                  color={focused ? colors.activeTab : colors.subText}
                  style={focused ? getFocusedIconStyle() : {}}
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
                  color={focused ? colors.activeTab : colors.subText}
                  style={focused ? getFocusedIconStyle() : {}}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="spotlights"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="movie-open-play"
                  size={24}
                  color={focused ? colors.activeTab : colors.subText}
                  style={focused ? getFocusedIconStyle() : {}}
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
                  color={focused ? colors.activeTab : colors.subText}
                  style={focused ? getFocusedIconStyle() : {}}
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
        <Tabs.Screen
          name="account"
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

