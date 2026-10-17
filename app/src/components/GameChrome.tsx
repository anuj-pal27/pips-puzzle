import { router } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { hasVoice, playSound, speak, useVoice } from '@/audio/sound';
import { howToClip, howToFor } from '@/data/howTo';
import { stopNumber, themeFor } from '@/data/levels';
import type { Puzzle } from '@/data/puzzles';
import type { VoiceClip } from '@/data/voice';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';
import { CircleButton } from './Buttons';
import { Icon } from './Icon';
import { Txt } from './Txt';

/**
 * Say how to play, a moment after a game opens (src/data/howTo.ts), in the language grown-ups picked.
 * Returns the clip, for a HowToButton.
 */
export function useHowTo(puzzle: Puzzle): VoiceClip {
  const { settings } = useProgress();
  const clip = howToClip(howToFor(puzzle), settings.helpLanguage);
  useVoice(clip, 800);
  return clip;
}

/** A small speaker button next to the level badge: hear how to play again. */
export function HowToButton({ clip }: { clip: VoiceClip }) {
  const { settings } = useProgress();
  if (!settings.voice || !hasVoice(clip)) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hear how to play"
      hitSlop={10}
      onPress={() => {
        playSound('tap');
        speak(clip);
      }}
      style={({ pressed }) => [styles.howTo, pressed && { transform: [{ translateY: 2 }] }]}>
      <Icon name="sound" size={17} />
    </Pressable>
  );
}

/** The level a puzzle is in, as a small coloured badge. */
export function LevelBadge({ level }: { level: number }) {
  const theme = themeFor(level);
  return (
    <View style={[styles.levelBadge, { backgroundColor: theme.accent }]}>
      <Txt weight="extrabold" size={13} color={colors.ink}>Level {stopNumber(level)}</Txt>
    </View>
  );
}

/** Top bar shared by the games: back button, game name with its level (and how to play), and a counter on the right. */
export function GameHeader({ title, level, right, howTo }: { title: string; level: number; right?: ReactNode; howTo?: VoiceClip }) {
  const theme = themeFor(level);
  return (
    <View style={styles.header}>
      <CircleButton icon="back" label="Back to puzzles" onPress={() => (router.canGoBack() ? router.back() : router.replace('/map'))} />
      <View style={styles.title}>
        <Txt
          weight="display"
          size={title.length > 20 ? 18 : title.length > 14 ? 21 : 26}
          numberOfLines={title.length > 20 ? 2 : 1}
          align="center"
          accessibilityRole="header"
          color={theme.text}
          style={theme.dark ? { textShadowColor: 'rgba(5, 8, 30, 0.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } } : undefined}>
          {title}
        </Txt>
        <View style={styles.badgeRow}>
          <LevelBadge level={level} />
          {howTo ? <HowToButton clip={howTo} /> : null}
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
  levelBadge: { paddingHorizontal: 10, borderRadius: 999 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  howTo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 3px 0px ${colors.sandShadow}` },
  tipRow: { alignItems: 'center', paddingHorizontal: 16, marginTop: 12, minHeight: 44 },
  tip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, boxShadow: `0px 3px 0px ${colors.sandShadow}`, maxWidth: 440 },
});
