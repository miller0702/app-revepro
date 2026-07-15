import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  Modal,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import { UserAvatar } from '../ui/UserAvatar';
import { AppIcon } from '../ui/AppIcon';
import { PostActions } from './PostActions';
import { PostMediaOptionsSheet } from './PostMediaOptionsSheet';
import { PostCommentsSheet } from './PostCommentsSheet';
import type { PostDraft } from './CreatePostSheet';
import type { CommunityPost } from '../../api/community';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useTheme } from '../../hooks/useTheme';
import { useModalTopInset } from '../../hooks/useSafeAreaLayout';
import { radius, spacing } from '../../theme/tokens';

export interface PostImageItem {
  id: string;
  url: string | null;
}

interface PostImageLightboxProps {
  visible: boolean;
  images: PostImageItem[];
  initialIndex?: number;
  onClose: () => void;
  post?: CommunityPost;
  onShareAsPost?: (draft: PostDraft) => void;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const BLUR_RADIUS = Platform.select({ ios: 42, android: 28, default: 32 });

function FloatingIconButton({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.floatingBtn}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}

export function PostImageLightbox({
  visible,
  images,
  initialIndex = 0,
  onClose,
  post,
  onShareAsPost,
}: PostImageLightboxProps) {
  const insets = useSafeAreaInsets();
  const topInset = useModalTopInset();
  const { width, height: windowHeight } = useWindowDimensions();
  const { scaleFont, colors } = useTheme();
  const items = images.filter((img) => img.url);
  const [index, setIndex] = useState(initialIndex);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const translateY = useSharedValue(0);
  const chromeOpacity = useSharedValue(1);
  const sheetBlocking = optionsOpen || commentsOpen;

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      translateY.value = 0;
      setChromeVisible(true);
      chromeOpacity.value = 1;
      setOptionsOpen(false);
      setCommentsOpen(false);
    } else {
      setOptionsOpen(false);
      setCommentsOpen(false);
    }
  }, [visible, initialIndex, translateY, chromeOpacity]);

  useEffect(() => {
    if (sheetBlocking) {
      setChromeVisible(true);
      chromeOpacity.value = withTiming(1, { duration: 180 });
    }
  }, [sheetBlocking, chromeOpacity]);

  useEffect(() => {
    chromeOpacity.value = withTiming(chromeVisible ? 1 : 0, { duration: 220 });
  }, [chromeVisible, chromeOpacity]);

  const toggleChrome = useCallback(() => {
    if (sheetBlocking) return;
    setChromeVisible((prev) => !prev);
  }, [sheetBlocking]);

  const handleOpenComments = useCallback((_target: CommunityPost) => {
    setCommentsOpen(true);
    setChromeVisible(true);
  }, []);

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!sheetBlocking)
        .activeOffsetY(18)
        .failOffsetX([-28, 28])
        .onUpdate((event) => {
          if (event.translationY > 0) {
            translateY.value = event.translationY;
          }
        })
        .onEnd((event) => {
          if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
            runOnJS(requestClose)();
            return;
          }
          translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
        }),
    [sheetBlocking, requestClose, translateY],
  );

  const animatedRootStyle = useAnimatedStyle(() => {
    const progress = Math.min(translateY.value / 320, 1);
    return {
      transform: [
        { translateY: translateY.value },
        { scale: 1 - progress * 0.05 },
      ],
      opacity: 1 - progress * 0.35,
    };
  });

  const animatedChromeStyle = useAnimatedStyle(() => ({
    opacity: chromeOpacity.value,
  }));

  if (!items.length) return null;

  const bodyText = post?.body?.trim() ?? '';
  const authorName = post
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : '';
  const currentImage = items[index];
  const overlayBottom = Math.max(insets.bottom, spacing.md);
  const listBlocked = sheetBlocking;
  const progress = items.length > 1 ? (index + 1) / items.length : 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.modalShell}>
        <GestureHandlerRootView style={styles.flex}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.root, animatedRootStyle]}>
            <View style={styles.backdropLayer} pointerEvents="none">
              <AuthenticatedImage
                url={currentImage?.url}
                style={styles.backdropImage}
                contentFit="cover"
                blurRadius={BLUR_RADIUS}
              />
              <View style={styles.backdropScrim} />
            </View>

            <FlatList
              data={items}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={styles.imageList}
              pointerEvents={listBlocked ? 'none' : 'auto'}
              initialScrollIndex={Math.min(initialIndex, items.length - 1)}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              onMomentumScrollEnd={(event) => {
                const next = Math.round(event.nativeEvent.contentOffset.x / width);
                setIndex(next);
              }}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.slide, { width, height: windowHeight }]}
                  onPress={toggleChrome}
                  accessibilityRole="button"
                  accessibilityLabel="Mostrar u ocultar controles"
                >
                  <AuthenticatedImage
                    url={item.url}
                    style={styles.image}
                    contentFit="contain"
                  />
                </Pressable>
              )}
            />

            {items.length > 1 ? (
              <Animated.View
                style={[styles.progressTrack, { top: topInset }, animatedChromeStyle]}
                pointerEvents="none"
              >
                <View style={styles.progressBg} />
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%`, backgroundColor: colors.primary },
                  ]}
                />
              </Animated.View>
            ) : null}

            <Animated.View
              style={[styles.topGradient, { height: topInset + 108 }, animatedChromeStyle]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.42)', 'transparent']}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.topControls,
                { paddingTop: topInset + (items.length > 1 ? 10 : 0) },
                animatedChromeStyle,
              ]}
              pointerEvents={chromeVisible ? 'box-none' : 'none'}
            >
              <View style={styles.topBar} pointerEvents="auto">
                <FloatingIconButton onPress={onClose} label="Cerrar">
                  <AppIcon name="close" size={22} color="#fff" />
                </FloatingIconButton>

                {items.length > 1 ? (
                  <View style={styles.counterPill}>
                    <Text style={[styles.counterText, { fontSize: scaleFont(13) }]}>
                      {index + 1} / {items.length}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.topSpacer} />
                )}

                <FloatingIconButton onPress={() => setOptionsOpen(true)} label="Más opciones">
                  <AppIcon name="more" size={22} color="#fff" />
                </FloatingIconButton>
              </View>
            </Animated.View>

            {items.length > 1 ? (
              <Animated.View
                style={[
                  styles.dots,
                  { bottom: overlayBottom + (post ? 72 : 28) },
                  animatedChromeStyle,
                ]}
                pointerEvents="none"
              >
                {items.map((item, dotIndex) => (
                  <View
                    key={item.id}
                    style={[styles.dot, dotIndex === index && styles.dotActive]}
                  />
                ))}
              </Animated.View>
            ) : null}

            {post ? (
              <Animated.View
                style={[styles.postChrome, animatedChromeStyle]}
                pointerEvents={chromeVisible ? 'box-none' : 'none'}
              >
                <View style={styles.postMeta}>
                  <View style={styles.authorRow}>
                    <UserAvatar
                      firstName={post.author.firstName}
                      lastName={post.author.lastName}
                      avatarUrl={post.author.avatarUrl}
                      size={44}
                    />
                    <View style={styles.authorText}>
                      <Text style={[styles.authorName, { fontSize: scaleFont(16) }]} numberOfLines={1}>
                        {authorName}
                      </Text>
                      <Text style={[styles.authorMeta, { fontSize: scaleFont(12) }]}>
                        @{post.author.username} · {formatRelativeTime(post.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {bodyText.length > 0 ? (
                    <Text
                      style={[styles.body, { fontSize: scaleFont(15), lineHeight: scaleFont(22) }]}
                      numberOfLines={5}
                    >
                      {bodyText}
                    </Text>
                  ) : null}
                </View>

                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.58)', 'rgba(0,0,0,0.94)']}
                  locations={[0, 0.35, 1]}
                  style={styles.actionsGradient}
                  pointerEvents="box-none"
                >
                  <PostActions
                    post={post}
                    onOpenComments={handleOpenComments}
                    tone="overlay"
                    embeddedOverlays
                  />
                </LinearGradient>
              </Animated.View>
            ) : null}

            {!chromeVisible && !sheetBlocking ? (
              <View style={styles.chromeHint} pointerEvents="none">
                <Text style={styles.chromeHintText}>Toca la imagen para ver opciones</Text>
              </View>
            ) : null}

            <PostMediaOptionsSheet
              embedded
              visible={optionsOpen}
              onClose={() => setOptionsOpen(false)}
              imageUrl={currentImage?.url ?? null}
              imageId={currentImage?.id}
              post={post}
              onShareAsPost={(draft) => {
                setOptionsOpen(false);
                onClose();
                onShareAsPost?.(draft);
              }}
            />

            {post && commentsOpen ? (
              <PostCommentsSheet
                embedded
                visible={commentsOpen}
                post={post}
                onClose={() => setCommentsOpen(false)}
              />
            ) : null}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalShell: {
    flex: 1,
    backgroundColor: '#000',
  },
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#0c0f14',
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.12 }],
  },
  backdropScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  imageList: {
    ...StyleSheet.absoluteFillObject,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  progressTrack: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 12,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSpacer: {
    width: 44,
    height: 44,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  counterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  counterText: { color: '#fff', fontWeight: '600' },
  dots: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    zIndex: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  postChrome: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    justifyContent: 'flex-end',
  },
  postMeta: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionsGradient: {
    paddingTop: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  authorText: { flex: 1 },
  authorName: {
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  authorMeta: {
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  body: {
    color: 'rgba(255,255,255,0.96)',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  chromeHint: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 3,
  },
  chromeHintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
});
