import { memo, useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { AuthenticatedImage } from './ui/AuthenticatedImage';
import { DirectVideoPlayer, YouTubePlayer, type YouTubePlayerHandle } from './VideoPlayer';
import type { VideoItem } from '../api/streaming';
import { resolveVideoThumbnailUrl } from '../utils/videoThumbnail';
import { formatDuration, formatViewCount } from '../utils/format';
import { SCREEN_PADDING_X } from '../theme/layout';
import { radius, spacing, typography } from '../theme/tokens';
import { recordRecentVideo } from '../storage/recentContent';

type Props = {
  video: VideoItem;
  playing: boolean;
  /** Autoplay del feed: mute hasta que el usuario toque. */
  muted?: boolean;
  onTogglePlay: (videoId: string) => void;
};

function VideoFeedItemInner({ video, playing, muted = true, onTogglePlay }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const youtubeRef = useRef<YouTubePlayerHandle>(null);
  const [measuredDurationSec, setMeasuredDurationSec] = useState<number | null>(null);

  const isYouTube = video.sourceType === 'YOUTUBE' && Boolean(video.youtubeVideoId);
  const thumbUrl = resolveVideoThumbnailUrl(video);
  const canPlayInline = isYouTube || Boolean(video.videoUrl);
  const durationSec =
    measuredDurationSec && measuredDurationSec > 0
      ? measuredDurationSec
      : video.durationSec && video.durationSec > 0
        ? video.durationSec
        : null;

  const handleDuration = useCallback((seconds: number) => {
    if (seconds > 0) setMeasuredDurationSec(seconds);
  }, []);

  const enableSound = useCallback(() => {
    // En iOS el unmute de YouTube debe ir en el mismo gesto del toque.
    youtubeRef.current?.unmute();
    void recordRecentVideo(video);
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    }).catch(() => undefined);
    onTogglePlay(video.id);
  }, [onTogglePlay, video]);

  const openDetail = useCallback(() => {
    void recordRecentVideo(video);
    router.push(`/video/${video.id}`);
  }, [router, video]);

  return (
    <View style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.media} pointerEvents="box-none">
        {playing && canPlayInline ? (
          <>
            <View style={styles.playerLayer} pointerEvents="auto">
              {isYouTube && video.youtubeVideoId ? (
                <YouTubePlayer
                  ref={youtubeRef}
                  videoId={video.youtubeVideoId}
                  autoPlay
                  muted={muted}
                />
              ) : video.videoUrl ? (
                <DirectVideoPlayer
                  url={video.videoUrl}
                  autoPlay
                  muted={muted}
                  nativeControls={!muted}
                  contentFit="contain"
                  onDurationSec={handleDuration}
                />
              ) : null}
            </View>
            {muted ? (
              <Pressable
                onPress={enableSound}
                style={styles.unmuteBadge}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`Activar sonido de ${video.title}`}
              >
                <AppIcon name="volume-mute" size={18} color="#fff" />
              </Pressable>
            ) : null}
          </>
        ) : (
          <Pressable
            onPress={canPlayInline ? enableSound : openDetail}
            style={styles.posterHit}
            accessibilityRole="button"
            accessibilityLabel={`Reproducir ${video.title}`}
          >
            <View style={styles.posterLayer} pointerEvents="none">
              {thumbUrl ? (
                thumbUrl.includes('img.youtube.com') ? (
                  <Image source={{ uri: thumbUrl }} style={styles.posterImage} resizeMode="cover" />
                ) : (
                  <AuthenticatedImage url={thumbUrl} style={styles.posterImage} resizeMode="cover" />
                )
              ) : video.videoUrl ? (
                <DirectVideoPlayer
                  url={video.videoUrl}
                  preview
                  contentFit="cover"
                  autoPlay={false}
                  onDurationSec={handleDuration}
                />
              ) : (
                <View style={[styles.posterFallback, { backgroundColor: colors.cardGradient[0] }]} />
              )}
            </View>
            <View style={styles.playBadge} pointerEvents="none">
              <AppIcon name="play" size={26} color={colors.onPrimary} />
            </View>
            {durationSec != null ? (
              <View style={styles.durationBadge} pointerEvents="none">
                <Text style={styles.durationText}>{formatDuration(durationSec)}</Text>
              </View>
            ) : null}
            {/* Si hay miniatura, mide duración en segundo plano (el preview ya la mide si no hay thumb). */}
            {video.videoUrl && !isYouTube && Boolean(thumbUrl) && !measuredDurationSec ? (
              <View style={styles.durationProbe} pointerEvents="none">
                <DirectVideoPlayer
                  url={video.videoUrl}
                  preview
                  contentFit="cover"
                  autoPlay={false}
                  onDurationSec={handleDuration}
                />
              </View>
            ) : null}
          </Pressable>
        )}
      </View>

      <Pressable onPress={openDetail} style={styles.metaBlock} accessibilityRole="button">
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatViewCount(video.viewCount)} vistas
          {video.category?.name ? ` · ${video.category.name}` : ''}
        </Text>
        {video.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {video.description}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

function areEqual(prev: Props, next: Props) {
  return (
    prev.playing === next.playing &&
    prev.muted === next.muted &&
    prev.video.id === next.video.id &&
    prev.video.title === next.video.title &&
    prev.video.thumbnailUrl === next.video.thumbnailUrl &&
    prev.video.videoUrl === next.video.videoUrl &&
    prev.video.viewCount === next.video.viewCount &&
    prev.video.durationSec === next.video.durationSec &&
    prev.video.youtubeVideoId === next.video.youtubeVideoId
  );
}

export const VideoFeedItem = memo(VideoFeedItemInner, areEqual);

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.md,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  playerLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  posterHit: {
    ...StyleSheet.absoluteFillObject,
  },
  unmuteBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    zIndex: 20,
    elevation: 20,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  posterImage: {
    ...StyleSheet.absoluteFillObject,
  },
  posterFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 56,
    height: 56,
    marginTop: -28,
    marginLeft: -28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(201, 162, 39, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    zIndex: 3,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  durationProbe: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  metaBlock: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  title: { ...typography.body, fontWeight: '700', marginBottom: 4, textAlign: 'left', width: '100%' },
  meta: { ...typography.caption, marginBottom: 4, textAlign: 'left', width: '100%' },
  description: { fontSize: 13, lineHeight: 18, textAlign: 'left', width: '100%' },
});
