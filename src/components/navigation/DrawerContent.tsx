import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useResolvedTopInset } from '../../hooks/useSafeAreaLayout';
import { UserAvatar } from '../ui/UserAvatar';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { useDrawerMenu } from '../../hooks/useDrawerMenu';
import { useI18n } from '../../hooks/useI18n';
import { spacing, radius, typography } from '../../theme/tokens';

export function DrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const topInset = useResolvedTopInset();
  const { colors, scaleFont, appName } = useTheme();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { sections, fromApi } = useDrawerMenu();

  const navigate = (href: string) => {
    props.navigation.closeDrawer();
    router.push(href as never);
  };

  const isActive = (href: string) => {
    const path = href.replace(/^\//, '');
    return pathname === href || pathname.endsWith(`/${path}`) || pathname.includes(path);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => navigate('/profile')}
          style={({ pressed }) => [styles.brandRow, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('drawer.viewProfile')}
        >
          <UserAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            avatarUrl={user?.avatarUrl}
            size={48}
          />
          <View style={styles.brandText}>
            <Text style={[styles.appName, { color: colors.text, fontSize: scaleFont(20) }]}>{appName}</Text>
            <Text
              style={[styles.userLine, { color: colors.textSecondary, fontSize: scaleFont(13) }]}
              numberOfLines={1}
            >
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
        </Pressable>

        {sections.map((section) => (
          <View key={`${section.groupSortOrder}-${section.title}`} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
              {fromApi ? section.title : t(section.title)}
            </Text>
            {section.items.map((item) => {
              const active = isActive(item.href);
              const iconName = item.icon as AppIconName;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => navigate(item.href)}
                  style={({ pressed }) => [
                    styles.item,
                    active && { backgroundColor: colors.accentSoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon
                    name={iconName}
                    size={20}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: active ? colors.primary : colors.text, fontSize: scaleFont(15) },
                    ]}
                  >
                    {fromApi ? item.label : t(item.label)}
                  </Text>
                  <AppIcon name="forward" size={18} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => {
            props.navigation.closeDrawer();
            logout();
            router.replace('/(auth)/login');
          }}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <AppIcon name="profile" size={18} color="#c0392b" />
          <Text style={[styles.logoutText, { color: '#c0392b', fontSize: scaleFont(15) }]}>
            {t('drawer.logout')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  brandText: { flex: 1 },
  appName: { ...typography.title, fontSize: 20 },
  userLine: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: 4,
  },
  itemLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  footer: { borderTopWidth: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  logoutText: { fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
