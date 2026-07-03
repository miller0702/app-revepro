import Constants from 'expo-constants';

const FALLBACK_APP_ORIGIN = 'https://com.resvepro.app';

/** Origen que YouTube exige como Referer en embeds dentro de WebView. */
export function getYouTubeRefererOrigin(): string {
  const androidPackage = Constants.expoConfig?.android?.package;
  const iosBundle = Constants.expoConfig?.ios?.bundleIdentifier;
  const appId = androidPackage ?? iosBundle;
  return appId ? `https://${appId}` : FALLBACK_APP_ORIGIN;
}

export function buildYouTubeEmbedHtml(videoId: string, autoPlay: boolean): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
    controls: '1',
    fs: '1',
    origin: getYouTubeRefererOrigin(),
    ...(autoPlay ? { autoplay: '1', mute: '0' } : {}),
  });

  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <iframe
    src="${src}"
    title="YouTube"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</body>
</html>`;
}
