import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Maze tiles drawn on a 46x46 grid and scaled to the cell size.
// Absolutely positioned so they always sit on top of a railway tile in the same cell (web paints
// positioned elements above unpositioned ones).
const ABS = { position: 'absolute' as const, left: 0, top: 0 };

/** Railway crossing gate: a striped bar that swings up when open. Colour + shape match its lever. */
export function GateTile({ size, color, glyph, open }: { size: number; color: string; glyph: string; open: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" style={ABS}>
      <Rect x={5} y={3} width={36} height={40} rx={4} fill="#E9CC98" />
      <G transform={open ? 'rotate(-82 7 23)' : undefined}>
        <Rect x={5} y={19} width={38} height={8} rx={4} fill="#FFFFFF" stroke={colors.ink} strokeWidth={1.5} />
        <Rect x={12} y={20} width={6} height={6} fill={color} />
        <Rect x={24} y={20} width={6} height={6} fill={color} />
        <Rect x={35} y={20} width={5} height={6} fill={color} />
      </G>
      <Circle cx={7} cy={23} r={7} fill={color} stroke={colors.ink} strokeWidth={1.5} />
      <G transform="translate(3.4 19.4) scale(0.6)">
        <Path d={glyph} fill={colors.ink} />
      </G>
    </Svg>
  );
}

/** Signal lever: tips over (and stays) when Gappu steps on it. */
export function LeverTile({ size, color, glyph, on }: { size: number; color: string; glyph: string; on: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" style={ABS}>
      <Rect x={9} y={32} width={28} height={10} rx={3} fill="#5A6275" />
      <G transform="translate(19.4 33.4) scale(0.6)">
        <Path d={glyph} fill={color} />
      </G>
      <G transform={`rotate(${on ? 32 : -32} 23 34)`}>
        <Rect x={21.5} y={10} width={3} height={24} rx={1.5} fill={colors.ink} />
        <Circle cx={23} cy={10} r={6.5} fill={color} stroke={colors.ink} strokeWidth={1.5} />
      </G>
    </Svg>
  );
}

/** Two-way switch: the handle leans towards whichever gate is open right now. */
export function SwitchTile({
  size,
  left,
  right,
  flipped,
}: {
  size: number;
  left: { color: string; glyph: string }; // gate that is open when NOT flipped
  right: { color: string; glyph: string }; // gate that is open when flipped
  flipped: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" style={ABS}>
      <Rect x={6} y={31} width={17} height={12} rx={3} fill={left.color} stroke={colors.ink} strokeWidth={1.2} />
      <Rect x={23} y={31} width={17} height={12} rx={3} fill={right.color} stroke={colors.ink} strokeWidth={1.2} />
      <G transform="translate(10.9 33.4) scale(0.6)">
        <Path d={left.glyph} fill={colors.ink} />
      </G>
      <G transform="translate(27.9 33.4) scale(0.6)">
        <Path d={right.glyph} fill={colors.ink} />
      </G>
      <G transform={`rotate(${flipped ? 32 : -32} 23 33)`}>
        <Rect x={21.5} y={9} width={3} height={24} rx={1.5} fill={colors.ink} />
        <Circle cx={23} cy={9} r={6.5} fill={flipped ? right.color : left.color} stroke={colors.ink} strokeWidth={1.5} />
      </G>
    </Svg>
  );
}

const HOUSES: [string, string][] = [
  ['#FF8FA3', '#E86F8C'],
  ['#3CC6B6', '#2FA39A'],
  ['#FFC93C', '#E6A817'],
  ['#B39DFF', '#8E73E8'],
  ['#FF9F43', '#E07A1F'],
];

/** Top-down house: a coloured block with a darker roof. Each level can paint its own houses. */
export function HouseTile({ size, index, colors = HOUSES }: { size: number; index: number; colors?: [string, string][] }) {
  const [wall, roof] = colors[index % colors.length];
  const inner = size - 6;
  return (
    <View
      style={{
        position: 'absolute',
        left: 3,
        top: 3,
        width: inner,
        height: inner,
        padding: Math.max(4, inner * 0.16),
        borderRadius: inner * 0.24,
        backgroundColor: wall,
        boxShadow: '0px 3px 0px rgba(30, 42, 79, 0.2)',
      }}>
      <View style={{ flex: 1, borderRadius: inner * 0.14, backgroundColor: roof }} />
    </View>
  );
}

/** Railway track running left-right: gravel, sleepers and two rails. */
export function RailTile({ size }: { size: number }) {
  const sleepers = Math.max(3, Math.round(size / 13));
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, backgroundColor: '#CDB794' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', height: '100%' }}>
        {Array.from({ length: sleepers }, (_, i) => (
          <View key={i} style={{ width: size * 0.12, height: '100%', backgroundColor: '#A0714A' }} />
        ))}
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: '26%', height: '9%', backgroundColor: '#5A6275' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: '65%', height: '9%', backgroundColor: '#5A6275' }} />
    </View>
  );
}
