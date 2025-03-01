import TrackPlayer, {
  Event,
  State,
  Track,
  Capability,
  useProgress,
  RepeatMode,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import Song from "@/types";
import { queueManager } from "./QueueManager";

/**
 * トラックプレイヤーのリピート状態を定義
 */
export const REPEAT_STATES = {
  OFF: "off", // リピートなし
  TRACK: "track", // 現在のトラックをリピート
  QUEUE: "queue", // キュー全体をリピート
};

/**
 * プレイヤーの初期設定を行う
 * @returns {Promise<boolean>} 初期設定が成功したかどうか
 */
export async function setupPlayer() {
  let isSetup = false;

  try {
    await TrackPlayer.getActiveTrackIndex();
    isSetup = true;
  } catch (e) {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.PausePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 2,
    });
    isSetup = true;
  } finally {
    return isSetup;
  }
}

/**
 * プレイバックサービスのイベントリスナーを設定
 */
export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => skipToPrevious());
}

/**
 * 曲データをトラック形式に変換
 * @param {Song[]} songs - 変換する曲データ
 * @returns {Track[]} 変換されたトラックデータ
 */
const convertToTracks = (songs: Song[]): Track[] => {
  return songs.map((song) => ({
    id: song.id,
    url: song.song_path,
    title: song.title,
    artist: song.author,
    artwork: song.image_path,
  }));
};

/**
 * シャッフル状態をトグルする
 * @returns {Promise<boolean>} シャッフルが有効かどうか
 */
export async function toggleShuffle() {
  try {
    const queue = await TrackPlayer.getQueue();
    if (!queue || queue.length <= 1) return false;

    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
    const currentTrack = currentTrackIndex !== null && currentTrackIndex !== undefined && currentTrackIndex >= 0
      ? queue[currentTrackIndex]
      : null;

    const newShuffleState = !queueManager.getShuffleState();
    queueManager.setShuffleState(newShuffleState);

    if (newShuffleState) {
      queueManager.setOriginalQueue(queue);
      const newQueue = queueManager.shuffleQueue(currentTrack, queue);
      await TrackPlayer.removeUpcomingTracks();
      if (currentTrack) {
        await TrackPlayer.add(newQueue.slice(1)); // 現在の曲を除いて追加
      } else {
        await TrackPlayer.add(newQueue);
      }
    } else {
      const originalQueue = queueManager.getOriginalQueue();
      if (currentTrack && originalQueue.length > 0) {
        const originalIndex = originalQueue.findIndex((track: Track) => track.id === currentTrack.id);
        if (originalIndex !== -1) {
          const tracksAfterCurrent = originalQueue.slice(originalIndex + 1);
          await TrackPlayer.removeUpcomingTracks();
          await TrackPlayer.add(tracksAfterCurrent);
        }
      }
    }

    return newShuffleState;
  } catch (error) {
    console.error("シャッフルの切り替え中にエラーが発生しました:", error);
    return queueManager.getShuffleState();
  }
}

/**
 * 指定された曲を再生する
 * @param {Song[]} songs - 再生可能な曲のリスト
 * @param {string} targetSongId - 再生する曲のID
 */
export async function playSong(songs: Song[], targetSongId: string) {
  try {
    const songIndex = songs.findIndex((song) => song.id === targetSongId);
    if (songIndex === -1) {
      console.error("曲が見つかりません");
      return;
    }

    // 曲の準備
    const tracks = convertToTracks(songs);
    const selectedTrack = tracks[songIndex];

    // 現在のキュー情報と再生状態を確認
    const currentQueue = await TrackPlayer.getQueue();
    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
    const isCurrentlyPlaying = currentTrackIndex !== null && currentTrackIndex !== undefined && currentTrackIndex >= 0;

    // 選択した曲が現在のキューに存在するか確認
    const selectedTrackInQueue = isCurrentlyPlaying ? 
      currentQueue.findIndex(track => track.id === selectedTrack.id) : -1;

    if (selectedTrackInQueue !== -1) {
      // 選択した曲がすでにキューにある場合は、その曲にスキップ
      await TrackPlayer.skip(selectedTrackInQueue);
      await TrackPlayer.play();
      return;
    }

    // キューのクリアと再設定
    await TrackPlayer.reset();

    if (queueManager.getShuffleState()) {
      // シャッフルモードの場合、選択した曲を先頭に、残りをシャッフル
      const newQueue = queueManager.shuffleQueue(selectedTrack, tracks);
      queueManager.setOriginalQueue(tracks);
      await TrackPlayer.add(newQueue);
    } else {
      // 通常モードの場合は順番通りに追加
      await TrackPlayer.add(tracks);
      await TrackPlayer.skip(songIndex);
    }

    await TrackPlayer.play();
  } catch (error) {
    console.error("曲の再生中にエラーが発生しました:", error);
  }
}

/**
 * 次の曲にスキップする
 */
export async function skipToNext() {
  try {
    const queue = await TrackPlayer.getQueue();
    const currentIndex = await TrackPlayer.getCurrentTrack();
    const repeatMode = await TrackPlayer.getRepeatMode();

    if (repeatMode === RepeatMode.Track) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    if (currentIndex != null && currentIndex < queue.length - 1) {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } else if (queue.length > 0) {
      if (repeatMode === RepeatMode.Queue || repeatMode === RepeatMode.Off) {
        await TrackPlayer.skip(0);
        await TrackPlayer.play();
      }
    }
  } catch (e) {
    console.error("次の曲にスキップする際にエラーが発生しました:", e);
  }
}

/**
 * 前の曲にスキップする
 */
export async function skipToPrevious() {
  try {
    const queue = await TrackPlayer.getQueue();
    const currentIndex = await TrackPlayer.getActiveTrackIndex();
    const position = await TrackPlayer.getProgress().then(
      (progress) => progress.position
    );
    const repeatMode = await TrackPlayer.getRepeatMode();

    if (position > 3) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    if (repeatMode === RepeatMode.Track) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    if (currentIndex != null && currentIndex > 0) {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } else if (queue.length > 0) {
      if (repeatMode === RepeatMode.Queue || repeatMode === RepeatMode.Off) {
        await TrackPlayer.skip(queue.length - 1);
        await TrackPlayer.play();
      }
    }
  } catch (e) {
    console.error("前の曲にスキップする際にエラーが発生しました:", e);
  }
}

/**
 * リピート状態をトグルする (off -> track -> queue -> off)
 * @returns {Promise<RepeatMode>} 新しいリピート状態
 */
export async function toggleRepeat() {
  try {
    const currentMode = await TrackPlayer.getRepeatMode();

    let nextMode;
    switch (currentMode) {
      case RepeatMode.Off:
        nextMode = RepeatMode.Track;
        break;
      case RepeatMode.Track:
        nextMode = RepeatMode.Queue;
        break;
      case RepeatMode.Queue:
        nextMode = RepeatMode.Off;
        break;
      default:
        nextMode = RepeatMode.Off;
    }

    await TrackPlayer.setRepeatMode(nextMode);
    const confirmedMode = await TrackPlayer.getRepeatMode();
    return confirmedMode;
  } catch (error) {
    console.error("リピートモードの切り替え中にエラーが発生しました:", error);
    return RepeatMode.Off;
  }
}

/**
 * 現在のリピート状態を取得
 * @returns {Promise<RepeatMode>} 現在のリピート状態
 */
export async function getRepeatMode() {
  try {
    return await TrackPlayer.getRepeatMode();
  } catch (error) {
    console.error("リピートモードの取得中にエラーが発生しました:", error);
    return RepeatMode.Off;
  }
}

/**
 * 現在のシャッフル状態を取得
 * @returns {boolean} シャッフルが有効かどうか
 */
export function getShuffleState(): boolean {
  return queueManager.getShuffleState();
}

/**
 * トラックプレイヤーの進捗状況を取得する
 * @returns {Progress} 進捗状況（position, duration, buffered）
 */
export const useTrackPlayerProgress = () => {
  return useProgress();
};

// Progress型をエクスポート
export type { Progress } from 'react-native-track-player';