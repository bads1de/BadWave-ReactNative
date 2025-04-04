import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { DownloadButton } from "../../components/DownloadButton";
import { OfflineStorageService } from "../../services/OfflineStorageService";

// Ioniconsのモック
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

describe("DownloadButton", () => {
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

  it("renders download button when song is not downloaded", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledWith(
      mockSong.id
    );
  });

  it("renders delete button when song is downloaded", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledWith(
      mockSong.id
    );
  });

  it("downloads song when download button is pressed", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
        mockSong
      );
    });
  });

  it("deletes song when delete button is pressed", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.deleteSong.mockResolvedValue({ success: true });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => {
      expect(mockOfflineStorageService.deleteSong).toHaveBeenCalledWith(
        mockSong.id
      );
    });
  });

  it("shows loading state during download", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    // ダウンロードが完了する前にローディング状態をチェックするため、解決しないPromiseを返す
    mockOfflineStorageService.downloadSong.mockImplementation(
      () => new Promise(() => {})
    );

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  it("updates button state after successful download", async () => {
    mockOfflineStorageService.isSongDownloaded
      .mockResolvedValueOnce(false) // 初回チェック時はダウンロードされていない
      .mockResolvedValueOnce(true); // ダウンロード後のチェック

    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { getByTestId, queryByTestId } = render(
      <DownloadButton song={mockSong} />
    );

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    await waitFor(() => {
      expect(queryByTestId("download-button")).toBeNull();
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("updates button state after successful deletion", async () => {
    mockOfflineStorageService.isSongDownloaded
      .mockResolvedValueOnce(true) // 初回チェック時はダウンロード済み
      .mockResolvedValueOnce(false); // 削除後のチェック

    mockOfflineStorageService.deleteSong.mockResolvedValue({ success: true });

    const { getByTestId, queryByTestId } = render(
      <DownloadButton song={mockSong} />
    );

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => {
      expect(queryByTestId("delete-button")).toBeNull();
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("handles download failure", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: new Error("Download failed"),
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    // ダウンロード失敗後もダウンロードボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("handles deletion failure", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: new Error("Deletion failed"),
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    // 削除失敗後も削除ボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("shows loading state during deletion", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    // 削除が完了する前にローディング状態をチェックするため、解決しないPromiseを返す
    mockOfflineStorageService.deleteSong.mockImplementation(
      () => new Promise(() => {})
    );

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  it("handles network errors during download", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: new Error("Network error: Unable to download song"),
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    // ネットワークエラー後もダウンロードボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("handles disk space errors during download", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: new Error("Disk space error: Not enough storage"),
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    // ディスクエラー後もダウンロードボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });
  });

  it("handles permission errors during deletion", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: new Error("Permission error: Cannot delete file"),
    });

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("delete-button"));

    // 権限エラー後も削除ボタンが表示されることを確認
    await waitFor(() => {
      expect(getByTestId("delete-button")).toBeTruthy();
    });
  });

  it("handles rapid button clicks correctly", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    // ダウンロードに時間がかかるようにモック
    mockOfflineStorageService.downloadSong.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    const { getByTestId } = render(<DownloadButton song={mockSong} />);

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

    // downloadSongが1回だけ呼ばれることを確認
    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledTimes(1);
    });
  });

  it("handles component unmount during download operation", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    // ダウンロードに時間がかかるようにモック
    mockOfflineStorageService.downloadSong.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 500)
        )
    );

    const { getByTestId, unmount } = render(<DownloadButton song={mockSong} />);

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
    unmount();

    // エラーが発生しないことを確認
    // ここでは特にアサーションは不要、エラーが発生しないことを確認するテスト
  });

  it("handles songs with non-standard characters in title", async () => {
    // 特殊文字を含む曲名のケース
    const specialCharSong = {
      ...mockSong,
      title: "日本語の曲名 と Special Ch@r$: ♥♪",
    };

    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { getByTestId } = render(<DownloadButton song={specialCharSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
        specialCharSong
      );
    });
  });

  it("handles concurrent download operations correctly", async () => {
    // 同時に複数のダウンロードが行われた場合のテスト
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);

    // ダウンロードに時間がかかるようにモック
    let downloadPromiseResolve: (value: { success: boolean }) => void;
    const downloadPromise = new Promise<{ success: boolean }>((resolve) => {
      downloadPromiseResolve = resolve;
    });

    mockOfflineStorageService.downloadSong.mockReturnValue(downloadPromise);

    // 複数のボタンをレンダリング
    const { getAllByTestId } = render(
      <>
        <DownloadButton song={mockSong} />
        <DownloadButton song={{ ...mockSong, id: "song-2" }} />
      </>
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
    downloadPromiseResolve({ success: true });

    // ダウンロードが完了したことを確認
    // 初期チェック2回が行われていることを確認
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledTimes(2);
  });

  it("handles songs with missing properties gracefully", async () => {
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

    const { getByTestId } = render(<DownloadButton song={incompleteSong} />);

    await waitFor(() => {
      expect(getByTestId("download-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("download-button"));

    await waitFor(() => {
      expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
        incompleteSong
      );
    });
  });
});
