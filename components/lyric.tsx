import React, { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  LayoutAnimation,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface LyricProps {
  lyrics: string;
  initialVisibleLines?: number;
  songTitle?: string;
  artistName?: string;
}

const Lyric: React.FC<LyricProps> = ({
  lyrics,
  initialVisibleLines = 3,
  songTitle = "",
  artistName = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Split lyrics into lines
  const lyricsLines = lyrics.split("\n");

  // Determine which lines to show based on expanded state
  const displayedLines = isExpanded
    ? lyricsLines
    : lyricsLines.slice(0, initialVisibleLines);

  // Start pulsing animation for button when component mounts
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleExpand = () => {
    // Animate the layout change
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    setIsExpanded(!isExpanded);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={["#4c1d95", "#7e22ce", "#2e1065"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Song information */}
        {(songTitle || artistName) && (
          <View style={styles.songInfoContainer}>
            {songTitle && <Text style={styles.songTitle}>{songTitle}</Text>}
            {artistName && <Text style={styles.artistName}>{artistName}</Text>}
          </View>
        )}

        {/* Audio visualization effect (decorative) */}
        <View style={styles.visualizerContainer}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.visualizerBar,
                { height: 10 + Math.random() * 20 },
              ]}
            />
          ))}
        </View>

        {/* Lyrics display */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {displayedLines.map((line, index) => (
            <Text key={index} style={styles.lyricsText}>
              {line || " "} {/* Show space for empty lines */}
            </Text>
          ))}

          {/* Gradient fade-out effect at the bottom when collapsed */}
          {!isExpanded && lyricsLines.length > initialVisibleLines && (
            <LinearGradient
              colors={["rgba(76, 29, 149, 0)", "rgba(76, 29, 149, 0.9)"]}
              style={styles.fadeOutGradient}
            />
          )}
        </ScrollView>

        {/* Expand/collapse button */}
        {lyricsLines.length > initialVisibleLines && (
          <TouchableOpacity
            onPress={toggleExpand}
            activeOpacity={0.8}
            style={styles.expandButtonContainer}
          >
            <Animated.View
              style={[
                styles.expandButton,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? "Show Less" : "Show More"}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    borderRadius: 20,
    margin: 16,
    overflow: "hidden",
    shadowColor: "#7e22ce",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  gradientBackground: {
    borderRadius: 20,
    overflow: "hidden",
  },
  songInfoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  songTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "#a855f7",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  artistName: {
    color: "#d8b4fe",
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  visualizerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 40,
    padding: 10,
  },
  visualizerBar: {
    width: 4,
    height: 20,
    backgroundColor: "#a855f7",
    marginHorizontal: 3,
    borderRadius: 2,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 10,
  },
  lyricsText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginVertical: 4,
    fontWeight: "500",
    textShadowColor: "rgba(168, 85, 247, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  fadeOutGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  expandButtonContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  expandButton: {
    backgroundColor: "rgba(126, 34, 206, 0.7)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#a855f7",
  },
  expandButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "#4c1d95",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default Lyric;
