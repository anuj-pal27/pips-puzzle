import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type ChunkyProps = {
  label?: string;
  icon?: IconName;
  onPress: () => void;
  color?: string;
  shadow?: string;
  height?: number;
  width?: number | `${number}%`;
  fontSize?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Big toy-like button with a solid "3D" edge that squashes when pressed. */
export function ChunkyButton({
  label,
  icon,
  onPress,
  color = colors.sun,
  shadow = colors.sunShadow,
  height = 72,
  width,
  fontSize = 30,
  accessibilityLabel,
  style,
  children,
}: ChunkyProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chunky,
        { backgroundColor: color, height, width, borderRadius: height / 2, boxShadow: `0px ${pressed ? 2 : 7}px 0px ${shadow}` },
        pressed && { transform: [{ translateY: 5 }] },
        style,
      ]}>
      {children ?? (
        <>
          {icon ? <Icon name={icon} size={fontSize} /> : null}
          {label ? <Txt weight="display" size={fontSize}>{label}</Txt> : null}
        </>
      )}
    </Pressable>
  );
}

/** Round icon button (back, pause, settings…). Always has an accessibility label. */
export function CircleButton({
  icon,
  onPress,
  label,
  color = colors.white,
  shadow = colors.sandShadow,
  size = 56,
  iconColor = colors.ink,
  selected,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  shadow?: string;
  size?: number;
  iconColor?: string;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, boxShadow: `0px ${pressed ? 2 : 5}px 0px ${shadow}` },
        pressed && { transform: [{ translateY: 3 }] },
      ]}>
      <Icon name={icon} size={size * 0.5} color={iconColor} />
    </Pressable>
  );
}

/** White rounded pill (star counter, laddoo counter, progress). */
export function Pill({ children, shadow = colors.sandShadow }: { children: ReactNode; shadow?: string }) {
  return <View style={[styles.pill, { boxShadow: `0px 5px 0px ${shadow}` }]}>{children}</View>;
}

const styles = StyleSheet.create({
  chunky: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    height: 50,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 25,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

