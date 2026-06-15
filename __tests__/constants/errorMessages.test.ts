import {
  AUTH_ERRORS,
  LIKE_ERRORS,
  PLAYLIST_ERRORS,
  NETWORK_ERRORS,
  ERROR_MESSAGES,
} from "@/constants/errorMessages";

describe("errorMessages", () => {
  describe("AUTH_ERRORS", () => {
    it("USER_ID_REQUIREDが定義されている", () => {
      expect(AUTH_ERRORS.USER_ID_REQUIRED).toBe("ユーザーIDが必要です");
    });

    it("ADMIN_REQUIREDが定義されている", () => {
      expect(AUTH_ERRORS.ADMIN_REQUIRED).toBe("管理者権限が必要です");
    });
  });

  describe("LIKE_ERRORS", () => {
    it("OFFLINEが定義されている", () => {
      expect(LIKE_ERRORS.OFFLINE).toBe("オフライン時はいいねの操作ができません");
    });

    it("SUPABASE_DELETE_FAILEDが定義されている", () => {
      expect(LIKE_ERRORS.SUPABASE_DELETE_FAILED).toBe("いいねの解除に失敗しました");
    });

    it("SUPABASE_INSERT_FAILEDが定義されている", () => {
      expect(LIKE_ERRORS.SUPABASE_INSERT_FAILED).toBe("いいねの追加に失敗しました");
    });
  });

  describe("PLAYLIST_ERRORS", () => {
    it("OFFLINEが定義されている", () => {
      expect(PLAYLIST_ERRORS.OFFLINE).toBe("オフライン時はプレイリストの作成ができません");
    });

    it("EDIT_OFFLINEが定義されている", () => {
      expect(PLAYLIST_ERRORS.EDIT_OFFLINE).toBe("オフライン時はプレイリストの編集操作ができません");
    });

    it("SUPABASE_DELETE_FAILEDが定義されている", () => {
      expect(PLAYLIST_ERRORS.SUPABASE_DELETE_FAILED).toBe("プレイリストからの削除に失敗しました");
    });
  });

  describe("NETWORK_ERRORS", () => {
    it("RETRY_EXHAUSTEDが定義されている", () => {
      expect(NETWORK_ERRORS.RETRY_EXHAUSTED).toBe("リトライ回数を超過しました");
    });

    it("OFFLINEが定義されている", () => {
      expect(NETWORK_ERRORS.OFFLINE).toBe("オフラインです");
    });

    it("TIMEOUTが定義されている", () => {
      expect(NETWORK_ERRORS.TIMEOUT).toBe("タイムアウトしました");
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("ADMIN_REQUIREDが定義されている", () => {
      expect(ERROR_MESSAGES.ADMIN_REQUIRED).toBe("管理者権限が必要です");
    });

    it("USER_ID_REQUIREDが定義されている", () => {
      expect(ERROR_MESSAGES.USER_ID_REQUIRED).toBe("ユーザーIDが必要です");
    });

    it("TITLE_REQUIREDが定義されている", () => {
      expect(ERROR_MESSAGES.TITLE_REQUIRED).toBe("プレイリスト名を入力してください");
    });

    it("EDIT_FAILEDが定義されている", () => {
      expect(ERROR_MESSAGES.EDIT_FAILED).toBe("編集に失敗しました");
    });

    it("DELETE_FAILEDが定義されている", () => {
      expect(ERROR_MESSAGES.DELETE_FAILED).toBe("削除に失敗しました");
    });

    it("POST_FAILEDが定義されている", () => {
      expect(ERROR_MESSAGES.POST_FAILED).toBe("投稿に失敗しました");
    });

    it("GENERIC_ERRORが定義されている", () => {
      expect(ERROR_MESSAGES.GENERIC_ERROR).toBe("エラーが発生しました");
    });

    it("GENERIC_ERROR_RETRYが定義されている", () => {
      expect(ERROR_MESSAGES.GENERIC_ERROR_RETRY).toBe("エラーが発生しました。もう一度お試しください。");
    });

    it("SONG_NOT_FOUNDが定義されている", () => {
      expect(ERROR_MESSAGES.SONG_NOT_FOUND).toBe("曲が見つかりません");
    });

    it("FETCH_FAILEDが定義されている", () => {
      expect(ERROR_MESSAGES.FETCH_FAILED).toBe("データの取得に失敗しました");
    });
  });
});
