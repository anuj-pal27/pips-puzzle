import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { playSound, useMusic } from '@/audio/sound';
import { Pill } from '@/components/Buttons';
import { ThemeBackdrop } from '@/components/Festive';
import { GameHeader, TipBubble, useFinish } from '@/components/GameChrome';
import { Icon } from '@/components/Icon';
import { RangoliArt } from '@/components/RangoliArt';
import { Txt } from '@/components/Txt';
import { themeFor } from '@/data/levels';
import type { RangoliPuzzle } from '@/data/puzzles';
import { GROUND, hitClass, newRangoli, paint, PALETTE, paintClasses, palette, rangoliDone, rangoliProgress, rangoliStars, targetColor, type RangoliState } from '@/game/rangoli';
import { usePuzzle } from '@/state/catalog';
import { usePlayStats } from '@/state/playStats';
import { colors } from '@/theme';

// Rangoli: pick a colour pot, then tap the pattern. Every matching shape fills at once, round and round,
// until the rangoli looks like the little picture.

type Tip = { text: string; tone: 'plain' | 'good' | 'oops' };

export default function RangoliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = usePuzzle(id);
  if (!puzzle || puzzle.kind !== 'rangoli') return <Redirect href="/map" />;
  return <RangoliGame key={puzzle.id} puzzle={puzzle} />;
}

function RangoliGame({ puzzle }: { puzzle: RangoliPuzzle }) {
  usePlayStats(puzzle.id);
  const cfg = puzzle.rangoli;
  const theme = themeFor(puzzle.level);
  useMusic(theme.music);
  const finish = useFinish(puzzle.id);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pots = palette(cfg);
  const [state, setState] = useState<RangoliState>(newRangoli);
  const [color, setColor] = useState(pots[0]);
  const [tip, setTip] = useState<Tip>({ text: 'Pick a colour, then tap the pattern to make it like the picture!', tone: 'plain' });
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  const total = paintClasses(cfg).length;
  const done = rangoliDone(cfg, state);
  const size = Math.floor(Math.min(width - 40, height - insets.top - insets.bottom - 72 - 140 - 96 - 70, 380));

  // x, y: where the tap landed on the pattern, in pixels from its top-left corner.
  const tapAt = (x: number, y: number) => {
    if (done) return;
    const c = hitClass(cfg, (x / size) * 200 - 100, (y / size) * 200 - 100);
    if (!c) return;
    const next = paint(cfg, state, c, color);
    if (next === state) return;
    setState(next);
    pop.set(withSequence(withTiming(1.03, { duration: 90 }), withTiming(1, { duration: 140 })));
    if (targetColor(cfg, c) !== color) {
      playSound('miss');
      setTip({ text: 'Hmm, look at the picture. Which colour goes there?', tone: 'oops' });
    } else if (rangoliDone(cfg, next)) {
      playSound('match');
      setTip({ text: `What a beautiful ${GROUND[cfg.style].title.toLowerCase()}!`, tone: 'good' });
      finish(rangoliStars(next.misses), 1300);
    } else {
      playSound('snap');
      setTip({ text: 'Yes! Round and round it goes.', tone: 'good' });
    }
  };

  const tap = Gesture.Tap()
    .maxDistance(24)
    .onEnd((e) => {
      scheduleOnRN(tapAt, e.x, e.y);
    });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <ThemeBackdrop theme={theme} />
      <GameHeader
        title={puzzle.title || GROUND[cfg.style].title}
        level={puzzle.level}
        right={
          <Pill>
            <Icon name="check" size={24} color={colors.green} />
            <Txt weight="extrabold" size={20} accessibilityLabel={`${rangoliProgress(cfg, state)} of ${total} done`}>
              {rangoliProgress(cfg, state)}/{total}
            </Txt>
          </Pill>
        }
      />

      <View style={styles.body}>
        <View style={styles.goalCard} accessible accessibilityLabel="Make your pattern look like this picture">
          <Txt weight="extrabold" size={14} color={colors.inkSoft}>Make it like this:</Txt>
          <RangoliArt cfg={cfg} size={84} done />
        </View>

        <Animated.View style={[styles.frame, popStyle]}>
          <GestureDetector gesture={tap}>
            <View accessible accessibilityLabel={`${GROUND[cfg.style].title} pattern. Tap a ring to colour it ${color}.`}>
              <RangoliArt cfg={cfg} size={size} fills={state.fills} done={done} />
            </View>
          </GestureDetector>
        </Animated.View>

        <View style={styles.pots} accessibilityRole="radiogroup">
          {pots.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ selected: p === color }}
              accessibilityLabel={`${p} colour`}
              onPress={() => {
                playSound('tap');
                setColor(p);
              }}
              style={[styles.pot, p === color && styles.potSelected]}>
              <View style={[styles.powder, { backgroundColor: PALETTE[p] }]} />
              <View style={styles.bowl} />
            </Pressable>
          ))}
        </View>

        <TipBubble text={tip.text} tone={tip.tone} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 16 },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6, paddingLeft: 14, borderRadius: 20, backgroundColor: colors.white, boxShadow: `0px 4px 0px ${colors.sandShadow}` },
  frame: { padding: 8, borderRadius: 999, backgroundColor: colors.white, boxShadow: `0px 6px 0px ${colors.sandShadow}` },
  pots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 16, maxWidth: 440 },
  pot: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', boxShadow: `0px 4px 0px ${colors.sandShadow}` },
  potSelected: { transform: [{ translateY: -6 }], boxShadow: `0px 0px 0px 4px ${colors.ink}, 0px 8px 0px ${colors.sandShadow}` },
  powder: { position: 'absolute', top: 10, width: 44, height: 40, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(30, 42, 79, 0.18)' },
  bowl: { width: 56, height: 20, backgroundColor: '#C8662F' },
});
