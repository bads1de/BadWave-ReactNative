import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { DownloadButton } from "../../components/DownloadButton";
import { OfflineStorageService } from "../../services/OfflineStorageService";

// Ioniconsのモック
jest.mock("@expo/vector-icons", () => {
  const originalModule = jest.requireActual("@expo/vector-icons");
  return {
    Ionicons: "Ionicons",
  };
});

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
});
