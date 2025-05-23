import React, { useState, useRef, useCallback, memo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SpotlightModal from "../modal/SpotlightModal";
import { CACHED_QUERIES } from "@/constants";
import getSpotlights from "@/actions/getSpotlights";
import { useQuery } from "@tanstack/react-query";
import Loading from "../common/Loading";
import Error from "../common/Error";
import { Video, ResizeMode } from "expo-av";

function SpotlightBoard() {
  const [isMuted, setIsMuted] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const videoRefs = useRef<any[]>([]);

  const {
    data: spotlightData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.spotlights],
    queryFn: getSpotlights,
  });

  // 動画再生/停止はタッチイン・アウトで制御
  const handlePressIn = useCallback((index: number) => {
    const videoRef = videoRefs.current[index];

    if (videoRef) {
      videoRef
        .playAsync()
        .catch((error: any) => console.log("Video play failed:", error));
    }
  }, []);

  const handlePressOut = useCallback((index: number) => {
    const videoRef = videoRefs.current[index];

    if (videoRef) {
      videoRef
        .pauseAsync()
        .catch((error: any) => console.log("Video pause failed:", error));
    }
  }, []);

  // タッチ時にモーダルを表示
  const handlePress = useCallback((item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // ビデオレファレンスを設定するコールバック
  const setVideoRef = useCallback((ref: any, index: number) => {
    if (ref) videoRefs.current[index] = ref;
  }, []);

  if (isLoading) return <Loading />;
  if (isError) return <Error message={"Something went wrong"} />;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {spotlightData?.map((item, index) => (
          <Pressable
            key={item.id}
            style={styles.videoWrapper}
            onPressIn={() => handlePressIn(index)}
            onPressOut={() => handlePressOut(index)}
            onPress={() => handlePress(item)}
          >
            <Video
              ref={(ref) => setVideoRef(ref, index)}
              source={{ uri: item.video_path }}
              style={styles.video}
              isLooping
              shouldPlay={false}
              resizeMode={ResizeMode.COVER}
              isMuted={isMuted}
            />
            <TouchableOpacity
              style={styles.muteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMuteToggle();
              }}
            >
              <Ionicons
                name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </Pressable>
        ))}
      </ScrollView>
      {modalVisible && selectedItem && (
        <SpotlightModal
          item={selectedItem}
          isMuted={isMuted}
          onMuteToggle={handleMuteToggle}
          onClose={() => setModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  videoWrapper: {
    width: 120,
    aspectRatio: 9 / 16,
    marginRight: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  muteButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 20,
    zIndex: 1,
  },
});

// コンポーネント全体をメモ化してエクスポート
export default memo(SpotlightBoard);
