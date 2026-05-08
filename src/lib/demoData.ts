import { petAssets, PetAssetKey, treasureAssets } from '../data/assets';
import { publicAsset } from './publicAsset';

export interface CompanionOption {
  id: number;
  name: string;
  type: string;
  assetKey: PetAssetKey;
  fullImage: string;
  headImage: string;
}

export interface RouteOption {
  id: string;
  title: string;
  dist: string;
  time: string;
  type: 'Historical' | 'Modern' | 'Historical Test';
  reward: string;
  description: string;
  img: string;
  startPoint: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    amapName?: string;
  };
}

export interface RewardTemplate {
  rewardType: 'treasure';
  rewardName: string;
  rewardImage: string;
  sourceRouteId: string;
  sourceRouteName: string;
}

export const companions: CompanionOption[] = [
  {
    id: 1,
    name: 'Aqua Pup',
    type: 'Energetic',
    assetKey: 'dog',
    fullImage: petAssets.dog.full,
    headImage: petAssets.dog.head,
  },
  {
    id: 2,
    name: 'Mint Cat',
    type: 'Calm',
    assetKey: 'cat',
    fullImage: petAssets.cat.full,
    headImage: petAssets.cat.head,
  },
  {
    id: 3,
    name: 'Zen Rabbit',
    type: 'Wise',
    assetKey: 'rabbit',
    fullImage: petAssets.rabbit.full,
    headImage: petAssets.rabbit.head,
  },
];

export const routes: RouteOption[] = [
  {
    id: 'h1',
    title: 'Pingjiang Heritage Trail',
    dist: '3.02 km',
    time: '25 min',
    type: 'Historical',
    reward: 'Mise Celadon Lotus Bowl',
    description:
      'Explore the remnants of the Ming dynasty gardens. This path hides fragments of lost history.',
    img: publicAsset('gudailuxian1.jpg'),
    // TODO: replace with exact start coordinate when the final route entrance is confirmed.
    startPoint: {
      name: 'Pingjiang Road',
      lat: 31.316106,
      lng: 120.629586,
      address: 'Pingjiang Road, Suzhou',
      amapName: '平江路',
    },
  },
  {
    id: 'm1',
    title: 'Bailuyuan Moon Bay Loop',
    dist: '6.01 km',
    time: '40 min',
    type: 'Modern',
    reward: 'Premium Pet Food',
    description:
      'A smooth asphalt path along the river. Perfect for maintaining peak vitality.',
    img: publicAsset('xiandailuxian1.jpg'),
    // TODO: replace with exact start coordinate when the final route entrance is confirmed.
    startPoint: {
      name: 'Bailuyuan Start',
      lat: 31.277163,
      lng: 120.717731,
      address: 'Bailuyuan, Moon Bay, Suzhou',
      amapName: '白鹭园月亮湾',
    },
  },
  {
    id: 'h2',
    title: 'Shantang Garden Heritage Trail',
    dist: '4.01 km',
    time: '50 min',
    type: 'Historical',
    reward: 'Fish-roe Green Olive-shaped Zun',
    description:
      'Trace the steps of ancient traders through this desert-inspired landscape.',
    img: publicAsset('gudailuxian2.jpg'),
    // TODO: replace with exact start coordinate when the final route entrance is confirmed.
    startPoint: {
      name: 'Shantang Street',
      lat: 31.320119,
      lng: 120.596266,
      address: 'Shantang Street, Suzhou',
      amapName: '山塘街',
    },
  },
  {
    id: 'm2',
    title: 'Yinshan Lake Modern Loop',
    dist: '5.58 km',
    time: '22 min',
    type: 'Modern',
    reward: 'Energy Mix',
    description: 'Navigate through the city park with high intensity sprints.',
    img: publicAsset('xiandailuxian2.jpg'),
    // TODO: replace with exact start coordinate when the final route entrance is confirmed.
    startPoint: {
      name: 'Yinshan Lake Start',
      lat: 31.246939,
      lng: 120.694982,
      address: 'Yinshan Lake, Suzhou',
      amapName: '尹山湖',
    },
  },
  {
    id: 'xjtlu-test',
    title: 'XJTLU Campus Test Route',
    dist: '3.44 km',
    time: '6 min',
    type: 'Historical Test',
    reward: 'Pearl Sarira Pagoda',
    description:
      'A temporary GPS validation route for distance-to-start, route activation, and automatic landmark popup testing.',
    img: publicAsset('1.jpg'),
    startPoint: {
      name: 'XJTLU Life Sciences Building',
      lat: 31.278294,
      lng: 120.732617,
      address: "Xi'an Jiaotong-Liverpool University, Suzhou",
      amapName: '西交利物浦大学北校区生命科学楼',
    },
  },
];

export const routeCoverImages = Object.fromEntries(routes.map((route) => [route.id, route.img])) as Record<
  string,
  string
>;

export const historicalRewards: Record<string, RewardTemplate> = {
  h1: {
    rewardType: 'treasure',
    rewardName: 'Mise Celadon Lotus Bowl',
    rewardImage: treasureAssets.baowu1,
    sourceRouteId: 'h1',
    sourceRouteName: 'Pingjiang Heritage Trail',
  },
  h2: {
    rewardType: 'treasure',
    rewardName: 'Fish-roe Green Olive-shaped Zun',
    rewardImage: treasureAssets.baowu5,
    sourceRouteId: 'h2',
    sourceRouteName: 'Shantang Garden Heritage Trail',
  },
  'xjtlu-test': {
    rewardType: 'treasure',
    rewardName: 'Pearl Sarira Pagoda',
    rewardImage: treasureAssets.baowu3,
    sourceRouteId: 'xjtlu-test',
    sourceRouteName: 'XJTLU Campus Test Route',
  },
};

export const defaultHistoricalReward = historicalRewards.h1;
