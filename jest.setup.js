// React Native のモック
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
// jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// より堅牢なsetImmediateとclearImmediateのpolyfill
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof clearImmediate === 'undefined') {
  global.clearImmediate = (id) => {
    clearTimeout(id);
  };
}

// React NativeのStatusBarをモック
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => null),
  };
});

// React NativeのInteractionManagerをモック
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: jest.fn((callback) => {
    callback();
    return { cancel: jest.fn() };
  }),
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
  setDeadline: jest.fn(),
}));

// Expo のモック
jest.mock("expo-font");
jest.mock("expo-asset");
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "example-anon-key",
    },
  },
}));

// 各テストファイルで個別にモックを定義するようにします
// グローバルモックは使用しません

// React Navigation のモック
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useIsFocused: () => true,
  };
});

// React のモック
global.React = require("react");

// コンソールエラーの抑制（必要に応じてコメントアウト）
// console.error = jest.fn();
// console.warn = jest.fn();

// テスト用のグローバル変数
global.__TEST__ = true;
