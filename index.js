import 'expo-router/entry';
import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService, setupPlayer } from './services/trackPlayerService';

// アプリケーション起動時にTrackPlayerを初期化
const setupTrackPlayer = async () => {
  try {
    // TrackPlayerの初期化
    await setupPlayer();
    console.log('TrackPlayerが正常に初期化されました');
  } catch (error) {
    console.error('TrackPlayerの初期化エラー:', error);
  }
};

// TrackPlayerの初期化を実行
setupTrackPlayer();

// PlaybackServiceを登録
TrackPlayer.registerPlaybackService(() => PlaybackService);

// This is the first file that will be executed when the application starts
// The registerRootComponent call is handled by Expo internally
