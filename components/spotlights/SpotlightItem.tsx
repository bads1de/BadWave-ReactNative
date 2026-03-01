import React, { memo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { VideoView } from "expo-video";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Spotlight } from "@/types";
import { useSpotlightPlayer } from "@/hooks/audio/useSpotlightPlayer";
import { useSpotlightStore } from "@/hooks/stores/useSpotlightStore";

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
  bottomPadding,
}: SpotlightItemProps) {
  const isVisibleStore = useSpotlightStore(
    (state) => state.visibleIndex === index,
  );
  const isVisible = isVisibleStore && isParentFocused;
  const player = useSpotlightPlayer(item.video_path, isVisible);
  const rotation = useSharedValue(0);
  const [isMuted, setIsMuted] = useState(player.muted);

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  useEffect(() => {
    if (isVisible) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 5000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [isVisible, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Gradient Overlay for better visibility */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
        locations={[0, 0.6, 1]}
        style={styles.gradientOverlay}
      />

      <View style={styles.overlayContainer}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? "volume-medium" : "volume-mute"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomSection, { paddingBottom: bottomPadding }]}>
          <View style={styles.bottomRow}>
            {/* Left Side: Artist & Description */}
            <View style={styles.leftColumn}>
              <View style={styles.artistRow}>
                <View style={styles.avatarContainer}>
                  {/* Placeholder avatar if none exists */}
                  <Image
                    source={{ uri: "https://github.com/shadcn.png" }}
                    style={styles.avatar}
                  />
                </View>
                <Text style={styles.artistName}>{item.author}</Text>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagContainer}>
                <Ionicons
                  name="shuffle"
                  size={14}
                  color="#e0e0e0"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.tagText}>Remix of {item.author}</Text>
              </View>
            </View>

            {/* Right Side: Action Buttons */}
            <View style={styles.rightColumn}>
              <ActionItem icon="refresh" />
              <ActionItem icon="heart" count="24" isLiked />
              <ActionItem icon="chatbubble-ellipses" count="2" />
              <ActionItem icon="share-social" label="Share" />
              <ActionItem icon="ellipsis-horizontal" />

              <View style={styles.discContainer}>
                <Animated.View style={[styles.disc, animatedStyle]}>
                  <Image
                    source={{ uri: "https://github.com/shadcn.png" }}
                    style={styles.discImage}
                  />
                </Animated.View>
              </View>
            </View>
          </View>

          {/* Bottom Context Bar */}
          <View style={styles.contextBarWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.contextBar}>
              <View style={styles.contextInfo}>
                <Image
                  source={{ uri: "https://github.com/shadcn.png" }}
                  style={styles.miniArt}
                />
                <View>
                  <Text style={styles.contextTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.contextArtist}>{item.author}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.saveButton}>
                <Ionicons
                  name="add"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.saveButtonText}>SAVE</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </View>
    </View>
  );
}

// Helper component for Right Action Items
const ActionItem = ({
  icon,
  count,
  label,
  isLiked,
}: {
  icon: any;
  count?: string;
  label?: string;
  isLiked?: boolean;
}) => (
  <View style={styles.actionItem}>
    <TouchableOpacity style={styles.actionIconContainer}>
      <Ionicons name={icon} size={32} color={isLiked ? "#ff4081" : "white"} />
    </TouchableOpacity>
    {count && <Text style={styles.actionText}>{count}</Text>}
    {label && <Text style={styles.actionTextSmall}>{label}</Text>}
  </View>
);

export default memo(SpotlightItem, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index &&
    prevProps.isParentFocused === nextProps.isParentFocused
  );
});

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingTop: 60, // Top safe area approximation
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "white",
    overflow: "hidden",
    marginRight: 8,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  artistName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  followButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  followButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: "#e0e0e0",
    fontSize: 12,
  },
  rightColumn: {
    alignItems: "center",
    marginBottom: 10,
  },
  actionItem: {
    alignItems: "center",
    marginBottom: 16,
  },
  actionIconContainer: {
    marginBottom: 2,
    // Add shadow for better visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  actionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  actionTextSmall: {
    color: "white",
    fontSize: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  discContainer: {
    marginTop: 10,
  },
  disc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: "#111",
  },
  discImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  contextBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  contextBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(20, 20, 20, 0.6)",
    borderRadius: 30,
    padding: 8,
    paddingRight: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  contextInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  miniArt: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#333",
  },
  contextTitle: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  contextArtist: {
    color: "#aaa",
    fontSize: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
