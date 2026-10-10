import type { ImageSourcePropType } from 'react-native';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from 'react-native-svg';

/**
 * One jigsaw piece: the picture clipped to the piece's outline, with a white edge.
 * The drawing box is the piece's cell plus a margin on every side for the tabs.
 */
export function PieceArt({
  clipId,
  d,
  image,
  imageX,
  imageY,
  boardW,
  boardH,
  boxW,
  boxH,
  edgeWidth = 2,
  shadow = false,
}: {
  clipId: string; // must be unique on screen (web shares SVG ids across the page)
  d: string;
  image: ImageSourcePropType;
  imageX: number;
  imageY: number;
  boardW: number;
  boardH: number;
  boxW: number;
  boxH: number;
  edgeWidth?: number;
  shadow?: boolean;
}) {
  return (
    <Svg width={boxW} height={boxH}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
      </Defs>
      {shadow ? (
        <G transform="translate(0 4)">
          <Path d={d} fill="rgba(30, 42, 79, 0.25)" />
        </G>
      ) : null}
      <SvgImage
        href={image}
        x={imageX}
        y={imageY}
        width={boardW}
        height={boardH}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId})`}
      />
      <Path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={edgeWidth} strokeLinejoin="round" />
    </Svg>
  );
}
