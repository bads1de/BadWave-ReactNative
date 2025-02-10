interface Spotlight {
  id: number;
  video_path: any;
  title: string;
  author: string;
  genre?: string;
  description: string;
}

export const SpotlightData: Spotlight[] = [
  {
    id: 1,
    video_path: require("../assets/videos/Dystopia.mp4"),
    title: "Dystopia",
    author: "Sample Artist",
    genre: "SynthWave",
    description: "This is Test Data",
  },
  {
    id: 2,
    video_path: require("../assets/videos/Kobe_Night_Dream.mp4"),
    title: "Kobe Night Dream",
    author: "Sample Artist",
    genre: "RetroWave",
    description: "Sample Description",
  },
  {
    id: 3,
    video_path: require("../assets/videos/Ascend_into_Shadows.mp4"),
    title: "Ascend into Shadows",
    author: "Sample Artist",
    genre: "SynthWave, Progressive",
    description: "Sample Description",
  },
  {
    id: 4,
    video_path: require("../assets/videos/Dreamscape.mp4"),
    title: "Dreamscape",
    author: "Sample Artist",
    genre: "SynthWave",
    description: "Sample Description",
  },
];
