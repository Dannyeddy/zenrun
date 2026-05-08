import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FoodAssetKey, PetAssetKey, TreasureAssetKey } from '../data/assets';
import {
  emptyEquippedTreasureByPet,
  EquippedTreasureByPet,
  getTreasureKeyFromTitle,
  treasureKeyToTitle,
} from '../lib/petWearables';
import { publicAsset } from '../lib/publicAsset';

export interface TreasureItem {
  id: number;
  title: string;
  img: string;
  treasureKey?: TreasureAssetKey | null;
}

interface PetContextType {
  equippedItem: TreasureItem | null;
  equippedTreasure: TreasureItem | null;
  equippedTreasureByPet: EquippedTreasureByPet;
  equipItem: (item: TreasureItem, petKey?: PetAssetKey) => void;
  getEquippedTreasureForPet: (petKey: PetAssetKey) => TreasureItem | null;
  foodInventory: number;
  foodInventoryByType: Record<FoodAssetKey, number>;
  petVitality: number;
  petAffinity: number;
  feedPet: () => void;
  addFood: (count: number, foodKey?: FoodAssetKey) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);
const EQUIPPED_TREASURE_STORAGE_KEY = 'equippedTreasure';
const EQUIPPED_TREASURE_BY_PET_STORAGE_KEY = 'equippedTreasureByPet';
const FOOD_INVENTORY_STORAGE_KEY = 'foodInventory';
const FOOD_INVENTORY_BY_TYPE_STORAGE_KEY = 'foodInventoryByType';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeTreasureItem = (item: TreasureItem): TreasureItem => {
  const treasureKey = item.treasureKey ?? getTreasureKeyFromTitle(item.title);

  if (!treasureKey) {
    return item;
  }

  return {
    ...item,
    title: treasureKeyToTitle[treasureKey],
    img: publicAsset(`${treasureKey}.png`),
    treasureKey,
  };
};

const readEquippedTreasure = () => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EQUIPPED_TREASURE_STORAGE_KEY);
    return raw ? normalizeTreasureItem(JSON.parse(raw) as TreasureItem) : null;
  } catch {
    return null;
  }
};

const readEquippedTreasureByPet = (): EquippedTreasureByPet => {
  if (!canUseStorage()) {
    return emptyEquippedTreasureByPet;
  }

  try {
    const raw = window.localStorage.getItem(EQUIPPED_TREASURE_BY_PET_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<EquippedTreasureByPet>) : {};
    return { ...emptyEquippedTreasureByPet, ...parsed };
  } catch {
    return emptyEquippedTreasureByPet;
  }
};

const treasureKeyToItem = (treasureKey: TreasureAssetKey | null | undefined): TreasureItem | null => {
  if (!treasureKey) {
    return null;
  }

  const numericId = Number(treasureKey.replace('baowu', ''));
  return {
    id: Number.isFinite(numericId) ? numericId : 0,
    title: treasureKeyToTitle[treasureKey],
    img: publicAsset(`${treasureKey}.png`),
    treasureKey,
  };
};

const defaultFoodInventoryByType: Record<FoodAssetKey, number> = {
  bone: 1,
  carrots: 1,
  fish: 1,
};

const readFoodInventoryByType = (): Record<FoodAssetKey, number> => {
  if (!canUseStorage()) {
    return defaultFoodInventoryByType;
  }

  try {
    const raw = window.localStorage.getItem(FOOD_INVENTORY_BY_TYPE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Record<FoodAssetKey, number>>) : {};
    return { ...defaultFoodInventoryByType, ...parsed };
  } catch {
    return defaultFoodInventoryByType;
  }
};

const readFoodInventory = () => {
  if (!canUseStorage()) {
    return 3;
  }

  const storedTotal = Number(window.localStorage.getItem(FOOD_INVENTORY_STORAGE_KEY));
  return Number.isFinite(storedTotal) && storedTotal >= 0 ? storedTotal : 3;
};

export const PetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [equippedItem, setEquippedItem] = useState<TreasureItem | null>(readEquippedTreasure);
  const [equippedTreasureByPet, setEquippedTreasureByPet] = useState<EquippedTreasureByPet>(
    readEquippedTreasureByPet,
  );
  const [foodInventoryByType, setFoodInventoryByType] =
    useState<Record<FoodAssetKey, number>>(readFoodInventoryByType);
  const [foodInventory, setFoodInventory] = useState(readFoodInventory);
  const [petVitality, setPetVitality] = useState(65);
  const [petAffinity, setPetAffinity] = useState(40);

  useEffect(() => {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(EQUIPPED_TREASURE_STORAGE_KEY, JSON.stringify(equippedItem));
  }, [equippedItem]);

  useEffect(() => {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(
      EQUIPPED_TREASURE_BY_PET_STORAGE_KEY,
      JSON.stringify(equippedTreasureByPet),
    );
  }, [equippedTreasureByPet]);

  useEffect(() => {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(FOOD_INVENTORY_STORAGE_KEY, String(foodInventory));
    window.localStorage.setItem(
      FOOD_INVENTORY_BY_TYPE_STORAGE_KEY,
      JSON.stringify(foodInventoryByType),
    );
  }, [foodInventory, foodInventoryByType]);

  const equipItem = (item: TreasureItem, petKey: PetAssetKey = 'dog') => {
    const treasureKey = item.treasureKey ?? getTreasureKeyFromTitle(item.title);
    const normalizedItem = treasureKey ? normalizeTreasureItem({ ...item, treasureKey }) : item;
    setEquippedItem(normalizedItem);

    if (treasureKey) {
      setEquippedTreasureByPet((prev) => ({
        ...prev,
        [petKey]: treasureKey,
      }));
    }
  };

  const getEquippedTreasureForPet = (petKey: PetAssetKey) => {
    const treasureKey = equippedTreasureByPet[petKey];
    return treasureKeyToItem(treasureKey);
  };

  const feedPet = () => {
    if (foodInventory > 0) {
      setFoodInventory(prev => prev - 1);
      setPetVitality(prev => Math.min(100, prev + 15));
      setPetAffinity(prev => prev + 5);
    }
  };

  const addFood = (count: number, foodKey: FoodAssetKey = 'bone') => {
    setFoodInventory(prev => prev + count);
    setFoodInventoryByType((prev) => ({
      ...prev,
      [foodKey]: (prev[foodKey] ?? 0) + count,
    }));
  };

  return (
    <PetContext.Provider value={{ 
      equippedItem, 
      equippedTreasure: equippedItem,
      equippedTreasureByPet,
      equipItem, 
      getEquippedTreasureForPet,
      foodInventory, 
      foodInventoryByType,
      petVitality, 
      petAffinity, 
      feedPet, 
      addFood 
    }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};
