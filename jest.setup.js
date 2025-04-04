// React Native のモック
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
// jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

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
