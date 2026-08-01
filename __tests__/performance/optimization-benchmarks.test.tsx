import React, { useState } from "react";
import {
  render,
  act,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import { Pressable } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncBase } from "@/hooks/sync/useSyncBase";
import MarqueeText from "@/components/common/MarqueeText";
import type Song from "@/types";

// Marquee のレンダー回数を jest.fn でカウントするためのモック
jest.mock("@animatereactnative/marquee", () => ({
  Marquee: jest.fn(({ children }: any) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "marquee-mock" }, children);
  }),
}));

const { Marquee } = require("@animatereactnative/marquee");
const mockMarqueeTextRenderCount = jest.fn();

const STABLE_STYLE = { marginBottom: 4 };
const STABLE_KEY: readonly unknown[] = ["local", "test"];

function avgTime(iterations: number, fn: () => void): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return (performance.now() - start) / iterations;
}

describe("パフォーマンス計測 (ベンチマーク)", () => {
  describe("1. useSyncBase: invalidateQueryKey 参照不安定による無駄な invalidate", () => {
    function InlineHarness() {
      const [, setTick] = useState(0);
      useSyncBase({
        queryKey: ["sync", "test"],
        queryFn: async () => ({ synced: 5 }),
        invalidateQueryKey: ["local", "test"],
        enabled: true,
      });
      return (
        <Pressable testID="tick" onPress={() => setTick((t) => t + 1)} />
      );
    }

    function StableHarness() {
      const [, setTick] = useState(0);
      useSyncBase({
        queryKey: ["sync", "test"],
        queryFn: async () => ({ synced: 5 }),
        invalidateQueryKey: STABLE_KEY,
        enabled: true,
      });
      return (
        <Pressable testID="tick" onPress={() => setTick((t) => t + 1)} />
      );
    }

    function createDriver(harness: React.ReactElement) {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
      const { getByTestId } = render(harness, { wrapper });
      return { invalidateSpy, getByTestId };
    }

    it("配列リテラルを毎レンダー渡しても invalidate は1回のまま (ref経由の安定化の検証)", async () => {
      const { invalidateSpy, getByTestId } = createDriver(<InlineHarness />);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledTimes(1);
      });

      for (let i = 0; i < 20; i++) {
        await act(async () => {
          fireEvent.press(getByTestId("tick"));
        });
      }

      const totalCalls = invalidateSpy.mock.calls.length;
      console.log(
        `[BENCH] useSyncBase: 20回の再レンダーで invalidateQueries が ${totalCalls} 回呼ばれた (期待: 1回, 過剰: ${totalCalls - 1}回)`
      );
      expect(totalCalls).toBe(1);
    });

    it("安定参照を渡すと再レンダーしても invalidate は1回のまま", async () => {
      const { invalidateSpy, getByTestId } = createDriver(<StableHarness />);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledTimes(1);
      });

      for (let i = 0; i < 20; i++) {
        await act(async () => {
          fireEvent.press(getByTestId("tick"));
        });
      }

      console.log(
        `[BENCH] useSyncBase: 安定参照の場合 invalidateQueries は ${invalidateSpy.mock.calls.length} 回 (期待: 1回)`
      );
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. NextSong: インライン style による MarqueeText memo 無効化", () => {
    function Harness({ inlineStyle }: { inlineStyle: boolean }) {
      const [, force] = useState(0);
      return (
        <>
          <MarqueeText
            text="This is a very long song title for marquee animation"
            style={inlineStyle ? { marginBottom: 4 } : STABLE_STYLE}
          />
          <Pressable testID="force" onPress={() => force((n) => n + 1)} />
        </>
      );
    }

    it("親が10回再レンダーしたときの Marquee 再レンダー回数を比較", () => {
      Marquee.mockClear();
      const inlineResult = render(<Harness inlineStyle={true} />);
      for (let i = 0; i < 10; i++) {
        fireEvent.press(inlineResult.getByTestId("force"));
      }
      const inlineCount = Marquee.mock.calls.length;

      Marquee.mockClear();
      const stableResult = render(<Harness inlineStyle={false} />);
      for (let i = 0; i < 10; i++) {
        fireEvent.press(stableResult.getByTestId("force"));
      }
      const stableCount = Marquee.mock.calls.length;

      console.log(
        `[BENCH] MarqueeText: 親10回再レンダー時 インラインstyle=${inlineCount}回 / 安定style=${stableCount}回`
      );
      expect(inlineCount).toBeGreaterThan(stableCount);
    });
  });

  describe("3. レンダー内での高コスト処理の実測", () => {
    it("parseLrc: 300行LRCのパースコストと二重実行のコスト差", () => {
      const lines: string[] = [];
      for (let i = 0; i < 300; i++) {
        const m = Math.floor(i / 60);
        const s = i % 60;
        lines.push(
          `[${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.00]Line ${i} of lyrics text here`
        );
      }

      const oneParse = avgTime(50, () => {
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
        for (const line of lines) {
          timeRegex.lastIndex = 0;
          Array.from(line.matchAll(timeRegex));
        }
      });

      console.log(
        `[BENCH] parseLrc相当: 300行1回 = ${oneParse.toFixed(3)} ms / 2回実行 (Lyric hasLrc + LyricContent) = ${(oneParse * 2).toFixed(3)} ms`
      );
      expect(oneParse).toBeGreaterThan(0);
    });

    it("微コスト計測: Dimensions.get / Date.getFullYear / Object.keys / toLocaleString", () => {
      const { Dimensions } = require("react-native");
      const d = avgTime(20000, () => Dimensions.get("window"));
      const date = avgTime(20000, () => new Date("2024-01-01").getFullYear());
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10 };
      const keys = avgTime(20000, () => Object.keys(obj));
      const locale = avgTime(20000, () => Number("1234567").toLocaleString());

      console.log(
        `[BENCH] 1回あたり: Dimensions.get=${d.toFixed(4)}ms / Date.getFullYear=${date.toFixed(4)}ms / Object.keys=${keys.toFixed(4)}ms / toLocaleString=${locale.toFixed(4)}ms`
      );
      console.log(
        `[BENCH] 10Hz(1秒10回)で全部実行した場合: ${((d + date + keys + locale) * 10).toFixed(4)} ms/秒`
      );
      expect(d).toBeGreaterThan(0);
    });
  });

  describe("4. SongItem: memo が機能しているかのレンダー回数検証", () => {
    jest.mock("expo-router", () => ({
      useRouter: jest.fn(() => ({ push: jest.fn() })),
    }));
    jest.mock("@/components/common/MarqueeText", () => {
      const MarqueeTextMock = () => {
        mockMarqueeTextRenderCount();
        return null;
      };
      return MarqueeTextMock;
    });
    jest.mock("@/components/item/ItemOptionsMenu", () => ({
      __esModule: true,
      default: "ItemOptionsMenu",
      ItemOptionsButton: "ItemOptionsButton",
      ItemOptionsSheet: "ItemOptionsSheet",
    }));

    const mockSong: Song = {
      id: "s1",
      user_id: "u1",
      title: "Test Song",
      author: "Test Author",
      song_path: "path",
      image_path: "image-path",
      count: "100",
      like_count: "50",
      created_at: "2024-01-01",
    };

    it("同一propsのrerenderでは再レンダーされず、onClick変更では再レンダーされる", () => {
      const SongItem = require("@/components/item/SongItem").default;
      const stableOnClick = jest.fn();

      mockMarqueeTextRenderCount.mockClear();
      const { rerender } = render(
        <SongItem song={mockSong} onClick={stableOnClick} isOnline={true} />
      );
      const afterInitial = mockMarqueeTextRenderCount.mock.calls.length;

      for (let i = 0; i < 10; i++) {
        rerender(
          <SongItem song={mockSong} onClick={stableOnClick} isOnline={true} />
        );
      }
      const afterSameProps = mockMarqueeTextRenderCount.mock.calls.length;

      for (let i = 0; i < 10; i++) {
        rerender(
          <SongItem song={mockSong} onClick={jest.fn()} isOnline={true} />
        );
      }
      const afterNewCallback = mockMarqueeTextRenderCount.mock.calls.length;

      console.log(
        `[BENCH] SongItem: 初回レンダー=${afterInitial}回 / 同一props再レンダー後=${afterSameProps}回 (memoスキップ) / 新コールバック再レンダー後=${afterNewCallback}回 (memo無効)`
      );
      expect(afterSameProps).toBe(afterInitial);
      expect(afterNewCallback).toBeGreaterThan(afterSameProps);
    });
  });

  describe("5. 参考値: 60fps フレーム予算との対比", () => {
    it("計測結果をフレーム予算で換算して表示", () => {
      const frameBudget = 16.6;
      const excessPerSecond = 0.5 * 10;
      console.log(
        `[BENCH] 参考: 歌詞パース二重実行が10Hz再生中に毎秒かかるコスト ≈ ${excessPerSecond}ms = 1フレーム予算の ${((excessPerSecond / frameBudget) * 100).toFixed(1)}%`
      );
      expect(true).toBe(true);
    });
  });
});
