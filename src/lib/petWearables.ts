import { FoodAssetKey, PetAssetKey, TreasureAssetKey } from '../data/assets';
import { publicAsset } from './publicAsset';

export type EquippedTreasureByPet = Record<PetAssetKey, TreasureAssetKey | null>;

export const emptyEquippedTreasureByPet: EquippedTreasureByPet = {
  dog: null,
  cat: null,
  rabbit: null,
};

export const basePetAssets: Record<PetAssetKey, { body: string; head: string }> = {
  dog: {
    body: publicAsset('pets/base/dog.jpg'),
    head: publicAsset('pets/head/dog-head.jpg'),
  },
  cat: {
    body: publicAsset('pets/base/cat.jpg'),
    head: publicAsset('pets/head/cat-head.jpg'),
  },
  rabbit: {
    body: publicAsset('pets/base/rabbit.jpg'),
    head: publicAsset('pets/head/rabbit-head.jpg'),
  },
};

export const petWearableAssets: Record<PetAssetKey, Record<TreasureAssetKey, string>> = {
  dog: {
    baowu1: publicAsset('pets/wearables/dog/baowu1.png'),
    baowu2: publicAsset('pets/wearables/dog/baowu2.png'),
    baowu3: publicAsset('pets/wearables/dog/baowu3.png'),
    baowu4: publicAsset('pets/wearables/dog/baowu4.png'),
    baowu5: publicAsset('pets/wearables/dog/baowu5.png'),
  },
  cat: {
    baowu1: publicAsset('pets/wearables/cat/baowu1.png'),
    baowu2: publicAsset('pets/wearables/cat/baowu2.png'),
    baowu3: publicAsset('pets/wearables/cat/baowu3.png'),
    baowu4: publicAsset('pets/wearables/cat/baowu4.png'),
    baowu5: publicAsset('pets/wearables/cat/baowu5.png'),
  },
  rabbit: {
    baowu1: publicAsset('pets/wearables/rabbit/baowu1.png'),
    baowu2: publicAsset('pets/wearables/rabbit/baowu2.png'),
    baowu3: publicAsset('pets/wearables/rabbit/baowu3.png'),
    baowu4: publicAsset('pets/wearables/rabbit/baowu4.png'),
    baowu5: publicAsset('pets/wearables/rabbit/baowu5.png'),
  },
};

export const petFoodAssets: Record<PetAssetKey, string> = {
  dog: publicAsset('bone.png'),
  cat: publicAsset('fish.png'),
  rabbit: publicAsset('carrots.png'),
};

export const preferredFoodByPet: Record<PetAssetKey, FoodAssetKey> = {
  dog: 'bone',
  cat: 'fish',
  rabbit: 'carrots',
};

export const treasureTitleToKey: Record<string, TreasureAssetKey> = {
  'Mise Celadon Lotus Bowl': 'baowu1',
  'Sword of King Fuchai of Wu': 'baowu2',
  'Pearl Sarira Pagoda': 'baowu3',
  'Bronze Tripod He with Coiled Chi-dragon Handle': 'baowu4',
  'Fish-roe Green Olive-shaped Zun': 'baowu5',
  'Ancient Silk Fan': 'baowu1',
  'Ancient Coin': 'baowu2',
  'Campus Memory Check': 'baowu3',
  'Silk Ribbon': 'baowu4',
  'Jade Ornament': 'baowu5',
  'Vitality Orb': 'baowu3',
};

export const treasureKeyToTitle: Record<TreasureAssetKey, string> = {
  baowu1: 'Mise Celadon Lotus Bowl',
  baowu2: 'Sword of King Fuchai of Wu',
  baowu3: 'Pearl Sarira Pagoda',
  baowu4: 'Bronze Tripod He with Coiled Chi-dragon Handle',
  baowu5: 'Fish-roe Green Olive-shaped Zun',
};

export const getTreasureKeyFromTitle = (title: string): TreasureAssetKey | null =>
  treasureTitleToKey[title] ?? null;

export const getPetDisplayImage = (
  petKey: PetAssetKey,
  treasureKey: TreasureAssetKey | null | undefined,
) => {
  if (treasureKey && petWearableAssets[petKey]?.[treasureKey]) {
    return petWearableAssets[petKey][treasureKey];
  }

  return basePetAssets[petKey].body;
};
