import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

interface SpotlightModalProps {
  item: {
    video_path: any;
    title: string;
    description: string;
  };
  isMuted: boolean;
  onMuteToggle: () => void;
  onClose: () => void;
}

export default function SpotlightModal({
  item,
  isMuted,
  onMuteToggle,
  onClose,
}: SpotlightModalProps) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Video
            source={item.video_path}
            style={styles.video}
            shouldPlay
            isLooping
            resizeMode={ResizeMode.CONTAIN}
            isMuted={isMuted}
          />
          <TouchableOverlay onPress={onMuteToggle} />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

import { TouchableOpacity } from "react-native";

// 例として動画上でタップするとミュート状態を切り替えるための半透明オーバーレイ
function TouchableOverlay({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.overlay}
      activeOpacity={0.7}
    />
  );
}

const { width, height } = Dimensions.get("window");
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: "#222",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    padding: 16,
  },
  video: {
    width: "100%",
    height: "60%",
    borderRadius: 12,
  },
  overlay: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
    zIndex: 2,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  description: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 3,
  },
});
