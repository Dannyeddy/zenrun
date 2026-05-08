import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Copy,
  Home,
  Medal,
  MessageCircle,
  Share2,
  Trophy,
  Utensils,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouteFragmentSnapshot, useDemo } from '../context/DemoContext';
import { usePet } from '../context/PetContext';
import { FoodAssetKey, TreasureAssetKey, treasureAssets } from '../data/assets';
import { getShareCardBackground } from '../lib/shareCardAssets';
import { cn } from '../lib/utils';

interface SummaryStats {
  runId?: string;
  time: string;
  distance: string;
  pace: string;
  checkpoints: number;
  routeName: string;
  routeType: string;
  routeId?: string;
  completedAt?: string;
  fragmentSnapshot?: RouteFragmentSnapshot;
}

const leaderboard = [
  { name: 'Mei Lin', distance: 12.4, pace: "4'42\"" },
  { name: 'Hiro', distance: 10.8, pace: "4'58\"" },
  { name: 'Ana', distance: 9.2, pace: "5'10\"" },
  { name: 'Jin', distance: 8.6, pace: "5'01\"" },
  { name: 'Rika', distance: 7.9, pace: "5'22\"" },
  { name: 'Owen', distance: 6.4, pace: "5'48\"" },
];

const getCompletionDate = (completedAt?: string) => {
  const date = completedAt ? new Date(completedAt) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
};

const formatShareDate = (completedAt?: string) =>
  getCompletionDate(completedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const getShareBaseUrl = () => {
  const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const basePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${window.location.origin}${basePath}`;
};

const buildShareUrl = (stats: SummaryStats, image: string, fragmentResult?: RouteFragmentSnapshot) => {
  if (typeof window === 'undefined') {
    return '';
  }

  const completedAt = getCompletionDate(stats.completedAt).toISOString();
  const params = new URLSearchParams({
    runId: String(stats.runId ?? `share-${Date.now()}`),
    routeId: String(stats.routeId ?? ''),
    routeTitle: stats.routeName,
    routeType: stats.routeType,
    distance: stats.distance,
    time: stats.time,
    pace: stats.pace,
    date: completedAt,
    image,
    reward: fragmentResult?.rewardName ?? '',
    fragments: fragmentResult
      ? `${fragmentResult.collectedFragmentIds.length}/${fragmentResult.requiredFragmentCount}`
    : '',
  });

  return `${getShareBaseUrl()}/share?${params.toString()}`;
};

const isTreasureAssetKey = (value: string | null): value is TreasureAssetKey =>
  Boolean(value && value in treasureAssets);

const getTreasureUnlockImage = (fragmentResult: RouteFragmentSnapshot, fallback: string) => {
  if (isTreasureAssetKey(fragmentResult.rewardId)) {
    return treasureAssets[fragmentResult.rewardId];
  }

  return fallback;
};

const RunCompletionSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    routeState,
    runState,
    rewardState,
    claimRouteFragmentReward,
    getRouteFragmentSnapshot,
  } = useDemo();
  const { addFood } = usePet();
  const [rankingOpen, setRankingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [treasureUnlockOpen, setTreasureUnlockOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(true);
  const rewardAppliedRef = useRef(false);

  const stats = (location.state || {
    time: `${Math.floor(runState.duration / 60)
      .toString()
      .padStart(2, '0')}:${(runState.duration % 60).toString().padStart(2, '0')}`,
    distance: runState.distance.toFixed(2),
    pace: runState.pace,
    checkpoints: runState.landmarkTriggered ? 1 : 0,
    routeName: routeState.selectedRouteName || 'Pingjiang Heritage Trail',
    routeType: routeState.selectedRouteType || 'Historical',
    routeId: routeState.selectedRouteId,
  }) as SummaryStats;

  const distance = Number(stats.distance) || 0;
  const isHistorical = stats.routeType === 'Historical' || stats.routeType === 'Historical Test';
  const activeRouteId = stats.routeId || routeState.selectedRouteId;
  const [fragmentResult, setFragmentResult] = useState<RouteFragmentSnapshot>(() =>
    stats.fragmentSnapshot ?? getRouteFragmentSnapshot(activeRouteId),
  );

  useEffect(() => {
    if (rewardAppliedRef.current) {
      return;
    }
    rewardAppliedRef.current = true;

    const settlement = claimRouteFragmentReward(activeRouteId);
    setFragmentResult(settlement);

    if (settlement.newlyRewarded && settlement.rewardType === 'food') {
      addFood(settlement.foodCount ?? 2, settlement.rewardId as FoodAssetKey);
    }

    if (settlement.newlyRewarded && settlement.rewardType === 'treasure') {
      setTreasureUnlockOpen(true);
    }
  }, [activeRouteId, addFood, claimRouteFragmentReward]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCelebrating(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  const ranking = useMemo(() => {
    const board = [...leaderboard, { name: 'You', distance, pace: stats.pace, isYou: true }].sort(
      (a, b) => b.distance - a.distance,
    );
    const rank = board.findIndex((runner) => 'isYou' in runner) + 1;
    return { board, rank };
  }, [distance, stats.pace]);

  const continueLabel = isHistorical ? 'View treasure' : 'Visit companion';
  const continueTarget = isHistorical ? '/collection' : '/pet-space';

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] pb-10"
    >
      <CelebrationBurst active={celebrating} />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
              Run settlement
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-text-main">Run Complete!</h1>
          </div>
          <button
            onClick={() => setShareOpen(true)}
            className="h-11 w-11 rounded-full bg-white text-text-main shadow-soft"
            aria-label="Share run"
          >
            <Share2 className="mx-auto" size={19} />
          </button>
        </header>

        <motion.section
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 rounded-[34px] bg-white p-8 text-center shadow-[0_20px_55px_rgba(45,74,72,0.12)]"
        >
          <div className={cn('mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full', isHistorical ? 'bg-amber-100 text-amber-600' : 'bg-brand/20 text-brand-dark')}>
            <CheckCircle2 size={38} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-text-muted">Total distance</p>
          <p className="mt-1 font-display text-7xl font-bold leading-none text-text-main">{stats.distance}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-text-muted">Kilometers</p>
        </motion.section>

        <section className="mb-5 grid grid-cols-3 gap-3">
          <Metric label="Time" value={stats.time} />
          <Metric label="Pace" value={stats.pace} />
          <Metric label="Kcal" value={String(Math.round(distance * 65))} />
        </section>

        <button
          onClick={() => setRankingOpen(true)}
          className="mb-5 flex items-center gap-3 rounded-3xl bg-text-main p-4 text-left text-white shadow-[0_16px_32px_rgba(45,74,72,0.22)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-amber-300">
            <Trophy size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">View this run's ranking</span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/60">
              You placed #{ranking.rank} today
            </span>
          </span>
          <ChevronRight size={20} />
        </button>

        <section className="mb-6 rounded-[30px] bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl',
                fragmentResult.completed
                  ? isHistorical
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-brand/20 text-brand-dark'
                  : 'bg-surface text-text-muted',
              )}
            >
              {isHistorical ? <Award size={23} /> : <Utensils size={23} />}
            </span>
            <div>
              <p className="text-sm font-black text-text-main">
                {fragmentResult.completed
                  ? isHistorical
                    ? 'Treasure completed'
                    : 'Food reward completed'
                  : `${fragmentResult.collectedFragmentIds.length}/${fragmentResult.requiredFragmentCount} fragments collected`}
              </p>
              <p className="text-xs font-medium text-text-muted">
                {fragmentResult.completed
                  ? isHistorical
                    ? `${fragmentResult.rewardName || rewardState.rewardName || 'Historical treasure'} is saved into the collection.`
                    : `${fragmentResult.rewardName || 'Food'} added to the companion food inventory.`
                  : isHistorical
                    ? 'Run this route again to complete the treasure.'
                    : 'Run this route again to complete the food reward.'}
              </p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  fragmentResult.requiredFragmentCount
                    ? Math.min(
                        100,
                        (fragmentResult.collectedFragmentIds.length /
                          fragmentResult.requiredFragmentCount) *
                          100,
                      )
                    : 0
                }%`,
              }}
              className={cn('h-full rounded-full', isHistorical ? 'bg-amber-300' : 'bg-brand')}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
            <span>Memory pieces</span>
            <span>
              {fragmentResult.collectedFragmentIds.length}/{fragmentResult.requiredFragmentCount}
            </span>
          </div>
        </section>

        <div className="mt-auto grid grid-cols-[1fr_1.35fr] gap-3">
          <button
            onClick={() => setShareOpen(true)}
            className="rounded-3xl bg-white py-4 text-sm font-black uppercase tracking-widest text-text-main shadow-soft"
          >
            Share
          </button>
          <button
            onClick={() => navigate(continueTarget)}
            className="btn-primary rounded-3xl py-4 text-sm uppercase tracking-widest"
          >
            {continueLabel}
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-text-muted"
        >
          <Home size={14} /> Home
        </button>
      </div>

      <RankingModal open={rankingOpen} onClose={() => setRankingOpen(false)} ranking={ranking} />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        stats={stats}
        isHistorical={isHistorical}
        fragmentResult={fragmentResult}
      />
      <TreasureUnlockModal
        open={treasureUnlockOpen}
        onClose={() => setTreasureUnlockOpen(false)}
        onViewCollection={() => {
          setTreasureUnlockOpen(false);
          navigate('/collection');
        }}
        fragmentResult={fragmentResult}
        fallbackImage={rewardState.rewardImage}
      />
    </motion.main>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl bg-white p-4 text-center shadow-soft">
    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
    <p className="mt-1 truncate font-display text-lg font-bold text-text-main">{value}</p>
  </div>
);

const CelebrationBurst = ({ active }: { active: boolean }) => {
  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: 12 + ((index * 37) % 78),
        top: 12 + ((index * 23) % 32),
        color: index % 3 === 0 ? '#E8B96E' : index % 3 === 1 ? '#56C5CB' : '#F5AABE',
        delay: index * 0.035,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
        >
          {sparks.map((spark) => (
            <motion.span
              key={spark.id}
              initial={{ opacity: 0, scale: 0.2, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 0.5], y: [-4, -34, -54] }}
              transition={{ delay: spark.delay, duration: 1.2, ease: 'easeOut' }}
              className="absolute h-2.5 w-2.5 rounded-full shadow-soft"
              style={{ left: `${spark.left}%`, top: `${spark.top}%`, backgroundColor: spark.color }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const TreasureUnlockModal = ({
  open,
  onClose,
  onViewCollection,
  fragmentResult,
  fallbackImage,
}: {
  open: boolean;
  onClose: () => void;
  onViewCollection: () => void;
  fragmentResult: RouteFragmentSnapshot;
  fallbackImage: string;
}) => {
  const treasureName = fragmentResult.rewardName || 'Historical treasure';
  const treasureImage = getTreasureUnlockImage(fragmentResult, fallbackImage);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-text-main/50 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 18, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-[34px] bg-[#FDFBF7] p-6 text-center shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Treasure unlocked"
          >
            <button
              onClick={onClose}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-text-main shadow-soft"
              aria-label="Close treasure popup"
            >
              <X size={18} />
            </button>
            <div className="mx-auto -mt-2 mb-4 flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-100 p-3 shadow-soft">
              <img src={treasureImage} alt={treasureName} className="h-full w-full object-contain" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-600">
              Treasure Unlocked!
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-text-main">{treasureName}</h2>
            <p className="mx-auto mt-3 max-w-[260px] text-sm font-semibold leading-relaxed text-text-muted">
              You collected all memory pieces from this historical route.
            </p>
            <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-3">
              <button
                onClick={onViewCollection}
                className="rounded-3xl bg-text-main px-4 py-4 text-sm font-black text-white shadow-soft"
              >
                View Collection
              </button>
              <button
                onClick={onClose}
                className="rounded-3xl bg-white px-4 py-4 text-sm font-black text-text-main shadow-soft"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RankingModal = ({
  open,
  onClose,
  ranking,
}: {
  open: boolean;
  onClose: () => void;
  ranking: {
    board: Array<{ name: string; distance: number; pace: string; isYou?: boolean }>;
    rank: number;
  };
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-text-main/45 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 420 }}
          animate={{ y: 0 }}
          exit={{ y: 420 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-md rounded-t-[32px] bg-[#FDFBF7] p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Today's board</p>
              <h2 className="font-display text-2xl font-bold text-text-main">Run Ranking</h2>
            </div>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-white shadow-soft">
              <X className="mx-auto" size={17} />
            </button>
          </div>

          <div className="mb-4 rounded-3xl bg-text-main p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand">Your position</p>
            <p className="mt-1 font-display text-4xl font-bold">#{ranking.rank}</p>
          </div>

          <div className="space-y-2">
            {ranking.board.map((runner, index) => (
              <div
                key={`${runner.name}-${index}`}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2',
                  runner.isYou ? 'bg-brand/25 ring-1 ring-brand' : 'bg-white',
                )}
              >
                <span className="flex w-6 justify-center">
                  {index < 3 ? <Medal size={17} className="text-amber-500" /> : index + 1}
                </span>
                <span className="flex-1 text-sm font-black text-text-main">{runner.name}</span>
                <span className="text-xs font-black text-text-main">{runner.distance.toFixed(2)} km</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ShareModal = ({
  open,
  onClose,
  stats,
  isHistorical,
  fragmentResult,
}: {
  open: boolean;
  onClose: () => void;
  stats: SummaryStats;
  isHistorical: boolean;
  fragmentResult: RouteFragmentSnapshot;
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrlFallbackOpen, setShareUrlFallbackOpen] = useState(false);
  const routeImage = getShareCardBackground(stats.routeName, stats.routeType, stats.routeId);
  const shareUrl = useMemo(
    () => buildShareUrl(stats, routeImage, fragmentResult),
    [fragmentResult, routeImage, stats],
  );
  const shareTitle = `ZenRun: ${stats.routeName}`;
  const shareText = `I just ran ${stats.distance} km on ${stats.routeName} with ZenRun.`;
  const completionDate = formatShareDate(stats.completedAt);

  const copyShareUrl = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlFallbackOpen(false);
    } catch {
      setShareUrlFallbackOpen(true);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  };

  const shareRun = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1300);
        return;
      }
    } catch {
      return;
    }

    await copyShareUrl();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-text-main/50 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm"
          >
            <div className="relative overflow-hidden rounded-[32px] bg-[#FDFBF7] p-3 shadow-2xl">
              <button
                onClick={onClose}
                className="absolute right-5 top-5 z-20 h-9 w-9 rounded-full bg-white/95 shadow-soft"
              >
                <X className="mx-auto" size={17} />
              </button>
              <div className="relative min-h-[470px] overflow-hidden rounded-[28px] bg-text-main shadow-soft">
                <img src={routeImage} alt={stats.routeName} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-text-main/12 via-text-main/5 to-text-main/78" />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-text-main">
                  zenrun · {isHistorical ? 'atlas' : 'pulse'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="mb-2 max-w-[260px] font-display text-2xl font-bold leading-tight drop-shadow">
                    {stats.routeName}
                  </p>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                    {completionDate}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <OverlayMetric label="Distance" value={`${stats.distance} km`} />
                    <OverlayMetric label="Pace" value={stats.pace} />
                    <OverlayMetric label="Time" value={stats.time} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-3xl bg-white p-4 shadow-soft">
              <button
                onClick={copyShareUrl}
                className="flex flex-col items-center gap-1 text-xs font-black uppercase tracking-widest text-text-main"
              >
                <Copy size={19} />
                {copied ? 'Link copied' : 'Copy link'}
              </button>
              <button
                onClick={shareRun}
                className="flex flex-col items-center gap-1 text-xs font-black uppercase tracking-widest text-text-main"
              >
                <MessageCircle size={19} />
                Share
              </button>
            </div>
            {shareUrlFallbackOpen && (
              <input
                value={shareUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
                className="mt-3 w-full rounded-2xl border border-brand/20 bg-white px-4 py-3 text-xs font-bold text-text-main shadow-soft"
                aria-label="Share URL"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const OverlayMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-white/16 px-2 py-2 text-center shadow-soft backdrop-blur-md">
    <p className="text-[8px] font-black uppercase tracking-widest text-white/62">{label}</p>
    <p className="mt-1 truncate text-[13px] font-black text-white">{value}</p>
  </div>
);

export default RunCompletionSummary;
