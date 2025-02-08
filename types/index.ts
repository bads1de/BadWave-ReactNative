import { ImageSourcePropType } from 'react-native';

//Todo: DBからURLを取得するので、型を変更する

export default interface Song {
    id: string;
    user_id: string;
    author: string;
    title: string;
    song_path: any; // requireで読み込むローカルファイルに対応
    image_path: ImageSourcePropType;
    video_path?: string;
    genre?: string;
    count?: string;
    like_count?: string;
    lyrics?: string;
    created_at: string;
  }