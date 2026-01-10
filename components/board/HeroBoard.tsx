import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { genreCards } from "@/constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.28;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_MARGIN = 8;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

const backgroundImages = {
  "Retro Wave": require("@/assets/images/RetroWave.jpg"),
  "Electro House": require("@/assets/images/ElectroHouse.jpg"),
  "Nu Disco": require("@/assets/images/NuDisco.jpg"),
  "City Pop": require("@/assets/images/CityPop.jpg"),
  "Tropical House": require("@/assets/images/TropicalHouse.jpg"),
  "Vapor Wave": require("@/assets/images/VaporWave.jpg"),
  "r&b": require("@/assets/images/RnB.jpg"),
  "Chill House": require("@/assets/images/ChillHouse.jpg"),
} as const;

const getGradientColors = (
  genre: string
): readonly [string, string, ...string[]] => {
  switch (genre) {
    case "Retro Wave":
      return ["#FF0080", "#7928CA", "#4A00E0"] as const;
    case "Electro House":
      return ["#00F5A0", "#00D9F5"] as const;
    case "Nu Disco":
      return ["#FFD700", "#FF6B6B", "#FF1493"] as const;
    case "City Pop":
      return ["#6366F1", "#A855F7", "#EC4899"] as const;
    case "Tropical House":
      return ["#00B4DB", "#0083B0"] as const;
    case "Vapor Wave":
      return ["#FF61D2", "#FE9090", "#FF9C7D"] as const;
    case "r&b":
      return ["#6A0DAD", "#9370DB", "#D4AF37"] as const;
    case "Chill House":
      return ["#43cea2", "#185a9d", "#6DD5FA"] as const;
    default:
      return ["#374151", "#1F2937", "#111827"] as const;
  }
};

const getGenreIcon = (genre: string): string => {
  switch (genre) {
    case "Retro Wave":
      return "🌆";
    case "Electro House":
      return "⚡";
    case "Nu Disco":
      return "💿";
    case "City Pop":
      return "🏙️";
    case "Tropical House":
      return "🌴";
    case "Vapor Wave":
      return "📼";
    case "r&b":
      return "🎤";
    case "Chill House":
      return "🎧";
    default:
      return "🎵";
  }
};

// 個別のジャンルカードコンポーネント（メモ化）
interface GenreCardProps {
  genre: string;
  onNavigate: (genre: string) => void;
}

const GenreCard = memo(function GenreCard({
  genre,
  onNavigate,
}: GenreCardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(5, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    onNavigate(genre);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardWrapper}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <ImageBackground
          source={backgroundImages[genre as keyof typeof backgroundImages]}
          style={styles.backgroundImage}
          contentFit="cover"
        >
          <LinearGradient
            colors={getGradientColors(genre)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />

          <View style={styles.contentContainer}>
            <View style={styles.topSection}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getGenreIcon(genre)}</Text>
              </View>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.textContainer}>
                <Text style={styles.genreTitle}>{genre}</Text>
                <Text style={styles.genreSubtitle}>
                  Explore the best tracks
                </Text>
              </View>

              <View style={styles.exploreButton}>
                <Text style={styles.exploreText}>Explore</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </TouchableOpacity>
  );
});

function HeroBoard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // ジャンルページに移動
  const navigateToGenre = useCallback(
    (genre: string) => {
      router.push({
        pathname: "/genre/[genre]",
        params: { genre: encodeURIComponent(genre) },
      });
    },
    [router]
  );

  // スクロール位置からインデックスを計算
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      if (index !== currentIndex && index >= 0 && index < genreCards.length) {
        setCurrentIndex(index);
      }
    },
    [currentIndex]
  );

  // FlatListのrenderItem
  const renderItem = useCallback(
    ({ item }: { item: { name: string } }) => (
      <GenreCard genre={item.name} onNavigate={navigateToGenre} />
    ),
    [navigateToGenre]
  );

  // keyExtractor
  const keyExtractor = useCallback(
    (item: { name: string }, index: number) => `${item.name}-${index}`,
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={genreCards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* インジケーター */}
      <View style={styles.indicatorContainer}>
        {genreCards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  listContainer: {
    paddingHorizontal: 16 - CARD_MARGIN,
  },
  cardWrapper: {
    marginHorizontal: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "flex-start",
    paddingTop: 10,
  },
  bottomSection: {
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    fontSize: 28,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  textContainer: {
    marginBottom: 12,
  },
  genreTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  genreSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  exploreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    margin: 3,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});

export default memo(HeroBoard);
