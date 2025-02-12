import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";

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
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.modalContainer}>
        <Video
          source={item.video_path}
          style={[
            styles.video,
            { width: windowWidth * 0.8, height: windowHeight * 0.7 },
          ]}
          shouldPlay
          isLooping
          resizeMode={ResizeMode.CONTAIN}
          isMuted={isMuted}
        />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="#fff" />
        </Pressable>

        <Pressable onPress={onMuteToggle} style={styles.muteButton}>
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
            color="#fff"
          />
        </Pressable>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    backgroundColor: "black",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
  },
  muteButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 2,
  },
  textContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "black",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  description: {
    fontSize: 12,
    color: "#fff",
    marginTop: 5,
    textAlign: "center",
    textShadowColor: "black",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
