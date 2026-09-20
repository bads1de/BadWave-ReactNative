import { withRetry, withSupabaseRetry } from "@/lib/utils/retry";

describe("withRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return result on first success", async () => {
    const mockFn = jest.fn().mockResolvedValue("success");

    const result = await withRetry(mockFn);

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network request failed"))
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValue("success");

    const result = await withRetry(mockFn, { maxRetries: 3, delay: 10 });

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should throw error after max retries", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValue(new Error("Network request failed"));

    await expect(
      withRetry(mockFn, { maxRetries: 3, delay: 10 })
    ).rejects.toThrow();

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should use exponential backoff when configured", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue("success");

    const startTime = Date.now();
    await withRetry(mockFn, {
      maxRetries: 2,
      delay: 100,
      backoff: "exponential",
    });
    const duration = Date.now() - startTime;

    expect(mockFn).toHaveBeenCalledTimes(2);
    // Exponential backoff: 100ms * 2^0 = 100ms
    expect(duration).toBeGreaterThanOrEqual(90);
  });

  it("should use linear backoff when configured", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue("success");

    const startTime = Date.now();
    await withRetry(mockFn, {
      maxRetries: 2,
      delay: 100,
      backoff: "linear",
    });
    const duration = Date.now() - startTime;

    expect(mockFn).toHaveBeenCalledTimes(2);
    // Linear backoff: 100ms
    expect(duration).toBeGreaterThanOrEqual(90);
  });

  it("should call onRetry callback on each retry", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error 1"))
      .mockRejectedValueOnce(new Error("Network error 2"))
      .mockResolvedValue("success");

    const onRetry = jest.fn();

    await withRetry(mockFn, { maxRetries: 3, delay: 10, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 3);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 3);
  });

  it("should not retry if shouldRetry returns false", async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error("fatal error"));

    const shouldRetry = jest.fn().mockReturnValue(false);

    await expect(
      withRetry(mockFn, { maxRetries: 3, delay: 10, shouldRetry })
    ).rejects.toThrow("fatal error");

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should handle network errors specifically", async () => {
    const networkError = new Error("Network request failed");
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue("success");

    const result = await withRetry(mockFn, { maxRetries: 2, delay: 10 });

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should retry plain timeouts by default", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("ETIMEDOUT"))
      .mockResolvedValue("success");

    await expect(
      withRetry(mockFn, { maxRetries: 2, delay: 10 })
    ).resolves.toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe("withSupabaseRetry", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("supabase が throw せず返した error を例外化して失敗として扱う", async () => {
    const mockFn = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Invalid input" } });

    await expect(withSupabaseRetry(mockFn)).rejects.toThrow("Invalid input");
  });

  it("リトライ対象外の error は再試行せず即座に失敗する", async () => {
    const mockFn = jest
      .fn()
      .mockResolvedValue({
        data: null,
        error: { message: "permission denied" },
      });

    await expect(withSupabaseRetry(mockFn)).rejects.toThrow(
      "permission denied"
    );
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("5xx は二重登録を避けるため再試行しない", async () => {
    const mockFn = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Internal Server Error" },
    });

    await expect(withSupabaseRetry(mockFn)).rejects.toThrow(
      "Internal Server Error"
    );
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("タイムアウトはリクエスト未達と言い切れないため再試行しない", async () => {
    const mockFn = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Request timeout" },
    });

    await expect(withSupabaseRetry(mockFn)).rejects.toThrow("Request timeout");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("通信エラー（{ error } 形式）はリトライして成功すればその結果を返す", async () => {
    jest.useFakeTimers();

    const mockFn = jest
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { message: "TypeError: fetch failed" },
      })
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null });

    const promise = withSupabaseRetry(mockFn);
    await jest.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toEqual({ data: [{ id: 1 }], error: null });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

