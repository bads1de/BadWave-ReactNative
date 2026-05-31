import { getTrendDateFilter } from "@/lib/utils/trendFilter";
import { subMonths, subWeeks, subDays } from "date-fns";

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
    const expected = subMonths(new Date(), 1);

    const diffMs = Math.abs(date.getTime() - expected.getTime());
    expect(diffMs).toBeLessThan(1000); // 1秒以内
  });

  it("should return date approximately 1 week ago for 'week' period", () => {
    const result = getTrendDateFilter("week");
    expect(result).not.toBeNull();

    const date = new Date(result!);
    const expected = subWeeks(new Date(), 1);

    const diffMs = Math.abs(date.getTime() - expected.getTime());
    expect(diffMs).toBeLessThan(1000); // 1秒以内
  });

  it("should return date approximately 1 day ago for 'day' period", () => {
    const result = getTrendDateFilter("day");
    expect(result).not.toBeNull();

    const date = new Date(result!);
    const expected = subDays(new Date(), 1);

    const diffMs = Math.abs(date.getTime() - expected.getTime());
    expect(diffMs).toBeLessThan(1000); // 1秒以内
  });

  it("should return ISO string format", () => {
    const result = getTrendDateFilter("day");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
