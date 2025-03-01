import TrackPlayer, {
  Event,
  State,
  Track,
  Capability,
  useProgress,
  RepeatMode,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import type Song from "@/types";

// シャッフル状態と元のキューを管理する変数 (モジュールレベル)
let isShuffleEnabled = false;
let originalQueue: Track[] = [];

/**
 * プレイヤーの初期設定を行う
 * @returns {Promise<boolean>} 初期設定が成功したかどうか
 */
export async function setupPlayer() {
  try {
    await TrackPlayer.getActiveTrackIndex();
    return true;
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
    return true;
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
export const convertToTracks = (songs: Song[]): Track[] => {
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
export async function toggleShuffle(): Promise<boolean> {
  try {
    const queue = await TrackPlayer.getQueue();
    if (!queue || queue.length <= 1) return false;

    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
    const currentTrack = currentTrackIndex !== null && currentTrackIndex !== undefined && currentTrackIndex >= 0
      ? queue[currentTrackIndex]
      : null;

    // シャッフルの切り替え
    isShuffleEnabled = !isShuffleEnabled;

    if (isShuffleEnabled) {
      // シャッフルを有効にする場合
      originalQueue = [...queue];

      if (currentTrack) {
        // 現在の曲を除外してシャッフル
        const remainingTracks = queue.filter(track => track.id !== currentTrack.id);
        const shuffledTracks = remainingTracks.sort(() => Math.random() - 0.5);
        
        // 後続の曲だけを入れ替える
        await TrackPlayer.removeUpcomingTracks();
        await TrackPlayer.add(shuffledTracks);
      } else {
        // 再生中の曲がない場合は全体をシャッフル
        const shuffledTracks = [...queue].sort(() => Math.random() - 0.5);
        await TrackPlayer.reset();
        await TrackPlayer.add(shuffledTracks);
      }
    } else {
      // シャッフルを無効にする場合
      if (originalQueue.length > 0 && currentTrack) {
        // 現在の曲のインデックスを元のキューから取得
        const originalIndex = originalQueue.findIndex(track => track.id === currentTrack.id);
        
        if (originalIndex !== -1) {
          // 後続の曲を入れ替え
          const tracksAfterCurrent = originalQueue.slice(originalIndex + 1);
          await TrackPlayer.removeUpcomingTracks();
          await TrackPlayer.add(tracksAfterCurrent);
        }
      } else if (originalQueue.length > 0) {
        // 元のキュー全体を復元
        await TrackPlayer.reset();
        await TrackPlayer.add(originalQueue);
      }
    }

    return isShuffleEnabled;
  } catch (error) {
    console.error("シャッフルの切り替え中にエラーが発生しました:", error);
    return isShuffleEnabled;
  }
}

/**
 * リピート状態をトグルする (off -> track -> queue -> off)
 * @returns {Promise<RepeatMode>} 新しいリピート状態
 */
export async function toggleRepeat(): Promise<RepeatMode> {
  try {
    const currentMode = await TrackPlayer.getRepeatMode();
    let nextMode: RepeatMode;

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
    return await TrackPlayer.getRepeatMode();
  } catch (error) {
    console.error("リピートモードの切り替え中にエラーが発生しました:", error);
    return RepeatMode.Off;
  }
}

/**
 * 現在のリピート状態を取得
 * @returns {Promise<RepeatMode>} 現在のリピート状態
 */
export async function getRepeatMode(): Promise<RepeatMode> {
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
  return isShuffleEnabled;
}

/**
 * 指定されたURLの曲を再生する
 * @param {string} url - 再生する曲のURL
 */
export async function playSong(url: string): Promise<void> {
  try {
    const queue = await TrackPlayer.getQueue();
    const currentTrack = queue.find(track => track.url === url);

    if (currentTrack) {
      // 既にキューに存在する場合は、そのトラックにジャンプ
      const trackIndex = queue.indexOf(currentTrack);
      await TrackPlayer.skip(trackIndex);
      await TrackPlayer.play();
    } else {
      // キューに存在しない場合は、現在のキューをクリアして新しいトラックを追加
      await TrackPlayer.reset();
      await TrackPlayer.add({
        url,
        title: 'Loading...', 
        artist: 'Loading...', 
        // artwork を省略（undefined扱いになる）
      });
      await TrackPlayer.play();
    }
  } catch (error) {
    console.error("再生中にエラーが発生しました:", error);
    throw error;
  }
}

/**
 * 次の曲にスキップする
 */
export async function skipToNext(): Promise<void> {
  try {
    const queue = await TrackPlayer.getQueue();
    const currentIndex = await TrackPlayer.getCurrentTrack();
    const repeatMode = await TrackPlayer.getRepeatMode();

    // トラックリピートがオンの場合、曲の最初に戻る
    if (repeatMode === RepeatMode.Track) {
      await TrackPlayer.seekTo(0);
      return TrackPlayer.play();
    }

    // 次の曲が存在するかチェック
    if (currentIndex != null && currentIndex < queue.length - 1) {
      await TrackPlayer.skipToNext();
      return TrackPlayer.play();
    } else if (queue.length > 0 && (repeatMode === RepeatMode.Queue || repeatMode === RepeatMode.Off)) {
      // キューの最後の場合、最初の曲にループ
      await TrackPlayer.skip(0);
      return TrackPlayer.play();
    }
  } catch (error) {
    console.error("次の曲にスキップする際にエラーが発生しました:", error);
  }
}

/**
 * 前の曲にスキップする
 */
export async function skipToPrevious(): Promise<void> {
  try {
    const queue = await TrackPlayer.getQueue();
    const currentIndex = await TrackPlayer.getActiveTrackIndex();
    const position = await TrackPlayer.getProgress().then(progress => progress.position);
    const repeatMode = await TrackPlayer.getRepeatMode();

    // 曲の3秒以上が経過している場合、前の曲を再生する代わりに現在の曲を最初から再生
    if (position > 3) {
      await TrackPlayer.seekTo(0);
      return TrackPlayer.play();
    }

    // トラックリピートがオンの場合、曲の最初に戻る
    if (repeatMode === RepeatMode.Track) {
      await TrackPlayer.seekTo(0);
      return TrackPlayer.play();
    }

    // 前の曲が存在するかチェック
    if (currentIndex != null && currentIndex > 0) {
      await TrackPlayer.skipToPrevious();
      return TrackPlayer.play();
    } else if (queue.length > 0 && (repeatMode === RepeatMode.Queue || repeatMode === RepeatMode.Off)) {
      // キューの最初の場合、最後の曲にループ
      await TrackPlayer.skip(queue.length - 1);
      return TrackPlayer.play();
    }
  } catch (error) {
    console.error("前の曲にスキップする際にエラーが発生しました:", error);
  }
}

/**
 * トラックプレイヤーの進捗状況を取得する
 */
export const useTrackPlayerProgress = useProgress;
