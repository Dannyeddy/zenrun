import { FoodAssetKey, TreasureAssetKey } from '../data/assets';

export type RouteFragmentKind = 'historical' | 'modern' | 'test';
export type RouteFragmentRewardType = 'treasure' | 'food';

export interface RouteCheckpoint {
  id: string;
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  type: 'start' | 'turn' | 'landmark' | 'finish';
  isFragmentPoint: boolean;
  fragmentIndex?: number;
  triggerRadius: number;
}

export type RouteFragmentReward =
  | {
      routeId: string;
      routeType: RouteFragmentKind;
      rewardType: 'treasure';
      rewardId: TreasureAssetKey;
      rewardName: string;
      requiredFragmentCount: number;
      checkpoints: RouteCheckpoint[];
    }
  | {
      routeId: string;
      routeType: RouteFragmentKind;
      rewardType: 'food';
      rewardId: FoodAssetKey;
      rewardName: string;
      foodCount: number;
      requiredFragmentCount: number;
      checkpoints: RouteCheckpoint[];
    };

export interface RouteFragmentProgress {
  collectedFragmentIds: string[];
  completed: boolean;
  rewardClaimed?: boolean;
  updatedAt?: string;
}

export interface CurrentRunFragments {
  routeId: string;
  collectedFragmentIds: string[];
}

const checkpoint = (
  routeId: string,
  id: string,
  name: string,
  lat: number,
  lng: number,
  type: RouteCheckpoint['type'],
  fragmentIndex: number,
  triggerRadius = 90,
): RouteCheckpoint => ({
  id,
  routeId,
  name,
  lat,
  lng,
  type,
  isFragmentPoint: true,
  fragmentIndex,
  triggerRadius,
});

export const routeFragmentRewards: Record<string, RouteFragmentReward> = {
  h1: {
    routeId: 'h1',
    routeType: 'historical',
    rewardType: 'treasure',
    rewardId: 'baowu1',
    rewardName: 'Mise Celadon Lotus Bowl',
    requiredFragmentCount: 5,
    checkpoints: [
      checkpoint('h1', 'h1-pingjiang-start', 'Pingjiang Road', 31.316106, 120.629586, 'start', 1),
      checkpoint('h1', 'h1-lion-grove', 'Lion Grove Garden', 31.322945, 120.625529, 'landmark', 2),
      checkpoint('h1', 'h1-suzhou-museum', 'Suzhou Museum', 31.324834, 120.623717, 'landmark', 3),
      checkpoint(
        'h1',
        'h1-humble-garden',
        "Humble Administrator's Garden",
        31.325503,
        120.626257,
        'landmark',
        4,
      ),
      checkpoint('h1', 'h1-route-finish', 'Pingjiang Heritage Finish', 31.315611, 120.629699, 'finish', 5),
    ],
  },
  h2: {
    routeId: 'h2',
    routeType: 'historical',
    rewardType: 'treasure',
    rewardId: 'baowu5',
    rewardName: 'Fish-roe Green Olive-shaped Zun',
    requiredFragmentCount: 5,
    checkpoints: [
      checkpoint('h2', 'h2-shantang-start', 'Shantang Street', 31.320119, 120.596266, 'start', 1),
      checkpoint('h2', 'h2-lingering-garden', 'Lingering Garden', 31.317139, 120.589152, 'landmark', 2),
      checkpoint('h2', 'h2-xiyuan-temple', 'Xiyuan Temple', 31.315508, 120.583683, 'landmark', 3),
      checkpoint('h2', 'h2-garden-turn', 'Shantang Garden Turn', 31.318301, 120.599451, 'turn', 4),
      checkpoint('h2', 'h2-route-finish', 'Shantang Garden Finish', 31.319861, 120.595915, 'finish', 5),
    ],
  },
  m1: {
    routeId: 'm1',
    routeType: 'modern',
    rewardType: 'food',
    rewardId: 'fish',
    rewardName: 'Fish',
    foodCount: 2,
    requiredFragmentCount: 5,
    checkpoints: [
      checkpoint('m1', 'm1-bailuyuan-start', 'Bailuyuan Start', 31.277163, 120.717731, 'start', 1),
      checkpoint('m1', 'm1-moonbay-north', 'Moon Bay North Turn', 31.270507, 120.719934, 'turn', 2),
      checkpoint('m1', 'm1-bailu-garden-waypoint', 'Bailuyuan Garden Waypoint', 31.266526, 120.718261, 'turn', 3),
      checkpoint('m1', 'm1-moonbay-waterfront', 'Moon Bay Waterfront', 31.258297, 120.717043, 'landmark', 4),
      checkpoint('m1', 'm1-moonbay-finish', 'Bailuyuan Moon Bay Finish', 31.277288, 120.718056, 'finish', 5),
    ],
  },
  m2: {
    routeId: 'm2',
    routeType: 'modern',
    rewardType: 'food',
    rewardId: 'carrots',
    rewardName: 'Carrots',
    foodCount: 2,
    requiredFragmentCount: 5,
    checkpoints: [
      checkpoint('m2', 'm2-yinshan-start', 'Yinshan Lake Start', 31.246939, 120.694982, 'start', 1),
      checkpoint('m2', 'm2-yinshan-west-turn', 'Yinshan Lake West Turn', 31.246956, 120.680078, 'turn', 2),
      checkpoint('m2', 'm2-yinshan-south-turn', 'Yinshan Lake South Turn', 31.242526, 120.6758, 'turn', 3),
      checkpoint('m2', 'm2-yinshan-waterfront', 'Yinshan Lake Waterfront', 31.236192, 120.680707, 'landmark', 4),
      checkpoint('m2', 'm2-yinshan-finish', 'Yinshan Lake Finish', 31.245944, 120.696263, 'finish', 5),
    ],
  },
  'xjtlu-test': {
    routeId: 'xjtlu-test',
    routeType: 'test',
    rewardType: 'treasure',
    rewardId: 'baowu3',
    rewardName: 'Pearl Sarira Pagoda',
    requiredFragmentCount: 6,
    checkpoints: [
      checkpoint(
        'xjtlu-test',
        'xjtlu-life-sciences-building',
        'XJTLU Life Sciences Building',
        31.278294,
        120.732617,
        'start',
        1,
        120,
      ),
      checkpoint(
        'xjtlu-test',
        'xjtlu-central-building',
        'XJTLU Central Building',
        31.277148,
        120.733629,
        'landmark',
        2,
        100,
      ),
      checkpoint(
        'xjtlu-test',
        'xjtlu-central-library',
        'XJTLU Central Library',
        31.275026,
        120.733931,
        'landmark',
        3,
        100,
      ),
      checkpoint(
        'xjtlu-test',
        'xjtlu-sports-centre',
        'XJTLU Sports Centre',
        31.272608,
        120.73894,
        'landmark',
        4,
        100,
      ),
      checkpoint(
        'xjtlu-test',
        'xjtlu-ibss',
        'International Business School Suzhou',
        31.271564,
        120.735386,
        'landmark',
        5,
        100,
      ),
      checkpoint(
        'xjtlu-test',
        'xjtlu-film-school',
        'XJTLU School of Film and TV Arts',
        31.272505,
        120.734958,
        'finish',
        6,
        100,
      ),
    ],
  },
};

export const getRouteFragmentReward = (routeId: string | undefined) =>
  routeId ? routeFragmentRewards[routeId] ?? null : null;

export const getFragmentPointsForRoute = (routeId: string | undefined) =>
  getRouteFragmentReward(routeId)?.checkpoints.filter((point) => point.isFragmentPoint) ?? [];

export const getRequiredFragmentCount = (routeId: string | undefined) =>
  getRouteFragmentReward(routeId)?.requiredFragmentCount ?? 0;
