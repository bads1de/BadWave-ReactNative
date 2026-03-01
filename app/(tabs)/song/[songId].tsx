import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useGetLocalSongById } from "@/hooks/data/useGetLocalSongById";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { useAudioPlayer } from "@/hooks/audio/useAudioPlayer";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ChevronLeft,
  Play,
  Pause,
  Layers,
  Plus,
  Info,
  ArrowDown,
} from "lucide-react-native";
import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import { COLORS, FONTS } from "@/constants/theme";
import LikeButton from "@/components/LikeButton";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import Lyric from "@/components/player/lyric";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const HERO_IMAGE_HEIGHT = height * 0.6;

export default function SongDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);
  const scrollY = useSharedValue(0);
  const scrollRef = React.useRef<Animated.ScrollView>(null);

  const { data: song, isLoading, error } = useGetLocalSongById(songId);
  const { isPlaying, currentSong, togglePlayPause } = useAudioPlayer(
    song ? [song] : [],
  );

  useFocusEffect(
    useCallback(() => {
      setShowHeader(false);
      return () => setShowHeader(true);
    }, [setShowHeader]),
  );

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP,
    );
    return {
      transform: [{ scale }],
    };
  });

  const handlePlay = () => {
    if (song) togglePlayPause(song);
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!song) return <Text style={styles.emptyText}>Song not found</Text>;

  const isCurrentPlaying = isPlaying && currentSong?.id === song.id;

  return (
    <View style={styles.container}>
      {/* Immersive Background Header */}
      <Animated.View style={[styles.heroContainer, headerImageStyle]}>
        <Image
          source={{ uri: song.image_path! }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={[
            "rgba(10,10,10,0.1)",
            "rgba(10,10,10,0.4)",
            COLORS.background,
          ]}
          locations={[0, 0.4, 0.9]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Minimalist Top Nav */}
        <View style={styles.topNav}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BlurView intensity={20} tint="dark" style={styles.backBlur}>
              <ChevronLeft color={COLORS.text} size={24} strokeWidth={1.5} />
            </BlurView>
          </TouchableOpacity>
        </View>
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
        >
          {/* Hero Reveal Spacer */}
          <View style={{ height: HERO_IMAGE_HEIGHT * 0.75 }} />

          {/* Boutique Identity Section */}
          <View style={styles.mainContent}>
            <Animated.View
              entering={FadeInDown.duration(800)}
              style={styles.titleSection}
            >
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.authorName}>{song.author}</Text>
            </Animated.View>

            {/* Curated Action Bar */}
            <View style={styles.boutiqueActions}>
              <TouchableOpacity
                onPress={handlePlay}
                style={styles.boutiquePlay}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.primary, "#8B7232"]}
                  style={styles.playInner}
                >
                  {isCurrentPlaying ? (
                    <Pause
                      color={COLORS.background}
                      fill={COLORS.background}
                      size={32}
                    />
                  ) : (
                    <Play
                      color={COLORS.background}
                      fill={COLORS.background}
                      size={32}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.boutiqueUtilities}>
                <LikeButton songId={song.id} />
                <View style={{ width: 12 }} />
                <AddPlaylist songId={song.id}>
                  <View style={styles.utilityIcon}>
                    <Plus color={COLORS.text} size={24} strokeWidth={1} />
                  </View>
                </AddPlaylist>
              </View>
            </View>

            {/* Details Section with Premium Labels */}
            <View style={styles.detailSection}>
              <View style={styles.sectionDivider} />

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>GENRE</Text>
                  <Text style={styles.metaValue}>
                    {song.genre || "Universal"}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>STREAMS</Text>
                  <Text style={styles.metaValue}>{song.count || "0"}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>YEAR</Text>
                  <Text style={styles.metaValue}>
                    {new Date(song.created_at).getFullYear()}
                  </Text>
                </View>
              </View>

              <View style={[styles.sectionDivider, { marginTop: 32 }]} />
            </View>

            {/* Lyric Experience */}
            <Animated.View
              entering={FadeIn.delay(400)}
              style={styles.lyricExperience}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.indexBox}>
                  <Text style={styles.indexText}>01</Text>
                </View>
                <Text style={styles.sectionTitle}>Lyric Discovery</Text>
              </View>

              <View style={styles.lyricWrapper}>
                {song.lyrics ? (
                  <Lyric
                    lyrics={song.lyrics}
                    songTitle={song.title}
                    artistName={song.author}
                    initialVisibleLines={20}
                  />
                ) : (
                  <View style={styles.emptyLyricsBox}>
                    <Info color={COLORS.subText} size={24} strokeWidth={1} />
                    <Text style={styles.emptyLyricsText}>
                      No lyrics available for this edition.
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Final Curation Info */}
            <View style={styles.curationFooter}>
              <View style={styles.footerDivider} />
              <View style={styles.footerContent}>
                <Layers
                  color={COLORS.primary}
                  size={32}
                  strokeWidth={0.5}
                  style={{ opacity: 0.5 }}
                />
                <Text style={styles.brandSignature}>BADWAVE PREMIUM</Text>
                <Text style={styles.editionText}>
                  Refined Audio Series No. {song.id.slice(0, 6).toUpperCase()}
                </Text>
                <View style={styles.footerSpacing} />
                <TouchableOpacity
                  style={styles.scrollUpBtn}
                  onPress={() => {
                    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
                  }}
                >
                  <ArrowDown
                    color={COLORS.subText}
                    size={20}
                    style={{ transform: [{ rotate: "180deg" }] }}
                  />
                  <Text style={styles.scrollUpText}>TO TOP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  heroContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: HERO_IMAGE_HEIGHT,
  },
  topNav: {
    paddingHorizontal: 20,
    height: 60,
    justifyContent: "center",
    zIndex: 100,
  },
  backBlur: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 48,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    paddingHorizontal: 30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingTop: 50,
  },
  titleSection: {
    marginBottom: 40,
  },
  songTitle: {
    color: COLORS.text,
    fontSize: 48,
    fontFamily: FONTS.title,
    lineHeight: 56,
  },
  authorName: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: FONTS.semibold,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  boutiqueActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 60,
  },
  boutiquePlay: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 6,
  },
  playInner: {
    flex: 1,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  boutiqueUtilities: {
    flexDirection: "row",
    alignItems: "center",
  },
  utilityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  detailSection: {
    marginBottom: 60,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    width: "40%",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: COLORS.subText,
    fontSize: 10,
    fontFamily: FONTS.semibold,
    letterSpacing: 2,
  },
  metaValue: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginTop: 6,
  },
  lyricExperience: {
    marginBottom: 80,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    gap: 16,
  },
  indexBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
  },
  indexText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  lyricWrapper: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptyLyricsBox: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyLyricsText: {
    color: COLORS.subText,
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.6,
  },
  curationFooter: {
    alignItems: "center",
    marginTop: 40,
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 60,
  },
  footerContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  brandSignature: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginTop: 20,
    letterSpacing: 6,
    opacity: 0.8,
  },
  editionText: {
    color: COLORS.subText,
    fontSize: 10,
    fontFamily: FONTS.semibold,
    marginTop: 8,
    letterSpacing: 1,
    opacity: 0.5,
  },
  footerSpacing: {
    height: 24,
  },
  scrollUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  scrollUpText: {
    color: COLORS.subText,
    fontSize: 11,
    fontFamily: FONTS.semibold,
    letterSpacing: 2,
    opacity: 0.6,
  },
  emptyText: {
    color: "white",
    textAlign: "center",
    marginTop: 100,
    fontFamily: FONTS.body,
  },
});
