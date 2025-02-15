import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Playlist } from "@/types";
import useLoadImage from "@/hooks/useLoadImage";

interface PlaylistItemProps {
  playlist: Playlist;
  onPress: (playlist: Playlist) => void;
}

export default function PlaylistItem({ playlist, onPress }: PlaylistItemProps) {
  const { width } = useWindowDimensions();
  const itemWidth = (width - 48) / 2;
  const dynamicStyles = { width: itemWidth, height: itemWidth * 1.2 };

  const imageUrl = useLoadImage(playlist);

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles]}
      onPress={() => onPress(playlist)}
      activeOpacity={0.7}
    >
      {/* 装飾的な背景カード */}
      <View style={styles.decorativeCard1} />
      <View style={styles.decorativeCard2} />

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl! }} style={styles.image} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <LinearGradient
          colors={["#fc00ff", "#00dbde"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.neonGradient}
        />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {playlist.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 8,
    position: "relative",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 15,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  neonGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  content: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  decorativeCard1: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(252, 0, 255, 0.1)",
    borderRadius: 15,
    transform: [
      { rotate: "5deg" },
      { scale: 0.98 },
      { translateX: 8 },
      { translateY: 2 },
    ],
  },
  decorativeCard2: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 219, 222, 0.1)",
    borderRadius: 15,
    transform: [
      { rotate: "-7deg" },
      { scale: 0.96 },
      { translateX: -4 },
      { translateY: 4 },
    ],
  },
});
