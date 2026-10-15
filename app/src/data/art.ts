import type { ImageSourcePropType } from 'react-native';

import type { FriendId, SnackId } from './games';

// Bundled images for the friends, snacks, train set and map thumbnails.

/** Cut-outs on a transparent background, all in the same 206 x 220 box (shadows are these, tinted dark). */
export const FRIEND_ART: Record<FriendId, ImageSourcePropType> = {
  gappu: require('@/assets/images/game/gappu-cut.png'),
  mithu: require('@/assets/images/game/mithu-cut.png'),
  tillu: require('@/assets/images/game/tillu-cut.png'),
  chunnu: require('@/assets/images/game/chunnu-cut.png'),
  gauri: require('@/assets/images/game/gauri-cut.png'),
  pip: require('@/assets/images/game/pip-cut.png'),
};
export const FRIEND_RATIO = 220 / 206; // height / width

export const SNACK_ART: Record<SnackId, ImageSourcePropType> = {
  jalebi: require('@/assets/images/game/jalebi.png'),
  laddoo: require('@/assets/images/game/laddoo.png'),
  samosa: require('@/assets/images/game/samosa.png'),
  chai: require('@/assets/images/game/chai.png'),
  kulfi: require('@/assets/images/game/kulfi.png'),
  mango: require('@/assets/images/game/mango.png'),
  kajukatli: require('@/assets/images/game/kajukatli.png'),
  gulabjamun: require('@/assets/images/game/gulabjamun.png'),
  barfi: require('@/assets/images/game/barfi.png'),
};

export const TRAIN_ART = {
  engine: require('@/assets/images/game/engine.png') as ImageSourcePropType,
  stall: require('@/assets/images/game/stall.png') as ImageSourcePropType,
  station: require('@/assets/images/game/station-house.png') as ImageSourcePropType,
};

export const GAPPU_FACE: ImageSourcePropType = require('@/assets/images/game/gappu-token.png');

export const THUMBS = {
  maze: require('@/assets/images/game/maze-thumb.png') as ImageSourcePropType,
  'maze-medium': require('@/assets/images/game/maze-night-thumb.png') as ImageSourcePropType, // Diwali Night
  slide: require('@/assets/images/game/slide-thumb.png') as ImageSourcePropType,
  'shadow-easy': require('@/assets/images/game/shadow-easy-thumb.png') as ImageSourcePropType,
  'shadow-medium': require('@/assets/images/game/shadow-night-thumb.png') as ImageSourcePropType,
  'memory-easy': require('@/assets/images/game/snap-easy-thumb.png') as ImageSourcePropType,
  'memory-medium': require('@/assets/images/game/snap-night-thumb.png') as ImageSourcePropType,
  'memory-hard': require('@/assets/images/game/snap-hard-thumb.png') as ImageSourcePropType,
  'tracks-medium': require('@/assets/images/game/tracks-night-thumb.png') as ImageSourcePropType,
  'tracks-hard': require('@/assets/images/game/tracks-hard-thumb.png') as ImageSourcePropType,
};
