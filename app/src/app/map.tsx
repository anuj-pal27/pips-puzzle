import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleButton, Pill } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Stars } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { isTierUnlocked, nextPuzzle, PICTURES, puzzlesInTier, TIERS, type Puzzle, type Tier } from '@/data/puzzles';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

const MAZE_THUMB = require('@/assets/images/game/maze-thumb.png');

function openPuzzle(p: Puzzle) {
  if (p.kind === 'maze') router.push({ pathname: '/maze/[id]', params: { id: p.id } });
  else router.push({ pathname: '/puzzle/[id]', params: { id: p.id } });
}

function describe(p: Puzzle) {
  return p.kind === 'maze' ? 'Jalebi maze hunt' : PICTURES[p.picture].title;
}

function PuzzleTile({ puzzle, size, stars, isNext }: { puzzle: Puzzle; size: number; stars: number; isNext: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isNext) pulse.set(withRepeat(withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })), -1));
  }, [isNext, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));
  const thumb = puzzle.kind === 'maze' ? MAZE_THUMB : PICTURES[puzzle.picture].image;

  return (
    <View style={{ width: size, alignItems: 'center', gap: 4 }}>
      <Animated.View style={pulseStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Puzzle ${puzzle.order}: ${describe(puzzle)}${stars ? `, ${stars} stars` : isNext ? '. Play next' : ''}`}
          onPress={() => openPuzzle(puzzle)}
          style={({ pressed }) => [
            styles.tile,
            { width: size, height: size },
            isNext ? styles.tileNext : null,
            pressed && { transform: [{ translateY: 3 }] },
          ]}>
          <Image source={thumb} style={styles.thumb} resizeMode="cover" />
          {puzzle.kind === 'maze' ? (
            <View style={styles.mazeChip}>
              <Txt size={12} weight="extrabold" color={colors.white}>Maze</Txt>
            </View>
          ) : null}
          {isNext ? (
            <View style={styles.playBadge}>
              <Icon name="play" size={22} />
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
      <Stars count={stars} size={20} />
    </View>
  );
}

function LockedTier({ tier, previous }: { tier: Tier; previous: Tier }) {
  return (
    <View style={styles.lockedCard} accessible accessibilityLabel={`${tier.name} puzzles, locked. Finish all 5 ${previous.name} puzzles to unlock.`}>
      <View style={styles.tierHead}>
        <View style={styles.tierHeadLeft}>
          <View style={[styles.badge, { backgroundColor: tier.color }]}>
            <Txt weight="display" size={20}>{tier.name}</Txt>
          </View>
          <Txt size={15} color={colors.inkBrown}>{tier.pieces} pieces</Txt>
        </View>
        <Icon name="lock" size={24} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {puzzlesInTier(tier.id).map((p) => (
          <View key={p.id} style={styles.lockedTile}>
            {p.kind === 'maze' ? <Image source={MAZE_THUMB} style={[styles.thumb, { opacity: 0.35, position: 'absolute' }]} /> : null}
            <View style={styles.lockCircle}>
              <Icon name="lock" size={16} />
            </View>
          </View>
        ))}
      </View>
      <Txt size={15} color={colors.inkBrown}>Finish all 5 {previous.name} puzzles to unlock</Txt>
    </View>
  );
}

export default function PuzzleMap() {
  const { stars, totalStars } = useProgress();
  const { width } = useWindowDimensions();
  const cardInner = Math.min(width, 480) - 40 - 28;
  const tile = Math.min(104, Math.floor((cardInner - 22) / 3));
  const next = nextPuzzle(stars);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to home" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Txt weight="display" size={24} numberOfLines={1}>Jalebi Junction</Txt>
        <Pill>
          <Icon name="star" size={28} color={colors.sunShadow} />
          <Txt weight="extrabold" size={22} accessibilityLabel={`${totalStars} stars`}>{totalStars}</Txt>
        </Pill>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {TIERS.map((tier, i) => {
          if (!isTierUnlocked(tier.id, stars)) return <LockedTier key={tier.id} tier={tier} previous={TIERS[i - 1]} />;
          const puzzles = puzzlesInTier(tier.id);
          const done = puzzles.filter((p) => (stars[p.id] ?? 0) > 0).length;
          return (
            <View key={tier.id} style={styles.card}>
              <View style={styles.tierHead}>
                <View style={styles.tierHeadLeft}>
                  <View style={[styles.badge, { backgroundColor: tier.color }]}>
                    <Txt weight="display" size={20} accessibilityRole="header">{tier.name}</Txt>
                  </View>
                  <Txt size={15} color={colors.inkSoft}>{tier.pieces} pieces</Txt>
                </View>
                <Txt weight="extrabold" size={16}>{done} of 5 done</Txt>
              </View>
              <View style={styles.tiles}>
                {puzzles.map((p) => (
                  <PuzzleTile key={p.id} puzzle={p} size={tile} stars={stars[p.id] ?? 0} isNext={next?.id === p.id} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 480, alignSelf: 'center' },
  card: { padding: 14, borderRadius: 26, backgroundColor: colors.white, boxShadow: `0px 6px 0px ${colors.sandShadow}`, gap: 12 },
  lockedCard: { padding: 14, borderRadius: 26, backgroundColor: colors.lockedCard, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.sandShadow, gap: 10 },
  tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tierHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 14, paddingVertical: 2, borderRadius: 999 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 11, rowGap: 10 },
  tile: { padding: 5, borderRadius: 22, backgroundColor: colors.sand, boxShadow: `0px 4px 0px ${colors.sandShadow}` },
  tileNext: { backgroundColor: colors.sun, boxShadow: `0px 0px 0px 4px ${colors.white}, 0px 0px 0px 6px ${colors.sun}, 0px 8px 0px ${colors.sunShadow}` },
  thumb: { width: '100%', height: '100%', borderRadius: 17 },
  mazeChip: { position: 'absolute', left: -4, top: -6, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.ink },
  playBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 0px rgba(30, 42, 79, 0.25)',
  },
  lockedTile: { flex: 1, height: 54, borderRadius: 16, backgroundColor: colors.lockedTile, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lockCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
