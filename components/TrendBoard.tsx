import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import useGetTrendSongs from "@/hooks/useGetTrendSongs";
import useLoadImage from "@/hooks/useLoadImage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Song from "@/types";

interface TrendItemProps {
  song: Song;
  index: number;
  onPlay: (id: string) => void;
}

const TrendItem = memo(({ song, index, onPlay }: TrendItemProps) => {
  const imageUrl = useLoadImage(song);
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPlay(song.id)}
    >
      <Image source={{ uri: imageUrl! }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.rankText}>#{index + 1}</Text>
        <Text style={styles.titleText} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.authorText} numberOfLines={1}>
          {song.author}
        </Text>
        <View style={styles.statsContainer}>
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={styles.statsText}>{song.count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});
export default function TrendBoard() {
  const { trends, isLoading, error } = useGetTrendSongs("all");

  const onPlay = (id: string) => {};

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: "#000",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  itemContainer: {
    width: 180,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  textContainer: {
    padding: 8,
  },
  rankText: {
    color: "#4c1d95",
    fontSize: 14,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  authorText: {
    color: "#ccc",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statsText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
});
