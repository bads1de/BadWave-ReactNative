import React, { useState, memo } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// AndroidのLayoutAnimation用設定
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LyricProps {
  lyrics: string;
  initialVisibleLines?: number;
  songTitle?: string;
  artistName?: string;
  testID?: string;
}

const Lyric: React.FC<LyricProps> = ({
  lyrics,
  initialVisibleLines = 3,
  songTitle = "",
  artistName = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Split lyrics into lines
  const lyricsLines = lyrics ? lyrics.split("\n") : [];

  // Determine which lines to show based on expanded state
  const displayedLines = isExpanded
    ? lyricsLines
    : lyricsLines.slice(0, initialVisibleLines);

  const toggleExpand = () => {
    // シンプルなアニメーション設定
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  if (lyrics === null || lyrics === undefined) {
    throw new Error("Lyrics are required");
  }

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <Text style={styles.label}>LYRICS</Text>
              <MaterialCommunityIcons
                name="text-box-outline"
                size={16}
                color="#a78bfa"
                style={{ opacity: 0.8 }}
              />
            </View>

            {/* Song information */}
            {(songTitle || artistName) && (
              <View style={styles.songInfoContainer}>
                {songTitle && <Text style={styles.songTitle}>{songTitle}</Text>}
                {artistName && (
                  <Text style={styles.artistName}>{artistName}</Text>
                )}
              </View>
            )}

            {/* Lyrics display */}
            <View style={styles.lyricsContainer}>
              {displayedLines.map((line, index) => (
                <Text key={index} style={styles.lyricsText}>
                  {line || " "}
                </Text>
              ))}
              {!isExpanded && lyricsLines.length > initialVisibleLines && (
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  style={styles.fadeOverlay}
                />
              )}
            </View>

            {/* Expand/collapse button */}
            {lyricsLines.length > initialVisibleLines && (
              <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.7}
                style={styles.expandButtonContainer}
              >
                <View style={styles.expandButton}>
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? "Show less" : "Show more"}
                  </Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#a78bfa"
                  />
                </View>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </ScrollView>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  blurContainer: {
    width: "100%",
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  songInfoContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  songTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  artistName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  lyricsContainer: {
    position: "relative",
    marginBottom: 12,
  },
  lyricsText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 8,
    fontWeight: "500",
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  expandButtonContainer: {
    alignItems: "flex-start",
    marginTop: 8,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.2)",
  },
  expandButtonText: {
    color: "#a78bfa",
    fontWeight: "700",
    fontSize: 12,
    marginRight: 4,
    letterSpacing: 0.5,
  },
});

// メモ化してエクスポート
export default memo(Lyric);
