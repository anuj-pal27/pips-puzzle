import type { ReactNode } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { FRIEND_ART, SNACK_ART, TRAIN_ART } from '@/data/art';
import type { ThingId } from '@/game/teach';

// The pictures in Teach the Robot. Most are drawn here in code (flat colours, a soft highlight and a
// ground shadow, like the rest of the game's art); a few reuse the game's own pictures.
// Each picture shows the things Bit looks at (src/game/teach.ts): its colour, a stem, wings, wheels...

const SHADOW = 'rgba(30,42,79,0.12)';
const INK = '#1E2A4F';
const STEM = '#7A4E25';
const LEAF = '#5DBB4A';

const Ground = ({ w = 30 }: { w?: number }) => <Ellipse cx={50} cy={91} rx={w} ry={4.5} fill={SHADOW} />;
const Shine = ({ x, y, rx = 6, ry = 4, r = -30 }: { x: number; y: number; rx?: number; ry?: number; r?: number }) => (
  <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#FFFFFF" opacity={0.55} transform={`rotate(${r} ${x} ${y})`} />
);

const ball = (c: string, dark: string) => (
  <G>
    <Ground w={26} />
    <Circle cx={50} cy={56} r={30} fill={c} />
    <Path d="M50,26 A30,30 0 0 1 50,86 A30,30 0 0 0 50,26 Z" fill={dark} opacity={0.35} />
    <Path d="M22,48 Q50,62 78,48" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" />
    <Shine x={38} y={40} rx={8} ry={5} />
  </G>
);

const shoe = (c: string, dark: string) => (
  <G>
    <Ground w={36} />
    <Path d="M14,74 L16,46 Q17,38 26,38 L42,38 Q46,52 60,56 L80,60 Q90,63 90,72 L90,76 L14,76 Z" fill={c} />
    <Path d="M14,70 L90,70 L90,80 Q90,84 86,84 L18,84 Q14,84 14,80 Z" fill="#FFFFFF" />
    <Path d="M14,80 L90,80" stroke="#D9DEE8" strokeWidth={3} />
    <Path d="M42,38 Q46,52 60,56" stroke={dark} strokeWidth={3} fill="none" />
    <G stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round">
      <Line x1={30} y1={44} x2={40} y2={48} />
      <Line x1={33} y1={52} x2={45} y2={55} />
      <Line x1={38} y1={60} x2={50} y2={61} />
    </G>
  </G>
);

const car = (c: string, dark: string) => (
  <G>
    <Ground w={38} />
    <Path d="M28,48 Q32,34 44,34 L60,34 Q70,34 74,48 Z" fill={c} />
    <Path d="M36,47 Q38,39 45,39 L50,39 L50,47 Z M54,47 L54,39 L59,39 Q66,39 68,47 Z" fill="#BFE6FF" />
    <Rect x={12} y={46} width={78} height={24} rx={11} fill={c} />
    <Rect x={12} y={60} width={78} height={10} rx={5} fill={dark} opacity={0.45} />
    <Rect x={80} y={52} width={8} height={5} rx={2.5} fill="#FFE48A" />
    <Circle cx={30} cy={72} r={10} fill={INK} />
    <Circle cx={30} cy={72} r={4} fill="#C9D3E3" />
    <Circle cx={72} cy={72} r={10} fill={INK} />
    <Circle cx={72} cy={72} r={4} fill="#C9D3E3" />
  </G>
);

const book = (c: string, dark: string) => (
  <G>
    <Ground w={32} />
    <G transform="rotate(-6 50 56)">
      <Rect x={22} y={26} width={58} height={60} rx={5} fill="#F4EEE2" />
      <Rect x={18} y={22} width={58} height={60} rx={5} fill={c} />
      <Rect x={18} y={22} width={10} height={60} rx={4} fill={dark} opacity={0.5} />
      <Rect x={36} y={36} width={30} height={7} rx={3.5} fill="#FFFFFF" opacity={0.85} />
      <Rect x={36} y={48} width={22} height={5} rx={2.5} fill="#FFFFFF" opacity={0.6} />
    </G>
  </G>
);

const DRAWN: Partial<Record<ThingId, ReactNode>> = {
  apple: (
    <G>
      <Ground />
      <Circle cx={40} cy={58} r={25} fill="#E8483A" />
      <Circle cx={60} cy={58} r={25} fill="#E8483A" />
      <Path d="M60,33 A25,25 0 0 1 60,83 Q70,70 60,33 Z" fill="#C93A2E" opacity={0.6} />
      <Path d="M50,36 Q51,26 56,20" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M55,26 Q66,16 76,22 Q66,32 55,26 Z" fill={LEAF} />
      <Shine x={34} y={48} rx={7} ry={5} />
    </G>
  ),
  cherry: (
    <G>
      <Ground w={28} />
      <Path d="M36,62 Q40,36 56,22 M64,66 Q60,40 56,22" stroke={STEM} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Path d="M56,22 Q68,12 78,20 Q68,30 56,22 Z" fill={LEAF} />
      <Circle cx={34} cy={70} r={15} fill="#D7263D" />
      <Circle cx={66} cy={74} r={15} fill="#D7263D" />
      <Shine x={28} y={64} rx={4} ry={3} />
      <Shine x={60} y={68} rx={4} ry={3} />
    </G>
  ),
  strawberry: (
    <G>
      <Ground w={24} />
      <Path d="M50,88 C26,72 20,52 28,40 Q50,30 72,40 C80,52 74,72 50,88 Z" fill="#E8394A" />
      <Path d="M50,88 C62,78 74,62 72,40 Q66,38 62,37 C66,58 60,74 50,88 Z" fill="#C42839" opacity={0.6} />
      <G fill="#FFE48A">
        {[[38, 50], [50, 46], [62, 50], [44, 60], [56, 60], [40, 70], [52, 72], [62, 66], [48, 80]].map(([x, y], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={1.8} ry={2.6} />
        ))}
      </G>
      <Path d="M30,40 L38,30 L44,38 L50,26 L56,38 L62,30 L70,40 Q50,46 30,40 Z" fill={LEAF} />
      <Path d="M50,28 L50,18" stroke={STEM} strokeWidth={3.5} strokeLinecap="round" />
    </G>
  ),
  banana: (
    <G>
      <Ground w={34} />
      <Path d="M18,38 Q24,78 76,74 Q86,73 88,66 Q52,74 32,34 Z" fill="#FFD43B" />
      <Path d="M88,66 Q52,74 32,34 L28,36 Q44,72 84,70 Z" fill="#E8B600" opacity={0.6} />
      <Path d="M18,38 L32,34 L30,26 L22,28 Z" fill={STEM} />
      <Circle cx={87} cy={67} r={3} fill={STEM} />
    </G>
  ),
  grapes: (
    <G>
      <Ground w={24} />
      <Path d="M50,30 Q52,20 58,14" stroke={STEM} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Path d="M54,22 Q66,12 76,20 Q66,30 54,22 Z" fill={LEAF} />
      <G fill="#8BC34A">
        {[[38, 38], [52, 36], [66, 40], [32, 52], [46, 50], [60, 52], [72, 54], [40, 64], [54, 64], [66, 66], [46, 77], [60, 78], [53, 88]].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y - 4} r={8.5} />
        ))}
      </G>
      <G fill="#FFFFFF" opacity={0.5}>
        {[[35, 31], [49, 29], [43, 43], [57, 45], [37, 57], [51, 57]].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={2.2} />
        ))}
      </G>
    </G>
  ),
  ball: ball('#3B82F6', '#1E5BC6'),
  redball: ball('#E8483A', '#B9302A'),
  shoe: shoe('#8E6CEF', '#6A4CC7'),
  redshoe: shoe('#E8483A', '#B9302A'),
  car: car('#4CB944', '#2F8A2C'),
  bluecar: car('#3B82F6', '#1E5BC6'),
  redcar: car('#E8483A', '#B9302A'),
  book: book('#3B82F6', '#1E5BC6'),
  redbook: book('#E8483A', '#B9302A'),
  butterfly: (
    <G>
      <Ground w={20} />
      <Ellipse cx={32} cy={42} rx={20} ry={17} fill="#FF9F43" transform="rotate(-20 32 42)" />
      <Ellipse cx={68} cy={42} rx={20} ry={17} fill="#FF9F43" transform="rotate(20 68 42)" />
      <Ellipse cx={36} cy={66} rx={14} ry={12} fill="#FF7A59" transform="rotate(20 36 66)" />
      <Ellipse cx={64} cy={66} rx={14} ry={12} fill="#FF7A59" transform="rotate(-20 64 66)" />
      <Circle cx={30} cy={40} r={6} fill="#FFE48A" />
      <Circle cx={70} cy={40} r={6} fill="#FFE48A" />
      <Rect x={46} y={34} width={8} height={44} rx={4} fill={INK} />
      <Path d="M48,36 Q42,22 36,18 M52,36 Q58,22 64,18" stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Circle cx={36} cy={18} r={2.5} fill={INK} />
      <Circle cx={64} cy={18} r={2.5} fill={INK} />
    </G>
  ),
  plane: (
    <G>
      <Ground w={34} />
      <Path d="M44,52 L26,80 L36,80 L60,54 Z" fill="#D6DEEA" />
      <Path d="M44,48 L30,22 L40,22 L62,46 Z" fill="#E4EAF3" />
      <Path d="M12,50 Q12,42 22,42 L80,42 Q92,42 94,50 Q92,58 80,58 L22,58 Q12,58 12,50 Z" fill="#FFFFFF" />
      <Path d="M12,50 Q12,58 22,58 L80,58 Q92,58 94,50 Z" fill="#DCE3EE" />
      <Path d="M12,50 L8,30 L18,30 L26,44 Z" fill="#FF7A59" />
      <G fill="#7CC4FF">
        <Circle cx={40} cy={49} r={3} />
        <Circle cx={50} cy={49} r={3} />
        <Circle cx={60} cy={49} r={3} />
        <Circle cx={70} cy={49} r={3} />
      </G>
      <Path d="M84,45 Q90,46 92,50 L84,50 Z" fill="#7CC4FF" />
    </G>
  ),
  bee: (
    <G>
      <Ground w={22} />
      <Ellipse cx={40} cy={34} rx={14} ry={18} fill="#CFEFFF" opacity={0.9} transform="rotate(-25 40 34)" />
      <Ellipse cx={60} cy={34} rx={14} ry={18} fill="#CFEFFF" opacity={0.9} transform="rotate(25 60 34)" />
      <Ellipse cx={50} cy={60} rx={30} ry={22} fill="#FFC93C" />
      <G fill={INK}>
        <Rect x={40} y={39} width={8} height={42} rx={3} />
        <Rect x={56} y={40} width={8} height={40} rx={3} />
      </G>
      <Path d="M80,60 L90,62 L80,66 Z" fill={INK} />
      <Circle cx={28} cy={56} r={4} fill={INK} />
      <Circle cx={27} cy={55} r={1.3} fill="#FFFFFF" />
      <Path d="M26,66 Q30,70 34,66" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </G>
  ),
  sun: (
    <G>
      <G fill="#FFB020">
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i * 36 * Math.PI) / 180;
          const [x, y] = [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)];
          const [l, r] = [a - 0.22, a + 0.22];
          return <Polygon key={i} points={`${x},${y} ${50 + 27 * Math.cos(l)},${50 + 27 * Math.sin(l)} ${50 + 27 * Math.cos(r)},${50 + 27 * Math.sin(r)}`} />;
        })}
      </G>
      <Circle cx={50} cy={50} r={25} fill="#FFD43B" />
      <Circle cx={42} cy={47} r={2.8} fill={INK} />
      <Circle cx={58} cy={47} r={2.8} fill={INK} />
      <Path d="M42,57 Q50,63 58,57" stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Circle cx={36} cy={55} r={3.5} fill="#FF9F43" opacity={0.6} />
      <Circle cx={64} cy={55} r={3.5} fill="#FF9F43" opacity={0.6} />
    </G>
  ),
  soup: (
    <G>
      <Ground w={34} />
      <G stroke="#AEB8C8" strokeWidth={4} fill="none" strokeLinecap="round">
        <Path d="M38,40 q-6,-8 0,-16 q6,-8 0,-16" />
        <Path d="M54,40 q-6,-8 0,-16 q6,-8 0,-16" />
        <Path d="M70,40 q-6,-8 0,-16 q6,-8 0,-16" />
      </G>
      <Path d="M14,52 L86,52 Q84,84 50,84 Q16,84 14,52 Z" fill="#3B82F6" />
      <Path d="M50,84 Q84,84 86,52 L74,52 Q72,80 50,84 Z" fill="#1E5BC6" opacity={0.5} />
      <Ellipse cx={50} cy={52} rx={36} ry={8} fill="#FF9F43" />
      <Circle cx={40} cy={51} r={3} fill="#FFD08A" />
      <Circle cx={58} cy={53} r={2.5} fill="#7ED957" />
    </G>
  ),
  fire: (
    <G>
      <Ground w={34} />
      <Path d="M20,82 L80,68" stroke="#8B5A2B" strokeWidth={10} strokeLinecap="round" />
      <Path d="M20,68 L80,82" stroke="#A0682F" strokeWidth={10} strokeLinecap="round" />
      <Path d="M50,74 C28,66 30,44 42,30 C42,42 50,44 50,34 C58,40 72,52 64,66 C62,72 56,74 50,74 Z" fill="#FF7A2F" />
      <Path d="M50,72 C40,66 40,54 46,46 C48,54 54,52 54,46 C60,54 62,64 50,72 Z" fill="#FFC93C" />
    </G>
  ),
  snowman: (
    <G>
      <Ground w={26} />
      <Circle cx={50} cy={68} r={22} fill="#FFFFFF" stroke="#BCD0E6" strokeWidth={2.5} />
      <Path d="M50,46 A22,22 0 0 1 50,90 A22,22 0 0 0 66,68 Q66,52 50,46 Z" fill="#DCE8F5" />
      <Circle cx={50} cy={34} r={15} fill="#FFFFFF" stroke="#BCD0E6" strokeWidth={2.5} />
      <Path d="M50,19 A15,15 0 0 1 50,49 Q62,40 50,19 Z" fill="#DCE8F5" />
      <Rect x={34} y={45} width={32} height={7} rx={3.5} fill="#E8483A" />
      <Path d="M58,48 l4,14 l6,-2 l-3,-12 z" fill="#E8483A" />
      <Circle cx={45} cy={31} r={2.2} fill={INK} />
      <Circle cx={55} cy={31} r={2.2} fill={INK} />
      <Path d="M50,35 L62,38 L50,39 Z" fill="#FF9F43" />
      <Circle cx={50} cy={62} r={2.2} fill={INK} />
      <Circle cx={50} cy={72} r={2.2} fill={INK} />
    </G>
  ),
  icecube: (
    <G>
      <Ground w={34} />
      <G transform="rotate(-10 34 58)">
        <Rect x={14} y={40} width={36} height={36} rx={7} fill="#9ED8FF" />
        <Rect x={14} y={40} width={36} height={12} rx={6} fill="#C9EBFF" />
        <Shine x={24} y={58} rx={4} ry={8} r={0} />
      </G>
      <G transform="rotate(12 66 62)">
        <Rect x={48} y={44} width={34} height={34} rx={7} fill="#7CC4FF" />
        <Rect x={48} y={44} width={34} height={11} rx={6} fill="#B3DDFF" />
        <Shine x={58} y={62} rx={4} ry={7} r={0} />
      </G>
    </G>
  ),
  icecream: (
    <G>
      <Path d="M32,48 L50,92 L68,48 Z" fill="#E7B67A" />
      <G stroke="#C98B4F" strokeWidth={2}>
        <Line x1={38} y1={52} x2={58} y2={80} />
        <Line x1={50} y1={50} x2={64} y2={64} />
        <Line x1={62} y1={52} x2={42} y2={80} />
        <Line x1={50} y1={50} x2={36} y2={64} />
      </G>
      <Circle cx={50} cy={38} r={20} fill="#FF9EC0" />
      <Path d="M30,44 Q36,52 42,46 Q48,54 54,46 Q60,54 66,46 Q70,50 70,40 L30,40 Z" fill="#FF9EC0" />
      <Shine x={42} y={30} rx={5} ry={3.5} />
      <Circle cx={50} cy={16} r={5} fill="#E8394A" />
    </G>
  ),
  snowflake: (
    <G stroke="#7CC4FF" strokeWidth={5} strokeLinecap="round" fill="none">
      {[0, 60, 120].map((a) => (
        <G key={a} transform={`rotate(${a} 50 50)`}>
          <Line x1={50} y1={12} x2={50} y2={88} />
          <Path d="M40,20 L50,30 L60,20 M40,80 L50,70 L60,80" />
        </G>
      ))}
      <Circle cx={50} cy={50} r={6} fill="#CFEFFF" stroke="#7CC4FF" />
    </G>
  ),
  carrot: (
    <G>
      <Ground w={28} />
      <Path d="M30,34 Q24,30 22,20 Q30,24 34,30 Q32,16 40,10 Q42,22 40,30 Q48,20 58,22 Q50,28 44,34 Z" fill={LEAF} />
      <Path d="M28,38 Q36,30 46,36 L84,82 Q86,86 80,84 Z" fill="#FF8A2B" />
      <Path d="M46,36 L84,82 Q86,86 80,84 L60,62 Q52,46 46,36 Z" fill="#E86E14" opacity={0.6} />
      <G stroke="#D35F0C" strokeWidth={2} strokeLinecap="round">
        <Line x1={40} y1={46} x2={47} y2={44} />
        <Line x1={50} y1={58} x2={57} y2={55} />
        <Line x1={60} y1={68} x2={66} y2={66} />
      </G>
    </G>
  ),
  peas: (
    <G>
      <Ground w={36} />
      <Path d="M10,56 Q20,34 50,36 Q80,36 92,52 Q82,72 50,72 Q20,72 10,56 Z" fill="#6FBF3A" />
      <Path d="M16,54 Q26,44 50,44 Q76,44 86,52 Q76,64 50,64 Q26,64 16,54 Z" fill="#A6E35B" />
      <G fill="#4F9E24">
        <Circle cx={30} cy={54} r={8} />
        <Circle cx={47} cy={54} r={8.5} />
        <Circle cx={64} cy={54} r={8} />
      </G>
      <G fill="#FFFFFF" opacity={0.45}>
        <Circle cx={27} cy={51} r={2} />
        <Circle cx={44} cy={51} r={2} />
        <Circle cx={61} cy={51} r={2} />
      </G>
      <Path d="M90,52 Q96,46 94,40" stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
    </G>
  ),
  radish: (
    <G>
      <Ground w={24} />
      <Path d="M38,30 Q30,18 32,8 Q40,16 44,26 Q46,10 54,6 Q54,20 52,28 Q60,16 70,16 Q62,26 56,32 Z" fill={LEAF} />
      <Path d="M36,34 Q50,26 62,34 Q64,50 54,74 Q51,86 50,92 Q48,86 46,74 Q36,50 36,34 Z" fill="#F7F4EE" stroke="#CBD5E2" strokeWidth={2} />
      <Path d="M50,30 Q62,30 62,34 Q64,50 54,74 Q51,86 50,92 Q56,60 50,30 Z" fill="#DCE3EE" />
      <Path d="M36,36 Q50,30 62,36" stroke="#F3B6C8" strokeWidth={3} fill="none" strokeLinecap="round" />
    </G>
  ),
};

const PICTURES: Partial<Record<ThingId, ImageSourcePropType>> = {
  mango: SNACK_ART.mango,
  chai: SNACK_ART.chai,
  kulfi: SNACK_ART.kulfi,
  parrot: FRIEND_ART.mithu,
  goat: FRIEND_ART.gappu,
  tortoise: FRIEND_ART.tillu,
  cow: FRIEND_ART.gauri,
  train: TRAIN_ART.engine,
};

/** One Teach-the-Robot picture, `size` pixels square. */
export function ThingArt({ id, size }: { id: ThingId; size: number }) {
  const picture = PICTURES[id];
  if (picture) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
        <Image source={picture} style={{ width: size * 0.92, height: size * 0.92 }} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {DRAWN[id]}
      </Svg>
    </View>
  );
}

