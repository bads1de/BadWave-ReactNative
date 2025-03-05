import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  LayoutAnimation,
} from "react-native";

interface LyricProps {
  lyrics: string;
  initialVisibleLines?: number;
}

const Lyric: React.FC<LyricProps> = ({ lyrics, initialVisibleLines = 3 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Split lyrics into lines
  const lyricsLines = lyrics.split("\n");

  // Determine which lines to show based on expanded state
  const displayedLines = isExpanded
    ? lyricsLines
    : lyricsLines.slice(0, initialVisibleLines);

  const toggleExpand = () => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {displayedLines.map((line, index) => (
          <Text key={index} style={styles.lyricsText}>
            {line}
          </Text>
        ))}
      </ScrollView>

      {lyricsLines.length > initialVisibleLines && (
        <TouchableOpacity
          onPress={toggleExpand}
          style={styles.expandButton}
        ></TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    borderRadius: 15,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  lyricsText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    textShadowColor: "#fff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  expandButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "transparent",
    borderRadius: 50,
    height: 10,
    width: 50,
    borderWidth: 2,
    borderColor: "#4c1d95",
  },
});

export default Lyric;
