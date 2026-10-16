import { useEffect } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';

import { playSound, useVoice } from '@/audio/sound';
import { FRIEND_ART, GIFT_ART, PICTURES } from '@/data/art';
import type { FriendId } from '@/data/games';
import { friendsMet, getLevel, LEVELS } from '@/data/levels';
import { useCatalog } from '@/state/catalog';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';
import { ChunkyButton } from './Buttons';
import { Fireworks } from './Festive';
import { OutlinedText } from './OutlinedText';
import { Txt } from './Txt';

// The end of a level: its new friend hops on the Jalebi Express with their gift for the Mela, and the narrator
// cheers it in the level's own language. The last level (Home for Diwali) ends the story with fireworks and
// The Big Picture. Each plays once, the first time the level is done (progress.celebrated remembers it).

const LAST = LEVELS[LEVELS.length - 1].n;
/** Diwali Night's finale was saved as 'diwali' before the levels, so it doesn't play twice for those children. */
export const levelPartyKey = (level: number) => (level === LAST ? 'diwali' : `level-${level}`);

export function useLevelFinale(level: number): { show: boolean; close: () => void } {
  const { stars, celebrated, markCelebrated } = useProgress();
  const { isLevelDone } = useCatalog();
  const key = levelPartyKey(level);
  return { show: isLevelDone(level, stars) && !celebrated.includes(key), close: () => markCelebrated(key) };
}

/** The Jalebi Express with a friend in every carriage, made small enough to fit on one line in `maxWidth`. */
export function FriendTrain({ friends, size: most = 46, maxWidth, onDark = false }: { friends: FriendId[]; size?: number; maxWidth?: number; onDark?: boolean }) {
  const n = friends.length;
  const size = maxWidth ? Math.max(18, Math.min(most, (maxWidth - 11 * n - 4) / (n + 1.4))) : most;
  return (
    <View style={styles.train} accessibilityLabel={`On the train: ${friends.length} friends`}>
      {friends.map((f, i) => (
        <Animated.View key={f} entering={ZoomIn.delay(300 + i * 70)} style={[styles.carriage, { width: size + 8, height: size + 4 }, onDark && styles.carriageNight]}>
          <Image source={FRIEND_ART[f]} style={{ width: size, height: size * 1.07, marginTop: -size * 0.25 }} />
        </Animated.View>
      ))}
      <Image source={require('@/assets/images/game/engine.png')} style={{ width: size * 1.4, height: size * 1.4, marginLeft: 2 }} />
    </View>
  );
}

export function LevelParty({ level, onClose }: { level: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const info = getLevel(level);
  const theme = info.theme;
  const finale = level === LAST;
  const bounce = useSharedValue(0);
  useVoice(`done-${level}`, 2200); // after the cheer

  useEffect(() => {
    const t = finale ? [0, 900, 1800, 3000].map((ms) => setTimeout(() => playSound('firework', 0.8), ms)) : [setTimeout(() => playSound('train'), 200)];
    t.push(setTimeout(() => playSound('cheer'), 500));
    bounce.set(withDelay(500, withRepeat(withSequence(withTiming(-14, { duration: 420 }), withTiming(0, { duration: 420 })), -1)));
    return () => t.forEach(clearTimeout);
  }, [finale, bounce]);
  const hop = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.get() }] }));

  const big = Math.min(200, width * 0.42, height * 0.24);
  const riders = friendsMet(level).filter((f) => f !== 'pip');

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.scrim, { backgroundColor: theme.bg }]} accessibilityViewIsModal>
      {finale || theme.dark ? <Fireworks width={width} height={height} count={8} /> : null}
      <Animated.View entering={ZoomIn.delay(250).springify()} style={styles.content}>
        <OutlinedText size={finale ? (width < 380 ? 46 : 56) : width < 380 ? 30 : 36} color={colors.sun} align="center">
          {info.done}
        </OutlinedText>
        {finale ? (
          <Image source={PICTURES['big-picture'].image} style={[styles.bigPicture, { width: Math.min(width - 48, 380), height: Math.min(width - 48, 380) * (2 / 3) }]} accessibilityLabel="The Big Picture: every friend together at the Friendship Mela" />
        ) : (
          <View style={styles.hero}>
            <Animated.View style={hop}>
              <Image source={FRIEND_ART[info.friend]} style={{ width: big, height: big * 1.07 }} accessibilityLabel={info.friend} />
            </Animated.View>
            {info.giftArt ? (
              <Animated.View entering={ZoomIn.delay(700).springify()} style={styles.gift}>
                <Image source={GIFT_ART[info.giftArt]} style={{ width: big * 0.55, height: big * 0.55 }} />
              </Animated.View>
            ) : null}
          </View>
        )}
        <Txt weight="extrabold" size={20} align="center" color={theme.text}>{info.gift}</Txt>
        <FriendTrain friends={finale ? riders : riders.slice(-6)} size={40} maxWidth={Math.min(width, 440) - 48} onDark={theme.dark} />
        <Txt weight="semibold" size={15} align="center" color={theme.textSoft}>
          {finale ? 'You finished the whole journey! Thank you for helping every friend.' : `Level ${level} done! ${level < LAST ? `Level ${level + 1} is open.` : ''}`}
        </Txt>
        <ChunkyButton label="Yay!" icon="star" color={colors.sun} shadow={colors.sunShadow} height={70} width={200} fontSize={30} onPress={onClose} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2000, elevation: 2000, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 12, paddingHorizontal: 24, maxWidth: 440 },
  hero: { flexDirection: 'row', alignItems: 'flex-end' },
  gift: { marginLeft: -24, marginBottom: 4 },
  bigPicture: { borderRadius: 16, borderWidth: 6, borderColor: colors.white },
  train: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  carriage: { marginRight: 3, borderRadius: 10, backgroundColor: '#E8574F', borderBottomWidth: 5, borderBottomColor: '#2B2F3A', alignItems: 'center', overflow: 'visible' },
  carriageNight: { backgroundColor: '#FF7A59' },
});
