import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { playSound } from '@/audio/sound';
import { TRAIN_ART } from '@/data/art';
import { INDIA_OUTLINE, INDIA_SIZE, onMap } from '@/data/indiaOutline';
import { getLevel, stopNumber } from '@/data/levels';
import { INDIA_ROUTE, LINE_STOPS, type RouteStop } from '@/data/route';
import { colors } from '@/theme';
import { Txt } from './Txt';

// The map of India on the journey screen: the Jalebi Express's whole route down the country (src/data/route.ts),
// the stops a child can play as numbered pins, the stops still to come as grey "coming soon" dots, and the
// train at the stop being played. India's outline is the official one (src/data/indiaOutline.ts).

export type PinState = 'done' | 'open' | 'locked';

const RATIO = INDIA_SIZE.height / INDIA_SIZE.width;
const LAND = '#FFF4DC';
const COAST = '#E3B26A';
const AHEAD = '#BBAE96';
const SOON = '#CFC6B4';

const pathThrough = (stops: RouteStop[]) =>
  stops.length < 2
    ? ''
    : `M${stops
        .map((s) => onMap(s.lat, s.lon))
        .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
        .join('L')}`;

/** The boat trips: from the stop before each island, out to it. */
const BOATS = INDIA_ROUTE.flatMap((s, i) => (s.boat ? [pathThrough([INDIA_ROUTE[i - 1], s])] : [])).join('');

/** India's outline, `width` wide. */
function Outline({ width, children }: { width: number; children?: ReactNode }) {
  return (
    <Svg width={width} height={width * RATIO} viewBox={`0 0 ${INDIA_SIZE.width} ${INDIA_SIZE.height}`} style={StyleSheet.absoluteFill}>
      <Path d={INDIA_OUTLINE} fill={LAND} stroke={COAST} strokeWidth={5} strokeLinejoin="round" />
      {children}
    </Svg>
  );
}

/** A ring that keeps swelling out from a pin, to say "you are here". */
function Pulse({ size, color }: { size: number; color: string }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.set(withRepeat(withSequence(withTiming(1.7, { duration: 900 }), withTiming(1, { duration: 0 })), -1));
  }, [s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }], opacity: 1.7 - s.get() }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, { width: size, height: size, borderRadius: size / 2, borderColor: color }, style]} />;
}

/** The little engine, bobbing above the stop being played. */
function Engine({ size }: { size: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withRepeat(withSequence(withTiming(-4, { duration: 500 }), withTiming(0, { duration: 500 })), -1));
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return (
    <Animated.View pointerEvents="none" style={style}>
      <Image source={TRAIN_ART.engine} style={{ width: size, height: size }} accessibilityElementsHidden />
    </Animated.View>
  );
}

/**
 * The journey map. `pins` says how far the child has got at each built level (by level id); a built level
 * that isn't in it (the server sent no puzzles for it) shows as coming soon. The train waits at `current`.
 */
export function IndiaMap({
  width,
  pins,
  current,
  onPressLevel,
}: {
  width: number;
  pins: Record<number, PinState>;
  current?: number;
  onPressLevel: (level: number) => void;
}) {
  const k = width / INDIA_SIZE.width;
  const height = width * RATIO;
  const [tip, setTip] = useState<RouteStop | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(tipTimer.current), []);

  const built = (s: RouteStop) => s.level !== undefined && pins[s.level] !== undefined;
  const at = Math.max(0, LINE_STOPS.findIndex((s) => s.level === current));
  const travelled = pathThrough(LINE_STOPS.slice(0, at + 1));

  const showTip = (s: RouteStop) => {
    playSound('tap');
    setTip(s);
    clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setTip(null), 2500);
  };

  const BIG = 24;
  const SMALL = 11;
  return (
    <View style={{ width, height }}>
      <Outline width={width}>
        <Path d={pathThrough(LINE_STOPS)} fill="none" stroke={AHEAD} strokeWidth={7} strokeDasharray="16 14" strokeLinecap="round" />
        <Path d={BOATS} fill="none" stroke="#7FB8D8" strokeWidth={7} strokeDasharray="10 14" strokeLinecap="round" />
        {travelled ? <Path d={travelled} fill="none" stroke={colors.coral} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </Outline>

      {/* Coming-soon dots under the built pins, so a crowded corner still shows its numbers. */}
      {INDIA_ROUTE.filter((s) => !built(s)).map((s) => {
        const [x, y] = onMap(s.lat, s.lon);
        return (
          <Pressable
            key={s.place}
            accessibilityRole="button"
            accessibilityLabel={`${s.place}, coming soon`}
            hitSlop={8}
            onPress={() => showTip(s)}
            style={[styles.soon, { left: x * k - SMALL / 2, top: y * k - SMALL / 2, width: SMALL, height: SMALL, borderRadius: SMALL / 2 }]}
          />
        );
      })}

      {INDIA_ROUTE.filter(built).map((s) => {
        const level = s.level!;
        const state = pins[level];
        const accent = getLevel(level).theme.accent;
        const [x, y] = onMap(s.lat, s.lon);
        const here = level === current;
        return (
          <View key={s.place} style={{ position: 'absolute', left: x * k - BIG / 2, top: y * k - BIG / 2, width: BIG, height: BIG, alignItems: 'center', justifyContent: 'center' }}>
            {here ? <Pulse size={BIG} color={accent} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Level ${stopNumber(level)}, ${s.place}${state === 'done' ? ', done' : state === 'locked' ? ', locked' : ''}`}
              hitSlop={6}
              onPress={() => {
                playSound('tap');
                onPressLevel(level);
              }}
              style={[
                styles.pin,
                { width: BIG, height: BIG, borderRadius: BIG / 2 },
                state === 'done' && { backgroundColor: accent },
                state === 'open' && { backgroundColor: colors.white, borderColor: accent },
                state === 'locked' && { backgroundColor: colors.lockedTile },
              ]}>
              <Txt weight="display" size={12} color={state === 'locked' ? colors.inkBrown : colors.ink} style={{ lineHeight: 14 }}>
                {stopNumber(level)}
              </Txt>
            </Pressable>
            {here ? (
              <View style={[styles.engine, { top: -BIG * 1.25 }]}>
                <Engine size={BIG * 1.15} />
              </View>
            ) : null}
          </View>
        );
      })}

      {tip ? <Tip stop={tip} k={k} width={width} /> : null}
    </View>
  );
}

/** "Ladakh: coming soon!" in a bubble above a grey dot, kept inside the map. */
function Tip({ stop, k, width }: { stop: RouteStop; k: number; width: number }) {
  const [x, y] = onMap(stop.lat, stop.lon);
  const W = 150;
  const left = Math.min(Math.max(4, x * k - W / 2), width - W - 4);
  const below = y * k < 50;
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      style={[styles.tip, { left, width: W }, below ? { top: y * k + 12 } : { top: y * k - 54 }]}
      accessibilityLiveRegion="polite">
      <Txt weight="extrabold" size={14} align="center" numberOfLines={1}>{stop.place}</Txt>
      <Txt weight="semibold" size={12} align="center" color={colors.inkSoft}>{stop.boat ? 'A boat trip, coming soon!' : 'Coming soon!'}</Txt>
    </Animated.View>
  );
}

/** A small map with one stop marked: "this is where we are" on a level's story card. */
export function IndiaLocator({ width, level }: { width: number; level: number }) {
  const stop = INDIA_ROUTE.find((s) => s.level === level);
  if (!stop) return null;
  const k = width / INDIA_SIZE.width;
  const [x, y] = onMap(stop.lat, stop.lon);
  const dot = Math.max(10, width * 0.11);
  const accent = getLevel(level).theme.accent;
  return (
    <View style={{ width, height: width * RATIO }} accessible accessibilityLabel={`Map of India: ${stop.place} is here.`}>
      <Outline width={width} />
      <View style={{ position: 'absolute', left: x * k - dot / 2, top: y * k - dot / 2, width: dot, height: dot, alignItems: 'center', justifyContent: 'center' }}>
        <Pulse size={dot} color={colors.coral} />
        <View style={[styles.pin, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: accent, borderWidth: 2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  soon: { position: 'absolute', backgroundColor: SOON, borderWidth: 2, borderColor: colors.white },
  pin: { alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: colors.white, boxShadow: '0px 2px 0px rgba(30, 42, 79, 0.25)' },
  pulse: { position: 'absolute', borderWidth: 3 },
  engine: { position: 'absolute', alignSelf: 'center' },
  tip: { position: 'absolute', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 14, backgroundColor: colors.white, boxShadow: '0px 3px 0px rgba(30, 42, 79, 0.18)' },
});
