import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Pill } from '@/components/Buttons';
import { GameHeader, TipBubble, useFinish } from '@/components/GameChrome';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { FRIEND_ART, FRIEND_RATIO } from '@/data/art';
import { FRIEND_NAMES, SHADOW_GAMES, type FriendId } from '@/data/games';
import { getPuzzle, type ShadowPuzzle } from '@/data/puzzles';
import { shadowStars, trayOrder } from '@/game/shadow';
import { colors } from '@/theme';

// Who's That Shadow?  Friends wait in the tray; drag each one onto their own shadow on the wall.

type Rect = { x: number; y: number; w: number; h: number };
type Tip = { text: string; tone: 'plain' | 'good' | 'oops' };
type Point = { x: number; y: number };

const PAD = 14;
const GAP = 10;
const LABEL = 26;

export default function ShadowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPuzzle(id);
  if (!puzzle || puzzle.kind !== 'shadow') return <Redirect href="/map" />;
  return <ShadowGame key={puzzle.id} puzzle={puzzle} />;
}

/** Centres of `n` items laid out in rows of `cols`, with a short last row centred. */
function gridCentres(n: number, cols: number, cellW: number, cellH: number, gapX: number, gapY: number): Point[] {
  return Array.from({ length: n }, (_, k) => {
    const r = Math.floor(k / cols);
    const inRow = Math.min(cols, n - r * cols);
    const offset = ((cols - inRow) * (cellW + gapX)) / 2;
    return { x: offset + (k % cols) * (cellW + gapX) + cellW / 2, y: r * (cellH + gapY) + cellH / 2 };
  });
}

function ShadowGame({ puzzle }: { puzzle: ShadowPuzzle }) {
  const game = SHADOW_GAMES[puzzle.game];
  const friends = game.friends;
  const finish = useFinish(puzzle.id);
  const { width } = useWindowDimensions();

  const cols = game.cols;
  const rows = Math.ceil(friends.length / cols);
  const panelW = Math.min(width - 32, 440);
  const slotW = Math.floor(Math.min((panelW - 2 * PAD - (cols - 1) * GAP) / cols, 124));
  const slotH = Math.round(slotW * 1.05);
  const artW = Math.round(slotW * 0.84);
  const artH = Math.round(artW * FRIEND_RATIO);

  const [found, setFound] = useState<FriendId[]>([]);
  const [misses, setMisses] = useState(0);
  const [tip, setTip] = useState<Tip>({ text: 'Drag each friend onto their shadow!', tone: 'plain' });
  const [panel, setPanel] = useState<Rect | null>(null);
  const [tray, setTray] = useState<Rect | null>(null);

  const measure = (set: (r: Rect) => void) => (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    set({ x, y, w, h });
  };

  // Where each shadow's picture sits (bottom of its slot), in screen-layer coordinates.
  const slotCentres = gridCentres(friends.length, cols, slotW, slotH + LABEL, GAP, GAP).map((p) => ({
    x: (panel?.x ?? 0) + PAD + p.x,
    y: (panel?.y ?? 0) + PAD + p.y - (slotH + LABEL) / 2 + slotH - artH / 2,
  }));

  // Tray spots: rows of up to 3, friends shrunk a little if the tray is short.
  const order = trayOrder(friends);
  const tcols = Math.min(3, friends.length);
  const trows = Math.ceil(friends.length / tcols);
  const cellW = (tray?.w ?? 1) / tcols;
  const cellH = (tray?.h ?? 1) / trows;
  // Friends can wait a little bigger than their shadows when there's room; they shrink to size when picked up.
  const trayScale = Math.min(1.3, (cellW * 0.9) / artW, (cellH * 0.8) / artH);
  const trayCentres = gridCentres(friends.length, tcols, cellW, cellH, 0, 0).map((p) => ({ x: (tray?.x ?? 0) + p.x, y: (tray?.y ?? 0) + p.y }));

  const placed = (friend: FriendId) => {
    if (found.includes(friend)) return;
    const next = [...found, friend];
    setFound(next);
    if (next.length === friends.length) {
      setTip({ text: 'You found everyone!', tone: 'good' });
      finish(shadowStars(misses), 1200);
    } else {
      setTip({ text: `Yes! That's ${FRIEND_NAMES[friend]}!`, tone: 'good' });
    }
  };
  const missed = (friend: FriendId) => {
    setMisses((m) => m + 1);
    setTip({ text: `Hmm, that's not ${FRIEND_NAMES[friend]}'s shadow. Try another one!`, tone: 'oops' });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.root}>
        <GameHeader
          title="Who's That Shadow?"
          tier={puzzle.tier}
          right={
            <Pill>
              <Icon name="check" size={24} color={colors.green} />
              <Txt weight="extrabold" size={20} accessibilityLabel={`${found.length} of ${friends.length} found`}>
                {found.length}/{friends.length}
              </Txt>
            </Pill>
          }
        />

        {/* the wall of shadows */}
        <View style={[styles.panel, { width: panelW }]} onLayout={measure(setPanel)}>
          <View style={{ height: rows * (slotH + LABEL) + (rows - 1) * GAP }}>
            {gridCentres(friends.length, cols, slotW, slotH + LABEL, GAP, GAP).map((p, k) => {
              const friend = friends[k];
              const done = found.includes(friend);
              return (
                <View
                  key={friend}
                  style={{ position: 'absolute', left: p.x - slotW / 2, top: p.y - (slotH + LABEL) / 2, width: slotW, alignItems: 'center' }}
                  accessible
                  accessibilityLabel={done ? FRIEND_NAMES[friend] : 'A mystery shadow'}>
                  <View style={[styles.slot, { width: slotW, height: slotH }, done && styles.slotDone]}>
                    {done ? (
                      <Animated.View entering={ZoomIn.springify()}>
                        <Image source={FRIEND_ART[friend]} style={{ width: artW, height: artH }} />
                      </Animated.View>
                    ) : (
                      <Image source={FRIEND_ART[friend]} style={{ width: artW, height: artH, tintColor: colors.ink, opacity: 0.86 }} />
                    )}
                  </View>
                  <View style={[styles.nameTag, done && { backgroundColor: colors.grass }]}>
                    <Txt weight="extrabold" size={14}>{done ? FRIEND_NAMES[friend] : '?'}</Txt>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <TipBubble text={tip.text} tone={tip.tone} />

        {/* friends wait here */}
        <View style={styles.tray} onLayout={measure(setTray)} />

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {panel && tray
            ? order.map((friend, k) => {
                if (found.includes(friend)) return null;
                const own = friends.indexOf(friend);
                return (
                  <FriendPiece
                    key={friend}
                    friend={friend}
                    art={FRIEND_ART[friend]}
                    w={artW}
                    h={artH}
                    home={trayCentres[k]}
                    scale={trayScale}
                    target={slotCentres[own]}
                    others={slotCentres.filter((_, i) => i !== own && !found.includes(friends[i]))}
                    radius={slotW * 0.6}
                    onPlaced={placed}
                    onMiss={missed}
                  />
                );
              })
            : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

/** A friend in the tray: drag onto the right shadow and they jump in; the wrong one and they hop back. */
function FriendPiece({
  friend,
  art,
  w,
  h,
  home,
  scale,
  target,
  others,
  radius,
  onPlaced,
  onMiss,
}: {
  friend: FriendId;
  art: ImageSourcePropType;
  w: number;
  h: number;
  home: Point;
  scale: number;
  target: Point;
  others: Point[];
  radius: number;
  onPlaced: (f: FriendId) => void;
  onMiss: (f: FriendId) => void;
}) {
  const homeX = home.x - w / 2;
  const homeY = home.y - h / 2;
  const x = useSharedValue(homeX);
  const y = useSharedValue(homeY);
  const s = useSharedValue(scale);
  const r = useSharedValue(0);
  const z = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  // Layout changed (tray measured, screen rotated): move home.
  useEffect(() => {
    x.set(homeX);
    y.set(homeY);
    s.set(scale);
  }, [homeX, homeY, scale, x, y, s]);

  // Follows the finger from where it touched down (no lag while the drag is being recognised).
  const pan = Gesture.Pan()
    .onBegin((e) => {
      touchX.set(e.absoluteX);
      touchY.set(e.absoluteY);
      startX.set(x.get());
      startY.set(y.get());
    })
    .onStart(() => {
      z.set(100);
      s.set(withTiming(1, { duration: 120 }));
    })
    .onUpdate((e) => {
      x.set(startX.get() + e.absoluteX - touchX.get());
      y.set(startY.get() + e.absoluteY - touchY.get());
    })
    .onEnd(() => {
      const cx = x.get() + w / 2;
      const cy = y.get() + h / 2;
      if (Math.hypot(cx - target.x, cy - target.y) < radius) {
        x.set(withTiming(target.x - w / 2, { duration: 100 }));
        y.set(
          withTiming(target.y - h / 2, { duration: 100 }, (finished) => {
            if (finished) scheduleOnRN(onPlaced, friend);
          }),
        );
        return;
      }
      const wrong = others.some((o) => Math.hypot(cx - o.x, cy - o.y) < radius);
      if (wrong) {
        r.set(withSequence(withTiming(-10, { duration: 70 }), withTiming(10, { duration: 70 }), withTiming(-6, { duration: 70 }), withTiming(0, { duration: 70 })));
        scheduleOnRN(onMiss, friend);
      }
      x.set(withSpring(homeX));
      y.set(withSpring(homeY));
      s.set(withSpring(scale));
      z.set(2);
    });

  const style = useAnimatedStyle(() => ({
    zIndex: z.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: s.get() }, { rotate: `${r.get()}deg` }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={FRIEND_NAMES[friend]}
        accessibilityHint="Drag onto the matching shadow"
        accessibilityActions={[{ name: 'activate', label: 'Put on the matching shadow' }]}
        onAccessibilityAction={() => onPlaced(friend)}
        style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, style]}>
        <Image source={art} style={{ width: w, height: h }} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  root: { flex: 1 },
  panel: {
    alignSelf: 'center',
    padding: PAD,
    borderRadius: 28,
    backgroundColor: '#A8E6FF',
    boxShadow: `0px 6px 0px ${colors.skyShadow}`,
  },
  slot: { borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.55)', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  slotDone: { backgroundColor: '#E3F8D6' },
  nameTag: { marginTop: 4, minWidth: 34, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.white, alignItems: 'center' },
  tray: { flex: 1, marginTop: 12, borderTopLeftRadius: 36, borderTopRightRadius: 36, backgroundColor: colors.sandDark },
});
