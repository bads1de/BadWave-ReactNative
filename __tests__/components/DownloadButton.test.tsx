import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { DownloadButton } from "../../components/DownloadButton";
import { OfflineStorageService } from "../../services/OfflineStorageService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// モックの設定
jest.mock("../../services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      downloadSong: jest.fn(),
      deleteSong: jest.fn(),
      isSongDownloaded: jest.fn(),
    })),
  };
});

// useDownloadStatusフックをモック
jest.mock("../../hooks/useDownloadStatus", () => ({
  useDownloadStatus: jest.fn(),
  useDownloadSong: jest.fn(),
  useDeleteDownloadedSong: jest.fn(),
}));

// テスト用のラッパーコンポーネント
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("DownloadButton - 常に表示されるダウンロードボタンコンポーネント", () => {
  let mockOfflineStorageService: jest.Mocked<OfflineStorageService>;

  const mockSong = {
    id: "song-1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    user_id: "test-user",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineStorageService =
      new OfflineStorageService() as jest.Mocked<OfflineStorageService>;

    // getOfflineStorageService関数をモック化
    jest
      .spyOn(
        require("../../hooks/TrackPlayer/utils"),
        "getOfflineStorageService"
      )
      .mockReturnValue(mockOfflineStorageService);
  });

  it("ダウンロード済みの曲は削除ボタンを表示する", async () => {
    // useDownloadStatusフックのモック設定
    const useDownloadStatusMock =
      require("../../hooks/useDownloadStatus").useDownloadStatus;
    useDownloadStatusMock.mockReturnValue({
      data: true,
      isLoading: false,
    });

    const useDeleteDownloadedSongMock =
      require("../../hooks/useDownloadStatus").useDeleteDownloadedSong;
    useDeleteDownloadedSongMock.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    // 削除ボタンが表示されることを確認
    expect(getByTestId("delete-button")).toBeTruthy();
    expect(useDownloadStatusMock).toHaveBeenCalledWith(mockSong.id);
  });

  it("ダウンロードボタンを押すと曲をダウンロードする", async () => {
    // useDownloadStatusフックのモック設定
    const useDownloadStatusMock =
      require("../../hooks/useDownloadStatus").useDownloadStatus;
    useDownloadStatusMock.mockReturnValue({
      data: false,
      isLoading: false,
    });

    // useDownloadSongフックのモック設定
    const mutateMock = jest.fn();
    const useDownloadSongMock =
      require("../../hooks/useDownloadStatus").useDownloadSong;
    useDownloadSongMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    // ダウンロードボタンが表示されることを確認
    expect(getByTestId("download-button")).toBeTruthy();

    // ボタンをクリック
    fireEvent.press(getByTestId("download-button"));

    // ダウンロード関数が呼ばれることを確認
    expect(mutateMock).toHaveBeenCalledWith(mockSong);
  });

  it("削除ボタンを押すと曲を削除する", async () => {
    // useDownloadStatusフックのモック設定
    const useDownloadStatusMock =
      require("../../hooks/useDownloadStatus").useDownloadStatus;
    useDownloadStatusMock.mockReturnValue({
      data: true,
      isLoading: false,
    });

    // useDeleteDownloadedSongフックのモック設定
    const mutateMock = jest.fn();
    const useDeleteDownloadedSongMock =
      require("../../hooks/useDownloadStatus").useDeleteDownloadedSong;
    useDeleteDownloadedSongMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    // 削除ボタンが表示されることを確認
    expect(getByTestId("delete-button")).toBeTruthy();

    // ボタンをクリック
    fireEvent.press(getByTestId("delete-button"));

    // 削除関数が呼ばれることを確認
    expect(mutateMock).toHaveBeenCalledWith(mockSong.id);
  });

  it("ダウンロード中はローディング状態を表示する", async () => {
    // useDownloadStatusフックのモック設定
    const useDownloadStatusMock =
      require("../../hooks/useDownloadStatus").useDownloadStatus;
    useDownloadStatusMock.mockReturnValue({
      data: false,
      isLoading: false,
    });

    // useDownloadSongフックのモック設定
    const useDownloadSongMock =
      require("../../hooks/useDownloadStatus").useDownloadSong;
    useDownloadSongMock.mockReturnValue({
      mutate: jest.fn(),
      isPending: true, // ローディング中
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    // ローディングインジケーターが表示されることを確認
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("ダウンロード成功後にボタンの状態が更新される", async () => {
    // useDownloadStatusフックのモック設定
    const useDownloadStatusMock =
      require("../../hooks/useDownloadStatus").useDownloadStatus;
    // 初回はダウンロードされていない状態
    useDownloadStatusMock.mockReturnValueOnce({
      data: false,
      isLoading: false,
    });
    // 2回目はダウンロード済み状態
    useDownloadStatusMock.mockReturnValueOnce({
      data: true,
      isLoading: false,
    });

    // useDownloadSongフックのモック設定
    const mutateMock = jest.fn();
    const useDownloadSongMock =
      require("../../hooks/useDownloadStatus").useDownloadSong;
    useDownloadSongMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    // useDeleteDownloadedSongフックのモック設定
    const useDeleteDownloadedSongMock =
      require("../../hooks/useDownloadStatus").useDeleteDownloadedSong;
    useDeleteDownloadedSongMock.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { getByTestId, rerender } = render(
      <DownloadButton song={mockSong} />,
      {
        wrapper: createWrapper(),
      }
    );

    // 初回はダウンロードボタンが表示される
    expect(getByTestId("download-button")).toBeTruthy();

    // ボタンをクリック
    fireEvent.press(getByTestId("download-button"));
    expect(mutateMock).toHaveBeenCalledWith(mockSong);

    // コンポーネントを再レンダリング
    rerender(<DownloadButton song={mockSong} />);

    // ダウンロード後は削除ボタンが表示される
    expect(getByTestId("delete-button")).toBeTruthy();
  });
});
