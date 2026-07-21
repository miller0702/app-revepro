import Constants from 'expo-constants';

const FALLBACK_APP_ORIGIN = 'https://com.resvepro.app';

/** Origen que YouTube exige como Referer en embeds dentro de WebView. */
export function getYouTubeRefererOrigin(): string {
  const androidPackage = Constants.expoConfig?.android?.package;
  const iosBundle = Constants.expoConfig?.ios?.bundleIdentifier;
  const appId = androidPackage ?? iosBundle;
  return appId ? `https://${appId}` : FALLBACK_APP_ORIGIN;
}

/**
 * Embed con IFrame API para poder mute/unmute vía injectJavaScript
 * (en iOS remountar con mute=0 no activa sonido).
 */
export function buildYouTubeEmbedHtml(
  videoId: string,
  autoPlay: boolean,
  muted = false,
): string {
  const safeId = JSON.stringify(videoId);
  const startMuted = muted || autoPlay; // autoplay en iOS debe iniciar mute
  const autoplayFlag = autoPlay ? 1 : 0;
  const muteFlag = startMuted ? 1 : 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #player { position: absolute; inset: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var ytPlayer = null;
    var wantUnmute = ${muted ? 'false' : 'true'};

    function applyMuteState() {
      if (!ytPlayer || typeof ytPlayer.mute !== 'function') return;
      if (wantUnmute) {
        ytPlayer.unMute();
        if (typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(100);
        if (typeof ytPlayer.playVideo === 'function') ytPlayer.playVideo();
      } else {
        ytPlayer.mute();
      }
    }

    window.unmuteAndPlay = function () {
      wantUnmute = true;
      applyMuteState();
      return true;
    };

    window.mutePlayer = function () {
      wantUnmute = false;
      applyMuteState();
      return true;
    };

    function onYouTubeIframeAPIReady() {
      ytPlayer = new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: ${safeId},
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          fs: 1,
          autoplay: ${autoplayFlag},
          mute: ${muteFlag},
          origin: ${JSON.stringify(getYouTubeRefererOrigin())}
        },
        events: {
          onReady: function () {
            applyMuteState();
            if (${autoplayFlag} === 1 && typeof ytPlayer.playVideo === 'function') {
              ytPlayer.playVideo();
            }
          }
        }
      });
    }

    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  </script>
</body>
</html>`;
}
