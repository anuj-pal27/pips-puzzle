import type { ImageSourcePropType } from 'react-native';

import type { FriendId, GiftId, SnackId } from './games';
import { PICTURE_INFO, type Picture } from './puzzles';

// Bundled images: the pictures, the friends, snacks, gifts and train set. New art is drawn in code by the
// art kit in scripts/art/ (`npm run art`) into assets/images/game/.

const IMAGES: Record<string, ImageSourcePropType> = {
  gappu: require('@/assets/images/game/gappu.png'),
  mithu: require('@/assets/images/game/mithu.png'),
  tillu: require('@/assets/images/game/tillu.png'),
  chunnu: require('@/assets/images/game/chunnu.png'),
  shop: require('@/assets/images/game/shop.png'),
  'diwali-shop': require('@/assets/images/game/diwali-shop.png'),
  station: require('@/assets/images/game/station.png'),
  bholu: require('@/assets/images/game/bholu.png'),
  kesar: require('@/assets/images/game/kesar.png'),
  raja: require('@/assets/images/game/raja.png'),
  chikki: require('@/assets/images/game/chikki.png'),
  appu: require('@/assets/images/game/appu.png'),
  mayil: require('@/assets/images/game/mayil.png'),
  bagha: require('@/assets/images/game/bagha.png'),
  momo: require('@/assets/images/game/momo.png'),
  kites: require('@/assets/images/game/kites.png'),
  'boat-race': require('@/assets/images/game/boat-race.png'),
  'toy-train': require('@/assets/images/game/toy-train.png'),
  'big-picture': require('@/assets/images/game/big-picture.png'),
};

/** Every picture bundled in the app, for jigsaws, slide puzzles and the level story cards. */
export const PICTURES: Record<string, Picture> = Object.fromEntries(Object.entries(PICTURE_INFO).map(([id, info]) => [id, { id, ...info, image: IMAGES[id] }]));

/** Cut-outs on a transparent background, all in the same 206 x 220 box (shadows are these, tinted dark). */
export const FRIEND_ART: Record<FriendId, ImageSourcePropType> = {
  gappu: require('@/assets/images/game/gappu-cut.png'),
  mithu: require('@/assets/images/game/mithu-cut.png'),
  tillu: require('@/assets/images/game/tillu-cut.png'),
  chunnu: require('@/assets/images/game/chunnu-cut.png'),
  gauri: require('@/assets/images/game/gauri-cut.png'),
  pip: require('@/assets/images/game/pip-cut.png'),
  bholu: require('@/assets/images/game/bholu-cut.png'),
  kesar: require('@/assets/images/game/kesar-cut.png'),
  raja: require('@/assets/images/game/raja-cut.png'),
  chikki: require('@/assets/images/game/chikki-cut.png'),
  appu: require('@/assets/images/game/appu-cut.png'),
  mayil: require('@/assets/images/game/mayil-cut.png'),
  bagha: require('@/assets/images/game/bagha-cut.png'),
  momo: require('@/assets/images/game/momo-cut.png'),
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
  lassi: require('@/assets/images/game/lassi.png'),
  makkiroti: require('@/assets/images/game/makkiroti.png'),
  ghevar: require('@/assets/images/game/ghevar.png'),
  dalbaati: require('@/assets/images/game/dalbaati.png'),
  dhokla: require('@/assets/images/game/dhokla.png'),
  fafda: require('@/assets/images/game/fafda.png'),
  vadapav: require('@/assets/images/game/vadapav.png'),
  modak: require('@/assets/images/game/modak.png'),
  appam: require('@/assets/images/game/appam.png'),
  coconut: require('@/assets/images/game/coconut.png'),
  idli: require('@/assets/images/game/idli.png'),
  dosa: require('@/assets/images/game/dosa.png'),
  rasgulla: require('@/assets/images/game/rasgulla.png'),
  mishtidoi: require('@/assets/images/game/mishtidoi.png'),
  momos: require('@/assets/images/game/momos.png'),
};

export const GIFT_ART: Record<GiftId, ImageSourcePropType> = {
  dhol: require('@/assets/images/game/dhol.png'),
  puppet: require('@/assets/images/game/puppet.png'),
  kite: require('@/assets/images/game/kite.png'),
  modak: require('@/assets/images/game/modak.png'),
  flowers: require('@/assets/images/game/flowers.png'),
  sugarcane: require('@/assets/images/game/sugarcane.png'),
  rasgulla: require('@/assets/images/game/rasgulla.png'),
  momos: require('@/assets/images/game/momos.png'),
};

/** A maze goal's picture: any snack or gift (jalebis if it's something this app doesn't have). */
export const goalArt = (id: string | undefined): ImageSourcePropType =>
  (id && ((SNACK_ART as Record<string, ImageSourcePropType>)[id] ?? (GIFT_ART as Record<string, ImageSourcePropType>)[id])) || SNACK_ART.jalebi;

export const TRAIN_ART = {
  engine: require('@/assets/images/game/engine.png') as ImageSourcePropType,
  stall: require('@/assets/images/game/stall.png') as ImageSourcePropType,
  station: require('@/assets/images/game/station-house.png') as ImageSourcePropType,
};

export const GAPPU_FACE: ImageSourcePropType = require('@/assets/images/game/gappu-token.png');
export const PIP_ART: ImageSourcePropType = require('@/assets/images/game/pip.png');
