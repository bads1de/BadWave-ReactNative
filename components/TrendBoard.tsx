import React, { memo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import useLoadImage from "@/hooks/useLoadImage";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Song from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import getTrendSongs, { TrendPeriod } from "@/actions/useGetTrendSongs";
import CustomButton from "./CustomButton";
import Loading from "./Loading";
import Error from "./Error";

interface TrendItemProps {
  song: Song;
  index: number;
  onPlay: (song: Song) => void;
}

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.6;

const TrendItem = memo(({ song, index, onPlay }: TrendItemProps) => {
  const { data: imageUrl } = useLoadImage(song);

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
  const [period, setPeriod] = useState<TrendPeriod>("all");
  const {
    data: trends = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.trendsSongs, period],
    queryFn: () => getTrendSongs(period),
  });
  const { playSong } = useAudioPlayer(trends);

  const onPlay = async (song: Song) => {
    await playSong(song);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.periodSelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodButtons}
        >
          <CustomButton
            label="All"
            isActive={period === "all"}
            activeStyle={styles.periodButtonActive}
            inactiveStyle={styles.periodButton}
            activeTextStyle={styles.periodButtonTextActive}
            inactiveTextStyle={styles.periodButtonText}
            onPress={() => setPeriod("all")}
          />
          <CustomButton
            label="Month"
            isActive={period === "month"}
            activeStyle={styles.periodButtonActive}
            inactiveStyle={styles.periodButton}
            activeTextStyle={styles.periodButtonTextActive}
            inactiveTextStyle={styles.periodButtonText}
            onPress={() => setPeriod("month")}
          />
          <CustomButton
            label="Week"
            isActive={period === "week"}
            activeStyle={styles.periodButtonActive}
            inactiveStyle={styles.periodButton}
            activeTextStyle={styles.periodButtonTextActive}
            inactiveTextStyle={styles.periodButtonText}
            onPress={() => setPeriod("week")}
          />
          <CustomButton
            label="Day"
            isActive={period === "day"}
            activeStyle={styles.periodButtonActive}
            inactiveStyle={styles.periodButton}
            activeTextStyle={styles.periodButtonTextActive}
            inactiveTextStyle={styles.periodButtonText}
            onPress={() => setPeriod("day")}
          />
        </ScrollView>
      </View>
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
  periodSelector: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  periodButtons: {
    paddingVertical: 8,
    gap: 12,
  },
  periodButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  periodButtonActive: {
    backgroundColor: "#4c1d95",
    shadowColor: "#4c1d95",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  periodButtonText: {
    color: "rgba(255,255,255,0.6)",
  },
  periodButtonTextActive: {
    color: "#fff",
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
