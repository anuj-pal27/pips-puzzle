import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Image, Pressable, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ChunkyButton, CircleButton, Pill } from '@/components/Buttons';
import { Icon, type IconName } from '@/components/Icon';
import { GateTile, HouseTile, LeverTile, RailTile, SwitchTile } from '@/components/MazeParts';
import { Stars } from '@/components/Stars';
import { Txt } from '@/components/Txt';
import { MAZES } from '@/data/mazes';
import { getPuzzle, getTier, puzzleAfter, type MazePuzzle } from '@/data/puzzles';
import {
  gateIsOpen,
  initMaze,
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
import { openPuzzle } from '@/navigation';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

const IMG = {
  gappu: require('@/assets/images/game/gappu-token.png'),
  chunnu: require('@/assets/images/game/chunnu-token.png'),
  cow: require('@/assets/images/game/cow-nap.png'),
  jalebi: require('@/assets/images/game/jalebi.png'),
  laddoo: require('@/assets/images/game/laddoo.png'),
};

export default function MazeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPuzzle(id);
  if (!puzzle || puzzle.kind !== 'maze') return <Redirect href="/map" />;
  return <MazeGame key={puzzle.id} puzzle={puzzle} />;
}

function MazeGame({ puzzle }: { puzzle: MazePuzzle }) {
  const cfg = MAZES[puzzle.maze];
  const tier = getTier(puzzle.tier);
  const { stars, recordStars } = useProgress();
  const [state, setState] = useState<MazeState>(() => initMaze(cfg));
  const recorded = useRef(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const cols = cfg.map[0].length;
  const rows = cfg.map.length;
  // Fit the board between the header and the arrow pad.
  const availH = height - insets.top - insets.bottom - 72 - 56 - 196 - 48;
  const cell = Math.floor(Math.max(26, Math.min((Math.min(width, 480) - 44) / cols, availH / rows, 50)));

  const move = (dir: Dir) => setState((s) => stepMaze(cfg, s, dir));
  const restart = () => {
    recorded.current = false;
    setState(initMaze(cfg));
  };

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
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to puzzles" onPress={() => router.back()} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt weight="display" size={26} accessibilityRole="header">Jalebi Hunt</Txt>
          <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
            <Txt weight="extrabold" size={13}>{tier.name}</Txt>
          </View>
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
            <Board cfg={cfg} state={state} cell={cell} />
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
              <Image source={IMG.jalebi} style={{ width: 72, height: 72 }} />
            </View>
            <Txt weight="display" size={30} align="center" accessibilityRole="header">Yum! Gappu got the jalebis!</Txt>
            <Stars count={mazeStars(state)} size={42} />
            <Txt size={15} weight="semibold" color={colors.inkSoft} align="center">Collect all 3 laddoos on the way for 3 stars.</Txt>
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
function Board({ cfg, state, cell }: { cfg: MazeConfig; state: MazeState; cell: number }) {
  const tiles: ReactNode[] = [];
  let house = 0;
  const switchGates = Object.keys(cfg.gates).filter((G) => cfg.gates[G].openWhen !== undefined);
  const offGate = switchGates.find((G) => cfg.gates[G].openWhen === false);
  const onGate = switchGates.find((G) => cfg.gates[G].openWhen === true);

  cfg.map.forEach((row, r) =>
    row.split('').forEach((t, c) => {
      const at = { position: 'absolute' as const, left: c * cell, top: r * cell, width: cell, height: cell };
      const k = `${c},${r}`;
      if (t === '#') tiles.push(<View key={k} style={at}><HouseTile size={cell} index={house++} /></View>);
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
      else if (t === 'J') tiles.push(<Goal key={k} style={at} size={cell} />);
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
      <Token source={IMG.gappu} x={state.pos[0] * cell} y={state.pos[1] * cell} size={cell} shake={state.bump} />
    </>
  );
}

function Goal({ style, size }: { style: object; size: number }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.set(withRepeat(withSequence(withTiming(1.15, { duration: 700 }), withTiming(1, { duration: 700 })), -1));
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glow.get() }], opacity: 0.4 + (glow.get() - 1) * 3 }));
  return (
    <View style={style}>
      <Animated.View style={[{ position: 'absolute', left: size * 0.08, top: size * 0.08, width: size * 0.84, height: size * 0.84, borderRadius: size, backgroundColor: colors.sun }, glowStyle]} />
      <Image source={IMG.jalebi} style={{ width: size, height: size }} />
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
  screen: { flex: 1, backgroundColor: colors.sand },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 },
  tierBadge: { paddingHorizontal: 10, borderRadius: 999 },
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
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.navyScrim, alignItems: 'center', justifyContent: 'center' },
  winCard: { width: 310, padding: 22, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', gap: 12 },
});
