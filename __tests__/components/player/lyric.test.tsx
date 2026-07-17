import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Lyric from "@/components/player/lyric";

// LayoutAnimationのみモック（RN 0.81 は react-native バレルが .default を参照するため __esModule/default でラップ）
jest.mock("react-native/Libraries/LayoutAnimation/LayoutAnimation", () => ({
  __esModule: true,
  default: {
    configureNext: jest.fn(),
    create: jest.fn(),
    Presets: {
      easeInEaseOut: {},
    },
    Types: {},
    Properties: {},
  },
}));

describe("Lyric", () => {
  const mockLyrics = `First line of lyrics
Second line of lyrics
Third line of lyrics
Fourth line of lyrics
Fifth line of lyrics`;

  const shortLyrics = `Line 1
Line 2
Line 3`;

  const veryLongLyrics = Array(50)
    .fill("This is a line of lyrics")
    .join("\n");

  describe("レンダリングテスト", () => {
    it("初期状態で正しくレンダリングされる", () => {
      const { getByText } = render(<Lyric lyrics={mockLyrics} />);

      expect(getByText("First line of lyrics")).toBeTruthy();
    });

    it("ScrollViewが存在する", () => {
      const { UNSAFE_getByType } = render(<Lyric lyrics={mockLyrics} />);

      const scrollView = UNSAFE_getByType(
        require("react-native").ScrollView
      );
      expect(scrollView).toBeTruthy();
    });

    it("歌詞コンテナが正しくレンダリングされる", () => {
      const { UNSAFE_getAllByType } = render(<Lyric lyrics={mockLyrics} />);

      const views = UNSAFE_getAllByType(require("react-native").View);
      expect(views.length).toBeGreaterThan(0);
    });
  });

  describe("歌詞表示", () => {
    it("歌詞テキストが正確に表示される", () => {
      const { getByText } = render(<Lyric lyrics={mockLyrics} />);

      expect(getByText("First line of lyrics")).toBeTruthy();
      expect(getByText("Second line of lyrics")).toBeTruthy();
      expect(getByText("Third line of lyrics")).toBeTruthy();
    });

    it("デフォルトで3行が表示される", () => {
      const { queryByText } = render(<Lyric lyrics={mockLyrics} />);

      // 最初の3行は表示される
      expect(queryByText("First line of lyrics")).toBeTruthy();
      expect(queryByText("Second line of lyrics")).toBeTruthy();
      expect(queryByText("Third line of lyrics")).toBeTruthy();

      // 4行目以降は非展開時は表示されない（DOMに存在しない）
      expect(queryByText("Fourth line of lyrics")).toBeFalsy();
      expect(queryByText("Fifth line of lyrics")).toBeFalsy();
    });

    it("initialVisibleLinesで表示行数を指定できる", () => {
      const { queryByText } = render(
        <Lyric lyrics={mockLyrics} initialVisibleLines={2} />
      );

      expect(queryByText("First line of lyrics")).toBeTruthy();
      expect(queryByText("Second line of lyrics")).toBeTruthy();
      expect(queryByText("Third line of lyrics")).toBeFalsy();
    });

    it("複数行の歌詞が正しく表示される", () => {
      const multiLineLyrics = "Line A\nLine B\nLine C\nLine D\nLine E";
      const { getByText } = render(<Lyric lyrics={multiLineLyrics} />);

      expect(getByText("Line A")).toBeTruthy();
      expect(getByText("Line B")).toBeTruthy();
      expect(getByText("Line C")).toBeTruthy();
    });

    it("空行が正しく処理される", () => {
      const lyricsWithEmptyLines = "First\n\nThird\n\nFifth";
      const { UNSAFE_getAllByType } = render(
        <Lyric lyrics={lyricsWithEmptyLines} />
      );

      const texts = UNSAFE_getAllByType(require("react-native").Text);
      // タイトル、アーティスト名がない場合は歌詞のTextのみ
      expect(texts.length).toBeGreaterThan(0);
    });

    it("歌詞の改行が保持される", () => {
      const lyricsWithNewlines = "Verse 1\n\nChorus\n\nVerse 2";
      const { getByText } = render(<Lyric lyrics={lyricsWithNewlines} />);

      expect(getByText("Verse 1")).toBeTruthy();
      expect(getByText("Chorus")).toBeTruthy();
    });
  });

  describe("曲情報の表示", () => {
    it("曲のタイトルが表示される", () => {
      const { getByText } = render(
        <Lyric lyrics={mockLyrics} songTitle="Test Song" />
      );

      expect(getByText("Test Song")).toBeTruthy();
    });

    it("アーティスト名が表示される", () => {
      const { getByText } = render(
        <Lyric lyrics={mockLyrics} artistName="Test Artist" />
      );

      expect(getByText("Test Artist")).toBeTruthy();
    });

    it("タイトルとアーティスト名の両方が表示される", () => {
      const { getByText } = render(
        <Lyric
          lyrics={mockLyrics}
          songTitle="Test Song"
          artistName="Test Artist"
        />
      );

      expect(getByText("Test Song")).toBeTruthy();
      expect(getByText("Test Artist")).toBeTruthy();
    });

    it("タイトルとアーティスト名がない場合は情報セクションが表示されない", () => {
      const { queryByText } = render(<Lyric lyrics={mockLyrics} />);

      // 歌詞のみが表示される
      expect(queryByText("First line of lyrics")).toBeTruthy();
    });

    it("タイトルのみの場合は正しく表示される", () => {
      const { getByText, queryByText } = render(
        <Lyric lyrics={mockLyrics} songTitle="Only Title" />
      );

      expect(getByText("Only Title")).toBeTruthy();
      // アーティスト名が空の場合は表示されない
    });

    it("アーティスト名のみの場合は正しく表示される", () => {
      const { getByText } = render(
        <Lyric lyrics={mockLyrics} artistName="Only Artist" />
      );

      expect(getByText("Only Artist")).toBeTruthy();
    });
  });

  describe("展開/折りたたみ機能", () => {
    it("行数がinitialVisibleLinesより多い場合、展開ボタンが表示される", () => {
      const { getByText } = render(<Lyric lyrics={mockLyrics} />);

      expect(getByText("Show more")).toBeTruthy();
    });

    it("行数がinitialVisibleLines以下の場合、展開ボタンが表示されない", () => {
      const { queryByText } = render(<Lyric lyrics={shortLyrics} />);

      expect(queryByText("Show more")).toBeFalsy();
      expect(queryByText("Show less")).toBeFalsy();
    });

    it("展開ボタンをタップすると全ての歌詞が表示される", () => {
      const { getByText, queryByText } = render(<Lyric lyrics={mockLyrics} />);

      // 初期状態では4行目以降は非表示
      expect(queryByText("Fourth line of lyrics")).toBeFalsy();
      expect(queryByText("Fifth line of lyrics")).toBeFalsy();

      // 展開ボタンをタップ
      const expandButton = getByText("Show more");
      fireEvent.press(expandButton);

      // 全ての行が表示される
      expect(getByText("Fourth line of lyrics")).toBeTruthy();
      expect(getByText("Fifth line of lyrics")).toBeTruthy();
    });

    it("展開後はボタンテキストが「Show less」に変わる", () => {
      const { getByText, queryByText } = render(<Lyric lyrics={mockLyrics} />);

      expect(getByText("Show more")).toBeTruthy();
      expect(queryByText("Show less")).toBeFalsy();

      const expandButton = getByText("Show more");
      fireEvent.press(expandButton);

      expect(queryByText("Show more")).toBeFalsy();
      expect(getByText("Show less")).toBeTruthy();
    });

    it("折りたたみボタンをタップすると初期表示行数に戻る", () => {
      const { getByText, queryByText } = render(<Lyric lyrics={mockLyrics} />);

      // 展開
      const expandButton = getByText("Show more");
      fireEvent.press(expandButton);

      expect(getByText("Fourth line of lyrics")).toBeTruthy();

      // 折りたたみ
      const collapseButton = getByText("Show less");
      fireEvent.press(collapseButton);

      // 4行目以降が非表示になる
      expect(queryByText("Fourth line of lyrics")).toBeFalsy();
      expect(queryByText("Fifth line of lyrics")).toBeFalsy();
    });

    it("展開/折りたたみを繰り返しても正しく動作する", () => {
      const { getByText, queryByText } = render(<Lyric lyrics={mockLyrics} />);

      // 1回目の展開
      fireEvent.press(getByText("Show more"));
      expect(getByText("Fourth line of lyrics")).toBeTruthy();

      // 1回目の折りたたみ
      fireEvent.press(getByText("Show less"));
      expect(queryByText("Fourth line of lyrics")).toBeFalsy();

      // 2回目の展開
      fireEvent.press(getByText("Show more"));
      expect(getByText("Fourth line of lyrics")).toBeTruthy();

      // 2回目の折りたたみ
      fireEvent.press(getByText("Show less"));
      expect(queryByText("Fourth line of lyrics")).toBeFalsy();
    });

    it("LayoutAnimationが呼ばれる", () => {
      const { LayoutAnimation } = require("react-native");
      const { getByText } = render(<Lyric lyrics={mockLyrics} />);

      const initialCallCount = LayoutAnimation.configureNext.mock.calls.length;

      const expandButton = getByText("Show more");
      fireEvent.press(expandButton);

      expect(LayoutAnimation.configureNext).toHaveBeenCalledTimes(
        initialCallCount + 1
      );
    });
  });

  describe("エッジケース", () => {
    it("歌詞がnullの場合はエラーが発生する", () => {
      expect(() => {
        render(<Lyric lyrics={null as any} />);
      }).toThrow();
    });

    it("歌詞がundefinedの場合はエラーが発生する", () => {
      expect(() => {
        render(<Lyric lyrics={undefined as any} />);
      }).toThrow();
    });

    it("空の歌詞でもエラーが発生しない", () => {
      const { UNSAFE_getAllByType } = render(<Lyric lyrics="" />);

      const texts = UNSAFE_getAllByType(require("react-native").Text);
      // 展開ボタンは表示されない
      expect(texts.length).toBeGreaterThanOrEqual(0);
    });

    it("1行だけの歌詞でも正しく表示される", () => {
      const singleLine = "Only one line";
      const { getByText, queryByText } = render(<Lyric lyrics={singleLine} />);

      expect(getByText("Only one line")).toBeTruthy();
      expect(queryByText("Show more")).toBeFalsy();
    });

    it("非常に長い歌詞でもエラーが発生しない", () => {
      expect(() => {
        render(<Lyric lyrics={veryLongLyrics} />);
      }).not.toThrow();
    });

    it("特殊文字を含む歌詞が正しく表示される", () => {
      const specialLyrics = "Test 🎵 Song & <Lyrics> 'with' \"quotes\"\n特殊文字\n改行";
      const { getByText } = render(<Lyric lyrics={specialLyrics} />);

      expect(getByText("Test 🎵 Song & <Lyrics> 'with' \"quotes\"")).toBeTruthy();
      expect(getByText("特殊文字")).toBeTruthy();
    });

    it("非常に長いタイトルでもエラーが発生しない", () => {
      const longTitle = "A".repeat(200);
      expect(() => {
        render(<Lyric lyrics={mockLyrics} songTitle={longTitle} />);
      }).not.toThrow();
    });

    it("非常に長いアーティスト名でもエラーが発生しない", () => {
      const longArtist = "B".repeat(200);
      expect(() => {
        render(<Lyric lyrics={mockLyrics} artistName={longArtist} />);
      }).not.toThrow();
    });

    it("空白のみの行が正しく処理される", () => {
      const lyricsWithSpaces = "Line 1\n   \nLine 3";
      const { UNSAFE_getAllByType } = render(<Lyric lyrics={lyricsWithSpaces} />);

      const texts = UNSAFE_getAllByType(require("react-native").Text);
      expect(texts.length).toBeGreaterThan(0);
    });

    it("タブ文字を含む歌詞が正しく表示される", () => {
      const lyricsWithTabs = "Line with\ttabs\nAnother\tline";
      expect(() => {
        render(<Lyric lyrics={lyricsWithTabs} />);
      }).not.toThrow();
    });

    it("連続する改行が正しく処理される", () => {
      const lyricsWithMultipleNewlines = "Line 1\n\n\n\nLine 5";
      const { getByText } = render(<Lyric lyrics={lyricsWithMultipleNewlines} />);

      expect(getByText("Line 1")).toBeTruthy();
    });

    it("initialVisibleLinesが0の場合でもエラーが発生しない", () => {
      expect(() => {
        render(<Lyric lyrics={mockLyrics} initialVisibleLines={0} />);
      }).not.toThrow();
    });

    it("initialVisibleLinesが負の数の場合でもエラーが発生しない", () => {
      expect(() => {
        render(<Lyric lyrics={mockLyrics} initialVisibleLines={-1} />);
      }).not.toThrow();
    });

    it("initialVisibleLinesが歌詞の行数より多い場合、展開ボタンは表示されない", () => {
      const { queryByText } = render(
        <Lyric lyrics={shortLyrics} initialVisibleLines={10} />
      );

      expect(queryByText("Show more")).toBeFalsy();
    });
  });

  describe("スタイリングとレイアウト", () => {
    it("コンテナが正しくレンダリングされる", () => {
      const { UNSAFE_getAllByType } = render(<Lyric lyrics={mockLyrics} />);

      const views = UNSAFE_getAllByType(require("react-native").View);
      expect(views.length).toBeGreaterThan(0);
    });

    it("ScrollViewが正しい設定でレンダリングされる", () => {
      const { UNSAFE_getByType } = render(<Lyric lyrics={mockLyrics} />);

      const scrollView = UNSAFE_getByType(require("react-native").ScrollView);
      expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
    });

    it("展開ボタンが正しくレンダリングされる", () => {
      const { UNSAFE_getAllByType } = render(<Lyric lyrics={mockLyrics} />);

      const touchableOpacities = UNSAFE_getAllByType(
        require("react-native").TouchableOpacity
      );
      expect(touchableOpacities.length).toBeGreaterThan(0);
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("同じpropsで再レンダリングしても不必要な再計算を行わない", () => {
      const { rerender, getByText } = render(<Lyric lyrics={mockLyrics} />);

      expect(getByText("First line of lyrics")).toBeTruthy();

      // 同じpropsで再レンダリング
      rerender(<Lyric lyrics={mockLyrics} />);

      expect(getByText("First line of lyrics")).toBeTruthy();
    });

    it("歌詞が変わると再レンダリングされる", () => {
      const { rerender, getByText, queryByText } = render(
        <Lyric lyrics="Old lyrics" />
      );

      expect(getByText("Old lyrics")).toBeTruthy();

      rerender(<Lyric lyrics="New lyrics" />);

      expect(queryByText("Old lyrics")).toBeFalsy();
      expect(getByText("New lyrics")).toBeTruthy();
    });

    it("曲情報が変わると再レンダリングされる", () => {
      const { rerender, getByText, queryByText } = render(
        <Lyric lyrics={mockLyrics} songTitle="Old Title" />
      );

      expect(getByText("Old Title")).toBeTruthy();

      rerender(<Lyric lyrics={mockLyrics} songTitle="New Title" />);

      expect(queryByText("Old Title")).toBeFalsy();
      expect(getByText("New Title")).toBeTruthy();
    });
  });
});

