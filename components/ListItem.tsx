import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import ListItemOptionsMenu from "./ListItemOptionsMenu";
import { DownloadButton } from "./DownloadButton";

interface ListItemProps {
  song: Song;
  onPress: (song: Song) => void;
  showStats?: boolean;
  imageSize?: "small" | "medium" | "large";
  onDelete?: () => void;
  testID?: string;
  showDownloadButton?: boolean; // 互換性のために残していますが、常にtrueとして扱われます
}

function ListItem({
  song,
  onPress,
  showStats = true,
  imageSize = "medium",
  onDelete,
  testID,
  showDownloadButton = true, // 常にtrueとして扱います
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

          {/* ダウンロードボタンは常に表示 */}
          <View
            testID="download-button-container"
            style={styles.downloadButtonContainer}
          >
            <DownloadButton song={song} size={18} />
          </View>
        </View>
      </View>
      {onDelete && <ListItemOptionsMenu onDelete={onDelete} />}
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
    paddingRight: 30,
    position: "relative",
  },
  downloadButtonContainer: {
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
  },
  hidden: {
    display: "none",
  },
});

// カスタム比較関数を使用してメモ化
export default memo(ListItem, (prevProps, nextProps) => {
  // 曲のIDと表示オプションが同じ場合は再レンダリングしない
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.showStats === nextProps.showStats &&
    prevProps.imageSize === nextProps.imageSize &&
    prevProps.showDownloadButton === nextProps.showDownloadButton
  );
});
