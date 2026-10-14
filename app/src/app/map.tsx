import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleButton, Pill } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Stars } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { THUMBS } from '@/data/art';
import { KIND_LABEL, TIERS, type Picture, type Puzzle, type Tier } from '@/data/puzzles';
import { openPuzzle } from '@/navigation';
import { useCatalog } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

/** Jigsaws show their own picture on the map; other kinds show their tier's picture of that game. */
function thumbFor(p: Puzzle, getPicture: (id: string) => Picture) {
  if (p.kind === 'jigsaw') return getPicture(p.picture).image;
  const thumbs: Record<string, ImageSourcePropType> = THUMBS;
  // No Hard shadow picture (say): use the closest one there is.
  return thumbs[`${p.kind}-${p.tier}`] ?? thumbs[p.kind] ?? Object.entries(thumbs).find(([k]) => k.startsWith(`${p.kind}-`))![1];
}
/** Chip on the tile: what kind of game it is (plain jigsaws don't need one). */
const chipFor = (p: Puzzle) => (p.kind === 'jigsaw' ? (p.spin ? 'Spin' : null) : KIND_LABEL[p.kind]);
const describe = (p: Puzzle) => `${p.title}${p.kind === 'jigsaw' ? ' jigsaw' : ''}`;

function PuzzleTile({ puzzle, size, stars, isNext }: { puzzle: Puzzle; size: number; stars: number; isNext: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isNext) pulse.set(withRepeat(withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })), -1));
  }, [isNext, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));
  const chip = chipFor(puzzle);
  const { getPicture } = useCatalog();

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
          <Image source={thumbFor(puzzle, getPicture)} style={styles.thumb} resizeMode="cover" />
          {chip ? (
            <View style={styles.chip}>
              <Txt size={12} weight="extrabold" color={colors.white}>{chip}</Txt>
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
  const { puzzlesInTier, unlockNeed, getPicture } = useCatalog();
  const need = unlockNeed(tier.id);
  const howMany = need === puzzlesInTier(previous.id).length ? `all ${need}` : `${need}`;
  return (
    <View style={styles.lockedCard} accessible accessibilityLabel={`${tier.name} puzzles, locked. Finish ${howMany} ${previous.name} puzzles to unlock.`}>
      <View style={styles.tierHead}>
        <View style={styles.tierHeadLeft}>
          <View style={[styles.badge, { backgroundColor: tier.color }]}>
            <Txt weight="display" size={20}>{tier.name}</Txt>
          </View>
          <Txt size={15} color={colors.inkBrown}>{tier.tagline}</Txt>
        </View>
        <Icon name="lock" size={24} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {puzzlesInTier(tier.id).map((p) => (
          <View key={p.id} style={styles.lockedTile}>
            <Image source={thumbFor(p, getPicture)} style={[styles.thumb, { opacity: 0.3, position: 'absolute' }]} />
            <View style={styles.lockCircle}>
              <Icon name="lock" size={16} />
            </View>
          </View>
        ))}
      </View>
      <Txt size={15} color={colors.inkBrown}>Finish {howMany} {previous.name} puzzles to unlock</Txt>
    </View>
  );
}

export default function PuzzleMap() {
  const { stars, totalStars } = useProgress();
  const { puzzlesInTier, isTierUnlocked, nextPuzzle } = useCatalog();
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
          const puzzles = puzzlesInTier(tier.id);
          if (!puzzles.length) return null; // the server has none in this tier right now
          if (!isTierUnlocked(tier.id, stars)) return <LockedTier key={tier.id} tier={tier} previous={TIERS[i - 1]} />;
          const done = puzzles.filter((p) => (stars[p.id] ?? 0) > 0).length;
          return (
            <View key={tier.id} style={styles.card}>
              <View style={styles.tierHead}>
                <View style={styles.tierHeadLeft}>
                  <View style={[styles.badge, { backgroundColor: tier.color }]}>
                    <Txt weight="display" size={20} accessibilityRole="header">{tier.name}</Txt>
                  </View>
                  <Txt size={15} color={colors.inkSoft}>{tier.tagline}</Txt>
                </View>
                <Txt weight="extrabold" size={16}>{done} of {puzzles.length} done</Txt>
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
  chip: { position: 'absolute', left: -4, top: -6, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.ink },
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
