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
import { ArrowRight } from "lucide-react-native";
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
import { FONTS } from "@/constants/theme";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

interface GenreItem {
  id: number;
  name: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.3;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
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

  const parallaxStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [
        (index - 1) * SNAP_INTERVAL,
        index * SNAP_INTERVAL,
        (index + 1) * SNAP_INTERVAL,
      ],
      [-CARD_WIDTH * 0.1, 0, CARD_WIDTH * 0.1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX }, { scale: 1.1 }],
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
      [0.92, 1, 0.92],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: cardScale * scale.value }],
    };
  });

  const handlePress = () => onNavigate(genre);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
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
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
            style={styles.bottomOverlay}
          />

          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.genreTitle}>{genre}</Text>
              <Text style={styles.genreSubtitle}>CURATED_COLLECTION</Text>
            </View>

            <TouchableOpacity
              onPress={handlePress}
              style={styles.exploreButton}
            >
              <BlurView intensity={20} tint="light" style={styles.blurButton}>
                <Text style={styles.exploreText}>DISCOVER</Text>
                <ArrowRight size={14} color="#fff" strokeWidth={1.5} />
              </BlurView>
            </TouchableOpacity>
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
      [1, 0.3],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      distance,
      [0, SNAP_INTERVAL],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return { opacity, transform: [{ scale }] };
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

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

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
    marginHorizontal: -24,
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    paddingVertical: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#171717",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  imageContainer: {
    flex: 1,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
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
    padding: 32,
    justifyContent: "space-between",
  },
  textContainer: {
    gap: 4,
  },
  genreTitle: {
    color: "#fff",
    fontSize: 36,
    fontFamily: FONTS.title, // Bodoni Moda
    letterSpacing: -0.5,
  },
  genreSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    fontFamily: FONTS.body,
    letterSpacing: 3,
  },
  exploreButton: {
    alignSelf: "flex-start",
  },
  blurButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    gap: 10,
  },
  exploreText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONTS.body,
    letterSpacing: 2,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    height: 12,
  },
  indicator: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 4,
  },
});

export default memo(HeroBoard);
