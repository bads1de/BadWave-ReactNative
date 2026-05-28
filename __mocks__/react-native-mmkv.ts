// react-native-mmkv のモック
export class MMKV {
  set = jest.fn();
  getString = jest.fn();
  getBoolean = jest.fn();
  getNumber = jest.fn();
  contains = jest.fn();
  delete = jest.fn();
  getAllKeys = jest.fn();
  clearAll = jest.fn();
}

export default {
  MMKV,
};
