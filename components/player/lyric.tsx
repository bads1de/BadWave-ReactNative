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

import { Mic2, ChevronDown, ChevronUp } from "lucide-react-native";
import TrackPlayer, { useProgress } from "@rntp/player";
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
  initialVisibleLines?: number;
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
        style={styles.lineWrapper}
      >
        <Text
          style={[
            styles.lyricText,
            isActive && [
              styles.activeLyricText,
              { textShadowColor: activeColor },
            ],
          ]}
        >
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

const LyricContent = memo(
  ({
    lyrics,
    isExpanded,
    hasLrc,
    toggleExpand,
    initialVisibleLines,
  }: {
    lyrics: string;
    isExpanded: boolean;
    hasLrc: boolean;
    toggleExpand: () => void;
    initialVisibleLines: number;
  }) => {
    const { position } = useProgress(0.1);
    const scrollViewRef = useRef<ScrollView>(null);
    const [lineCoords, setLineCoords] = useState<{ [key: number]: number }>({});
    const [containerHeight, setContainerHeight] = useState(0);
    const isUserScrolling = useRef(false);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const colors = useThemeStore((state) => state.colors);

    const parsedLyrics = useMemo(() => {
      if (!lyrics) return [];
      if (!lyrics.includes("[")) return [];
      return parseLrc(lyrics);
    }, [lyrics]);

    const plainLines = useMemo(() => {
      if (hasLrc || !lyrics) return [];
      return lyrics.split("\n").filter((l) => l.trim() !== "");
    }, [lyrics, hasLrc]);

    const activeIndex = useMemo(() => {
      if (!hasLrc) return -1;
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

    useEffect(() => {
      if (
        !hasLrc ||
        activeIndex === -1 ||
        isUserScrolling.current ||
        !scrollViewRef.current
      )
        return;

      const y = lineCoords[activeIndex];
      if (y !== undefined && containerHeight > 0) {
        const targetY = y - containerHeight / 2 + 20;
        scrollViewRef.current.scrollTo({
          y: Math.max(0, targetY),
          animated: true,
        });
      }
    }, [activeIndex, containerHeight, hasLrc, lineCoords]);

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

    const handleSeek = useCallback((time: number) => {
      TrackPlayer.seekTo(time);
    }, []);

    const handleLineLayout = useCallback((index: number, y: number) => {
      setLineCoords((prev) => {
        if (Math.abs((prev[index] || 0) - y) > 1) {
          return { ...prev, [index]: y };
        }
        return prev;
      });
    }, []);

    return (
      <>
        {!hasLrc ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.plainScrollView}
          >
            <View style={styles.plainContainer}>
              {plainLines
                .slice(0, isExpanded ? undefined : initialVisibleLines)
                .map((line, i) => (
                  <Text key={i} style={styles.plainText}>
                    {line}
                  </Text>
                ))}
            </View>
            {plainLines.length > initialVisibleLines && (
              <TouchableOpacity
                onPress={toggleExpand}
                style={styles.showMoreBtn}
              >
                <Text
                  style={[
                    styles.showMoreText,
                    { color: colors.primaryLight ?? colors.primary },
                  ]}
                >
                  {isExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
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
      </>
    );
  },
);

LyricContent.displayName = "LyricContent";

const Lyric: React.FC<LyricProps> = ({
  lyrics,
  songTitle,
  artistName,
  initialVisibleLines = 3,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = useThemeStore((state) => state.colors);

  if (lyrics === null || lyrics === undefined) {
    throw new Error("Lyrics must be provided");
  }

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);

  const hasLrc = useMemo(() => {
    if (!lyrics) return false;
    if (!lyrics.includes("[")) return false;
    return parseLrc(lyrics).length > 0;
  }, [lyrics]);

  const accent = colors.primaryLight ?? colors.primary;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.titleRow}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <Mic2 size={17} color={accent} strokeWidth={1.8} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Lyrics
        </Text>
        <View style={{ flex: 1 }} />
        <View style={styles.expandBtn}>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.subText} strokeWidth={1.8} />
          ) : (
            <ChevronDown size={20} color={colors.subText} strokeWidth={1.8} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        {(!hasLrc || isExpanded) && (
          <LyricContent
            lyrics={lyrics}
            isExpanded={isExpanded}
            hasLrc={hasLrc}
            toggleExpand={toggleExpand}
            initialVisibleLines={initialVisibleLines}
          />
        )}

        {hasLrc && !isExpanded && (
          <TouchableOpacity
            style={styles.previewContainer}
            onPress={toggleExpand}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.previewText,
                { color: colors.subText },
              ]}
            >
              Tap to view synced lyrics
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          {(songTitle || artistName) && (
            <Text style={styles.songInfo}>
              {songTitle && <Text>{songTitle}</Text>}
              {songTitle && artistName && <Text> - </Text>}
              {artistName && <Text>{artistName}</Text>}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.title,
    letterSpacing: 0.4,
  },
  contentContainer: {
    paddingHorizontal: 0,
  },
  expandBtn: {
    padding: 4,
  },
  plainContainer: {
    paddingVertical: 10,
  },
  previewContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    marginTop: 8,
  },
  previewText: {
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  plainText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 16,
    fontFamily: FONTS.body,
    lineHeight: 30,
    marginBottom: 8,
    textAlign: "center",
  },
  plainScrollView: {
    maxHeight: 300,
  },
  showMoreBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },

  // Synced Styles
  scrollContent: {
    paddingVertical: "50%",
  },
  lineWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 2,
  },
  lyricText: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    color: "rgba(255, 255, 255, 0.45)",
    textAlign: "center",
  },
  activeLyricText: {
    fontSize: 21,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  footer: {
    marginTop: 12,
    alignItems: "center",
  },
  songInfo: {
    fontSize: 11,
    fontFamily: FONTS.body,
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.35)",
  },
});

export default memo(Lyric);
