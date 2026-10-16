import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '@/api/client';
import { CircleButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { LESSONS } from '@/game/teach';
import { useCatalog, type CatalogSource } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

// The public privacy policy (backend/content/templates/content/privacy.html). Stores link to the same page.
const PRIVACY_POLICY_URL = 'https://pips-puzzles-api.onrender.com/privacy/';

const SOURCE_TEXT: Record<CatalogSource, string> = {
  server: 'From the game server',
  saved: 'Saved from the game server last time',
  'built-in': 'Built into the app',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt weight="extrabold" size={15} color={colors.inkSoft} style={styles.sectionTitle} accessibilityRole="header">
        {title.toUpperCase()}
      </Txt>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, help, value, onChange, last }: { label: string; help?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={{ flex: 1 }}>
        <Txt size={19}>{label}</Txt>
        {help ? <Txt weight="regular" size={15} color={colors.inkSoft}>{help}</Txt> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#AEBACB', true: colors.green }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export default function GrownUpsSettings() {
  const { settings, updateSettings, resetProgress, totalStars, labStars } = useProgress();
  const { refresh, source, puzzles } = useCatalog();
  const [server, setServer] = useState<'checking' | 'ok' | 'offline'>('checking');

  // Opening this screen also picks up any puzzles added on the server since the app started.
  useEffect(() => {
    refresh().then((ok) => setServer(ok ? 'ok' : 'offline'));
  }, [refresh]);

  const confirmReset = () => {
    const doReset = () => resetProgress();
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.("Reset all stars, locks and Bit's lessons? This cannot be undone.")) doReset();
      return;
    }
    Alert.alert('Reset progress?', "All stars are cleared, levels 2 to 10 lock again, and Bit's lessons start over. This cannot be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to the game" onPress={() => router.back()} />
        <Txt weight="display" size={32} accessibilityRole="header">Grown-ups</Txt>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Sound">
          <ToggleRow label="Sound effects" value={settings.sound} onChange={(sound) => updateSettings({ sound })} />
          <ToggleRow label="Music" value={settings.music} onChange={(music) => updateSettings({ music })} last />
        </Section>

        <Section title="Puzzles">
          <ToggleRow
            label="Picture hint"
            help="Shows a light-bulb button that makes the faint picture on the board easier to see"
            value={settings.pictureHint}
            onChange={(pictureHint) => updateSettings({ pictureHint })}
            last
          />
        </Section>

        <Section title="Privacy">
          <ToggleRow
            label="Share play stats"
            help="Tells the game's makers which puzzles get played and finished, so they can make the hard ones kinder. Anonymous: no names, no account."
            value={settings.shareStats}
            onChange={(shareStats) => updateSettings({ shareStats })}
            last
          />
        </Section>

        <Section title="What your child learned with Bit">
          {LESSONS.map((l, i) => {
            const done = (labStars[l.id] ?? 0) > 0;
            return (
              <View key={l.id} style={[styles.row, i < LESSONS.length - 1 && styles.divider]} accessible accessibilityLabel={`${l.title}: ${done ? 'learned' : 'not yet'}. ${l.card.line}`}>
                <View style={[styles.learnDot, done && { backgroundColor: colors.green }]}>
                  {done ? <Icon name="check" size={16} color={colors.white} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={17} weight="semibold">{l.title}</Txt>
                  <Txt weight="regular" size={14} color={colors.inkSoft}>{l.card.line}</Txt>
                </View>
              </View>
            );
          })}
        </Section>

        <Section title="Progress">
          <View style={[styles.row, styles.divider]}>
            <Txt size={19}>Stars collected</Txt>
            <Txt weight="extrabold" size={19}>{totalStars}</Txt>
          </View>
          <Pressable accessibilityRole="button" onPress={confirmReset} style={styles.row}>
            <Txt size={19} color={colors.danger}>Reset progress</Txt>
          </Pressable>
        </Section>

        <Section title="About">
          <View style={[styles.row, styles.divider]}>
            <View style={{ flex: 1 }}>
              <Txt size={19}>Puzzles</Txt>
              <Txt weight="regular" size={15} color={colors.inkSoft}>{SOURCE_TEXT[source]}</Txt>
            </View>
            <Txt weight="extrabold" size={19}>{puzzles.length}</Txt>
          </View>
          <View style={[styles.row, PRIVACY_POLICY_URL ? styles.divider : null]}>
            <View style={{ flex: 1 }}>
              <Txt size={19}>Game server</Txt>
              <Txt weight="regular" size={15} color={colors.inkSoft}>
                {server === 'checking' ? 'Checking…' : server === 'ok' ? `Connected to ${API_URL}` : 'Not connected. The game works fine offline.'}
              </Txt>
            </View>
            <View style={[styles.statusDot, { backgroundColor: server === 'ok' ? colors.green : server === 'offline' ? '#AEBACB' : colors.sun }]} />
          </View>
          {PRIVACY_POLICY_URL ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.row}>
              <Txt size={19}>Privacy policy</Txt>
              <Icon name="right" size={22} color={colors.inkSoft} />
            </Pressable>
          ) : null}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F6FA' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  sectionTitle: { marginLeft: 6, letterSpacing: 1 },
  card: { paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.white },
  row: { minHeight: 64, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E6EDF4' },
  learnDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#D5DEEA', alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
});
