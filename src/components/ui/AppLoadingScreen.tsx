import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SPLASH_BACKGROUND, SPLASH_PRIMARY } from '../../theme/splash';
import { spacing } from '../../theme/tokens';

const logoSource = require('../../../assets/logo-full.png');

interface AppLoadingScreenProps {
  showSpinner?: boolean;
  onLayout?: () => void;
}

export function AppLoadingScreen({ showSpinner = true, onLayout }: AppLoadingScreenProps) {
  return (
    <View style={styles.root} onLayout={onLayout}>
      <Image
        source={logoSource}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="RESVEPRO"
      />
      {showSpinner ? (
        <ActivityIndicator size="large" color={SPLASH_PRIMARY} style={styles.spinner} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: SPLASH_BACKGROUND,
  },
  logo: {
    width: 300,
    height: 220,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
