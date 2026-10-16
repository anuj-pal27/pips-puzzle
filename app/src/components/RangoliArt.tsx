import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { classKey, GROUND, PALETTE, shapePath, shapeSize, slotClass, slots, targetColor, type RangoliConfig } from '@/game/rangoli';

// A rangoli drawn from its rings (src/game/rangoli.ts). Shapes not painted yet are dashed outlines, so the
// child can see what's still to fill. `done` paints every shape its picture colour (the "like this" card,
// map thumbnails and the finish screen).

const BORDER: Record<RangoliConfig['style'], string[]> = {
  rangoli: ['#FFD23F', '#FF5C8A', '#3FAE5A', '#2E6FD9', '#FF9F1C'],
  kolam: ['#FFFFFF'],
  pookalam: ['#3FAE5A', '#2F8F47'],
  alpana: ['#FFFFFF'],
  mandana: ['#FFFFFF', '#FFD23F'],
};

export function RangoliArt({ cfg, size, fills = {}, done = false }: { cfg: RangoliConfig; size: number; fills?: Record<string, string>; done?: boolean }) {
  const ground = GROUND[cfg.style];
  const border = BORDER[cfg.style];
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="-100 -100 200 200">
        <Circle r={99} fill={ground.floor} />
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * Math.PI * 2) / 36;
          return <Circle key={`b${i}`} cx={Math.sin(a) * 96} cy={-Math.cos(a) * 96} r={2.2} fill={border[i % border.length]} />;
        })}
        {slots(cfg).map((s) => {
          const cls = slotClass(cfg, s);
          const name = done ? targetColor(cfg, cls) : fills[classKey(cls)];
          const { w, h } = shapeSize(cfg, s.ring);
          const d = shapePath(cfg.rings[s.ring].shape, w, h);
          return (
            <G key={`${s.ring}-${s.index}`} transform={`translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.angle.toFixed(2)})`}>
              {name ? (
                <Path d={d} fill={PALETTE[name] ?? name} />
              ) : (
                <Path d={d} fill="rgba(255,255,255,0.08)" stroke={ground.guide} strokeWidth={1.4} strokeDasharray="3 2.5" />
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
