import React, { useMemo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface GenreCardProps {
  genre: string;
}

const cardWidth = 320;
const cardHeight = 160;
const shapeWidth = cardWidth * 0.75; // 240
const shapeHeight = cardHeight * 0.75; // 120

const getPolygonPoints = (genre: string): string => {
  switch (genre) {
    case "Retro Wave":
      return "0,100 20,100 20,0 40,0 40,50 60,50 60,100 100,100 100,80 0,80";
    case "Electro House":
      return "0,0 80,0 80,20 100,20 100,100 60,100 60,40 0,40";
    case "Nu Disco":
      return "0,20 80,20 80,0 100,0 100,100 80,100 80,40 0,40";
    case "City Pop":
      return "0,0 100,0 100,30 70,30 70,70 30,70 30,30 0,30";
    case "Tropical House":
      return "0,100 100,100 100,70 70,70 70,30 30,30 30,70 0,70";
    case "Vapor Wave":
      return "0,0 50,0 50,50 100,50 100,100 50,100 50,50 0,50";
    case "Trance":
      return "0,100 30,100 30,0 70,0 70,100 100,100 100,70 0,70";
    default:
      return "0,0 30,0 30,70 70,70 70,0 100,0 100,30 0,30";
  }
};

const COLORS = [
  "#a855f7",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#f97316",
];

const GenreCard: React.FC<GenreCardProps> = ({ genre }) => {
  const router = useRouter();

  // 初回レンダリング時にランダムなカラーを決定
  const randomColor = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * COLORS.length);
    return COLORS[randomIndex];
  }, []);

  const handlePress = () => {
    router.push({
      pathname: "/genre/[genre]",
      params: { genre: encodeURIComponent(genre) },
    });
  };

  return (
    <View style={styles.pageContainer}>
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <View style={styles.card}>
          <View style={styles.shapeContainer}>
            <Svg width={shapeWidth} height={shapeHeight} viewBox="0 0 100 100">
              <Polygon points={getPolygonPoints(genre)} fill={randomColor} />
            </Svg>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.genreText}>{genre}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  container: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: "#000",
    overflow: "hidden",
    position: "relative",
    borderRadius: 12,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shapeContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  genreText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default GenreCard;
