import React from "react";
import { View, StyleSheet } from "react-native";
import MiniPlayer from "@/components/MiniPlayer";
import Player from "@/components/Player";
import SwipeablePlayer from "@/components/SwipeablePlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/hooks/useAudioStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useQuery } from "@tanstack/react-query";
import getTopPlayedSongs from "@/actions/getTopPlayedSongs";
import { CACHED_QUERIES } from "@/constants";
import { useUser } from "@/actions/getUser";

/**
 * プレーヤーコンテナコンポーネント
 *
 * このコンポーネントは、MiniPlayerとPlayerコンポーネントを管理し、
 * 再生状態の更新による不要な再レンダリングを防ぎます。
 */
export default function PlayerContainer() {
  const { data: user } = useUser();
  const userId = user?.id;
  const { showPlayer, setShowPlayer, showSwipeablePlayer, setShowSwipeablePlayer, activeSongIndex } = usePlayerStore();
  const { currentSong, repeatMode, shuffle } = useAudioStore();

  // トップ再生曲を取得
  const { data: topSongs = [] } = useQuery({
    queryKey: [CACHED_QUERIES.topPlayedSongs, userId],
    queryFn: () => getTopPlayedSongs(userId),
    enabled: !!userId,
  });

  // 再生コントロール関数と進捗情報を取得
  const {
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    setRepeat,
    setShuffle,
    progressPosition,
    progressDuration,
  } = useAudioPlayer();

  // 曲が設定されていない場合は何も表示しない
  if (!currentSong) return null;

  // アクティブな曲と前後の曲を取得（TopPlayedSongsListから呼び出された場合）
  const getActiveTopPlayedSong = () => {
    if (activeSongIndex === null || !topSongs.length) return null;
    return topSongs[activeSongIndex];
  };

  const getPrevTopPlayedSong = () => {
    if (activeSongIndex === null || activeSongIndex <= 0 || !topSongs.length) return undefined;
    return topSongs[activeSongIndex - 1];
  };

  const getNextTopPlayedSong = () => {
    if (activeSongIndex === null || activeSongIndex >= topSongs.length - 1 || !topSongs.length) return undefined;
    return topSongs[activeSongIndex + 1];
  };

  // スワイプ可能なプレイヤーを閉じる処理
  const handleCloseSwipeablePlayer = () => {
    setShowSwipeablePlayer(false);
  };

  return (
    <>
      {showSwipeablePlayer && (
        <View style={styles.swipeablePlayerContainer}>
          <SwipeablePlayer
            isVisible={showSwipeablePlayer}
            currentSong={getActiveTopPlayedSong() || currentSong}
            prevSong={getPrevTopPlayedSong()}
            nextSong={getNextTopPlayedSong()}
            onClose={handleCloseSwipeablePlayer}
          />
        </View>
      )}
      
      {showPlayer ? (
        <View style={styles.fullPlayerContainer}>
          <Player
            isPlaying={isPlaying}
            currentSong={currentSong}
            position={progressPosition}
            duration={progressDuration}
            onPlayPause={() => togglePlayPause()}
            onNext={playNextSong}
            onPrev={playPrevSong}
            onSeek={seekTo}
            onClose={() => setShowPlayer(false)}
            repeatMode={repeatMode}
            setRepeatMode={setRepeat}
            shuffle={shuffle}
            setShuffle={setShuffle}
          />
        </View>
      ) : (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={() => togglePlayPause()}
            onPress={() => setShowPlayer(true)}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  swipeablePlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 15,
  },
  fullPlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 10,
  },
  miniPlayerContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 5,
  },
});
