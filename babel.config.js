module.exports = function (api) {
  api.cache(true);

  // 本番環境でconsole.log, console.warn, console.infoを削除
  // console.errorは残してエラー追跡を可能にする
  const removeConsolePlugin =
    process.env.NODE_ENV === "production"
      ? [
          "transform-remove-console",
          {
            exclude: ["error"], // console.errorのみ残す
          },
        ]
      : null;

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["inline-import", { extensions: [".sql"] }],
      // 本番でconsole削除（nullの場合はスキップ）
      ...(removeConsolePlugin ? [removeConsolePlugin] : []),
    ],
  };
};
