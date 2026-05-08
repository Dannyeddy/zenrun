import { PetAssetKey } from '../data/assets';
import { publicAsset } from './publicAsset';
import { RunMood } from './userProgressService';

export const PET_EMOTION_ASSETS: Record<PetAssetKey, Record<RunMood, string>> = {
  cat: {
    happy: publicAsset('pets/emotions/cat-happy.png'),
    calm: publicAsset('pets/emotions/cat-calm.png'),
    sad: publicAsset('pets/emotions/cat-sad.png'),
    none: publicAsset('cat-head.jpg'),
  },
  rabbit: {
    happy: publicAsset('pets/emotions/rabbit-happy.png'),
    calm: publicAsset('pets/emotions/rabbit-calm.png'),
    sad: publicAsset('pets/emotions/rabbit-sad.png'),
    none: publicAsset('rabbit-head.jpg'),
  },
  dog: {
    happy: publicAsset('pets/emotions/dog-happy.png'),
    calm: publicAsset('pets/emotions/dog-calm.png'),
    sad: publicAsset('pets/emotions/dog-sad.png'),
    none: publicAsset('dog-head.jpg'),
  },
};

export const resolvePetAssetKey = (selectedPetId?: string | number | null): PetAssetKey => {
  if (selectedPetId === 3) {
    return 'rabbit';
  }

  if (selectedPetId === 2) {
    return 'cat';
  }

  if (selectedPetId === 1) {
    return 'dog';
  }

  const normalized = String(selectedPetId ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  if (normalized.includes('rabbit') || normalized.includes('zen-rabbit')) {
    return 'rabbit';
  }

  if (normalized.includes('cat') || normalized.includes('mint-cat')) {
    return 'cat';
  }

  if (normalized.includes('dog') || normalized.includes('pup') || normalized.includes('aqua-pup')) {
    return 'dog';
  }

  return 'dog';
};

export const getPetEmotionAsset = (
  selectedPetId: string | number | null | undefined,
  mood: RunMood,
) => PET_EMOTION_ASSETS[resolvePetAssetKey(selectedPetId)][mood];
