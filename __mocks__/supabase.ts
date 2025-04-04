// supabaseのモック
const mockSingle = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockDelete = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockOrder = jest.fn().mockReturnValue({ data: [], error: null });
const mockOr = jest.fn().mockReturnValue({ order: mockOrder });
const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
  delete: mockDelete,
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
});

const mockGetSession = jest.fn().mockResolvedValue({
  data: { session: { user: { id: "test-user-id" } } },
  error: null,
});

const mockSignOut = jest.fn().mockResolvedValue({ error: null });

export const supabase = {
  from: mockFrom,
  auth: {
    getSession: mockGetSession,
    signOut: mockSignOut,
  },
};

// モック関数をエクスポートして、テストで使用できるようにする
export const mockFunctions = {
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockUpdate,
  mockInsert,
  mockDelete,
  mockOrder,
  mockOr,
  mockGetSession,
  mockSignOut,
};
