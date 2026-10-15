import { useEffect } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { playSound } from '@/audio/sound';
import { FRIEND_ART } from '@/data/art';
import type { FriendId } from '@/data/games';
import type { TierId } from '@/data/puzzles';
import { themeFor } from '@/data/themes';
import { useCatalog } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';
import { ChunkyButton } from './Buttons';
import { Fireworks } from './Festive';
import { OutlinedText } from './OutlinedText';
import { Txt } from './Txt';

// The finale of a chapter (Diwali Night): fireworks and all the friends, the first time every puzzle in
// it has a star. Shown once; it's remembered in progress.celebrated.

const FRIENDS: FriendId[] = ['mithu', 'gappu', 'pip', 'gauri', 'chunnu', 'tillu'];

/** True when `tier` is a chapter whose puzzles all have stars and whose finale hasn't played yet. */
export function useChapterFinale(tier: TierId): { show: boolean; close: () => void } {
  const { stars, celebrated, markCelebrated } = useProgress();
  const { puzzlesInTier } = useCatalog();
  const theme = themeFor(tier);
  const puzzles = puzzlesInTier(tier);
  const show = Boolean(theme.chapter) && puzzles.length > 0 && puzzles.every((p) => (stars[p.id] ?? 0) > 0) && !celebrated.includes(theme.id);
  return { show, close: () => markCelebrated(theme.id) };
}

export function ChapterParty({ tier, onClose }: { tier: TierId; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const theme = themeFor(tier);
  useEffect(() => {
    const t = [0, 900, 1800, 3000].map((ms) => setTimeout(() => playSound('firework', 0.8), ms));
    t.push(setTimeout(() => playSound('cheer'), 500));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.scrim, { backgroundColor: theme.bg }]} accessibilityViewIsModal>
      <Fireworks width={width} height={height} count={8} />
      <Animated.View entering={ZoomIn.delay(250).springify()} style={styles.content}>
        <OutlinedText size={width < 380 ? 46 : 56} color={colors.sun}>Happy Diwali!</OutlinedText>
        <View style={styles.friends}>
          {FRIENDS.map((f, i) => (
            <Image key={f} source={FRIEND_ART[f]} style={{ width: 58, height: 62, marginTop: i % 2 ? 14 : 0 }} />
          ))}
        </View>
        <Txt weight="extrabold" size={20} align="center" color={theme.text}>You finished {theme.chapter}!</Txt>
        <Txt weight="semibold" size={16} align="center" color={theme.textSoft}>The whole town is glowing with diyas, thanks to you.</Txt>
        <ChunkyButton label="Yay!" icon="star" color={colors.sun} shadow={colors.sunShadow} height={70} width={200} fontSize={30} onPress={onClose} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2000, elevation: 2000, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 14, paddingHorizontal: 24, maxWidth: 440 },
  friends: { flexDirection: 'row', gap: 2, alignItems: 'flex-start' },
});
