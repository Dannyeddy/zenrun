import { PetAssetKey, TreasureAssetKey } from '../data/assets';
import { CompanionOption } from './demoData';
import { getPetDisplayImage, getTreasureKeyFromTitle } from './petWearables';

interface EquippedTreasureLike {
  title: string;
  treasureKey?: TreasureAssetKey | null;
}

export const getPetAppearanceTreasureKey = (
  equippedTreasure: EquippedTreasureLike | null | undefined,
) => {
  if (!equippedTreasure) {
    return null;
  }

  return equippedTreasure.treasureKey ?? getTreasureKeyFromTitle(equippedTreasure.title);
};

export const getPetFullImage = (
  selectedCompanion: CompanionOption | null | undefined,
  equippedTreasure: EquippedTreasureLike | null | undefined,
  fallbackPetKey: PetAssetKey = 'dog',
) => {
  const petKey = selectedCompanion?.assetKey ?? fallbackPetKey;
  return getPetDisplayImage(petKey, getPetAppearanceTreasureKey(equippedTreasure));
};
