import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setAudioModeAsync } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { isApiHostedMediaUrl, resolveApiMediaUrl } from '../utils/mediaUrl';
import { buildYouTubeEmbedHtml, getYouTubeRefererOrigin } from '../utils/youtubeReferer';

export type YouTubePlayerHandle = {
  unmute: () => void;
};

interface YouTubePlayerProps {
  readonly videoId: string;
  readonly style?: object;
  readonly autoPlay?: boolean;
  /** Necesario en iOS para autoplay sin gesto del usuario. */
  readonly muted?: boolean;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer({ videoId, style, autoPlay = true, muted = false }, ref) {
    const refererOrigin = getYouTubeRefererOrigin();
    const [failed, setFailed] = useState(false);
    const webRef = useRef<WebView>(null);
    const mutedRef = useRef(muted);
    mutedRef.current = muted;

    const html = useMemo(
      () => buildYouTubeEmbedHtml(videoId, autoPlay, true),
      [videoId, autoPlay],
    );

    const injectMuteState = (nextMuted: boolean) => {
      const js = nextMuted
        ? 'window.mutePlayer && window.mutePlayer(); true;'
        : 'window.unmuteAndPlay && window.unmuteAndPlay(); true;';
      webRef.current?.injectJavaScript(js);
    };

    useImperativeHandle(ref, () => ({
      unmute: () => injectMuteState(false),
    }));

    const openInYouTube = () => {
      void Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
    };

    useEffect(() => {
      if (failed) return;
      injectMuteState(muted);
    }, [muted, failed]);

    if (failed) {
      return (
        <View style={[styles.fallback, style]}>
          <Text style={styles.fallbackText}>No se pudo cargar el reproductor</Text>
          <Pressable onPress={openInYouTube} style={styles.fallbackBtn}>
            <Text style={styles.fallbackBtnText}>Abrir en YouTube</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: refererOrigin }}
        style={[styles.player, style]}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onLoadEnd={() => injectMuteState(mutedRef.current)}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
    );
  },
);

interface DirectVideoPlayerProps {
  readonly url: string;
  readonly style?: object;
  readonly autoPlay?: boolean;
  /** Sin controles: útil como miniatura (primer fotograma). */
  readonly preview?: boolean;
  /** Autoplay sin gesto del usuario (p. ej. feed) suele requerir mute. */
  readonly muted?: boolean;
  /**
   * Controles nativos. En iOS suelen taparse overlays RN;
   * conviene desactivarlos mientras hay botón de unmute encima.
   */
  readonly nativeControls?: boolean;
  readonly contentFit?: 'contain' | 'cover' | 'fill';
  /** Duración real del archivo en segundos (cuando el player la conoce). */
  readonly onDurationSec?: (seconds: number) => void;
}

export function DirectVideoPlayer({
  url,
  style,
  autoPlay = true,
  preview = false,
  muted = false,
  nativeControls,
  contentFit = 'contain',
  onDurationSec,
}: DirectVideoPlayerProps) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Record<string, string> | undefined>();
  const silent = preview || muted;
  const showNativeControls = nativeControls ?? !preview;

  useEffect(() => {
    const resolved = resolveApiMediaUrl(url);
    if (!resolved) {
      setPlayUrl(null);
      setHeaders(undefined);
      return;
    }
    const needsAuth = isApiHostedMediaUrl(resolved);
    if (!needsAuth) {
      setPlayUrl(resolved);
      setHeaders(undefined);
      return;
    }
    SecureStore.getItemAsync('accessToken').then((token) => {
      setPlayUrl(resolved);
      setHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
    });
  }, [url]);

  const player = useVideoPlayer(
    playUrl ? { uri: playUrl, headers } : null,
    (instance) => {
      instance.loop = false;
      instance.muted = silent;
      instance.volume = silent ? 0 : 1;
    },
  );

  useEffect(() => {
    if (!playUrl) return;

    let cancelled = false;

    const applyMute = () => {
      if (cancelled) return;
      void Promise.resolve()
        .then(() => {
          if (cancelled) return;
          if (player.status === 'error') return;
          player.muted = silent;
          player.volume = silent ? 0 : 1;
          if (!preview && autoPlay && !silent) {
            player.play();
          }
        })
        .catch(() => undefined);
    };

    applyMute();

    if (!silent) {
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      })
        .then(() => applyMute())
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [autoPlay, playUrl, player, preview, silent]);

  useEffect(() => {
    if (!playUrl) return;

    let cancelled = false;

    const reportDuration = () => {
      void Promise.resolve()
        .then(() => {
          if (cancelled) return;
          const d = player.duration;
          if (Number.isFinite(d) && d > 0) {
            onDurationSec?.(Math.max(1, Math.round(d)));
          }
        })
        .catch(() => undefined);
    };

    const apply = () => {
      void Promise.resolve()
        .then(() => {
          if (cancelled) return;
          if (player.status !== 'readyToPlay') return;
          reportDuration();
          if (preview) {
            player.currentTime = 0.05;
            player.pause();
            return;
          }
          if (autoPlay) player.play();
          else player.pause();
        })
        .catch(() => undefined);
    };

    apply();
    let sub: { remove: () => void } | undefined;
    try {
      sub = player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') apply();
      });
    } catch {
      return () => {
        cancelled = true;
      };
    }
    return () => {
      cancelled = true;
      try {
        sub?.remove();
      } catch {
        /* ignore */
      }
    };
  }, [autoPlay, onDurationSec, playUrl, player, preview]);

  if (!playUrl) return null;

  return (
    <VideoView
      player={player}
      style={[styles.player, style]}
      contentFit={contentFit}
      nativeControls={showNativeControls}
      fullscreenOptions={{ enable: !preview }}
      allowsPictureInPicture={!preview}
    />
  );
}

const styles = StyleSheet.create({
  player: { width: '100%', height: '100%', backgroundColor: '#000' },
  fallback: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  fallbackText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
  fallbackBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  fallbackBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
