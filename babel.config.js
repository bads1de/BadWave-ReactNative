module.exports = function (api) {
  api.cache(true);

  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      ["inline-import", { extensions: [".sql"] }],
    ],
    env: {
      production: {
        // 本番ビルドでは console.log/info/debug を除去してブリッジ負荷を削減
        // (error/warn は本番診断用に残す)
        plugins: [["transform-remove-console", { exclude: ["error", "warn"] }]],
      },
    },
  };
};
