# React Native Track Player API リファレンス

このドキュメントは React Native Track Player v4.1 の主要 API を日本語で解説したものです。

## 目次

- [インストール](#インストール)
- [イベント](#イベント)
- [プレイヤー操作](#プレイヤー操作)
- [キュー管理](#キュー管理)
- [フック](#フック)
- [状態定数](#状態定数)
- [トラックオブジェクト](#トラックオブジェクト)
- [エラー処理](#エラー処理)
- [プレイヤー設定](#プレイヤー設定)
- [進捗管理](#進捗管理)
- [オプション更新](#オプション更新)

---

## インストール <a name="インストール"></a>

### 安定版のインストール

```bash
npm install react-native-track-player
```

### iOS セットアップ

1. `Podfile`に以下を追加:

```ruby
pod 'react-native-track-player', :path => '../node_modules/react-native-track-player'
```

2. `pod install`を実行

3. `AppDelegate.m`に以下を追加:

```objective-c
#import <ReactNativeTrackPlayer/ReactNativeTrackPlayer.h>

// didFinishLaunchingWithOptions内に追加
[ReactNativeTrackPlayer configure];
```

### Android セットアップ

1. `android/app/build.gradle`に以下を追加:

```groovy
implementation project(':react-native-track-player')
```

2. `MainApplication.java`に以下を追加:

```java
import com.reactnativetrackplayer.ReactNativeTrackPlayerPackage;

// getPackages()内に追加
packages.add(new ReactNativeTrackPlayerPackage());
```

---

## イベント <a name="イベント"></a>

```typescript
import { Event } from "react-native-track-player";
```

### プレイヤーイベント

| イベント名                   | 説明                   | パラメータ                                                 |
| ---------------------------- | ---------------------- | ---------------------------------------------------------- |
| `PlaybackState`              | プレイヤー状態変更     | `state: State`                                             |
| `PlaybackActiveTrackChanged` | アクティブトラック変更 | `lastIndex`, `lastTrack`, `lastPosition`, `index`, `track` |
| `PlaybackQueueEnded`         | キュー終了             | `track`, `position`                                        |
| `PlaybackProgressUpdated`    | 再生進捗更新           | `position`, `duration`, `buffered`, `track`                |
| `PlaybackError`              | 再生エラー発生         | `code`, `message`                                          |

### メディアコントロールイベント

| イベント名    | 説明               | 対応操作 |
| ------------- | ------------------ | -------- |
| `RemotePlay`  | 再生ボタン押下     | Play     |
| `RemotePause` | 一時停止ボタン押下 | Pause    |
| `RemoteSeek`  | シーク操作         | SeekTo   |

---

## プレイヤー操作 <a name="プレイヤー操作"></a>

```typescript
import TrackPlayer from "react-native-track-player";
```

### 基本操作

| メソッド        | 説明             | パラメータ        |
| --------------- | ---------------- | ----------------- |
| `setupPlayer()` | プレイヤー初期化 | `PlayerOptions`   |
| `play()`        | 再生/再開        | -                 |
| `pause()`       | 一時停止         | -                 |
| `seekTo()`      | 指定位置へシーク | `seconds: number` |

### 詳細設定

```typescript
// 音量設定
await TrackPlayer.setVolume(0.8);
// 再生速度設定
await TrackPlayer.setRate(1.5);
```

---

## キュー管理 <a name="キュー管理"></a>

### キュー操作

| メソッド   | 説明             | パラメータ                                      |
| ---------- | ---------------- | ----------------------------------------------- |
| `add()`    | トラック追加     | `tracks: Track[]`, `insertBeforeIndex?: number` |
| `remove()` | トラック削除     | `tracks: Track[]`                               |
| `skip()`   | トラック切り替え | `index: number`, `initialPosition?: number`     |

### キュー情報取得

```typescript
// 現在のキュー取得
const queue = await TrackPlayer.getQueue();
// アクティブトラック取得
const activeTrack = await TrackPlayer.getActiveTrack();
```

---

## フック <a name="フック"></a>

### 主要フック

```typescript
import { useProgress, usePlaybackState } from "react-native-track-player";
```

| フック名           | 説明                   | 戻り値                             |
| ------------------ | ---------------------- | ---------------------------------- |
| `useProgress`      | 再生進捗取得           | `{ position, duration, buffered }` |
| `usePlaybackState` | プレイヤー状態取得     | `State`                            |
| `useActiveTrack`   | アクティブトラック取得 | `Track \| undefined`               |

---

## 状態定数 <a name="状態定数"></a>

```typescript
import { State } from "react-native-track-player";
```

| 状態        | 説明             |
| ----------- | ---------------- |
| `Playing`   | 再生中           |
| `Paused`    | 一時停止中       |
| `Stopped`   | 停止中           |
| `Buffering` | バッファリング中 |

---

## トラックオブジェクト <a name="トラックオブジェクト"></a>

```typescript
interface Track {
  url: string;
  title: string;
  artist: string;
  duration?: number;
  artwork?: string;
  // その他のオプションプロパティ...
}
```

---

## エラー処理 <a name="エラー処理"></a>

### PlaybackErrorEvent

| プロパティ | 型     | 説明                               |
| ---------- | ------ | ---------------------------------- |
| `code`     | string | プラットフォーム固有のエラーコード |
| `message`  | string | エラーメッセージ                   |

---

## プレイヤー設定 <a name="プレイヤー設定"></a>

### PlayerOptions

```typescript
{
  minBuffer: 15, // 最小バッファ時間（秒）
  maxBuffer: 60, // 最大バッファ時間（秒）
  autoHandleInterruptions: true // 割り込み自動処理
}
```

---

## 進捗管理 <a name="進捗管理"></a>

### Progress オブジェクト

```typescript
{
  position: 120, // 現在位置（秒）
  duration: 300, // 総再生時間（秒）
  buffered: 180  // バッファ済み時間（秒）
}
```

---

## オプション更新 <a name="オプション更新"></a>

### UpdateOptions

```typescript
{
  forwardJumpInterval: 30, // 早送り間隔（秒）
  backwardJumpInterval: 15, // 巻き戻し間隔（秒）
  capabilities: [Capability.Play, Capability.Pause] // 有効機能
}
```

---

※ このドキュメントは React Native Track Player v4.1 に基づいています。最新情報については[公式ドキュメント](https://rntp.dev/)をご確認ください。

## Playback Service

Playback Service は、アプリがバックグラウンドにある場合でも実行され続けます。プレーヤーがセットアップされると開始され、プレーヤーが破棄されるときにのみ停止します。プレーヤーの状態に直接関連付ける必要のあるコードは、すべてここに入れることをお勧めします。たとえば、分析のために何が再生されているかを追跡したい場合、Playback Service はそれを行うのに最適な場所です。

### Remote Events

[Remote events](/docs/api/events#media-controls) は、ユーザーインターフェイスの外部から送信され、それらに反応できます。たとえば、ユーザーが IOS ロック画面/Android 通知、または Bluetooth ヘッドセットからメディアコントロールの一時停止を押した場合、TrackPlayer にオーディオを一時停止させたいとします。

React コンポーネントのコンテキストで `Event.RemotePause` のようなリモートイベントへのリスナーを作成すると、アプリがバックグラウンドにあるときに UI が自動的にアンマウントされ、見逃される可能性があります。このため、リモートリスナーは Playback Service に配置するのが最適です。これは、アプリがバックグラウンドにある場合でも実行され続けるためです。

#### 例

```typescript
import { PlaybackService } from "./src/services";

// これは、アプリのメインコンポーネントを登録した直後に行く必要があります
// AppRegistry.registerComponent(...)
TrackPlayer.registerPlaybackService(() => PlaybackService);

// src/services/PlaybackService.ts
import { Event } from "react-native-track-player";

export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  // ...
};
```

### Custom Media Controls Notification id & name

react-native-track-player はメディアコントロールを使用しています。その結果、通知チャネルが作成されます。

- 詳細はこちらをお読みください: [https://developer.android.com/media/implement/surfaces/mobile](https://developer.android.com/media/implement/surfaces/mobile)

カスタマイズするには、次の例をプロジェクトフォルダー内に配置します。

#### 例

```xml
<!-- YOUR_PROJECT_DIR/android/app/src/main/res/values/strings.xml -->
<resources>
    <!-- rtnp channel id -->
    <string name="rntp_temporary_channel_id">temporary_channel</string>
    <!-- rtnp channel name -->
    <string name="rntp_temporary_channel_name">temporary_channel</string>
    <!-- playback_channel_name used by KotlinAudio in rntp -->
    <string name="playback_channel_name">Music Player</string>
</resources>
```
