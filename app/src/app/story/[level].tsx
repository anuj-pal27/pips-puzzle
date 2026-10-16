import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound, useMusic } from '@/audio/sound';
import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { ThemeBackdrop } from '@/components/Festive';
import { OutlinedText } from '@/components/OutlinedText';
import { Txt } from '@/components/Txt';
import { PICTURES, PIP_ART } from '@/data/art';
import { getLevel, LEVELS } from '@/data/levels';
import { openPuzzle, storyKey } from '@/navigation';
import { useCatalog } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

// A level's story card: where the Jalebi Express has stopped, a picture of the place and its new friend,
// and two or three lines for a grown-up to read aloud. Shown before a level's first puzzle (then "Let's go!"
// opens that puzzle), and any time from the map.

export default function StoryCard() {
  const { level: param, then } = useLocalSearchParams<{ level: string; then?: string }>();
  const level = getLevel(Number(param) || 1);
  const theme = level.theme;
  useMusic(theme.music);
  const { getPuzzle, getPicture } = useCatalog();
  const { markCelebrated } = useProgress();
  const { width, height } = useWindowDimensions();
  const picture = PICTURES[level.picture] ?? getPicture(level.picture);
  const photoW = Math.min(width - 56, 420, (height * 0.34 * picture.width) / picture.height);
  const next = then ? getPuzzle(then) : undefined;

  useEffect(() => {
    markCelebrated(storyKey(level.n));
    const t = setTimeout(() => playSound('train', 0.7), 250);
    return () => clearTimeout(t);
    // Mark it once, when the card opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.n]);

  const go = () => {
    if (next) openPuzzle(next, 'replace');
    else if (router.canGoBack()) router.back();
    else router.replace('/map');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <ThemeBackdrop theme={theme} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <CircleButton icon="back" label="Back to the map" onPress={() => (router.canGoBack() ? router.back() : router.replace('/map'))} />
          <View style={[styles.levelBadge, { backgroundColor: theme.accent }]}>
            <Txt weight="display" size={20} color={colors.ink}>Level {level.n}</Txt>
          </View>
          <View style={{ width: 56 }} />
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center' }}>
            <Txt weight="extrabold" size={18} color={theme.textSoft} align="center">
              {level.n === 1 ? 'Where it all begins' : level.n === LEVELS.length ? 'Back home' : 'Next stop'}
            </Txt>
            <OutlinedText size={width < 380 ? 38 : 46} color={colors.sun}>{level.place}</OutlinedText>
            <Txt weight="display" size={24} color={theme.text} align="center" accessibilityRole="header">{level.title}</Txt>
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.photo}>
            <Image source={picture.image} style={{ width: photoW, height: (photoW * picture.height) / picture.width, borderRadius: 14 }} accessibilityLabel={picture.title} />
          </Animated.View>

          <View style={styles.story}>
            {level.story.map((line, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(450 + i * 350)}>
                <Txt weight="semibold" size={18} align="center">{line}</Txt>
              </Animated.View>
            ))}
            <Image source={PIP_ART} style={styles.pip} accessibilityElementsHidden />
          </View>

          <ChunkyButton label={next ? "Let's go!" : 'Back to the map'} icon={next ? 'play' : 'back'} color={colors.grass} shadow={colors.grassShadow} height={76} width={240} fontSize={next ? 30 : 22} onPress={go} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  levelBadge: { paddingHorizontal: 16, paddingVertical: 2, borderRadius: 999 },
  body: { alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  photo: { padding: 8, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 8px 0px rgba(30, 42, 79, 0.2)', transform: [{ rotate: '-2deg' }] },
  story: { maxWidth: 420, gap: 8, padding: 16, paddingBottom: 18, borderRadius: 22, backgroundColor: colors.white, boxShadow: '0px 6px 0px rgba(30, 42, 79, 0.15)' },
  pip: { position: 'absolute', right: -18, bottom: -22, width: 52, height: 54, transform: [{ rotate: '10deg' }] },
});
