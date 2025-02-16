import React, { memo } from "react";
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
import useLoadImage from "@/hooks/useLoadImage";
import Song from "@/types";

interface ListItemProps {
  song: Song;
  onPress: (song: Song) => void;
  showStats?: boolean;
  imageSize?: "small" | "medium" | "large";
}

const { width } = Dimensions.get("window");

export default function ListItem({
  song,
  onPress,
  showStats = true,
  imageSize = "medium",
}: ListItemProps) {
  const { data: imageUrl } = useLoadImage(song);

  const getImageSize = () => {
    switch (imageSize) {
      case "small":
        return 50;
      case "large":
        return 90;
      default:
        return 70;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.imageContainer,
          { width: getImageSize(), height: getImageSize() },
        ]}
      >
        <Image source={{ uri: imageUrl! }} style={styles.image} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {song.author}
          </Text>
        </View>

        {showStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsItem}>
              <Ionicons name="play" size={14} color="#fff" />
              <Text style={styles.statsText}>
                {Number(song.count).toLocaleString()}
              </Text>
            </View>
            <View style={styles.statsItem}>
              <Ionicons name="heart" size={14} color="#fff" />
              <Text style={styles.statsText}>
                {Number(song.like_count).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    padding: 8,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  textContainer: {
    flex: 1,
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
    marginRight: 12,
  },
  statsText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
});
