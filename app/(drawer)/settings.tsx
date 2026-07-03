import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTutorialStore } from '../../src/stores/tutorialStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useI18n } from '../../src/hooks/useI18n';
import { syncWithServer } from '../../src/offline/syncService';
import { FONT_SIZE_PRESETS } from '../../src/config/fontScale';
import type { AppLocale } from '../../src/i18n';
import { spacing, radius, typography } from '../../src/theme/tokens';

const themeKeys = {
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
  system: 'settings.themeSystem',
} as const;

const fontPresetKeys = {
  small: 'settings.fontSmall',
  normal: 'settings.fontNormal',
  large: 'settings.fontLarge',
  xlarge: 'settings.fontXLarge',
} as const;

const localeOptions: { value: AppLocale; labelKey: string }[] = [
  { value: 'es', labelKey: 'settings.languageEs' },
  { value: 'en', labelKey: 'settings.languageEn' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, fontSize, setFontSize, locale, setLocale } = useSettingsStore();
  const { colors, scaleFont } = useTheme();
  const { t } = useI18n();
  const requestTutorialReplay = useTutorialStore((s) => s.requestReplay);

  return (
    <DrawerScreenLayout title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <View>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {t('settings.appearance')}
          </Text>
          <View style={styles.chipRow}>
            {(['light', 'dark', 'system'] as const).map((value) => (
              <Pressable
                key={value}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  theme === value && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setTheme(value)}
              >
                <Text
                  style={{
                    color: theme === value ? colors.onPrimary : colors.text,
                    fontWeight: '600',
                    fontSize: scaleFont(13),
                  }}
                >
                  {t(themeKeys[value])}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {t('settings.fontSize')} · {fontSize}px
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
            {t('settings.fontSizeHint')}
          </Text>
          <View style={styles.chipRow}>
            {FONT_SIZE_PRESETS.map((preset) => (
              <Pressable
                key={preset.key}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  fontSize === preset.value && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setFontSize(preset.value)}
              >
                <Text
                  style={{
                    color: fontSize === preset.value ? colors.onPrimary : colors.text,
                    fontWeight: '600',
                    fontSize: scaleFont(12),
                  }}
                >
                  {t(fontPresetKeys[preset.key])}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {t('settings.language')}
          </Text>
          <View style={styles.chipRow}>
            {localeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  locale === option.value && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setLocale(option.value)}
              >
                <Text
                  style={{
                    color: locale === option.value ? colors.onPrimary : colors.text,
                    fontWeight: '600',
                    fontSize: scaleFont(13),
                  }}
                >
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {t('goals.settingsSection')}
          </Text>
          <Pressable onPress={() => router.push('/goals')} style={styles.actionRow}>
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              {t('goals.title')}
            </Text>
            <Text style={[styles.actionHint, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              {t('goals.settingsHint')}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {t('settings.syncSection')}
          </Text>
          <Pressable
            onPress={() => syncWithServer().catch(() => undefined)}
            style={[styles.actionRow, { borderColor: colors.border }]}
          >
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              {t('settings.syncNow')}
            </Text>
            <Text style={[styles.actionHint, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              {t('settings.syncHint')}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/downloads')} style={styles.actionRow}>
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              {t('settings.downloads')}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {t('settings.legalSection')}
          </Text>
          <Pressable onPress={() => router.push('/manual')} style={styles.linkRow}>
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              {t('settings.manual')}
            </Text>
          </Pressable>
          <Pressable onPress={requestTutorialReplay} style={styles.linkRow}>
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              Ver tutorial de bienvenida
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/terms')} style={styles.linkRow}>
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              {t('settings.terms')}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/requirements')} style={styles.linkRow}>
            <Text style={[styles.actionLabel, { color: colors.text, fontSize: scaleFont(15) }]}>
              {t('settings.requirements')}
            </Text>
          </Pressable>
        </View>
      </View>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.label, marginBottom: spacing.md },
  sectionHint: { marginTop: -spacing.sm, marginBottom: spacing.md, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  actionLabel: { fontWeight: '600' },
  actionHint: { marginTop: 2 },
  linkRow: { paddingVertical: spacing.sm },
});
