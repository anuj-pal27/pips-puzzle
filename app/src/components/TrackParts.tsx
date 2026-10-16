import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { PieceKind } from '@/game/tracks';

// Fix the Tracks tiles, drawn on a 48x48 grid and scaled to the cell size.
// Track pieces are drawn in their base shape (straight: top-bottom, curve: top-right);
// the screen turns the whole tile to show other directions.

const RAIL = '#5A6275';
const SLEEPER = '#A0714A';
const GAUGE = 7; // half the distance between the two rails

export function TrackArt({ kind, size, lit }: { kind: PieceKind; size: number; lit: boolean }) {
  const rail = lit ? '#2B3550' : RAIL;
  if (kind === 'straight') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        {[4, 14, 24, 34, 44].map((y) => (
          <Rect key={y} x={13} y={y - 2} width={22} height={4} rx={1.5} fill={SLEEPER} />
        ))}
        <Rect x={24 - GAUGE - 1.6} y={0} width={3.2} height={48} fill={rail} />
        <Rect x={24 + GAUGE - 1.6} y={0} width={3.2} height={48} fill={rail} />
      </Svg>
    );
  }
  // Curve from the middle of the top edge to the middle of the right edge, around the top-right corner.
  const arc = (r: number) => `M ${48 - r} 0 A ${r} ${r} 0 0 0 48 ${r}`;
  const sleepers = [100, 122, 145, 168].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const x = (r: number) => 48 + r * Math.cos(a);
    const y = (r: number) => r * Math.sin(a);
    return `M ${x(13)} ${y(13)} L ${x(35)} ${y(35)}`;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {sleepers.map((d) => (
        <Path key={d} d={d} stroke={SLEEPER} strokeWidth={4} strokeLinecap="round" />
      ))}
      <Path d={arc(24 - GAUGE)} fill="none" stroke={rail} strokeWidth={3.2} />
      <Path d={arc(24 + GAUGE)} fill="none" stroke={rail} strokeWidth={3.2} />
    </Svg>
  );
}

const HOUSE = ['#FF8FA3', '#3CC6B6', '#B39DFF', '#FF9F43'];

/** Trees, houses, ponds and flowers on the grass: can't be turned. */
export function SceneryArt({ tile, size, index }: { tile: string; size: number; index: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {tile === 'T' && (
        <>
          <Ellipse cx={24} cy={42} rx={12} ry={3} fill="#4FAE30" />
          <Rect x={21.5} y={28} width={5} height={13} rx={2} fill="#8B5A2B" />
          <Circle cx={24} cy={21} r={13} fill="#3FA34D" />
          <Circle cx={19} cy={17} r={4.5} fill="#6CCB5F" />
        </>
      )}
      {tile === 'H' && (
        <G>
          <Rect x={10} y={22} width={28} height={20} rx={3} fill={HOUSE[index % HOUSE.length]} />
          <Path d="M6 24 L24 9 L42 24 Z" fill="#E5583A" />
          <Rect x={20} y={30} width={8} height={12} rx={3} fill="#8B5A2B" />
          <Rect x={13} y={27} width={5} height={5} rx={1} fill="#FFFFFF" />
          <Rect x={30} y={27} width={5} height={5} rx={1} fill="#FFFFFF" />
        </G>
      )}
      {tile === 'P' && (
        <>
          <Ellipse cx={24} cy={26} rx={18} ry={12} fill="#4FA8F0" />
          <Ellipse cx={19} cy={22} rx={7} ry={3} fill="#9AD4FF" />
          <Ellipse cx={31} cy={30} rx={4} ry={2.5} fill="#7ED957" />
        </>
      )}
      {tile === 'F' && (
        <>
          {[
            [14, 18, '#FF8FA3'],
            [32, 14, '#FFC93C'],
            [24, 30, '#FFFFFF'],
            [36, 34, '#FF8FA3'],
            [12, 36, '#FFC93C'],
          ].map(([x, y, c]) => (
            <G key={`${x},${y}`}>
              <Circle cx={x as number} cy={y as number} r={4} fill={c as string} />
              <Circle cx={x as number} cy={y as number} r={1.6} fill="#E09E00" />
            </G>
          ))}
        </>
      )}
    </Svg>
  );
}
