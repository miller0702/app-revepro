import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Platform, Pressable } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  COMMUNITY_REACTIONS,
  getReactionMeta,
  type CommunityReactionType,
} from '../../constants/communityReactions';
import {
  REACTION_PICKER_HEIGHT,
  REACTION_PICKER_PAD_X,
  REACTION_PICKER_WIDTH,
  REACTION_SLOT_WIDTH,
  reactionTypeFromLocalX,
} from '../../utils/reactionPickerHitTest';
import { radius } from '../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HOVER_SCALE = 1.55;
const IDLE_SCALE = 1;

type SlotProps = {
  emoji: string;
  isHovered: boolean;
  visible: boolean;
};

function ReactionSlot({ emoji, isHovered, visible }: SlotProps) {
  const scale = useSharedValue(IDLE_SCALE);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      scale.value = IDLE_SCALE;
      translateY.value = 0;
      return;
    }
    scale.value = withSpring(isHovered ? HOVER_SCALE : IDLE_SCALE, {
      damping: 14,
      stiffness: 320,
    });
    translateY.value = withSpring(isHovered ? -14 : 0, {
      damping: 14,
      stiffness: 320,
    });
  }, [isHovered, scale, translateY, visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.Text style={[styles.emoji, emojiStyle]}>{emoji}</Animated.Text>;
}

type Props = {
  visible: boolean;
  position: { left: number; top: number } | null;
  myReaction: CommunityReactionType | null;
  embedded?: boolean;
  onSelect: (type: CommunityReactionType) => void;
  onDismissBackdrop: () => void;
};

export function ReactionPickerOverlay({
  visible,
  position,
  myReaction,
  embedded = false,
  onSelect,
  onDismissBackdrop,
}: Props) {
  const insets = useSafeAreaInsets();
  const [hoveredType, setHoveredType] = useState<CommunityReactionType | null>(
    myReaction ?? COMMUNITY_REACTIONS[0].type,
  );
  const [hintMode, setHintMode] = useState<'slide' | 'tap'>('slide');
  const hoveredRef = useRef(hoveredType);
  const onSelectRef = useRef(onSelect);
  hoveredRef.current = hoveredType;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!visible) return;
    const initial = myReaction ?? COMMUNITY_REACTIONS[0].type;
    setHoveredType(initial);
    hoveredRef.current = initial;
    setHintMode('slide');
    const timer = setTimeout(() => setHintMode('tap'), 900);
    return () => clearTimeout(timer);
  }, [visible, myReaction]);

  const commit = (type: CommunityReactionType | null) => {
    const next = type ?? hoveredRef.current;
    if (next) onSelectRef.current(next);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(8)
    .onBegin((e) => {
      const type = reactionTypeFromLocalX(e.x);
      if (type) {
        hoveredRef.current = type;
        setHoveredType(type);
      }
    })
    .onUpdate((e) => {
      const type = reactionTypeFromLocalX(e.x);
      if (type) {
        hoveredRef.current = type;
        setHoveredType(type);
      }
    })
    .onEnd((e) => {
      commit(reactionTypeFromLocalX(e.x));
    });

  if (!visible || !position) return null;

  const hoveredMeta = hoveredType ? getReactionMeta(hoveredType) : null;
  const hoveredIndex = hoveredType
    ? COMMUNITY_REACTIONS.findIndex((r) => r.type === hoveredType)
    : -1;
  const labelLeft =
    hoveredIndex >= 0
      ? REACTION_PICKER_PAD_X + hoveredIndex * REACTION_SLOT_WIDTH + REACTION_SLOT_WIDTH / 2
      : REACTION_PICKER_WIDTH / 2;

  const picker = (
    <View style={[styles.pickerWrap, { left: position.left, top: position.top }]}>
      {hoveredMeta ? (
        <View style={[styles.labelBubble, { left: labelLeft }]} pointerEvents="none">
          <Text style={styles.labelText}>{hoveredMeta.label}</Text>
        </View>
      ) : null}

      <GestureDetector gesture={pan}>
        <View style={styles.pill} accessibilityRole="adjustable" accessibilityLabel="Elegir reacción">
          {COMMUNITY_REACTIONS.map((reaction) => (
            <Pressable
              key={reaction.type}
              style={styles.slot}
              onPress={() => commit(reaction.type)}
              onPressIn={() => {
                hoveredRef.current = reaction.type;
                setHoveredType(reaction.type);
              }}
              accessibilityRole="button"
              accessibilityLabel={reaction.label}
            >
              <ReactionSlot
                emoji={reaction.emoji}
                isHovered={hoveredType === reaction.type}
                visible={visible}
              />
            </Pressable>
          ))}
        </View>
      </GestureDetector>
    </View>
  );

  const hint = (
    <View
      style={[styles.hintBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="none"
    >
      <Text style={styles.hintText}>
        {hintMode === 'slide'
          ? 'Desliza el dedo por las reacciones'
          : 'Toca para seleccionar una reacción'}
      </Text>
    </View>
  );

  const overlay = (
    <GestureHandlerRootView style={embedded ? styles.embeddedRoot : styles.modalRoot}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismissBackdrop}
        accessibilityLabel="Cerrar reacciones"
      />
      {picker}
      {hint}
    </GestureHandlerRootView>
  );

  if (embedded) return overlay;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismissBackdrop}>
      {overlay}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerWrap: {
    position: 'absolute',
    width: REACTION_PICKER_WIDTH,
    height: REACTION_PICKER_HEIGHT,
    alignItems: 'center',
  },
  labelBubble: {
    position: 'absolute',
    top: 0,
    width: 88,
    marginLeft: -44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    alignItems: 'center',
    zIndex: 2,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pill: {
    marginTop: 28,
    width: REACTION_PICKER_WIDTH,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: REACTION_PICKER_PAD_X,
    borderRadius: radius.full,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: { elevation: 14 },
    }),
  },
  slot: {
    width: REACTION_SLOT_WIDTH,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  hintBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '600',
  },
});
