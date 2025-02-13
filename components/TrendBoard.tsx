import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import useGetTrendSongs from "@/hooks/useGetTrendSongs";
import useLoadImage from "@/hooks/useLoadImage";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Song from "@/types";

interface TrendItemProps {
  song: Song;
  index: number;
  onPlay: (song: Song) => void;
}

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.6;

const TrendItem = memo(({ song, index, onPlay }: TrendItemProps) => {
  const imageUrl = useLoadImage(song);

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPlay(song)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: imageUrl! }} style={styles.image} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.9)"]}
        style={styles.gradient}
      />
      <BlurView intensity={20} style={styles.blurContainer}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.authorText} numberOfLines={1}>
            {song.author}
          </Text>
          <View style={styles.statsContainer}>
            <Ionicons name="play-circle" size={16} color="#fff" />
            <Text style={styles.statsText}>
              {Number(song.count).toLocaleString()}
            </Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
});

export default function TrendBoard() {
  const { trends, isLoading, error } = useGetTrendSongs("all");
  const { playSong } = useAudioPlayer(trends);

  const onPlay = async (song: Song) => {
    await playSong(song);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c1d95" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trends}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TrendItem song={item} index={index} onPlay={onPlay} />
        )}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: "#000",
  },
  listContent: {
    paddingHorizontal: 8,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2,
    marginHorizontal: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  blurContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  rankContainer: {
    position: "absolute",
    top: -45,
    left: 8,
    backgroundColor: "#4c1d95",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  textContainer: {
    gap: 4,
  },
  titleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  authorText: {
    color: "#e5e5e5",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  statsText: {
    color: "#fff",
    fontSize: 14,
  },
});
