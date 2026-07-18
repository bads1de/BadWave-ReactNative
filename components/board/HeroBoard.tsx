import React, { useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { ImageBackground } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowUpRight, Disc3 } from "lucide-react-native";
import { genreCards, ROUTES } from "@/constants";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { FONTS } from "@/constants/theme";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

interface GenreItem {
  id: number;
  name: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.32;
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

// ジャンルごとのアクセントカラー。カードのグロー・ウォッシュ・アクションボタンに使い、
// 一様に暗いだけだった旧デザインにジャンルごとの個性を与える。
const getGenreAccent = (genre: string): string => {
  switch (genre) {
    case "Retro Wave":
      return "#FF2D9B";
    case "Electro House":
      return "#00F5A0";
    case "Nu Disco":
      return "#FFB800";
    case "City Pop":
      return "#A855F7";
    case "Tropical House":
      return "#00C2FF";
    case "Vapor Wave":
      return "#FF61D2";
    case "r&b":
      return "#B388FF";
    case "Chill House":
      return "#43E0B0";
    default:
      return "#7C3AED";
  }
};

// hex カラーを rgba 文字列へ変換（グラデーションの透過指定用）。
const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface GenreCardProps {
  genre: string;
  index: number;
  scrollX: SharedValue<number>;
  onNavigate: (genre: string) => void;
}

const GenreCard = memo(function GenreCard({
  genre,
  index,
  scrollX,
  onNavigate,
}: GenreCardProps) {
  const accent = getGenreAccent(genre);
  const press = useSharedValue(1);

  // スクロール位置に応じた中央カードの強調 + 押下時の軽い縮小フィードバック。
  const animatedStyle = useAnimatedStyle(() => {
    const cardScale = interpolate(
      scrollX.value,
      [
        (index - 1) * SNAP_INTERVAL,
        index * SNAP_INTERVAL,
        (index + 1) * SNAP_INTERVAL,
      ],
      [0.9, 1, 0.9],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale: cardScale * press.value }],
    };
  });

  const handlePress = () => onNavigate(genre);
  const handlePressIn = () => {
    press.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const indexLabel = String(index + 1).padStart(2, "0");

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardWrapper}
    >
      <Animated.View style={[styles.card, { shadowColor: accent }, animatedStyle]}>
        <View style={styles.cardInner}>
          <View style={StyleSheet.absoluteFill}>
            <ImageBackground
              source={backgroundImages[genre as keyof typeof backgroundImages]}
              style={styles.backgroundImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={250}
            />
          </View>

          {/* 下部の可読性グラデーション（タイトル・ボタンを読みやすくする） */}
          <LinearGradient
            colors={[
              "transparent",
              "transparent",
              "rgba(0,0,0,0.6)",
              "rgba(0,0,0,0.95)",
            ]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.contentContainer}>
            {/* 上段: グラスチップ + インデックス番号 */}
            <View style={styles.topRow}>
              <View
                style={[styles.badge, { borderColor: hexToRgba(accent, 0.55) }]}
              >
                <Disc3 size={16} color={accent} strokeWidth={2} />
              </View>
              <Text style={styles.indexText}>{indexLabel}</Text>
            </View>

            {/* 下段: アクセントライン + eyebrow + タイトル + DISCOVER */}
            <View style={styles.bottomCluster}>
              <View style={[styles.accentLine, { backgroundColor: accent }]} />
              <Text style={styles.eyebrow}>CURATED COLLECTION</Text>
              <Text style={styles.genreTitle} numberOfLines={1}>
                {genre}
              </Text>

              <View style={styles.discoverButton}>
                <Text style={styles.discoverText}>DISCOVER</Text>
                <View style={[styles.discoverIcon, { backgroundColor: accent }]}>
                  <ArrowUpRight size={16} color="#0b0b0d" strokeWidth={2.5} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

interface AnimatedDotProps {
  index: number;
  scrollX: SharedValue<number>;
}

// アクティブなインジケータが横に伸びる「ワーム」型ページネーション。
const AnimatedDot = memo(function AnimatedDot({
  index,
  scrollX,
}: AnimatedDotProps) {
  const dotStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value - index * SNAP_INTERVAL);
    const width = interpolate(
      distance,
      [0, SNAP_INTERVAL],
      [24, 7],
      Extrapolate.CLAMP,
    );
    const opacity = interpolate(
      distance,
      [0, SNAP_INTERVAL],
      [1, 0.32],
      Extrapolate.CLAMP,
    );

    return { width, opacity };
  });

  return <Animated.View style={[styles.indicator, dotStyle]} />;
});

interface PaginationIndicatorProps {
  scrollX: SharedValue<number>;
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

  const navigateToGenre = useCallback(
    (genre: string) => {
      router.push({
        pathname: ROUTES.genre,
        params: { genre: encodeURIComponent(genre) },
      });
    },
    [router],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem = useCallback(
    ({ item, index }: { item: unknown; index: number }) => {
      const genreItem = item as GenreItem;
      return (
        <GenreCard
          genre={genreItem.name}
          index={index}
          scrollX={scrollX}
          onNavigate={navigateToGenre}
        />
      );
    },
    [navigateToGenre, scrollX],
  );

  const keyExtractor = useCallback(
    (item: unknown) => (item as GenreItem).id.toString(),
    [],
  );

  return (
    <View style={styles.container}>
      <AnimatedFlashList
        data={genreCards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
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
    paddingVertical: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 26,
    backgroundColor: "#0c0c0e",
    // shadowColor はジャンルのアクセント色を各カードでインライン指定（色付きグロー）
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 14,
  },
  cardInner: {
    flex: 1,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
  },
  indexText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 34,
    lineHeight: 34,
    fontFamily: FONTS.title,
    includeFontPadding: false,
  },
  bottomCluster: {
    gap: 8,
  },
  accentLine: {
    width: 30,
    height: 3,
    borderRadius: 2,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontFamily: FONTS.body,
    letterSpacing: 3,
  },
  genreTitle: {
    color: "#fff",
    fontSize: 34,
    fontFamily: FONTS.title,
    letterSpacing: -0.5,
  },
  discoverButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 12,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 6,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  discoverText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONTS.semibold,
    letterSpacing: 2,
  },
  discoverIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    height: 8,
  },
  indicator: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    marginHorizontal: 3,
  },
});

export default memo(HeroBoard);
