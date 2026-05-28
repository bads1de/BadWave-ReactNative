const path = require("path");

// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: "expo",
  ignorePatterns: ["/dist/*", "__tests__/**/*", "__mocks__/**/*"],
  env: {
    jest: true,
    node: true,
  },
  globals: {
    setTimeout: true,
    clearTimeout: true,
  },
  plugins: ["unused-imports"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off", // unused-importsと競合するため無効化
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    // TypeScriptが解決をチェックするため、ESLint側での重複チェックを無効にして高速化・安定化
    "import/no-unresolved": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/refs": "off", // FlashList の onViewableItemsChanged 等で ref.current を使用するため
    "react-hooks/immutability": "off", // react-native-reanimated の sharedValue.value は意図的に可変
    "react-hooks/set-state-in-effect": "off", // モーダルの開閉アニメーション等で setState を使用するため
    "react/display-name": "off", // テストなどで無名コンポーネントを使う場合にうるさいため
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: path.resolve(__dirname, "tsconfig.json"),
      },
    },
  },
};
