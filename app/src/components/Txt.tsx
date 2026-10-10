import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '@/theme';

type Weight = 'regular' | 'semibold' | 'bold' | 'extrabold' | 'display';

/** Text in the game's fonts. `display` is the chunky title face; the rest are Baloo 2 weights. */
export function Txt({
  weight = 'bold',
  size = 18,
  color = colors.ink,
  align,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string; align?: TextStyle['textAlign'] }) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[weight], fontSize: size, color, textAlign: align, lineHeight: Math.round(size * (weight === 'display' ? 1.1 : 1.3)) },
        style,
      ]}
    />
  );
}
