import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import type { Theme } from '@/data/themes';

// Diwali Night decorations, drawn in code: diyas, twinkling string lights, a starry sky and fireworks.

const BULBS = ['#FFD43B', '#FF7A59', '#7CF3FF', '#FF4F79', '#7ED957'];

/** A little clay lamp with a flickering flame and a warm glow. `size` is the glow's width; `still` skips the flicker (for many at once). */
export function Diya({ size = 48, lit = true, still = false }: { size?: number; lit?: boolean; still?: boolean }) {
  const flicker = useSharedValue(1);
  useEffect(() => {
    if (!lit || still) return;
    flicker.set(withRepeat(withSequence(withTiming(1.12, { duration: 420 }), withTiming(0.94, { duration: 380 })), -1, true));
  }, [lit, still, flicker]);
  const glow = useAnimatedStyle(() => ({ transform: [{ scale: flicker.get() }] }));
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {lit ? (
        <Animated.View style={[StyleSheet.absoluteFill, glow]}>
          <Svg width={size} height={size} viewBox="-50 -50 100 100">
            <Defs>
              <RadialGradient id="diyaGlow" cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFE48A" stopOpacity="0.95" />
                <Stop offset="0.5" stopColor="#FFB13B" stopOpacity="0.35" />
                <Stop offset="1" stopColor="#FF9F1C" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle r={50} fill="url(#diyaGlow)" />
          </Svg>
        </Animated.View>
      ) : null}
      <Svg width={size} height={size} viewBox="-50 -50 100 100" style={StyleSheet.absoluteFill}>
        <Path d="M-22,8 Q0,32 22,8 Z" fill="#C8662F" />
        <Path d="M-22,8 Q0,16 22,8 Q0,22 -22,8 Z" fill="#8E3F18" />
        {lit ? (
          <>
            <Path d="M0,6 C-8,-2 -4,-16 0,-24 C4,-16 8,-2 0,6 Z" fill="#FF8A1C" />
            <Path d="M0,3 C-4,-2 -2,-10 0,-15 C2,-10 4,-2 0,3 Z" fill="#FFE48A" />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

function bulbPoints(width: number, y: number, sag: number, n: number) {
  return Array.from({ length: n }, (_, j) => {
    const t = (j + 1) / (n + 1);
    return { x: t * width, y: (1 - t) ** 2 * y + 2 * (1 - t) * t * (y + 2 * sag) + t * t * y };
  });
}

/** A string of fairy lights across the top; every other bulb twinkles. */
export function StringLights({ width, y = 6, sag = 20 }: { width: number; y?: number; sag?: number }) {
  const n = Math.max(5, Math.round(width / 42));
  const pts = bulbPoints(width, y, sag, n);
  const twinkle = useSharedValue(1);
  useEffect(() => {
    twinkle.set(withRepeat(withSequence(withTiming(0.25, { duration: 700 }), withTiming(1, { duration: 700 })), -1));
  }, [twinkle]);
  const fade = useAnimatedStyle(() => ({ opacity: twinkle.get() }));
  const layer = (odd: boolean) => (
    <Svg width={width} height={y + 2 * sag + 24}>
      {pts.map((p, j) =>
        j % 2 === (odd ? 1 : 0) ? (
          <G key={j}>
            <Circle cx={p.x} cy={p.y + 9} r={11} fill={BULBS[j % BULBS.length]} opacity={0.35} />
            <Ellipse cx={p.x} cy={p.y + 9} rx={4.5} ry={6.5} fill={BULBS[j % BULBS.length]} />
          </G>
        ) : null,
      )}
    </Svg>
  );
  return (
    <View pointerEvents="none" style={{ width, height: y + 2 * sag + 24 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={y + 2 * sag + 24} style={StyleSheet.absoluteFill}>
        <Path d={`M0,${y} Q${width / 2},${y + 2 * sag} ${width},${y}`} stroke="#0B1030" strokeWidth={2.5} fill="none" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>{layer(false)}</View>
      <Animated.View style={[StyleSheet.absoluteFill, fade]}>{layer(true)}</Animated.View>
    </View>
  );
}

// Fixed "random" star positions (fractions of the screen), so the sky doesn't jump around.
const STARS = [[0.08, 0.16], [0.22, 0.09], [0.37, 0.2], [0.55, 0.12], [0.71, 0.22], [0.88, 0.1], [0.94, 0.3], [0.04, 0.42], [0.15, 0.62], [0.9, 0.55], [0.82, 0.78], [0.1, 0.86], [0.5, 0.94], [0.66, 0.4], [0.3, 0.5]];

/** Behind a Diwali Night screen: stars and a string of lights along the top. Nothing for the daytime town. */
export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const { width, height } = useWindowDimensions();
  if (theme.id !== 'diwali') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {STARS.map(([x, y], i) => (
          <Circle key={i} cx={x * width} cy={y * height} r={i % 3 === 0 ? 2.2 : 1.5} fill="#FFF3D6" opacity={0.75} />
        ))}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        <StringLights width={width} y={-3} sag={4} />
      </View>
    </View>
  );
}

/** One firework: lines bursting out from the middle, then fading. Repeats after `delay`. */
function Burst({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(1, { duration: 900 })), -1, false)));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.get() < 0.05 ? 0 : 1 - t.get() ** 2, transform: [{ scale: 0.25 + t.get() * 0.85 }] }));
  const rays = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-50 -50 100 100">
        {rays.map((a, i) => (
          <G key={i}>
            <Line x1={Math.cos(a) * 14} y1={Math.sin(a) * 14} x2={Math.cos(a) * 40} y2={Math.sin(a) * 40} stroke={color} strokeWidth={4} strokeLinecap="round" />
            <Circle cx={Math.cos(a) * 47} cy={Math.sin(a) * 47} r={3.2} fill={i % 2 ? '#FFF3D6' : color} />
          </G>
        ))}
        <Circle r={6} fill="#FFF3D6" />
      </Svg>
    </Animated.View>
  );
}

/** A sky of fireworks for celebrations (children's sparkly kind: no bangs, just colours). */
export function Fireworks({ width, height, count = 6 }: { width: number; height: number; count?: number }) {
  const spots = [[0.2, 0.18], [0.78, 0.14], [0.5, 0.3], [0.12, 0.5], [0.86, 0.46], [0.36, 0.08], [0.64, 0.6], [0.3, 0.72]].slice(0, count);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {spots.map(([x, y], i) => (
        <Burst key={i} x={x * width} y={y * height} size={Math.min(width, height) * (0.32 + (i % 3) * 0.06)} color={BULBS[i % BULBS.length]} delay={i * 330} />
      ))}
    </View>
  );
}
