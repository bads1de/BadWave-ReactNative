// supabaseのモック
const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSingle = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockOrder = jest
  .fn()
  .mockReturnValue({ limit: mockLimit, data: [], error: null });
const mockEq2 = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockEq = jest
  .fn()
  .mockReturnValue({ single: mockSingle, order: mockOrder, eq: mockEq2 });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq, order: mockOrder });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockDelete = jest.fn().mockResolvedValue({ data: {}, error: null });
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

const mockRpc = jest.fn().mockResolvedValue({ data: [], error: null });

const mockGetSession = jest.fn().mockResolvedValue({
  data: { session: { user: { id: "test-user-id" } } },
  error: null,
});

const mockSignOut = jest.fn().mockResolvedValue({ error: null });

export const supabase = {
  from: mockFrom,
  rpc: mockRpc,
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
  mockEq2,
  mockSingle,
  mockUpdate,
  mockInsert,
  mockDelete,
  mockOrder,
  mockOr,
  mockGetSession,
  mockSignOut,
  mockRpc,
  mockLimit,
  mockMatch: jest.fn().mockResolvedValue({ data: null, error: null }),
  mockIlike: jest.fn().mockReturnValue({ order: mockOrder }),
};

// モックのリセット関数
export const resetMocks = () => {
  Object.values(mockFunctions).forEach((mock) => {
    if (typeof mock.mockReset === "function") {
      mock.mockReset();
    }
  });
};
