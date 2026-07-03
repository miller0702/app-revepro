import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import { communityApi, type CommunityPost } from '../../api/community';
import {
  getReactionMeta,
  normalizeReactionCounts,
  totalReactionCount,
  type CommunityReactionType,
} from '../../constants/communityReactions';
import {
  applyReactionFromServer,
  applyReactionOptimistic,
  findPostInFeedCache,
  updatePostInFeedCache,
} from '../../utils/communityFeedCache';
import { sharePostLink } from '../../utils/postImageActions';
import { toast } from '../../utils/toast';
import { radius, spacing } from '../../theme/tokens';
import { ReactionsListSheet } from './ReactionsListSheet';
import { RepostComposerSheet } from './RepostComposerSheet';
import { ReactionPickerOverlay } from './ReactionPickerOverlay';
import {
  hitTestReactionPicker,
  REACTION_PICKER_HEIGHT,
  REACTION_PICKER_WIDTH,
  type ReactionPickerLayout,
} from '../../utils/reactionPickerHitTest';

interface PostActionsProps {
  post: CommunityPost;
  onOpenComments: (post: CommunityPost) => void;
  /** `overlay` = iconos claros sobre fondo oscuro (visor de imágenes). */
  tone?: 'default' | 'overlay';
  /** Overlays embebidos en lugar de Modal (dentro del visor de imágenes). */
  embeddedOverlays?: boolean;
}

const DEFAULT_REACTION: CommunityReactionType = 'AMEN';
const LONG_PRESS_MS = 320;
const REACTION_COOLDOWN_MS = 280;

export function PostActions({ post, onOpenComments, tone = 'default', embeddedOverlays = false }: PostActionsProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isOverlay = tone === 'overlay';
  const iconColor = isOverlay ? 'rgba(255,255,255,0.88)' : colors.textSecondary;
  const countColor = isOverlay ? 'rgba(255,255,255,0.75)' : colors.textSecondary;
  const borderColor = isOverlay ? 'rgba(255,255,255,0.18)' : colors.border;
  const queryClient = useQueryClient();
  const anchorRef = useRef<View>(null);
  const reactionLock = useRef(false);
  const suppressPressUntil = useRef(0);
  const longPressHandled = useRef(false);
  const pickerOpenRef = useRef(false);
  const hoveredTypeRef = useRef<CommunityReactionType | null>(null);
  const pickerLayoutsRef = useRef<Map<CommunityReactionType, ReactionPickerLayout>>(new Map());
  const dragEndingRef = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hoveredType, setHoveredType] = useState<CommunityReactionType | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    pickerOpenRef.current = pickerOpen;
  }, [pickerOpen]);

  useEffect(() => {
    hoveredTypeRef.current = hoveredType;
  }, [hoveredType]);

  const counts = normalizeReactionCounts(post.reactionCounts, post.likeCount);
  const total = totalReactionCount(counts);
  const myReaction = post.myReaction ?? (post.likedByMe ? 'AMEN' : null);
  const activeMeta = myReaction ? getReactionMeta(myReaction) : null;

  const reactionMutation = useMutation({
    mutationFn: (type: CommunityReactionType) => communityApi.toggleReaction(post.id, type),
    onMutate: (type) => {
      const previousPost = findPostInFeedCache(queryClient, post.id) ?? post;
      updatePostInFeedCache(queryClient, post.id, (p) => applyReactionOptimistic(p, type));
      return { previousPost };
    },
    onError: (_err, _type, context) => {
      if (context?.previousPost) {
        const snapshot = context.previousPost;
        updatePostInFeedCache(queryClient, post.id, () => snapshot);
      }
      toast.error('No se pudo guardar la reacción');
    },
    onSuccess: (res) => {
      const { myReaction: nextReaction, reactionCounts } = res.data.data;
      updatePostInFeedCache(queryClient, post.id, (p) =>
        applyReactionFromServer(p, nextReaction, reactionCounts),
      );
    },
  });

  const submitReaction = (type: CommunityReactionType) => {
    if (reactionLock.current || reactionMutation.isPending) return;
    reactionLock.current = true;
    reactionMutation.mutate(type, {
      onSettled: () => {
        reactionLock.current = false;
        suppressPressUntil.current = Date.now() + REACTION_COOLDOWN_MS;
      },
    });
  };

  const openPickerAtAnchor = useCallback(() => {
    longPressHandled.current = true;
    setHoveredType(null);
    setPickerOpen(true);
    anchorRef.current?.measureInWindow((x, y, width) => {
      const screen = Dimensions.get('window');
      let left = x + width / 2 - REACTION_PICKER_WIDTH / 2;
      left = Math.max(8, Math.min(left, screen.width - REACTION_PICKER_WIDTH - 8));
      const top = Math.max(8, y - REACTION_PICKER_HEIGHT - 40);
      setPickerPos({ left, top });
    });
  }, []);

  const dismissPicker = useCallback((swallowNextPress = false) => {
    setPickerOpen(false);
    setPickerPos(null);
    setHoveredType(null);
    pickerLayoutsRef.current = new Map();
    if (swallowNextPress) {
      suppressPressUntil.current = Date.now() + REACTION_COOLDOWN_MS;
    }
  }, []);

  const handleLayoutsReady = useCallback((layouts: Map<CommunityReactionType, ReactionPickerLayout>) => {
    pickerLayoutsRef.current = layouts;
  }, []);

  const updateHoverAt = useCallback((absoluteX: number, absoluteY: number) => {
    if (!pickerOpenRef.current) return;
    const hit = hitTestReactionPicker(absoluteX, absoluteY, pickerLayoutsRef.current);
    setHoveredType((prev) => (prev === hit ? prev : hit));
  }, []);

  const endPickerDrag = useCallback(() => {
    if (!pickerOpenRef.current || dragEndingRef.current) return;
    dragEndingRef.current = true;
    const selected = hoveredTypeRef.current;
    dismissPicker();
    longPressHandled.current = false;
    if (selected) {
      submitReaction(selected);
    }
    dragEndingRef.current = false;
  }, [dismissPicker]);

  const handleQuickPress = useCallback(() => {
    if (Date.now() < suppressPressUntil.current) return;
    if (longPressHandled.current) {
      longPressHandled.current = false;
      return;
    }
    if (pickerOpenRef.current) return;
    submitReaction(myReaction ?? DEFAULT_REACTION);
  }, [myReaction]);

  const reactionGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDuration(LONG_PRESS_MS - 20)
      .onEnd(() => {
        runOnJS(handleQuickPress)();
      });

    const pickPan = Gesture.Pan()
      .activateAfterLongPress(LONG_PRESS_MS)
      .onStart(() => {
        runOnJS(openPickerAtAnchor)();
      })
      .onUpdate((event) => {
        runOnJS(updateHoverAt)(event.absoluteX, event.absoluteY);
      })
      .onEnd(() => {
        runOnJS(endPickerDrag)();
      });

    return Gesture.Exclusive(pickPan, tap);
  }, [endPickerDrag, handleQuickPress, openPickerAtAnchor, updateHoverAt]);

  const sharePost = async () => {
    setShareOpen(false);
    await sharePostLink(post.id, post.body);
  };

  const handleRepost = () => {
    setShareOpen(false);
    setRepostOpen(true);
  };

  const shareSheet = shareOpen ? (
    <View style={embeddedOverlays ? styles.embeddedOverlayRoot : styles.shareOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setShareOpen(false)} />
      <View
        style={[
          styles.shareSheet,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
          embeddedOverlays && styles.embeddedShareSheet,
        ]}
      >
        <View style={[styles.shareHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.shareTitle, { color: colors.text }]}>Compartir publicación</Text>

        <Pressable
          onPress={handleRepost}
          style={({ pressed }) => [
            styles.shareOption,
            { borderBottomColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <AppIcon name="share" size={22} color={colors.primary} />
          <View style={styles.shareOptionText}>
            <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Repostear</Text>
            <Text style={[styles.shareOptionHint, { color: colors.textSecondary }]}>
              Añade un comentario y publica en tu feed
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => void sharePost()}
          style={({ pressed }) => [
            styles.shareOption,
            { borderBottomColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <AppIcon name="send" size={22} color={colors.primary} />
          <View style={styles.shareOptionText}>
            <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Compartir</Text>
            <Text style={[styles.shareOptionHint, { color: colors.textSecondary }]}>
              Enviar a otras apps
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setShareOpen(false)}
          style={({ pressed }) => [styles.shareCancel, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.shareCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  const pickerOverlay = (
    <ReactionPickerOverlay
      visible={pickerOpen}
      position={pickerPos}
      myReaction={myReaction}
      hoveredType={hoveredType}
      onLayoutsReady={handleLayoutsReady}
      embedded={embeddedOverlays}
      colors={{
        surface: colors.surface,
        border: colors.border,
        text: colors.text,
        primary: colors.primary,
      }}
      onDismissBackdrop={() => dismissPicker(true)}
    />
  );

  const actionsBar = (
    <View style={[styles.actions, { borderTopColor: borderColor, marginTop: isOverlay ? spacing.xs : spacing.sm }]}>
      <View ref={anchorRef} collapsable={false} style={styles.reactionGroup}>
        <GestureDetector gesture={reactionGesture}>
          <View
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={
              activeMeta
                ? `Tu reacción: ${activeMeta.label}. Mantén pulsado y desliza para cambiar`
                : 'Reaccionar. Mantén pulsado y desliza para elegir reacción'
            }
          >
            <Text
              style={[
                styles.myReactionEmoji,
                !activeMeta && (isOverlay ? styles.myReactionEmojiOverlayMuted : styles.myReactionEmojiMuted),
              ]}
            >
              {activeMeta?.emoji ?? '🙏'}
            </Text>
          </View>
        </GestureDetector>
        {total > 0 && (
          <Pressable
            onPress={() => setReactionsOpen(true)}
            style={styles.countBtn}
            accessibilityLabel={`${total} reacciones. Ver detalle`}
          >
            <Text style={[styles.iconCount, { color: countColor }]}>{total}</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => onOpenComments(post)} style={styles.iconBtn}>
        <AppIcon name="chat" size={22} color={iconColor} />
        {post.commentCount > 0 && (
          <Text style={[styles.iconCount, { color: countColor }]}>{post.commentCount}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => setShareOpen(true)}
        style={styles.iconBtn}
        accessibilityLabel="Compartir publicación"
      >
        <AppIcon name="share" size={22} color={iconColor} />
        {(post.repostCount ?? 0) > 0 && (
          <Text style={[styles.iconCount, { color: countColor }]}>{post.repostCount}</Text>
        )}
      </Pressable>
    </View>
  );

  const overlayLayers = (
    <>
      <ReactionsListSheet
        post={reactionsOpen ? post : null}
        onClose={() => setReactionsOpen(false)}
        embedded={embeddedOverlays}
      />

      {embeddedOverlays ? (
        <>
          {pickerOverlay}
          {shareSheet}
        </>
      ) : (
        <>
          {pickerOverlay}

          <Modal
            visible={shareOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setShareOpen(false)}
          >
            {shareSheet}
          </Modal>
        </>
      )}

      <RepostComposerSheet
        post={post}
        visible={repostOpen}
        onClose={() => setRepostOpen(false)}
        embedded={embeddedOverlays}
      />
    </>
  );

  if (embeddedOverlays) {
    return (
      <>
        <View style={styles.embeddedOverlayPortal} pointerEvents="box-none">
          {overlayLayers}
        </View>
        <View
          style={[styles.embeddedActionsWrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
          pointerEvents="auto"
        >
          {actionsBar}
        </View>
      </>
    );
  }

  return (
    <>
      {actionsBar}
      {overlayLayers}
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  reactionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
    marginLeft: -6,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 44,
    minHeight: 40,
    paddingHorizontal: spacing.xs,
  },
  myReactionEmoji: { fontSize: 22 },
  myReactionEmojiMuted: { opacity: 0.45 },
  myReactionEmojiOverlayMuted: { opacity: 0.55 },
  iconCount: { fontSize: 12, fontWeight: '600' },
  shareOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  shareSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  shareHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  shareOptionText: { flex: 1 },
  shareOptionTitle: { fontSize: 16, fontWeight: '600' },
  shareOptionHint: { fontSize: 13, marginTop: 2 },
  shareCancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  shareCancelText: { fontSize: 16, fontWeight: '600' },
  embeddedOverlayPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  embeddedOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 22,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  embeddedActionsWrap: {
    width: '100%',
    zIndex: 7,
    paddingHorizontal: spacing.md,
  },
  embeddedShareSheet: {
    marginHorizontal: 0,
  },
});
