import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { playSound } from '@/audio/sound';
import { Pill } from '@/components/Buttons';
import { GameHeader, TipBubble, useFinish } from '@/components/GameChrome';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { GAPPU_FACE, SNACK_ART } from '@/data/art';
import { SNACK_NAMES, type SnackId } from '@/data/games';
import type { MemoryPuzzle } from '@/data/puzzles';
import { flipCard, memoryDone, memoryStars, newMemory, pairResult, settle, type MemoryState } from '@/game/memory';
import { usePuzzle } from '@/state/catalog';
import { usePlayStats } from '@/state/playStats';
import { colors } from '@/theme';

// Snack Snap: flip two cards at a time and find the matching snacks for hungry Gappu.

type Tip = { text: string; tone: 'plain' | 'good' | 'oops' };

export default function MemoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = usePuzzle(id);
  if (!puzzle || puzzle.kind !== 'memory') return <Redirect href="/map" />;
  return <SnackSnap key={puzzle.id} puzzle={puzzle} />;
}

const plural = (s: SnackId) => (s === 'chai' ? 'cups of chai' : `${SNACK_NAMES[s].toLowerCase()}s`);

function SnackSnap({ puzzle }: { puzzle: MemoryPuzzle }) {
  usePlayStats(puzzle.id);
  const game = puzzle; // snacks and cols
  const pairs = game.snacks.length;
  const finish = useFinish(puzzle.id);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // A new deal every time the game opens.
  const [state, setState] = useState<MemoryState>(() => newMemory(game.snacks, Math.random, game.cols));
  // Easy: show every card for a moment first, so little ones get a head start.
  const [peeking, setPeeking] = useState(puzzle.tier === 'easy');
  const [tip, setTip] = useState<Tip>({ text: peeking ? 'Look! Remember where the snacks are…' : 'Find two of the same snack!', tone: 'plain' });
  const [eaten, setEaten] = useState<SnackId[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (!peeking) return;
    const t = setTimeout(() => {
      setPeeking(false);
      setTip({ text: 'Find two of the same snack!', tone: 'plain' });
    }, 2200);
    return () => clearTimeout(t);
  }, [peeking]);

  const gap = 10;
  const rows = Math.ceil(state.cards.length / game.cols);
  const availH = height - insets.top - insets.bottom - 72 - 60 - 150 - 70;
  const cardW = Math.floor(
    Math.min((Math.min(width, 480) - 40 - (game.cols - 1) * gap) / game.cols, (availH - (rows - 1) * gap) / rows / 1.22, 120),
  );
  const cardH = Math.round(cardW * 1.22);

  const tap = (i: number) => {
    if (peeking) return;
    const next = flipCard(state, i);
    if (next === state) return;
    playSound('flip');
    setState(next);
    const result = pairResult(next);
    if (!result) return;
    const snack = next.cards[i] as SnackId;
    timer.current = setTimeout(
      () => {
        const settled = settle(next);
        setState(settled);
        if (result === 'match') {
          playSound('match');
          setEaten((e) => [...e, snack]);
          if (memoryDone(settled)) {
            setTip({ text: 'All the snacks are found!', tone: 'good' });
            finish(memoryStars(pairs, settled.mismatches), 1000);
          } else {
            setTip({ text: `Yum! Two ${plural(snack)}!`, tone: 'good' });
          }
        } else {
          playSound('flip', 0.6);
          setTip({ text: 'Not a pair. Remember where they are!', tone: 'oops' });
        }
      },
      result === 'match' ? 500 : 1100,
    );
  };

  const foundPairs = state.matched.length / 2;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <GameHeader
        title="Snack Snap"
        tier={puzzle.tier}
        right={
          <Pill>
            <Image source={SNACK_ART.jalebi} style={{ width: 32, height: 32 }} />
            <Txt weight="extrabold" size={20} accessibilityLabel={`${foundPairs} of ${pairs} pairs found`}>
              {foundPairs}/{pairs}
            </Txt>
          </Pill>
        }
      />

      <View style={styles.body}>
        <View style={[styles.table, { width: game.cols * cardW + (game.cols - 1) * gap + 28 }]}>
          {state.cards.map((snack, i) => (
            <Card
              key={i}
              index={i}
              snack={snack as SnackId}
              w={cardW}
              h={cardH}
              faceUp={peeking || state.up.includes(i) || state.matched.includes(i)}
              matched={state.matched.includes(i)}
              onPress={() => tap(i)}
            />
          ))}
        </View>

        <TipBubble text={tip.text} tone={tip.tone} />
      </View>

      <Picnic eaten={eaten} total={pairs} />
    </SafeAreaView>
  );
}

/** One card: a yellow "?" back, a snack on the front. Flips by squashing sideways (works on every platform). */
function Card({
  index,
  snack,
  w,
  h,
  faceUp,
  matched,
  onPress,
}: {
  index: number;
  snack: SnackId;
  w: number;
  h: number;
  faceUp: boolean;
  matched: boolean;
  onPress: () => void;
}) {
  const p = useSharedValue(faceUp ? 1 : 0);
  const pop = useSharedValue(1);
  useEffect(() => {
    p.set(withTiming(faceUp ? 1 : 0, { duration: 260 }));
  }, [faceUp, p]);
  useEffect(() => {
    if (matched) pop.set(withSequence(withTiming(1.12, { duration: 140 }), withSpring(1)));
  }, [matched, pop]);

  // Squash the back to nothing, then grow the front (and the other way round). The hidden face is fully transparent.
  const back = useAnimatedStyle(() => ({
    opacity: p.get() < 0.5 ? 1 : 0,
    transform: [{ scale: pop.get() }, { scaleX: Math.max(0.01, 1 - 2 * p.get()) }],
  }));
  const front = useAnimatedStyle(() => ({
    opacity: p.get() > 0.5 ? 1 : 0,
    transform: [{ scale: pop.get() }, { scaleX: Math.max(0.01, 2 * p.get() - 1) }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={faceUp ? `${SNACK_NAMES[snack]}${matched ? ', matched' : ''}` : `Card ${index + 1}, face down`}
      accessibilityState={{ disabled: matched }}
      onPress={onPress}
      style={{ width: w, height: h }}>
      <Animated.View style={[styles.card, styles.cardBack, { width: w, height: h }, back]}>
        <Txt weight="display" size={w * 0.48} color={colors.white} style={styles.cardMark}>?</Txt>
      </Animated.View>
      <Animated.View style={[styles.card, styles.cardFront, matched && styles.cardMatched, { width: w, height: h }, front]}>
        <Image source={SNACK_ART[snack]} style={{ width: w * 0.8, height: w * 0.8 }} />
        {matched ? (
          <View style={styles.tick}>
            <Icon name="check" size={16} color={colors.white} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

/** Gappu's picnic at the bottom: he hops for joy and every snack pair found lands on his plate. */
function Picnic({ eaten, total }: { eaten: SnackId[]; total: number }) {
  const hop = useSharedValue(0);
  useEffect(() => {
    if (eaten.length) hop.set(withSequence(withTiming(-22, { duration: 160 }), withSpring(0, { damping: 6 })));
  }, [eaten.length, hop]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: hop.get() }] }));
  const done = eaten.length === total;
  const size = total > 4 ? 30 : 38;
  return (
    <View style={styles.picnic} accessible accessibilityLabel={`Gappu's plate: ${eaten.length ? eaten.map((s) => SNACK_NAMES[s]).join(', ') : 'empty'}`}>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.speech}>
          <Txt weight="extrabold" size={14}>{done ? 'So full!' : eaten.length ? 'Yum yum!' : "I'm hungry!"}</Txt>
        </View>
        <Animated.View style={style}>
          <Image source={GAPPU_FACE} style={{ width: 84, height: 84 }} />
        </Animated.View>
      </View>
      <View style={styles.plate}>
        {Array.from({ length: total }, (_, i) =>
          eaten[i] ? (
            <Animated.View key={i} entering={ZoomIn.springify()}>
              <Image source={SNACK_ART[eaten[i]]} style={{ width: size, height: size }} />
            </Animated.View>
          ) : (
            <View key={i} style={[styles.plateEmpty, { width: size, height: size, borderRadius: size / 2 }]} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  table: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 14,
    borderRadius: 28,
    backgroundColor: '#FFC2CF',
    boxShadow: '0px 6px 0px #E86F8C',
  },
  card: { position: 'absolute', left: 0, top: 0, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.ink },
  cardBack: { backgroundColor: colors.sun, boxShadow: `0px 4px 0px ${colors.sunShadow}` },
  cardMark: { textShadowColor: colors.sunShadow, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  cardFront: { backgroundColor: colors.white, boxShadow: '0px 4px 0px rgba(30, 42, 79, 0.25)' },
  cardMatched: { borderColor: colors.green, backgroundColor: '#E3F8D6' },
  tick: { position: 'absolute', right: 5, top: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, justifyContent: 'center' },
  picnic: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 10,
    borderRadius: 26,
    backgroundColor: colors.sandDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    maxWidth: 440,
  },
  plate: {
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 0px ${colors.sandShadow}`,
  },
  plateEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.lockedTile, transform: [{ scale: 0.8 }] },
  speech: { marginBottom: 4, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: colors.white, boxShadow: `0px 3px 0px ${colors.sandShadow}` },
});
