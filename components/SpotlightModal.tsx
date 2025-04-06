import React, { useRef, useEffect, memo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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

const SpotlightModal = ({
  item,
  isMuted,
  onMuteToggle,
  onClose,
}: SpotlightModalProps) => {
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;
  const fadeAnim = useSharedValue(0);

  const videoRef = useRef(null);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 300 });
  }, []);

  const handleClose = () => {
    fadeAnim.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar translucent backgroundColor="rgba(0,0,0,0.7)" />
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            useAnimatedStyle(() => {
              const scale = interpolate(
                fadeAnim.value,
                [0, 1],
                [0.9, 1],
                Extrapolation.CLAMP
              );

              return {
                opacity: fadeAnim.value,
                transform: [{ scale }],
              };
            }),
          ]}
        >
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: item.video_path }}
              style={[
                styles.video,
                { width: windowWidth * 0.9, height: windowHeight * 0.7 },
              ]}
              shouldPlay
              isLooping
              resizeMode={ResizeMode.COVER}
              isMuted={isMuted}
            />

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.gradientOverlay}
            />
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onMuteToggle}
            style={styles.muteButton}
            activeOpacity={0.7}
          >
            <View style={styles.iconButton}>
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={22}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// カスタム比較関数を使用してメモ化
export default memo(SpotlightModal, (prevProps, nextProps) => {
  // video_pathとisMutedが同じ場合は再レンダリングしない
  return (
    prevProps.item.video_path === nextProps.item.video_path &&
    prevProps.isMuted === nextProps.isMuted
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "80%",
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  video: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 16,
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  muteButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  controlsContainer: {
    position: "absolute",
    right: 16,
    bottom: "30%",
    alignItems: "center",
    zIndex: 5,
  },
  textContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
