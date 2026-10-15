import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { playSound, useMusic } from '@/audio/sound';
import { Bit } from '@/components/Bit';
import { CircleButton, Pill } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Stars } from '@/components/Stars';
import { ThingArt } from '@/components/ThingArt';
import { Txt } from '@/components/Txt';
import { bitGifts, LESSONS, lessonOpen } from '@/game/teach';
import { useProgress } from '@/state/progress';
import { colors, LAB } from '@/theme';

// Learn with Bit: the robot lab. Bit at the top, the lessons along a winding path, badges at the bottom.

const ROW = 128; // height of one lesson on the path
const NODE = 78;

function hello(done: number): string {
  if (done === 0) return "Hi! I'm Bit, a robot. Teach me things and I'll learn!";
  if (done === LESSONS.length) return "You taught me everything! You're a real AI trainer!";
  return 'Thank you for teaching me! Ready for the next one?';
}

export default function Lab() {
  useMusic('lab');
  const { labStars } = useProgress();
  const [width, setWidth] = useState(0);
  const done = LESSONS.filter((l) => labStars[l.id]).length;
  const nextIndex = LESSONS.findIndex((l) => !labStars[l.id]);

  // Path: lessons zig-zag left and right; a dashed road joins them.
  const x = (i: number) => width * (i % 2 === 0 ? 0.3 : 0.7);
  const y = (i: number) => i * ROW + NODE / 2 + 8;
  const road = LESSONS.map((_, i) => (i === 0 ? `M ${x(0)} ${y(0)}` : `C ${x(i - 1)} ${y(i - 1) + ROW * 0.6}, ${x(i)} ${y(i) - ROW * 0.6}, ${x(i)} ${y(i)}`)).join(' ');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <CircleButton icon="back" label="Back to home" shadow={LAB.line} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Txt weight="display" size={28} accessibilityRole="header">Learn with Bit</Txt>
        <Pill shadow={LAB.line}>
          <Icon name="star" size={22} color={colors.sun} />
          <Txt weight="extrabold" size={18} accessibilityLabel={`${done} of ${LESSONS.length} badges`}>{done}/{LESSONS.length}</Txt>
        </Pill>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Bit size={104} mood={done === LESSONS.length ? 'happy' : 'idle'} gifts={bitGifts(labStars)} wave />
          <View style={styles.bubble}>
            <Txt weight="bold" size={17}>{hello(done)}</Txt>
            <View style={styles.bubbleTail} />
          </View>
        </View>

        <View style={{ height: LESSONS.length * ROW }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
          {width ? (
            <Svg width={width} height={LESSONS.length * ROW} style={StyleSheet.absoluteFill}>
              <Path d={road} stroke={LAB.line} strokeWidth={14} fill="none" strokeLinecap="round" />
              <Path d={road} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="2 12" fill="none" strokeLinecap="round" />
            </Svg>
          ) : null}
          {width
            ? LESSONS.map((lesson, i) => (
                <LessonStop
                  key={lesson.id}
                  x={x(i)}
                  y={y(i)}
                  index={i}
                  stars={labStars[lesson.id] ?? 0}
                  open={lessonOpen(i, labStars)}
                  next={i === nextIndex}
                />
              ))
            : null}
        </View>

        <View style={styles.shelf}>
          <Txt weight="extrabold" size={15} color={colors.inkSoft}>BIT&apos;S BADGES</Txt>
          <View style={styles.badges}>
            {LESSONS.map((l) => {
              const got = (labStars[l.id] ?? 0) > 0;
              return (
                <View key={l.id} style={{ alignItems: 'center', width: 62 }} accessible accessibilityLabel={got ? `${l.badge.name} badge` : 'Badge not won yet'}>
                  <View style={[styles.badge, got ? styles.badgeGot : styles.badgeEmpty]}>
                    {got ? <ThingArt id={l.icon} size={36} /> : <Icon name="lock" size={18} color={LAB.line} />}
                  </View>
                  <Txt weight="bold" size={11} align="center" color={got ? colors.ink : colors.inkSoft} numberOfLines={2}>
                    {got ? l.badge.name : '?'}
                  </Txt>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** One lesson on the path: its picture in a round button, its name, and the stars it earned. */
function LessonStop({ x, y, index, stars, open, next }: { x: number; y: number; index: number; stars: number; open: boolean; next: boolean }) {
  const lesson = LESSONS[index];
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (next) pulse.set(withRepeat(withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })), -1));
  }, [next, pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  return (
    <View style={[styles.stop, { left: x - 70, top: y - NODE / 2 }]}>
      <Animated.View style={style}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Lesson ${index + 1}: ${lesson.title}${open ? (stars ? `, ${stars} stars` : '') : ', locked. Finish the lesson before it first.'}`}
          accessibilityState={{ disabled: !open }}
          onPress={() => {
            if (!open) return playSound('bump', 0.6);
            playSound('tap');
            router.push({ pathname: '/lab/[id]', params: { id: lesson.id } });
          }}
          style={[styles.node, next && styles.nodeNext, !open && styles.nodeLocked]}>
          {open ? <ThingArt id={lesson.icon} size={52} /> : <Icon name="lock" size={28} color={LAB.tealShadow} />}
        </Pressable>
      </Animated.View>
      <Txt weight="extrabold" size={15} align="center" color={open ? colors.ink : colors.inkSoft}>{lesson.title}</Txt>
      {stars ? <Stars count={stars} size={18} /> : <View style={{ height: 18 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LAB.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 520, width: '100%', alignSelf: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  bubble: { flex: 1, padding: 14, borderRadius: 22, backgroundColor: LAB.card, borderWidth: 2, borderColor: LAB.line },
  bubbleTail: { position: 'absolute', left: -9, top: 30, width: 16, height: 16, backgroundColor: LAB.card, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: LAB.line, transform: [{ rotate: '45deg' }] },
  stop: { position: 'absolute', width: 140, alignItems: 'center', gap: 2 },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, backgroundColor: LAB.card, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: LAB.teal, boxShadow: `0px 5px 0px ${LAB.tealShadow}` },
  nodeNext: { borderColor: colors.sun, borderWidth: 4, backgroundColor: '#FFF6D6', boxShadow: `0px 5px 0px ${colors.sunShadow}` },
  nodeLocked: { backgroundColor: LAB.locked, borderColor: LAB.line, boxShadow: `0px 5px 0px ${LAB.line}` },
  shelf: { marginTop: 16, padding: 14, borderRadius: 24, backgroundColor: LAB.card, borderWidth: 2, borderColor: LAB.line, gap: 10, alignItems: 'center' },
  badges: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badgeGot: { backgroundColor: '#FFF6D6', borderWidth: 3, borderColor: colors.sun },
  badgeEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: LAB.line },
});
