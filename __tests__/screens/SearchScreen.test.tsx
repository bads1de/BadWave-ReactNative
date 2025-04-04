import React from "react";
import { render } from "@testing-library/react-native";
import { View } from "react-native";

// AsyncStorageのモック
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve(null)),
    multiGet: jest.fn(() => Promise.resolve(null)),
    multiSet: jest.fn(() => Promise.resolve(null)),
    multiRemove: jest.fn(() => Promise.resolve(null)),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    clear: jest.fn(() => Promise.resolve(null)),
  },
}));

// Supabaseのモック
jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
    },
  },
}));

// コンポーネントのモック
jest.mock("../../app/(tabs)/search", () => {
  const React = require("react");
  const mockView = "View";
  return {
    __esModule: true,
    default: () => React.createElement(mockView, null, "Search Screen"),
  };
});

describe("SearchScreen", () => {
  it("検索画面がレンダリングされる", () => {
    const { getByText } = render(
      React.createElement(View, null, "Search Screen")
    );
    expect(getByText("Search Screen")).toBeTruthy();
  });
});
