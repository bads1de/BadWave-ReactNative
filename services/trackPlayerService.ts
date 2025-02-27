import TrackPlayer, {
  Event,
  RepeatMode,
  Capability,
} from "react-native-track-player";
import { usePlayerStore } from "@/hooks/usePlayerStore";

// PlaybackServiceは非同期関数として定義する必要があります
export const PlaybackService = async function () {
  // このサービスはモジュールが機能するために登録する必要があります
  // イベントハンドラーを手動で登録します
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext()
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious()
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) =>
    TrackPlayer.seekTo(event.position)
  );

  // 曲の再生が終了したときのイベントリスナー
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async ({ track }) => {
    const { shuffle } = usePlayerStore.getState();

    // シャッフルモードが有効な場合、キューに曲を追加して再生を続行
    if (shuffle) {
      try {
        const queue = await TrackPlayer.getQueue();
        if (queue.length > 0) {
          // ランダムな曲のインデックスを選択
          const randomIndex = Math.floor(Math.random() * queue.length);
          // 現在のキューをリセット
          await TrackPlayer.reset();
          // 選択した曲をキューに追加
          await TrackPlayer.add(queue[randomIndex]);
          // 再生を開始
          await TrackPlayer.play();
        }
      } catch (error) {
        console.error("シャッフル再生エラー:", error);
      }
    }
  });

  // 曲が変更されたときのイベントリスナー
  TrackPlayer.addEventListener(
    Event.PlaybackTrackChanged,
    async ({ nextTrack }) => {
      // 次の曲がない場合（キューの最後に達した場合）
      if (nextTrack === null || nextTrack === undefined) {
        const { shuffle, repeat } = usePlayerStore.getState();

        // リピートまたはシャッフルが有効な場合、再生を続行
        if (repeat || shuffle) {
          try {
            const queue = await TrackPlayer.getQueue();
            if (queue.length > 0) {
              let nextIndex = 0;

              // シャッフルモードが有効な場合はランダムな曲を選択
              if (shuffle) {
                nextIndex = Math.floor(Math.random() * queue.length);
              }

              // 現在のキューをリセット
              await TrackPlayer.reset();
              // 選択した曲をキューに追加
              await TrackPlayer.add(queue[nextIndex]);
              // 再生を開始
              await TrackPlayer.play();
            }
          } catch (error) {
            console.error("次の曲の再生エラー:", error);
          }
        }
      }
    }
  );

  // その他必要なイベントリスナーをここに追加
};

/**
 * TrackPlayerの初期設定を行う関数
 */
export const setupTrackPlayer = async () => {
  try {
    // プレイヤーの初期化
    await TrackPlayer.setupPlayer({
      // プレイヤーの設定
      minBuffer: 10, // 最小バッファ時間（秒）
      maxBuffer: 50, // 最大バッファ時間（秒）
    });

    // 通知の設定
    await TrackPlayer.updateOptions({
      // 通知の設定
      capabilities: [
        // 通知に表示する操作ボタン
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        // コンパクト表示時の操作ボタン
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      // 通知のアイコン設定（Androidのみ）
      // アプリに合わせて適切なアイコンを設定してください
      // notification: {
      //   channelId: "com.badmusicapp.channel",
      //   color: 0xff0000,
      // },
    });

    console.log("TrackPlayer initialized successfully");
  } catch (error) {
    console.error("TrackPlayer initialization error:", error);
  }
};

/**
 * リピートモードを切り替える関数
 * @param {boolean} repeat リピートモードを有効にするかどうか
 */
export const toggleRepeatMode = async (repeat: boolean) => {
  await TrackPlayer.setRepeatMode(repeat ? RepeatMode.Queue : RepeatMode.Off);
};
