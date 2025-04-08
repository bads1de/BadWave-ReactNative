import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { DownloadButton } from "../../components/DownloadButton";
import { OfflineStorageService } from "../../services/OfflineStorageService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
  return ({ children }) => (
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
      .mockReturnValue(mockOff qSd("download-button")).toBeTruthy();
  acaeockSong.id);
 // S設MrnValue({
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

  it("削除成功後にボタンの状態が更新される", async () => {
    mockOfflineStorageService.isSongDownloaded
      .mockResolvedValueOnce(true) // 初回チェック時はダウンロード済み
      .mockResolvedValueOnce(false); // 削除後のチェック

    mockOfflineStorageService.deleteSong.mockResolvedValue({ success: true });

    const { getByTestId, queryByTestId } = render(
      <DownloadButton song={mockSong} />,
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    // actでラップして状態更新を正しく処理
    await act(async () => {
      fireEvent.press(getByTestId("delete-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("delete-button")).toBeNull();
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("ダウンロード失敗時の処理を正しく行う", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: "Download failed",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });,
  {
        wrapper: createWrapper(,
      }
    )
    // actでラップして状態更新を正しく処理
    await act(async () => {
      fireEvent.press(getByTestId("download-button"));
    });

    // ダウンロード失敗後もダウンロードボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("削除失敗時の処理を正しく行う", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: "Deletion failed",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();, {
      wrapper: createWrapper(,
    })
    });

    // actでラップして状態更新を正しく処理
    await act(async () => {
      fireEvent.press(getByTestId("delete-button"));
    });

    // 削除失敗後も削除ボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("削除中はローディング状態を表示する", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    // 削除が完了する前にローディング状態をチェックするため、解決しないPromiseを返す
    mockOfflineStorageService.deleteSong.mockImplementation(
      () => new Promise(() => {})
    );

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });
, {
      wrapper: createWrapper(,
    })
    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  it("ダウンロード中のネットワークエラーを処理する", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: "Network error: Unable to download song",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();, {
      wrapper: createWrapper(),
    }
    });

    fireEvent.press(getByTestId("download-button"));

    // ネットワークエラー後もダウンロードボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("ダウンロード中のディスク容量エラーを処理する", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: "Disk space error: Not enough storage",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });, {
      wrapper: createWrapper(),
    }

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    // ディスクエラー後もダウンロードボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("削除中の権限エラーを処理する", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: "Permission error: Cannot delete file",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    }, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    // 権限エラー後も削除ボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("連続クリックを正しく処理する", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    // ダウンロードに時間がかかるようにモック
    mockOfflineStorageService.downloadSong.mockImplementation(
      () =>
        new Promise((resolve) =>, {
      wrapper: createWrapper(),
    }
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    // 最初のクリック
    fireEvent.press(getByTestId("download-button"));

    // ローディング状態を確認
    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });

    // ローディング中にさらにクリックしようとしても無視される
    // ローディング中はボタンが表示されないので、クリックはできない

    // downloadSongが1回だけ呼ばれることを確認, {
      wrapper: createWrapper(),
    }
    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledTimes(1);
    });
  });

  it("ダウンロード中のコンポーネントアンマウントを処理する", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    // ダウンロードに時間がかかるようにモック
    mockOfflineStorageService.downloadSong.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 500)
        )
    );

    const { getByTestId, unmount } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    // ダウンロード開始
    fireEvent.press(getByTestId("download-button"));

    // ローディング状態を確認
    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });

    // コンポーネントをアンマウント
    unmount();, {
      wrapper: createWrapper(,
    })

    // エラーが発生しないことを確認
    // ここでは特にアサーションは不要、エラーが発生しないことを確認するテスト
  });

  it("タイトルに特殊文字を含む曲を処理する", async () => {
    // 特殊文字を含む曲名のケース
    const specialCharSong = {
      ...mockSong,
      title: "日本語の曲名 と Special Ch@r$: ♥♪",
    };

    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { getByTestId } = render(<DownloadButton song={specialCharSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
        specialCharSong
      );
    });
  });, {
      wrapper: createWrapper(),
    }

  it("複数の同時ダウンロード操作を正しく処理する", async () => {
    // 同時に複数のダウンロードが行われた場合のテスト
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);

    // ダウンロードに時間がかかるようにモック
    let downloadPromiseResolve: (value: { success: boolean }) => void;
    const downloadPromise = new Promise<{ success: boolean }>((resolve) => {
      downloadPromiseResolve = resolve;
    });

    mockOfflineStorageService.downloadSong.mockReturnValue(downloadPromise);
    </>,
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(getAllByTestId("download-button")).toHaveLength(2);
    });

    // 両方のボタンをクリック
    const buttons = getAllByTestId("download-button");
    fireEvent.press(buttons[0]);
    fireEvent.press(buttons[1]);

    // ダウンロードが2回呼ばれることを確認
    expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledTimes(2);

    // 最初のダウンロードを完了
    downl,oadPromiseResolve!({ success: true });
  {
        wrapper: createWrapper(),
      }
    
    // ダウンロードが完了したことを確認
    // 初期チェック2回が行われていることを確認
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledTimes(2);
  });

  it("プロパティが欠けている曲を適切に処理する", async () => {
    // 必要なプロパティが欠けている曲のケース
    const incompleteSong = {
      id: "incomplete-song",
      title: "Incomplete Song",
      // authorが欠けている
      // image_pathが欠けている
      song_path: "https://example.com/incomplete.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    } as any;

    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { getByTestId } = render(<DownloadButton song={incompleteSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    // actでラップして状態更新を正しく処理
    await act(async () => {
      fireEvent.press(getByTestId("download-button"));
    });

    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
        incompleteSong
      );, {
      wrapper: createWrapper(,
    })
    });
  });

  it("ボタンの連打を正しく処理する", async () => {
    // 連打クリックのテスト
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);

    // ダウンロードに時間がかかるようにモック
    let downloadResolve: (value: { success: boolean }) => void;
(resolve) => {
     wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    // 最初のクリック
    await act(async () => {
      fireEvent.press(getByTestId("download-button"));
    });

    // ローディング状態になることを確認
    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });

    // ローディング中に再度クリックしても無視されることを確認
    await act(async () => {
      fireEvent.press(getByTestId("loading-indicator"));, {
      wrapper: createWrapper(),
    }
    });

    // ダウンロードが1回しか呼ばれないことを確認
    expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledTimes(1);

    // ダウンロード完了
    downloadResolve!({ success: true });

    // ダウンロード完了後は削除ボタンが表示される
    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("ネットワーク再接続シナリオを処理する", async () => {
    // ネットワーク切断と再接続のシナリオをテスト
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);

    // 最初はネットワークエラーを返す
    mockOfflineStorageService.downloadSong
      .mockResolvedValueOnce({
        success: false,
        error: "Network error: Unable to download song",
      })
      // 2回目は成功する
      .mockResolvedValueOnce({ success: true });

    const { getByTestId, queryByTestId } = render(
      <DownloadButton song={mockSong} />,
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    // 最初のダウンロード試行（失敗する）
    await act(async () => {
      fireEvent.press(getByTestId("download-button"));
    });

    // 失敗後もダウンロードボタンが表示される
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });,
      {
        wrapper: createWrapper(),
      }

    // 2回目のダウンロード試行（成功する）
    await act(async () => {
      fireEvent.press(getByTestId("download-button"));
    });

    // 成功後は削除ボタンが表示される
    await waitFor(() => {
      expect(queryByTestId("download-button")).toBeNull();
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("ディスク容量エラーを正しく処理する", async () => {
    // ディスク容量不足のエラーをテスト
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: "Disk space error: Not enough storage",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId("download-button"));
    });

    // エラー後もダウンロードボタンが表示される
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });, {
      wrapper: createWrapper(),
    }
  });

  it("削除中の権限エラーを適切に処理する", async () => {
    // 削除時の権限エラーをテスト
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: "Permission error: Cannot delete file",
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId("delete-button"));
    });

    // エラー後も削除ボタンが表示される
    await waitFor(() => {, {
      wrapper: createWrapper(),
    }
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });
});
});