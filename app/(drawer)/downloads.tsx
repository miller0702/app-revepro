import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { useTheme } from '../../src/hooks/useTheme';
import {
  downloadStatusLabel,
  getOfflineBooks,
  removeOfflineBook,
  type OfflineBookRow,
} from '../../src/db/offlineBooks';
import { processDownloadQueue } from '../../src/offline/downloadWorker';
import { useSystemStore } from '../../src/stores/systemStore';
import { AppIcon } from '../../src/components/ui/AppIcon';
import { spacing, radius } from '../../src/theme/tokens';

export default function DownloadsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isOffline = useSystemStore((s) => s.isOffline);
  const [books, setBooks] = useState<OfflineBookRow[]>([]);

  const reload = useCallback(async () => {
    try {
      setBooks(await getOfflineBooks());
    } catch {
      setBooks([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!isOffline) {
          await processDownloadQueue().catch(() => undefined);
        }
        await reload();
      })();
    }, [isOffline, reload]),
  );

  const handleRemove = (book: OfflineBookRow) => {
    Alert.alert('Eliminar descarga', `¿Quitar "${book.title}" del dispositivo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await removeOfflineBook(book.id);
          reload();
        },
      },
    ]);
  };

  return (
    <DrawerScreenLayout
      title="Mis descargas"
      subtitle="Libros guardados en el dispositivo para lectura sin conexión"
    >
      <View style={styles.content}>
        {books.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppIcon name="empty-library" size={52} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin descargas</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Desde el detalle de un libro, pulsa «Descargar offline» para guardarlo aquí.
            </Text>
            {!isOffline ? (
              <Pressable onPress={() => router.push('/library')}>
                <Text style={[styles.link, { color: colors.primary }]}>Ir a la biblioteca</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          books.map((book) => (
            <View
              key={book.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Pressable
                style={styles.cardMain}
                onPress={() => {
                  if (book.download_status === 'done') {
                    router.push(`/reader/${book.id}`);
                  } else {
                    router.push(`/book/${book.id}`);
                  }
                }}
              >
                <View style={[styles.cover, { backgroundColor: colors.accentSoft }]}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>
                    {book.title.charAt(0)}
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {book.title}
                  </Text>
                  {book.author_name ? (
                    <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author_name}</Text>
                  ) : null}
                  <Text style={[styles.status, { color: colors.primary }]}>
                    {downloadStatusLabel(book.download_status)}
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => handleRemove(book)} style={styles.removeBtn}>
                <Text style={{ color: '#c0392b', fontWeight: '600', fontSize: 13 }}>Eliminar</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { },
  emptyWrap: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: spacing.sm },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  link: { fontWeight: '700', fontSize: 15 },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  cover: {
    width: 52,
    height: 68,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  author: { fontSize: 13, marginTop: 4 },
  status: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  removeBtn: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, alignSelf: 'flex-start' },
});
