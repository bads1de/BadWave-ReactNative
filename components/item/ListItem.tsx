import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import ListItemOptionsMenu from "@/components/item/ListItemOptionsMenu";

interface ListItemProps {
  song: Song;
  onPress: (song: Song) => void;
  showStats?: boolean;
  imageSize?: "small" | "medium" | "large";
  onDelete?: (song: Song) => void;
  testID?: string;
  currentPlaylistId?: string;
}

function ListItem({
  song,
  onPress,
  showStats = true,
  imageSize = "medium",
  onDelete,
  testID,
  currentPlaylistId,
}: ListItemProps) {
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

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(song);
    }
  }, [onDelete, song]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
      testID={testID}
    >
      <View
        style={[
          styles.imageContainer,
          { width: getImageSize(), height: getImageSize() },
        ]}
      >
        <Image
          source={{ uri: song.image_path }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="disk"
        />
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

        <View style={styles.rightContainer}>
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
      </View>
      <ListItemOptionsMenu
        song={song}
        onDelete={handleDelete}
        currentPlaylistId={currentPlaylistId}
      />
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
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
});

// カスタム比較関数を使用してメモ化
export default memo(ListItem, (prevProps, nextProps) => {
  // 曲の主要なプロパティ、関数、表示オプションを比較
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.song.title === nextProps.song.title &&
    prevProps.song.author === nextProps.song.author &&
    prevProps.song.image_path === nextProps.song.image_path &&
    prevProps.song.count === nextProps.song.count &&
    prevProps.song.like_count === nextProps.song.like_count &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.showStats === nextProps.showStats &&
    prevProps.imageSize === nextProps.imageSize &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.testID === nextProps.testID &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});

