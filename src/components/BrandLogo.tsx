import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useBrandingStore } from '../stores/brandingStore';

const logos = {
  full: require('../../assets/logo-full.png'),
  icon: require('../../assets/logo-icon.png'),
} as const;

type BrandLogoProps = {
  variant?: keyof typeof logos;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ variant = 'full', style }: BrandLogoProps) {
  const { isDark, appName } = useTheme();
  const settings = useBrandingStore((s) => s.settings);

  const remoteUrl =
    variant === 'icon'
      ? settings?.logoMarkUrl?.trim()
      : (isDark ? settings?.logoUrlDark?.trim() : settings?.logoUrl?.trim()) ||
        settings?.logoUrl?.trim();

  if (remoteUrl) {
    return (
      <Image
        source={{ uri: remoteUrl }}
        style={style}
        accessibilityRole="image"
        accessibilityLabel={appName}
        resizeMode="contain"
      />
    );
  }

  return (
    <Image
      source={logos[variant]}
      style={style}
      accessibilityRole="image"
      accessibilityLabel={appName}
      resizeMode="contain"
    />
  );
}
