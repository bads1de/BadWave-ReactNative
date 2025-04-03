import usePlaylistStatus from "@/hooks/usePlaylistStatus";
import { supabase } from "@/lib/supabase";
import Toast from "react-native-toast-message";

const mockEq = jest.fn();
mockEq.mockReturnThis();

const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

const mockUseAuth = jest.fn();

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("usePlaylistStatus", () => {
  const playlists = [
    {
      id: "p1",
      user_id: "u1",
      title: "t1",
      is_public: true,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "p2",
      user_id: "u1",
      title: "t2",
      is_public: false,
      created_at: "2024-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常にisAddedをセット", async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "user123" } } });
    const data = [{ playlist_id: "p1" }];
    mockEq.mockResolvedValueOnce({ data, error: null });

    const { fetchAddedStatus, isAdded } = usePlaylistStatus({
      songId: "s1",
      playlists,
    });

    await fetchAddedStatus();

    expect(isAdded.p1).toBe(true);
    expect(isAdded.p2).toBe(false);
  });

  it("認証なしならisAddedは空", async () => {
    mockUseAuth.mockReturnValue({ session: null });

    const { fetchAddedStatus, isAdded } = usePlaylistStatus({
      songId: "s1",
      playlists,
    });

    await fetchAddedStatus();

    expect(isAdded).toEqual({});
  });

  it("エラー発生時はToast表示", async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "user123" } } });
    mockEq.mockResolvedValueOnce({ data: null, error: { message: "error" } });

    const { fetchAddedStatus } = usePlaylistStatus({ songId: "s1", playlists });

    await fetchAddedStatus();

    expect(Toast.show).toHaveBeenCalled();
  });
});
