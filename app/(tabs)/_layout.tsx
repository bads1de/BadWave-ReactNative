import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Home, Search, Sparkles, Library } from "lucide-react-native";
import Header from "@/components/common/Header";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";
import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import PlayerContainer from "@/components/player/PlayerContainer";

export default function TabLayout() {
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const showHeader = useHeaderStore((state) => state.showHeader);
  const { colors } = useThemeStore();

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
                borderTopWidth: 0.5,
                height: 80,
                paddingBottom: 24,
                paddingTop: 12,
                borderTopColor: colors.border,
              },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subText,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <Home
                  size={22}
                  color={focused ? colors.primary : colors.subText}
                  strokeWidth={focused ? 1.5 : 1}
                />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
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
                <Search
                  size={22}
                  color={focused ? colors.primary : colors.subText}
                  strokeWidth={focused ? 1.5 : 1}
                />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
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
                <Sparkles
                  size={22}
                  color={focused ? colors.primary : colors.subText}
                  strokeWidth={focused ? 1.5 : 1}
                />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <Library
                  size={22}
                  color={focused ? colors.primary : colors.subText}
                  strokeWidth={focused ? 1.5 : 1}
                />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen name="genre/[genre]" options={{ headerShown: false, href: null }} />
        <Tabs.Screen name="playlist/[playlistId]" options={{ headerShown: false, href: null }} />
        <Tabs.Screen name="song/[songId]" options={{ headerShown: false, href: null }} />
        <Tabs.Screen name="account" options={{ headerShown: false, href: null }} />
      </Tabs>
      <PlayerContainer />
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 6,
    position: "absolute",
    bottom: -4,
  },
});

