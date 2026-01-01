import React, { useState, memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import { useRouter } from "expo-router";
import MarqueeText from "../common/MarqueeText";
import { DownloadButton } from "../DownloadButton";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface SongItemProps {
  song: Song;
  onClick: (id: string) => void;
  dynamicSize?: boolean;
}

function SongItem({ song, onClick, dynamicSize = false }: SongItemProps) {
  const router = useRouter();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // ネットワーク状態監視
  const { isOnline } = useNetworkStatus();

  // オフラインかつ未ダウンロードの場合は無効化
  const isDownloaded = !!song.local_song_path;
  const isDisabled = !isOnline && !isDownloaded;

  // Reanimatedの共有値を使用
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(0);

  // 初回マウント時のみ実行されるフラグ
  const isFirstRender = useRef(true);

  const { width: windowWidth } = Dimensions.get("window");

  const calculateItemSize = () => {
    if (dynamicSize) {
      const itemWidth = (windowWidth - 48) / 2 - 16;
      const itemHeight = itemWidth * 1.6;
      return { width: itemWidth, height: itemHeight };
    }
    return { width: 180, height: 304 };
  };

  const dynamicStyle = calculateItemSize();

  useEffect(() => {
    // 初回レンダリング時のみ、または画像がロードされた時のみ実行
    if (isImageLoaded && isFirstRender.current) {
      opacityAnim.value = withTiming(1, { duration: 500 });
      isFirstRender.current = false;
    }
  }, [isImageLoaded, opacityAnim]);

  const handlePressIn = () => {
    if (isDisabled) return;
    scaleAnim.value = withSpring(0.95, {
      damping: 8,
      stiffness: 100,
    });
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    scaleAnim.value = withSpring(1, {
      damping: 5,
      stiffness: 40,
    });
  };

  const handlePress = () => {
    if (isDisabled) return;
    onClick(song.id);
  };

  const handleTitlePress = () => {
    if (isDisabled) return;
    router.push({
      pathname: `/song/[songId]`,
      params: { songId: song.id },
    });
  };

  return (
    <Animated.View
      style={[
        styles.containerWrapper,
        dynamicStyle,
        useAnimatedStyle(() => ({
          transform: [{ scale: scaleAnim.value }],
          opacity: opacityAnim.value,
        })),
        isDisabled && { opacity: 0.5 }, // 無効時は半透明に
      ]}
    >
      <TouchableOpacity
        style={[styles.container, isDisabled && { backgroundColor: "#000" }]} // 無効時は少し暗く
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        testID="song-container"
        disabled={isDisabled}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: song.image_path }}
            style={[styles.image, isDisabled && { opacity: 0.5 }]} // 画像も薄く
            onLoad={() => setIsImageLoaded(true)}
            contentFit="cover"
            cachePolicy="disk"
          />
          {!isImageLoaded && <View style={styles.imagePlaceholder} />}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
            locations={[0.5, 0.75, 1]}
            style={styles.gradientOverlay}
          />
          <View style={styles.textOverlay}>
            <TouchableOpacity
              onPress={handleTitlePress}
              testID="song-title-button"
              style={styles.titleContainer}
              disabled={isDisabled}
            >
              <MarqueeText
                text={song.title}
                style={styles.titleMarquee}
                speed={0.5}
                withGesture={false}
              />
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
              <DownloadButton
                song={song}
                size={16}
                style={styles.downloadButton}
              />
            </View>
          </View>
        </View>
        <LinearGradient
          colors={["rgba(124, 58, 237, 0.1)", "rgba(124, 58, 237, 0.05)"]}
          style={styles.cardGlow}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// メモ化してエクスポート
export default memo(SongItem, (prevProps, nextProps) => {
  // songオブジェクトの主要なプロパティとonClick, dynamicSize, songTypeを比較
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.song.title === nextProps.song.title &&
    prevProps.song.author === nextProps.song.author &&
    prevProps.song.image_path === nextProps.song.image_path &&
    prevProps.song.count === nextProps.song.count &&
    prevProps.song.like_count === nextProps.song.like_count &&
    prevProps.dynamicSize === nextProps.dynamicSize
  );
});

const styles = StyleSheet.create({
  containerWrapper: {
    margin: 8,
    borderRadius: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
    height: "100%",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#222",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  textOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  titleContainer: {
    width: "100%",
  },
  titleMarquee: {
    height: 24,
  },
  author: {
    color: "#ddd",
    fontSize: 14,
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 12,
    padding: 6,
    alignSelf: "flex-start",
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
    fontWeight: "500",
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    padding: 5,
  },
  downloadButton: {
    marginLeft: "auto",
    padding: 0,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
