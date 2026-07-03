import { View, StyleSheet } from 'react-native';
import { DrawerBackButton } from '../navigation/DrawerBackButton';
import { ParallaxDetailSkeleton } from '../skeletons/ContentSkeletons';
import { useTheme } from '../../hooks/useTheme';
import { useScreenTopInset } from '../../hooks/useSafeAreaLayout';
import { SCREEN_PADDING_X } from '../../theme/layout';

interface ScreenDetailLoadingProps {
  showBack?: boolean;
}

export function ScreenDetailLoading({ showBack = true }: ScreenDetailLoadingProps) {
  const { colors } = useTheme();
  const topInset = useScreenTopInset();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showBack ? (
        <View style={[styles.header, { paddingTop: topInset }]}>
          <DrawerBackButton />
        </View>
      ) : null}
      <ParallaxDetailSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: 4,
  },
});
