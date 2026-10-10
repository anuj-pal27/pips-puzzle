import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill } from '@/components/Buttons';
import { GameHeader, TipBubble, useFinish } from '@/components/GameChrome';
import { Txt } from '@/components/Txt';
import { SLIDE_GAMES } from '@/data/games';
import { getPuzzle, PICTURES, type SlidePuzzle } from '@/data/puzzles';
import { BLANK, canSlide, isSolved, slideStars, slideTile } from '@/game/slide';
import { colors } from '@/theme';

// Slide puzzle: Tillu's picture is mixed up. Tap a tile next to the gap to slide it in.

export default function SlideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPuzzle(id);
  if (!puzzle || puzzle.kind !== 'slide') return <Redirect href="/map" />;
  return <SlideGame key={puzzle.id} puzzle={puzzle} />;
}

function SlideGame({ puzzle }: { puzzle: SlidePuzzle }) {
  const game = SLIDE_GAMES[puzzle.game];
  const picture = PICTURES[puzzle.picture];
  const n = game.size;
  const finish = useFinish(puzzle.id);
  const { width } = useWindowDimensions();
  const [board, setBoard] = useState<number[]>(game.start);
  const [moves, setMoves] = useState(0);
  const [nudge, setNudge] = useState<{ tile: number; count: number }>({ tile: -1, count: 0 });

  const boardW = Math.min(width - 32 - 20, 420);
  const boardH = (boardW * picture.height) / picture.width;
  const tw = boardW / n;
  const th = boardH / n;
  const solved = isSolved(board);

  const tap = (spot: number) => {
    if (solved) return;
    if (!canSlide(board, n, spot)) {
      setNudge((v) => ({ tile: board[spot], count: v.count + 1 }));
      return;
    }
    const next = slideTile(board, n, spot);
    setBoard(next);
    setMoves(moves + 1);
    if (isSolved(next)) finish(slideStars(moves + 1, game.par), 1300);
  };

  const gap = board.indexOf(BLANK);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <GameHeader
        title="Slide Puzzle"
        tier={puzzle.tier}
        right={
          <Pill>
            <Txt weight="extrabold" size={15} color={colors.inkSoft}>Moves</Txt>
            <Txt weight="extrabold" size={20} accessibilityLabel={`${moves} moves`}>{moves}</Txt>
          </Pill>
        }
      />

      <View style={styles.body}>
        <View style={styles.frame}>
          <View style={{ width: boardW, height: boardH, borderRadius: 12, backgroundColor: colors.sandDark }}>
            {!solved ? (
              <View
                style={[styles.gap, { left: (gap % n) * tw + 3, top: Math.floor(gap / n) * th + 3, width: tw - 6, height: th - 6 }]}
                accessibilityElementsHidden
              />
            ) : null}
            {board.map((tile, spot) =>
              tile === BLANK ? null : (
                <Tile
                  key={tile}
                  tile={tile}
                  spot={spot}
                  n={n}
                  tw={tw}
                  th={th}
                  image={picture.image}
                  boardW={boardW}
                  boardH={boardH}
                  gapless={solved}
                  nudge={nudge.tile === tile ? nudge.count : 0}
                  movable={canSlide(board, n, spot)}
                  onPress={() => tap(spot)}
                />
              ),
            )}
            {solved ? (
              <Animated.View entering={FadeIn.duration(500)} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Image source={picture.image} style={{ width: boardW, height: boardH, borderRadius: 12 }} accessibilityLabel={picture.title} />
              </Animated.View>
            ) : null}
          </View>
        </View>

        <View style={styles.goalRow}>
          <View style={styles.goalCard} accessible accessibilityLabel={`Make this picture: ${picture.title}`}>
            <Txt weight="extrabold" size={13} color={colors.inkSoft}>Make this:</Txt>
            <Image source={picture.image} style={{ width: 96, height: (96 * picture.height) / picture.width, borderRadius: 8 }} />
          </View>
        </View>

        <TipBubble
          text={solved ? `${picture.title.split(' ')[0]} is back together!` : 'Tap a tile next to the gap to slide it in.'}
          tone={solved ? 'good' : 'plain'}
        />
      </View>
    </SafeAreaView>
  );
}

/** One piece of the picture. Glides to its new spot; wiggles if it can't move. */
function Tile({
  tile,
  spot,
  n,
  tw,
  th,
  image,
  boardW,
  boardH,
  gapless,
  nudge,
  movable,
  onPress,
}: {
  tile: number;
  spot: number;
  n: number;
  tw: number;
  th: number;
  image: ImageSourcePropType;
  boardW: number;
  boardH: number;
  gapless: boolean;
  nudge: number;
  movable: boolean;
  onPress: () => void;
}) {
  const x = useSharedValue((spot % n) * tw);
  const y = useSharedValue(Math.floor(spot / n) * th);
  const wiggle = useSharedValue(0);
  useEffect(() => {
    x.set(withTiming((spot % n) * tw, { duration: 140 }));
    y.set(withTiming(Math.floor(spot / n) * th, { duration: 140 }));
  }, [spot, n, tw, th, x, y]);
  useEffect(() => {
    if (nudge) wiggle.set(withSequence(withTiming(-4, { duration: 50 }), withTiming(4, { duration: 50 }), withTiming(0, { duration: 50 })));
  }, [nudge, wiggle]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() + wiggle.get() }, { translateY: y.get() }] }));

  const inset = gapless ? 0 : 1.5;
  const r = Math.floor(tile / n);
  const c = tile % n;
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: tw, height: th }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Picture piece ${tile + 1}${movable ? ', next to the gap' : ''}`}
        onPress={onPress}
        style={{ position: 'absolute', left: inset, top: inset, right: inset, bottom: inset, borderRadius: gapless ? 0 : 8, overflow: 'hidden' }}>
        <Image source={image} style={{ position: 'absolute', left: -c * tw - inset, top: -r * th - inset, width: boardW, height: boardH }} />
        {!gapless ? <View style={[styles.edge, movable && styles.edgeMovable]} pointerEvents="none" /> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  body: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  frame: { alignSelf: 'center', padding: 10, borderRadius: 24, backgroundColor: colors.white, boxShadow: `0px 6px 0px ${colors.sandShadow}` },
  gap: { position: 'absolute', borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.sandShadow },
  edge: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.8)' },
  edgeMovable: { borderColor: colors.sun, borderWidth: 3 },
  goalRow: { alignItems: 'center', marginTop: 16 },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingLeft: 14, borderRadius: 18, backgroundColor: colors.white, boxShadow: `0px 4px 0px ${colors.sandShadow}` },
});
