import { landmarks, LandmarkEntry } from '../data/landmarks';
import {
  defaultHistoricalReward,
  historicalRewards,
  RewardTemplate,
  RouteOption,
  routes,
} from '../lib/demoData';
import { getFragmentPointsForRoute } from '../lib/routeFragments';

export type RouteKind = 'historical' | 'modern' | 'historical-test';
export type RewardRelation =
  | {
      type: 'treasure';
      reward: RewardTemplate;
    }
  | {
      type: 'food';
      portions: number;
    };

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface CulturalRoute extends Omit<RouteOption, 'startPoint'> {
  kind: RouteKind;
  center: GeoPoint;
  startPoint: GeoPoint & {
    name: string;
    address?: string;
    amapName?: string;
  };
  startActivationRadius: number;
  landmarks: LandmarkEntry[];
  rewardRelation: RewardRelation;
  progressionHooks: {
    repeatable: boolean;
    memoryKey: string;
  };
}

const DEFAULT_ROUTE_CENTER: GeoPoint = {
  latitude: 31.299,
  longitude: 120.5853,
};

const toRouteKind = (type: RouteOption['type']): RouteKind => {
  if (type === 'Historical Test') {
    return 'historical-test';
  }

  return type === 'Historical' ? 'historical' : 'modern';
};

const getRouteCenter = (routeLandmarks: LandmarkEntry[]): GeoPoint => {
  if (routeLandmarks.length === 0) {
    return DEFAULT_ROUTE_CENTER;
  }

  return {
    latitude:
      routeLandmarks.reduce((total, landmark) => total + landmark.lat, 0) / routeLandmarks.length,
    longitude:
      routeLandmarks.reduce((total, landmark) => total + landmark.lng, 0) /
      routeLandmarks.length,
  };
};

const getRewardRelation = (route: RouteOption): RewardRelation => {
  if (route.type === 'Historical' || route.type === 'Historical Test') {
    return {
      type: 'treasure',
      reward: historicalRewards[route.id] ?? defaultHistoricalReward,
    };
  }

  return {
    type: 'food',
    portions: 2,
  };
};

const getRouteStartPoint = (
  route: RouteOption,
  routeLandmarks: LandmarkEntry[],
  center: GeoPoint,
): CulturalRoute['startPoint'] => {
  if (route.startPoint) {
    return {
      name: route.startPoint.name,
      address: route.startPoint.address,
      amapName: route.startPoint.amapName,
      latitude: route.startPoint.lat,
      longitude: route.startPoint.lng,
    };
  }

  const firstLandmark = routeLandmarks[0];
  if (firstLandmark) {
    return {
      name: firstLandmark.title,
      latitude: firstLandmark.lat,
      longitude: firstLandmark.lng,
    };
  }

  const firstFragmentPoint = getFragmentPointsForRoute(route.id)[0];
  if (firstFragmentPoint) {
    return {
      name: firstFragmentPoint.name,
      latitude: firstFragmentPoint.lat,
      longitude: firstFragmentPoint.lng,
    };
  }

  return {
    name: `${route.title} start`,
    latitude: center.latitude,
    longitude: center.longitude,
  };
};

export const culturalRoutes: CulturalRoute[] = routes.map((route) => {
  const routeLandmarks = landmarks.filter((landmark) => landmark.routeId === route.id);
  const center = getRouteCenter(routeLandmarks);

  return {
    ...route,
    kind: toRouteKind(route.type),
    center,
    startPoint: getRouteStartPoint(route, routeLandmarks, center),
    startActivationRadius: route.id === 'xjtlu-test' ? 120 : 120,
    landmarks: routeLandmarks,
    rewardRelation: getRewardRelation(route),
    progressionHooks: {
      repeatable: true,
      memoryKey: `route-memory-${route.id}`,
    },
  };
});

export const getCulturalRouteById = (routeId: string | undefined) =>
  culturalRoutes.find((route) => route.id === routeId) ?? culturalRoutes[0];

export const resolveCulturalRoute = (route: Partial<RouteOption> | null | undefined) =>
  getCulturalRouteById(route?.id);
