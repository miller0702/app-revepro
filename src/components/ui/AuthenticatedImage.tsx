import { useEffect, useState } from 'react';
import { Image, type ImageProps, type ImageContentFit } from 'expo-image';
import {
  getAccessTokenCache,
  getAuthImageHeaders,
  warmAccessTokenCache,
} from '../../lib/accessTokenCache';
import { resolveApiMediaUrl } from '../../utils/mediaUrl';

interface AuthenticatedImageProps extends Omit<ImageProps, 'source'> {
  url: string | null | undefined;
  /** Compatibilidad con API de Image de React Native. */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const RESIZE_TO_FIT: Record<NonNullable<AuthenticatedImageProps['resizeMode']>, ImageContentFit> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'none',
};

export function AuthenticatedImage({
  url,
  style,
  resizeMode,
  contentFit,
  ...props
}: AuthenticatedImageProps) {
  const [tokenReady, setTokenReady] = useState(Boolean(getAccessTokenCache()));
  const uri = resolveApiMediaUrl(url);

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

  const authHeaders = getAuthImageHeaders();
  if (!uri || !tokenReady || !authHeaders) return null;

  const fit = contentFit ?? (resizeMode ? RESIZE_TO_FIT[resizeMode] : 'cover');

  return (
    <Image
      {...props}
      source={{ uri, headers: authHeaders }}
      style={style}
      contentFit={fit}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      transition={150}
    />
  );
}
