import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, Lock, Search, Sparkles, Utensils, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { foodAssets, treasureAssets } from '../data/assets';
import { useDemo } from '../context/DemoContext';
import { usePet, TreasureItem } from '../context/PetContext';
import { getTreasureKeyFromTitle, treasureKeyToTitle } from '../lib/petWearables';
import { addNotification } from '../lib/userProgressService';
import { cn } from '../lib/utils';

type CollectionKind = 'treasure' | 'food';

interface CollectionItem extends TreasureItem {
  rarity: string;
  type: 'Treasure' | 'Food';
  locked: boolean;
  category: CollectionKind;
  detail: string;
}

const baseTreasures: CollectionItem[] = [
  {
    id: 1,
    title: 'Mise Celadon Lotus Bowl',
    rarity: 'Rare',
    type: 'Treasure',
    img: treasureAssets.baowu1,
    treasureKey: 'baowu1',
    locked: false,
    category: 'treasure',
    detail: 'A celadon lotus bowl relic that can be equipped on your companion.',
  },
  {
    id: 2,
    title: 'Sword of King Fuchai of Wu',
    rarity: 'Common',
    type: 'Treasure',
    img: treasureAssets.baowu2,
    treasureKey: 'baowu2',
    locked: false,
    category: 'treasure',
    detail: 'A sword relic from a completed cultural run.',
  },
  {
    id: 3,
    title: 'Pearl Sarira Pagoda',
    rarity: 'Epic',
    type: 'Treasure',
    img: treasureAssets.baowu3,
    treasureKey: 'baowu3',
    locked: false,
    category: 'treasure',
    detail: 'A pagoda relic for future pet growth logic.',
  },
  {
    id: 4,
    title: 'Bronze Tripod He with Coiled Chi-dragon Handle',
    rarity: 'Common',
    type: 'Treasure',
    img: treasureAssets.baowu4,
    treasureKey: 'baowu4',
    locked: false,
    category: 'treasure',
    detail: 'A bronze handled vessel reserved for accessory progression.',
  },
  {
    id: 5,
    title: 'Fish-roe Green Olive-shaped Zun',
    rarity: 'Rare',
    type: 'Treasure',
    img: treasureAssets.baowu5,
    treasureKey: 'baowu5',
    locked: true,
    category: 'treasure',
    detail: 'Locked until the matching historical route reward is earned.',
  },
];

const canonicalTreasureImages: Record<string, string> = {
  'Mise Celadon Lotus Bowl': treasureAssets.baowu1,
  'Sword of King Fuchai of Wu': treasureAssets.baowu2,
  'Pearl Sarira Pagoda': treasureAssets.baowu3,
  'Bronze Tripod He with Coiled Chi-dragon Handle': treasureAssets.baowu4,
  'Fish-roe Green Olive-shaped Zun': treasureAssets.baowu5,
  'Ancient Silk Fan': treasureAssets.baowu1,
  'Ancient Coin': treasureAssets.baowu2,
  'Vitality Orb': treasureAssets.baowu3,
  'Silk Ribbon': treasureAssets.baowu4,
  'Jade Ornament': treasureAssets.baowu5,
  'Campus Memory Check': treasureAssets.baowu3,
};

const normalizeCollectionTitle = (title: string) => title.trim().toLowerCase().replace(/\s+/g, '-');

const getCollectionKey = (item: Pick<CollectionItem, 'title' | 'treasureKey'>) =>
  item.treasureKey ?? getTreasureKeyFromTitle(item.title) ?? normalizeCollectionTitle(item.title);

const foodItems: CollectionItem[] = [
  {
    id: 101,
    title: 'Bone Treat',
    rarity: 'Daily',
    type: 'Food',
    img: foodAssets.bone,
    locked: false,
    category: 'food',
    detail: 'Use from Profile to restore companion vitality.',
  },
  {
    id: 102,
    title: 'Carrot Pack',
    rarity: 'Fresh',
    type: 'Food',
    img: foodAssets.carrots,
    locked: false,
    category: 'food',
    detail: 'A fresh recovery item from modern route progression.',
  },
  {
    id: 103,
    title: 'Fish Meal',
    rarity: 'Premium',
    type: 'Food',
    img: foodAssets.fish,
    locked: false,
    category: 'food',
    detail: 'A premium meal for future nutrition variety.',
  },
];

const Treasure = () => {
  const navigate = useNavigate();
  const { selectedCompanion, treasureRewards } = useDemo();
  const { equipItem, foodInventory, getEquippedTreasureForPet } = usePet();
  const [activeTab, setActiveTab] = useState<CollectionKind>('treasure');
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const selectedPetKey = selectedCompanion?.assetKey ?? 'dog';
  const equippedItem = getEquippedTreasureForPet(selectedPetKey);

  const treasures = useMemo<CollectionItem[]>(() => {
    const uniqueTreasures = new Map<string, CollectionItem>();

    baseTreasures.forEach((item) => {
      uniqueTreasures.set(getCollectionKey(item), item);
    });

    treasureRewards.forEach((reward, index) => {
      const treasureKey = getTreasureKeyFromTitle(reward.rewardName);
      const key = treasureKey ?? normalizeCollectionTitle(reward.rewardName);
      const existing = uniqueTreasures.get(key);
      const canonicalImage = canonicalTreasureImages[reward.rewardName] ?? existing?.img;
      const rewardImage =
        canonicalImage ??
        (!reward.rewardImage.match(/\.(jpg|jpeg|webp)$/i) ? reward.rewardImage : treasureAssets.baowu3);

      uniqueTreasures.set(key, {
        ...(existing ?? {
          id: Number(`9${index + 1}`),
          title: reward.rewardName,
          type: 'Treasure' as const,
          category: 'treasure' as const,
          detail: `Earned from ${reward.sourceRouteName}.`,
        }),
        title: treasureKey ? treasureKeyToTitle[treasureKey] : existing?.title ?? reward.rewardName,
        rarity: 'Earned',
        img: rewardImage,
        treasureKey,
        locked: false,
        detail: `Earned from ${reward.sourceRouteName}.`,
      });
    });

    return Array.from(uniqueTreasures.values());
  }, [treasureRewards]);

  const visibleItems = (activeTab === 'treasure' ? treasures : foodItems).filter((item) =>
    item.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const unlockedTreasureCount = treasures.filter((item) => !item.locked).length;

  const handlePrimaryAction = () => {
    if (!selectedItem || selectedItem.locked) {
      return;
    }

    if (selectedItem.category === 'food') {
      navigate('/profile');
      return;
    }

    equipItem({
      id: selectedItem.id,
      title: selectedItem.title,
      img: selectedItem.img,
      treasureKey: selectedItem.treasureKey ?? getTreasureKeyFromTitle(selectedItem.title),
    }, selectedPetKey);
    addNotification({
      type: 'equip',
      title: 'Treasure equipped',
      message: `${selectedItem.title} is now worn by ${selectedCompanion?.name ?? 'your companion'}.`,
      petId: String(selectedCompanion?.id ?? selectedPetKey),
      itemId: String(selectedItem.id),
      itemName: selectedItem.title,
    });
    setSelectedItem(null);
    navigate('/profile');
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] pb-28"
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pt-10">
        <header className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate('/profile')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-text-main shadow-soft"
            aria-label="Back to profile"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
              Collection
            </p>
            <h1 className="font-display text-2xl font-bold text-text-main">Treasure Gallery</h1>
          </div>
          <div className="h-11 w-11" />
        </header>

        <section className="mb-5 rounded-[34px] bg-white p-5 shadow-soft">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <SummaryTile label="Treasures" value={`${unlockedTreasureCount}/${treasures.length}`} />
            <SummaryTile label="Food" value={`${foodInventory}`} />
          </div>

          <div className="mb-4 rounded-2xl bg-[#F1EFE7] p-1">
            {(['treasure', 'food'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'w-1/2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all',
                  activeTab === tab ? 'bg-white text-text-main shadow-soft' : 'text-text-muted',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#FDFBF7] px-4 py-3">
            <Search className="text-text-muted" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collection"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-text-main outline-none placeholder:text-text-muted/60"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {visibleItems.map((item, index) => {
            const itemTreasureKey = getTreasureKeyFromTitle(item.title);
            const effectiveTreasureKey = item.treasureKey ?? itemTreasureKey;
            const isEquipped =
              item.category === 'treasure' &&
              !!effectiveTreasureKey &&
              effectiveTreasureKey === equippedItem?.treasureKey;

            return (
              <motion.button
                key={`${item.category}-${item.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  'relative overflow-hidden rounded-[30px] bg-white p-4 text-left shadow-soft',
                  item.locked && 'grayscale',
                )}
              >
                {isEquipped && (
                  <span className="absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-soft">
                    <Check size={14} strokeWidth={4} />
                  </span>
                )}
                {item.locked && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center bg-text-main/10 backdrop-blur-[1px]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-text-muted shadow-soft">
                      <Lock size={17} />
                    </span>
                  </span>
                )}
                <span className="absolute right-0 top-0 rounded-bl-3xl bg-brand/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-text-main">
                  {item.rarity}
                </span>
                <div className="mb-3 aspect-square overflow-hidden rounded-3xl bg-[#FDFBF7] p-2">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="line-clamp-2 min-h-[40px] text-sm font-black leading-tight text-text-main">
                  {item.title}
                </p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-text-muted">
                  {item.category === 'food'
                    ? 'Feed / Use'
                    : isEquipped
                      ? 'Earned / Equipped'
                      : item.locked
                        ? 'Locked'
                        : item.rarity === 'Earned'
                          ? 'Earned'
                          : 'Accessory'}
                </p>
              </motion.button>
            );
          })}
        </section>
      </div>

      <ItemSheet
        item={selectedItem}
        equipped={
          !!selectedItem &&
          selectedItem.category === 'treasure' &&
          (selectedItem.treasureKey ?? getTreasureKeyFromTitle(selectedItem.title)) ===
            equippedItem?.treasureKey
        }
        onClose={() => setSelectedItem(null)}
        onPrimary={handlePrimaryAction}
      />
    </motion.main>
  );
};

const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl bg-[#FDFBF7] p-4">
    <p className="font-display text-3xl font-bold text-text-main">{value}</p>
    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
  </div>
);

const ItemSheet = ({
  item,
  equipped,
  onClose,
  onPrimary,
}: {
  item: CollectionItem | null;
  equipped: boolean;
  onClose: () => void;
  onPrimary: () => void;
}) => (
  <AnimatePresence>
    {item && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-text-main/45 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: 360 }}
          animate={{ y: 0 }}
          exit={{ y: 360 }}
          className="fixed bottom-0 left-0 right-0 z-[90] mx-auto w-full max-w-md rounded-t-[34px] bg-[#FDFBF7] p-5 shadow-2xl"
        >
          <div className="mb-4 flex justify-end">
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-white shadow-soft">
              <X className="mx-auto" size={17} />
            </button>
          </div>

          <div className="mb-5 flex items-center gap-5">
            <div className="h-28 w-28 shrink-0 rounded-[30px] bg-white p-3 shadow-soft">
              <img src={item.img} alt={item.title} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted">
                {item.type} · {item.rarity}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-text-main">
                {item.title}
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-muted">{item.detail}</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.45fr] gap-3">
            <button
              onClick={onClose}
              className="rounded-3xl bg-white py-4 text-[10px] font-black uppercase tracking-widest text-text-muted shadow-soft"
            >
              Cancel
            </button>
            <button
              onClick={onPrimary}
              disabled={item.locked}
              className="btn-primary rounded-3xl py-4 text-[10px] uppercase tracking-widest disabled:bg-text-muted/20 disabled:text-text-muted"
            >
              {item.category === 'food' ? (
                <>
                  <Utensils size={16} /> Go Feed
                </>
              ) : equipped ? (
                <>
                  <Check size={16} /> Equipped
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Equip
                </>
              )}
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default Treasure;
