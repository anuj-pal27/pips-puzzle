import { Image, StyleSheet, View } from 'react-native';

import { FRIEND_ART, FRIEND_RATIO, goalArt, SNACK_ART } from '@/data/art';
import { themeFor } from '@/data/levels';
import type { Picture, Puzzle } from '@/data/puzzles';
import { solvedTracks } from '@/game/tracks';
import { colors } from '@/theme';
import { HouseTile } from './MazeParts';
import { RangoliArt } from './RangoliArt';
import { SceneryArt, TrackArt } from './TrackParts';
import { Txt } from './Txt';

// The little picture on a puzzle's map tile, drawn from the puzzle itself: its picture, its friends, its
// snacks, its track map, its maze or its rangoli. So every level (and every puzzle made on the server)
// gets the right thumbnail without anyone drawing one.

export function PuzzleThumb({ puzzle, size, getPicture }: { puzzle: Puzzle; size: number; getPicture: (id: string) => Picture }) {
  const theme = themeFor(puzzle.level);
  const night = theme.id === 'diwali';
  switch (puzzle.kind) {
    case 'jigsaw':
      return <Image source={getPicture(puzzle.picture).image} style={styles.fill} resizeMode="cover" />;

    case 'slide': {
      const n = puzzle.size;
      const k = size / n;
      return (
        <View style={styles.fill}>
          <Image source={getPicture(puzzle.picture).image} style={styles.fill} resizeMode="cover" />
          {Array.from({ length: n - 1 }, (_, i) => (
            <View key={`v${i}`} style={[styles.gridLine, { left: (i + 1) * k - 1, top: 0, bottom: 0, width: 2 }]} />
          ))}
          {Array.from({ length: n - 1 }, (_, i) => (
            <View key={`h${i}`} style={[styles.gridLine, { top: (i + 1) * k - 1, left: 0, right: 0, height: 2 }]} />
          ))}
          <View style={[styles.slideGap, { width: k, height: k, backgroundColor: theme.tray }]} />
        </View>
      );
    }

    case 'shadow': {
      const [a, b] = puzzle.friends;
      return (
        <View style={[styles.fill, { backgroundColor: night ? '#3B4790' : '#A8E6FF' }]}>
          <View style={[styles.ground, { backgroundColor: night ? '#2B6E4F' : colors.grass }]} />
          <Image source={FRIEND_ART[a]} style={{ position: 'absolute', left: -size * 0.08, bottom: 0, width: size * 0.72, height: size * 0.72 * FRIEND_RATIO, tintColor: colors.ink }} />
          <Image source={FRIEND_ART[b]} style={{ position: 'absolute', right: -size * 0.06, bottom: 0, width: size * 0.5, height: size * 0.5 * FRIEND_RATIO }} />
          <View style={[styles.bubble, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]}>
            <Txt weight="display" size={size * 0.2}>?</Txt>
          </View>
        </View>
      );
    }

    case 'memory': {
      const cardW = size * 0.38;
      const cardH = cardW * 1.22;
      const card = (i: number, face?: (typeof puzzle.snacks)[number]) => (
        <View
          key={i}
          style={[
            styles.card,
            {
              width: cardW,
              height: cardH,
              left: size * (i % 2 ? 0.53 : 0.09),
              top: size * (i < 2 ? 0.04 : 0.5),
              backgroundColor: face ? colors.white : colors.sun,
              transform: [{ rotate: `${[-6, 5, 4, -5][i]}deg` }],
            },
          ]}>
          {face ? <Image source={SNACK_ART[face]} style={{ width: cardW * 0.9, height: cardW * 0.9 }} /> : <Txt weight="display" size={cardW * 0.6}>?</Txt>}
        </View>
      );
      return <View style={[styles.fill, { backgroundColor: night ? '#3B3270' : '#FFC2CF' }]}>{[card(0), card(1, puzzle.snacks[0]), card(2, puzzle.snacks[0]), card(3)]}</View>;
    }

    case 'tracks': {
      const map = puzzle.tracks.map;
      const cell = size / Math.max(map.length, map[0].length);
      const solved = solvedTracks(puzzle.tracks).pieces;
      let index = 0;
      return (
        <View style={[styles.fill, { backgroundColor: night ? '#24305E' : '#A8E07F' }]}>
          {map.map((row, r) =>
            row.split('').map((ch, c) => {
              const p = solved[r][c];
              const at = { position: 'absolute' as const, left: c * cell, top: r * cell, width: cell, height: cell };
              if (p) {
                return (
                  <View key={`${c},${r}`} style={[at, { transform: [{ rotate: `${(p.rot % 4) * 90}deg` }] }]}>
                    <TrackArt kind={p.kind} size={cell} lit={night} />
                  </View>
                );
              }
              return ch === '.' ? null : (
                <View key={`${c},${r}`} style={at}>
                  <SceneryArt tile={ch} size={cell} index={index++} />
                </View>
              );
            }),
          )}
        </View>
      );
    }

    case 'maze': {
      const map = puzzle.maze.map;
      const cell = size / Math.max(map.length, map[0].length);
      const offX = (size - cell * map[0].length) / 2;
      const offY = (size - cell * map.length) / 2;
      let house = 0;
      return (
        <View style={[styles.fill, { backgroundColor: night ? '#1B2155' : colors.road }]}>
          {map.flatMap((row, r) =>
            row.split('').map((t, c) => {
              const at = { position: 'absolute' as const, left: offX + c * cell, top: offY + r * cell, width: cell, height: cell };
              if (t === '#') return <View key={`${c},${r}`} style={at}><HouseTile size={cell} index={house++} colors={theme.houses} /></View>;
              if (t === 'R' || (/[A-Z]/.test(t) && !'SJC'.includes(t))) return <View key={`${c},${r}`} style={[at, { backgroundColor: '#A0714A', opacity: 0.6 }]} />;
              if (t === 'J') return <Image key={`${c},${r}`} source={goalArt(puzzle.maze.goal)} style={[at, { transform: [{ scale: 1.6 }] }]} />;
              return null;
            }),
          )}
          {night ? <View style={[styles.fill, { position: 'absolute', backgroundColor: 'rgba(14, 19, 40, 0.45)' }]} /> : null}
        </View>
      );
    }

    case 'rangoli':
      return (
        <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.tray }]}>
          <RangoliArt cfg={puzzle.rangoli} size={size * 0.94} done />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', borderRadius: 17, overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.85)' },
  slideGap: { position: 'absolute', right: 0, bottom: 0, borderTopLeftRadius: 6 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%' },
  bubble: { position: 'absolute', right: '6%', top: '6%', backgroundColor: colors.white, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', borderRadius: 10, borderWidth: 2.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
