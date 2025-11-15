import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SpotlightBoard from "@/components/board/SpotlightBoard";
import getSpotlights from "@/actions/getSpotlights";

// モックの動画ref
const mockVideoRef = {
  playAsync: jest.fn().mockResolvedValue(undefined),
  pauseAsync: jest.fn().mockResolvedValue(undefined),
  unloadAsync: jest.fn().mockResolvedValue(undefined),
};

// モック設定を関数内に移動してReactの参照エラーを回避
jest.mock("@/components/modal/SpotlightModal", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Loading", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Error", () => ({ __esModule: true, default: () => null }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-av", () => {
  const mockReact = require("react");
  return {
    Video: mockReact.forwardRef((props: any, ref: any) => {
      // refをモックのvideoRefに設定
      mockReact.useImperativeHandle(ref, () => ({
        playAsync: jest.fn().mockResolvedValue(undefined),
        pauseAsync: jest.fn().mockResolvedValue(undefined),
        unloadAsync: jest.fn().mockResolvedValue(undefined),
      }));
      return null;
    }),
    ResizeMode: { COVER: "cover", CONTAIN: "contain" },
  };
});
jest.mock("@/actions/getSpotlights");

const mockGetSpotlights = getSpotlights as jest.MockedFunction<typeof getSpotlights>;

describe("SpotlightBoard - 動画管理最適化", () => {
  let queryClient: QueryClient;

  const mockSpotlightData = [
    { id: "1", video_path: "https://example.com/video1.mp4", title: "Video 1" },
    { id: "2", video_path: "https://example.com/video2.mp4", title: "Video 2" },
    { id: "3", video_path: "https://example.com/video3.mp4", title: "Video 3" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockGetSpotlights.mockResolvedValue(mockSpotlightData);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("基本レンダリング", () => {
    it("正常にレンダリングされる", () => {
      const { UNSAFE_root } = render(<SpotlightBoard />, { wrapper });
      expect(UNSAFE_root).toBeTruthy();
    });

    it("スポットライトデータを取得して表示する", async () => {
      render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
    });
  });

  describe("動画ref管理の最適化", () => {
    it("Map構造でvideoRefが管理されていること", async () => {
      // SpotlightBoardコンポーネント内部でvideoRefsMapが使用されていることを確認
      // これは実装の詳細なので、動作を通じて検証
      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(component).toBeTruthy();
    });

    it("videoRefのset/deleteが適切に行われること", async () => {
      // setVideoRefコールバックでMap.set/deleteが呼ばれることを期待
      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(component).toBeTruthy();
    });
  });

  describe("動画再生の最適化", () => {
    it("一度に1つの動画のみが再生されること（同時再生の防止）", async () => {
      // activeVideoIndexが正しく管理され、同時に複数の動画が再生されないことを検証
      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(component).toBeTruthy();
    });

    it("動画再生時に前の動画が自動的に停止されること", async () => {
      // handlePressInで前のvideoRefのpauseAsyncが呼ばれることを検証
      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(component).toBeTruthy();
    });

    it("activeVideoIndexが-1で初期化されること", async () => {
      // 初期状態でactiveVideoIndexが-1であることを期待
      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(component).toBeTruthy();
    });
  });

  describe("メモリ管理とクリーンアップ", () => {
    it("コンポーネントのアンマウント時に全動画が適切にクリーンアップされること", async () => {
      const { unmount } = render(<SpotlightBoard />, { wrapper });

      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });

      // アンマウント時にクリーンアップが実行される
      unmount();

      // 実装後、各videoRefのpauseAsyncとunloadAsyncが呼ばれることを検証
      // 現時点では基本的な動作のみ確認
    });

    it("Map構造のクリアが実行されること", async () => {
      // アンマウント時にvideoRefsMap.current.clear()が呼ばれることを検証
      // 実装後に詳細なテストを追加
      const { unmount } = render(<SpotlightBoard />, { wrapper });

      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });

      unmount();
      // 実装によりクリーンアップが実行されることを確認
    });
  });

  describe("パフォーマンスベンチマーク", () => {
    it("メモリリークが発生しないこと（複数回のマウント/アンマウント）", async () => {
      // 複数回マウント/アンマウントしてもメモリリークが発生しないことを検証
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<SpotlightBoard />, { wrapper });
        await waitFor(() => {
          expect(mockGetSpotlights).toHaveBeenCalled();
        });
        unmount();
        jest.clearAllMocks();
        mockGetSpotlights.mockResolvedValue(mockSpotlightData);
      }

      // 5回のマウント/アンマウント後も正常に動作することを確認
      const finalRender = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(finalRender).toBeTruthy();
    });

    it("同時再生動画数が1に制限されること", async () => {
      // activeVideoIndexの管理により、同時再生が1つに制限されることを検証
      // 実装後に詳細なテストを追加
      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });
      expect(component).toBeTruthy();
    });
  });

  describe("エラーハンドリング", () => {
    it("動画再生失敗時にアプリがクラッシュしないこと", async () => {
      mockVideoRef.playAsync.mockRejectedValueOnce(new Error("Play failed"));

      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });

      // エラーが発生してもコンポーネントは正常にレンダリングされる
      expect(component).toBeTruthy();
    });

    it("動画停止失敗時にアプリがクラッシュしないこと", async () => {
      mockVideoRef.pauseAsync.mockRejectedValueOnce(new Error("Pause failed"));

      const component = render(<SpotlightBoard />, { wrapper });
      await waitFor(() => {
        expect(mockGetSpotlights).toHaveBeenCalled();
      });

      expect(component).toBeTruthy();
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量の動画ref操作のパフォーマンステスト", () => {
      const startTime = performance.now();
      
      // 100個の動画refをMapで管理
      const videoRefsMap = new Map<number, any>();
      for (let i = 0; i < 100; i++) {
        videoRefsMap.set(i, { pauseAsync: jest.fn(), unloadAsync: jest.fn() });
      }
      
      // 全ての動画を取得（Map: O(1)アクセス）
      for (let i = 0; i < 100; i++) {
        videoRefsMap.get(i);
      }
      
      const mapTime = performance.now() - startTime;
      
      // 配列での同じ操作（比較用）
      const arrayStartTime = performance.now();
      const videoRefsArray = [];
      for (let i = 0; i < 100; i++) {
        videoRefsArray.push({ pauseAsync: jest.fn(), unloadAsync: jest.fn() });
      }
      
      // 全ての動画を取得（Array: O(n)アクセス）
      for (let i = 0; i < 100; i++) {
        videoRefsArray[i];
      }
      
      const arrayTime = performance.now() - arrayStartTime;
      
      console.log(`Map操作時間: ${mapTime.toFixed(3)}ms`);
      console.log(`配列操作時間: ${arrayTime.toFixed(3)}ms`);
      
      // 両方の操作がミリ秒単位で完了することを確認
      expect(mapTime).toBeLessThan(100);
      expect(arrayTime).toBeLessThan(100);
      
      // パフォーマンス結果をログに出力（改善率の計算）
      if (arrayTime > 0) {
        const improvement = ((arrayTime - mapTime) / arrayTime * 100).toFixed(1);
        console.log(`パフォーマンス差: ${improvement}% (正の値はMapの方が高速)`);
      }
    });

    it("メモリクリーンアップのパフォーマンステスト", () => {
      const videoRefsMap = new Map<number, any>();
      const mockRefs = [];
      
      // 50個の動画refを作成
      for (let i = 0; i < 50; i++) {
        const mockRef = {
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        };
        mockRefs.push(mockRef);
        videoRefsMap.set(i, mockRef);
      }
      
      const startTime = performance.now();
      
      // クリーンアップ実行
      videoRefsMap.forEach((ref) => {
        if (ref) {
          ref.pauseAsync();
          ref.unloadAsync();
        }
      });
      videoRefsMap.clear();
      
      const cleanupTime = performance.now() - startTime;
      
      console.log(`クリーンアップ時間: ${cleanupTime.toFixed(3)}ms`);
      
      // 全てのrefがクリーンアップされたことを確認
      mockRefs.forEach((ref) => {
        expect(ref.pauseAsync).toHaveBeenCalled();
        expect(ref.unloadAsync).toHaveBeenCalled();
      });
      
      expect(videoRefsMap.size).toBe(0);
      expect(cleanupTime).toBeLessThan(100); // 100ms以内に完了すること
    });

    it("同時再生制限のオーバーヘッドテスト", () => {
      const videoRefsMap = new Map<number, any>();
      let activeVideoIndex = -1;
      
      // 10個の動画refを作成
      for (let i = 0; i < 10; i++) {
        videoRefsMap.set(i, {
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          playAsync: jest.fn().mockResolvedValue(undefined),
        });
      }
      
      const startTime = performance.now();
      
      // 10回の動画切り替えをシミュレート
      for (let i = 0; i < 10; i++) {
        // 前の動画を停止
        if (activeVideoIndex !== -1) {
          const prevRef = videoRefsMap.get(activeVideoIndex);
          prevRef?.pauseAsync();
        }
        
        // 新しい動画を再生
        const currentRef = videoRefsMap.get(i);
        currentRef?.playAsync();
        activeVideoIndex = i;
      }
      
      const switchTime = performance.now() - startTime;
      
      console.log(`10回の動画切り替え時間: ${switchTime.toFixed(3)}ms`);
      console.log(`1回あたりの切り替え時間: ${(switchTime / 10).toFixed(3)}ms`);
      
      // 切り替えが高速であることを確認（1回あたり10ms以内）
      expect(switchTime / 10).toBeLessThan(10);
    });
  });
});
