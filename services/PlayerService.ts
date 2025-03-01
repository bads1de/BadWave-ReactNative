import TrackPlayer, {
  Event,
  State,
  Track,
  Capability,
  useProgress,
  RepeatMode,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import getSongs from "../actions/getSongs";
import Song from "@/types";

/**
 * トラックプレイヤーのリピート状態を定義
 */
export const REPEAT_STATES = {
  OFF: "off", // リピートなし
  TRACK: "track", // 現在のトラックをリピート
  QUEUE: "queue", // キュー全体をリピート
};

// シャッフル状態と元のキューを管理するグローバル変数
let isShuffleEnabled = false;
let originalQueue: Track[] = [];

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
        // 再生が停止したときに、音声再生の通知も削除されるかどうか。
        // stoppingAppPausesPlaybackがfalseに設定されている場合、これは無視されます。
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
const convertToTracks = (songs: Song[]) => {
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
    const currentPosition = await TrackPlayer.getProgress().then(
      (progress) => progress.position
    );
    const isPlaying =
      (await TrackPlayer.getPlaybackState()).state === State.Playing;

    // シャッフルの切り替え
    isShuffleEnabled = !isShuffleEnabled;

    // 現在再生中のトラックを特定
    const currentTrack = currentTrackIndex !== null && currentTrackIndex !== undefined && currentTrackIndex >= 0
      ? queue[currentTrackIndex]
      : null;

    if (isShuffleEnabled) {
      // シャッフルを有効にする場合
      originalQueue = [...queue];

      // 現在の曲を除外してシャッフル
      let remainingTracks = currentTrack
        ? queue.filter(track => track.id !== currentTrack.id)
        : [...queue];
      const shuffledTracks = remainingTracks.sort(() => Math.random() - 0.5);

      // 現在の曲を先頭に、シャッフルした残りの曲を後ろに配置
      const newQueue = currentTrack
        ? [currentTrack, ...shuffledTracks]
        : shuffledTracks;

      await TrackPlayer.reset();
      await TrackPlayer.add(newQueue);

      // 現在の曲と再生状態を復元
      if (currentTrack) {
        await TrackPlayer.skip(0);
        await TrackPlayer.seekTo(currentPosition);
        if (isPlaying) {
          await TrackPlayer.play();
        }
      }
    } else {
      // シャッフルを無効にする場合
      if (originalQueue.length > 0) {
        await TrackPlayer.reset();
        await TrackPlayer.add(originalQueue);

        // 現在の曲と再生状態を復元
        if (currentTrack) {
          const newIndex = originalQueue.findIndex(track => track.id === currentTrack.id);
          if (newIndex !== -1) {
            await TrackPlayer.skip(newIndex);
            await TrackPlayer.seekTo(currentPosition);
            if (isPlaying) {
              await TrackPlayer.play();
            }
          }
        }
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
    // 設定後に実際のモードを取得して返す
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
export function getShuffleState() {
  return isShuffleEnabled;
}

/**
 * 指定されたURLの曲を再生する
 * @param {string} url - 再生する曲のURL
 */
export async function playSong(url: string) {
  try {
    const songsData = await getSongs();
    const songIndex = songsData.findIndex((song) => song.song_path === url);
    if (songIndex === -1) {
      console.error("曲が見つかりません");
      return;
    }

    // キュー情報を取得
    const queue = await TrackPlayer.getQueue();

    // 曲の準備
    const tracks = convertToTracks(songsData);
    const selectedTrack = tracks[songIndex];

    // キューのクリアと再設定
    await TrackPlayer.reset();

    if (isShuffleEnabled) {
      // 現在の曲を除外して残りをシャッフル
      const remainingTracks = tracks.filter(track => track.id !== selectedTrack.id);
      const shuffledTracks = remainingTracks.sort(() => Math.random() - 0.5);
      
      // 選択した曲を先頭に、シャッフルした曲を後ろに配置
      const newQueue = [selectedTrack, ...shuffledTracks];
      originalQueue = [...tracks]; // 元の順序を保存
      
      await TrackPlayer.add(newQueue);
      await TrackPlayer.skip(0); // 選択曲は先頭にあるため
    } else {
      // シャッフルが無効の場合は通常の順序で追加
      await TrackPlayer.add(tracks);
      await TrackPlayer.skip(songIndex);
    }

    await TrackPlayer.play();
  } catch (error) {
    console.error("曲の再生中にエラーが発生しました:", error);

    try {
      // Fallback: reset player and add all songs
      await TrackPlayer.reset();
      const songsData = await getSongs();
      const tracks = convertToTracks(songsData);

      // フォールバック処理でも songIndex を再取得
      const fallbackSongIndex = songsData.findIndex((song) => song.song_path === url);
      if (fallbackSongIndex === -1) {
        throw new Error("曲が見つかりません");
      }
      const selectedTrack = tracks[fallbackSongIndex];

      if (isShuffleEnabled) {
        // 現在の曲を除外して残りをシャッフル
        const remainingTracks = tracks.filter(track => track.id !== selectedTrack.id);
        const shuffledTracks = remainingTracks.sort(() => Math.random() - 0.5);
        
        // 選択した曲を先頭に、シャッフルした曲を後ろに配置
        const newQueue = [selectedTrack, ...shuffledTracks];
        originalQueue = [...tracks]; // 元の順序を保存
        
        await TrackPlayer.add(newQueue);
        await TrackPlayer.skip(0);
      } else {
        await TrackPlayer.add(tracks);
        await TrackPlayer.skip(fallbackSongIndex);
      }

      await TrackPlayer.play();
    } catch (fallbackError) {
      console.error(
        "フォールバック処理中にエラーが発生しました:",
        fallbackError
      );
    }
  }
}

/**
 * 次の曲にスキップする
 */
export async function skipToNext() {
  try {
    const queue = await TrackPlayer.getQueue();
    const currentIndex = await TrackPlayer.getCurrentTrack();

    // 特殊なケースを処理するためにリピートモードを取得
    const repeatMode = await TrackPlayer.getRepeatMode();

    // トラックリピートがオンの場合、曲の最初に戻る
    if (repeatMode === RepeatMode.Track) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    // 次の曲が存在するかチェック
    if (currentIndex != null && currentIndex < queue.length - 1) {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } else if (queue.length > 0) {
      // キューリピートがオンの場合、または手動でループする場合は最初の曲にループ
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

    // 特殊なケースを処理するためにリピートモードを取得
    const repeatMode = await TrackPlayer.getRepeatMode();

    // 曲の3秒以上が経過している場合、前の曲を再生する代わりに現在の曲を最初から再生
    if (position > 3) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    // トラックリピートがオンの場合、曲の最初に戻る
    if (repeatMode === RepeatMode.Track) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    // 前の曲が存在するかチェック
    if (currentIndex != null && currentIndex > 0) {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } else if (queue.length > 0) {
      // キューリピートがオンの場合、または手動でループする場合は最後の曲にループ
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
 * トラックプレイヤーの進捗状況を取得する
 * @returns {any} 進捗状況
 */
export const useTrackPlayerProgress = () => {
  return useProgress();
};
