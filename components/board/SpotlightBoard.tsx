import React, { useState, useRef, useCallback, memo, useEffect } from "react";
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

// 型定義
interface SpotlightItem {
  id: string;
  video_path: string;
  title?: string;
  description?: string;
}

// 定数定義
const INACTIVE_VIDEO_INDEX = -1;

function SpotlightBoard() {
  const [isMuted, setIsMuted] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SpotlightItem | null>(null);
  // 最適化: 現在再生中の動画のインデックスを追跡
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(INACTIVE_VIDEO_INDEX);

  // 最適化: Map構造でvideoRefを管理（より効率的）
  const videoRefsMap = useRef<Map<number, Video>>(new Map());

  const {
    data: spotlightData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.spotlights],
    queryFn: getSpotlights,
  });

  // 最適化: 動画再生の最適化（一度に1つのみ再生）
  const handlePressIn = useCallback((index: number) => {
    // 他の動画を停止（同時再生の防止）
    if (activeVideoIndex !== INACTIVE_VIDEO_INDEX && activeVideoIndex !== index) {
      const prevVideoRef = videoRefsMap.current.get(activeVideoIndex);
      if (prevVideoRef) {
        prevVideoRef.pauseAsync().catch(() => {
          // エラーは無視（既に停止している可能性がある）
        });
      }
    }

    // 新しい動画を再生
    const videoRef = videoRefsMap.current.get(index);
    if (videoRef) {
      videoRef
        .playAsync()
        .catch((error: Error) => {
          console.log("動画の再生に失敗しました:", error.message);
        });
      setActiveVideoIndex(index);
    }
  }, [activeVideoIndex]);

  const handlePressOut = useCallback((index: number) => {
    const videoRef = videoRefsMap.current.get(index);
    if (videoRef) {
      videoRef
        .pauseAsync()
        .catch((error: Error) => {
          console.log("動画の停止に失敗しました:", error.message);
        });
    }
    setActiveVideoIndex(INACTIVE_VIDEO_INDEX);
  }, []);

  // タッチ時にモーダルを表示
  const handlePress = useCallback((item: SpotlightItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // 最適化: ビデオレファレンスを設定するコールバック（Map構造を使用）
  const setVideoRef = useCallback((ref: Video | null, index: number) => {
    if (ref) {
      videoRefsMap.current.set(index, ref);
    } else {
      videoRefsMap.current.delete(index);
    }
  }, []);

  // 最適化: クリーンアップの改善（メモリリーク防止）
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時に全ての動画を停止してメモリを解放
      videoRefsMap.current.forEach((ref) => {
        if (ref) {
          ref.pauseAsync().catch(() => {
            // クリーンアップ時のエラーは無視
          });
          ref.unloadAsync().catch(() => {
            // クリーンアップ時のエラーは無視
          });
        }
      });
      videoRefsMap.current.clear();
    };
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
