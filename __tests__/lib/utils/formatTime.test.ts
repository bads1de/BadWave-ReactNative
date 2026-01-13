import { formatTime } from "@/lib/utils/formatTime";

describe("utils", () => {
  describe("formatTime", () => {
    it("formats 0 milliseconds correctly", () => {
      expect(formatTime(0)).toBe("0:00");
    });

    it("formats seconds correctly", () => {
      expect(formatTime(5000)).toBe("0:05");
      expect(formatTime(30000)).toBe("0:30");
      expect(formatTime(59000)).toBe("0:59");
    });

    it("formats minutes correctly", () => {
      expect(formatTime(60000)).toBe("1:00");
      expect(formatTime(120000)).toBe("2:00");
      expect(formatTime(600000)).toBe("10:00");
    });

    it("formats minutes and seconds correctly", () => {
      expect(formatTime(65000)).toBe("1:05");
      expect(formatTime(90000)).toBe("1:30");
      expect(formatTime(125000)).toBe("2:05");
      expect(formatTime(185000)).toBe("3:05");
    });

    it("pads seconds with zero when less than 10", () => {
      expect(formatTime(1000)).toBe("0:01");
      expect(formatTime(61000)).toBe("1:01");
      expect(formatTime(121000)).toBe("2:01");
    });

    it("handles large values correctly", () => {
      expect(formatTime(3600000)).toBe("60:00"); // 1 hour
      expect(formatTime(3661000)).toBe("61:01"); // 1 hour 1 minute 1 second
    });
  });
});

