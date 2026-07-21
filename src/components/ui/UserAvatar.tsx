import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AuthenticatedImage } from './AuthenticatedImage';

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = 72,
  style,
}: UserAvatarProps) {
  const { colors, scaleFont } = useTheme();

  const initial =
    firstName?.charAt(0)?.toUpperCase() ??
    lastName?.charAt(0)?.toUpperCase() ??
    '?';
  const radius = size / 2;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.inverse,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initial,
          { color: colors.primary, fontSize: scaleFont(size * 0.38) },
        ]}
      >
        {initial}
      </Text>
      {avatarUrl ? (
        <AuthenticatedImage
          url={avatarUrl}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
          contentFit="cover"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
  },
});
