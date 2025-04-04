// react-native-fs のモック
export default {
  mkdir: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true),
  unlink: jest.fn().mockResolvedValue(undefined),
  downloadFile: jest.fn().mockResolvedValue({
    jobId: 1,
    statusCode: 200,
    bytesWritten: 1024,
  }),
  DocumentDirectoryPath: '/mock/document/directory',
  ExternalDirectoryPath: '/mock/external/directory',
  ExternalStorageDirectoryPath: '/mock/external/storage/directory',
  TemporaryDirectoryPath: '/mock/temporary/directory',
  LibraryDirectoryPath: '/mock/library/directory',
  PicturesDirectoryPath: '/mock/pictures/directory',
  CachesDirectoryPath: '/mock/caches/directory',
  MainBundlePath: '/mock/main/bundle/path',
};
