import { publicAsset } from './publicAsset';

export const atlasWorldDestinationImages = {
  africaKilimanjaro: publicAsset('atlas/world/africa-kilimanjaro.jpg'),
  africaSavanna: publicAsset('atlas/world/africa-savanna.jpg'),
  southAmericaRio: publicAsset('atlas/world/south-america-rio.jpg'),
  americaNewYork: publicAsset('atlas/world/america-new-york.jpg'),
  americaRiver: publicAsset('atlas/world/america-river.jpg'),
  europeRiver: publicAsset('atlas/world/europe-river.jpg'),
  europeParis: publicAsset('atlas/world/europe-paris.jpg'),
} as const;

export type AtlasWorldDestinationImageKey = keyof typeof atlasWorldDestinationImages;
