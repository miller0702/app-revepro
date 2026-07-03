import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import { DEFAULT_COVER_FOCUS, toCoverContentPosition, type CoverFocus } from '../../utils/coverFocus';

interface CoverBannerImageProps {
  url: string | null | undefined;
  focusX?: number;
  focusY?: number;
  style?: StyleProp<ImageStyle>;
}

export function CoverBannerImage({
  url,
  focusX = DEFAULT_COVER_FOCUS.x,
  focusY = DEFAULT_COVER_FOCUS.y,
  style,
}: CoverBannerImageProps) {
  const focus: CoverFocus = { x: focusX, y: focusY };

  return (
    <AuthenticatedImage
      url={url}
      style={[StyleSheet.absoluteFillObject, style]}
      contentFit="cover"
      contentPosition={toCoverContentPosition(focus)}
    />
  );
}
