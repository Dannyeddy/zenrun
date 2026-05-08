import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Compass, Lock, MapPin, Route, X } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import {
  AtlasPoint,
  atlasBackground,
  atlasBarcode,
  lockedAtlasPoints,
  visitedAtlasSeeds,
} from '../lib/atlasPoints';
import { cn } from '../lib/utils';

const WORLD_MAP_BACKGROUND_OFFSET_X = 0;
const WORLD_MARKER_COMPENSATION_X = 0;

const normalizeRouteName = (value: string | undefined) =>
  (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const formatAtlasDate = (completedAt: string | undefined) => {
  if (!completedAt) {
    return 'Visited';
  }

  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Visited';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isAtlasPointUnlocked = (
  point: AtlasPoint,
  atlasUnlockState: {
    routeIds: Set<string>;
    routeNames: Set<string>;
  },
) => {
  const normalizedPointRouteName = normalizeRouteName(point.routeName);
  const unlockedByRouteId = point.routeId ? atlasUnlockState.routeIds.has(point.routeId) : false;
  const unlockedByRouteName = normalizedPointRouteName
    ? atlasUnlockState.routeNames.has(normalizedPointRouteName)
    : false;

  return unlockedByRouteId || unlockedByRouteName;
};

const Journey = () => {
  const { runHistory, treasureRewards } = useDemo();
  const [selectedPoint, setSelectedPoint] = useState<AtlasPoint | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<'world' | 'china'>('world');

  const atlasUnlockState = useMemo(() => {
    const routeIds = new Set<string>();
    const routeNames = new Set<string>();
    const completionByRouteId = new Map<string, string>();
    const completionByRouteName = new Map<string, string>();

    runHistory.forEach((run) => {
      if (run.routeId) {
        routeIds.add(run.routeId);
        completionByRouteId.set(run.routeId, run.completedAt);
      }

      const normalizedRouteName = normalizeRouteName(run.routeName);
      if (normalizedRouteName) {
        routeNames.add(normalizedRouteName);
        completionByRouteName.set(normalizedRouteName, run.completedAt);
      }
    });

    treasureRewards.forEach((reward) => {
      if (reward.sourceRouteId) {
        routeIds.add(reward.sourceRouteId);
        completionByRouteId.set(reward.sourceRouteId, reward.earnedAt);
      }

      const normalizedRouteName = normalizeRouteName(reward.sourceRouteName);
      if (normalizedRouteName) {
        routeNames.add(normalizedRouteName);
        completionByRouteName.set(normalizedRouteName, reward.earnedAt);
      }
    });

    return { routeIds, routeNames, completionByRouteId, completionByRouteName };
  }, [runHistory, treasureRewards]);

  const atlasPoints = useMemo(() => {
    const chinaPoints = visitedAtlasSeeds
      .map((point) => {
        const normalizedPointRouteName = normalizeRouteName(point.routeName);
        const unlocked = isAtlasPointUnlocked(point, atlasUnlockState);
        const completedAt =
          (point.routeId ? atlasUnlockState.completionByRouteId.get(point.routeId) : undefined) ??
          (normalizedPointRouteName
            ? atlasUnlockState.completionByRouteName.get(normalizedPointRouteName)
            : undefined);

        return {
          ...point,
          status: unlocked ? ('visited' as const) : ('locked' as const),
          date: unlocked ? formatAtlasDate(completedAt) : point.date,
          unlockHint: unlocked
            ? point.unlockHint
            : 'Complete this route to add its postcard to your atlas.',
        };
      })
      .sort((a, b) => (a.status === 'visited' ? -1 : 1) - (b.status === 'visited' ? -1 : 1));

    if (mapZoomLevel === 'china') {
      return chinaPoints.filter((point) => point.visibleInRegion !== false);
    }

    return [
      ...chinaPoints.filter((point) => point.visibleInWorld),
      ...lockedAtlasPoints.filter((point) => point.visibleInWorld !== false),
    ];
  }, [atlasUnlockState, mapZoomLevel]);

  const atlasStats = useMemo(() => {
    const unlockableAtlasPoints = visitedAtlasSeeds.filter((point) => Boolean(point.routeId));
    const totalAtlasCards = visitedAtlasSeeds.length + lockedAtlasPoints.length;

    const completedRouteIds = new Set<string>();
    unlockableAtlasPoints.forEach((point) => {
      if (point.routeId && isAtlasPointUnlocked(point, atlasUnlockState)) {
        completedRouteIds.add(point.routeId);
      }
    });

    const visitedRoutes = completedRouteIds.size;

    return {
      totalAtlasCards,
      visitedRoutes,
      completion: totalAtlasCards > 0 ? Math.round((visitedRoutes / totalAtlasCards) * 100) : 0,
    };
  }, [atlasUnlockState]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] pb-28"
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pt-10">
        <header className="mb-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
                World memory map
              </p>
              <h1 className="mt-1 font-display text-4xl font-bold text-text-main">Journey</h1>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-text-main shadow-soft">
              <Compass size={22} />
            </span>
          </div>
          <p className="max-w-[300px] text-sm font-medium leading-relaxed text-text-muted">
            Completed routes become postcards on your world map. Future destinations wait quietly ahead.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-white/75 p-3 shadow-soft backdrop-blur">
            <Stat label="Visited" value={`${atlasStats.visitedRoutes}/${atlasStats.totalAtlasCards}`} />
            <Stat label="Complete" value={`${atlasStats.completion}%`} divider />
            <Stat label="Routes" value={`${atlasStats.totalAtlasCards}`} />
          </div>
        </header>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-text-main">World Atlas</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Tap a postcard
            </span>
          </div>
          <AtlasMap
            points={atlasPoints}
            selectedPoint={selectedPoint}
            onSelect={setSelectedPoint}
            mapZoomLevel={mapZoomLevel}
            onZoomChina={() => {
              setSelectedPoint(null);
              setMapZoomLevel('china');
            }}
            onBackWorld={() => {
              setSelectedPoint(null);
              setMapZoomLevel('world');
            }}
          />
        </section>
      </div>

      <AtlasDetailModal point={selectedPoint} onClose={() => setSelectedPoint(null)} />
    </motion.main>
  );
};

const AtlasMap = ({
  points,
  selectedPoint,
  onSelect,
  mapZoomLevel,
  onZoomChina,
  onBackWorld,
}: {
  points: AtlasPoint[];
  selectedPoint: AtlasPoint | null;
  onSelect: (point: AtlasPoint) => void;
  mapZoomLevel: 'world' | 'china';
  onZoomChina: () => void;
  onBackWorld: () => void;
}) => {
  const atlasViewMode = mapZoomLevel;
  const regionLabel = atlasViewMode === 'china' ? 'CHINA' : 'WORLD';
  const mapScale = selectedPoint ? 1.16 : mapZoomLevel === 'china' ? 1.62 : 1.04;
  const focusX = selectedPoint?.focusX ?? (mapZoomLevel === 'china' ? 25 : 50);
  const focusY = selectedPoint?.focusY ?? (mapZoomLevel === 'china' ? 45 : 50);
  const zoomTransform = selectedPoint
    ? `scale(${mapScale}) translate(${(50 - focusX) * 0.18}%, ${(50 - focusY) * 0.16}%)`
    : mapZoomLevel === 'china'
      ? `scale(${mapScale}) translate(18%, 1%)`
      : `scale(${mapScale}) translate(-4%, 0%)`;

  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-[34px] border border-text-main/5 bg-text-main shadow-[0_20px_55px_rgba(45,74,72,0.16)]"
      onDoubleClick={() => {
        if (mapZoomLevel === 'china') {
          onBackWorld();
        } else {
          onZoomChina();
        }
      }}
    >
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        animate={{
          scale: selectedPoint || mapZoomLevel === 'china' ? 1 : [1, 1.018, 1],
          x: selectedPoint || mapZoomLevel === 'china' ? 0 : [0, -8, 0],
          y: selectedPoint || mapZoomLevel === 'china' ? 0 : [0, 5, 0],
        }}
        transition={{
          duration: selectedPoint || mapZoomLevel === 'china' ? 0.45 : 18,
          repeat: selectedPoint || mapZoomLevel === 'china' ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        drag
        dragConstraints={{ left: -28, right: 28, top: -22, bottom: 22 }}
        dragElastic={0.05}
      >
        <motion.div
          className="absolute inset-[-5%]"
          animate={{ transform: zoomTransform }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={atlasBackground}
            alt="Pacific world atlas map"
            className="absolute inset-0 h-full w-full object-cover opacity-95"
            style={{
              transform:
                mapZoomLevel === 'world'
                  ? `translateX(${WORLD_MAP_BACKGROUND_OFFSET_X}%)`
                  : undefined,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-text-main/10 via-transparent to-text-main/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(126,232,224,0.18),transparent_45%)]" />

          {points.map((point, index) => (
            <React.Fragment key={point.id}>
              <AtlasPostcardMarker
                point={point}
                active={selectedPoint?.id === point.id}
                index={index}
                onSelect={onSelect}
                mapZoomLevel={mapZoomLevel}
                mapScale={mapScale}
                markerCompensationX={
                  mapZoomLevel === 'world' ? WORLD_MARKER_COMPENSATION_X : 0
                }
              />
            </React.Fragment>
          ))}
        </motion.div>
      </motion.div>

      <button
        type="button"
        onClick={mapZoomLevel === 'china' ? onBackWorld : onZoomChina}
        className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-text-main shadow-soft backdrop-blur"
        aria-label={mapZoomLevel === 'china' ? 'Switch to world atlas view' : 'Switch to China atlas view'}
      >
        {regionLabel}
      </button>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-2xl bg-white/86 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted shadow-soft backdrop-blur">
        <span>{mapZoomLevel === 'china' ? 'China postcards' : 'Visited postcards'}</span>
        <span>{mapZoomLevel === 'china' ? 'Double tap back' : 'Locked future'}</span>
      </div>
    </div>
  );
};

const AtlasPostcardMarker = ({
  point,
  active,
  index,
  onSelect,
  mapZoomLevel,
  mapScale,
  markerCompensationX,
}: {
  point: AtlasPoint;
  active: boolean;
  index: number;
  onSelect: (point: AtlasPoint) => void;
  mapZoomLevel: 'world' | 'china';
  mapScale: number;
  markerCompensationX: number;
}) => {
  const visited = point.status === 'visited';
  const markerX =
    (mapZoomLevel === 'china' ? point.xRegion ?? point.x : point.xWorld ?? point.x) +
    markerCompensationX;
  const markerY = mapZoomLevel === 'china' ? point.yRegion ?? point.y : point.yWorld ?? point.y;
  const inverseMarkerScale = Math.max(0.62, Math.min(1, 1 / mapScale));
  const markerSizeClass =
    mapZoomLevel === 'china'
      ? 'h-[74px] w-[56px]'
      : point.region === 'world'
        ? 'h-[82px] w-[62px]'
        : 'h-[86px] w-[66px]';
  const imageSizeClass = mapZoomLevel === 'china' ? 'h-[44px]' : 'h-[50px]';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10, rotate: point.rotation ?? 0 }}
      animate={{
        opacity: 1,
        y: active ? -5 : 0,
        rotate: active ? 0 : point.rotation ?? 0,
        scale: active ? 1.08 : 1,
      }}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(point);
      }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
      style={{ left: `${markerX}%`, top: `${markerY}%` }}
    >
      <div
        className={cn(
          'relative min-h-11 min-w-11 overflow-hidden rounded-xl p-1.5 shadow-[0_16px_28px_rgba(8,20,35,0.28)] transition-all',
          markerSizeClass,
          visited ? 'bg-white' : 'bg-white/60 backdrop-blur-sm grayscale',
          active && 'ring-4 ring-brand/50',
        )}
        style={{ transform: `scale(${inverseMarkerScale})`, transformOrigin: 'center' }}
      >
        <span className="absolute -top-3 left-1/2 z-20 h-6 w-6 -translate-x-1/2 rounded-full bg-white shadow-soft">
          <span
            className={cn(
              'absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full',
              visited ? 'bg-brand-dark' : 'bg-text-muted/45',
            )}
          />
        </span>
        <img
          src={point.image}
          alt={point.title}
          className={cn(imageSizeClass, 'w-full rounded-lg object-cover', visited ? 'opacity-95' : 'opacity-55 blur-[0.4px]')}
        />
        {!visited && (
          <span className="absolute right-2 top-2 rounded-full bg-white/88 p-1 text-text-main/70 shadow-soft">
            <Lock size={9} />
          </span>
        )}
        <p className={cn('mt-1 truncate text-[8px] font-black uppercase tracking-widest', visited ? 'text-text-main' : 'text-text-muted')}>
          {point.title}
        </p>
        <p className="truncate text-[7px] font-bold uppercase tracking-wider text-text-muted">
          {visited ? 'Visited' : 'Locked'}
        </p>
      </div>
    </motion.button>
  );
};

const AtlasDetailModal = ({
  point,
  onClose,
}: {
  point: AtlasPoint | null;
  onClose: () => void;
}) => {
  const visited = point?.status === 'visited';

  return (
    <AnimatePresence>
      {point && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-text-main/45 p-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-[34px] bg-[#FDFBF7] px-5 pb-6 pt-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-text-muted">
                  {visited ? 'TRAVEL DIARY - ENTRY' : 'LOCKED DESTINATION'}
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold italic leading-tight text-text-main">
                  {point.title}
                </h2>
              </div>
              <button onClick={onClose} className="h-11 w-11 shrink-0 rounded-full bg-white text-text-main shadow-soft">
                <X className="mx-auto" size={19} />
              </button>
            </div>

            <div className="relative mx-auto mb-5 w-[92%] rounded-[28px] bg-white p-3 shadow-[0_18px_50px_rgba(45,74,72,0.10)]">
              <span className="absolute -top-3 left-7 h-7 w-14 rotate-[-3deg] rounded-full bg-brand/15 opacity-80 [background-image:repeating-linear-gradient(45deg,transparent_0,transparent_6px,rgba(255,255,255,0.75)_6px,rgba(255,255,255,0.75)_11px)]" />
              <span className="absolute -top-3 right-8 h-7 w-14 rotate-[4deg] rounded-full bg-brand/15 opacity-80 [background-image:repeating-linear-gradient(45deg,transparent_0,transparent_6px,rgba(255,255,255,0.75)_6px,rgba(255,255,255,0.75)_11px)]" />

              <div className={cn('relative aspect-[4/5] overflow-hidden rounded-[22px] bg-white', !visited && 'grayscale')}>
                <img
                  src={point.image}
                  alt={point.title}
                  className={cn('h-full w-full object-cover', !visited && 'opacity-58 blur-[0.5px]')}
                />
                {visited ? (
                  <span className="absolute right-4 top-4 rounded-2xl bg-brand/75 px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-white shadow-soft">
                    Visit
                    <br />
                    OK
                  </span>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/88 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-main shadow-soft">
                      <Lock size={13} /> Locked
                    </span>
                  </div>
                )}
                <p className="absolute bottom-4 left-4 font-display text-2xl font-bold text-white drop-shadow">
                  {point.title}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-text-muted">
                <MapPin size={15} />
                {point.country ?? point.routeName ?? 'Future destination'}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed border-text-main/15 pt-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Distance</p>
                  <p className="mt-1 text-base font-black text-text-main">{point.distance ?? '--'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</p>
                  <p className="mt-1 text-base font-black text-text-main">
                    {visited ? point.date ?? 'Visited' : '--/--/----'}
                  </p>
                </div>
              </div>

              <img
                src={atlasBarcode}
                alt="Atlas barcode"
                className="mt-4 h-8 w-36 object-fill opacity-45 mix-blend-multiply"
              />
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 rounded-3xl bg-white p-3 shadow-soft">
              <Meta icon={<MapPin size={15} />} label="Where" value={point.country ?? 'Atlas'} />
              <Meta icon={<Route size={15} />} label="Distance" value={point.distance ?? '--'} divider />
              <Meta icon={<Calendar size={15} />} label={visited ? 'Visited' : 'Status'} value={visited ? point.date ?? 'Visited' : 'Locked'} />
            </div>

            <p className="text-sm font-medium italic leading-relaxed text-text-muted">
              {visited
                ? point.moodQuote ?? 'A small route became a lasting memory.'
                : point.unlockHint ?? 'Keep going. Your next run brings this destination closer.'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Stat = ({ label, value, divider }: { label: string; value: string; divider?: boolean }) => (
  <div className={cn('text-center', divider && 'border-x border-text-main/10')}>
    <p className="font-display text-lg font-bold text-text-main">{value}</p>
    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
  </div>
);

const Meta = ({
  icon,
  label,
  value,
  divider,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  divider?: boolean;
}) => (
  <div className={cn('text-center', divider && 'border-x border-text-main/10')}>
    <div className="mb-1 flex justify-center text-text-main/60">{icon}</div>
    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
    <p className="mt-0.5 truncate text-[11px] font-black text-text-main">{value}</p>
  </div>
);

export default Journey;
