import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import type { CommunityPost } from '../../api/community';
import { ReportContentSheet } from './ReportContentSheet';
import { buildPostDeepLink } from '../../utils/postImageActions';
import type { ModerationReportTargetType } from '../../constants/moderationReport';
import { radius, spacing } from '../../theme/tokens';

interface PostMoreOptionsSheetProps {
  visible: boolean;
  post: CommunityPost;
  onClose: () => void;
}

export function PostMoreOptionsSheet({ visible, post, onClose }: PostMoreOptionsSheetProps) {
  const { colors, scaleFont } = useTheme();
  const insets = useSafeAreaInsets();
  const [reportTarget, setReportTarget] = useState<{
    type: ModerationReportTargetType;
    id: string;
  } | null>(null);

  const closeAll = () => {
    setReportTarget(null);
    onClose();
  };

  return (
    <>
      <Modal visible={visible && !reportTarget} animationType="slide" transparent onRequestClose={closeAll}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAll} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(16) }]}>
              Opciones de publicación
            </Text>

            <Pressable
              onPress={() => setReportTarget({ type: 'POST', id: post.id })}
              style={({ pressed }) => [
                styles.option,
                { borderBottomColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <AppIcon name="flag" size={22} color="#c0392b" />
              <Text style={{ color: '#c0392b', fontSize: scaleFont(15), fontWeight: '600', flex: 1 }}>
                Reportar publicación
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setReportTarget({ type: 'USER', id: post.author.id })}
              style={({ pressed }) => [
                styles.option,
                { borderBottomColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <AppIcon name="flag" size={22} color="#c0392b" />
              <Text style={{ color: '#c0392b', fontSize: scaleFont(15), fontWeight: '600', flex: 1 }}>
                Reportar a @{post.author.username}
              </Text>
            </Pressable>

            <Pressable onPress={closeAll} style={styles.cancelBtn}>
              <Text style={{ color: colors.textSecondary, fontSize: scaleFont(15), fontWeight: '600' }}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {reportTarget ? (
        <ReportContentSheet
          visible
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          contextUrl={buildPostDeepLink(post.id)}
          onClose={closeAll}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  title: { fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
});
