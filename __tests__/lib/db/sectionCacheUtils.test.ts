import { upsertSectionCache } from "@/lib/db/sectionCacheUtils";

jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  sectionCache: { key: "section_cache" },
}));

describe("upsertSectionCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call insert with correct values", async () => {
    const { db } = require("@/lib/db/client");
    const { sectionCache } = require("@/lib/db/schema");

    await upsertSectionCache("home_trends", ["song1", "song2", "song3"]);

    expect(db.insert).toHaveBeenCalledWith(sectionCache);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "home_trends",
        itemIds: ["song1", "song2", "song3"],
      })
    );
  });

  it("should call onConflictDoUpdate with correct target and set", async () => {
    const { db } = require("@/lib/db/client");

    await upsertSectionCache("home_trends", ["song1", "song2"]);

    expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.anything(),
        set: expect.objectContaining({
          itemIds: ["song1", "song2"],
        }),
      })
    );
  });

  it("should handle empty itemIds array", async () => {
    const { db } = require("@/lib/db/client");

    await upsertSectionCache("home_for_you", []);

    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "home_for_you",
        itemIds: [],
      })
    );
  });

  it("should set updatedAt to current date", async () => {
    const { db } = require("@/lib/db/client");
    const before = new Date();

    await upsertSectionCache("home_trends", ["song1"]);

    const valuesCall = db.values.mock.calls[0][0];
    const after = new Date();

    expect(valuesCall.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(valuesCall.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
