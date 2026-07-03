import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  COMMUNITY_REACTIONS,
  type CommunityReactionType,
} from '../../constants/communityReactions';
import {
  REACTION_PICKER_WIDTH,
  type ReactionPickerLayout,
} from '../../utils/reactionPickerHitTest';
import { radius } from '../../theme/tokens';

const HOVER_SCALE = 1.55;

type SlotProps = {
  emoji: string;
  label: string;
  isHovered: boolean;
  isCurrent: boolean;
  visible: boolean;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
};

function ReactionSlot({
  emoji,
  label,
  isHovered,
  isCurrent,
  visible,
  surfaceColor,
  textColor,
  accentColor,
}: SlotProps) {
  const scale = useSharedValue(0.85);

  useEffect(() => {
    if (!visible) {
      scale.value = 0.85;
      return;
    }
    scale.value = withSpring(isHovered ? HOVER_SCALE : 1, {
      damping: 14,
      stiffness: 280,
    });
  }, [isHovered, scale, visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.slot}>
      {isHovered ? (
        <View
          style={[
            styles.labelBubble,
            {
              backgroundColor: surfaceColor,
              borderColor: isCurrent ? accentColor : 'transparent',
            },
          ]}
        >
          <Text style={[styles.labelText, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : (
        <View style={styles.labelSpacer} />
      )}
      <Animated.Text style={[styles.emoji, emojiStyle]}>{emoji}</Animated.Text>
    </View>
  );
}

type Props = {
  visible: boolean;
  position: { left: number; top: number } | null;
  myReaction: CommunityReactionType | null;
  hoveredType: CommunityReactionType | null;
  onLayoutsReady: (layouts: Map<CommunityReactionType, ReactionPickerLayout>) => void;
  embedded?: boolean;
  colors: { surface: string; border: string; text: string; primary: string };
  onDismissBackdrop: () => void;
};

export function ReactionPickerOverlay({
  visible,
  position,
  myReaction,
  hoveredType,
  onLayoutsReady,
  embedded = false,
  colors,
  onDismissBackdrop,
}: Props) {
  const itemRefs = useRef<Partial<Record<CommunityReactionType, View | null>>>({});

  useEffect(() => {
    if (!visible || !position) return;

    const timer = setTimeout(() => {
      const layouts = new Map<CommunityReactionType, ReactionPickerLayout>();
      let pending = COMMUNITY_REACTIONS.length;

      const finish = () => {
        pending -= 1;
        if (pending <= 0) onLayoutsReady(layouts);
      };

      for (const reaction of COMMUNITY_REACTIONS) {
        const node = itemRefs.current[reaction.type];
        if (!node) {
          finish();
          continue;
        }
        node.measureInWindow((x, y, width, height) => {
          layouts.set(reaction.type, {
            left: x,
            right: x + width,
            top: y,
            bottom: y + height,
          });
          finish();
        });
      }
    }, 48);

    return () => clearTimeout(timer);
  }, [visible, position, onLayoutsReady]);

  if (!visible || !position) return null;

  const picker = (
    <View
      style={[
        styles.picker,
        {
          left: position.left,
          top: position.top,
          width: REACTION_PICKER_WIDTH,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      pointerEvents="none"
    >
      {COMMUNITY_REACTIONS.map((reaction) => (
        <View
          key={reaction.type}
          ref={(node) => {
            itemRefs.current[reaction.type] = node;
          }}
          style={styles.slotWrap}
        >
          <ReactionSlot
            emoji={reaction.emoji}
            label={reaction.label}
            isHovered={hoveredType === reaction.type}
            isCurrent={myReaction === reaction.type}
            visible={visible}
            surfaceColor={colors.surface}
            textColor={colors.text}
            accentColor={colors.primary}
          />
        </View>
      ))}
    </View>
  );

  const overlay = (
    <View style={embedded ? styles.embeddedRoot : styles.modalRoot} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismissBackdrop} />
      {picker}
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  picker: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
    paddingTop: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },
  slotWrap: {
    flex: 1,
    alignItems: 'center',
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 72,
  },
  labelSpacer: {
    height: 28,
  },
  labelBubble: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1.5,
    maxWidth: 110,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
});
