import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { playSound, starSound } from '@/audio/sound';
import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { OutlinedText } from '@/components/OutlinedText';
import { Star } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { FRIEND_ART, FRIEND_RATIO, SNACK_ART, TRAIN_ART } from '@/data/art';
import type { Puzzle } from '@/data/puzzles';
import { openPuzzle } from '@/navigation';
import { useCatalog, usePuzzle } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

/** Slowly turning sun rays behind everything. */
function Sunburst() {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.set(withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1));
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get()}deg` }] }));
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a0 = (i * 20 * Math.PI) / 180;
    const a1 = ((i * 20 + 10) * Math.PI) / 180;
    return `M500 500 L${500 + 700 * Math.cos(a0)} ${500 + 700 * Math.sin(a0)} L${500 + 700 * Math.cos(a1)} ${500 + 700 * Math.sin(a1)} Z`;
  }).join(' ');
  return (
    <Animated.View pointerEvents="none" style={[styles.burst, style]}>
      <Svg width={1000} height={1000}>
        <Path d={rays} fill="rgba(255, 255, 255, 0.34)" />
      </Svg>
    </Animated.View>
  );
}

/** What goes in the photo card: the finished picture, the friends, the snacks or the train. */
function Showcase({ puzzle, width: PHOTO_W }: { puzzle: Puzzle; width: number }) {
  const { getPicture } = useCatalog();
  const picture = (id: string) => {
    const p = getPicture(id);
    return <Image source={p.image} style={{ width: PHOTO_W, height: (PHOTO_W * p.height) / p.width, borderRadius: 12 }} accessibilityLabel={p.title} />;
  };
  const row = (items: ImageSourcePropType[], size: number, h = size, bg: string = colors.white) => (
    <View style={[styles.showRow, { width: PHOTO_W, backgroundColor: bg }]}>
      {items.map((src, i) => (
        <Image key={i} source={src} style={{ width: size, height: h }} />
      ))}
    </View>
  );
  switch (puzzle.kind) {
    case 'jigsaw':
    case 'slide':
      return picture(puzzle.picture);
    case 'shadow': {
      const friends = puzzle.friends;
      const size = Math.min(96, (PHOTO_W - 16) / friends.length);
      return row(friends.map((f) => FRIEND_ART[f]), size, size * FRIEND_RATIO, '#A8E6FF');
    }
    case 'memory': {
      const snacks = puzzle.snacks;
      return row(snacks.map((sn) => SNACK_ART[sn]), Math.min(84, (PHOTO_W - 16) / snacks.length), undefined, '#FFC2CF');
    }
    case 'tracks':
      return row([TRAIN_ART.station, TRAIN_ART.engine, TRAIN_ART.stall], Math.min(92, (PHOTO_W - 16) / 3), undefined, '#A8E07F');
    default:
      return null;
  }
}

const PIP = require('@/assets/images/game/pip.png');

/** Pip shares one fun fact about what was in the puzzle. */
function PipFact({ fact }: { fact: string }) {
  return (
    <Animated.View entering={ZoomIn.delay(1100).springify()} style={styles.fact} accessible accessibilityLabel={`Pip's fact: ${fact}`}>
      <Txt weight="extrabold" size={13} color={colors.coralShadow}>PIP&apos;S FACT</Txt>
      <Txt weight="semibold" size={16} align="center">{fact}</Txt>
      <View style={styles.factTail} />
    </Animated.View>
  );
}

/** Each earned star pops with a rising note as it appears, then a little fanfare. */
function FinishSounds({ stars }: { stars: number }) {
  useEffect(() => {
    const timers = [
      ...Array.from({ length: stars }, (_, i) => setTimeout(() => starSound(i), 230 + i * 250)),
      setTimeout(() => playSound('cheer'), 300 + stars * 250),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stars]);
  return null;
}

export default function Complete() {
  const { id, stars: starsParam } = useLocalSearchParams<{ id: string; stars?: string }>();
  const { stars } = useProgress();
  const { puzzleAfter } = useCatalog();
  const puzzle = usePuzzle(id);
  // Shorter phones get a smaller photo and tighter spacing, so the buttons always fit.
  const { height } = useWindowDimensions();
  const compact = height < 820;
  const photoW = compact ? Math.max(190, Math.min(300, Math.round(height * 0.3))) : 300;
  if (!puzzle || puzzle.kind === 'maze') return <Redirect href="/map" />;

  const count = Math.min(3, Math.max(1, Number(starsParam) || 3));
  const next = puzzleAfter(puzzle.id, stars);

  return (
    <View style={styles.screen}>
      <Sunburst />
      <SafeAreaView style={styles.safe}>
        <View style={[styles.title, compact && { marginTop: 10 }]}>
          <OutlinedText size={puzzle.cheer.length > 12 ? 40 : 52}>{puzzle.cheer}</OutlinedText>
        </View>

        <View style={styles.stars} accessible accessibilityLabel={`${count} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              entering={ZoomIn.delay(150 + i * 250).springify()}
              style={i === 1 ? null : { transform: [{ translateY: 18 }, { rotate: i === 0 ? '-14deg' : '14deg' }] }}>
              <Star filled={i < count} size={(i === 1 ? 96 : 74) * (compact ? 0.78 : 1)} outline={colors.ink} />
            </Animated.View>
          ))}
        </View>

        <View style={[styles.photo, compact && { marginTop: 12 }]}>
          <Showcase puzzle={puzzle} width={photoW} />
        </View>

        <View style={[styles.nameCard, compact && { marginTop: 12, paddingVertical: 6 }]}>
          <Txt weight="display" size={26} align="center">{puzzle.title}</Txt>
          <Txt weight="semibold" size={16} color={colors.inkSoft} align="center">{puzzle.blurb}</Txt>
        </View>

        {puzzle.fact ? (
          <View style={styles.factRow}>
            <PipFact fact={puzzle.fact} />
            <Image source={PIP} style={styles.pipTelling} accessibilityElementsHidden />
          </View>
        ) : null}
        <FinishSounds stars={count} />

        <View style={[styles.buttons, compact && { marginBottom: 18 }]}>
          <CircleButton icon="home" label="Home" size={66} shadow="#D9A520" onPress={() => router.dismissTo('/')} />
          <ChunkyButton
            label="Next"
            icon="next"
            color={colors.grass}
            shadow={colors.grassShadow}
            height={86}
            width={190}
            fontSize={34}
            onPress={() => (next ? openPuzzle(next, 'replace') : router.dismissTo('/map'))}
          />
          <CircleButton icon="replay" label="Play again" size={66} shadow="#D9A520" onPress={() => openPuzzle(puzzle, 'replace')} />
        </View>
      </SafeAreaView>
      {puzzle.fact ? null : <Image source={PIP} style={styles.pip} accessibilityElementsHidden />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFD45C', overflow: 'hidden' },
  burst: { position: 'absolute', left: '50%', top: '45%', marginLeft: -500, marginTop: -500, width: 1000, height: 1000 },
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  title: { marginTop: 28 },
  stars: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  photo: { marginTop: 24, padding: 10, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 8px 0px rgba(30, 42, 79, 0.2)', transform: [{ rotate: '-3deg' }] },
  showRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 12, paddingHorizontal: 8, borderRadius: 12, overflow: 'hidden' },
  nameCard: { marginTop: 20, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 6px 0px rgba(30, 42, 79, 0.2)', maxWidth: 320 },
  buttons: { marginTop: 'auto', marginBottom: 36, flexDirection: 'row', alignItems: 'center', gap: 18 },
  factRow: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10, maxWidth: 360 },
  pipTelling: { width: 62, height: 64, marginBottom: -4, transform: [{ rotate: '8deg' }] },
  fact: {
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF6E0',
    borderWidth: 2,
    borderColor: colors.coral,
    alignItems: 'center',
    gap: 2,
  },
  factTail: { position: 'absolute', right: -9, bottom: 14, width: 16, height: 16, backgroundColor: '#FFF6E0', borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.coral, transform: [{ rotate: '-45deg' }] },
  pip: { position: 'absolute', right: -6, bottom: 170, width: 96, height: 100, transform: [{ rotate: '10deg' }] },
});
