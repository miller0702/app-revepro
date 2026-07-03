import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../hooks/useTheme';
import { resolveApiMediaUrl } from '../../utils/mediaUrl';
import {
  getAccessTokenCache,
  getAuthImageHeaders,
  warmAccessTokenCache,
} from '../../lib/accessTokenCache';

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
  const [tokenReady, setTokenReady] = useState(Boolean(getAccessTokenCache()));

  useEffect(() => {
    if (getAccessTokenCache()) {
      setTokenReady(true);
      return;
    }
    let mounted = true;
    warmAccessTokenCache().then(() => {
      if (mounted) setTokenReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const initial =
    firstName?.charAt(0)?.toUpperCase() ??
    lastName?.charAt(0)?.toUpperCase() ??
    '?';
  const uri = resolveApiMediaUrl(avatarUrl);
  const authHeaders = getAuthImageHeaders();
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
      {uri && tokenReady && authHeaders ? (
        <Image
          source={{ uri, headers: authHeaders }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={uri}
          transition={120}
          priority="high"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: { fontWeight: '700' },
});
