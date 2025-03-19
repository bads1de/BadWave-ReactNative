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

  // Split lyrics into lines
  const lyricsLines = lyrics.split("\n");

  // Determine which lines to show based on expanded state
  const displayedLines = isExpanded
    ? lyricsLines
    : lyricsLines.slice(0, initialVisibleLines);

  const toggleExpand = () => {
    // シンプルなアニメーション設定
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Song information */}
      {(songTitle || artistName) && (
        <View style={styles.songInfoContainer}>
          {songTitle && <Text style={styles.songTitle}>{songTitle}</Text>}
          {artistName && <Text style={styles.artistName}>{artistName}</Text>}
        </View>
      )}

      {/* Lyrics display */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {displayedLines.map((line, index) => (
          <Text key={index} style={styles.lyricsText}>
            {line || " "}
          </Text>
        ))}
      </ScrollView>

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
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e1e24",
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  songInfoContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  songTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  artistName: {
    color: "#b3b3cc",
    fontSize: 16,
    textAlign: "center",
  },
  scrollContainer: {
    paddingVertical: 8,
  },
  lyricsText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    marginVertical: 3,
  },
  expandButtonContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  expandButton: {
    backgroundColor: "#333340",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#4c4c60",
  },
  expandButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default Lyric;
