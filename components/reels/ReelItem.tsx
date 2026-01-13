import React, { memo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { VideoView } from "expo-video";
import { Spotlight } from "@/types";
import { useReelsPlayer } from "@/hooks/useReelsPlayer";

const { width, height } = Dimensions.get("window");

interface ReelItemProps {
  item: Spotlight;
  isVisible: boolean;
}

function ReelItem({ item, isVisible }: ReelItemProps) {
  const player = useReelsPlayer(item.video_path, isVisible);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.artist}>{item.author}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// メモ化してエクスポート
export default memo(ReelItem, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isVisible === nextProps.isVisible
  );
});

const styles = StyleSheet.create({
  container: {
    width,
    height, // 画面全体の高さを使用
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 80, // Adjust for tab bar
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.3)", // 軽量化のために半透明背景に変更
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  artist: {
    color: "#e0e0e0",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
});
