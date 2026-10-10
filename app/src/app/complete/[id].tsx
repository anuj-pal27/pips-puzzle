import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { OutlinedText } from '@/components/OutlinedText';
import { Star } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { FRIEND_ART, FRIEND_RATIO, SNACK_ART, TRAIN_ART } from '@/data/art';
import { SHADOW_GAMES, SNAP_GAMES } from '@/data/games';
import { getPuzzle, PICTURES, puzzleAfter, type Puzzle } from '@/data/puzzles';
import { openPuzzle } from '@/navigation';
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

const PHOTO_W = 300;

/** What goes in the photo card: the finished picture, the friends, the snacks or the train. */
function Showcase({ puzzle }: { puzzle: Puzzle }) {
  const picture = (id: string) => {
    const p = PICTURES[id];
    return <Image source={p.image} style={{ width: PHOTO_W, height: (PHOTO_W * p.height) / p.width, borderRadius: 12 }} accessibilityLabel={p.title} />;
  };
  const row = (items: ImageSourcePropType[], size: number, h = size, bg: string = colors.white) => (
    <View style={[styles.showRow, { backgroundColor: bg }]}>
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
      const friends = SHADOW_GAMES[puzzle.game].friends;
      const size = Math.min(96, (PHOTO_W - 16) / friends.length);
      return row(friends.map((f) => FRIEND_ART[f]), size, size * FRIEND_RATIO, '#A8E6FF');
    }
    case 'memory': {
      const snacks = SNAP_GAMES[puzzle.game].snacks;
      return row(snacks.map((sn) => SNACK_ART[sn]), Math.min(84, (PHOTO_W - 16) / snacks.length), undefined, '#FFC2CF');
    }
    case 'tracks':
      return row([TRAIN_ART.station, TRAIN_ART.engine, TRAIN_ART.stall], 92, 92, '#A8E07F');
    default:
      return null;
  }
}

export default function Complete() {
  const { id, stars: starsParam } = useLocalSearchParams<{ id: string; stars?: string }>();
  const { stars } = useProgress();
  const puzzle = getPuzzle(id);
  if (!puzzle || puzzle.kind === 'maze') return <Redirect href="/map" />;

  const count = Math.min(3, Math.max(1, Number(starsParam) || 3));
  const next = puzzleAfter(puzzle.id, stars);

  return (
    <View style={styles.screen}>
      <Sunburst />
      <SafeAreaView style={styles.safe}>
        <View style={styles.title}>
          <OutlinedText size={puzzle.cheer.length > 12 ? 40 : 52}>{puzzle.cheer}</OutlinedText>
        </View>

        <View style={styles.stars} accessible accessibilityLabel={`${count} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              entering={ZoomIn.delay(150 + i * 250).springify()}
              style={i === 1 ? null : { transform: [{ translateY: 18 }, { rotate: i === 0 ? '-14deg' : '14deg' }] }}>
              <Star filled={i < count} size={i === 1 ? 96 : 74} outline={colors.ink} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.photo}>
          <Showcase puzzle={puzzle} />
        </View>

        <View style={styles.nameCard}>
          <Txt weight="display" size={26} align="center">{puzzle.title}</Txt>
          <Txt weight="semibold" size={16} color={colors.inkSoft} align="center">{puzzle.blurb}</Txt>
        </View>

        <View style={styles.buttons}>
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
      <Image source={require('@/assets/images/game/pip.png')} style={styles.pip} accessibilityElementsHidden />
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
  showRow: { width: PHOTO_W, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 12, paddingHorizontal: 8, borderRadius: 12, overflow: 'hidden' },
  nameCard: { marginTop: 20, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 6px 0px rgba(30, 42, 79, 0.2)', maxWidth: 320 },
  buttons: { marginTop: 'auto', marginBottom: 36, flexDirection: 'row', alignItems: 'center', gap: 18 },
  pip: { position: 'absolute', right: -6, bottom: 170, width: 96, height: 100, transform: [{ rotate: '10deg' }] },
});
