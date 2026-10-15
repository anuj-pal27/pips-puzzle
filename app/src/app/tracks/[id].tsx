import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { playSound, useMusic } from '@/audio/sound';
import { Pill } from '@/components/Buttons';
import { Diya, ThemeBackdrop } from '@/components/Festive';
import { GameHeader, TipBubble, useFinish } from '@/components/GameChrome';
import { Txt } from '@/components/Txt';
import { SceneryArt, TrackArt } from '@/components/TrackParts';
import { TRAIN_ART } from '@/data/art';
import type { TracksPuzzle } from '@/data/puzzles';
import { themeFor } from '@/data/themes';
import { initTracks, scrambleTracks, tapPiece, traceTracks, tracksPar, tracksStars, type TrackPiece, type TrackState } from '@/game/tracks';
import { usePuzzle } from '@/state/catalog';
import { usePlayStats } from '@/state/playStats';
import { colors } from '@/theme';

// Fix the Tracks: tap track pieces to turn them until the rails join the station to the jalebi stall.
// Joined-up pieces light up as you go; when the line is complete, the train drives down it.

export default function TracksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = usePuzzle(id);
  if (!puzzle || puzzle.kind !== 'tracks') return <Redirect href="/map" />;
  return <TracksGame key={puzzle.id} puzzle={puzzle} />;
}

type Point = { x: number; y: number };

function TracksGame({ puzzle }: { puzzle: TracksPuzzle }) {
  usePlayStats(puzzle.id);
  // A new scramble every play: the same map, but the pieces start turned differently.
  const [cfg] = useState(() => scrambleTracks(puzzle.tracks, Math.random));
  const finish = useFinish(puzzle.id);
  const theme = themeFor(puzzle.tier);
  useMusic(theme.music);
  // Diwali Night: the board is dark, and each piece lights up (with a diya) as it joins the line.
  const night = theme.id === 'diwali';
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState<TrackState>(() => initTracks(cfg));
  const [trainAt, setTrainAt] = useState(-1); // -1: waiting at the station; then along the route
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const rows = cfg.map.length;
  const cols = cfg.map[0].length;
  const availH = height - insets.top - insets.bottom - 72 - 70 - 40;
  const cell = Math.floor(Math.min((Math.min(width, 480) - 32 - 20) / cols, availH / (rows + 1.9), 72));
  const strip = Math.round(cell * 0.95);

  const trace = traceTracks(cfg, state);
  const lit = new Set(trace.cells.map(([c, r]) => `${c},${r}`));
  const won = trace.reached;

  // Train stops: on the stub above the start column, every joined piece, then the stub below the goal.
  const centre = (c: number, r: number): Point => ({ x: c * cell + cell / 2, y: strip + r * cell + cell / 2 });
  const stops: Point[] = [
    { x: cfg.start * cell + cell / 2, y: strip / 2 },
    ...trace.cells.map(([c, r]) => centre(c, r)),
    { x: cfg.goal * cell + cell / 2, y: strip + rows * cell + strip / 2 },
  ];
  const stationCol = cfg.start === 0 ? 1 : cfg.start - 1;
  const stallCol = cfg.goal === cols - 1 ? cols - 2 : cfg.goal + 1;

  const tap = (c: number, r: number) => {
    if (won) return;
    const next = tapPiece(state, c, r);
    setState(next);
    playSound('click');
    const t = traceTracks(cfg, next);
    if (night && t.cells.length > trace.cells.length) playSound('light', 0.8);
    if (t.reached) {
      playSound('train');
      // All aboard: drive the train down the line, then celebrate.
      const total = t.cells.length + 2;
      let step = 0;
      timer.current = setInterval(() => {
        step += 1;
        setTrainAt(step);
        if (step >= total - 1 && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
          finish(tracksStars(next.taps, tracksPar(cfg)), 700);
        }
      }, 230);
    }
  };

  const tip = won
    ? 'Choo choo! Here comes the jalebi train!'
    : trace.cells.length === 0
      ? 'Tap the tracks to turn them. Start next to the station!'
      : `${trace.cells.length} ${trace.cells.length === 1 ? 'piece' : 'pieces'} joined up. Keep going to the jalebi stall!`;

  let house = 0;
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <ThemeBackdrop theme={theme} />
      <GameHeader
        title={puzzle.title || 'Fix the Tracks'}
        tier={puzzle.tier}
        right={
          <Pill>
            <Image source={TRAIN_ART.engine} style={{ width: 34, height: 34 }} />
            <Txt weight="extrabold" size={20} accessibilityLabel={`${state.taps} taps`}>{state.taps}</Txt>
          </Pill>
        }
      />

      <View style={styles.body}>
        <View style={styles.frame}>
          <View style={{ width: cols * cell, height: rows * cell + 2 * strip }}>
            {/* station strip */}
            <View style={[styles.strip, { top: 0, height: strip, width: cols * cell }, night && styles.stripNight]} />
            <Image source={TRAIN_ART.station} style={{ position: 'absolute', left: stationCol * cell + (cell - strip) / 2, top: 0, width: strip, height: strip }} accessibilityLabel="Station" />
            <View style={{ position: 'absolute', left: cfg.start * cell, top: 0, opacity: 0.9 }}>
              <TrackArt kind="straight" size={cell} lit />
            </View>

            {/* the grid */}
            <View style={[styles.grass, { top: strip, width: cols * cell, height: rows * cell }, night && styles.grassNight]} />
            {cfg.map.map((row, r) =>
              row.split('').map((ch, c) => {
                const piece = state.pieces[r][c];
                const at = { position: 'absolute' as const, left: c * cell, top: strip + r * cell, width: cell, height: cell };
                if (!piece) {
                  const index = ch === 'H' ? house++ : 0;
                  return (
                    <View key={`${c},${r}`} style={at} pointerEvents="none">
                      <SceneryArt tile={ch} size={cell} index={index} />
                    </View>
                  );
                }
                return <TrackTile key={`${c},${r}`} style={at} piece={piece} size={cell} lit={lit.has(`${c},${r}`)} disabled={won} onPress={() => tap(c, r)} label={`Track piece, row ${r + 1}, column ${c + 1}`} />;
              }),
            )}

            {night
              ? cfg.map.map((row, r) =>
                  row.split('').map((_, c) => {
                    const at = { position: 'absolute' as const, left: c * cell, top: strip + r * cell, width: cell, height: cell };
                    return lit.has(`${c},${r}`) ? (
                      <View key={`n${c},${r}`} pointerEvents="none" style={[at, { alignItems: 'flex-end' }]}>
                        <Diya size={cell * 0.6} />
                      </View>
                    ) : (
                      <View key={`n${c},${r}`} pointerEvents="none" style={[at, styles.dark]} />
                    );
                  }),
                )
              : null}

            {/* stall strip */}
            <View style={[styles.strip, { top: strip + rows * cell, height: strip, width: cols * cell }, night && styles.stripNight]} />
            <View style={{ position: 'absolute', left: cfg.goal * cell, top: strip + rows * cell, opacity: 0.9 }}>
              <TrackArt kind="straight" size={cell} lit={won} />
            </View>
            <Image source={TRAIN_ART.stall} style={{ position: 'absolute', left: stallCol * cell + (cell - strip) / 2, top: strip + rows * cell, width: strip, height: strip }} accessibilityLabel="Jalebi stall" />

            <Train at={stops[Math.max(0, Math.min(trainAt, stops.length - 1))]} size={cell * 0.92} />
          </View>
        </View>

        <TipBubble text={tip} tone={won ? 'good' : 'plain'} />
      </View>
    </SafeAreaView>
  );
}

function TrackTile({
  style,
  piece,
  size,
  lit,
  disabled,
  onPress,
  label,
}: {
  style: object;
  piece: TrackPiece;
  size: number;
  lit: boolean;
  disabled: boolean;
  onPress: () => void;
  label: string;
}) {
  const deg = useSharedValue(piece.rot * 90);
  useEffect(() => {
    deg.set(withTiming(piece.rot * 90, { duration: 170 }));
  }, [piece.rot, deg]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${deg.get()}deg` }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Turns the piece"
      accessibilityState={{ selected: lit, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={style}>
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.plate,
              { backgroundColor: lit ? '#FFE58A' : colors.road, boxShadow: `0px ${pressed ? 1 : 3}px 0px ${lit ? '#E0B300' : '#D9B77A'}` },
              pressed && { transform: [{ translateY: 2 }] },
            ]}
          />
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, spin]} pointerEvents="none">
            <TrackArt kind={piece.kind} size={size} lit={lit} />
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

/** The jalebi train: glides from stop to stop and faces the way it's going. */
function Train({ at, size }: { at: Point; size: number }) {
  const x = useSharedValue(at.x);
  const y = useSharedValue(at.y);
  const face = useSharedValue(1);
  useEffect(() => {
    const dx = at.x - x.get();
    if (Math.abs(dx) > 1) face.set(dx < 0 ? -1 : 1);
    x.set(withTiming(at.x, { duration: 210 }));
    y.set(withTiming(at.y, { duration: 210 }));
  }, [at.x, at.y, x, y, face]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() - size / 2 }, { translateY: y.get() - size / 2 }, { scaleX: face.get() }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, zIndex: 10 }, style]}>
      <Image source={TRAIN_ART.engine} style={{ width: size, height: size }} accessibilityLabel="Jalebi train" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  body: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  frame: { alignSelf: 'center', padding: 10, borderRadius: 24, backgroundColor: colors.white, boxShadow: `0px 6px 0px ${colors.sandShadow}` },
  strip: { position: 'absolute', left: 0, backgroundColor: '#FFF3E0', borderRadius: 10 },
  grass: { position: 'absolute', left: 0, backgroundColor: '#A8E07F', borderRadius: 12 },
  grassNight: { backgroundColor: '#5E9A55' },
  stripNight: { backgroundColor: '#C9B98F' },
  dark: { backgroundColor: 'rgba(10, 14, 46, 0.5)' },
  plate: { position: 'absolute', left: 2, top: 2, right: 2, bottom: 2, borderRadius: 10 },
});
