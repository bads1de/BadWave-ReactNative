import { getTrendDateFilter } from "@/lib/utils/trendFilter";

describe("getTrendDateFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null for 'all' period", () => {
    const result = getTrendDateFilter("all");
    expect(result).toBeNull();
  });

  it("should return date approximately 1 month ago for 'month' period", () => {
    const result = getTrendDateFilter("month");
    expect(result).not.toBeNull();

    const date = new Date(result!);
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 1日前の範囲内であればOK（時間差を考慮）
    const diffMs = Math.abs(date.getTime() - oneMonthAgo.getTime());
    expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000); // 1日以内
  });

  it("should return date approximately 1 week ago for 'week' period", () => {
    const result = getTrendDateFilter("week");
    expect(result).not.toBeNull();

    const date = new Date(result!);
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const diffMs = Math.abs(date.getTime() - oneWeekAgo.getTime());
    expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000); // 1日以内
  });

  it("should return date approximately 1 day ago for 'day' period", () => {
    const result = getTrendDateFilter("day");
    expect(result).not.toBeNull();

    const date = new Date(result!);
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const diffMs = Math.abs(date.getTime() - oneDayAgo.getTime());
    expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000); // 1日以内
  });

  it("should return ISO string format", () => {
    const result = getTrendDateFilter("day");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
