import React from "react";
import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { usePlayerStore } from "../../hooks/usePlayerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { songs } from "@/data/songs";
import MiniPlayer from "@/components/MiniPlayer";
import Player from "@/components/Player";
import Header from "@/components/Header";

export default function TabLayout() {
  const { showPlayer, setShowPlayer, currentSong } = usePlayerStore();
  const {
    sound,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
  } = useAudioPlayer(songs);

  return (
    <>
      <Header />
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

      {/* フルスクリーンPlayerの表示（全画面オーバーレイ） */}
      {showPlayer && currentSong && (
        <View style={styles.fullPlayerContainer}>
          <Player
            sound={sound}
            isPlaying={isPlaying}
            currentSong={currentSong}
            position={position}
            duration={duration}
            onPlayPause={() => togglePlayPause()}
            onNext={playNextSong}
            onPrev={playPrevSong}
            onSeek={seekTo}
            onClose={() => setShowPlayer(false)}
            repeat={repeat}
            setRepeat={setRepeat}
            shuffle={shuffle}
            setShuffle={setShuffle}
          />
        </View>
      )}

      {/* MiniPlayerはフルプレイヤーが表示されていない場合に下部に表示 */}
      {currentSong && !showPlayer && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onPress={() => setShowPlayer(true)}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fullPlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 10,
  },
  miniPlayerContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 5,
  },
});
