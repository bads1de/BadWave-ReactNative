import React, { useState, memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

interface SongItemProps {
  song: Song;
  onClick: (id: string) => void;
  dynamicSize?: boolean;
  songType?: string;
}

const SongItem = memo(
  ({
    song,
    onClick,
    dynamicSize = false,
    songType = "regular",
  }: SongItemProps) => {
    const router = useRouter();
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const queryClient = useQueryClient();

    const { width: windowWidth } = Dimensions.get("window");

    const calculateItemSize = () => {
      if (dynamicSize) {
        const itemWidth = (windowWidth - 48) / 2 - 16;
        const itemHeight = itemWidth * 1.6;
        return { width: itemWidth, height: itemHeight };
      }
      return { width: 180, height: 320 };
    };

    const dynamicStyle = calculateItemSize();

    const handleTitlePress = () => {
      router.push({
        pathname: `/song/[songId]`,
        params: { songId: song.id },
      });
    };

    return (
      <TouchableOpacity
        style={[styles.container, dynamicStyle]}
        onPress={() => onClick(song.id)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: song.image_path }}
            style={styles.image}
            onLoad={() => setIsImageLoaded(true)}
          />
          {!isImageLoaded && <View style={styles.imagePlaceholder} />}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradientOverlay}
          />
          <View style={styles.textOverlay}>
            <TouchableOpacity onPress={handleTitlePress}>
              <Text style={styles.title} numberOfLines={1}>
                {song.title}
              </Text>
            </TouchableOpacity>
            <Text style={styles.author} numberOfLines={1}>
              {song.author}
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statsItem}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.statsText}>{song.count}</Text>
              </View>
              <View style={styles.statsItem}>
                <Ionicons name="heart" size={14} color="#fff" />
                <Text style={styles.statsText}>{song.like_count}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

export default SongItem;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    margin: 8,
    backgroundColor: "#000",
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#333",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  textOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  author: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  statsItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  statsText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    padding: 5,
  },
});
