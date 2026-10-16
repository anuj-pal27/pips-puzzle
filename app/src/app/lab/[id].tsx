import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound, starSound, useMusic } from '@/audio/sound';
import { Bit, type BitMood } from '@/components/Bit';
import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Stars } from '@/components/Stars';
import { ThingArt } from '@/components/ThingArt';
import { Txt } from '@/components/Txt';
import { bitGifts, guess, lessonById, teachOrder, teachStars, THINGS, type Example, type Guess, type Lesson, type ThingId } from '@/game/teach';
import { usePlayStats } from '@/state/playStats';
import { useProgress } from '@/state/progress';
import { colors, LAB } from '@/theme';

// Teach the Robot. The child sorts pictures into baskets ("teach"); then Bit sorts new pictures on its
// own ("Bit's turn") by copying the most alike example (src/game/teach.ts). Bit's mistakes come from the
// examples it was given, which is the lesson.

const BASKET_COLOURS = [LAB.teal, colors.coral, colors.sun];
const THINK_MS = 1300;
const SHOW_MS = 1500;

type Phase = 'teach' | 'ready' | 'bit' | 'muddle' | 'wrong' | 'done';
type Judged = { thing: ThingId; answer: number; guess: Guess };

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = id ? lessonById(id) : undefined;
  if (!lesson) return <Redirect href="/lab" />;
  return <TeachTheRobot key={lesson.id} lesson={lesson} />;
}

function TeachTheRobot({ lesson }: { lesson: Lesson }) {
  useMusic('lab');
  usePlayStats(lesson.id);
  const { labStars, recordLab } = useProgress();

  const [round, setRound] = useState(0);
  const [examples, setExamples] = useState<Example[]>(() => (lesson.rounds[0].presorted ?? []).map((e) => ({ thing: e.thing, basket: e.answer })));
  const [kept, setKept] = useState(examples.length); // examples from earlier rounds (kept when re-teaching)
  const [queue, setQueue] = useState(() => teachOrder(lesson.rounds[0], Math.random).map((t) => t.thing));
  const [phase, setPhase] = useState<Phase>(lesson.rounds[0].teach.length ? 'teach' : 'ready');
  const [retries, setRetries] = useState(0);
  const [judged, setJudged] = useState<Judged[]>([]); // Bit's answers so far this round
  const [thinking, setThinking] = useState<ThingId | null>(null);
  const [earned, setEarned] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const current = lesson.rounds[round];
  const presortedRound = Boolean(current.presorted);

  // ---------------------------------------------------------------- the child teaches
  const sortInto = (basket: number) => {
    const thing = queue[0];
    if (phase !== 'teach' || !thing) return;
    playSound('drop');
    setExamples((ex) => [...ex, { thing, basket }]);
    const rest = queue.slice(1);
    setQueue(rest);
    if (!rest.length) later(500, () => setPhase('ready'));
  };

  // ---------------------------------------------------------------- Bit's turn
  const bitsTurn = () => {
    setPhase('bit');
    setJudged([]);
    const tests = current.test;
    let at = 300;
    tests.forEach((t, k) => {
      later(at, () => {
        setThinking(t.thing);
        playSound('bitThink', 0.8);
      });
      at += THINK_MS;
      later(at, () => {
        const g = guess(examples, t.thing);
        setThinking(null);
        setJudged((j) => [...j, { thing: t.thing, answer: t.answer, guess: g }]);
        playSound(g.basket === t.answer ? 'bitYes' : 'bitOops');
        if (k === tests.length - 1) later(SHOW_MS, () => finishRound([...tests.map((x) => ({ thing: x.thing, answer: x.answer, guess: guess(examples, x.thing) }))]));
      });
      at += SHOW_MS;
    });
  };

  const finishRound = (results: Judged[]) => {
    const allRight = results.every((r) => r.guess.basket === r.answer);
    if (lesson.muddle && round === 0) return setPhase('muddle');
    if (!allRight) return setPhase('wrong');
    if (round + 1 < lesson.rounds.length) return startRound(round + 1, examples);
    const stars = teachStars(retries);
    recordLab(lesson.id, stars);
    setEarned(stars);
    setPhase('done');
  };

  const startRound = (r: number, base: Example[]) => {
    const next = lesson.rounds[r];
    const withPresorted = [...base, ...(next.presorted ?? []).map((e) => ({ thing: e.thing, basket: e.answer }))];
    setRound(r);
    setExamples(withPresorted);
    setKept(withPresorted.length);
    setQueue(teachOrder(next, Math.random).map((t) => t.thing));
    setJudged([]);
    setPhase(next.teach.length ? 'teach' : 'ready');
  };

  const teachAgain = () => {
    setRetries((n) => n + 1);
    setExamples((ex) => ex.slice(0, kept));
    setQueue(teachOrder(current, Math.random).map((t) => t.thing));
    setJudged([]);
    setPhase(current.teach.length ? 'teach' : 'ready');
  };

  const playAgain = () => {
    timers.current.forEach(clearTimeout);
    setRetries(0);
    setEarned(0);
    startRound(0, []);
  };

  // ---------------------------------------------------------------- what Bit says
  const last = judged[judged.length - 1];
  const name = (b: number | null) => (b === null ? '' : lesson.baskets[b].label);
  let mood: BitMood = 'idle';
  let says = lesson.question;
  if (phase === 'teach' && presortedRound === false && round > 0) says = 'Teach me with these new pictures!';
  if (phase === 'ready') {
    says = presortedRound ? 'Someone already taught me with these pictures. Let me try!' : "Thank you! Now it's my turn to sort.";
    mood = 'happy';
  }
  if (phase === 'bit') {
    if (thinking) {
      mood = 'think';
      says = 'Hmm… let me think…';
    } else if (last) {
      const right = last.guess.basket === last.answer;
      mood = right ? 'happy' : 'oops';
      says =
        last.guess.basket === null
          ? "I'm not sure! Nothing I learned looks like this."
          : `${name(last.guess.basket)}! It looks like the ${THINGS[last.guess.because!].name.toLowerCase()} you showed me.`;
    }
  }
  if (phase === 'muddle') {
    mood = 'oops';
    says = lesson.muddle!.says;
  }
  if (phase === 'wrong') {
    mood = 'oops';
    says = 'Oops! I got some wrong. I copy the pictures you show me, so some must be in the wrong basket. Teach me again?';
  }
  if (phase === 'done') {
    mood = 'happy';
    says = 'I learned it! Thank you!';
  }

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(says);
  }, [says]);

  const card = phase === 'teach' ? queue[0] : phase === 'bit' ? (thinking ?? last?.thing) : undefined;
  const wrongOnes = judged.filter((j) => j.guess.basket !== j.answer);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to the lab" shadow={LAB.line} onPress={() => (router.canGoBack() ? router.back() : router.replace('/lab'))} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Txt weight="display" size={24} accessibilityRole="header" numberOfLines={1}>{lesson.title}</Txt>
          <View style={styles.stepChip}>
            <Txt weight="extrabold" size={13} color={colors.white}>{phase === 'teach' ? 'You teach' : phase === 'bit' || phase === 'ready' ? "Bit's turn" : 'Learn with Bit'}</Txt>
          </View>
        </View>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} bounces={false}>
        <View style={styles.hero}>
          <Bit size={84} mood={mood} gifts={bitGifts(labStars)} />
          <View style={styles.bubble} accessibilityLiveRegion="polite">
            <Txt weight="bold" size={16}>{says}</Txt>
            <View style={styles.bubbleTail} />
          </View>
        </View>

        {/* the picture being sorted (by the child, or by Bit) */}
        <View style={styles.stage}>
          {card ? (
            <Animated.View key={`${phase}-${card}-${judged.length}`} entering={ZoomIn.springify()} style={[styles.card, phase === 'bit' && !thinking && last && (last.guess.basket === last.answer ? styles.cardRight : styles.cardWrong)]}>
              <ThingArt id={card} size={118} />
              <Txt weight="extrabold" size={16}>{THINGS[card].name}</Txt>
              {phase === 'bit' && !thinking && last ? (
                <View style={[styles.verdict, { backgroundColor: last.guess.basket === last.answer ? colors.green : colors.coral }]}>
                  <Icon name={last.guess.basket === last.answer ? 'check' : 'close'} size={20} color={colors.white} />
                </View>
              ) : null}
            </Animated.View>
          ) : phase === 'ready' ? (
            <ChunkyButton icon="play" label="Your turn, Bit!" color={LAB.teal} shadow={LAB.tealShadow} height={70} fontSize={24} onPress={bitsTurn} />
          ) : phase === 'muddle' ? (
            <ChunkyButton icon="next" label="Teach Bit more" color={colors.sun} shadow={colors.sunShadow} height={70} fontSize={24} onPress={() => startRound(round + 1, examples)} />
          ) : phase === 'wrong' ? (
            <View style={{ gap: 10, alignItems: 'center' }}>
              {wrongOnes.map((w) => (
                <View key={w.thing} style={styles.why}>
                  <ThingArt id={w.thing} size={44} />
                  <Txt size={14} weight="semibold" style={{ flexShrink: 1 }}>
                    {w.guess.basket === null
                      ? `Bit didn't know where the ${THINGS[w.thing].name.toLowerCase()} goes.`
                      : `Bit put the ${THINGS[w.thing].name.toLowerCase()} in ${name(w.guess.basket)} because it looked like this:`}
                  </Txt>
                  {w.guess.because ? <ThingArt id={w.guess.because} size={44} /> : null}
                </View>
              ))}
              <ChunkyButton icon="replay" label="Teach again" color={colors.sun} shadow={colors.sunShadow} height={64} fontSize={22} onPress={teachAgain} />
            </View>
          ) : null}
        </View>

        {/* the baskets */}
        <View style={styles.baskets}>
          {lesson.baskets.map((b, i) => {
            const inside = examples.filter((e) => e.basket === i);
            const bitPick = judged.filter((j) => j.guess.basket === i);
            return (
              <Pressable
                key={b.label}
                accessibilityRole="button"
                accessibilityLabel={`${b.label} basket${inside.length ? `: ${inside.map((e) => THINGS[e.thing].name).join(', ')}` : ''}`}
                accessibilityState={{ disabled: phase !== 'teach' }}
                onPress={() => sortInto(i)}
                style={({ pressed }) => [
                  styles.basket,
                  { borderColor: BASKET_COLOURS[i] },
                  phase === 'teach' && { boxShadow: `0px ${pressed ? 2 : 6}px 0px ${BASKET_COLOURS[i]}` },
                  pressed && phase === 'teach' && { transform: [{ translateY: 4 }] },
                ]}>
                <View style={[styles.basketTop, { backgroundColor: BASKET_COLOURS[i] }, lesson.baskets.length > 2 && { flexDirection: 'column', gap: 0 }]}>
                  <ThingArt id={b.icon} size={30} />
                  <Txt weight="display" size={lesson.baskets.length > 2 ? 16 : 20} color={colors.ink} numberOfLines={1} adjustsFontSizeToFit>{b.label}</Txt>
                </View>
                <View style={styles.basketInside}>
                  {inside.map((e) => (
                    <Animated.View key={`t-${e.thing}`} entering={ZoomIn.springify()}>
                      <ThingArt id={e.thing} size={lesson.baskets.length > 2 ? 30 : 36} />
                    </Animated.View>
                  ))}
                  {bitPick.map((j) => (
                    <Animated.View key={`b-${j.thing}`} entering={ZoomIn.springify()} style={styles.bitPick}>
                      <ThingArt id={j.thing} size={lesson.baskets.length > 2 ? 30 : 36} />
                    </Animated.View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
        {phase === 'teach' ? (
          <Txt size={14} weight="semibold" color={colors.inkSoft} align="center">Tap the basket where it belongs. {queue.length} to go!</Txt>
        ) : null}
      </ScrollView>

      {phase === 'done' ? <LessonCard lesson={lesson} stars={earned} gifts={bitGifts(labStars)} onAgain={playAgain} /> : null}
    </SafeAreaView>
  );
}

/** The end of a lesson: what the child taught Bit, a badge, and a line for grown-ups. */
function LessonCard({ lesson, stars, gifts, onAgain }: { lesson: Lesson; stars: number; gifts: ReturnType<typeof bitGifts>; onAgain: () => void }) {
  useEffect(() => {
    const t = [...Array.from({ length: stars }, (_, i) => setTimeout(() => starSound(i), 350 + i * 250)), setTimeout(() => playSound('cheer'), 450 + stars * 250)];
    return () => t.forEach(clearTimeout);
  }, [stars]);
  return (
    <View style={styles.scrim}>
      <Animated.View entering={ZoomIn.springify()} style={styles.doneCard}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 10, padding: 20 }}>
          <Bit size={96} mood="happy" gifts={gifts} />
          <Txt weight="display" size={30} align="center" accessibilityRole="header">{lesson.card.title}</Txt>
          <Stars count={stars} size={36} />
          <Txt weight="bold" size={17} align="center">{lesson.card.line}</Txt>
          <Animated.View entering={FadeIn.delay(600)} style={styles.badgeWon}>
            <View style={styles.medal}>
              <ThingArt id={lesson.icon} size={38} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Txt weight="extrabold" size={13} color={colors.coralShadow}>NEW BADGE</Txt>
              <Txt weight="display" size={20}>{lesson.badge.name}</Txt>
            </View>
          </Animated.View>
          <View style={styles.grownUps}>
            <Txt weight="extrabold" size={12} color={colors.inkSoft}>FOR GROWN-UPS</Txt>
            <Txt size={14} color={colors.inkSoft}>{lesson.card.grownUps}</Txt>
          </View>
          <ChunkyButton icon="next" label="Back to the lab" color={LAB.teal} shadow={LAB.tealShadow} height={62} width="100%" fontSize={22} onPress={() => (router.canGoBack() ? router.back() : router.replace('/lab'))} />
          <ChunkyButton icon="replay" label="Teach again" color={colors.white} shadow={LAB.line} height={52} width="100%" fontSize={18} onPress={onAgain} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LAB.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, gap: 10 },
  stepChip: { paddingHorizontal: 10, borderRadius: 999, backgroundColor: LAB.tealShadow },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, maxWidth: 520, width: '100%', alignSelf: 'center', flexGrow: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bubble: { flex: 1, padding: 12, borderRadius: 20, backgroundColor: LAB.card, borderWidth: 2, borderColor: LAB.line, minHeight: 64, justifyContent: 'center' },
  bubbleTail: { position: 'absolute', left: -9, top: 26, width: 16, height: 16, backgroundColor: LAB.card, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: LAB.line, transform: [{ rotate: '45deg' }] },
  stage: { minHeight: 196, alignItems: 'center', justifyContent: 'center' },
  card: { width: 170, paddingVertical: 10, borderRadius: 26, backgroundColor: LAB.card, alignItems: 'center', borderWidth: 3, borderColor: colors.sun, boxShadow: `0px 6px 0px ${colors.sunShadow}` },
  cardRight: { borderColor: colors.green, boxShadow: '0px 6px 0px #1F7A4F' },
  cardWrong: { borderColor: colors.coral, boxShadow: `0px 6px 0px ${colors.coralShadow}` },
  verdict: { position: 'absolute', right: -10, top: -10, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white },
  why: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 16, backgroundColor: LAB.card, borderWidth: 2, borderColor: colors.coral, maxWidth: 420 },
  baskets: { flexDirection: 'row', gap: 10 },
  basket: { flex: 1, minHeight: 150, borderRadius: 22, borderWidth: 3, backgroundColor: LAB.card, overflow: 'hidden' },
  basketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 4 },
  basketInside: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', padding: 6, gap: 2 },
  bitPick: { borderRadius: 10, borderWidth: 2, borderColor: LAB.teal, backgroundColor: '#E9FBF7' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.navyScrim, alignItems: 'center', justifyContent: 'center', padding: 16 },
  doneCard: { width: '100%', maxWidth: 420, maxHeight: '96%', borderRadius: 32, backgroundColor: LAB.card },
  badgeWon: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', padding: 10, borderRadius: 20, backgroundColor: '#FFF6D6', borderWidth: 2, borderColor: colors.sun },
  medal: { width: 54, height: 54, borderRadius: 27, backgroundColor: LAB.card, borderWidth: 3, borderColor: colors.sun, alignItems: 'center', justifyContent: 'center' },
  grownUps: { alignSelf: 'stretch', padding: 10, borderRadius: 16, backgroundColor: LAB.bg, gap: 2 },
});
