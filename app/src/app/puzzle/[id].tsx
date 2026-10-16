import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { playSound, useMusic } from '@/audio/sound';
import { ChunkyButton, CircleButton, Pill } from '@/components/Buttons';
import { TipBubble } from '@/components/GameChrome';
import { Icon } from '@/components/Icon';
import { ThemeBackdrop } from '@/components/Festive';
import { PieceArt } from '@/components/PieceArt';
import { Txt } from '@/components/Txt';
import type { JigsawPuzzle } from '@/data/puzzles';
import { isGentle, themeFor } from '@/data/levels';
import { jigsawStars, pieceMargin, piecePath, slotPath, startTurns, trayLayout, type JigsawGrid } from '@/game/jigsaw';
import { newSeed, seededRandom } from '@/game/random';
import { useCatalog, usePuzzle } from '@/state/catalog';
import { usePlayStats } from '@/state/playStats';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

type Rect = { x: number; y: number; w: number; h: number };

const PANEL_PAD = 14;

export default function PuzzleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = usePuzzle(id);
  if (!puzzle || puzzle.kind !== 'jigsaw') return <Redirect href="/map" />;
  return <Jigsaw key={puzzle.id} puzzle={puzzle} />;
}

function Jigsaw({ puzzle }: { puzzle: JigsawPuzzle }) {
  usePlayStats(puzzle.id);
  const { settings, recordStars } = useProgress();
  const picture = useCatalog().getPicture(puzzle.picture);
  const theme = themeFor(puzzle.level);
  useMusic(theme.music);
  const { width } = useWindowDimensions();

  // Board size follows the screen width; pieces follow the board.
  const boardW = Math.min(width - 32 - PANEL_PAD * 2, 420);
  const boardH = (boardW * picture.height) / picture.width;
  const grid: JigsawGrid = { cols: puzzle.cols, rows: puzzle.rows, pw: boardW / puzzle.cols, ph: boardH / puzzle.rows };
  const margin = pieceMargin(grid);
  const boxW = grid.pw + 2 * margin;
  const boxH = grid.ph + 2 * margin;
  const total = puzzle.cols * puzzle.rows;
  const spin = !!puzzle.spin;

  const [placed, setPlaced] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [misses, setMisses] = useState(0);
  const [paused, setPaused] = useState(false);
  const [panel, setPanel] = useState<Rect | null>(null);
  const [tray, setTray] = useState<Rect | null>(null);
  // A new mix of the tray every play (and on "Start over"); the seed keeps it still while playing.
  const [seed, setSeed] = useState(newSeed);
  // Spin jigsaws: quarter-turns per piece. Only ever counts up, so pieces always spin the same way.
  const [turns, setTurns] = useState<number[]>(() => (spin ? startTurns(total, Math.random) : Array(total).fill(0)));
  const [tip, setTip] = useState('Some pieces are turned round. Tap a piece to spin it!');
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = placed.length === total;

  // If the player leaves early, don't jump to the finish screen afterwards.
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  const measure = (set: (r: Rect) => void) => (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    set({ x, y, w, h });
  };

  const place = (pieceId: number) => {
    if (placed.includes(pieceId)) return;
    playSound('snap');
    const next = [...placed, pieceId];
    setPlaced(next);
    if (next.length === total) {
      // Last piece: save the stars, let the finished picture show for a moment, then celebrate.
      const stars = jigsawStars(usedHint, misses);
      recordStars(puzzle.id, stars);
      leaveTimer.current = setTimeout(
        () => router.replace({ pathname: '/complete/[id]', params: { id: puzzle.id, stars: String(stars) } }),
        900,
      );
    }
  };
  const restart = () => {
    setPlaced([]);
    setTurns(spin ? startTurns(total, Math.random) : Array(total).fill(0));
    setSeed(newSeed());
    setMisses(0);
    setUsedHint(false);
    setHint(false);
    setPaused(false);
  };

  const local = (id: number) => piecePath(grid, Math.floor(id / grid.cols), id % grid.cols, margin, margin);
  const imageOffset = (id: number) => ({ x: margin - (id % grid.cols) * grid.pw, y: margin - Math.floor(id / grid.cols) * grid.ph });
  // Levels 1 and 2: a loose grid. Later levels: a messy pile.
  const spots = tray ? trayLayout(grid, tray.w, tray.h, seededRandom(seed), isGentle(puzzle.level) ? 'grid' : 'pile') : [];
  const boardX = (panel?.x ?? 0) + PANEL_PAD;
  const boardY = (panel?.y ?? 0) + PANEL_PAD;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <ThemeBackdrop theme={theme} />
      <View style={styles.root}>
        {/* top bar */}
        <View style={styles.header}>
          <CircleButton icon="pause" label="Pause" onPress={() => setPaused(true)} />
          <Pill>
            <Icon name="piece" size={26} fill={theme.accent} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(placed.length / total) * 100}%`, backgroundColor: theme.accent }]} />
            </View>
            <Txt weight="extrabold" size={18} accessibilityLabel={`${placed.length} of ${total} pieces placed`}>
              {placed.length}/{total}
            </Txt>
          </Pill>
          {settings.pictureHint ? (
            <CircleButton
              icon="bulb"
              label="Picture hint"
              selected={hint}
              color={colors.sun}
              shadow={colors.sunShadow}
              onPress={() => {
                setHint((h) => !h);
                setUsedHint(true);
              }}
            />
          ) : (
            <View style={{ width: 56 }} />
          )}
        </View>

        {/* board */}
        <View style={styles.panel} onLayout={measure(setPanel)}>
          <View style={{ width: boardW, height: boardH }}>
            <Image
              source={picture.image}
              style={{ position: 'absolute', width: boardW, height: boardH, opacity: hint ? 0.55 : 0.2 }}
              accessibilityLabel={`Picture guide: ${picture.title}`}
            />
            <Svg width={boardW} height={boardH} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Path d={slotPath(grid)} fill="none" stroke={colors.ink} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />
            </Svg>
            {placed.map((id) => (
              <Animated.View
                key={id}
                entering={ZoomIn.duration(220)}
                pointerEvents="none"
                style={{ position: 'absolute', left: (id % grid.cols) * grid.pw - margin, top: Math.floor(id / grid.cols) * grid.ph - margin }}>
                <PieceArt
                  clipId={`board-${puzzle.id}-${id}`}
                  d={local(id)}
                  image={picture.image}
                  imageX={imageOffset(id).x}
                  imageY={imageOffset(id).y}
                  boardW={boardW}
                  boardH={boardH}
                  boxW={boxW}
                  boxH={boxH}
                  edgeWidth={1.6}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {spin && !done ? <TipBubble text={tip} /> : null}

        {/* tray: pieces start here */}
        <View style={[styles.tray, { backgroundColor: theme.tray }]} onLayout={measure(setTray)}>
          {done ? (
            <View style={styles.doneBox}>
              <Txt weight="display" size={44} color={theme.text}>Great job!</Txt>
            </View>
          ) : null}
        </View>

        {/* loose pieces live in a layer over everything, so they can be dragged from the tray to the board */}
        {/* collapsable={false} + zIndex: keep this layer real on Android, so the pieces' own layering stays inside it */}
        <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="box-none" collapsable={false}>
          {tray && panel
            ? spots
                .filter((s) => !placed.includes(s.id))
                .map((s) => {
                  const r = Math.floor(s.id / grid.cols);
                  const c = s.id % grid.cols;
                  return (
                    <TrayPiece
                      key={s.id}
                      id={s.id}
                      label={`Puzzle piece, row ${r + 1}, column ${c + 1}`}
                      outline={local(s.id)}
                      home={{ x: tray.x + s.cx - boxW / 2, y: tray.y + s.cy - boxH / 2 }}
                      target={{ x: boardX + c * grid.pw + grid.pw / 2, y: boardY + r * grid.ph + grid.ph / 2 }}
                      scale={s.scale}
                      rot={s.rot}
                      turn={turns[s.id]}
                      spin={spin}
                      onSpin={(id) => {
                        playSound('click');
                        setTurns((t) => t.map((v, i) => (i === id ? v + 1 : v)));
                      }}
                      onWrongWay={() => {
                        playSound('miss');
                        setTip('Spin it the right way up first! Tap the piece to turn it.');
                      }}
                      boxW={boxW}
                      boxH={boxH}
                      margin={margin}
                      snap={0.45 * Math.min(grid.pw, grid.ph)}
                      onPlaced={place}
                      onMiss={() => {
                        playSound('miss', 0.7);
                        setMisses((m) => m + 1);
                      }}>
                      <PieceArt
                        clipId={`tray-${puzzle.id}-${s.id}`}
                        d={local(s.id)}
                        image={picture.image}
                        imageX={imageOffset(s.id).x}
                        imageY={imageOffset(s.id).y}
                        boardW={boardW}
                        boardH={boardH}
                        boxW={boxW}
                        boxH={boxH}
                        edgeWidth={3}
                        shadow
                      />
                    </TrayPiece>
                  );
                })
            : null}
        </View>

        {paused ? (
          <View style={styles.scrim}>
            <View style={styles.pauseCard}>
              <Txt weight="display" size={40} align="center" accessibilityRole="header">Paused</Txt>
              <ChunkyButton icon="play" label="Keep playing" fontSize={22} height={66} onPress={() => setPaused(false)} />
              <ChunkyButton icon="replay" label="Start over" fontSize={20} height={58} color={colors.white} shadow={colors.sandShadow} onPress={restart} />
              <ChunkyButton icon="grid" label="All puzzles" fontSize={20} height={58} color={colors.white} shadow={colors.sandShadow} onPress={() => router.back()} />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/** A loose piece: drag it; drop it near its spot and it snaps in, anywhere else and it slides home. */
function TrayPiece({
  id,
  label,
  outline,
  home,
  target,
  scale,
  rot,
  turn,
  spin,
  boxW,
  boxH,
  margin,
  snap,
  onPlaced,
  onMiss,
  onSpin,
  onWrongWay,
  children,
}: {
  id: number;
  label: string;
  outline: string;
  home: { x: number; y: number };
  target: { x: number; y: number };
  scale: number;
  rot: number;
  turn: number; // quarter-turns clockwise; upright when a multiple of 4
  spin: boolean; // tapping turns the piece
  boxW: number;
  boxH: number;
  margin: number;
  snap: number;
  onPlaced: (id: number) => void;
  onMiss: () => void;
  onSpin: (id: number) => void;
  onWrongWay: () => void;
  children: ReactNode;
}) {
  const x = useSharedValue(home.x);
  const y = useSharedValue(home.y);
  const s = useSharedValue(scale);
  const r = useSharedValue(rot + turn * 90);
  const z = useSharedValue(1);
  const near = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  // Screen size or layout changed: move the piece to its new home.
  useEffect(() => {
    x.set(home.x);
    y.set(home.y);
    s.set(scale);
  }, [home.x, home.y, scale, x, y, s]);

  // Tapped: turn a quarter clockwise.
  useEffect(() => {
    r.set(withTiming(rot + turn * 90, { duration: 180 }));
  }, [turn, rot, r]);
  const upright = turn % 4 === 0;

  const distance = () => {
    'worklet';
    return Math.hypot(x.get() + boxW / 2 - target.x, y.get() + boxH / 2 - target.y);
  };

  // The piece follows the finger from where it first touched down, so it never lags behind
  // however far the finger moved before the drag was recognised.
  const pan = Gesture.Pan()
    .hitSlop({ left: -margin, right: -margin, top: -margin, bottom: -margin })
    .onBegin((e) => {
      touchX.set(e.absoluteX);
      touchY.set(e.absoluteY);
      startX.set(x.get());
      startY.set(y.get());
    })
    .onStart(() => {
      scheduleOnRN(playSound, 'pick');
      z.set(100);
      s.set(withTiming(1, { duration: 120 }));
      r.set(withTiming(turn * 90, { duration: 120 }));
    })
    .onUpdate((e) => {
      x.set(startX.get() + e.absoluteX - touchX.get());
      y.set(startY.get() + e.absoluteY - touchY.get());
      near.set(distance() < snap ? 1 : 0);
    })
    .onEnd(() => {
      const d = distance();
      near.set(0);
      if (d < snap && upright) {
        x.set(withTiming(target.x - boxW / 2, { duration: 90 }));
        y.set(
          withTiming(target.y - boxH / 2, { duration: 90 }, (finished) => {
            if (finished) scheduleOnRN(onPlaced, id);
          }),
        );
      } else {
        x.set(withSpring(home.x));
        y.set(withSpring(home.y));
        s.set(withSpring(scale));
        r.set(withSpring(rot + turn * 90));
        z.set(2);
        // Right spot but upside down: explain instead of counting a miss.
        if (d < snap * 1.5 && !upright) scheduleOnRN(onWrongWay);
        else scheduleOnRN(onMiss);
      }
    });
  const tap = Gesture.Tap()
    .maxDuration(300)
    .maxDistance(10)
    .hitSlop({ left: -margin, right: -margin, top: -margin, bottom: -margin })
    .onEnd((_e, success) => {
      if (success) scheduleOnRN(onSpin, id);
    });
  const gesture = spin ? Gesture.Race(pan, tap) : pan;

  const pieceStyle = useAnimatedStyle(() => ({
    zIndex: z.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: s.get() }, { rotate: `${r.get()}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: near.get() }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: target.x - boxW / 2, top: target.y - boxH / 2 }, glowStyle]}>
        <Svg width={boxW} height={boxH}>
          <Path d={outline} fill={colors.sun} fillOpacity={0.4} stroke={colors.sun} strokeWidth={4} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={spin ? 'Tap to spin it, drag it to its place on the picture' : 'Drag it to its place on the picture'}
          accessibilityActions={[{ name: 'activate', label: 'Put piece in place' }]}
          onAccessibilityAction={() => onPlaced(id)}
          style={[{ position: 'absolute', left: 0, top: 0, width: boxW, height: boxH }, pieceStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 12 },
  progressTrack: { width: 84, height: 12, borderRadius: 6, backgroundColor: colors.lockedTile, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  panel: {
    alignSelf: 'center',
    padding: PANEL_PAD,
    borderRadius: 28,
    backgroundColor: colors.white,
    boxShadow: `0px 6px 0px ${colors.sandShadow}`,
  },
  tray: { flex: 1, marginTop: 20, borderTopLeftRadius: 36, borderTopRightRadius: 36, backgroundColor: colors.sandDark },
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Above everything, including a piece that is being dragged.
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.navyScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCard: { width: 300, padding: 24, borderRadius: 32, backgroundColor: colors.white, gap: 14 },
});
