import { useEffect, useState } from 'react';
import { Image, type ImageProps, type ImageContentFit } from 'expo-image';
import {
  getAccessTokenCache,
  getAuthImageHeaders,
  warmAccessTokenCache,
} from '../../lib/accessTokenCache';
import { isApiHostedMediaUrl, resolveApiMediaUrl } from '../../utils/mediaUrl';

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
  const uri = resolveApiMediaUrl(url);
  const needsAuth = isApiHostedMediaUrl(uri);
  const [tokenReady, setTokenReady] = useState(
    !needsAuth || Boolean(getAccessTokenCache()),
  );

  useEffect(() => {
    if (!needsAuth) {
      setTokenReady(true);
      return;
    }
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
  }, [needsAuth, uri]);

  if (!uri || !tokenReady) return null;

  const authHeaders = needsAuth ? getAuthImageHeaders() : undefined;
  if (needsAuth && !authHeaders) return null;

  const fit = contentFit ?? (resizeMode ? RESIZE_TO_FIT[resizeMode] : 'cover');

  return (
    <Image
      {...props}
      source={authHeaders ? { uri, headers: authHeaders } : { uri }}
      style={style}
      contentFit={fit}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      transition={150}
    />
  );
}
