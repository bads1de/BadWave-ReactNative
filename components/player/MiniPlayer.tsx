import { useEffect, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
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
import { useProgress } from "react-native-track-player";
import { FONTS } from "@/constants/theme";

interface MiniPlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPress: () => void;
}

const { width } = Dimensions.get("window");

function ModernMiniPlayer({
  currentSong,
  isPlaying,
  onPlayPause,
  onPress,
}: MiniPlayerProps) {
  const colors = useThemeStore((state) => state.colors);
  const { position, duration } = useProgress(500);

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  // プログレスバーの幅を計算
  const progressWidth = duration > 0 ? (position / duration) * (width - 16) : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        useAnimatedStyle(() => ({
          transform: [{ translateY: translateY.value }],
          opacity: opacity.value,
        })),
      ]}
    >
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <TouchableOpacity
          style={styles.contentContainer}
          onPress={onPress}
          activeOpacity={0.85}
        >
          {/* Circular Glowing Image */}
          <View style={[styles.imageWrapper, { shadowColor: colors.primary }]}>
            <Image
              source={{ uri: currentSong.image_path }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>

          <View style={styles.songInfo}>
            <MarqueeText
              text={currentSong.title}
              style={styles.titleContainer}
              speed={0.5}
              withGesture={false}
              fontSize={14}
              fontFamily={FONTS.bold}
            />
            <Text
              style={[styles.author, { color: colors.subText }]}
              numberOfLines={1}
            >
              {currentSong.author}
            </Text>
          </View>

          {/* Premium Circular Play Button */}
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={onPlayPause}
            activeOpacity={0.7}
          >
            {isPlaying ? (
              <Pause size={20} color="#000" fill="#000" />
            ) : (
              <Play
                size={20}
                color="#000"
                fill="#000"
                style={{ marginLeft: 3 }}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Floating Glowing Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          />
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginBottom: 8,
    height: 60,
    borderRadius: 30, // Premium Pill Shape
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: "rgba(20, 20, 20, 0.65)",
    borderColor: "rgba(255, 255, 255, 0.15)",
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
  imageWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circular image
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    opacity: 0.9,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "transparent",
  },
  progressBar: {
    height: "100%",
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default memo(ModernMiniPlayer, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});
