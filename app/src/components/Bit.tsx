import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

// Bit the robot, host of Learn with Bit. Drawn in code (no image files) in the game's flat style.
// `mood` changes the face on his screen; `gifts` are the extras he earns from badges.

export type BitMood = 'idle' | 'happy' | 'think' | 'oops';
export type BitGift = 'scarf' | 'star' | 'headphones' | 'glasses' | 'cape';

const INK = '#1E2A4F';
const BODY = '#3CCFB4';
const BODY_DARK = '#25A892';
const FACE = '#1E2A4F';
const GLOW = '#7CF3FF';
const SUN = '#FFC93C';
const CORAL = '#FF7A59';

function Face({ mood }: { mood: BitMood }) {
  switch (mood) {
    case 'happy':
      return (
        <G fill="none" stroke={GLOW} strokeLinecap="round">
          <Path d="M-19,-7 q6,-8 12,0" strokeWidth={4} />
          <Path d="M7,-7 q6,-8 12,0" strokeWidth={4} />
          <Path d="M-9,3 q9,8 18,0" strokeWidth={3.5} />
        </G>
      );
    case 'think':
      return (
        <G>
          <Rect x={-18} y={-16} width={9} height={12} rx={3} fill={GLOW} />
          <Rect x={8} y={-11} width={11} height={4} rx={2} fill={GLOW} />
          <Path d="M-6,5 h12" stroke={GLOW} strokeWidth={3.5} strokeLinecap="round" />
        </G>
      );
    case 'oops':
      return (
        <G stroke={GLOW} strokeWidth={3.5} strokeLinecap="round" fill="none">
          <Path d="M-18,-15 l9,9 M-9,-15 l-9,9" />
          <Path d="M9,-15 l9,9 M18,-15 l-9,9" />
          <Path d="M-10,6 q3,-4 6,0 q3,4 6,0 q3,-4 6,0" />
        </G>
      );
    default:
      return (
        <G>
          <Rect x={-17} y={-15} width={9} height={12} rx={4} fill={GLOW} />
          <Rect x={8} y={-15} width={9} height={12} rx={4} fill={GLOW} />
          <Path d="M-6,4 q6,5 12,0" stroke={GLOW} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
  }
}

/** Bit at `size` pixels wide (he is a little taller than wide). */
export function Bit({ size = 120, mood = 'idle', gifts = [], wave = false }: { size?: number; mood?: BitMood; gifts?: BitGift[]; wave?: boolean }) {
  const has = (g: BitGift) => gifts.includes(g);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size * 1.25} viewBox="-62 -72 124 155">
        {has('cape') ? <Path d="M-26,24 L-40,74 Q0,84 40,74 L26,24 Z" fill="#8E6CEF" /> : null}
        <Ellipse cx={0} cy={77} rx={40} ry={5} fill="rgba(30,42,79,0.15)" />
        {/* antenna */}
        <Line x1={0} y1={-50} x2={0} y2={-38} stroke={INK} strokeWidth={3} />
        <Circle cx={0} cy={-54} r={6} fill={mood === 'think' ? '#FFE48A' : SUN} />
        {/* wheels */}
        <Circle cx={-18} cy={66} r={9} fill={INK} />
        <Circle cx={-18} cy={66} r={3} fill={SUN} />
        <Circle cx={18} cy={66} r={9} fill={INK} />
        <Circle cx={18} cy={66} r={3} fill={SUN} />
        {/* arms: one waves when he's happy */}
        <Path d="M-30,34 L-46,50" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={-48} cy={52} r={5} fill={CORAL} />
        {wave || mood === 'happy' ? (
          <>
            <Path d="M30,34 L46,18" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <Circle cx={48} cy={16} r={5} fill={CORAL} />
          </>
        ) : (
          <>
            <Path d="M30,34 L46,50" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <Circle cx={48} cy={52} r={5} fill={CORAL} />
          </>
        )}
        {/* body */}
        <Rect x={-30} y={22} width={60} height={38} rx={11} fill={BODY} />
        <Rect x={-30} y={50} width={60} height={10} rx={5} fill={BODY_DARK} opacity={0.5} />
        {has('star') ? (
          <Path d="M0,31 l3.4,7 7.6,1 -5.5,5.3 1.3,7.6 -6.8,-3.6 -6.8,3.6 1.3,-7.6 -5.5,-5.3 7.6,-1 z" fill={SUN} />
        ) : (
          <Circle cx={0} cy={41} r={7} fill={SUN} />
        )}
        {/* head */}
        {has('headphones') ? <Path d="M-40,-10 Q-40,-50 0,-50 Q40,-50 40,-10" fill="none" stroke={INK} strokeWidth={5} /> : null}
        <Circle cx={-42} cy={-8} r={has('headphones') ? 9 : 6} fill={has('headphones') ? INK : CORAL} />
        <Circle cx={42} cy={-8} r={has('headphones') ? 9 : 6} fill={has('headphones') ? INK : CORAL} />
        <Rect x={-40} y={-40} width={80} height={62} rx={17} fill={BODY} />
        <Ellipse cx={-24} cy={-31} rx={8} ry={4} fill="#FFFFFF" opacity={0.45} />
        <Rect x={-30} y={-29} width={60} height={41} rx={11} fill={FACE} />
        <Face mood={mood} />
        {has('glasses') ? (
          <G fill="none" stroke={SUN} strokeWidth={3}>
            <Circle cx={-13} cy={-9} r={10} />
            <Circle cx={13} cy={-9} r={10} />
            <Path d="M-3,-9 h6" />
          </G>
        ) : null}
        {has('scarf') ? (
          <G>
            <Rect x={-28} y={19} width={56} height={9} rx={4.5} fill={CORAL} />
            <Path d="M14,24 l6,18 l8,-3 l-6,-16 z" fill={CORAL} />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
