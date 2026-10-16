import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound } from '@/audio/sound';
import { Bit } from '@/components/Bit';
import { CircleButton } from '@/components/Buttons';
import { OutlinedText } from '@/components/OutlinedText';
import { Txt } from '@/components/Txt';
import { useProgress } from '@/state/progress';
import { colors, LAB } from '@/theme';

function Cloud({ left, top, scale = 1 }: { left: number | `${number}%`; top: number; scale?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, transform: [{ scale }] }}>
      <View style={[styles.cloudPart, { left: 0, top: 26, width: 140, height: 38, borderRadius: 19 }]} />
      <View style={[styles.cloudPart, { left: 30, top: 0, width: 54, height: 54, borderRadius: 27 }]} />
      <View style={[styles.cloudPart, { left: 70, top: 12, width: 40, height: 40, borderRadius: 20 }]} />
    </View>
  );
}

/** One of the two big doors on the home screen: Pip's puzzles, or Bit's lessons. */
function Door({
  title,
  subtitle,
  color,
  shadow,
  textColor,
  icon,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  color: string;
  shadow: string;
  textColor: string;
  icon: ReactNode;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={() => {
        playSound('tap');
        onPress();
      }}
      style={({ pressed }) => [
        styles.door,
        { backgroundColor: color, boxShadow: `0px ${pressed ? 2 : 7}px 0px ${shadow}` },
        pressed && { transform: [{ translateY: 5 }] },
      ]}>
      <View style={styles.doorIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt weight="display" size={30} color={textColor}>{title}</Txt>
        <Txt weight="bold" size={15} color={textColor} style={{ opacity: 0.8 }}>{subtitle}</Txt>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Txt weight="extrabold" size={13} color={colors.white}>{badge}</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function Home() {
  const { settings, updateSettings, labStars } = useProgress();
  const { height } = useWindowDimensions();
  const pipH = Math.max(110, Math.min(200, Math.round(height * 0.2)));
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.set(withRepeat(withSequence(withTiming(-12, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1));
  }, [bob]);
  const pipStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.get() }] }));

  return (
    <View style={styles.screen}>
      <Cloud left={-24} top={170} />
      <Cloud left="72%" top={330} scale={0.85} />
      <Cloud left="60%" top={120} scale={0.6} />
      <View pointerEvents="none" style={[styles.hill, { left: -90, bottom: -150, backgroundColor: colors.grassShadow, width: 430, height: 280 }]} />
      <View pointerEvents="none" style={[styles.hill, { right: -140, bottom: -160, backgroundColor: colors.grass, width: 380, height: 300 }]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <CircleButton
            icon={settings.sound ? 'sound' : 'soundOff'}
            label="Sound"
            selected={settings.sound}
            shadow={colors.skyShadow}
            onPress={() => updateSettings({ sound: !settings.sound })}
          />
          <CircleButton icon="sliders" label="Grown-ups" shadow={colors.skyShadow} onPress={() => router.push('/grown-ups')} />
        </View>

        <View style={styles.title}>
          <OutlinedText size={64}>Pip&apos;s</OutlinedText>
          <OutlinedText size={78} color={colors.sun}>Puzzles</OutlinedText>
        </View>

        <View style={styles.friends}>
          <Animated.View style={pipStyle}>
            <Image
              source={require('@/assets/images/game/pip.png')}
              style={{ width: pipH * 0.96, height: pipH }}
              accessibilityLabel="Pip, a smiling orange puzzle piece, waving hello"
            />
          </Animated.View>
          <View style={{ marginBottom: 4 }} accessible accessibilityLabel="Bit, a friendly robot">
            <Bit size={pipH * 0.55} wave />
          </View>
        </View>

        <View style={styles.doors}>
          <Door
            title="Puzzles"
            subtitle="A train ride round India"
            color={colors.sun}
            shadow={colors.sunShadow}
            textColor={colors.ink}
            icon={<Image source={require('@/assets/images/game/pip.png')} style={{ width: 46, height: 48 }} />}
            onPress={() => router.push('/map')}
          />
          <Door
            title="Learn with Bit"
            subtitle="Teach a robot to think"
            color={LAB.teal}
            shadow={LAB.tealShadow}
            textColor="#063D35"
            icon={<Bit size={40} />}
            badge={Object.keys(labStars).length ? undefined : 'New'}
            onPress={() => router.push('/lab')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sky, overflow: 'hidden' },
  safe: { flex: 1, alignItems: 'center' },
  topBar: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  title: { alignItems: 'center', marginTop: 24, transform: [{ rotate: '-4deg' }] },
  friends: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 6, flexShrink: 1 },
  doors: { marginTop: 'auto', marginBottom: 40, alignSelf: 'stretch', paddingHorizontal: 20, gap: 18, maxWidth: 440, width: '100%', alignItems: 'stretch' },
  door: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30, minHeight: 84 },
  doorIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 14, top: -10, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.coral },
  cloudPart: { position: 'absolute', backgroundColor: colors.white },
  hill: { position: 'absolute', borderRadius: 999 },
});
