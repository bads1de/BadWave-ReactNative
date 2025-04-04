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

// Supabaseのモック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest
        .fn()
        .mockImplementation((callback) =>
          Promise.resolve(callback({ data: [], error: null }))
        ),
    }),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: "test-user-id",
              email: "test@example.com",
            },
          },
        },
        error: null,
      }),
      signIn: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        download: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest
          .fn()
          .mockReturnValue({ publicUrl: "https://example.com/test.jpg" }),
      }),
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
