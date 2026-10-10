import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

const OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

/**
 * Chunky cartoon title: coloured letters with a thick navy outline and a dropped 3D edge.
 * React Native has no multi-shadow text, so the outline is the same text drawn 8 times, nudged around.
 */
export function OutlinedText({
  children,
  size,
  color = colors.white,
  outline = colors.ink,
  stroke = 4,
}: {
  children: string;
  size: number;
  color?: string;
  outline?: string;
  stroke?: number;
}) {
  const base = { fontFamily: fonts.display, fontSize: size, lineHeight: Math.round(size * 1.15), letterSpacing: 1 };
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={children}>
      <Text style={[base, styles.layer, { color: outline, transform: [{ translateY: stroke * 2.2 }] }]}>{children}</Text>
      {OFFSETS.map(([x, y], i) => (
        <Text key={i} style={[base, styles.layer, { color: outline, transform: [{ translateX: x * stroke }, { translateY: y * stroke }] }]}>
          {children}
        </Text>
      ))}
      <Text style={[base, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
