import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  memo,
  useCallback,
} from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  LayoutChangeEvent,
} from "react-native";
import { BlurView } from "expo-blur";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Mic2 } from "lucide-react-native";
import { useProgress } from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LyricProps {
  lyrics: string | null | undefined;
  testID?: string;
  songTitle?: string;
  artistName?: string;
}

interface ParsedLine {
  time: number;
  text: string;
}

// [00:00.00] format parser
const parseLrc = (lrc: string): ParsedLine[] => {
  const lines = lrc.split("\n");
  const result: ParsedLine[] = [];
  // Regex for [mm:ss.xx] or [mm:ss.xxx]
  // Note: Some LRC might have multiple timestamps like [00:12.00][00:15.00]Text
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    // Reset regex state
    timeRegex.lastIndex = 0;

    const matches = Array.from(line.matchAll(timeRegex));
    if (matches.length > 0) {
      const text = line.replace(timeRegex, "").trim();

      for (const match of matches) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const msStr = match[3];
        // Standardize to milliseconds. If 2 digits, it's 10ms units. If 3, it's 1ms.
        const ms = msStr.length === 2 ? parseInt(msStr) * 10 : parseInt(msStr);

        const time = min * 60 + sec + ms / 1000;
        result.push({ time, text });
      }
    }
  }

  // Sort by time just in case
  return result.sort((a, b) => a.time - b.time);
};

interface LyricLineItemProps {
  line: ParsedLine;
  index: number;
  isActive: boolean;
  onSeek: (time: number) => void;
  onLayoutY: (index: number, y: number) => void;
  activeColor: string;
}

const LyricLineItem = memo(
  ({
    line,
    index,
    isActive,
    onSeek,
    onLayoutY,
    activeColor,
  }: LyricLineItemProps) => {
    const handlePress = useCallback(() => {
      onSeek(line.time);
    }, [onSeek, line.time]);

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        onLayoutY(index, e.nativeEvent.layout.y);
      },
      [index, onLayoutY],
    );

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        onLayout={handleLayout}
        style={[
          styles.lineWrapper,
          isActive && {
            borderColor: activeColor,
            borderWidth: 1,
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 5,
            backgroundColor: "#000000", // 黒固定
          },
        ]}
      >
        <Text style={[styles.lyricText, isActive && styles.activeLyricText]}>
          {line.text === "" ? "♫" : line.text}
        </Text>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    return (
      prev.isActive === next.isActive &&
      prev.line.text === next.line.text &&
      prev.line.time === next.line.time &&
      prev.activeColor === next.activeColor &&
      // onSeek and onLayoutY should be stable, so strictly comparing them is fine
      prev.onSeek === next.onSeek &&
      prev.onLayoutY === next.onLayoutY
    );
  },
);

LyricLineItem.displayName = "LyricLineItem";

const Lyric: React.FC<LyricProps> = ({ lyrics, songTitle, artistName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { position } = useProgress(100); // 100ms update for smoother sync
  const scrollViewRef = useRef<ScrollView>(null);
  const [lineCoords, setLineCoords] = useState<{ [key: number]: number }>({});
  const [containerHeight, setContainerHeight] = useState(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const colors = useThemeStore((state) => state.colors);

  const parsedLyrics = useMemo(() => {
    if (!lyrics) return [];
    if (!lyrics.includes("[")) return []; // Plain text fallback
    return parseLrc(lyrics);
  }, [lyrics]);

  const hasLrc = parsedLyrics.length > 0;

  // Non-LRC lines
  const plainLines = useMemo(() => {
    if (hasLrc || !lyrics) return [];
    return lyrics.split("\n").filter((l) => l.trim() !== "");
  }, [lyrics, hasLrc]);

  // Find active index
  const activeIndex = useMemo(() => {
    if (!hasLrc) return -1;
    // Helper: Find the *last* line that has started
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].time <= position) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [position, parsedLyrics, hasLrc]);

  // Auto Scroll logic
  useEffect(() => {
    if (
      !hasLrc ||
      activeIndex === -1 ||
      isUserScrolling.current ||
      !scrollViewRef.current
    )
      return;

    const y = lineCoords[activeIndex];
    // We want to center the active line.
    if (y !== undefined && containerHeight > 0) {
      // Estimate line height roughly as 40 if not measured, but we rely on y.
      // Target scroll position = y - (viewHeight / 2) + (lineHeight / 2)
      // We don't have exact line height, but let's assume ~30-40px.
      const targetY = y - containerHeight / 2 + 20;
      scrollViewRef.current.scrollTo({
        y: Math.max(0, targetY),
        animated: true,
      });
    }
  }, [activeIndex, containerHeight, hasLrc]); // lineCoords intentionally omitted to avoid loops, only trigger on index change

  const handleScrollBegin = useCallback(() => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
  }, []);

  const handleScrollEnd = useCallback(() => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 2500);
  }, []);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    TrackPlayer.seekTo(time);
  }, []);

  const handleLineLayout = useCallback((index: number, y: number) => {
    setLineCoords((prev) => {
      // Only update if changed significantly to avoid rerenders
      if (Math.abs((prev[index] || 0) - y) > 1) {
        return { ...prev, [index]: y };
      }
      return prev;
    });
  }, []);

  if (!lyrics) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionTitleContainer}>
        <View style={styles.titleRow}>
          <Mic2 size={20} color={colors.primary} strokeWidth={1.5} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Lyrics
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={toggleExpand} style={styles.expandBtn}>
            <MaterialCommunityIcons
              name={
                isExpanded ? "arrow-collapse-vertical" : "arrow-expand-vertical"
              }
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {!hasLrc ? (
          // PLAIN TEXT VIEW (Legacy behavior)
          <View style={styles.plainContainer}>
            {plainLines.slice(0, isExpanded ? undefined : 6).map((line, i) => (
              <Text key={i} style={styles.plainText}>
                {line}
              </Text>
            ))}
            {!isExpanded && plainLines.length > 6 && (
              <Text style={styles.moreText}>...</Text>
            )}
          </View>
        ) : (
          // SYNCED LYRICS VIEW
          <View style={{ height: isExpanded ? 400 : 250 }}>
            <ScrollView
              ref={scrollViewRef}
              nestedScrollEnabled={true}
              onScrollBeginDrag={handleScrollBegin}
              onScrollEndDrag={handleScrollEnd}
              onMomentumScrollEnd={handleScrollEnd}
              showsVerticalScrollIndicator={false}
              onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
              contentContainerStyle={styles.scrollContent}
            >
              {parsedLyrics.map((line, index) => (
                <LyricLineItem
                  key={index}
                  line={line}
                  index={index}
                  isActive={index === activeIndex}
                  onSeek={handleSeek}
                  onLayoutY={handleLineLayout}
                  activeColor={colors.primary}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          {(songTitle || artistName) && (
            <Text style={styles.songInfo}>
              {songTitle} {artistName && `- ${artistName}`}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionTitleContainer: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  titleSeparator: {
    height: 1,
    width: "100%",
    opacity: 0.6,
  },
  contentContainer: {
    paddingHorizontal: 4,
  },
  expandBtn: {
    padding: 4,
  },
  plainContainer: {
    paddingVertical: 10,
  },
  plainText: {
    color: "#E0E0E0", // Solid color instead of rgba
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  moreText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 4,
  },

  // Synced Styles
  scrollContent: {
    paddingVertical: "50%",
  },
  lineWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
  },
  lyricText: {
    fontSize: 16,
    color: "#808080", // Solid gray
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "transparent",
  },
  activeLyricText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "900", // More bold
    transform: [{ scale: 1.05 }],
    textShadowColor: "rgba(255, 255, 255, 1.0)", // Max intensity
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30, // Wider glow
  },
  // Removed topFade, bottomFade
  footer: {
    marginTop: 10,
    alignItems: "center",
  },
  songInfo: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
  },
});

export default memo(Lyric);
