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

// StatusBarのモックは削除（react-native/jest-expoのデフォルトに任せる）
// もし必要なら以下のようにモックするが、Element type invalidの原因になる可能性あり
/*
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => {
  const React = require('react');
  const { View } = require('react-native');
  class MockStatusBar extends React.Component {
    static setBarStyle = jest.fn();
    static setHidden = jest.fn();
    static setTranslucent = jest.fn();
    static setBackgroundColor = jest.fn();
    render() {
      return React.createElement(View, { testID: 'status-bar', ...this.props });
    }
  }
  return {
    __esModule: true,
    default: MockStatusBar,
  };
});
*/

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

// Expo UI Components Mocks
jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    Image: (props) => React.createElement(View, { testID: "expo-image", ...props }),
    ImageBackground: ({ children, ...props }) =>
      React.createElement(View, { testID: "image-background", ...props }, children),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    LinearGradient: ({ children, ...props }) =>
      React.createElement(View, { testID: "linear-gradient", ...props }, children),
  };
});

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    BlurView: ({ children, ...props }) =>
      React.createElement(View, { testID: "blur-view", ...props }, children),
  };
});

// @expo/vector-iconsのモック
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");

  // 各アイコンファミリーをモックするコンポーネント
  const MockIcon = (props) => {
    return React.createElement(View, { testID: props.testID || "icon-mock", ...props });
  };

  return {
    __esModule: true,
    Ionicons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome: MockIcon,
    // 必要に応じて他のアイコンセットを追加
  };
});

// expo-video mock
jest.mock("expo-video", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    VideoView: (props) => React.createElement(View, { testID: "video-view", ...props }),
    useVideoPlayer: jest.fn(() => ({
      loop: true,
      play: jest.fn(),
      muted: false,
    })),
  };
});


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
