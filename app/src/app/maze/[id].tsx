import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Image, Pressable, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { playSound, useMusic } from '@/audio/sound';
import { ChunkyButton, CircleButton, Pill } from '@/components/Buttons';
import { LevelBadge } from '@/components/GameChrome';
import { LevelParty, useLevelFinale } from '@/components/LevelParty';
import { Diya, ThemeBackdrop } from '@/components/Festive';
import { Icon, type IconName } from '@/components/Icon';
import { GateTile, HouseTile, LeverTile, RailTile, SwitchTile } from '@/components/MazeParts';
import { Stars } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { goalArt } from '@/data/art';
import { goalName, type GoalId } from '@/data/games';
import { themeFor } from '@/data/levels';
import type { MazePuzzle } from '@/data/puzzles';
import {
  findTile,
  gateIsOpen,
  initMaze,
  lanternLit,
  leverGate,
  mazeMessage,
  mazeStars,
  monkeyCell,
  stepMaze,
  tileAt,
  type Dir,
  type MazeConfig,
  type MazeState,
} from '@/game/maze';
import { useOpenPuzzle } from '@/navigation';
import { useCatalog, usePuzzle } from '@/state/catalog';
import { usePlayStats } from '@/state/playStats';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

const IMG = {
  gappu: require('@/assets/images/game/gappu-token.png'),
  chunnu: require('@/assets/images/game/chunnu-token.png'),
  cow: require('@/assets/images/game/cow-nap.png'),
  laddoo: require('@/assets/images/game/laddoo.png'),
};

export default function MazeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = usePuzzle(id);
  if (!puzzle || puzzle.kind !== 'maze') return <Redirect href="/map" />;
  return <MazeGame key={puzzle.id} puzzle={puzzle} />;
}

function MazeGame({ puzzle }: { puzzle: MazePuzzle }) {
  usePlayStats(puzzle.id);
  const cfg = puzzle.maze;
  const { puzzleAfter } = useCatalog();
  const { stars, recordStars } = useProgress();
  const openPuzzle = useOpenPuzzle();
  const theme = themeFor(puzzle.level);
  const goal = goalArt(cfg.goal);
  const goalWord = cfg.goal ? goalName(cfg.goal as GoalId) : 'jalebis';
  useMusic(theme.music);
  // Lantern Walk (Diwali Night): the maze is dark; Gappu's lantern lights the squares near him, and he
  // leaves a diya on every square he walks, so the way he came stays lit.
  const night = theme.id === 'diwali';
  const finale = useLevelFinale(puzzle.level);
  const fresh = () => ({ maze: initMaze(cfg), trail: [findTile(cfg, 'S').join(',')] });
  const [game, setGame] = useState<{ maze: MazeState; trail: string[] }>(fresh);
  const state = game.maze;
  const recorded = useRef(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const cols = cfg.map[0].length;
  const rows = cfg.map.length;
  // Fit the board between the header and the arrow pad.
  const availH = height - insets.top - insets.bottom - 72 - 56 - 196 - 48;
  const cell = Math.floor(Math.max(26, Math.min((Math.min(width, 480) - 44) / cols, availH / rows, 50)));

  const move = (dir: Dir) =>
    setGame((g) => {
      const maze = stepMaze(cfg, g.maze, dir);
      const here = maze.pos.join(',');
      return { maze, trail: g.trail.includes(here) ? g.trail : [...g.trail, here] };
    });
  const restart = () => {
    recorded.current = false;
    setGame(fresh());
  };

  // Sounds follow what each move did: a step, a bump, a laddoo, a lever, or the jalebis at last.
  const before = useRef(state);
  useEffect(() => {
    const was = before.current;
    before.current = state;
    if (state === was) return;
    if (state.won && !was.won) playSound('cheer');
    else if (state.got.length > was.got.length) playSound('collect');
    else if (state.bump > was.bump) playSound(state.got.length < was.got.length ? 'miss' : 'bump');
    else if (Object.keys(state.levers).length > Object.keys(was.levers).length || state.flip !== was.flip) playSound('click');
    else if (state.pos !== was.pos) playSound('step', 0.8);
  }, [state]);

  const message = mazeMessage(cfg, state);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  useEffect(() => {
    if (state.won && !recorded.current) {
      recorded.current = true;
      recordStars(puzzle.id, mazeStars(state));
    }
  }, [state, puzzle.id, recordStars]);

  // Swipe anywhere on the board to move one step.
  const swipe = Gesture.Pan()
    .minDistance(16)
    .onEnd((e) => {
      const dir: Dir =
        Math.abs(e.translationX) > Math.abs(e.translationY) ? (e.translationX > 0 ? 'right' : 'left') : e.translationY > 0 ? 'down' : 'up';
      scheduleOnRN(move, dir);
    });

  const next = puzzleAfter(puzzle.id, { ...stars, [puzzle.id]: Math.max(stars[puzzle.id] ?? 0, state.won ? 1 : 0) });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <ThemeBackdrop theme={theme} />
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to puzzles" onPress={() => router.back()} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt
            weight="display"
            size={26}
            accessibilityRole="header"
            color={theme.text}
            style={night ? { textShadowColor: 'rgba(5, 8, 30, 0.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } } : undefined}>
            {puzzle.title || 'Jalebi Hunt'}
          </Txt>
          <LevelBadge level={puzzle.level} />
        </View>
        <Pill>
          <Image source={IMG.laddoo} style={{ width: 34, height: 34 }} />
          <Txt weight="extrabold" size={22} accessibilityLabel={`${state.got.length} of 3 laddoos`}>{state.got.length}/3</Txt>
        </Pill>
      </View>

      <View style={styles.frame}>
        <GestureDetector gesture={swipe}>
          <View
            accessible
            accessibilityLabel="Town maze. Use the arrow buttons to move Gappu."
            style={{ width: cols * cell, height: rows * cell, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.road }}>
            <Board cfg={cfg} state={state} cell={cell} lit={night ? lanternLit(cfg, state.pos, game.trail) : null} trail={night ? game.trail : []} goal={goal} houses={theme.houses} />
          </View>
        </GestureDetector>
      </View>

      <View style={styles.messageRow}>
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Txt size={15} align="center">{message}</Txt>
        </View>
      </View>

      <View style={styles.pad}>
        <PadButton icon="up" label="Move up" onPress={() => move('up')} />
        <View style={styles.padRow}>
          <PadButton icon="left" label="Move left" onPress={() => move('left')} />
          <View style={styles.padCenter} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Image source={IMG.gappu} style={{ width: 46, height: 46 }} />
          </View>
          <PadButton icon="right" label="Move right" onPress={() => move('right')} />
        </View>
        <PadButton icon="down" label="Move down" onPress={() => move('down')} />
      </View>

      {state.won ? (
        <View style={styles.scrim}>
          <Animated.View entering={ZoomIn.duration(260)} style={styles.winCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Image source={IMG.gappu} style={{ width: 88, height: 88 }} />
              <Image source={goal} style={{ width: 72, height: 72 }} />
            </View>
            <Txt weight="display" size={30} align="center" accessibilityRole="header">
              {puzzle.cheer || 'Yum!'} Gappu found the {goalWord}!
            </Txt>
            <Stars count={mazeStars(state)} size={42} />
            {mazeStars(state) < 3 ? (
              <Txt size={15} weight="semibold" color={colors.inkSoft} align="center">Collect all 3 laddoos on the way for 3 stars.</Txt>
            ) : null}
            {puzzle.fact ? (
              <View style={styles.fact} accessible accessibilityLabel={`Pip's fact: ${puzzle.fact}`}>
                <Txt weight="extrabold" size={12} color={colors.coralShadow}>PIP&apos;S FACT</Txt>
                <Txt weight="semibold" size={15} align="center">{puzzle.fact}</Txt>
              </View>
            ) : null}
            <ChunkyButton
              label="Next"
              icon="next"
              color={colors.grass}
              shadow={colors.grassShadow}
              height={66}
              width="100%"
              onPress={() => (next ? openPuzzle(next, 'replace') : router.back())}
            />
            <ChunkyButton icon="replay" label="Play again" fontSize={18} height={54} color={colors.white} shadow={colors.sandShadow} onPress={restart} />
          </Animated.View>
        </View>
      ) : null}
      {state.won && finale.show ? <LevelParty level={puzzle.level} onClose={finale.close} /> : null}
    </SafeAreaView>
  );
}

function PadButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.padButton, { boxShadow: `0px ${pressed ? 2 : 5}px 0px ${colors.sandShadow}` }, pressed && { transform: [{ translateY: 3 }] }]}>
      <Icon name={icon} size={30} />
    </Pressable>
  );
}

/** Everything drawn on the maze board, tile by tile, plus Gappu and the monkeys on top. */
function Board({
  cfg,
  state,
  cell,
  lit,
  trail,
  goal,
  houses,
}: {
  cfg: MazeConfig;
  state: MazeState;
  cell: number;
  lit: Set<string> | null;
  trail: string[];
  goal: ImageSourcePropType;
  houses: [string, string][];
}) {
  const tiles: ReactNode[] = [];
  let house = 0;
  const switchGates = Object.keys(cfg.gates).filter((G) => cfg.gates[G].openWhen !== undefined);
  const offGate = switchGates.find((G) => cfg.gates[G].openWhen === false);
  const onGate = switchGates.find((G) => cfg.gates[G].openWhen === true);

  cfg.map.forEach((row, r) =>
    row.split('').forEach((t, c) => {
      const at = { position: 'absolute' as const, left: c * cell, top: r * cell, width: cell, height: cell };
      const k = `${c},${r}`;
      if (t === '#') tiles.push(<View key={k} style={at}><HouseTile size={cell} index={house++} colors={houses} /></View>);
      else if (t === 'R') tiles.push(<View key={k} style={at}><RailTile size={cell} /></View>);
      else if (cfg.gates[t]) {
        const g = cfg.gates[t];
        const onRail = tileAt(cfg, c - 1, r) === 'R' || tileAt(cfg, c + 1, r) === 'R';
        tiles.push(
          <View key={k} style={at}>
            {onRail ? <RailTile size={cell} /> : null}
            <GateTile size={cell} color={g.color} glyph={g.glyph} open={gateIsOpen(cfg, t, state)} />
          </View>,
        );
      } else if (leverGate(cfg, t)) {
        const g = cfg.gates[leverGate(cfg, t)!];
        tiles.push(<View key={k} style={at}><LeverTile size={cell} color={g.color} glyph={g.glyph} on={!!state.levers[t]} /></View>);
      } else if (t === 'x' && offGate && onGate) {
        tiles.push(
          <View key={k} style={at}>
            <SwitchTile size={cell} left={cfg.gates[offGate]} right={cfg.gates[onGate]} flipped={state.flip} />
          </View>,
        );
      } else if (t === 'C') tiles.push(<Image key={k} source={IMG.cow} style={at} />);
      else if (t === 'J') tiles.push(<Goal key={k} style={at} size={cell} source={goal} />);
      else if (t === 'o' && !state.got.includes(k)) {
        tiles.push(
          <View key={k} style={[at, { alignItems: 'center', justifyContent: 'center' }]}>
            <Image source={IMG.laddoo} style={{ width: cell * 0.74, height: cell * 0.74 }} />
          </View>,
        );
      }
    }),
  );

  return (
    <>
      {tiles}
      {state.mons.map((m, i) => {
        const [c, r] = monkeyCell(cfg, m, i);
        return <Token key={`monkey-${i}`} source={IMG.chunnu} x={c * cell} y={r * cell} size={cell} />;
      })}
      {lit ? (
        <>
          {trail.map((k) => {
            const [c, r] = k.split(',').map(Number);
            return (
              <View key={`diya-${k}`} pointerEvents="none" style={{ position: 'absolute', left: c * cell, top: r * cell, width: cell, height: cell, alignItems: 'center', justifyContent: 'center' }}>
                <Diya size={cell * 0.62} still />
              </View>
            );
          })}
          {cfg.map.flatMap((row, r) =>
            row.split('').map((_, c) =>
              lit.has(`${c},${r}`) ? null : (
                <View key={`dark-${c},${r}`} pointerEvents="none" style={{ position: 'absolute', left: c * cell, top: r * cell, width: cell, height: cell, backgroundColor: 'rgba(14, 19, 40, 0.93)' }} />
              ),
            ),
          )}
          <Lantern x={state.pos[0] * cell} y={state.pos[1] * cell} cell={cell} />
        </>
      ) : null}
      <Token source={IMG.gappu} x={state.pos[0] * cell} y={state.pos[1] * cell} size={cell} shake={state.bump} />
    </>
  );
}

/** The warm glow of Gappu's lantern, following him around the dark maze. */
function Lantern({ x, y, cell }: { x: number; y: number; cell: number }) {
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  useEffect(() => {
    tx.set(withTiming(x, { duration: 180 }));
    ty.set(withTiming(y, { duration: 180 }));
  }, [x, y, tx, ty]);
  const size = cell * 5;
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.get() - size / 2 + cell / 2 }, { translateY: ty.get() - size / 2 + cell / 2 }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-50 -50 100 100">
        <Defs>
          <RadialGradient id="lantern" cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFD86B" stopOpacity="0.45" />
            <Stop offset="0.6" stopColor="#FFB13B" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#FFB13B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle r={50} fill="url(#lantern)" />
      </Svg>
    </Animated.View>
  );
}

function Goal({ style, size, source }: { style: object; size: number; source: ImageSourcePropType }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.set(withRepeat(withSequence(withTiming(1.15, { duration: 700 }), withTiming(1, { duration: 700 })), -1));
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glow.get() }], opacity: 0.4 + (glow.get() - 1) * 3 }));
  return (
    <View style={style}>
      <Animated.View style={[{ position: 'absolute', left: size * 0.08, top: size * 0.08, width: size * 0.84, height: size * 0.84, borderRadius: size, backgroundColor: colors.sun }, glowStyle]} />
      <Image source={source} style={{ width: size, height: size }} />
    </View>
  );
}

/** Gappu or a monkey: glides to its new cell; Gappu wobbles when he bumps into something. */
function Token({ source, x, y, size, shake = 0 }: { source: ImageSourcePropType; x: number; y: number; size: number; shake?: number }) {
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  const wobble = useSharedValue(0);
  useEffect(() => {
    tx.set(withTiming(x, { duration: 180 }));
    ty.set(withTiming(y, { duration: 180 }));
  }, [x, y, tx, ty]);
  useEffect(() => {
    if (shake) wobble.set(withSequence(withTiming(-5, { duration: 60 }), withTiming(5, { duration: 60 }), withTiming(0, { duration: 60 })));
  }, [shake, wobble]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.get() + wobble.get() }, { translateY: ty.get() }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, style]}>
      <Image source={source} style={{ width: size, height: size }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fact: { alignSelf: 'stretch', alignItems: 'center', gap: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#FFF6E0', borderWidth: 2, borderColor: colors.coral },
  screen: { flex: 1, backgroundColor: colors.sand },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 },
  frame: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 24,
    backgroundColor: colors.white,
    boxShadow: `0px 6px 0px ${colors.sandShadow}`,
  },
  messageRow: { alignItems: 'center', paddingHorizontal: 16, marginTop: 14, minHeight: 44 },
  message: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, backgroundColor: colors.white, boxShadow: `0px 3px 0px ${colors.sandShadow}` },
  pad: { marginTop: 'auto', marginBottom: 12, alignItems: 'center', gap: 5 },
  padRow: { flexDirection: 'row', gap: 5 },
  padButton: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  padCenter: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1000, elevation: 1000, backgroundColor: colors.navyScrim, alignItems: 'center', justifyContent: 'center' },
  winCard: { width: 310, padding: 22, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', gap: 12 },
});
