import { useEffect, memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MarqueeText from "@/components/common/MarqueeText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
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
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

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
      <LinearGradient
        colors={["#1e2a78", "#ff9190"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <TouchableOpacity style={styles.contentContainer} onPress={onPress}>
          <Image
            source={{ uri: currentSong.image_path }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
          />
          <View style={styles.songInfo}>
            <MarqueeText
              text={currentSong.title}
              style={styles.titleContainer}
              speed={0.5}
              withGesture={false}
            />
            <Text style={styles.author} numberOfLines={1}>
              {currentSong.author}
            </Text>
          </View>
          <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
            <Feather
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  gradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  songInfo: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  titleContainer: {
    height: 20,
    marginBottom: 4,
  },
  author: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});

// カスタム比較関数を使用してメモ化
export default memo(ModernMiniPlayer, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});
