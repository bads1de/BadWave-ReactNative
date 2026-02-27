import { useEffect, memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MarqueeText from "@/components/common/MarqueeText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Play, Pause } from "lucide-react-native";
import Song from "@/types";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

interface MiniPlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPress: () => void;
}

function ModernMiniPlayer({
  currentSong,
  isPlaying,
  onPlayPause,
  onPress,
}: MiniPlayerProps) {
  const { colors } = useThemeStore();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: "rgba(20, 20, 20, 0.7)",
          borderColor: colors.border,
        },
        useAnimatedStyle(() => ({
          transform: [{ translateY: translateY.value }],
          opacity: opacity.value,
        })),
      ]}
    >
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <TouchableOpacity
          style={styles.contentContainer}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: currentSong.image_path }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <View style={styles.songInfo}>
            <MarqueeText
              text={currentSong.title}
              style={styles.titleContainer}
              speed={0.5}
              withGesture={false}
              fontSize={14}
              fontFamily={FONTS.body}
            />
            <Text style={[styles.author, { color: colors.subText }]} numberOfLines={1}>
              {currentSong.author}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={onPlayPause}
            activeOpacity={0.8}
          >
            {isPlaying ? (
              <Pause size={20} color="#000" fill="#000" />
            ) : (
              <Play size={20} color="#000" fill="#000" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
    height: 64,
    borderRadius: 32, // Pill shape
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    height: 20,
  },
  author: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: FONTS.body,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(ModernMiniPlayer, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});

// カスタム比較関数を使用してメモ化
export default memo(ModernMiniPlayer, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});

