import React, { memo, useCallback, useMemo } from "react";
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
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Heart } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useRouter } from "expo-router";
import MarqueeText from "@/components/common/MarqueeText";
import ListItemOptionsMenu, {
  ListItemOptionsButton,
} from "@/components/item/ListItemOptionsMenu";
import { FONTS } from "@/constants/theme";

interface SongItemProps {
  song: Song;
  onClick: (id: string) => void;
  dynamicSize?: boolean;
  /** 親コンポーネントでまとめて取得した isOnline 値 */
  isOnline: boolean;
  /** 一覧スクロール中など、タイトル marquee を一時停止したい場合に指定します */
  pauseTitleAnimation?: boolean;
  onOpenMenu?: (song: Song) => void;
}

function SongItem({
  song,
  onClick,
  dynamicSize = false,
  isOnline,
  pauseTitleAnimation = false,
  onOpenMenu,
}: SongItemProps) {
  const router = useRouter();
  const colors = useThemeStore((state) => state.colors);
  const isDownloaded = !!song.local_song_path;
  const isDisabled = !isOnline && !isDownloaded;

  const scaleAnim = useSharedValue(1);

  const { width: windowWidth } = Dimensions.get("window");

  const dynamicStyle = useMemo(() => {
    if (dynamicSize) {
      const itemWidth = (windowWidth - 64) / 2 - 12;
      const itemHeight = itemWidth * 1.5; // Slightly taller for elegant proportions
      return { width: itemWidth, height: itemHeight };
    }
    return { width: 180, height: 300 };
  }, [dynamicSize, windowWidth]);

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    scaleAnim.value = withSpring(0.97, { damping: 15, stiffness: 100 });
  }, [isDisabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 80 });
  }, [isDisabled, scaleAnim]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    onClick(song.id);
  }, [isDisabled, onClick, song.id]);

  const handleTitlePress = useCallback(() => {
    router.push({
      pathname: "/song/[songId]",
      params: { songId: song.id },
    });
  }, [router, song.id]);

  const handleMenuPress = useCallback(() => {
    if (!onOpenMenu) return;
    onOpenMenu(song);
  }, [onOpenMenu, song]);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));
  const downloadIconOpacity = !isDownloaded && !isOnline ? 0.4 : 1;

  return (
    <Animated.View
      style={[
        styles.containerWrapper,
        dynamicStyle,
        animatedScaleStyle,
        isDisabled && { opacity: 0.4 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
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
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk" // メモリとディスクを併用した高速なキャッシュ
          />
          <LinearGradient
            colors={["transparent", "rgba(10, 10, 10, 0.8)", "#0A0A0A"]}
            locations={[0.4, 0.8, 1]}
            style={styles.gradientOverlay}
          />
          <View style={styles.menuContainer}>
            {onOpenMenu ? (
              <ListItemOptionsButton onPress={handleMenuPress} />
            ) : (
              <ListItemOptionsMenu song={song} />
            )}
          </View>

          <TouchableOpacity
            style={styles.textOverlay}
            onPress={handleTitlePress}
            activeOpacity={0.8}
            testID="song-title-button"
          >
            <MarqueeText
              text={song.title}
              style={styles.title}
              speed={0.5}
              withGesture={false}
              fontFamily={FONTS.body}
              fontSize={15}
              animate={!pauseTitleAnimation}
            />
            <Text
              style={[styles.author, { color: colors.subText }]}
              numberOfLines={1}
            >
              {song.author}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Play size={10} color={colors.primary} fill={colors.primary} />
                <Text style={[styles.statText, { color: colors.text }]}>
                  {song.count}
                </Text>
              </View>
              <View style={styles.stat}>
                <Heart size={10} color={colors.text} />
                <Text style={[styles.statText, { color: colors.text }]}>
                  {song.like_count}
                </Text>
              </View>
            </View>
            <View style={styles.downloadIconContainer} testID="download-status-icon">
              <Ionicons
                name={isDownloaded ? "cloud-done" : "cloud-download-outline"}
                size={14}
                color="white"
                style={{ opacity: downloadIconOpacity }}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(SongItem, (prevProps, nextProps) => {
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.song.title === nextProps.song.title &&
    prevProps.song.author === nextProps.song.author &&
    prevProps.song.image_path === nextProps.song.image_path &&
    prevProps.song.count === nextProps.song.count &&
    prevProps.song.like_count === nextProps.song.like_count &&
    prevProps.song.local_song_path === nextProps.song.local_song_path &&
    prevProps.dynamicSize === nextProps.dynamicSize &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.isOnline === nextProps.isOnline &&
    prevProps.pauseTitleAnimation === nextProps.pauseTitleAnimation &&
    prevProps.onOpenMenu === nextProps.onOpenMenu
  );
});

const styles = StyleSheet.create({
  containerWrapper: {
    margin: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  container: {
    borderRadius: 12,
    overflow: "hidden",
    height: "100%",
    borderWidth: 1,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  textOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  title: {
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    fontFamily: FONTS.body,
    opacity: 0.8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  menuContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  downloadIconContainer: {
    padding: 8,
  },
});
