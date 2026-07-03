import { useState, type ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import type { CommunityPost } from '../../api/community';
import {
  copyImageLink,
  saveImageToGallery,
  shareImageFile,
  shareImageLink,
  sharePostLink,
  buildPostDeepLink,
} from '../../utils/postImageActions';
import type { PostDraft } from './CreatePostSheet';
import { ReportContentSheet } from './ReportContentSheet';
import type { ModerationReportTargetType } from '../../constants/moderationReport';
import { radius, spacing } from '../../theme/tokens';

interface PostMediaOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageId?: string;
  post?: CommunityPost;
  onShareAsPost?: (draft: PostDraft) => void;
  /** Evita un segundo Modal cuando ya hay uno abierto (p. ej. lightbox). */
  embedded?: boolean;
}

type ActionItem = {
  key: string;
  label: string;
  icon: 'download' | 'copy' | 'share' | 'send' | 'compose' | 'flag';
  destructive?: boolean;
  run: () => Promise<void> | void;
};

export function PostMediaOptionsSheet({
  visible,
  onClose,
  imageUrl,
  imageId,
  post,
  onShareAsPost,
  embedded = false,
}: PostMediaOptionsSheetProps) {
  const { colors, scaleFont } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: ModerationReportTargetType;
    id: string;
  } | null>(null);

  const closeAll = () => {
    setReportTarget(null);
    onClose();
  };

  const runAction = async (action: ActionItem) => {
    if (busy) return;
    setBusy(true);
    try {
      await action.run();
      if (action.key !== 'report-post' && action.key !== 'report-user' && action.key !== 'report-image') {
        closeAll();
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'PERMISSION_DENIED') {
        Alert.alert('Permiso requerido', 'Activa el acceso a fotos para guardar la imagen.');
      } else {
        Alert.alert('Error', 'No se pudo completar la acción. Intenta de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!imageUrl && !post) return null;

  const actions: ActionItem[] = [];

  if (imageUrl) {
    actions.push(
      {
        key: 'save',
        label: 'Guardar imagen',
        icon: 'download',
        run: async () => {
          await saveImageToGallery(imageUrl);
          Alert.alert('Guardada', 'La imagen se guardó en tu galería.');
        },
      },
      {
        key: 'copy-link',
        label: 'Copiar enlace de la imagen',
        icon: 'copy',
        run: async () => {
          await copyImageLink(imageUrl);
          Alert.alert('Copiado', 'Enlace copiado al portapapeles.');
        },
      },
      {
        key: 'share-file',
        label: 'Compartir imagen',
        icon: 'share',
        run: async () => shareImageFile(imageUrl),
      },
      {
        key: 'share-link',
        label: 'Compartir enlace de la imagen',
        icon: 'send',
        run: async () => shareImageLink(imageUrl),
      },
    );
  }

  if (post && imageId && onShareAsPost) {
    actions.push({
      key: 'new-post',
      label: 'Crear publicación con esta imagen',
      icon: 'compose',
      run: () => {
        onShareAsPost({
          body: '',
          existingImageIds: [imageId],
          existingImages: [{ id: imageId, url: imageUrl }],
        });
        closeAll();
      },
    });
  }

  if (post) {
    actions.push({
      key: 'share-post',
      label: 'Compartir publicación',
      icon: 'send',
      run: async () => sharePostLink(post.id, post.body),
    });
  }

  if (imageId) {
    actions.push({
      key: 'report-image',
      label: 'Reportar imagen',
      icon: 'flag',
      destructive: true,
      run: () => setReportTarget({ type: 'POST_IMAGE', id: imageId }),
    });
  }

  if (post) {
    actions.push(
      {
        key: 'report-post',
        label: 'Reportar publicación',
        icon: 'flag',
        destructive: true,
        run: () => setReportTarget({ type: 'POST', id: post.id }),
      },
      {
        key: 'report-user',
        label: `Reportar a @${post.author.username}`,
        icon: 'flag',
        destructive: true,
        run: () => setReportTarget({ type: 'USER', id: post.author.id }),
      },
    );
  }

  const sheetBody = (
    <View style={[styles.overlay, embedded && styles.embeddedOverlay]}>
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
          Opciones de imagen
        </Text>

        {busy && <ActivityIndicator color={colors.primary} style={styles.loader} />}

        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => void runAction(action)}
            disabled={busy}
            style={({ pressed }) => [
              styles.option,
              { borderBottomColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <AppIcon
              name={action.icon}
              size={22}
              color={action.destructive ? '#c0392b' : colors.primary}
            />
            <Text
              style={{
                color: action.destructive ? '#c0392b' : colors.text,
                fontSize: scaleFont(15),
                fontWeight: '600',
                flex: 1,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}

        <Pressable onPress={closeAll} style={styles.cancelBtn}>
          <Text style={{ color: colors.textSecondary, fontSize: scaleFont(15), fontWeight: '600' }}>
            Cancelar
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const showSheet = visible && !reportTarget;

  let optionsLayer: ReactNode = null;
  if (embedded && showSheet) {
    optionsLayer = (
      <View style={styles.embeddedRoot} pointerEvents="box-none">
        {sheetBody}
      </View>
    );
  } else if (!embedded && showSheet) {
    optionsLayer = (
      <Modal visible animationType="slide" transparent onRequestClose={closeAll}>
        {sheetBody}
      </Modal>
    );
  }

  return (
    <>
      {optionsLayer}

      {reportTarget ? (
        <ReportContentSheet
          visible
          embedded={embedded}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          contextUrl={post ? buildPostDeepLink(post.id) : undefined}
          onClose={() => {
            setReportTarget(null);
            closeAll();
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  embeddedOverlay: {
    flex: 1,
  },
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
  loader: { marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
});
