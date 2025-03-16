import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import MiniPlayer from "@/components/MiniPlayer";
import Player from "@/components/Player";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/hooks/useAudioStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { State, usePlaybackState } from "react-native-track-player";

/**
 * プレーヤーコンテナコンポーネント
 *
 * このコンポーネントは、MiniPlayerとPlayerコンポーネントを管理し、
 * 再生状態の更新による不要な再レンダリングを防ぎます。
 */
export default function PlayerContainer() {
  const { showPlayer, setShowPlayer } = usePlayerStore();
  const { currentSong, repeatMode, shuffle } = useAudioStore();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  // 再生コントロール関数と進捗情報を取得
  const {
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

  return (
    <>
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
            onPlayPause={togglePlayPause}
            onPress={() => setShowPlayer(true)}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
