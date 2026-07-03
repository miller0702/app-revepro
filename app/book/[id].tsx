import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../../src/api/library';
import { useTheme } from '../../src/hooks/useTheme';
import { saveBookOffline, queueDownload } from '../../src/db/database';
import { Button } from '../../src/components/ui/Button';
import { FavoriteToggle } from '../../src/components/ui/FavoriteToggle';
import { ShareToFeedButton } from '../../src/components/community/ShareToFeedButton';
import { ScreenDetailLoading } from '../../src/components/ui/ScreenDetailLoading';
import {
  ParallaxCoverLayout,
  parallaxHeroStyles,
} from '../../src/components/layout/ParallaxCoverLayout';
import { typography, spacing, radius } from '../../src/theme/tokens';
import { SCREEN_PADDING_X } from '../../src/theme/layout';
import { usePlayerStore } from '../../src/stores/playerStore';
import { resolveApiMediaUrl } from '../../src/utils/mediaUrl';
import { upsertReadingProgress } from '../../src/db/readingProgress';
import { markAllChaptersCompleted } from '../../src/db/chapterCompletion';
import { ReadingStatusBadge } from '../../src/components/reading/ReadingStatusBadge';
import { useReadingStatuses } from '../../src/hooks/useReadingStatuses';
import { syncWithServer } from '../../src/offline/syncService';
import { recordRecentAudiobook } from '../../src/storage/recentContent';

const HERO_COLORS = ['#2d2416', '#1a2e1a', '#2a1a30', '#1a2830', '#30241a'];

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { play, track, isPlaying, toggle } = usePlayerStore();

  const { data, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const res = await libraryApi.getBook(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { statuses } = useReadingStatuses(id ? [id] : []);
  const readingStatus = id ? statuses[id] : undefined;

  useEffect(() => {
    if (!data?.isAudiobook) return;
    void recordRecentAudiobook({
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      coverUrl: data.coverUrl,
      author: data.author,
      isAudiobook: true,
    });
  }, [data?.id, data?.isAudiobook]);

  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (!id || !data) return;
      const chapterIds = (data.chapters ?? []).map((c: { id: string }) => c.id);
      await markAllChaptersCompleted(id, chapterIds);
      await upsertReadingProgress(id, null, 100);
      try {
        await syncWithServer();
      } catch {
        // Guardado local aunque falle la sincronización.
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-activity'] });
      queryClient.invalidateQueries({ queryKey: ['reading-statuses'] });
      Alert.alert('Listo', 'Libro marcado como leído.');
    },
    onError: () => Alert.alert('Error', 'No se pudo marcar como leído.'),
  });

  const handleDownload = async () => {
    if (!data) return;
    try {
      await saveBookOffline({
        id: data.id,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        authorName: data.author?.name,
        coverUrl: data.coverUrl,
      });
      await queueDownload(data.id);
      Alert.alert('Listo', 'Libro guardado para lectura offline.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar offline');
    }
  };

  if (isLoading || !data) {
    return <ScreenDetailLoading />;
  }

  const heroColor = HERO_COLORS[(data.title.length ?? 0) % HERO_COLORS.length];
  const isAudiobookActive = track?.kind === 'audiobook' && track.id === data.id;
  const canPlayAudio = Boolean(data.isAudiobook && data.audioUrl);

  const handlePlayAudiobook = async () => {
    if (isAudiobookActive) {
      await toggle();
      return;
    }
    const url = resolveApiMediaUrl(data.audioUrl);
    if (!url) {
      Alert.alert('Sin audio', 'No hay archivo de audio disponible para este libro.');
      return;
    }
    try {
      await play({
        id: data.id,
        title: data.title,
        subtitle: data.author?.name ?? 'Audiolibro',
        url,
        kind: 'audiobook',
      });
    } catch {
      Alert.alert('Error', 'No se pudo reproducir el audiolibro.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ParallaxCoverLayout
        coverUrl={data.coverUrl}
        fallbackColor={heroColor}
        fallbackIcon="library"
        fallbackLetter={data.coverUrl ? undefined : data.title.charAt(0).toUpperCase()}
        sheetOverlap={32}
        heroOverlay={
          <>
            <Text style={parallaxHeroStyles.title} numberOfLines={3}>
              {data.title}
            </Text>
            {data.author?.name ? (
              <Text style={parallaxHeroStyles.subtitle}>{data.author.name}</Text>
            ) : null}
          </>
        }
      >
        <View style={[styles.body, { backgroundColor: colors.background }]}>
          {data.summary ? (
            <Text style={[styles.summary, { color: colors.textSecondary }]}>{data.summary}</Text>
          ) : null}

          {readingStatus && readingStatus.status !== 'unread' ? (
            <View style={styles.statusRow}>
              <ReadingStatusBadge
                status={readingStatus.status}
                label={readingStatus.label}
                percentage={readingStatus.percentage}
              />
            </View>
          ) : null}

          <View style={styles.favRow}>
            <FavoriteToggle targetType="BOOK" targetId={data.id} size={28} />
            <Text style={[styles.favLabel, { color: colors.textSecondary }]}>Guardar en favoritos</Text>
          </View>

          <View style={styles.actions}>
            <Button title="Comenzar lectura" onPress={() => router.push(`/reader/${data.id}`)} />
            {readingStatus?.status !== 'read' ? (
              <Button
                title="Marcar como leído"
                onPress={() => markReadMutation.mutate()}
                variant="secondary"
                loading={markReadMutation.isPending}
              />
            ) : null}
            {canPlayAudio ? (
              <Button
                title={isAudiobookActive && isPlaying ? 'Pausar audiolibro' : 'Escuchar audiolibro'}
                onPress={handlePlayAudiobook}
                variant="secondary"
              />
            ) : null}
            <Button title="Descargar offline" onPress={handleDownload} variant="outline" />
            <ShareToFeedButton
              draft={{
                kind: 'RECOMMENDATION',
                body: `Recomiendo «${data.title}»`,
                bookId: data.id,
                attachmentPreview: {
                  type: 'BOOK',
                  id: data.id,
                  title: data.title,
                  subtitle: data.author?.name,
                  imageUrl: data.coverUrl,
                },
              }}
            />
          </View>

          <Text style={[styles.section, { color: colors.text }]}>Capítulos</Text>
          {(data.chapters ?? []).map((ch: { id: string; title: string; order: number }) => (
            <Pressable
              key={ch.id}
              style={[styles.chapter, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/reader/${data.id}?chapterId=${ch.id}`)}
            >
              <View style={[styles.chapterNum, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>{ch.order}</Text>
              </View>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>{ch.title}</Text>
              <Text style={{ color: colors.textSecondary }}>›</Text>
            </Pressable>
          ))}
        </View>
      </ParallaxCoverLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  summary: { fontSize: 15, lineHeight: 24, marginBottom: spacing.lg },
  statusRow: { marginBottom: spacing.md },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  favLabel: { fontSize: 14, fontWeight: '600' },
  actions: { gap: 10, marginBottom: spacing.xl },
  section: { ...typography.title, marginBottom: spacing.md },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  chapterNum: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterTitle: { flex: 1, fontSize: 15, fontWeight: '500' },
});
