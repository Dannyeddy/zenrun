import React, {
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  companions,
  defaultHistoricalReward,
  historicalRewards,
  RouteOption,
  routes,
  CompanionOption,
} from '../lib/demoData';
import {
  CurrentRunFragments,
  getRequiredFragmentCount,
  getRouteFragmentReward,
  RouteFragmentProgress,
} from '../lib/routeFragments';

export type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

export interface UserState {
  userName: string;
  selectedCompanion: CompanionOption | null;
  onboardingSeen: boolean;
  preferredRouteType: 'historical' | 'modern' | '';
}

export interface RouteState {
  selectedRouteId: string;
  selectedRouteName: string;
  selectedRouteType: string;
  routeDistance: string;
  estimatedDuration: string;
}

export interface RunState {
  isRunning: boolean;
  locationStatus: LocationStatus;
  currentLatitude: number | null;
  currentLongitude: number | null;
  duration: number;
  distance: number;
  pace: string;
  landmarkTriggered: boolean;
  discoveryOverlayOpen: boolean;
  expandedHistoricalCardOpen: boolean;
  runCompleted: boolean;
}

export interface RewardState {
  rewardType: string;
  rewardName: string;
  rewardImage: string;
  sourceRouteId: string;
}

export interface RunHistoryItem {
  id: string;
  routeId: string;
  routeName: string;
  routeType: string;
  duration: number;
  distance: number;
  pace: string;
  completedAt: string;
  landmarkTriggered: boolean;
}

export interface TreasureRewardItem extends RewardState {
  id: string;
  sourceRouteName: string;
  earnedAt: string;
}

export interface RouteFragmentSnapshot {
  routeId: string;
  collectedFragmentIds: string[];
  currentRunFragmentIds: string[];
  requiredFragmentCount: number;
  completed: boolean;
  rewardType: 'treasure' | 'food' | null;
  rewardId: string | null;
  rewardName: string | null;
  rewardClaimed: boolean;
  newlyRewarded: boolean;
  foodCount?: number;
}

interface DemoContextType {
  userState: UserState;
  routeState: RouteState;
  runState: RunState;
  rewardState: RewardState;
  selectedRoute: RouteOption | null;
  selectedCompanion: CompanionOption | null;
  runHistory: RunHistoryItem[];
  treasureRewards: TreasureRewardItem[];
  currentRunFragments: CurrentRunFragments | null;
  routeFragmentProgress: Record<string, RouteFragmentProgress>;
  routes: RouteOption[];
  companions: CompanionOption[];
  setUserProfile: (
    userName: string,
    companionId: number,
    preferredRouteType: 'historical' | 'modern',
  ) => void;
  updateCurrentCompanion: (companionId: number) => void;
  markOnboardingSeen: () => void;
  setPreferredRouteType: (preferredRouteType: 'historical' | 'modern') => void;
  signOut: () => void;
  selectRoute: (route: RouteOption) => void;
  startRun: () => void;
  setLocationStatus: (
    status: LocationStatus,
    coords?: { latitude: number; longitude: number },
  ) => void;
  updateRunMetrics: (values: Partial<Pick<RunState, 'duration' | 'distance' | 'pace'>>) => void;
  triggerLandmarkDiscovery: () => void;
  expandHistoricalCard: () => void;
  closeDiscovery: () => void;
  completeRun: () => RunHistoryItem;
  saveHistoricalReward: () => TreasureRewardItem;
  collectRouteFragment: (routeId: string, checkpointId: string) => void;
  claimRouteFragmentReward: (routeId: string) => RouteFragmentSnapshot;
  getRouteFragmentSnapshot: (routeId: string) => RouteFragmentSnapshot;
  resetRunState: () => void;
}

const STORAGE_KEYS = {
  userName: 'userName',
  selectedCompanion: 'selectedCompanion',
  onboardingSeen: 'onboardingSeen',
  preferredRouteType: 'preferredRouteType',
  lastSelectedRoute: 'lastSelectedRoute',
  runHistory: 'runHistory',
  treasureRewards: 'treasureRewards',
  currentRunFragments: 'currentRunFragments',
  routeFragmentProgress: 'routeFragmentProgress',
} as const;

const defaultUserState: UserState = {
  userName: '',
  selectedCompanion: null,
  onboardingSeen: false,
  preferredRouteType: '',
};

const defaultRouteState: RouteState = {
  selectedRouteId: '',
  selectedRouteName: '',
  selectedRouteType: '',
  routeDistance: '',
  estimatedDuration: '',
};

const defaultRunState: RunState = {
  isRunning: false,
  locationStatus: 'idle',
  currentLatitude: null,
  currentLongitude: null,
  duration: 0,
  distance: 0,
  pace: '--',
  landmarkTriggered: false,
  discoveryOverlayOpen: false,
  expandedHistoricalCardOpen: false,
  runCompleted: false,
};

const defaultRewardState: RewardState = {
  rewardType: defaultHistoricalReward.rewardType,
  rewardName: defaultHistoricalReward.rewardName,
  rewardImage: defaultHistoricalReward.rewardImage,
  sourceRouteId: defaultHistoricalReward.sourceRouteId,
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const clearXjtluTestFragmentProgress = (
  progress: Record<string, RouteFragmentProgress>,
): Record<string, RouteFragmentProgress> => {
  if (!progress['xjtlu-test']) {
    return progress;
  }

  const nextProgress = { ...progress };
  delete nextProgress['xjtlu-test'];
  return nextProgress;
};

const clearXjtluTestCurrentRunFragments = (
  fragments: CurrentRunFragments | null,
): CurrentRunFragments | null =>
  fragments?.routeId === 'xjtlu-test' ? null : fragments;

const formatPace = (distanceKm: number, durationSeconds: number) => {
  if (distanceKm <= 0 || durationSeconds <= 0) {
    return '--';
  }

  const totalSecondsPerKm = Math.max(1, Math.round(durationSeconds / distanceKm));
  const minutes = Math.floor(totalSecondsPerKm / 60);
  const seconds = totalSecondsPerKm % 60;
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
};

const createFragmentSnapshot = (
  routeId: string,
  progress: Record<string, RouteFragmentProgress>,
  currentRunFragments: CurrentRunFragments | null,
  newlyRewarded = false,
): RouteFragmentSnapshot => {
  const reward = getRouteFragmentReward(routeId);
  const collectedFragmentIds = progress[routeId]?.collectedFragmentIds ?? [];
  const requiredFragmentCount = getRequiredFragmentCount(routeId);

  return {
    routeId,
    collectedFragmentIds,
    currentRunFragmentIds:
      currentRunFragments?.routeId === routeId ? currentRunFragments.collectedFragmentIds : [],
    requiredFragmentCount,
    completed: progress[routeId]?.completed ?? false,
    rewardType: reward?.rewardType ?? null,
    rewardId: reward?.rewardId ?? null,
    rewardName: reward?.rewardName ?? null,
    rewardClaimed: progress[routeId]?.rewardClaimed ?? false,
    newlyRewarded,
    foodCount: reward?.rewardType === 'food' ? reward.foodCount : undefined,
  };
};

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userState, setUserState] = useState<UserState>(() => {
    const storedCompanion = readJson<CompanionOption | null>(STORAGE_KEYS.selectedCompanion, null);
    return {
      userName: canUseStorage() ? window.localStorage.getItem(STORAGE_KEYS.userName) ?? '' : '',
      selectedCompanion: storedCompanion,
      onboardingSeen: readJson<boolean>(STORAGE_KEYS.onboardingSeen, false),
      preferredRouteType: readJson<'historical' | 'modern' | ''>(
        STORAGE_KEYS.preferredRouteType,
        '',
      ),
    };
  });

  const [routeState, setRouteState] = useState<RouteState>(() => {
    const storedRoute = readJson<RouteOption | null>(STORAGE_KEYS.lastSelectedRoute, null);
    if (!storedRoute) {
      return defaultRouteState;
    }
    return {
      selectedRouteId: storedRoute.id,
      selectedRouteName: storedRoute.title,
      selectedRouteType: storedRoute.type,
      routeDistance: storedRoute.dist,
      estimatedDuration: storedRoute.time,
    };
  });

  const [runState, setRunState] = useState<RunState>(defaultRunState);
  const [rewardState, setRewardState] = useState<RewardState>(defaultRewardState);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>(
    () => readJson<RunHistoryItem[]>(STORAGE_KEYS.runHistory, []),
  );
  const [treasureRewards, setTreasureRewards] = useState<TreasureRewardItem[]>(
    () => readJson<TreasureRewardItem[]>(STORAGE_KEYS.treasureRewards, []),
  );
  const [currentRunFragments, setCurrentRunFragments] = useState<CurrentRunFragments | null>(
    () =>
      clearXjtluTestCurrentRunFragments(
        readJson<CurrentRunFragments | null>(STORAGE_KEYS.currentRunFragments, null),
      ),
  );
  const [routeFragmentProgress, setRouteFragmentProgress] = useState<
    Record<string, RouteFragmentProgress>
  >(() =>
    clearXjtluTestFragmentProgress(
      readJson<Record<string, RouteFragmentProgress>>(STORAGE_KEYS.routeFragmentProgress, {}),
    ),
  );

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === routeState.selectedRouteId) ?? null,
    [routeState.selectedRouteId],
  );

  useEffect(() => {
    if (!canUseStorage()) {
      return;
    }

    if (userState.userName) {
      window.localStorage.setItem(STORAGE_KEYS.userName, userState.userName);
    }
    writeJson(STORAGE_KEYS.selectedCompanion, userState.selectedCompanion);
    writeJson(STORAGE_KEYS.onboardingSeen, userState.onboardingSeen);
    writeJson(STORAGE_KEYS.preferredRouteType, userState.preferredRouteType);
  }, [userState]);

  useEffect(() => {
    if (selectedRoute) {
      writeJson(STORAGE_KEYS.lastSelectedRoute, selectedRoute);
    }
  }, [selectedRoute]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.runHistory, runHistory);
  }, [runHistory]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.treasureRewards, treasureRewards);
  }, [treasureRewards]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.currentRunFragments, currentRunFragments);
  }, [currentRunFragments]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.routeFragmentProgress, routeFragmentProgress);
  }, [routeFragmentProgress]);

  const setUserProfile = useCallback((
    userName: string,
    companionId: number,
    preferredRouteType: 'historical' | 'modern',
  ) => {
    const companion = companions.find((item) => item.id === companionId) ?? null;
    setUserState({
      userName: userName.trim(),
      selectedCompanion: companion,
      onboardingSeen: false,
      preferredRouteType,
    });
  }, []);

  const markOnboardingSeen = useCallback(() => {
    setUserState((prev) => ({ ...prev, onboardingSeen: true }));
  }, []);

  const updateCurrentCompanion = useCallback((companionId: number) => {
    const companion = companions.find((item) => item.id === companionId) ?? null;
    if (!companion) {
      return;
    }

    setUserState((prev) => ({
      ...prev,
      selectedCompanion: companion,
    }));
  }, []);

  const setPreferredRouteType = useCallback((preferredRouteType: 'historical' | 'modern') => {
    setUserState((prev) => ({ ...prev, preferredRouteType, onboardingSeen: false }));
  }, []);

  const signOut = useCallback(() => {
    if (canUseStorage()) {
      Object.values(STORAGE_KEYS).forEach((key) => {
        if (
          key !== STORAGE_KEYS.runHistory &&
          key !== STORAGE_KEYS.treasureRewards &&
          key !== STORAGE_KEYS.routeFragmentProgress
        ) {
          window.localStorage.removeItem(key);
        }
      });
    }

    setUserState(defaultUserState);
    setRouteState(defaultRouteState);
    setRunState(defaultRunState);
    setRewardState(defaultRewardState);
    setCurrentRunFragments(null);
  }, []);

  const selectRoute = useCallback((route: RouteOption) => {
    setRouteState({
      selectedRouteId: route.id,
      selectedRouteName: route.title,
      selectedRouteType: route.type,
      routeDistance: route.dist,
      estimatedDuration: route.time,
    });

    if (route.type === 'Historical' || route.type === 'Historical Test') {
      const rewardTemplate = historicalRewards[route.id] ?? defaultHistoricalReward;
      setRewardState({
        rewardType: rewardTemplate.rewardType,
        rewardName: rewardTemplate.rewardName,
        rewardImage: rewardTemplate.rewardImage,
        sourceRouteId: rewardTemplate.sourceRouteId,
      });
    }
  }, []);

  const startRun = useCallback(() => {
    setCurrentRunFragments({
      routeId: routeState.selectedRouteId,
      collectedFragmentIds: [],
    });
    setRunState((prev) => ({
      ...defaultRunState,
      isRunning: true,
      locationStatus: prev.locationStatus === 'success' ? 'success' : 'loading',
    }));
  }, [routeState.selectedRouteId]);

  const setLocationStatus = useCallback((
    status: LocationStatus,
    coords?: { latitude: number; longitude: number },
  ) => {
    setRunState((prev) => ({
      ...prev,
      locationStatus: status,
      currentLatitude: coords?.latitude ?? prev.currentLatitude,
      currentLongitude: coords?.longitude ?? prev.currentLongitude,
    }));
  }, []);

  const updateRunMetrics = useCallback((values: Partial<Pick<RunState, 'duration' | 'distance' | 'pace'>>) => {
    setRunState((prev) => ({
      ...prev,
      ...values,
      pace:
        values.pace ??
        formatPace(values.distance ?? prev.distance, values.duration ?? prev.duration),
    }));
  }, []);

  const triggerLandmarkDiscovery = useCallback(() => {
    setRunState((prev) => ({
      ...prev,
      landmarkTriggered: true,
      discoveryOverlayOpen: true,
    }));
  }, []);

  const expandHistoricalCard = useCallback(() => {
    setRunState((prev) => ({
      ...prev,
      landmarkTriggered: true,
      discoveryOverlayOpen: true,
      expandedHistoricalCardOpen: true,
    }));
  }, []);

  const closeDiscovery = useCallback(() => {
    setRunState((prev) => ({
      ...prev,
      discoveryOverlayOpen: false,
      expandedHistoricalCardOpen: false,
    }));
  }, []);

  const completeRun = useCallback(() => {
    const historyItem: RunHistoryItem = {
      id: `run-${Date.now()}`,
      routeId: routeState.selectedRouteId,
      routeName: routeState.selectedRouteName,
      routeType: routeState.selectedRouteType,
      duration: runState.duration,
      distance: Number(runState.distance.toFixed(2)),
      pace: runState.pace,
      completedAt: new Date().toISOString(),
      landmarkTriggered: runState.landmarkTriggered,
    };

    setRunHistory((prev) => [historyItem, ...prev]);
    setRunState((prev) => ({
      ...prev,
      isRunning: false,
      runCompleted: true,
    }));
    return historyItem;
  }, [routeState.selectedRouteId, routeState.selectedRouteName, routeState.selectedRouteType, runState.distance, runState.duration, runState.landmarkTriggered, runState.pace]);

  const saveHistoricalReward = useCallback(() => {
    const rewardTemplate = historicalRewards[routeState.selectedRouteId] ?? defaultHistoricalReward;
    const existingReward = treasureRewards.find(
      (item) => item.sourceRouteId === rewardTemplate.sourceRouteId,
    );

    if (existingReward) {
      setRewardState({
        rewardType: rewardTemplate.rewardType,
        rewardName: rewardTemplate.rewardName,
        rewardImage: rewardTemplate.rewardImage,
        sourceRouteId: rewardTemplate.sourceRouteId,
      });
      return existingReward;
    }

    const rewardItem: TreasureRewardItem = {
      id: `reward-${Date.now()}`,
      rewardType: rewardTemplate.rewardType,
      rewardName: rewardTemplate.rewardName,
      rewardImage: rewardTemplate.rewardImage,
      sourceRouteId: rewardTemplate.sourceRouteId,
      sourceRouteName: rewardTemplate.sourceRouteName,
      earnedAt: new Date().toISOString(),
    };

    setRewardState({
      rewardType: rewardItem.rewardType,
      rewardName: rewardItem.rewardName,
      rewardImage: rewardItem.rewardImage,
      sourceRouteId: rewardItem.sourceRouteId,
    });
    setTreasureRewards((prev) =>
      prev.some((item) => item.sourceRouteId === rewardItem.sourceRouteId)
        ? prev
        : [rewardItem, ...prev],
    );
    return rewardItem;
  }, [routeState.selectedRouteId, treasureRewards]);

  const collectRouteFragment = useCallback((routeId: string, checkpointId: string) => {
    const reward = getRouteFragmentReward(routeId);
    if (!reward || !reward.checkpoints.some((checkpoint) => checkpoint.id === checkpointId)) {
      return;
    }

    setCurrentRunFragments((prev) => {
      if (prev?.routeId === routeId && prev.collectedFragmentIds.includes(checkpointId)) {
        return prev;
      }

      const collectedFragmentIds =
        prev?.routeId === routeId ? [...prev.collectedFragmentIds, checkpointId] : [checkpointId];

      return {
        routeId,
        collectedFragmentIds,
      };
    });

    setRouteFragmentProgress((prev) => {
      const existing = prev[routeId];
      const collected = new Set(existing?.collectedFragmentIds ?? []);
      collected.add(checkpointId);
      const collectedFragmentIds = Array.from(collected);

      return {
        ...prev,
        [routeId]: {
          collectedFragmentIds,
          completed: collectedFragmentIds.length >= reward.requiredFragmentCount,
          rewardClaimed: existing?.rewardClaimed ?? false,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const getRouteFragmentSnapshot = useCallback(
    (routeId: string) =>
      createFragmentSnapshot(routeId, routeFragmentProgress, currentRunFragments),
    [currentRunFragments, routeFragmentProgress],
  );

  const claimRouteFragmentReward = useCallback((routeId: string) => {
    const reward = getRouteFragmentReward(routeId);
    const existingProgress = routeFragmentProgress[routeId];

    if (!reward || !existingProgress?.completed) {
      return createFragmentSnapshot(routeId, routeFragmentProgress, currentRunFragments);
    }

    if (existingProgress.rewardClaimed) {
      return createFragmentSnapshot(routeId, routeFragmentProgress, currentRunFragments);
    }

    const nextProgress = {
      ...routeFragmentProgress,
      [routeId]: {
        ...existingProgress,
        completed: true,
        rewardClaimed: true,
        updatedAt: new Date().toISOString(),
      },
    };

    setRouteFragmentProgress(nextProgress);

    if (reward.rewardType === 'treasure') {
      const rewardTemplate = historicalRewards[routeId];
      const rewardItem: TreasureRewardItem = {
        id: `reward-${Date.now()}`,
        rewardType: 'treasure',
        rewardName: rewardTemplate?.rewardName ?? reward.rewardName,
        rewardImage: rewardTemplate?.rewardImage ?? `/${reward.rewardId}.png`,
        sourceRouteId: routeId,
        sourceRouteName: rewardTemplate?.sourceRouteName ?? routeState.selectedRouteName,
        earnedAt: new Date().toISOString(),
      };
      const existingReward = treasureRewards.find((item) => item.sourceRouteId === routeId);

      setRewardState({
        rewardType: rewardItem.rewardType,
        rewardName: rewardItem.rewardName,
        rewardImage: rewardItem.rewardImage,
        sourceRouteId: rewardItem.sourceRouteId,
      });

      if (!existingReward) {
        setTreasureRewards((prev) =>
          prev.some((item) => item.sourceRouteId === routeId) ? prev : [rewardItem, ...prev],
        );
      }
    }

    return createFragmentSnapshot(routeId, nextProgress, currentRunFragments, true);
  }, [
    currentRunFragments,
    routeFragmentProgress,
    routeState.selectedRouteName,
    treasureRewards,
  ]);

  const resetRunState = useCallback(() => {
    setRunState(defaultRunState);
  }, []);

  const value = useMemo<DemoContextType>(
    () => ({
      userState,
      routeState,
      runState,
      rewardState,
      selectedRoute,
      selectedCompanion: userState.selectedCompanion,
      runHistory,
      treasureRewards,
      currentRunFragments,
      routeFragmentProgress,
      routes,
      companions,
      setUserProfile,
      updateCurrentCompanion,
      markOnboardingSeen,
      setPreferredRouteType,
      signOut,
      selectRoute,
      startRun,
      setLocationStatus,
      updateRunMetrics,
      triggerLandmarkDiscovery,
      expandHistoricalCard,
      closeDiscovery,
      completeRun,
      saveHistoricalReward,
      collectRouteFragment,
      claimRouteFragmentReward,
      getRouteFragmentSnapshot,
      resetRunState,
    }),
    [
      rewardState,
      routeState,
      runHistory,
      runState,
      selectedRoute,
      signOut,
      treasureRewards,
      currentRunFragments,
      routeFragmentProgress,
      userState,
      collectRouteFragment,
      claimRouteFragmentReward,
      getRouteFragmentSnapshot,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
