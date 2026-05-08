import { routes } from './demoData';
import { publicAsset } from './publicAsset';

export const DEFAULT_SHARE_IMAGE = publicAsset('images/share/default-route.jpg');
export const XJTLU_SHARE_IMAGE = publicAsset('images/share/xjtlu-library.jpg');

export const historicalShareBackgrounds = [
  publicAsset('12f17a7ae6bd5fddd069d26f3ff8bb9e.jpg'),
  publicAsset('15d6db24dd164c059e4c13fb01f4515e.jpg'),
  publicAsset('1bb277f31c236324619ecafedc1a474a.jpg'),
  publicAsset('cbd94d060e64f0f1b3fc01d592344d8b.jpg'),
];

export const modernShareBackgrounds = [
  publicAsset('76a46b9dfc53af015e07c29e0a85df60.jpg'),
  publicAsset('4eaaba0693640d5ddcc197191553d809.jpg'),
  publicAsset('8ec9b7f740c7e8467a9855c83945384e.jpg'),
  publicAsset('b8ce5f24c36d2e3766997e84d8105d78.jpg'),
];

export const routeShareImages: Record<string, string> = {
  h1: publicAsset('pingjianglu.jpg'),
  h2: publicAsset('shantangjie.jpg'),
  m1: publicAsset('xiandailuxian1.jpg'),
  m2: publicAsset('xiandailuxian2.jpg'),
  'xjtlu-test': XJTLU_SHARE_IMAGE,
};

const stableIndex = (value: string, length: number) => {
  const sum = value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return sum % length;
};

export const getShareCardBackground = (routeName: string, routeType: string, routeId?: string) => {
  if (routeId && routeShareImages[routeId]) {
    return routeShareImages[routeId];
  }

  const matchedRoute = routes.find((route) => route.title === routeName);
  if (matchedRoute && routeShareImages[matchedRoute.id]) {
    return routeShareImages[matchedRoute.id];
  }

  const isHistorical = routeType === 'Historical' || routeType === 'Historical Test';
  const candidates = isHistorical ? historicalShareBackgrounds : modernShareBackgrounds;

  if (candidates.length > 0) {
    return candidates[stableIndex(routeName, candidates.length)];
  }

  return matchedRoute?.img ?? DEFAULT_SHARE_IMAGE;
};
