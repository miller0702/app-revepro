import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { studyApi } from '../../src/api/study';
import { CompactCardSkeleton } from '../../src/components/skeletons/ContentSkeletons';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { Button } from '../../src/components/ui/Button';
import { AppIcon } from '../../src/components/ui/AppIcon';
import { StudyCenterDashboard } from '../../src/components/study/StudyCenterDashboard';
import { StudyTabBar, type StudyTab } from '../../src/components/study/StudyTabBar';
import { StudyEmptyState, StudySectionHeader } from '../../src/components/study/StudyEmptyState';
import {
  StudyFolderCard,
  StudyNoteCard,
  StudyHighlightCard,
  StudyReadingCard,
} from '../../src/components/study/StudyCards';
import { useTheme } from '../../src/hooks/useTheme';
import { getStudyProgress } from '../../src/db/offlineBooks';
import { syncWithServer } from '../../src/offline/syncService';
import { useStudySessionTracker, useActivityGoals } from '../../src/hooks/useActivityGoals';
import { spacing, radius, typography } from '../../src/theme/tokens';

export default function StudyCenterScreen() {
  useStudySessionTracker();
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { studySeconds, dailyStudyGoalMinutes } = useActivityGoals();
  const studyMinutesToday = Math.floor(studySeconds / 60);

  const [tab, setTab] = useState<StudyTab>('folders');
  const [progress, setProgress] = useState<
    { book_id: string; title: string; author_name: string | null; percentage: number }[]
  >([]);
  const [folderModal, setFolderModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

  const loadProgress = useCallback(async () => {
    try {
      setProgress(await getStudyProgress());
    } catch {
      setProgress([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProgress(); }, [loadProgress]));

  const foldersQuery = useQuery({
    queryKey: ['study-folders'],
    queryFn: async () => (await studyApi.getFolders(null)).data.data,
  });

  const notesQuery = useQuery({
    queryKey: ['study-notes', selectedFolderId],
    queryFn: async () =>
      (await studyApi.getNotes(selectedFolderId ? { folderId: selectedFolderId } : undefined)).data.data,
  });

  const allNotesQuery = useQuery({
    queryKey: ['study-notes-all'],
    queryFn: async () => (await studyApi.getNotes()).data.data,
  });

  const highlightsQuery = useQuery({
    queryKey: ['highlights'],
    queryFn: async () => (await studyApi.getHighlights()).data.data,
  });

  const folderCount = foldersQuery.data?.length ?? 0;
  const noteCount = notesQuery.data?.length ?? 0;
  const totalNoteCount = allNotesQuery.data?.length ?? 0;
  const highlightCount = highlightsQuery.data?.length ?? 0;
  const readingCount = progress.length;

  const createFolderMutation = useMutation({
    mutationFn: () => studyApi.createFolder({ name: folderName.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-folders'] });
      setFolderModal(false);
      setFolderName('');
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: () =>
      studyApi.createNote({
        title: noteTitle.trim(),
        body: noteBody.trim(),
        folderId: selectedFolderId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-notes'] });
      queryClient.invalidateQueries({ queryKey: ['study-notes-all'] });
      setNoteModal(false);
      setNoteTitle('');
      setNoteBody('');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => studyApi.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-notes'] }),
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: (id: string) => studyApi.deleteHighlight(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['highlights'] }),
  });

  const handleSync = async () => {
    try {
      await syncWithServer();
      await loadProgress();
      queryClient.invalidateQueries({ queryKey: ['study-folders'] });
      queryClient.invalidateQueries({ queryKey: ['study-notes'] });
      queryClient.invalidateQueries({ queryKey: ['study-notes-all'] });
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      Alert.alert('Listo', 'Progreso y material de estudio sincronizados.');
    } catch {
      Alert.alert('Sin conexión', 'No se pudo sincronizar ahora.');
    }
  };

  const tabConfig = [
    { id: 'folders' as const, label: 'Carpetas', icon: 'folder' as const, count: folderCount },
    { id: 'notes' as const, label: 'Notas', icon: 'document' as const, count: totalNoteCount },
    { id: 'highlights' as const, label: 'Subrayados', icon: 'highlight' as const, count: highlightCount },
    { id: 'reading' as const, label: 'Lectura', icon: 'library' as const, count: readingCount },
  ];

  const confirmDeleteNote = (id: string) => {
    Alert.alert('Eliminar nota', '¿Borrar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNoteMutation.mutate(id) },
    ]);
  };

  return (
    <DrawerScreenLayout
      title="Centro de estudios"
      subtitle="Organiza carpetas, notas y citas de tus lecturas"
    >
      <View style={styles.content}>
        <StudyCenterDashboard
          stats={{
            folders: folderCount,
            notes: totalNoteCount,
            highlights: highlightCount,
            reading: readingCount,
          }}
          studyMinutesToday={studyMinutesToday}
          studyGoalMinutes={dailyStudyGoalMinutes}
          onSync={handleSync}
          onNewFolder={() => setFolderModal(true)}
          onNewNote={() => setNoteModal(true)}
          onOpenLibrary={() => router.push('/(drawer)/(tabs)/library')}
        />

        <StudyTabBar tabs={tabConfig} activeTab={tab} onChange={setTab} />

        {tab === 'folders' && (
          <>
            <StudySectionHeader
              title="Mis carpetas"
              actionLabel="Nueva carpeta"
              actionIcon="folder-add"
              onAction={() => setFolderModal(true)}
            />
            {foldersQuery.isLoading ? (
              <>
                <CompactCardSkeleton />
                <CompactCardSkeleton />
              </>
            ) : folderCount === 0 ? (
              <StudyEmptyState
                icon="folder"
                title="Aún no tienes carpetas"
                description="Agrupa tus notas por tema, serie o proyecto de estudio. Cada carpeta puede tener subcarpetas."
                actionLabel="Crear primera carpeta"
                onAction={() => setFolderModal(true)}
              />
            ) : (
              (foldersQuery.data ?? []).map((folder) => (
                <StudyFolderCard
                  key={folder.id}
                  folder={folder}
                  onPress={() => {
                    setSelectedFolderId(folder.id);
                    setTab('notes');
                  }}
                />
              ))
            )}
          </>
        )}

        {tab === 'notes' && (
          <>
            <StudySectionHeader
              title={selectedFolderId ? 'Notas en carpeta' : 'Todas las notas'}
              actionLabel="Nueva nota"
              actionIcon="compose"
              onAction={() => setNoteModal(true)}
            />
            {selectedFolderId ? (
              <Pressable onPress={() => setSelectedFolderId(undefined)} style={styles.filterChip}>
                <AppIcon name="close" size={14} color={colors.primary} />
                <Text style={[styles.filterText, { color: colors.primary }]}>Ver todas las notas</Text>
              </Pressable>
            ) : null}
            {notesQuery.isLoading ? (
              <>
                <CompactCardSkeleton />
                <CompactCardSkeleton />
              </>
            ) : noteCount === 0 ? (
              <StudyEmptyState
                icon="document"
                title="Sin notas todavía"
                description="Escribe reflexiones, resúmenes o ideas vinculadas a libros. También puedes crear notas desde el lector."
                actionLabel="Escribir nota"
                onAction={() => setNoteModal(true)}
              />
            ) : (
              (notesQuery.data ?? []).map((note) => (
                <StudyNoteCard key={note.id} note={note} onDelete={() => confirmDeleteNote(note.id)} />
              ))
            )}
          </>
        )}

        {tab === 'highlights' && (
          <>
            <StudySectionHeader title="Citas subrayadas" />
            {highlightsQuery.isLoading ? (
              <>
                <CompactCardSkeleton />
                <CompactCardSkeleton />
              </>
            ) : highlightCount === 0 ? (
              <StudyEmptyState
                icon="highlight"
                title="Ningún subrayado guardado"
                description="Activa el subrayador en el lector y guarda pasajes importantes. Aparecerán aquí con portada y cita."
                actionLabel="Ir a la biblioteca"
                onAction={() => router.push('/(drawer)/(tabs)/library')}
              />
            ) : (
              (highlightsQuery.data ?? []).map((h) => (
                <StudyHighlightCard
                  key={h.id}
                  highlight={h}
                  onOpenBook={() => router.push(`/reader/${h.bookId}`)}
                  onDelete={() => deleteHighlightMutation.mutate(h.id)}
                />
              ))
            )}
          </>
        )}

        {tab === 'reading' && (
          <>
            <StudySectionHeader title="Continuar leyendo" />
            {readingCount === 0 ? (
              <StudyEmptyState
                icon="library-filled"
                title="Sin lecturas en curso"
                description="Abre un libro desde la biblioteca para registrar tu avance y retomarlo desde aquí."
                actionLabel="Explorar biblioteca"
                onAction={() => router.push('/(drawer)/(tabs)/library')}
              />
            ) : (
              progress.map((item) => (
                <StudyReadingCard
                  key={item.book_id}
                  title={item.title}
                  authorName={item.author_name}
                  percentage={item.percentage}
                  onPress={() => router.push(`/reader/${item.book_id}`)}
                />
              ))
            )}
          </>
        )}
      </View>

      <Modal visible={folderModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: colors.accentSoft }]}>
                <AppIcon name="folder-add" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva carpeta</Text>
            </View>
            <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
              Organiza tus notas por tema o estudio
            </Text>
            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Nombre de la carpeta"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              autoFocus
            />
            <Button
              title="Crear carpeta"
              onPress={() => createFolderMutation.mutate()}
              disabled={!folderName.trim() || createFolderMutation.isPending}
            />
            <Pressable onPress={() => setFolderModal(false)} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={noteModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: colors.accentSoft }]}>
                  <AppIcon name="compose" size={22} color={colors.accent} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva nota</Text>
              </View>
              <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
                Reflexiones, resúmenes o ideas de estudio
              </Text>
              <TextInput
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Título"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <TextInput
                value={noteBody}
                onChangeText={setNoteBody}
                placeholder="Escribe tu nota..."
                placeholderTextColor={colors.textSecondary}
                multiline
                style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Button
                title="Guardar nota"
                onPress={() => createNoteMutation.mutate()}
                disabled={!noteTitle.trim() || !noteBody.trim() || createNoteMutation.isPending}
              />
              <Pressable onPress={() => setNoteModal(false)} style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Cancelar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalCard: { borderRadius: radius.xl, padding: spacing.lg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { ...typography.title, flex: 1 },
  modalHint: { fontSize: 13, marginBottom: spacing.md, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, fontSize: 16 },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
