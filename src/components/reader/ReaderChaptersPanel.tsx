import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import { radius, spacing, typography } from '../../theme/tokens';

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.86, 360);

export interface ReaderChapterItem {
  id: string;
  title: string;
  sortOrder?: number;
}

interface ReaderChaptersPanelProps {
  visible: boolean;
  bookTitle: string;
  chapters: ReaderChapterItem[];
  activeChapterId: string | undefined;
  onClose: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export function ReaderChaptersPanel({
  visible,
  bookTitle,
  chapters,
  activeChapterId,
  onClose,
  onSelectChapter,
}: ReaderChaptersPanelProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(PANEL_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar capítulos" />
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              borderLeftColor: colors.border,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: insets.bottom + spacing.sm,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.panelHeaderText}>
              <Text style={[styles.panelBook, { color: colors.textSecondary }]} numberOfLines={1}>
                {bookTitle}
              </Text>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Capítulos</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <AppIcon name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {chapters.map((ch, index) => {
              const active = ch.id === activeChapterId;
              return (
                <Pressable
                  key={ch.id}
                  onPress={() => {
                    onSelectChapter(ch.id);
                    onClose();
                  }}
                  style={[
                    styles.chapterRow,
                    {
                      backgroundColor: active ? colors.primary + '18' : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chapterIndex, { color: colors.textSecondary }]}>
                    {ch.sortOrder ?? index + 1}
                  </Text>
                  <Text
                    style={[
                      styles.chapterTitle,
                      { color: active ? colors.primary : colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {ch.title}
                  </Text>
                  {active ? <AppIcon name="document" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    width: PANEL_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  panelHeaderText: { flex: 1 },
  panelBook: { fontSize: 12, fontWeight: '600' },
  panelTitle: { ...typography.title, fontSize: 20, marginTop: 2 },
  closeBtn: { padding: 4 },
  list: { padding: spacing.sm, gap: spacing.xs },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chapterIndex: { width: 22, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  chapterTitle: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 20 },
});
