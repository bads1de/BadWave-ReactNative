// React Native のモック
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
// jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// より堅牢なsetImmediateとclearImmediateのpolyfill
if (typeof setImmediate === "undefined") {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof clearImmediate === "undefined") {
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
jest.mock("react-native/Libraries/Interaction/InteractionManager", () => ({
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
    Image: (props) =>
      React.createElement(View, { testID: "expo-image", ...props }),
    ImageBackground: ({ children, ...props }) =>
      React.createElement(
        View,
        { testID: "image-background", ...props },
        children,
      ),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    LinearGradient: ({ children, ...props }) =>
      React.createElement(
        View,
        { testID: "linear-gradient", ...props },
        children,
      ),
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
    return React.createElement(View, {
      testID: props.testID || "icon-mock",
      ...props,
    });
  };

  return {
    __esModule: true,
    Ionicons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome: MockIcon,
    // 必要に応じて他のアイコンセットを追加
  };
});

// expo-sqlite のモック
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    transaction: jest.fn(),
    execAsync: jest.fn(),
    execSync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    prepareAsync: jest.fn(),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      executeForRawResultSync: jest.fn(() => ({
        getAllSync: jest.fn(() => []),
      })),
    })),
    closeSync: jest.fn(),
  })),
  SQLite: {
    openDatabase: jest.fn(),
  },
}));

// NetInfo mock
jest.mock("@react-native-community/netinfo", () => ({
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
  }),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
  addEventListener: jest.fn((handler) => {
    return jest.fn(); // return unsubscribe function
  }),
  NetInfoStateType: {
    unknown: "unknown",
    none: "none",
    cellular: "cellular",
    wifi: "wifi",
    bluetooth: "bluetooth",
    ethernet: "ethernet",
    wimax: "wimax",
    vpn: "vpn",
    other: "other",
  },
}));

// expo-video mock
jest.mock("expo-video", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    VideoView: (props) =>
      React.createElement(View, { testID: "video-view", ...props }),
    useVideoPlayer: jest.fn(() => ({
      loop: true,
      play: jest.fn(),
      muted: false,
    })),
  };
});

// 各テストファイルで個別にモックを定義するようにします
// グローバルモックは使用しません

// Reanimated mock
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  // withSpring と withTiming がプロキシ経由で正しく動作しない場合があるための補足
  Reanimated.withSpring = jest.fn((value) => value);
  Reanimated.withTiming = jest.fn((toValue) => toValue);

  return Reanimated;
});

// React Navigation のモック
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest
      .fn()
      .mockImplementation(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
    useSafeAreaFrame: jest
      .fn()
      .mockImplementation(() => ({ x: 0, y: 0, width: 0, height: 0 })),
  };
});

jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 60, // Default mock height
}));

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

// expo-router のモック
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  Link: "Link",
  Tabs: "Tabs",
  Stack: "Stack",
  Slot: "Slot",
  useSegments: () => [],
  useRootNavigationState: () => ({
    key: "root",
  }),
  usePathname: () => "/",
}));

// React のモック
global.React = require("react");

// コンソールエラーの抑制（必要に応じてコメントアウト）
// console.error = jest.fn();
// console.warn = jest.fn();

// テスト用のグローバル変数
global.__TEST__ = true;
