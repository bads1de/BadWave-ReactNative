import React, { useState, memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import { useRouter } from "expo-router";

interface SongItemProps {
  song: Song;
  onClick: (id: string) => void;
  dynamicSize?: boolean;
  songType?: string;
}

const SongItem = memo(
  ({
    song,
    onClick,
    dynamicSize = false,
    songType = "regular",
  }: SongItemProps) => {
    const router = useRouter();
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // useRefを使用してAnimated.Valueを保持
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // 初回マウント時のみ実行されるフラグ
    const isFirstRender = useRef(true);

    const { width: windowWidth } = Dimensions.get("window");

    const calculateItemSize = () => {
      if (dynamicSize) {
        const itemWidth = (windowWidth - 48) / 2 - 16;
        const itemHeight = itemWidth * 1.6;
        return { width: itemWidth, height: itemHeight };
      }
      return { width: 180, height: 320 };
    };

    const dynamicStyle = calculateItemSize();

    useEffect(() => {
      // 初回レンダリング時のみ、または画像がロードされた時のみ実行
      if (isImageLoaded && isFirstRender.current) {
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        isFirstRender.current = false;
      }
    }, [isImageLoaded]);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const handleTitlePress = () => {
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
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.container}
          onPress={() => onClick(song.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: song.image_path }}
              style={styles.image}
              onLoad={() => setIsImageLoaded(true)}
            />
            {!isImageLoaded && <View style={styles.imagePlaceholder} />}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
              locations={[0.5, 0.75, 1]}
              style={styles.gradientOverlay}
            />
            <View style={styles.textOverlay}>
              <TouchableOpacity onPress={handleTitlePress}>
                <Text style={styles.title} numberOfLines={1}>
                  {song.title}
                </Text>
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
);

export default SongItem;

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
    resizeMode: "cover",
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
