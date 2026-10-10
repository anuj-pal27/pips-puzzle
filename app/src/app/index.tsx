import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChunkyButton, CircleButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { OutlinedText } from '@/components/OutlinedText';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

function Cloud({ left, top, scale = 1 }: { left: number | `${number}%`; top: number; scale?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, transform: [{ scale }] }}>
      <View style={[styles.cloudPart, { left: 0, top: 26, width: 140, height: 38, borderRadius: 19 }]} />
      <View style={[styles.cloudPart, { left: 30, top: 0, width: 54, height: 54, borderRadius: 27 }]} />
      <View style={[styles.cloudPart, { left: 70, top: 12, width: 40, height: 40, borderRadius: 20 }]} />
    </View>
  );
}

export default function Home() {
  const { settings, updateSettings } = useProgress();
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

        <Animated.View style={[styles.pip, pipStyle]}>
          <Image
            source={require('@/assets/images/game/pip.png')}
            style={{ width: 200, height: 208 }}
            accessibilityLabel="Pip, a smiling orange puzzle piece, waving hello"
          />
        </Animated.View>

        <ChunkyButton onPress={() => router.push('/map')} accessibilityLabel="Play" height={96} width={250} style={styles.play}>
          <View style={styles.playIcon}>
            <Icon name="play" color={colors.sun} size={28} />
          </View>
          <OutlinedText size={44} color={colors.ink} stroke={0}>Play</OutlinedText>
        </ChunkyButton>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sky, overflow: 'hidden' },
  safe: { flex: 1, alignItems: 'center' },
  topBar: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  title: { alignItems: 'center', marginTop: 24, transform: [{ rotate: '-4deg' }] },
  pip: { marginTop: 8, flexShrink: 1 },
  play: { marginTop: 'auto', marginBottom: 56 },
  playIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  cloudPart: { position: 'absolute', backgroundColor: colors.white },
  hill: { position: 'absolute', borderRadius: 999 },
});
