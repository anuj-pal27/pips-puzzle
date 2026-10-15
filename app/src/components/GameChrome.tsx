import { router } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { getTier, type TierId } from '@/data/puzzles';
import { themeFor } from '@/data/themes';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';
import { CircleButton } from './Buttons';
import { Txt } from './Txt';

/** Top bar shared by the games: back button, game name with its tier, and a counter on the right. */
export function GameHeader({ title, tier, right }: { title: string; tier: TierId; right?: ReactNode }) {
  const t = getTier(tier);
  const theme = themeFor(tier);
  return (
    <View style={styles.header}>
      <CircleButton icon="back" label="Back to puzzles" onPress={() => (router.canGoBack() ? router.back() : router.replace('/map'))} />
      <View style={styles.title}>
        <Txt
          weight="display"
          size={title.length > 14 ? 21 : 26}
          numberOfLines={1}
          accessibilityRole="header"
          color={theme.text}
          style={theme.dark ? { textShadowColor: 'rgba(5, 8, 30, 0.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } } : undefined}>
          {title}
        </Txt>
        <View style={[styles.tierBadge, { backgroundColor: t.color }]}>
          <Txt weight="extrabold" size={13}>{t.name}</Txt>
        </View>
      </View>
      {right ?? <View style={{ width: 56 }} />}
    </View>
  );
}

/** A short line of help or feedback under the board. Read out by screen readers when it changes. */
export function TipBubble({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'good' | 'oops' }) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(text);
  }, [text]);
  const bg = tone === 'good' ? '#E3F8D6' : tone === 'oops' ? '#FFE3DA' : colors.white;
  return (
    <View style={styles.tipRow}>
      <View style={[styles.tip, { backgroundColor: bg }]} accessibilityLiveRegion="polite">
        <Txt size={15} weight="semibold" align="center">{text}</Txt>
      </View>
    </View>
  );
}

/**
 * Save the stars for a finished puzzle, then go to the celebration screen after a short pause
 * (so the child sees the finished puzzle first). Leaving early cancels the jump.
 */
export function useFinish(puzzleId: string) {
  const { recordStars } = useProgress();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (stars: number, delay = 900) => {
    recordStars(puzzleId, stars);
    timer.current = setTimeout(
      () => router.replace({ pathname: '/complete/[id]', params: { id: puzzleId, stars: String(stars) } }),
      delay,
    );
  };
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 },
  title: { flex: 1, alignItems: 'center', gap: 2 },
  tierBadge: { paddingHorizontal: 10, borderRadius: 999 },
  tipRow: { alignItems: 'center', paddingHorizontal: 16, marginTop: 12, minHeight: 44 },
  tip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, boxShadow: `0px 3px 0px ${colors.sandShadow}`, maxWidth: 440 },
});
