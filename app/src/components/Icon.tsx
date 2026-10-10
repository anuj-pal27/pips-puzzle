import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export type IconName =
  | 'back' | 'pause' | 'bulb' | 'lock' | 'star' | 'play' | 'home' | 'replay' | 'next' | 'close'
  | 'grid' | 'sliders' | 'sound' | 'soundOff' | 'up' | 'down' | 'left' | 'right' | 'piece' | 'check';

const STAR = 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z';
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z';
const PIECE = 'M5 8h3.5a2.5 2.5 0 1 1 5 0H17v3.5a2.5 2.5 0 1 1 0 5V20H5z';

/** Stroke icons drawn on a 24x24 grid (same set as the design). */
export function Icon({ name, size = 28, color = colors.ink, fill }: { name: IconName; size?: number; color?: string; fill?: string }) {
  const stroke = { stroke: color, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={3} />}
      {name === 'pause' && (
        <>
          <Rect x={5.5} y={4.5} width={4.5} height={15} rx={1.6} fill={color} />
          <Rect x={14} y={4.5} width={4.5} height={15} rx={1.6} fill={color} />
        </>
      )}
      {name === 'bulb' && (
        <>
          <Path d="M9 18h6M10 21h4" {...stroke} />
          <Path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" {...stroke} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2.5} {...stroke} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
        </>
      )}
      {name === 'star' && <Path d={STAR} fill={fill ?? colors.sun} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />}
      {name === 'play' && <Path d={PLAY} fill={color} />}
      {name === 'home' && <Path d="M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5" {...stroke} />}
      {name === 'replay' && <Path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" {...stroke} />}
      {name === 'next' && <Path d="M5 12h14M13 6l6 6-6 6" {...stroke} strokeWidth={3} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} strokeWidth={2.8} />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} strokeWidth={3.2} />}
      {name === 'grid' && (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={2} {...stroke} />
          <Rect x={13} y={4} width={7} height={7} rx={2} {...stroke} />
          <Rect x={4} y={13} width={7} height={7} rx={2} {...stroke} />
          <Rect x={13} y={13} width={7} height={7} rx={2} {...stroke} />
        </>
      )}
      {name === 'sliders' && (
        <>
          <Path d="M4 7h9M18 7h2M4 17h3M12 17h8" {...stroke} />
          <Circle cx={15.5} cy={7} r={2.3} {...stroke} />
          <Circle cx={9.5} cy={17} r={2.3} {...stroke} />
        </>
      )}
      {(name === 'sound' || name === 'soundOff') && <Path d="M4 9h4l5-4v14l-5-4H4z" {...stroke} />}
      {name === 'sound' && <Path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" {...stroke} />}
      {name === 'soundOff' && <Path d="M17 9.5l5 5M22 9.5l-5 5" {...stroke} />}
      {name === 'up' && <Path d="M6 15l6-6 6 6" {...stroke} strokeWidth={3.4} />}
      {name === 'down' && <Path d="M6 9l6 6 6-6" {...stroke} strokeWidth={3.4} />}
      {name === 'left' && <Path d="M15 6l-6 6 6 6" {...stroke} strokeWidth={3.4} />}
      {name === 'right' && <Path d="M9 6l6 6-6 6" {...stroke} strokeWidth={3.4} />}
      {name === 'piece' && <Path d={PIECE} fill={fill ?? colors.sun} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />}
    </Svg>
  );
}
