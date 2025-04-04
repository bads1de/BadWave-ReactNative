// @supabase/supabase-js のモック
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  and: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  csv: jest.fn().mockReturnThis(),
  then: jest.fn().mockImplementation((callback) => Promise.resolve(callback({ data: [], error: null }))),
});

const mockRpc = jest.fn().mockResolvedValue({ data: [], error: null });

const mockAuth = {
  getSession: jest.fn().mockResolvedValue({
    data: {
      session: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
    },
    error: null,
  }),
  signIn: jest.fn().mockResolvedValue({ data: {}, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: jest.fn(),
};

const mockStorage = {
  from: jest.fn().mockReturnValue({
    upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
    download: jest.fn().mockResolvedValue({ data: {}, error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ publicUrl: 'https://example.com/test.jpg' }),
  }),
};

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
  auth: mockAuth,
  storage: mockStorage,
};

export const createClient = jest.fn().mockReturnValue(mockSupabase);
