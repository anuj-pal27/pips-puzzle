import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

const STAR = 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z';

export function Star({ filled, size = 20, outline = colors.sunShadow }: { filled: boolean; size?: number; outline?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={STAR}
        fill={filled ? colors.sun : 'rgba(30, 42, 79, 0.2)'}
        stroke={filled ? outline : 'none'}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A row of three stars, `count` of them filled. Announced as "2 of 3 stars". */
export function Stars({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`${count} of 3 stars`}
      style={{ flexDirection: 'row', gap: 1 }}>
      {[0, 1, 2].map((i) => (
        <Star key={i} filled={i < count} size={size} />
      ))}
    </View>
  );
}
