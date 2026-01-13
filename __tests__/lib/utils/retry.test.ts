import { withRetry } from "@/lib/utils/retry";

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
});

