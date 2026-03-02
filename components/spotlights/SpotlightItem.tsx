import React, { memo, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Volume2, VolumeX } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spotlight } from "@/types";
import { useSpotlightPlayer } from "@/hooks/audio/useSpotlightPlayer";
import { useSpotlightStore } from "@/hooks/stores/useSpotlightStore";
import { COLORS, FONTS } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface SpotlightItemProps {
  item: Spotlight;
  index: number;
  isParentFocused: boolean;
  bottomPadding?: number;
}

function SpotlightItem({
  item,
  index,
  isParentFocused,
  bottomPadding = 0,
}: SpotlightItemProps) {
  const insets = useSafeAreaInsets();
  const isVisibleStore = useSpotlightStore(
    (state) => state.visibleIndex === index,
  );
  const isVisible = isVisibleStore && isParentFocused;
  const player = useSpotlightPlayer(item.video_path, isVisible);

  const [isMuted, setIsMuted] = useState(false);
  const prevIsVisibleRef = useRef(false);

  useEffect(() => {
    const wasVisible = prevIsVisibleRef.current;
    prevIsVisibleRef.current = isVisible;

    if (!wasVisible && isVisible) {
      player.muted = false;
      setIsMuted(false);
    }
  }, [isVisible]);

  const toggleMute = () => {
    const next = !isMuted;
    player.muted = next;
    setIsMuted(next);
  };

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {/* グラデーションオーバーレイでテキスト等の視認性を高める */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.6)",
          "transparent",
          "transparent",
          "rgba(10,10,10,0.6)",
          COLORS.background,
        ]}
        locations={[0, 0.15, 0.5, 0.85, 1]}
        style={styles.gradientOverlay}
      />

      <View style={[styles.overlayContainer, { paddingTop: insets.top + 20 }]}>
        {/* トップバー (ミュートボタン) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={toggleMute}
            activeOpacity={0.7}
            style={styles.muteButton}
          >
            <BlurView intensity={25} tint="dark" style={styles.iconBlur}>
              {isMuted ? (
                <VolumeX color={COLORS.text} size={22} strokeWidth={1.5} />
              ) : (
                <Volume2 color={COLORS.text} size={22} strokeWidth={1.5} />
              )}
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* 下部情報セクション */}
        <View
          style={[styles.bottomSection, { paddingBottom: bottomPadding + 30 }]}
        >
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <BlurView intensity={25} tint="dark" style={styles.infoContainer}>
              {item.genre && (
                <View style={styles.genreBadge}>
                  <Text style={styles.genreText}>
                    {item.genre.toUpperCase()}
                  </Text>
                </View>
              )}

              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>

              <Text
                style={[
                  styles.author,
                  item.description ? { marginBottom: 16 } : null,
                ]}
              >
                {item.author}
              </Text>

              {item.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
            </BlurView>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: COLORS.background,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  muteButton: {
    width: 44,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconBlur: {
    flex: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,10,10,0.4)",
  },
  bottomSection: {
    paddingHorizontal: 20,
    justifyContent: "flex-end",
  },
  infoContainer: {
    padding: 24,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(20, 20, 20, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  genreBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  genreText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontFamily: FONTS.title,
    lineHeight: 38,
    marginBottom: 8,
  },
  author: {
    color: COLORS.subText,
    fontSize: 16,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
  },
  description: {
    color: COLORS.subText,
    fontSize: 13,
    fontFamily: FONTS.body,
    opacity: 0.7,
    lineHeight: 20,
  },
});

export default memo(SpotlightItem, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index &&
    prevProps.isParentFocused === nextProps.isParentFocused
  );
});
