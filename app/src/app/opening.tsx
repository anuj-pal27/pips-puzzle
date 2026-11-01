import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, SlideInLeft, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { hasVoice, playSound, speak, useMusic, useVoice } from '@/audio/sound';
import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { ThemeBackdrop } from '@/components/Festive';
import { FriendTrain } from '@/components/LevelParty';
import { OutlinedText } from '@/components/OutlinedText';
import { Txt } from '@/components/Txt';
import { FRIEND_ART, FRIEND_RATIO, PICTURES, PIP_ART, SNACK_ART } from '@/data/art';
import type { FriendId } from '@/data/games';
import { LEVELS } from '@/data/levels';
import { OPENING, OPENING_KEY, type OpeningScene } from '@/data/opening';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

// The opening story: five pages, before the trip starts, on why Pip sets off round the world. Shown once, the
// first time a child opens the puzzles (then it goes on to the map), and any time from the home screen.
// The narrator reads each page (opening-1 ... opening-5 in src/data/voice.ts).

const HOME = LEVELS[0].theme; // Jalebi Junction, in the snow
const CREW: FriendId[] = ['gappu', 'mithu', 'tillu', 'chunnu', 'gauri', 'pip'];
const OLD_MAP = require('@/assets/images/game/old-map.png');

/** Something that bobs up and down, starting after `delay` ms. */
function Bob({ children, delay = 0, height = 10 }: { children: ReactNode; delay?: number; height?: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withDelay(delay, withRepeat(withSequence(withTiming(-height, { duration: 450 }), withTiming(0, { duration: 450 })), -1)));
  }, [y, delay, height]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Snowy peaks behind the train, `w` x `h`: the mountains of Jammu & Kashmir. */
function Peaks({ w, h }: { w: number; h: number }) {
  const peak = (cx: number, base: number, half: number, top: number, color: string) => {
    const cap = base - (base - top) * 0.68;
    const capHalf = half * 0.32;
    return [
      <Path key={`${cx}m`} d={`M${cx - half},${base} L${cx},${top} L${cx + half},${base} Z`} fill={color} />,
      <Path key={`${cx}s`} d={`M${cx - capHalf},${cap} L${cx},${top} L${cx + capHalf},${cap} L${cx + capHalf * 0.3},${cap + h * 0.05} L${cx - capHalf * 0.3},${cap + h * 0.02} Z`} fill="#FFFFFF" />,
    ];
  };
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      {peak(w * 0.2, h * 0.78, w * 0.26, h * 0.18, '#8C9CC4')}
      {peak(w * 0.55, h * 0.78, w * 0.3, h * 0.08, '#7C8DB5')}
      {peak(w * 0.88, h * 0.78, w * 0.24, h * 0.26, '#8C9CC4')}
    </Svg>
  );
}

/** The page's picture, `w` wide and two thirds as tall. */
function Scene({ scene, w }: { scene: OpeningScene; w: number }) {
  const h = (w * 2) / 3;
  switch (scene) {
    case 'station':
      return <Image source={PICTURES.station.image} style={{ width: w, height: h, borderRadius: 14 }} resizeMode="cover" accessibilityLabel="Jalebi Junction, a little station in the snow" />;
    case 'map':
      return <Image source={OLD_MAP} style={{ width: w, height: h, borderRadius: 14 }} accessibilityLabel="Gappu shows Pip an old map with a dotted line to a star" />;
    case 'wonder': {
      const pip = h * 0.72;
      return (
        <View style={[styles.sceneBox, { width: w, height: h, backgroundColor: '#BDE6FF' }]} accessible accessibilityLabel="Pip wonders where their big picture is">
          <View style={[styles.hill, { width: w * 1.3, height: h * 0.5, left: -w * 0.15, bottom: -h * 0.3 }]} />
          <View style={{ position: 'absolute', left: w * 0.04, bottom: h * 0.06 }}>
            <Bob height={6}>
              <Image source={PIP_ART} style={{ width: pip * 0.96, height: pip }} />
            </Bob>
          </View>
          <Animated.View entering={ZoomIn.delay(500).springify()} style={[styles.bubbleDot, { left: w * 0.5, top: h * 0.42, width: h * 0.05, height: h * 0.05 }]} />
          <Animated.View entering={ZoomIn.delay(650).springify()} style={[styles.bubbleDot, { left: w * 0.55, top: h * 0.3, width: h * 0.08, height: h * 0.08 }]} />
          <Animated.View entering={ZoomIn.delay(800).springify()} style={[styles.bubble, { right: w * 0.04, top: h * 0.04, width: w * 0.34, height: w * 0.28 }]}>
            <OutlinedText size={h * 0.3} color={colors.sun} align="center">?</OutlinedText>
          </Animated.View>
        </View>
      );
    }
    case 'friends': {
      const size = Math.min(w / 3.6, h * 0.42);
      return (
        <View style={[styles.sceneBox, styles.crowd, { width: w, height: h, backgroundColor: HOME.bg }]} accessible accessibilityLabel="Gappu, Mithu, Tillu, Chunnu, Gauri and Pip, all ready to come along">
          {CREW.map((f, i) => (
            <Animated.View key={f} entering={ZoomIn.delay(200 + i * 140).springify()}>
              <Bob delay={i * 120} height={8}>
                <Image source={FRIEND_ART[f]} style={{ width: size, height: size * FRIEND_RATIO }} />
              </Bob>
            </Animated.View>
          ))}
        </View>
      );
    }
    case 'train':
      return (
        <View style={[styles.sceneBox, { width: w, height: h, backgroundColor: '#BDE6FF', justifyContent: 'flex-end' }]} accessible accessibilityLabel="The Jalebi Express sets off with everyone on board">
          <Peaks w={w} h={h} />
          <View style={[styles.hill, { width: w * 1.3, height: h * 0.45, left: -w * 0.15, bottom: -h * 0.12 }]} />
          <View style={[styles.rails, { bottom: h * 0.1 }]} />
          <Animated.View entering={SlideInLeft.duration(1400)} style={{ marginBottom: h * 0.12, alignSelf: 'center' }}>
            <FriendTrain friends={CREW} size={w / 10} maxWidth={w - 16} />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(1500).springify()} style={{ position: 'absolute', right: w * 0.04, top: h * 0.06 }}>
            <Image source={SNACK_ART.jalebi} style={{ width: h * 0.32, height: h * 0.32 }} accessibilityElementsHidden />
          </Animated.View>
        </View>
      );
  }
}

export default function OpeningStory() {
  const { then } = useLocalSearchParams<{ then?: string }>();
  const { markCelebrated, settings } = useProgress();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const last = page === OPENING.length - 1;
  const voice = `opening-${page + 1}` as const;
  useMusic(HOME.music);
  useVoice(voice, page ? 400 : 1000);
  const w = Math.min(width - 56, 420, height * 0.36 * 1.5);

  useEffect(() => {
    markCelebrated(OPENING_KEY);
    // Once, when the story opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    if (then === 'map') router.replace('/map');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const next = () => {
    playSound('tap');
    if (last) finish();
    else setPage(page + 1);
  };

  return (
    <View style={[styles.screen, { backgroundColor: HOME.bg }]}>
      <ThemeBackdrop theme={HOME} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <CircleButton icon="close" label="Close the story" onPress={finish} />
          <View style={styles.dots} accessible accessibilityLabel={`Page ${page + 1} of ${OPENING.length}`}>
            {OPENING.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
          {!settings.muted && settings.voice && hasVoice(voice) ? <CircleButton icon="sound" label="Hear this page again" onPress={() => speak(voice)} /> : <View style={{ width: 56 }} />}
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <OutlinedText size={width < 380 ? 34 : 40} color={colors.sun} align="center">Pip&apos;s Big Idea</OutlinedText>
          <Animated.View key={page} entering={FadeIn.duration(350)} style={styles.page}>
            <View style={styles.photo}>
              <Scene scene={OPENING[page].scene} w={w} />
            </View>
            <View style={styles.story}>
              <Txt weight="semibold" size={19} align="center" accessibilityLiveRegion="polite">{OPENING[page].text}</Txt>
            </View>
          </Animated.View>
          <ChunkyButton
            label={last ? "Let's go!" : 'Next'}
            icon={last ? 'play' : 'next'}
            color={last ? colors.grass : colors.sun}
            shadow={last ? colors.grassShadow : colors.sunShadow}
            height={72}
            width={220}
            fontSize={28}
            onPress={next}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(30, 42, 79, 0.2)' },
  dotOn: { width: 28, backgroundColor: colors.coral },
  body: { alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  page: { alignItems: 'center', gap: 16 },
  photo: { padding: 8, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 8px 0px rgba(30, 42, 79, 0.2)', transform: [{ rotate: '-2deg' }] },
  story: { maxWidth: 420, padding: 16, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 6px 0px rgba(30, 42, 79, 0.15)' },
  sceneBox: { borderRadius: 14, overflow: 'hidden' },
  crowd: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center', alignContent: 'center', columnGap: 4 },
  hill: { position: 'absolute', borderRadius: 999, backgroundColor: '#E8F4FF' },
  rails: { position: 'absolute', left: 0, right: 0, height: 6, backgroundColor: '#5A6275' },
  bubble: { position: 'absolute', borderRadius: 999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 0px rgba(30, 42, 79, 0.15)' },
  bubbleDot: { position: 'absolute', borderRadius: 999, backgroundColor: colors.white },
});
