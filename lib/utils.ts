/**
 * 時間を分と秒で表示する
 * @param {number} millis - ミリ秒
 * @returns {string} 分と秒で表示された時間
 */
export const formatTime = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
