import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Spotlight } from "@/types";
import { useReelsPlayer } from "@/hooks/useReelsPlayer";

const { width, height } = Dimensions.get("window");

interface ReelItemProps {
  item: Spotlight;
  isVisible: boolean;
  onFinish?: () => void;
}

function ReelItem({ item, isVisible, onFinish }: ReelItemProps) {
  const player = useReelsPlayer(item.video_path, isVisible, onFinish);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.overlay}
      >
        <View style={styles.contentContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.artist}>{item.author}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <ActionButton icon="heart-outline" label="Like" />
            <ActionButton icon="chatbubble-outline" label="Comment" />
            <ActionButton icon="share-social-outline" label="Share" />
            <ActionButton icon="ellipsis-horizontal" label="More" />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// メモ化してエクスポート
export default memo(ReelItem, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isVisible === nextProps.isVisible
  );
});

const ActionButton = memo(
  ({
    icon,
    label,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }) => (
    <TouchableOpacity style={styles.actionButton} disabled={true}>
      <Ionicons name={icon} size={30} color="#fff" style={{ opacity: 0.6 }} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  )
);

const styles = StyleSheet.create({
  container: {
    width,
    height, // 画面全体の高さを使用
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 80, // Adjust for tab bar
    paddingHorizontal: 16,
    paddingTop: 100,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  artist: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  actionsContainer: {
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
});
