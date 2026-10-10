import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { ChunkyButton, CircleButton, Pill } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { PieceArt } from '@/components/PieceArt';
import { Txt } from '@/components/Txt';
import { getPuzzle, getTier, PICTURES, type Puzzle } from '@/data/puzzles';
import { jigsawStars, pieceMargin, piecePath, slotPath, trayLayout, type JigsawGrid } from '@/game/jigsaw';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

type Rect = { x: number; y: number; w: number; h: number };
type JigsawPuzzle = Extract<Puzzle, { kind: 'jigsaw' }>;

const PANEL_PAD = 14;

export default function PuzzleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPuzzle(id);
  if (!puzzle || puzzle.kind !== 'jigsaw') return <Redirect href="/map" />;
  return <Jigsaw key={puzzle.id} puzzle={puzzle} />;
}

function Jigsaw({ puzzle }: { puzzle: JigsawPuzzle }) {
  const { settings, recordStars } = useProgress();
  const picture = PICTURES[puzzle.picture];
  const tier = getTier(puzzle.tier);
  const { width } = useWindowDimensions();

  // Board size follows the screen width; pieces follow the board.
  const boardW = Math.min(width - 32 - PANEL_PAD * 2, 420);
  const boardH = (boardW * picture.height) / picture.width;
  const grid: JigsawGrid = { cols: tier.cols, rows: tier.rows, pw: boardW / tier.cols, ph: boardH / tier.rows };
  const margin = pieceMargin(grid);
  const boxW = grid.pw + 2 * margin;
  const boxH = grid.ph + 2 * margin;
  const total = tier.cols * tier.rows;

  const [placed, setPlaced] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [misses, setMisses] = useState(0);
  const [paused, setPaused] = useState(false);
  const [panel, setPanel] = useState<Rect | null>(null);
  const [tray, setTray] = useState<Rect | null>(null);
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
    setMisses(0);
    setUsedHint(false);
    setHint(false);
    setPaused(false);
  };

  const local = (id: number) => piecePath(grid, Math.floor(id / grid.cols), id % grid.cols, margin, margin);
  const imageOffset = (id: number) => ({ x: margin - (id % grid.cols) * grid.pw, y: margin - Math.floor(id / grid.cols) * grid.ph });
  const spots = tray ? trayLayout(grid, tray.w, tray.h) : [];
  const boardX = (panel?.x ?? 0) + PANEL_PAD;
  const boardY = (panel?.y ?? 0) + PANEL_PAD;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.root}>
        {/* top bar */}
        <View style={styles.header}>
          <CircleButton icon="pause" label="Pause" onPress={() => setPaused(true)} />
          <Pill>
            <Icon name="piece" size={26} fill={tier.color} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(placed.length / total) * 100}%`, backgroundColor: tier.color }]} />
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

        {/* tray: pieces start here */}
        <View style={styles.tray} onLayout={measure(setTray)}>
          {done ? (
            <View style={styles.doneBox}>
              <Txt weight="display" size={44}>Great job!</Txt>
            </View>
          ) : null}
        </View>

        {/* loose pieces live in a layer over everything, so they can be dragged from the tray to the board */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
                      boxW={boxW}
                      boxH={boxH}
                      margin={margin}
                      snap={0.45 * Math.min(grid.pw, grid.ph)}
                      onPlaced={place}
                      onMiss={() => setMisses((m) => m + 1)}>
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
  boxW,
  boxH,
  margin,
  snap,
  onPlaced,
  onMiss,
  children,
}: {
  id: number;
  label: string;
  outline: string;
  home: { x: number; y: number };
  target: { x: number; y: number };
  scale: number;
  rot: number;
  boxW: number;
  boxH: number;
  margin: number;
  snap: number;
  onPlaced: (id: number) => void;
  onMiss: () => void;
  children: ReactNode;
}) {
  const x = useSharedValue(home.x);
  const y = useSharedValue(home.y);
  const s = useSharedValue(scale);
  const r = useSharedValue(rot);
  const z = useSharedValue(1);
  const near = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Screen size or layout changed: move the piece to its new home.
  useEffect(() => {
    x.set(home.x);
    y.set(home.y);
    s.set(scale);
  }, [home.x, home.y, scale, x, y, s]);

  const distance = () => {
    'worklet';
    return Math.hypot(x.get() + boxW / 2 - target.x, y.get() + boxH / 2 - target.y);
  };

  const pan = Gesture.Pan()
    .hitSlop({ left: -margin, right: -margin, top: -margin, bottom: -margin })
    .onStart(() => {
      startX.set(x.get());
      startY.set(y.get());
      z.set(100);
      s.set(withTiming(1, { duration: 120 }));
      r.set(withTiming(0, { duration: 120 }));
    })
    .onUpdate((e) => {
      x.set(startX.get() + e.translationX);
      y.set(startY.get() + e.translationY);
      near.set(distance() < snap ? 1 : 0);
    })
    .onEnd(() => {
      near.set(0);
      if (distance() < snap) {
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
        r.set(withSpring(rot));
        z.set(2);
        scheduleOnRN(onMiss);
      }
    });

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
      <GestureDetector gesture={pan}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Drag it to its place on the picture"
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
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.navyScrim, alignItems: 'center', justifyContent: 'center' },
  pauseCard: { width: 300, padding: 24, borderRadius: 32, backgroundColor: colors.white, gap: 14 },
});
