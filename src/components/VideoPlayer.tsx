import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { resolveApiMediaUrl } from '../utils/mediaUrl';
import { buildYouTubeEmbedHtml, getYouTubeRefererOrigin } from '../utils/youtubeReferer';

interface YouTubePlayerProps {
  readonly videoId: string;
  readonly style?: object;
  readonly autoPlay?: boolean;
}

export function YouTubePlayer({ videoId, style, autoPlay = true }: YouTubePlayerProps) {
  const refererOrigin = getYouTubeRefererOrigin();
  const [failed, setFailed] = useState(false);

  const openInYouTube = () => {
    void Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

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
      originWhitelist={['*']}
      source={{
        html: buildYouTubeEmbedHtml(videoId, autoPlay),
        baseUrl: refererOrigin,
      }}
      style={[styles.player, style]}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      onError={() => setFailed(true)}
      onHttpError={() => setFailed(true)}
    />
  );
}

interface DirectVideoPlayerProps {
  readonly url: string;
  readonly style?: object;
  readonly autoPlay?: boolean;
}

export function DirectVideoPlayer({ url, style, autoPlay = true }: DirectVideoPlayerProps) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    const resolved = resolveApiMediaUrl(url);
    if (!resolved) {
      setPlayUrl(null);
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
    },
  );

  useEffect(() => {
    if (!autoPlay || !playUrl) return;

    const tryPlay = () => {
      if (player.status === 'readyToPlay') {
        player.play();
      }
    };

    tryPlay();
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') player.play();
    });
    return () => sub.remove();
  }, [autoPlay, playUrl, player]);

  if (!playUrl) return null;

  return (
    <VideoView
      player={player}
      style={[styles.player, style]}
      contentFit="contain"
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
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
