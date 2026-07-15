import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../../src/api/library';
import { studyApi } from '../../src/api/study';
import { ReaderControls } from '../../src/components/ReaderControls';
import { ReaderWebView, type ReaderWebViewHandle } from '../../src/components/reader/ReaderWebView';
import { ReaderScreenHeader } from '../../src/components/reader/ReaderScreenHeader';
import { ReaderChaptersPanel } from '../../src/components/reader/ReaderChaptersPanel';
import { CreatePostSheet, type PostDraft } from '../../src/components/community/CreatePostSheet';
import { useTheme } from '../../src/hooks/useTheme';
import {
  markChapterCompleted,
  syncBookProgressFromChapters,
} from '../../src/db/chapterCompletion';
import { getLocalBookDetail } from '../../src/db/localBooks';
import {
  cacheRemoteHighlights,
  getLocalHighlights,
  saveLocalHighlight,
  markHighlightSynced,
} from '../../src/db/highlights';
import { useSystemStore } from '../../src/stores/systemStore';
import { useReadingSessionTracker } from '../../src/hooks/useDailyReadingTime';
import { ReaderScreenSkeleton } from '../../src/components/skeletons/ContentSkeletons';
import { palette } from '../../src/theme/colors';

export default function ReaderScreen() {
  const { id, chapterId: chapterIdParam } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const queryClient = useQueryClient();
  const webViewRef = useRef<ReaderWebViewHandle>(null);
  const readerBackground = isDark ? palette.reader.dark : palette.reader.light;
  const isOffline = useSystemStore((s) => s.isOffline);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectionText, setSelectionText] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [postDraft, setPostDraft] = useState<PostDraft | null>(null);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [localHighlights, setLocalHighlights] = useState<string[]>([]);

  useReadingSessionTracker();

  const { data, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      try {
        if (!isOffline) {
          const res = await libraryApi.getBook(id!);
          return res.data.data;
        }
      } catch {
        /* fallback local */
      }
      const local = await getLocalBookDetail(id!);
      if (!local) throw new Error('Capítulos no disponibles offline');
      return local;
    },
    enabled: !!id,
    retry: isOffline ? false : 1,
  });

  const chapters = data?.chapters ?? [];
  const activeChapterId = chapterIdParam ?? chapters[0]?.id;
  const chapter = chapters.find((c: { id: string }) => c.id === activeChapterId) ?? chapters[0];

  const refreshReadingProgress = useCallback(async () => {
    if (!data?.id || !chapter || chapters.length === 0) return;
    await syncBookProgressFromChapters(data.id, chapter.id, chapters.length);
    queryClient.invalidateQueries({ queryKey: ['reading-activity'] });
    queryClient.invalidateQueries({ queryKey: ['reading-now-books'] });
    queryClient.invalidateQueries({ queryKey: ['reading-statuses'] });
  }, [chapter?.id, chapters.length, data?.id, queryClient]);

  useEffect(() => {
    void refreshReadingProgress();
  }, [refreshReadingProgress]);

  const handleChapterCompleted = useCallback(async () => {
    if (!data?.id || !chapter?.id) return;
    await markChapterCompleted(data.id, chapter.id);
    await refreshReadingProgress();
  }, [chapter?.id, data?.id, refreshReadingProgress]);

  useEffect(() => {
    setLocalHighlights([]);
    setSelectionText(null);
  }, [activeChapterId]);

  const { data: savedHighlights = [] } = useQuery({
    queryKey: ['highlights', id],
    queryFn: async () => {
      try {
        if (!isOffline) {
          const remote = (await studyApi.getHighlights(id!)).data.data;
          await cacheRemoteHighlights(remote);
          return remote;
        }
      } catch {
        /* fallback local */
      }
      return getLocalHighlights(id!);
    },
    enabled: !!id,
    retry: false,
  });

  const chapterHighlights = useMemo(() => {
    const fromApi = savedHighlights
      .filter((h) => !h.chapterId || h.chapterId === chapter?.id)
      .map((h) => h.excerpt);
    return [...new Set([...fromApi, ...localHighlights])];
  }, [savedHighlights, chapter?.id, localHighlights]);

  const highlightMutation = useMutation({
    mutationFn: async (excerpt: string) => {
      const { localId } = await saveLocalHighlight({
        bookId: id!,
        chapterId: chapter?.id,
        excerpt,
        bookTitle: data?.title,
        authorName: data?.author?.name,
        chapterTitle: chapter?.title,
      });

      if (!isOffline) {
        try {
          const res = await studyApi.createHighlight({
            bookId: id!,
            chapterId: chapter?.id,
            excerpt,
          });
          await markHighlightSynced(localId, res.data.data.id);
        } catch {
          // Queda en cola local (synced=0) hasta reconectar.
        }
      }
      return excerpt;
    },
    onSuccess: (excerpt) => {
      webViewRef.current?.applyHighlightToSelection();
      setLocalHighlights((prev) => (prev.includes(excerpt) ? prev : [...prev, excerpt]));
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      queryClient.invalidateQueries({ queryKey: ['highlights', id] });
      queryClient.invalidateQueries({ queryKey: ['reading-activity'] });
      queryClient.invalidateQueries({ queryKey: ['reading-statuses'] });
      setSelectionText(null);
      Alert.alert(
        'Guardado',
        isOffline
          ? 'Subrayado guardado en el dispositivo. Se sincronizará al recuperar conexión.'
          : 'Cita subrayada en tu centro de estudios.',
      );
    },
    onError: () => Alert.alert('Error', 'No se pudo guardar el subrayado.'),
  });

  const goToChapter = (nextChapterId: string) => {
    setSelectionText(null);
    setLocalHighlights([]);
    router.replace(`/reader/${id}?chapterId=${nextChapterId}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: readerBackground }]}>
        <ReaderScreenSkeleton />
      </View>
    );
  }

  if (!chapter || !data) {
    return (
      <View style={[styles.centered, { backgroundColor: readerBackground }]}>
        <Text style={{ color: colors.textSecondary }}>No hay capítulos disponibles</Text>
      </View>
    );
  }

  const openPublish = () => {
    if (!selectionText) return;
    setPostDraft({
      kind: 'QUOTE',
      body: selectionText,
      quoteExcerpt: selectionText,
      bookId: id,
      chapterId: chapter.id,
      attachmentPreview: {
        type: 'BOOK',
        id: data.id,
        title: data.title,
        imageUrl: data.coverUrl,
      },
    });
    setPublishOpen(true);
    setSelectionText(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: readerBackground }]}>
      <ReaderScreenHeader
        bookTitle={data.title}
        chapterTitle={chapter.title}
        onOpenChapters={() => setChaptersOpen(true)}
      />

      <View style={styles.readerBody}>
        <ReaderWebView
          ref={webViewRef}
          title={chapter.title}
          htmlContent={chapter.content ?? ''}
          highlightMode={highlightMode}
          highlights={chapterHighlights}
          onTextSelected={setSelectionText}
          onChapterCompleted={() => {
            void handleChapterCompleted();
          }}
        />
      </View>

      <ReaderControls
        highlightMode={highlightMode}
        onToggleHighlightMode={() => {
          setHighlightMode((v) => !v);
          setSelectionText(null);
        }}
        selectionText={selectionText}
        onSaveHighlight={() => selectionText && highlightMutation.mutate(selectionText)}
        onPublishQuote={isOffline ? undefined : openPublish}
        onClearSelection={() => setSelectionText(null)}
      />

      <ReaderChaptersPanel
        visible={chaptersOpen}
        bookTitle={data.title}
        chapters={chapters}
        activeChapterId={chapter.id}
        onClose={() => setChaptersOpen(false)}
        onSelectChapter={goToChapter}
      />

      <CreatePostSheet
        visible={publishOpen}
        onClose={() => {
          setPublishOpen(false);
          setPostDraft(null);
        }}
        initialDraft={postDraft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  readerBody: { flex: 1, minHeight: 0 },
  centered: { flex: 1 },
});
