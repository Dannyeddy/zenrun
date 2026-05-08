import { publicAsset } from '../lib/publicAsset';

export type PetAssetKey = 'cat' | 'rabbit' | 'dog';
export type TreasureAssetKey = 'baowu1' | 'baowu2' | 'baowu3' | 'baowu4' | 'baowu5';
export type FoodAssetKey = 'bone' | 'carrots' | 'fish';

export interface PetAssetSet {
  full: string;
  head: string;
}

export const petAssets: Record<PetAssetKey, PetAssetSet> = {
  cat: {
    full: publicAsset('pets/base/cat.jpg'),
    head: publicAsset('pets/head/cat-head.jpg'),
  },
  rabbit: {
    full: publicAsset('pets/base/rabbit.jpg'),
    head: publicAsset('pets/head/rabbit-head.jpg'),
  },
  dog: {
    full: publicAsset('pets/base/dog.jpg'),
    head: publicAsset('pets/head/dog-head.jpg'),
  },
};

export const treasureAssets: Record<TreasureAssetKey, string> = {
  baowu1: publicAsset('baowu1.png'),
  baowu2: publicAsset('baowu2.png'),
  baowu3: publicAsset('baowu3.png'),
  baowu4: publicAsset('baowu4.png'),
  baowu5: publicAsset('baowu5.png'),
};

export const foodAssets: Record<FoodAssetKey, string> = {
  bone: publicAsset('bone.png'),
  carrots: publicAsset('carrots.png'),
  fish: publicAsset('fish.png'),
};
