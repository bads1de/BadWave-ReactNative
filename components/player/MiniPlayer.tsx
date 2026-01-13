import { useEffect, memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MarqueeText from "@/components/common/MarqueeText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";

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
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 400 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity, translateY]);

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
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <TouchableOpacity
          style={styles.contentContainer}
          onPress={onPress}
          activeOpacity={0.7}
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
              fontSize={16}
            />
            <Text style={styles.author} numberOfLines={1}>
              {currentSong.author}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.playButton}
            onPress={onPlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 12, // Floating effect
    height: 64,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(20,20,20,0.3)", // Fallback
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  blurContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#333",
  },
  songInfo: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    height: 24,
  },
  author: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: -2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});

// カスタム比較関数を使用してメモ化
export default memo(ModernMiniPlayer, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});

