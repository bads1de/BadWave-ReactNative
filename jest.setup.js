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
const mockSingle = jest.fn().mockResolvedValue({ data: [], error: null });
const mockEq = jest.fn().mockReturnThis();
const mockNeq = jest.fn().mockReturnThis();
const mockIlike = jest.fn().mockReturnThis();
const mockOr = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnValue({
  eq: mockEq,
  neq: mockNeq,
  ilike: mockIlike,
  or: mockOr,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
});
const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockUpdate = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockDelete = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
});
const mockRpc = jest.fn().mockResolvedValue({ data: [], error: null });
const mockGetSession = jest.fn().mockResolvedValue({
  data: {
    session: {
      user: {
        id: "test-user-id",
        email: "test@example.com",
      },
    },
  },
  error: null,
});
const mockSignIn = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockOnAuthStateChange = jest.fn();
const mockUpload = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockDownload = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockGetPublicUrl = jest
  .fn()
  .mockReturnValue({ publicUrl: "https://example.com/test.jpg" });
const mockStorageFrom = jest.fn().mockReturnValue({
  upload: mockUpload,
  download: mockDownload,
  getPublicUrl: mockGetPublicUrl,
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getSession: mockGetSession,
      signIn: mockSignIn,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    storage: {
      from: mockStorageFrom,
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
