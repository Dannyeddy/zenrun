import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, Compass, Minus, Plus, MapPin, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { usePet } from '../context/PetContext';
import { cn } from '../lib/utils';
import { RouteOption } from '../lib/demoData';
import { getRequiredFragmentCount } from '../lib/routeFragments';
import { publicAsset } from '../lib/publicAsset';
import {
  getWeeklyDistance,
  getWeeklyGoal,
  saveWeeklyGoal,
  USER_PROGRESS_UPDATED_EVENT,
} from '../lib/userProgressService';

const LAST_COMPANION_MESSAGE_KEY = 'zenrun.lastCompanionMessageId';

interface CompanionDailyMessage {
  id: string;
  text: string;
}

interface CompanionProgressSummary {
  todayCompletedKm: number;
  todayPlanKm: number;
  remainingTodayKm: number;
  foodInventory: number;
  petVitality: number;
  collectedFragments: number;
  requiredFragments: number;
  fragmentsRemaining: number;
  nextFragmentKm: number;
}

const formatKm = (value: number) => Number(Math.max(0, value).toFixed(1)).toString();

const parseDistanceKm = (distance: string | undefined) => {
  const parsed = Number(distance?.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
};

const getTodayDistance = (runs: ReturnType<typeof useDemo>['runHistory']) => {
  const today = new Date();
  return runs.reduce((total, run) => {
    const completedAt = new Date(run.completedAt);
    const sameDay =
      completedAt.getFullYear() === today.getFullYear() &&
      completedAt.getMonth() === today.getMonth() &&
      completedAt.getDate() === today.getDate();

    return sameDay ? total + run.distance : total;
  }, 0);
};

const readLastCompanionMessageId = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(LAST_COMPANION_MESSAGE_KEY) ?? '';
};

const saveLastCompanionMessageId = (messageId: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LAST_COMPANION_MESSAGE_KEY, messageId);
};

const pickCompanionMessage = (summary: CompanionProgressSummary): CompanionDailyMessage => {
  const distanceForHunger = Math.max(summary.remainingTodayKm, summary.petVitality < 70 ? 1.6 : 0.8);
  const candidates: CompanionDailyMessage[] = [
    ...(summary.petVitality < 75
      ? [
          {
            id: 'hunger-full',
            text: `I'm a little hungry... ${formatKm(distanceForHunger)} km together would fill me up!`,
          },
        ]
      : []),
    ...(summary.foodInventory <= 1
      ? [
          {
            id: 'collect-food',
            text: `My snack basket is low. Let's run ${formatKm(summary.nextFragmentKm)} km for treats!`,
          },
        ]
      : []),
    ...(summary.remainingTodayKm > 0.1
      ? [
          {
            id: 'weekly-plan',
            text: `I'm in sync today - let's enjoy ${formatKm(summary.remainingTodayKm)} km together.`,
          },
          {
            id: 'tiny-adventure',
            text: `${formatKm(summary.remainingTodayKm)} km today - I'm ready if you are.`,
          },
          {
            id: 'paws-ready',
            text: `My paws are ready - just ${formatKm(summary.remainingTodayKm)} km today!`,
          },
        ]
      : [
          {
            id: 'plan-complete',
            text: "We did today's plan. I'm proud of us!",
          },
        ]),
    ...(summary.fragmentsRemaining > 0
      ? [
          {
            id: 'fragments-needed',
            text: `${summary.fragmentsRemaining} more fragment(s), then treasure time!`,
          },
          {
            id: 'treasure-nearby',
            text: `Treasure feels close - ${formatKm(summary.nextFragmentKm)} km may find a fragment!`,
          },
        ]
      : [
          {
            id: 'treasure-ready',
            text: "Our fragments are ready. Treasure time?",
          },
        ]),
  ];

  const lastMessageId = readLastCompanionMessageId();
  const freshCandidates = candidates.filter((message) => message.id !== lastMessageId);
  const pool = freshCandidates.length ? freshCandidates : candidates;
  const message = pool[Math.floor(Math.random() * pool.length)] ?? {
    id: 'fallback',
    text: "I'm with you today - let's pick a tiny adventure!",
  };
  saveLastCompanionMessageId(message.id);
  return message;
};

const Home = () => {
  const navigate = useNavigate();
  const {
    routes,
    routeState,
    selectedCompanion,
    userState,
    runHistory,
    routeFragmentProgress,
    selectRoute,
  } = useDemo();
  const { foodInventory, petVitality } = usePet();
  const initialKind =
    userState.preferredRouteType ||
    (routeState.selectedRouteType === 'Modern' ? 'modern' : 'historical');
  const [activeKind, setActiveKind] = useState<'historical' | 'modern'>(initialKind || 'historical');
  const [activeIndex, setActiveIndex] = useState(0);
  const [goalOpen, setGoalOpen] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionMessage, setCompanionMessage] = useState<CompanionDailyMessage | null>(null);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(getWeeklyGoal);
  const weeklyDistanceKm = useMemo(() => getWeeklyDistance(runHistory), [runHistory]);
  const todayCompletedKm = useMemo(() => getTodayDistance(runHistory), [runHistory]);

  const visibleRoutes = useMemo(
    () =>
      routes.filter((route) =>
        activeKind === 'historical'
          ? route.type === 'Historical' || route.type === 'Historical Test'
          : route.type === 'Modern',
      ),
    [activeKind, routes],
  );
  const selectedRoute =
    visibleRoutes[activeIndex] ??
    visibleRoutes.find((route) => route.id === routeState.selectedRouteId) ??
    visibleRoutes[0];
  const companionProgress = useMemo<CompanionProgressSummary>(() => {
    const todayPlanKm = Math.max(1, Number((weeklyGoalKm / 7).toFixed(1)));
    const remainingTodayKm = Math.max(0, todayPlanKm - todayCompletedKm);
    const selectedRouteDistanceKm = parseDistanceKm(selectedRoute?.dist);
    const selectedRouteId = selectedRoute?.id ?? routeState.selectedRouteId;
    const requiredFragments = getRequiredFragmentCount(selectedRouteId) || 5;
    const collectedFragments =
      routeFragmentProgress[selectedRouteId]?.collectedFragmentIds.length ?? 0;
    const fragmentsRemaining = Math.max(0, requiredFragments - collectedFragments);
    const nextFragmentKm = Number(
      Math.max(0.6, selectedRouteDistanceKm / Math.max(1, requiredFragments)).toFixed(1),
    );

    return {
      todayCompletedKm,
      todayPlanKm,
      remainingTodayKm,
      foodInventory,
      petVitality,
      collectedFragments,
      requiredFragments,
      fragmentsRemaining,
      nextFragmentKm,
    };
  }, [
    foodInventory,
    petVitality,
    routeFragmentProgress,
    routeState.selectedRouteId,
    selectedRoute,
    todayCompletedKm,
    weeklyGoalKm,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeKind]);

  useEffect(() => {
    const refreshWeeklyGoal = () => {
      setWeeklyGoalKm(getWeeklyGoal());
    };

    window.addEventListener(USER_PROGRESS_UPDATED_EVENT, refreshWeeklyGoal);
    return () => window.removeEventListener(USER_PROGRESS_UPDATED_EVENT, refreshWeeklyGoal);
  }, []);

  const selectRouteAt = (index: number) => {
    if (!visibleRoutes.length) {
      return;
    }
    const nextIndex = (index + visibleRoutes.length) % visibleRoutes.length;
    setActiveIndex(nextIndex);
    selectRoute(visibleRoutes[nextIndex]);
  };

  const handleRouteProceed = (route = selectedRoute) => {
    if (!route) {
      return;
    }
    selectRoute(route);
    navigate('/tracker', { state: { route } });
  };

  const openCompanionPopup = () => {
    setCompanionMessage(pickCompanionMessage(companionProgress));
    setCompanionOpen(true);
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const isModern = activeKind === 'modern';

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] pb-28"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-10">
        <header className="mb-5">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-text-muted/70">
              {today}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight text-text-main">
              Good run, {userState.userName || 'Traveler'}
            </h1>
            <p className="mt-1 text-sm font-medium text-text-muted">
              {selectedCompanion?.name ?? 'Your companion'} is ready for the next route.
            </p>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGoalOpen(true)}
            className="relative z-20 flex min-h-[128px] cursor-pointer flex-col rounded-3xl bg-white p-4 text-left shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            aria-label="Open weekly goal settings"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">This week</p>
            <p className="mt-2 font-display text-3xl font-bold text-text-main">{weeklyDistanceKm.toFixed(1)}</p>
            <p className="text-xs font-bold text-text-muted">km logged</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-brand-dark">
              Goal {weeklyGoalKm} km
            </p>
          </button>
          <button
            type="button"
            onClick={openCompanionPopup}
            className="flex min-h-[128px] flex-col rounded-3xl bg-white p-4 text-left shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            aria-label={`Open ${selectedCompanion?.name ?? 'companion'} daily message`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Companion</p>
            <div className="mt-2 flex flex-1 items-center gap-2.5">
              <img
                src={selectedCompanion?.headImage ?? publicAsset('dog-head.jpg')}
                alt={selectedCompanion?.name ?? 'Companion'}
                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-text-main">{selectedCompanion?.name ?? 'Aqua Pup'}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  In sync
                </p>
              </div>
            </div>
          </button>
        </section>

        <div className="mb-5 rounded-2xl bg-[#F1EFE7] p-1 shadow-inner">
          {(['historical', 'modern'] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => setActiveKind(kind)}
              className={cn(
                'w-1/2 rounded-xl py-3 text-sm font-black capitalize transition-all',
                activeKind === kind ? 'bg-white text-text-main shadow-soft' : 'text-text-muted',
              )}
            >
              {kind === 'historical' ? 'Echo of Time' : "Today's Pulse"}
            </button>
          ))}
        </div>

        <section className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('h-6 w-1.5 rounded-full', isModern ? 'bg-brand' : 'bg-amber-300')} />
              <h2 className="font-display text-xl font-bold text-text-main">
                {isModern ? 'Urban trail' : 'Story route'}
              </h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-text-muted shadow-soft">
              Recommended
            </span>
          </div>

          <div className="hidden">
            {visibleRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => handleRouteProceed(route)}
                className={cn(
                  'min-w-[72%] snap-center rounded-3xl border p-3 text-left shadow-soft transition-all',
                  route.id === selectedRoute?.id
                    ? 'scale-100 border-text-main/20 bg-white'
                    : 'scale-[0.94] border-transparent bg-white/60 opacity-70',
                )}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={route.img}
                    alt={route.title}
                    className="h-12 w-12 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-text-main">{route.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      {route.type} · {route.dist}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedRoute && (
            <div className="relative overflow-hidden pb-1">
              {visibleRoutes.length > 1 && (
                <div className="pointer-events-none absolute right-[-42px] top-7 h-[302px] w-[94px] overflow-hidden rounded-[28px] bg-white shadow-soft opacity-70">
                  <img
                    src={visibleRoutes[(activeIndex + 1) % visibleRoutes.length].img}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-text-main/25" />
                </div>
              )}
            <motion.article
              key={selectedRoute.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleRouteProceed()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleRouteProceed();
                }
              }}
              role="button"
              tabIndex={0}
              className="relative z-10 min-h-[350px] w-[92%] cursor-pointer overflow-hidden rounded-[32px] bg-white shadow-[0_20px_50px_rgba(45,74,72,0.12)] transition-transform active:scale-[0.99]"
            >
              <img
                src={selectedRoute.img}
                alt={selectedRoute.title}
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-text-main/10 via-text-main/5 to-text-main/82" />
              <div className="absolute left-4 right-4 top-4 flex justify-between">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    selectRouteAt(activeIndex - 1);
                  }}
                  className="mr-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-text-main shadow-soft"
                  aria-label="Previous route"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    selectRouteAt(activeIndex + 1);
                  }}
                  className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-text-main shadow-soft"
                  aria-label="Next route"
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="mb-3 max-w-[88%] font-display text-2xl font-bold leading-tight">{selectedRoute.title}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <RouteFact icon={<MapPin size={13} />} label="Distance" value={selectedRoute.dist} />
                  <RouteFact icon={<Clock size={13} />} label="Time" value={selectedRoute.time} />
                  <RouteFact
                    icon={isModern ? <Zap size={13} /> : <Compass size={13} />}
                    label="Focus"
                    value={isModern ? 'Pulse' : 'Atlas'}
                  />
                </div>
                <p className="mt-3 text-center text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
                  Tap card to start
                </p>
              </div>
            </motion.article>
            </div>
          )}
        </section>

      </div>
      <WeeklyGoalSheet
        open={goalOpen}
        goalKm={weeklyGoalKm}
        onClose={() => setGoalOpen(false)}
        onSave={(goal) => {
          const savedGoal = saveWeeklyGoal(goal);
          setWeeklyGoalKm(savedGoal);
          setGoalOpen(false);
        }}
      />
      <CompanionMessageModal
        open={companionOpen}
        companionName={selectedCompanion?.name ?? 'Aqua Pup'}
        companionImage={selectedCompanion?.headImage ?? publicAsset('dog-head.jpg')}
        message={companionMessage}
        summary={companionProgress}
        selectedRoute={selectedRoute}
        onClose={() => setCompanionOpen(false)}
        onStartRun={() => {
          setCompanionOpen(false);
          handleRouteProceed();
        }}
      />
    </motion.main>
  );
};

const CompanionMessageModal = ({
  open,
  companionName,
  companionImage,
  message,
  summary,
  selectedRoute,
  onClose,
  onStartRun,
}: {
  open: boolean;
  companionName: string;
  companionImage: string;
  message: CompanionDailyMessage | null;
  summary: CompanionProgressSummary;
  selectedRoute?: RouteOption;
  onClose: () => void;
  onStartRun: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-text-main/40 p-5 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-sm rounded-[34px] bg-[#FDFBF7] p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={companionImage}
                alt={companionName}
                className="h-14 w-14 rounded-2xl object-cover shadow-soft"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-muted">
                  {companionName} says...
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-text-main">Daily Check-in</h2>
              </div>
            </div>
            <button onClick={onClose} className="h-10 w-10 shrink-0 rounded-full bg-white text-text-main shadow-soft">
              <X className="mx-auto" size={17} />
            </button>
          </div>

          <div className="relative mb-3 rounded-[28px] bg-white px-5 py-5 shadow-soft">
            <span className="absolute -left-1 top-8 h-4 w-4 rotate-45 rounded-[4px] bg-white" />
            <p className="text-[17px] font-black leading-relaxed text-text-main">
              {message?.text ?? "I'm with you today - let's pick a tiny adventure!"}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-0 overflow-hidden rounded-[24px] bg-white/88 px-3 py-3.5 shadow-soft">
            <CompanionStat label="Today" value={`${formatKm(summary.todayCompletedKm)} / ${formatKm(summary.todayPlanKm)} km`} />
            <CompanionStat label="Fragments" value={`${summary.collectedFragments} / ${summary.requiredFragments}`} divider />
            <CompanionStat label="Energy" value={`${Math.round(summary.petVitality)}%`} />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onStartRun}
              disabled={!selectedRoute}
              className="flex-1 rounded-[22px] bg-text-main px-4 py-4 text-sm font-black text-white shadow-soft disabled:opacity-50"
            >
              Start Run
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[22px] bg-white px-4 py-4 text-sm font-black text-text-main shadow-soft"
            >
              Later
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const WeeklyGoalSheet = ({
  open,
  goalKm,
  onClose,
  onSave,
}: {
  open: boolean;
  goalKm: number;
  onClose: () => void;
  onSave: (goalKm: number) => void;
}) => {
  const [draftGoal, setDraftGoal] = useState(goalKm);

  useEffect(() => {
    if (open) {
      setDraftGoal(goalKm);
    }
  }, [goalKm, open]);

  const changeGoal = (delta: number) => setDraftGoal((prev) => Math.max(1, prev + delta));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-text-main/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 320 }}
            animate={{ y: 0 }}
            exit={{ y: 320 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-t-[34px] bg-[#FDFBF7] p-6 shadow-2xl"
          >
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-text-muted">
                  Weekly target
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold text-text-main">Set Your Goal</h2>
              </div>
              <button onClick={onClose} className="h-11 w-11 rounded-full bg-white text-text-main shadow-soft">
                <X className="mx-auto" size={18} />
              </button>
            </div>

            <div className="mb-7 flex items-center justify-center gap-8">
              <button
                onClick={() => changeGoal(-1)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-text-main shadow-soft"
                aria-label="Decrease weekly goal"
              >
                <Minus size={22} />
              </button>
              <div className="min-w-[116px] text-center">
                <p className="font-display text-6xl font-bold leading-none text-text-main">{draftGoal}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-text-muted">km / week</p>
              </div>
              <button
                onClick={() => changeGoal(1)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-text-main shadow-soft"
                aria-label="Increase weekly goal"
              >
                <Plus size={22} />
              </button>
            </div>

            <div className="mb-8 grid grid-cols-4 gap-2">
              {[10, 20, 30, 50].map((target) => (
                <button
                  key={target}
                  onClick={() => setDraftGoal(target)}
                  className={cn(
                    'rounded-full px-3 py-3 text-sm font-black shadow-soft transition-all',
                    draftGoal === target ? 'bg-text-main text-white' : 'bg-white text-text-main',
                  )}
                >
                  {target} km
                </button>
              ))}
            </div>

            <button
              onClick={() => onSave(draftGoal)}
              className="w-full rounded-[24px] bg-text-main py-5 text-base font-black text-white shadow-soft"
            >
              Save Goal
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RouteFact = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl bg-white/16 px-2 py-2 backdrop-blur-md">
    <div className="mb-0.5 flex items-center justify-center text-white/70">{icon}</div>
    <p className="text-center text-[8px] font-black uppercase tracking-widest text-white/55">{label}</p>
    <p className="mt-0.5 text-center text-[11px] font-black text-white">{value}</p>
  </div>
);

const CompanionStat = ({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) => (
  <div className={cn('px-2 text-center', divider && 'border-x border-text-main/10')}>
    <p className="truncate text-[13px] font-black text-text-main">{value}</p>
    <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-text-muted">{label}</p>
  </div>
);

export default Home;
