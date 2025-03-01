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

// シャッフル状態を管理するグローバル変数
let isShuffleEnabled = false;

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
    if (queue.length <= 1) return false;

    isShuffleEnabled = !isShuffleEnabled;

    if (isShuffleEnabled) {
      const currentTrack = await TrackPlayer.getActiveTrackIndex();
      const currentPosition = await TrackPlayer.getProgress().then(
        (progress) => progress.position
      );
      const isPlaying =
        (await TrackPlayer.getPlaybackState()).state === State.Playing;

      // キューをシャッフル
      await TrackPlayer.reset();
      const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);
      await TrackPlayer.add(shuffledQueue);

      // 現在の曲と再生位置を復元
      if (currentTrack != null) {
        const currentTrackId = queue[currentTrack].id;
        const newIndex = shuffledQueue.findIndex(
          (track) => track.id === currentTrackId
        );
        if (newIndex !== -1) {
          await TrackPlayer.skip(newIndex);
          await TrackPlayer.seekTo(currentPosition);
          if (isPlaying) {
            await TrackPlayer.play();
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
    return nextMode;
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

    // キューが空の場合、すべての曲を追加
    if (queue.length === 0) {
      const tracks = convertToTracks(songsData);

      if (isShuffleEnabled) {
        // シャッフルされたキューを作成して適用
        const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
        await TrackPlayer.add(shuffledTracks);

        // 選択された曲の位置をシャッフルされたキューで検索
        const selectedTrackId = tracks[songIndex].id;
        const newIndex = shuffledTracks.findIndex(
          (track) => track.id === selectedTrackId
        );
        if (newIndex !== -1) {
          await TrackPlayer.skip(newIndex);
        }
      } else {
        await TrackPlayer.add(tracks);
        await TrackPlayer.skip(songIndex);
      }
    } else {
      // キューが存在する場合、別の曲を再生するためにスキップ
      if (isShuffleEnabled) {
        const trackId = songsData[songIndex].id.toString();
        const shuffledQueue = await TrackPlayer.getQueue();
        const newIndex = shuffledQueue.findIndex(
          (track) => track.id === trackId
        );
        if (newIndex !== -1) {
          await TrackPlayer.skip(newIndex);
        }
      } else {
        await TrackPlayer.skip(songIndex);
      }
    }

    await TrackPlayer.play();
  } catch (error) {
    console.error("曲の再生中にエラーが発生しました:", error);

    try {
      // Fallback: reset player and add all songs
      await TrackPlayer.reset();
      const songsData = await getSongs();
      const tracks = convertToTracks(songsData);

      if (isShuffleEnabled) {
        // Create and apply shuffled queue for fallback
        const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
        await TrackPlayer.add(shuffledTracks);

        const songIndex = songsData.findIndex((song) => song.song_path === url);

        if (songIndex !== -1) {
          const selectedTrackId = tracks[songIndex].id;

          const newIndex = shuffledTracks.findIndex(
            (track) => track.id === selectedTrackId
          );

          if (newIndex !== -1) {
            await TrackPlayer.skip(newIndex);
            await TrackPlayer.play();
          }
        }
      } else {
        await TrackPlayer.add(tracks);

        const songIndex = songsData.findIndex((song) => song.song_path === url);
        if (songIndex !== -1) {
          await TrackPlayer.skip(songIndex);
          await TrackPlayer.play();
        }
      }
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
