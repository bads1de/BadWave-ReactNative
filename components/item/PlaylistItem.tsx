import React, { memo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Playlist } from "@/types";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface PlaylistItemProps {
  playlist: Playlist;
  onPress: (playlist: Playlist) => void;
  testID?: string;
}

function PlaylistItem({ playlist, onPress, testID }: PlaylistItemProps) {
  const { width } = useWindowDimensions();
  const { colors } = useThemeStore();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // カラム数2で計算 (パディングなどを考慮)
  const itemWidth = (width - 48) / 2;
  const itemHeight = itemWidth * 1.3; // アスペクト比調整

  // Animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 画像ロード完了後、または初回レンダリング時にフェードイン
    if (isImageLoaded && isFirstRender.current) {
      opacity.value = withTiming(1, { duration: 500 });
      isFirstRender.current = false;
    }
  }, [isImageLoaded, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  return (
    <Animated.View
      style={[styles.wrapper, animatedStyle, { width: itemWidth }]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            height: itemHeight,
            backgroundColor: colors.card,
            borderColor: colors.glow + "33", // 20% opacity
            shadowColor: colors.glow,
          },
        ]}
        onPress={() => onPress(playlist)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1} // Reanimatedで制御するため1に設定
        testID={testID}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: playlist.image_path }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            onLoad={() => setIsImageLoaded(true)}
            transition={300}
          />
          {!isImageLoaded && (
            <View
              style={[styles.placeholder, { backgroundColor: colors.border }]}
            />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]}
            locations={[0.5, 0.8, 1]}
            style={styles.gradient}
          />

          {/* カード下部のアクセント光沢 */}
          <LinearGradient
            colors={[colors.accentFrom + "00", colors.accentFrom + "66"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.bottomGlow}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, { textShadowColor: colors.glow }]}
            numberOfLines={2}
          >
            {playlist.title}
          </Text>
          <View style={styles.authorContainer}>
            <Text
              style={[styles.author, { color: colors.subText }]}
              numberOfLines={1}
            >
              Playlist
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 8,
  },
  container: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  bottomGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1,
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 3,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 20,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.8,
  },
});

// メモ化してエクスポート
export default memo(PlaylistItem, (prevProps, nextProps) => {
  return (
    prevProps.playlist.id === nextProps.playlist.id &&
    prevProps.playlist.title === nextProps.playlist.title &&
    prevProps.playlist.image_path === nextProps.playlist.image_path &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.testID === nextProps.testID
  );
});

