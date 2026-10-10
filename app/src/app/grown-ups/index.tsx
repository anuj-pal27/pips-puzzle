import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { colors } from '@/theme';

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/**
 * Parental gate: grown-ups tap three numbers that are written as words.
 * Young children can't read them yet, so they can't wander into settings (app stores expect this for kids' apps).
 */
export default function GrownUpsGate() {
  const [code, setCode] = useState(() => Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 9)));
  const [entered, setEntered] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const ok = entered.length === 3 && entered.every((d, i) => d === code[i]);

  const press = (n: number) => {
    if (ok) return;
    const next = [...entered, n];
    if (next.length < 3) {
      setEntered(next);
      setWrong(false);
      return;
    }
    if (next.every((d, i) => d === code[i])) {
      setEntered(next);
      router.replace('/grown-ups/settings');
    } else {
      setEntered([]);
      setWrong(true);
      setCode(Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 9)));
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <CircleButton icon="close" label="Close" color="#2E3D69" shadow="#121B36" iconColor={colors.white} onPress={() => router.back()} />
      </View>
      <View style={styles.body}>
        <View style={styles.lock}>
          <Icon name="lock" size={44} />
        </View>
        <Txt weight="display" size={38} color={colors.white} align="center" accessibilityRole="header">Grown-ups only</Txt>
        <Txt weight="semibold" size={19} color="#C9D3EA" align="center">Tap the numbers in order:</Txt>
        <Txt weight="extrabold" size={30} color={colors.sun} align="center">{code.map((d) => WORDS[d - 1]).join(' · ')}</Txt>

        <View style={styles.dots} accessible accessibilityLabel={`${entered.length} of 3 numbers entered`}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i < entered.length && { backgroundColor: colors.sun, borderColor: colors.sun }]} />
          ))}
        </View>
        <View style={{ height: 28, justifyContent: 'center' }}>
          {wrong ? (
            <Txt size={18} color="#FFB4A0" accessibilityLiveRegion="polite">Not quite. Try again!</Txt>
          ) : null}
        </View>

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={String(n)}
              onPress={() => press(n)}
              style={({ pressed }) => [styles.key, { boxShadow: `0px ${pressed ? 2 : 5}px 0px #121B36` }, pressed && { transform: [{ translateY: 3 }] }]}>
              <Txt weight="extrabold" size={32} color={colors.white}>{n}</Txt>
            </Pressable>
          ))}
        </View>
        {ok ? <ChunkyButton label="Open settings" fontSize={22} height={70} onPress={() => router.replace('/grown-ups/settings')} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  top: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 20, gap: 8 },
  lock: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.sun, boxShadow: '0px 6px 0px #C48A00', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dots: { flexDirection: 'row', gap: 14, marginTop: 14 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#5A6A94' },
  keypad: { width: 300, flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 8 },
  key: { width: 90, height: 72, borderRadius: 22, backgroundColor: '#2E3D69', alignItems: 'center', justifyContent: 'center' },
});
