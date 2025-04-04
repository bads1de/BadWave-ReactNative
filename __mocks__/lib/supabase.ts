// lib/supabase.ts のモック

// モックオブジェクトを作成
export const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: "test-user-id" } } },
    }),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn(),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/test.mp3" },
      }),
      list: jest.fn(),
      remove: jest.fn(),
    }),
  },
};
