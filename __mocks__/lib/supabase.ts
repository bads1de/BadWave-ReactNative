// lib/supabase.ts のモック

// モック関数を定義
const mockThen = jest.fn().mockResolvedValue({ data: [], error: null });
const mockLimit = jest.fn().mockReturnValue({ then: mockThen });
const mockOrder = jest
  .fn()
  .mockReturnValue({ limit: mockLimit, then: mockThen });
const mockSingle = jest.fn().mockReturnValue({ then: mockThen });
const mockEq = jest.fn().mockReturnValue({
  eq: jest.fn().mockReturnThis(),
  single: mockSingle,
  then: mockThen,
});
const mockSelect = jest.fn().mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  then: mockThen,
});
const mockUpdate = jest.fn().mockReturnValue({
  eq: mockEq,
  match: jest.fn().mockReturnThis(),
  then: mockThen,
});
const mockInsert = jest.fn().mockReturnValue({ then: mockThen });
const mockDelete = jest.fn().mockReturnValue({
  eq: mockEq,
  match: jest.fn().mockReturnThis(),
  then: mockThen,
});

// fromメソッドのモック
const mockFrom = jest.fn().mockImplementation(() => {
  return {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    match: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: mockThen,
  };
});

// rpcメソッドのモック
const mockRpc = jest.fn().mockImplementation(() => {
  return { then: mockThen };
});

// getSessionメソッドのモック
const mockGetSession = jest.fn().mockResolvedValue({
  data: { session: { user: { id: "test-user-id" } } },
  error: null,
});

// その他のモック
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockStorageFrom = jest.fn().mockReturnValue({
  upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({
    data: { publicUrl: "https://example.com/test.mp3" },
  }),
  list: jest.fn().mockResolvedValue({ data: [], error: null }),
  remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
});

// モックオブジェクトを作成
export const supabase = {
  from: mockFrom,
  auth: {
    getSession: mockGetSession,
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: mockSignOut,
    onAuthStateChange: jest.fn(),
  },
  rpc: mockRpc,
  storage: {
    from: mockStorageFrom,
  },
};

// モック関数をエクスポートして、テストで使用できるようにする
export const mockFunctions = {
  mockThen,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockUpdate,
  mockInsert,
  mockDelete,
  mockOrder,
  mockLimit,
  mockGetSession,
  mockSignOut,
  mockRpc,
  mockStorageFrom,
};
