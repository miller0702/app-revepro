import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { palette } from '../../theme/colors';
import { prepareChapterBody, READER_CONTENT_CSS } from '../../utils/chapterHtml';

export interface ReaderWebViewHandle {
  applyHighlightToSelection: () => void;
}

interface ReaderWebViewProps {
  title: string;
  htmlContent: string;
  highlightMode: boolean;
  highlights: string[];
  onTextSelected: (text: string) => void;
  onChapterCompleted?: () => void;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReaderHtml(
  title: string,
  body: string,
  isDark: boolean,
  fontSize: number,
  highlights: string[],
) {
  const bg = isDark ? palette.reader.dark : palette.reader.light;
  const text = isDark ? '#f7f3ec' : '#0c0f14';
  const escapedTitle = escapeHtml(title);
  const bodyHtml = prepareChapterBody(body, highlights);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px 20px 32px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.65;
      color: ${text};
      background: ${bg};
      -webkit-user-select: text;
      user-select: text;
    }
    h1 { font-size: ${fontSize + 4}px; margin: 0 0 16px; font-weight: 700; }
    mark, .egw-highlight {
      background: rgba(201, 162, 39, 0.42);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    ${READER_CONTENT_CSS}
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <div id="content">${bodyHtml}</div>
  <script>
    function sendSelection() {
      var text = window.getSelection().toString().trim();
      if (text.length > 2) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selection', text: text }));
      }
    }
    document.addEventListener('mouseup', sendSelection);
    document.addEventListener('touchend', function() {
      setTimeout(sendSelection, 120);
    });

    var chapterCompletedSent = false;
    function checkScrollProgress() {
      if (chapterCompletedSent) return;
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      var clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      var scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      var maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 24) {
        chapterCompletedSent = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'chapterCompleted' }));
        return;
      }
      var ratio = scrollTop / maxScroll;
      if (ratio >= 0.9) {
        chapterCompletedSent = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'chapterCompleted' }));
      }
    }
    window.addEventListener('scroll', checkScrollProgress, { passive: true });
    setTimeout(checkScrollProgress, 400);
  </script>
</body>
</html>`;
}

const HIGHLIGHT_SELECTION_SCRIPT = `
(function() {
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  var range = sel.getRangeAt(0);
  if (range.collapsed) return;
  try {
    var mark = document.createElement('mark');
    mark.className = 'egw-highlight';
    range.surroundContents(mark);
    sel.removeAllRanges();
  } catch (e) {
    try {
      var mark = document.createElement('mark');
      mark.className = 'egw-highlight';
      var fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
      sel.removeAllRanges();
    } catch (err) {}
  }
})();
true;
`;

export const ReaderWebView = forwardRef<ReaderWebViewHandle, ReaderWebViewProps>(
  function ReaderWebView(
    { title, htmlContent, highlightMode, highlights, onTextSelected, onChapterCompleted },
    ref,
  ) {
    const { isDark } = useTheme();
    const fontSize = useSettingsStore((s) => s.fontSize);
    const lastSelection = useRef('');
    const webViewRef = useRef<WebView>(null);

    const html = buildReaderHtml(title, htmlContent, isDark, fontSize, highlights);

    useImperativeHandle(ref, () => ({
      applyHighlightToSelection: () => {
        webViewRef.current?.injectJavaScript(HIGHLIGHT_SELECTION_SCRIPT);
      },
    }));

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as { type: string; text?: string };
        if (payload.type === 'chapterCompleted') {
          onChapterCompleted?.();
          return;
        }
        if (!highlightMode) return;
        if (payload.type === 'selection' && payload.text && payload.text !== lastSelection.current) {
          lastSelection.current = payload.text;
          onTextSelected(payload.text);
        }
      } catch {
        /* ignore */
      }
    };

    return (
      <WebView
        ref={webViewRef}
        key={`${title}-${fontSize}-${isDark}-${highlights.join('|')}`}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      />
    );
  },
);

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: 'transparent' },
});
