import React, { useMemo } from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

interface GenreCardProps {
  genre: string;
}

const cardWidth = 320;
const cardHeight = 160;

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

const backgroundImages = {
  "Retro Wave": require("../assets/images/RetroWave.jpg"),
  "Electro House": require("../assets/images/ElectroHouse.jpg"),
  "Nu Disco": require("../assets/images/NuDisco.jpg"),
  "City Pop": require("../assets/images/CityPop.jpg"),
  "Tropical House": require("../assets/images/TropicalHouse.jpg"),
  "Vapor Wave": require("../assets/images/VaporWave.jpg"),
  "r&b": require("../assets/images/RnB.jpg"),
  "Chill House": require("../assets/images/ChillHouse.jpg"),
} as const;

const GenreCard: React.FC<GenreCardProps> = ({ genre }) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    router.push({
      pathname: "/genre/[genre]",
      params: { genre: encodeURIComponent(genre) },
    });
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          <Image
            source={backgroundImages[genre as keyof typeof backgroundImages]}
            style={styles.backgroundImage}
          />

          <LinearGradient
            colors={getGradientColors(genre)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />

          <View style={styles.glassEffect} />

          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.icon}>{getGenreIcon(genre)}</Text>
              <Text style={styles.genreText}>{genre}</Text>
            </View>

            <View style={styles.decorativeContainer}>
              <View style={styles.decorativeLine} />
              <Animated.View style={styles.decorativeCircle} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
    resizeMode: "cover",
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  glassEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(2px)",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 32,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  genreText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  decorativeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  decorativeLine: {
    width: 80,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  decorativeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GenreCard;
