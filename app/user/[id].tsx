import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { UserProfileScreen } from '../../src/components/profile/UserProfileScreen';
import { useTheme } from '../../src/hooks/useTheme';

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  if (!id) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Usuario no válido</Text>
      </View>
    );
  }

  return <UserProfileScreen userId={id} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
