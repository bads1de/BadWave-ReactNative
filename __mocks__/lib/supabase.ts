// lib/supabase.ts のモック

// モックデータ
const mockData = [];
const mockError = null;

// モックチェーンを作成する関数
const createQueryBuilder = () => {
  const builder = {};

  // 各メソッドをモック化
  builder.select = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.neq = jest.fn().mockReturnValue(builder);
  builder.gt = jest.fn().mockReturnValue(builder);
  builder.gte = jest.fn().mockReturnValue(builder);
  builder.lt = jest.fn().mockReturnValue(builder);
  builder.lte = jest.fn().mockReturnValue(builder);
  builder.like = jest.fn().mockReturnValue(builder);
  builder.ilike = jest.fn().mockReturnValue(builder);
  builder.is = jest.fn().mockReturnValue(builder);
  builder.in = jest.fn().mockReturnValue(builder);
  builder.contains = jest.fn().mockReturnValue(builder);
  builder.containedBy = jest.fn().mockReturnValue(builder);
  builder.rangeLt = jest.fn().mockReturnValue(builder);
  builder.rangeGt = jest.fn().mockReturnValue(builder);
  builder.rangeGte = jest.fn().mockReturnValue(builder);
  builder.rangeLte = jest.fn().mockReturnValue(builder);
  builder.rangeAdjacent = jest.fn().mockReturnValue(builder);
  builder.overlaps = jest.fn().mockReturnValue(builder);
  builder.textSearch = jest.fn().mockReturnValue(builder);
  builder.filter = jest.fn().mockReturnValue(builder);
  builder.match = jest.fn().mockReturnValue(builder);
  builder.not = jest.fn().mockReturnValue(builder);
  builder.or = jest.fn().mockReturnValue(builder);
  builder.and = jest.fn().mockReturnValue(builder);

  builder.order = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.range = jest.fn().mockReturnValue(builder);
  builder.single = jest.fn().mockReturnValue(builder);
  builder.maybeSingle = jest.fn().mockReturnValue(builder);

  // 非同期メソッドのモック
  builder.then = jest.fn().mockImplementation((callback) => {
    return Promise.resolve(callback({ data: mockData, error: mockError }));
  });

  return builder;
};

// テーブル操作用のモックビルダー
const createTableBuilder = () => {
  const builder = createQueryBuilder();

  // テーブル特有のメソッド
  builder.insert = jest.fn().mockReturnValue(builder);
  builder.upsert = jest.fn().mockReturnValue(builder);
  builder.update = jest.fn().mockReturnValue(builder);
  builder.delete = jest.fn().mockReturnValue(builder);

  return builder;
};

// モックオブジェクトを作成
const supabase = {
  // fromメソッドのモック
  from: jest.fn().mockImplementation(() => createTableBuilder()),

  // auth関連のモック
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: "test-user-id" } } },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn(),
  },

  // rpcメソッドのモック
  rpc: jest.fn().mockImplementation(() => {
    return {
      then: jest.fn().mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: mockError }));
      }),
    };
  }),

  // storage関連のモック
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/test.mp3" },
      }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
};

// モック関数をエクスポートして、テストで使用できるようにする
const mockFunctions = {
  from: supabase.from,
  getSession: supabase.auth.getSession,
  signInWithPassword: supabase.auth.signInWithPassword,
  signOut: supabase.auth.signOut,
  rpc: supabase.rpc,
  storageFrom: supabase.storage.from,
};

module.exports = { supabase, mockFunctions };
