import React, { memo, useRef, useEffect, useState, useMemo } from "react";
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
import { FONTS } from "@/constants/theme";

interface PlaylistItemProps {
  playlist: Playlist;
  onPress: (playlist: Playlist) => void;
  testID?: string;
}

function PlaylistItem({ playlist, onPress, testID }: PlaylistItemProps) {
  const { width } = useWindowDimensions();
  const colors = useThemeStore((state) => state.colors);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // カラム数2で計算 (余白を広めに)
  const itemSize = useMemo(() => {
    const itemWidth = (width - 64) / 2;
    const itemHeight = itemWidth * 1.4;
    return { width: itemWidth, height: itemHeight };
  }, [width]);

  // Animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isImageLoaded && isFirstRender.current) {
      opacity.value = withTiming(1, { duration: 600 });
      isFirstRender.current = false;
    }
  }, [isImageLoaded, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 80 });
  };

  return (
    <Animated.View
      style={[styles.wrapper, animatedStyle, { width: itemSize.width }]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            height: itemSize.height,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onPress(playlist)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
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
          <LinearGradient
            colors={["transparent", "rgba(10, 10, 10, 0.5)", "#0A0A0A"]}
            locations={[0.4, 0.8, 1]}
            style={styles.gradient}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {playlist.title}
          </Text>
          <Text
            style={[styles.author, { color: colors.subText }]}
            numberOfLines={1}
          >
            COLLECTION
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 10,
  },
  container: {
    borderRadius: 8, // Less rounded for a more classic look
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  content: {
    padding: 12,
    backgroundColor: "#171717",
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.title,
    marginBottom: 4,
    lineHeight: 20,
  },
  author: {
    fontSize: 9,
    fontFamily: FONTS.body,
    letterSpacing: 2,
    opacity: 0.7,
  },
});

export default memo(PlaylistItem, (prevProps, nextProps) => {
  return (
    prevProps.playlist.id === nextProps.playlist.id &&
    prevProps.playlist.title === nextProps.playlist.title &&
    prevProps.playlist.image_path === nextProps.playlist.image_path &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.testID === nextProps.testID
  );
});
