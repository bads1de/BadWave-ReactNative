import React, { useCallback, memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { ImageBackground } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { genreCards } from "@/constants";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

interface GenreItem {
  id: number;
  name: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.28;
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const SNAP_INTERVAL = SCREEN_WIDTH;

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

interface GenreCardProps {
  genre: string;
  index: number;
  scrollX: Animated.SharedValue<number>;
  onNavigate: (genre: string) => void;
}

const GenreCard = memo(function GenreCard({
  genre,
  index,
  scrollX,
  onNavigate,
}: GenreCardProps) {
  const scale = useSharedValue(1);
  const pressTranslateY = useSharedValue(0);

  const parallaxStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [
        (index - 1) * SNAP_INTERVAL,
        index * SNAP_INTERVAL,
        (index + 1) * SNAP_INTERVAL,
      ],
      [-CARD_WIDTH * 0.15, 0, CARD_WIDTH * 0.15],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX }, { scale: 1.15 }],
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    const cardScale = interpolate(
      scrollX.value,
      [
        (index - 1) * SNAP_INTERVAL,
        index * SNAP_INTERVAL,
        (index + 1) * SNAP_INTERVAL,
      ],
      [0.95, 1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: cardScale * scale.value },
        { translateY: pressTranslateY.value },
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    pressTranslateY.value = withSpring(4, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    pressTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
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
        <View style={styles.imageContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>
            <ImageBackground
              source={backgroundImages[genre as keyof typeof backgroundImages]}
              style={styles.backgroundImage}
              contentFit="cover"
            />
          </Animated.View>

          <LinearGradient
            colors={getGradientColors(genre)}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.8 }}
            style={[styles.gradient, { opacity: 0.5 }]}
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.bottomOverlay}
          />

          <View style={styles.contentContainer}>
            <View style={styles.topSection}>
              <BlurView
                intensity={30}
                tint="light"
                style={styles.iconContainer}
              >
                <Text style={styles.icon}>{getGenreIcon(genre)}</Text>
              </BlurView>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.textContainer}>
                <Text style={styles.genreTitle}>{genre}</Text>
                <Text style={styles.genreSubtitle}>
                  Explore the best tracks
                </Text>
              </View>

              <BlurView
                intensity={25}
                tint="light"
                style={styles.exploreButton}
              >
                <Text style={styles.exploreText}>Explore</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </BlurView>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

interface AnimatedDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
}

const AnimatedDot = memo(function AnimatedDot({
  index,
  scrollX,
}: AnimatedDotProps) {
  const dotStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value - index * SNAP_INTERVAL);
    const opacity = interpolate(
      distance,
      [0, SNAP_INTERVAL],
      [1, 0.4],
      Extrapolate.CLAMP
    );
    const width = interpolate(
      distance,
      [0, SNAP_INTERVAL],
      [20, 8],
      Extrapolate.CLAMP
    );

    return { opacity, width };
  });

  return <Animated.View style={[styles.indicator, dotStyle]} />;
});

interface PaginationIndicatorProps {
  scrollX: Animated.SharedValue<number>;
  count: number;
}

const PaginationIndicator = ({ scrollX, count }: PaginationIndicatorProps) => (
  <View style={styles.indicatorContainer}>
    {Array.from({ length: count }).map((_, index) => (
      <AnimatedDot key={index} index={index} scrollX={scrollX} />
    ))}
  </View>
);

function HeroBoard() {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const listRef = useRef<any>(null);
  const currentIndexRef = useRef(0);

  const navigateToGenre = useCallback(
    (genre: string) => {
      router.push({
        pathname: "/genre/[genre]",
        params: { genre: encodeURIComponent(genre) },
      });
    },
    [router]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      currentIndexRef.current =
        (currentIndexRef.current + 1) % genreCards.length;

      // Animate scrollX manually to satisfy tests and provide smooth parallax during auto-advance
      scrollX.value = withTiming(currentIndexRef.current * SNAP_INTERVAL, {
        duration: 600,
      });

      if (listRef.current) {
        listRef.current.scrollToIndex({
          index: currentIndexRef.current,
          animated: true,
        });
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      currentIndexRef.current = index;
    },
    []
  );

  return (
    <View style={styles.container}>
      <AnimatedFlashList
        data={genreCards}
        renderItem={({ item, index }) => (
          <GenreCard
            genre={(item as GenreItem).name}
            index={index}
            scrollX={scrollX}
            onNavigate={navigateToGenre}
          />
        )}
        keyExtractor={(item) => (item as GenreItem).id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={onScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        ref={listRef}
        scrollEventThrottle={16}
        estimatedItemSize={SCREEN_WIDTH}
      />

      <PaginationIndicator scrollX={scrollX} count={genreCards.length} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    marginHorizontal: -16,
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    paddingVertical: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1f2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  icon: {
    fontSize: 24,
  },
  bottomSection: {
    gap: 16,
  },
  textContainer: {
    gap: 4,
  },
  genreTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  genreSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "500",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  exploreText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 8,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    height: 10,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginHorizontal: 3,
  },
});

export default memo(HeroBoard);
