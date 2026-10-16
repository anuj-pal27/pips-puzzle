import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound } from '@/audio/sound';
import { CircleButton, Pill } from '@/components/Buttons';
import { StringLights } from '@/components/Festive';
import { Icon } from '@/components/Icon';
import { FriendTrain } from '@/components/LevelParty';
import { PuzzleThumb } from '@/components/PuzzleThumb';
import { Stars } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { FRIEND_ART } from '@/data/art';
import { FRIEND_NAMES } from '@/data/games';
import { getLevel, LEVELS, type Level } from '@/data/levels';
import { KIND_LABEL, type Puzzle } from '@/data/puzzles';
import { useOpenPuzzle } from '@/navigation';
import { useCatalog } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

// The journey map: the Jalebi Express's stops round India, one card per level, joined by a railway.
// Open levels show their puzzles; the next locked stop shows its new friend as a mystery shadow.

/** Chip on the tile: what kind of game it is (plain jigsaws don't need one). */
const chipFor = (p: Puzzle) => (p.kind === 'jigsaw' ? (p.spin ? 'Spin' : null) : KIND_LABEL[p.kind]);
const describe = (p: Puzzle) => `${p.title}${p.kind === 'jigsaw' ? ' jigsaw' : ''}`;
const NEW_FRIENDS = LEVELS.filter((l) => l.joins).length;

function PuzzleTile({ puzzle, size, stars, isNext, night }: { puzzle: Puzzle; size: number; stars: number; isNext: boolean; night: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isNext) pulse.set(withRepeat(withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })), -1));
  }, [isNext, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));
  const chip = chipFor(puzzle);
  const { getPicture } = useCatalog();
  const open = useOpenPuzzle();

  return (
    <View style={{ width: size, alignItems: 'center', gap: 4 }}>
      <Animated.View style={pulseStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Puzzle ${puzzle.order}: ${describe(puzzle)}${stars ? `, ${stars} stars` : isNext ? '. Play next' : ''}`}
          onPress={() => {
            playSound('tap');
            open(puzzle);
          }}
          style={({ pressed }) => [
            styles.tile,
            { width: size, height: size },
            night && styles.tileNight,
            isNext ? styles.tileNext : null,
            pressed && { transform: [{ translateY: 3 }] },
          ]}>
          <PuzzleThumb puzzle={puzzle} size={size - 10} getPicture={getPicture} />
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
      <Stars count={stars} size={20} onDark={night} />
    </View>
  );
}

/** The friend a level is about, in a round frame (a dark mystery shadow while the level is locked). */
function FriendBadge({ level, size, mystery = false }: { level: Level; size: number; mystery?: boolean }) {
  return (
    <View style={[styles.friendBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: mystery ? '#E9DCC4' : level.theme.accent }]}>
      <Image
        source={FRIEND_ART[level.friend]}
        style={{ width: size * 1.05, height: size * 1.12, marginTop: size * 0.1, tintColor: mystery ? '#6B5A45' : undefined }}
        accessibilityLabel={mystery ? 'A friend you have not met yet' : FRIEND_NAMES[level.friend]}
      />
      {mystery ? (
        <View style={styles.mystery}>
          <Txt weight="display" size={size * 0.34} color={colors.white}>?</Txt>
        </View>
      ) : null}
    </View>
  );
}

/** The level's number in a round badge. */
function LevelNumber({ n, color, size = 44 }: { n: number; color: string; size?: number }) {
  return (
    <View style={[styles.levelNumber, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Txt weight="display" size={size * 0.5} color={colors.ink}>{n}</Txt>
    </View>
  );
}

/** A short piece of railway between two stops. */
function RailLink({ done }: { done: boolean }) {
  return (
    <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.railBed, done && { backgroundColor: '#C9A27A' }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.sleeper} />
        ))}
      </View>
      <View style={[styles.railLine, { left: 9 }]} />
      <View style={[styles.railLine, { right: 9 }]} />
    </View>
  );
}

function LevelCard({ level, puzzles, tile, nextId }: { level: Level; puzzles: Puzzle[]; tile: number; nextId?: string }) {
  const { stars } = useProgress();
  const { isLevelDone } = useCatalog();
  const [w, setW] = useState(0);
  const theme = level.theme;
  const night = theme.dark;
  const done = puzzles.filter((p) => (stars[p.id] ?? 0) > 0).length;
  const joined = isLevelDone(level.n, stars) && level.joins;

  return (
    <View
      style={[styles.card, { backgroundColor: night ? theme.bg : colors.white, borderColor: theme.accent }, night && styles.cardNight]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {night && w ? (
        <View pointerEvents="none" style={styles.cardLights}>
          <StringLights width={w} y={2} sag={10} />
        </View>
      ) : (
        <View pointerEvents="none" style={[styles.cardBand, { backgroundColor: theme.bg }]} />
      )}
      <View style={[styles.levelHead, night && { marginTop: 14 }]}>
        <LevelNumber n={level.n} color={theme.accent} />
        <View style={{ flex: 1 }}>
          <Txt weight="display" size={22} color={theme.text} accessibilityRole="header" numberOfLines={1}>
            {level.place}
          </Txt>
          <Txt weight="bold" size={15} color={theme.textSoft} numberOfLines={1}>{level.title}</Txt>
        </View>
        <FriendBadge level={level} size={58} />
      </View>
      <View style={styles.levelMeta}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Read the story of level ${level.n}`}
          onPress={() => {
            playSound('tap');
            router.push({ pathname: '/story/[level]', params: { level: String(level.n) } });
          }}
          style={({ pressed }) => [styles.storyButton, night && styles.storyButtonNight, pressed && { transform: [{ translateY: 2 }] }]}>
          <Icon name="book" size={18} color={night ? theme.text : colors.ink} />
          <Txt weight="extrabold" size={14} color={night ? theme.text : colors.ink}>Story</Txt>
        </Pressable>
        {joined ? (
          <View style={[styles.joined, { backgroundColor: theme.accent }]}>
            <Icon name="check" size={16} />
            <Txt weight="extrabold" size={13}>{FRIEND_NAMES[level.friend]} is on the train!</Txt>
          </View>
        ) : null}
        <Txt weight="extrabold" size={15} color={theme.text} style={{ marginLeft: 'auto' }}>
          {done} of {puzzles.length} done
        </Txt>
      </View>
      <View style={styles.tiles}>
        {puzzles.map((p) => (
          <PuzzleTile key={p.id} puzzle={p} size={tile} stars={stars[p.id] ?? 0} isNext={nextId === p.id} night={night} />
        ))}
      </View>
    </View>
  );
}

function LockedLevel({ level, before, need, first }: { level: Level; before: Level; need: number; first: boolean }) {
  if (!first) {
    return (
      <View style={styles.ticket} accessible accessibilityLabel={`Level ${level.n}, ${level.place}. Locked.`}>
        <LevelNumber n={level.n} color={colors.lockedTile} size={34} />
        <Txt weight="display" size={18} color={colors.inkBrown} style={{ flex: 1 }} numberOfLines={1}>{level.place}</Txt>
        <Icon name="lock" size={22} color={colors.inkBrown} />
      </View>
    );
  }
  return (
    <View style={styles.lockedCard} accessible accessibilityLabel={`Next stop: level ${level.n}, ${level.place}. Locked. Finish ${need} puzzles in level ${before.n} to unlock.`}>
      <View style={styles.levelHead}>
        <LevelNumber n={level.n} color={colors.lockedTile} />
        <View style={{ flex: 1 }}>
          <Txt weight="extrabold" size={14} color={colors.inkBrown}>Next stop</Txt>
          <Txt weight="display" size={22} color={colors.inkBrown} numberOfLines={1}>{level.place}</Txt>
        </View>
        <FriendBadge level={level} size={58} mystery />
      </View>
      <View style={styles.lockedRow}>
        <Icon name="lock" size={22} color={colors.inkBrown} />
        <Txt size={15} weight="semibold" color={colors.inkBrown} style={{ flex: 1 }}>
          Finish {need} puzzles in Level {before.n} to meet a new friend!
        </Txt>
      </View>
    </View>
  );
}

/** Who's on the Jalebi Express so far. */
function JourneyBanner() {
  const { stars } = useProgress();
  const { width } = useWindowDimensions();
  const { levels, isLevelDone } = useCatalog();
  const joined = LEVELS.filter((l) => l.joins && levels.includes(l.n) && isLevelDone(l.n, stars)).map((l) => l.friend);
  return (
    <View style={styles.banner}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt weight="display" size={20}>The Jalebi Express</Txt>
        <Txt weight="semibold" size={14} color={colors.inkSoft}>
          {joined.length ? `${joined.length} of ${NEW_FRIENDS} new friends are on the train!` : 'Invite a friend from every corner of India to the Mela!'}
        </Txt>
      </View>
      <FriendTrain friends={['gappu', ...joined]} size={28} maxWidth={Math.min(width, 480) - 40 - 28} />
    </View>
  );
}

export default function PuzzleMap() {
  const { stars, totalStars } = useProgress();
  const { levels, puzzlesInLevel, isLevelUnlocked, unlockNeed, nextPuzzle } = useCatalog();
  const { width } = useWindowDimensions();
  const cardInner = Math.min(width, 480) - 40 - 28;
  const tile = Math.min(104, Math.floor((cardInner - 22) / 3));
  const next = nextPuzzle(stars);
  const scroll = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  const firstLocked = levels.find((n) => !isLevelUnlocked(n, stars));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to home" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Txt weight="display" size={24} numberOfLines={1} style={{ flexShrink: 1 }}>Pip&apos;s Journey</Txt>
        <Pill>
          <Icon name="star" size={28} color={colors.sunShadow} />
          <Txt weight="extrabold" size={22} accessibilityLabel={`${totalStars} stars`}>{totalStars}</Txt>
        </Pill>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={styles.list}>
        <JourneyBanner />
        {levels.map((n, i) => {
          const level = getLevel(n);
          const unlocked = isLevelUnlocked(n, stars);
          const link = i > 0 ? <RailLink done={unlocked} /> : null;
          if (!unlocked) {
            return (
              <View key={n}>
                {link}
                <LockedLevel level={level} before={getLevel(levels[i - 1])} need={unlockNeed(n)} first={n === firstLocked} />
              </View>
            );
          }
          const isCurrent = next?.level === n && n !== levels[0];
          return (
            <View
              key={n}
              // Open the map at the level being played (the one with the "play next" puzzle).
              onLayout={
                isCurrent
                  ? (e) => {
                      if (scrolled.current) return;
                      scrolled.current = true;
                      const y = e.nativeEvent.layout.y;
                      setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 250);
                    }
                  : undefined
              }>
              {link}
              <LevelCard level={level} puzzles={puzzlesInLevel(n)} tile={tile} nextId={next?.id} />
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
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, width: '100%', maxWidth: 480, alignSelf: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingLeft: 16, borderRadius: 22, backgroundColor: colors.white, boxShadow: `0px 5px 0px ${colors.sandShadow}`, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' },
  card: { padding: 14, paddingTop: 12, borderRadius: 26, borderTopWidth: 6, boxShadow: `0px 6px 0px ${colors.sandShadow}`, gap: 10, overflow: 'hidden' },
  cardBand: { position: 'absolute', left: 0, right: 0, top: 0, height: 64 },
  cardNight: { boxShadow: '0px 6px 0px #0E1235' },
  cardLights: { position: 'absolute', left: 0, right: 0, top: 0 },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelNumber: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white },
  friendBadge: { overflow: 'hidden', alignItems: 'center', borderWidth: 3, borderColor: colors.white, boxShadow: '0px 3px 0px rgba(30, 42, 79, 0.18)' },
  mystery: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  levelMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  storyButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.sand, boxShadow: `0px 3px 0px ${colors.sandShadow}` },
  storyButtonNight: { backgroundColor: '#2E377A', boxShadow: '0px 3px 0px #0E1235' },
  joined: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 11, rowGap: 10 },
  tileNight: { backgroundColor: '#2E377A', boxShadow: '0px 4px 0px #0E1235' },
  tile: { padding: 5, borderRadius: 22, backgroundColor: colors.sand, boxShadow: `0px 4px 0px ${colors.sandShadow}` },
  tileNext: { backgroundColor: colors.sun, boxShadow: `0px 0px 0px 4px ${colors.white}, 0px 0px 0px 6px ${colors.sun}, 0px 8px 0px ${colors.sunShadow}` },
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
  lockedCard: { padding: 14, borderRadius: 26, backgroundColor: colors.lockedCard, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.sandShadow, gap: 10 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.lockedCard, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.sandShadow },
  rail: { height: 30, width: 40, alignSelf: 'center' },
  railBed: { position: 'absolute', left: 4, right: 4, top: 0, bottom: 0, backgroundColor: '#DCC3A0', justifyContent: 'space-around', paddingVertical: 2 },
  sleeper: { height: 4, marginHorizontal: -6, borderRadius: 2, backgroundColor: '#A0714A' },
  railLine: { position: 'absolute', top: 0, bottom: 0, width: 4, backgroundColor: '#5A6275' },
});
