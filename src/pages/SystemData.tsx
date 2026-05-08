import { motion } from 'motion/react';
import { Activity, Archive, Database, Map, PawPrint, Route, Sparkles, Utensils } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useDemo } from '../context/DemoContext';
import { usePet } from '../context/PetContext';
import type { RouteFragmentProgress } from '../lib/routeFragments';
import { visitedAtlasSeeds } from '../lib/atlasPoints';
import { getNotifications, getWeeklyGoal } from '../lib/userProgressService';
import { cn } from '../lib/utils';

const trackedStorageKeys = [
  'userName',
  'selectedCompanion',
  'onboardingSeen',
  'preferredRouteType',
  'lastSelectedRoute',
  'runHistory',
  'treasureRewards',
  'currentRunFragments',
  'routeFragmentProgress',
  'equippedTreasure',
  'equippedTreasureByPet',
  'foodInventory',
  'foodInventoryByType',
  'weeklyGoalKm',
  'runVoiceEnabled',
  'petCompanionSettings',
  'zenrun.notifications',
  'zenrun.lastCompanionMessageId',
];

const todayDistance = (runHistory: ReturnType<typeof useDemo>['runHistory']) => {
  const today = new Date();
  return runHistory.reduce((total, run) => {
    const completedAt = new Date(run.completedAt);
    const isToday =
      completedAt.getFullYear() === today.getFullYear() &&
      completedAt.getMonth() === today.getMonth() &&
      completedAt.getDate() === today.getDate();

    return isToday ? total + run.distance : total;
  }, 0);
};

const SystemData = () => {
  const {
    selectedCompanion,
    selectedRoute,
    routeState,
    runHistory,
    treasureRewards,
    routeFragmentProgress,
  } = useDemo();
  const {
    equippedItem,
    equippedTreasureByPet,
    foodInventory,
    foodInventoryByType,
    petVitality,
    petAffinity,
  } = usePet();

  const weeklyGoal = getWeeklyGoal();
  const todayPlan = Number((weeklyGoal / 7).toFixed(1));
  const todayCompleted = Number(todayDistance(runHistory).toFixed(1));
  const latestRun = runHistory[0];
  const notifications = useMemo(() => getNotifications(), []);
  const feedingRecords = notifications.filter((notification) => notification.type === 'feed');
  const equipmentRecords = notifications.filter((notification) => notification.type === 'equip');
  const fragmentProgressEntries = Object.entries(routeFragmentProgress) as Array<
    [string, RouteFragmentProgress]
  >;
  const collectedFragments = fragmentProgressEntries.reduce(
    (total, [, progress]) => total + progress.collectedFragmentIds.length,
    0,
  );
  const unlockedAtlasCards = visitedAtlasSeeds.filter((point) =>
    point.routeId
      ? runHistory.some((run) => run.routeId === point.routeId) ||
        treasureRewards.some((reward) => reward.sourceRouteId === point.routeId)
      : false,
  );
  const presentStorageKeys = trackedStorageKeys.filter((key) =>
    typeof window !== 'undefined' ? window.localStorage.getItem(key) !== null : false,
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] pb-28"
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pt-10">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-text-muted/70">
            Submission evidence
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold text-text-main">System Data</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-text-muted">
            Read-only snapshot of the local prototype state used to drive ZenRun screens.
          </p>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-3">
          <DataCard icon={<PawPrint size={18} />} label="Selected pet" value={selectedCompanion?.name ?? 'Not selected'} />
          <DataCard icon={<Route size={18} />} label="Current route" value={selectedRoute?.title ?? (routeState.selectedRouteName || 'None')} />
          <DataCard icon={<Activity size={18} />} label="Today" value={`${todayCompleted} / ${todayPlan} km`} />
          <DataCard icon={<Utensils size={18} />} label="Food" value={`${foodInventory} portions`} />
        </section>

        <section className="mb-4 rounded-3xl bg-white p-4 shadow-soft">
          <SectionTitle icon={<Sparkles size={17} />} title="Rewards And Companion" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Treasures" value={String(treasureRewards.length)} />
            <MiniStat label="Fragments" value={String(collectedFragments)} />
            <MiniStat label="Equipped" value={equippedItem?.title ?? 'None'} />
            <MiniStat label="Energy" value={`${Math.round(petVitality)}%`} />
            <MiniStat label="Affinity" value={`${Math.round(petAffinity)}%`} />
            <MiniStat label="Atlas cards" value={String(unlockedAtlasCards.length)} />
          </div>
        </section>

        <section className="mb-4 rounded-3xl bg-white p-4 shadow-soft">
          <SectionTitle icon={<Archive size={17} />} title="History Snapshot" />
          <div className="mt-4 space-y-3">
            <InfoRow label="Run history count" value={String(runHistory.length)} />
            <InfoRow label="Latest run" value={latestRun ? `${latestRun.routeName} (${latestRun.distance} km)` : 'No completed run'} />
            <InfoRow label="Feeding records count" value={String(feedingRecords.length)} />
            <InfoRow label="Equipment records count" value={String(equipmentRecords.length)} />
            <InfoRow label="Food by type" value={Object.entries(foodInventoryByType).map(([key, value]) => `${key}: ${value}`).join(', ')} />
            <InfoRow
              label="Equipped by pet"
              value={Object.entries(equippedTreasureByPet).map(([key, value]) => `${key}: ${value ?? 'none'}`).join(', ')}
            />
          </div>
        </section>

        <section className="mb-4 rounded-3xl bg-white p-4 shadow-soft">
          <SectionTitle icon={<Map size={17} />} title="Route Fragment Progress" />
          <div className="mt-4 space-y-2">
            {fragmentProgressEntries.length ? (
              fragmentProgressEntries.map(([routeId, progress]) => (
                <div key={routeId}>
                  <InfoRow
                    label={routeId}
                    value={`${progress.collectedFragmentIds.length} fragment(s), ${progress.completed ? 'complete' : 'in progress'}`}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-text-muted">No route fragments collected yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-soft">
          <SectionTitle icon={<Database size={17} />} title="localStorage Keys" />
          <div className="mt-4 flex flex-wrap gap-2">
            {(presentStorageKeys.length ? presentStorageKeys : trackedStorageKeys).map((key) => (
              <span
                key={key}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider',
                  presentStorageKeys.includes(key)
                    ? 'bg-text-main text-white'
                    : 'bg-[#F1EFE7] text-text-muted',
                )}
              >
                {key}
              </span>
            ))}
          </div>
        </section>
      </div>
    </motion.main>
  );
};

const DataCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-3xl bg-white p-4 shadow-soft">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-text-main">
      {icon}
    </div>
    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
    <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-text-main">{value}</p>
  </div>
);

const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-2 text-text-main">
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1EFE7]">{icon}</span>
    <h2 className="font-display text-xl font-bold">{title}</h2>
  </div>
);

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-[#FDFBF7] p-3">
    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
    <p className="mt-1 truncate text-sm font-black text-text-main">{value}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 border-b border-text-main/10 pb-2 last:border-b-0 last:pb-0">
    <p className="text-xs font-black uppercase tracking-widest text-text-muted">{label}</p>
    <p className="max-w-[58%] text-right text-sm font-bold leading-snug text-text-main">{value}</p>
  </div>
);

export default SystemData;
