import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  ChevronRight,
  Compass,
  MapPin,
  Navigation,
  Pause,
  PauseCircle,
  Play,
  Square,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import RouteMap from '../components/RouteMap';
import { useDemo } from '../context/DemoContext';
import { petAssets } from '../data/assets';
import { GeoPoint, resolveCulturalRoute } from '../domain/routes';
import { createAmapNavigationUrl } from '../lib/navigationLinks';
import { getPetEmotionAsset } from '../lib/petEmotionAssets';
import { getFragmentPointsForRoute, RouteCheckpoint } from '../lib/routeFragments';
import { RunMood } from '../lib/userProgressService';
import { useProximityTriggerEngine } from '../services/proximityEngine';
import { useRunMoodMusic } from '../services/useRunMoodMusic';
import { useRunVoiceCompanion } from '../services/useRunVoiceCompanion';
import { useLocationService } from '../services/useLocationService';

const MAP_DELTA: GeoPoint = {
  latitude: 0.02,
  longitude: 0.028,
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const haversineDistanceKm = (start: GeoPoint, end: GeoPoint) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDiff = toRadians(end.latitude - start.latitude);
  const lonDiff = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);
  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const parseCoordinate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

type PetRunScene = 'navigation' | 'active' | 'landmark' | 'fragment' | 'complete' | 'fallback';

const getPetRunCopy = (
  petKey: 'dog' | 'cat' | 'rabbit',
  petName: string,
  scene: PetRunScene,
  targetName: string,
) => {
  const copy = {
    rabbit: {
      navigation: `${petName} is hopping with you to ${targetName}.`,
      active: "You're doing great! Tiny steps, big journey.",
      landmark: 'A little memory is nearby!',
      fragment: 'Yay! A memory piece is ours!',
      complete: 'We did it! A new memory is blooming.',
      fallback: `${petName} is keeping the route warm until live GPS returns.`,
    },
    cat: {
      navigation: `${petName} is guiding you to ${targetName}.`,
      active: 'Steady pace. I shall guide you from here.',
      landmark: 'A landmark is close. Let us notice it.',
      fragment: 'A memory fragment has been collected.',
      complete: 'Route complete. A fine memory has been saved.',
      fallback: `${petName} is using the route anchor until live GPS returns.`,
    },
    dog: {
      navigation: `${petName} is running with you to ${targetName}.`,
      active: "Nice pace! I'm right here with you.",
      landmark: "Checkpoint ahead! Let's collect it!",
      fragment: 'Nice! We got another memory piece!',
      complete: 'Awesome run! We made it!',
      fallback: `${petName} is keeping watch until live GPS returns.`,
    },
  };

  return copy[petKey][scene];
};

const moodOptions: Array<{ mood: RunMood; label: string }> = [
  { mood: 'happy', label: 'Happy' },
  { mood: 'calm', label: 'Calm' },
  { mood: 'sad', label: 'Sad' },
  { mood: 'none', label: 'No music' },
];

const Tracker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    routeState,
    selectedRoute,
    runState,
    selectedCompanion,
    startRun,
    setLocationStatus,
    updateRunMetrics,
    triggerLandmarkDiscovery,
    expandHistoricalCard,
    closeDiscovery,
    completeRun,
    collectRouteFragment,
    getRouteFragmentSnapshot,
    currentRunFragments,
    routeFragmentProgress,
    resetRunState,
  } = useDemo();

  const route = location.state?.route || selectedRoute || {
    id: routeState.selectedRouteId || 'h1',
    type: routeState.selectedRouteType || 'Historical',
    title: routeState.selectedRouteName || 'Pingjiang Heritage Trail',
  };
  const activeRoute = resolveCulturalRoute(route);
  const searchParams = new URLSearchParams(location.search);
  const controlledLatitude = parseCoordinate(searchParams.get('lat'));
  const controlledLongitude = parseCoordinate(searchParams.get('lng'));
  const controlledLandmarkId = searchParams.get('testLandmark');
  const controlledLandmark = controlledLandmarkId
    ? activeRoute.landmarks.find((landmark) => landmark.id === controlledLandmarkId)
    : null;
  const controlledCoords =
    controlledLatitude !== null && controlledLongitude !== null
      ? {
          latitude: controlledLatitude,
          longitude: controlledLongitude,
        }
      : controlledLandmark
        ? {
            latitude: controlledLandmark.lat,
            longitude: controlledLandmark.lng,
          }
        : null;
  const routeStartCoords = useMemo(
    () => ({
      latitude: activeRoute.startPoint.latitude,
      longitude: activeRoute.startPoint.longitude,
    }),
    [activeRoute.startPoint.latitude, activeRoute.startPoint.longitude],
  );
  const {
    permissionState,
    locationStatus,
    currentCoords,
    lastKnownCoords,
    source: locationSource,
    isRecoveringGps,
    errorMessage,
    diagnostics,
    retryLocation,
  } = useLocationService({
    fallbackCoords: routeStartCoords,
    controlledCoords,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [fragmentToast, setFragmentToast] = useState<RouteCheckpoint | null>(null);
  const [petVoiceToast, setPetVoiceToast] = useState<string | null>(null);
  const [moodSetupOpen, setMoodSetupOpen] = useState(true);
  const petKey = selectedCompanion?.assetKey ?? 'dog';
  const petName = selectedCompanion?.name ?? 'Aqua Pup';
  const previousPauseStateRef = useRef(false);
  const lastPointRef = useRef<GeoPoint | null>(null);
  const discoveryTimerRef = useRef<number | null>(null);
  const fragmentToastTimerRef = useRef<number | null>(null);
  const petVoiceToastTimerRef = useRef<number | null>(null);
  const collectedFragmentIdsRef = useRef<Set<string>>(new Set());
  const shownLandmarkPopupIdsRef = useRef<Set<string>>(new Set());
  const dismissedLandmarkPopupIdsRef = useRef<Set<string>>(new Set());
  const voiceNarrationActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const musicEnabledRef = useRef(false);
  const preferredMoodRef = useRef<RunMood>('none');
  const isAudioPlayingRef = useRef(false);
  const distanceRef = useRef(runState.distance);
  const durationRef = useRef(runState.duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    voiceEnabled,
    setVoiceEnabled,
    speak,
    speakEncouragement,
    stopVoice,
  } = useRunVoiceCompanion(selectedCompanion?.id ?? petKey);
  const {
    musicEnabled,
    preferredMood,
    saveRunCompanionMood,
    playMoodMusic,
    pauseMoodMusic,
    stopMoodMusic,
    fadeOutMusic,
    fadeInMusic,
  } = useRunMoodMusic();
  const [selectedMood, setSelectedMood] = useState<RunMood>(preferredMood);
  const amapNavigationUrl = useMemo(
    () => createAmapNavigationUrl(activeRoute.startPoint),
    [activeRoute.startPoint],
  );
  const isLocalDemoHost =
    diagnostics.hostname === 'localhost' ||
    diagnostics.hostname === '127.0.0.1' ||
    diagnostics.hostname === '';
  const canUseRouteStartFallback =
    locationSource === 'fallback' &&
    isLocalDemoHost &&
    permissionState !== 'denied' &&
    (locationStatus === 'watching' ||
      locationStatus === 'requesting' ||
      locationStatus === 'timeout' ||
      locationStatus === 'unavailable' ||
      locationStatus === 'error');
  const effectiveLocationSource = canUseRouteStartFallback ? 'controlled' : locationSource;
  const distanceToStartMeters = useMemo(
    () =>
      Math.round(
        haversineDistanceKm(currentCoords, {
          latitude: activeRoute.startPoint.latitude,
          longitude: activeRoute.startPoint.longitude,
        }) * 1000,
      ),
    [
      activeRoute.startPoint.latitude,
      activeRoute.startPoint.longitude,
      currentCoords.latitude,
      currentCoords.longitude,
    ],
  );
  const routeActivated =
    effectiveLocationSource !== 'fallback' &&
    distanceToStartMeters <= activeRoute.startActivationRadius;
  const proximity = useProximityTriggerEngine({
    coords: currentCoords,
    route: activeRoute,
    source: effectiveLocationSource,
    enabled: sessionStarted && routeActivated && !isPaused,
  });
  const activeLandmark =
    proximity.activeLandmark && proximity.activeLandmark.routeId === activeRoute.id
      ? proximity.activeLandmark
      : null;
  const routeMatchedActiveLandmarkId = activeLandmark?.id ?? null;
  const fragmentPoints = useMemo(() => getFragmentPointsForRoute(activeRoute.id), [activeRoute.id]);
  const fragmentProgress = routeFragmentProgress[activeRoute.id];
  const collectedFragmentIds = fragmentProgress?.collectedFragmentIds ?? [];
  const requiredFragmentCount = fragmentPoints.length;
  const currentRunFragmentCount =
    currentRunFragments?.routeId === activeRoute.id
      ? currentRunFragments.collectedFragmentIds.length
      : 0;
  const loadingHeadImage = selectedCompanion?.headImage ?? petAssets.dog.head;
  const isLocationPending =
    locationStatus === 'checking-permission' ||
    locationStatus === 'requesting' ||
    locationStatus === 'watching';
  const isLocationFailure =
    !isLocationPending &&
    locationSource === 'fallback' &&
    !canUseRouteStartFallback &&
    locationStatus !== 'idle' &&
    locationStatus !== 'success';
  const canRestoreMusic = useCallback(
    () =>
      sessionStartedRef.current &&
      !isPausedRef.current &&
      !voiceNarrationActiveRef.current &&
      !isAudioPlayingRef.current &&
      musicEnabledRef.current &&
      preferredMoodRef.current !== 'none',
    [],
  );
  const speakWithMusic = useCallback(
    (
      message: string,
      type: Parameters<typeof speak>[1],
      options: Parameters<typeof speak>[2] = {},
    ) =>
      speak(message, type, {
        ...options,
        onStart: () => {
          voiceNarrationActiveRef.current = true;
          fadeOutMusic(800);
          options?.onStart?.();
        },
        onEnd: () => {
          voiceNarrationActiveRef.current = false;
          options?.onEnd?.();
          if (canRestoreMusic()) {
            fadeInMusic(1200);
          }
        },
      }),
    [canRestoreMusic, fadeInMusic, fadeOutMusic, speak],
  );
  const petBubbleText = useMemo(() => {
    if (effectiveLocationSource === 'gps') {
      return routeActivated
        ? getPetRunCopy(petKey, petName, 'active', activeRoute.title)
        : getPetRunCopy(petKey, petName, 'navigation', activeRoute.startPoint.name);
    }

    if (effectiveLocationSource === 'controlled') {
      return routeActivated
        ? getPetRunCopy(petKey, petName, 'active', activeRoute.title)
        : `Controlled location is outside the route start radius. ${getPetRunCopy(
            petKey,
            petName,
            'navigation',
            activeRoute.startPoint.name,
          )}`;
    }

    return getPetRunCopy(petKey, petName, 'fallback', activeRoute.startPoint.name);
  }, [
    activeRoute.startPoint.name,
    activeRoute.title,
    effectiveLocationSource,
    petKey,
    petName,
    routeActivated,
  ]);

  useEffect(() => {
    setSelectedMood(preferredMood);
  }, [preferredMood]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    sessionStartedRef.current = sessionStarted;
  }, [sessionStarted]);

  useEffect(() => {
    musicEnabledRef.current = musicEnabled;
    preferredMoodRef.current = preferredMood;
  }, [musicEnabled, preferredMood]);

  useEffect(() => {
    isAudioPlayingRef.current = isAudioPlaying;
  }, [isAudioPlaying]);

  useEffect(() => {
    if (!controlledLandmarkId || controlledLandmark) {
      return;
    }

    console.warn('[landmark-route-guard] blocked mismatched controlled landmark', {
      activeRouteId: activeRoute.id,
      activeRouteName: activeRoute.title,
      controlledLandmarkId,
      routeMatched: false,
    });
  }, [activeRoute.id, activeRoute.title, controlledLandmark, controlledLandmarkId]);

  useEffect(() => {
    if (discoveryTimerRef.current !== null) {
      window.clearTimeout(discoveryTimerRef.current);
      discoveryTimerRef.current = null;
    }
    if (fragmentToastTimerRef.current !== null) {
      window.clearTimeout(fragmentToastTimerRef.current);
      fragmentToastTimerRef.current = null;
    }
    if (petVoiceToastTimerRef.current !== null) {
      window.clearTimeout(petVoiceToastTimerRef.current);
      petVoiceToastTimerRef.current = null;
    }

    setSessionStarted(false);
    setIsPaused(false);
    setFragmentToast(null);
    setActiveImageIndex(0);
    setIsAudioPlaying(false);
    isAudioPlayingRef.current = false;
    collectedFragmentIdsRef.current = new Set();
    shownLandmarkPopupIdsRef.current = new Set();
    dismissedLandmarkPopupIdsRef.current = new Set();
    lastPointRef.current = null;
    previousPauseStateRef.current = false;
    voiceNarrationActiveRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    closeDiscovery();
    resetRunState();
    stopVoice();
    stopMoodMusic();
  }, [activeRoute.id, closeDiscovery, resetRunState, stopMoodMusic, stopVoice]);

  useEffect(() => {
    if (!runState.discoveryOverlayOpen) {
      return;
    }

    if (activeLandmark) {
      return;
    }

    console.warn('[landmark-route-guard] closed stale landmark popup without active route landmark', {
      activeRouteId: activeRoute.id,
      activeRouteName: activeRoute.title,
      popupOpen: runState.discoveryOverlayOpen,
      candidateLandmarkId: proximity.activeLandmarkId,
      candidateLandmarkRouteId: proximity.activeLandmark?.routeId ?? null,
      routeMatched: false,
    });

    closeDiscovery();
  }, [
    activeLandmark,
    activeRoute.id,
    activeRoute.title,
    closeDiscovery,
    proximity.activeLandmark,
    proximity.activeLandmarkId,
    runState.discoveryOverlayOpen,
  ]);

  useEffect(() => {
    if (sessionStarted || effectiveLocationSource === 'fallback') {
      return;
    }

    if (routeActivated) {
      speakWithMusic('The route start is close. You can begin when you are ready.', 'navigation');
      return;
    }

    speakWithMusic(
      getPetRunCopy(petKey, petName, 'navigation', activeRoute.startPoint.name),
      'navigation',
    );
  }, [
    activeRoute.startPoint.name,
    effectiveLocationSource,
    petKey,
    petName,
    routeActivated,
    sessionStarted,
    speakWithMusic,
  ]);

  useEffect(() => {
    if (!sessionStarted) {
      previousPauseStateRef.current = isPaused;
      return;
    }

    if (!previousPauseStateRef.current && isPaused) {
      pauseMoodMusic();
      speakWithMusic('Paused. Take a breath. I will stay with you.', 'pause', { immediate: true });
    }

    if (previousPauseStateRef.current && !isPaused) {
      playMoodMusic(preferredMood);
      speakWithMusic("Let's continue. Nice and easy.", 'resume', { immediate: true });
    }

    previousPauseStateRef.current = isPaused;
  }, [isPaused, pauseMoodMusic, playMoodMusic, preferredMood, sessionStarted, speakWithMusic]);

  useEffect(() => {
    distanceRef.current = runState.distance;
    durationRef.current = runState.duration;
  }, [runState.distance, runState.duration]);

  useEffect(() => {
    collectedFragmentIdsRef.current = new Set(collectedFragmentIds);
  }, [collectedFragmentIds]);

  useEffect(() => {
    const contextStatus =
      locationStatus === 'success'
        ? 'success'
        : locationStatus === 'controlled'
          ? 'success'
        : canUseRouteStartFallback
          ? 'success'
        : permissionState === 'denied'
          ? 'denied'
          : isLocationPending
            ? 'loading'
            : 'error';

    setLocationStatus(contextStatus, currentCoords);
  }, [canUseRouteStartFallback, currentCoords, isLocationPending, locationStatus, setLocationStatus]);

  useEffect(() => {
    if (!sessionStarted || effectiveLocationSource !== 'gps') {
      lastPointRef.current = null;
      return;
    }

    if (!isPausedRef.current && lastPointRef.current) {
      const segmentDistance = haversineDistanceKm(lastPointRef.current, currentCoords);
      const nextDistance =
        segmentDistance > 0.0015 ? distanceRef.current + segmentDistance : distanceRef.current;
      updateRunMetrics({ distance: nextDistance });
    }

    lastPointRef.current = currentCoords;
  }, [currentCoords, effectiveLocationSource, sessionStarted, updateRunMetrics]);

  useEffect(() => {
    if (!sessionStarted || isPaused || effectiveLocationSource === 'fallback') {
      return;
    }

    const intervalId = window.setInterval(() => {
      updateRunMetrics({ duration: durationRef.current + 1 });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [effectiveLocationSource, isPaused, sessionStarted, updateRunMetrics]);

  useEffect(() => {
    if (!routeMatchedActiveLandmarkId || !activeLandmark) {
      return;
    }

    if (
      shownLandmarkPopupIdsRef.current.has(activeLandmark.id) ||
      dismissedLandmarkPopupIdsRef.current.has(activeLandmark.id)
    ) {
      return;
    }

    const closestDistanceMeters = proximity.closestLandmark
      ? Math.round(proximity.closestLandmark.distanceMeters)
      : null;

    console.info('[landmark-trigger-debug]', {
      activeRouteId: activeRoute.id,
      activeRouteName: activeRoute.title,
      candidateLandmarkId: activeLandmark.id,
      candidateLandmarkTitle: activeLandmark.title,
      candidateLandmarkRouteId: activeLandmark.routeId,
      routeMatched: activeLandmark.routeId === activeRoute.id,
      triggerSource: effectiveLocationSource,
      currentCoords,
      distanceMeters: closestDistanceMeters,
      triggerRadius: activeLandmark.triggerRadius,
      popupOpen: runState.discoveryOverlayOpen,
    });

    setActiveImageIndex(0);
    shownLandmarkPopupIdsRef.current.add(activeLandmark.id);
    fadeOutMusic(800);
    triggerLandmarkDiscovery();
    speakWithMusic(getPetRunCopy(petKey, petName, 'landmark', activeRoute.title), 'landmarkNearby', {
      immediate: true,
    });
    if (discoveryTimerRef.current !== null) {
      window.clearTimeout(discoveryTimerRef.current);
    }
    discoveryTimerRef.current = window.setTimeout(() => {
      expandHistoricalCard();
    }, 1200);
  }, [
    activeLandmark,
    activeRoute.id,
    activeRoute.title,
    currentCoords,
    effectiveLocationSource,
    expandHistoricalCard,
    fadeOutMusic,
    petKey,
    petName,
    proximity.closestLandmark,
    routeMatchedActiveLandmarkId,
    runState.discoveryOverlayOpen,
    speakWithMusic,
    triggerLandmarkDiscovery,
  ]);

  useEffect(() => {
    if (!sessionStarted || !routeActivated) {
      return;
    }

    const nextCheckpoint = fragmentPoints.find((checkpoint) => {
      if (collectedFragmentIdsRef.current.has(checkpoint.id)) {
        return false;
      }

      const distanceMeters =
        haversineDistanceKm(currentCoords, {
          latitude: checkpoint.lat,
          longitude: checkpoint.lng,
        }) * 1000;

      return distanceMeters <= checkpoint.triggerRadius;
    });

    if (!nextCheckpoint) {
      return;
    }

    collectedFragmentIdsRef.current.add(nextCheckpoint.id);
    collectRouteFragment(activeRoute.id, nextCheckpoint.id);
    setFragmentToast(nextCheckpoint);
    speakWithMusic(getPetRunCopy(petKey, petName, 'fragment', nextCheckpoint.label), 'fragmentCollected', {
      immediate: true,
    });

    if (fragmentToastTimerRef.current !== null) {
      window.clearTimeout(fragmentToastTimerRef.current);
    }
    fragmentToastTimerRef.current = window.setTimeout(() => {
      setFragmentToast(null);
    }, 2400);
  }, [
    activeRoute.id,
    collectRouteFragment,
    currentCoords,
    fragmentPoints,
    petKey,
    petName,
    routeActivated,
    sessionStarted,
    speakWithMusic,
  ]);

  useEffect(() => {
    if (!sessionStarted || isPaused || !routeActivated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      speakEncouragement({
        onStart: () => fadeOutMusic(800),
        onEnd: () => {
          if (canRestoreMusic()) {
            fadeInMusic(1200);
          }
        },
      });
    }, 95_000);

    return () => window.clearInterval(intervalId);
  }, [canRestoreMusic, fadeInMusic, fadeOutMusic, isPaused, routeActivated, sessionStarted, speakEncouragement]);

  useEffect(() => {
    setActiveImageIndex(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
    isAudioPlayingRef.current = false;
  }, [activeLandmark?.id]);

  useEffect(() => {
    const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (!isDev) {
      return;
    }

    console.info('[location-route-debug]', {
      locationStatus,
      permissionState,
      source: locationSource,
      effectiveSource: effectiveLocationSource,
      canUseRouteStartFallback,
      controlledLandmarkId,
      isRecoveringGps,
      currentCoords,
      lastKnownCoords,
      routeCenter: activeRoute.center,
      routeStart: activeRoute.startPoint,
      activeRouteId: activeRoute.id,
      activeRouteTitle: activeRoute.title,
      distanceToStartMeters,
      routeActivated,
      closestLandmark: proximity.closestLandmark
        ? {
            id: proximity.closestLandmark.landmark.id,
            routeId: proximity.closestLandmark.landmark.routeId,
            distanceMeters: Math.round(proximity.closestLandmark.distanceMeters),
          }
        : null,
      activeLandmarkId: routeMatchedActiveLandmarkId,
      activeLandmarkRouteId: activeLandmark?.routeId ?? null,
      routeMatchedActiveLandmark: activeLandmark ? activeLandmark.routeId === activeRoute.id : false,
      triggeredLandmarkIds: proximity.triggeredLandmarkIds,
      fragments: {
        collected: collectedFragmentIds,
        required: requiredFragmentCount,
        currentRunCount: currentRunFragmentCount,
      },
      diagnostics,
      popupOpen: runState.discoveryOverlayOpen,
      errorMessage,
    });
  }, [
    activeRoute.center,
    activeRoute.id,
    activeRoute.startPoint,
    activeRoute.title,
    currentCoords,
    canUseRouteStartFallback,
    distanceToStartMeters,
    effectiveLocationSource,
    errorMessage,
    lastKnownCoords,
    locationSource,
    locationStatus,
    permissionState,
    isRecoveringGps,
    controlledLandmarkId,
    collectedFragmentIds,
    currentRunFragmentCount,
    diagnostics,
    requiredFragmentCount,
    activeLandmark,
    proximity.closestLandmark,
    proximity.triggeredLandmarkIds,
    routeMatchedActiveLandmarkId,
    routeActivated,
    runState.discoveryOverlayOpen,
  ]);

  useEffect(() => {
    return () => {
      if (discoveryTimerRef.current !== null) {
        window.clearTimeout(discoveryTimerRef.current);
      }
      if (fragmentToastTimerRef.current !== null) {
        window.clearTimeout(fragmentToastTimerRef.current);
      }
      if (petVoiceToastTimerRef.current !== null) {
        window.clearTimeout(petVoiceToastTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopVoice();
      stopMoodMusic();
    };
  }, [stopMoodMusic, stopVoice]);

  const handleBeginRun = () => {
    if (!routeActivated) {
      return;
    }
    startRun();
    setSessionStarted(true);
    setIsPaused(false);
    playMoodMusic(preferredMood);
    speakWithMusic("Let's begin. I'll stay with you on this route.", 'start', { immediate: true });
  };

  const handleStop = () => {
    if (!sessionStarted) {
      return;
    }
    fadeOutMusic(700);
    speakWithMusic(getPetRunCopy(petKey, petName, 'complete', activeRoute.title), 'routeCompleted', {
      immediate: true,
    });
    const summary = completeRun();
    const fragmentSnapshot = getRouteFragmentSnapshot(activeRoute.id);
    window.setTimeout(() => {
      stopVoice();
      stopMoodMusic();
      navigate('/completion-summary', {
        state: {
          time: formatTime(summary.duration),
          distance: summary.distance.toFixed(2),
          pace: summary.pace,
          checkpoints: summary.landmarkTriggered ? 1 : 0,
          routeName: summary.routeName,
          routeType: summary.routeType,
          routeId: summary.routeId,
          runId: summary.id,
          completedAt: summary.completedAt,
          fragmentSnapshot,
        },
      });
    }, 700);
  };

  const handlePetVoiceToggle = () => {
    const nextVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(nextVoiceEnabled);
    setPetVoiceToast(nextVoiceEnabled ? 'Voice on' : 'Voice off');
    if (!nextVoiceEnabled) {
      voiceNarrationActiveRef.current = false;
    }
    if (!nextVoiceEnabled && canRestoreMusic()) {
      fadeInMusic(800);
    }

    if (petVoiceToastTimerRef.current !== null) {
      window.clearTimeout(petVoiceToastTimerRef.current);
    }

    petVoiceToastTimerRef.current = window.setTimeout(() => {
      setPetVoiceToast(null);
      petVoiceToastTimerRef.current = null;
    }, 1800);
  };

  const handleCloseDiscovery = () => {
    if (activeLandmark) {
      dismissedLandmarkPopupIdsRef.current.add(activeLandmark.id);
    }
    closeDiscovery();
    if (canRestoreMusic()) {
      fadeInMusic(1200);
    }
  };

  const restoreMusicAfterManualAudio = useCallback(
    (durationMs = 1200) => {
      if (
        sessionStartedRef.current &&
        !isPausedRef.current &&
        !voiceNarrationActiveRef.current &&
        musicEnabledRef.current &&
        preferredMoodRef.current !== 'none'
      ) {
        fadeInMusic(durationMs);
      }
    },
    [fadeInMusic],
  );

  const handleSaveMood = () => {
    saveRunCompanionMood(selectedMood, selectedMood !== 'none');
    setMoodSetupOpen(false);
  };

  const handleGalleryDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } },
  ) => {
    if (!activeLandmark || activeLandmark.gallery.length <= 1) {
      return;
    }

    if (info.offset.x < -40 && activeImageIndex < activeLandmark.gallery.length - 1) {
      setActiveImageIndex((prev) => prev + 1);
      return;
    }

    if (info.offset.x > 40 && activeImageIndex > 0) {
      setActiveImageIndex((prev) => prev - 1);
    }
  };

  const handleAudioToggle = () => {
    if (!activeLandmark?.audio) {
      if (activeLandmark?.audioText && 'speechSynthesis' in window) {
        fadeOutMusic(700);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(activeLandmark.audioText));
      }
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio(activeLandmark.audio);
      audioRef.current = audio;
      audio.addEventListener('ended', () => {
        setIsAudioPlaying(false);
        isAudioPlayingRef.current = false;
        audio.currentTime = 0;
        restoreMusicAfterManualAudio();
      });
    }

    const audio = audioRef.current;

    if (audio.src !== new URL(activeLandmark.audio, window.location.origin).toString()) {
      audio.pause();
      audio.src = activeLandmark.audio;
      audio.currentTime = 0;
    }

    if (isAudioPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsAudioPlaying(false);
      isAudioPlayingRef.current = false;
      restoreMusicAfterManualAudio(800);
      return;
    }

    fadeOutMusic(700);
    audio
      .play()
      .then(() => {
        setIsAudioPlaying(true);
        isAudioPlayingRef.current = true;
      })
      .catch(() => {
        setIsAudioPlaying(false);
        isAudioPlayingRef.current = false;
      });
  };

  const readableDistanceToStart =
    distanceToStartMeters >= 1000
      ? `${(distanceToStartMeters / 1000).toFixed(2)} km`
      : `${distanceToStartMeters} m`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-full max-w-md mx-auto bg-[#FDFBF7] relative overflow-hidden flex flex-col items-center"
    >
      <div className="absolute inset-0 z-0">
        <RouteMap
          route={activeRoute}
          currentCoords={currentCoords}
          source={effectiveLocationSource}
          activeLandmark={activeLandmark}
          mapDelta={MAP_DELTA}
        />

      </div>

      <div className="w-full h-full px-5 pt-11 pb-5 flex flex-col relative z-10 pointer-events-none">
        <header className="w-full flex flex-col items-center gap-3 pointer-events-auto">
          <div className="bg-white/90 rounded-[28px] p-4 grid grid-cols-3 gap-2 shadow-2xl border border-white/80 w-full backdrop-blur-xl">
            <div className="text-center group">
              <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.18em] mb-1 opacity-70 group-hover:text-brand-dark transition-colors">
                Distance
              </div>
              <div className="text-2xl font-display font-bold text-text-main leading-tight">
                {runState.distance.toFixed(2)}
                <span className="text-[10px] ml-0.5 opacity-60">km</span>
              </div>
            </div>
            <div className="hidden" />
            <div className="text-center group">
              <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.18em] mb-1 opacity-70 group-hover:text-brand-dark transition-colors">
                Time
              </div>
              <div className="text-2xl font-display font-bold text-text-main leading-tight tracking-tight">
                {formatTime(runState.duration)}
              </div>
            </div>
            <div className="hidden" />
            <div className="text-center group">
              <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.18em] mb-1 opacity-70 group-hover:text-brand-dark transition-colors">
                Pace
              </div>
              <div className="text-2xl font-display font-bold text-text-main leading-tight">
                {runState.pace}
              </div>
            </div>
          </div>

          {!sessionStarted && (
            <div className="bg-white/95 rounded-[28px] px-4 py-4 shadow-xl border border-white/80 w-full backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.24em] mb-1">
                    Route start
                  </div>
                  <div className="text-base font-display font-bold text-text-main truncate">
                    {activeRoute.startPoint.name}
                  </div>
                  <p className="mt-1 text-xs font-bold text-text-muted">
                    {routeActivated
                      ? 'Route ready. Landmark triggers will start after you begin.'
                      : locationSource === 'fallback' && !canUseRouteStartFallback
                        ? 'Waiting for live GPS before route activation'
                      : `${readableDistanceToStart} away from start`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                    routeActivated ? 'bg-brand/25 text-text-main' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {routeActivated ? 'Ready' : 'Go to start'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <a
                  href={amapNavigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-text-main px-3 py-3 text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2"
                >
                  <Navigation size={14} /> Amap
                </a>
                <button
                  onClick={handleBeginRun}
                  disabled={!routeActivated}
                  className="rounded-2xl bg-brand px-3 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:bg-text-muted/20 disabled:text-text-muted"
                >
                  Start route
                </button>
              </div>
            </div>
          )}

          {requiredFragmentCount > 0 && (
            <div className="w-full rounded-[24px] border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-text-muted">
                  Memory pieces
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-main">
                  {collectedFragmentIds.length}/{requiredFragmentCount}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <motion.div
                  animate={{
                    width: `${Math.min(
                      100,
                      (collectedFragmentIds.length / requiredFragmentCount) * 100,
                    )}%`,
                  }}
                  className="h-full rounded-full bg-amber-300"
                />
              </div>
              <p className="mt-2 text-[10px] font-bold text-text-muted">
                {currentRunFragmentCount} collected in this run
              </p>
            </div>
          )}
        </header>

        <div className="flex-1 w-full relative">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[39%] right-0 flex flex-col items-end gap-4 pointer-events-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-[24px] shadow-2xl border border-brand/20 max-w-[230px] relative group hover:scale-105 transition-transform">
              <p className="text-xs font-bold text-text-main leading-relaxed italic opacity-90">
                {fragmentToast
                  ? getPetRunCopy(petKey, petName, 'fragment', fragmentToast.label)
                  : activeLandmark
                    ? getPetRunCopy(petKey, petName, 'landmark', activeLandmark.title)
                    : petBubbleText}
              </p>
              <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white/95 rotate-45 border-r-2 border-b-2 border-brand/20" />
            </div>
            <motion.button
              type="button"
              onClick={handlePetVoiceToggle}
              whileHover={{ scale: 1.04, rotate: 3 }}
              whileTap={{ scale: 0.96 }}
              className="w-20 h-20 rounded-[32px] border-4 border-white p-2 bg-brand shadow-2xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand/30"
              aria-label="Toggle pet voice"
            >
              <img
                src={selectedCompanion?.headImage ?? petAssets.dog.head}
                alt={petName}
                className="w-full h-full object-cover rounded-[22px]"
                referrerPolicy="no-referrer"
              />
            </motion.button>
            <AnimatePresence>
              {petVoiceToast && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className="pointer-events-none rounded-full border border-white/80 bg-white/95 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-main shadow-xl backdrop-blur-xl"
                >
                  {petVoiceToast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="hidden absolute left-0 top-1/2 -translate-y-1/2 flex-col gap-6 pointer-events-auto">
            {[MapPin, Award, Compass, Volume2].map((Icon, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 10, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-white shadow-xl rounded-3xl flex items-center justify-center text-brand-dark border border-brand/10 hover:bg-brand hover:text-white transition-all"
              >
                <Icon size={28} />
              </motion.button>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-center items-end pb-4 pointer-events-auto">
          <div className="bg-white/90 p-4 rounded-[44px] border border-white/80 shadow-2xl flex items-center gap-7 backdrop-blur-xl">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sessionStarted && setIsPaused((prev) => !prev)}
              disabled={!sessionStarted}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-text-main shadow-xl border-4 border-surface disabled:opacity-40"
            >
              {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={sessionStarted ? handleStop : handleBeginRun}
              disabled={!sessionStarted && !routeActivated}
              className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center shadow-[0_30px_60px_rgba(126,232,224,0.4)] border-[10px] border-white relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
              {sessionStarted ? (
                <Square size={34} fill="currentColor" className="relative z-10" />
              ) : (
                <Play size={34} fill="currentColor" className="relative z-10 ml-1" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={retryLocation}
              disabled={isLocationPending || locationSource !== 'fallback'}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-text-main shadow-xl border-4 border-surface disabled:opacity-50"
            >
              <Zap size={32} />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {moodSetupOpen && !sessionStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[68] bg-surface/60 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ y: 24, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.96 }}
              className="w-full max-w-md rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-[20px] bg-brand/15 p-2 shadow-inner">
                  <img
                    src={loadingHeadImage}
                    alt={petName}
                    className="h-full w-full rounded-[14px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-dark">
                    Pet Companion
                  </p>
                  <h3 className="mt-1 text-2xl font-display font-bold text-text-main">
                    Choose Your Running Mood
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMoodSetupOpen(false)}
                  className="h-10 w-10 rounded-full bg-surface text-text-muted flex items-center justify-center"
                  aria-label="Close mood setup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {moodOptions.map((option) => (
                  <button
                    type="button"
                    key={option.mood}
                    onClick={() => setSelectedMood(option.mood)}
                    className={`rounded-[22px] border-2 p-3 text-center transition-all ${
                      selectedMood === option.mood
                        ? 'border-brand bg-brand/15 text-text-main shadow-lg'
                        : 'border-brand/10 bg-surface/70 text-text-main hover:bg-white'
                    }`}
                  >
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/80 shadow-inner">
                      <img
                        src={getPetEmotionAsset(petKey, option.mood)}
                        alt={`${petName} ${option.label}`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-sm font-black">{option.label}</div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveMood}
                className="mt-6 w-full rounded-2xl bg-brand px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl"
              >
                Save Mood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLocationPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-surface/72 backdrop-blur-md flex items-center justify-center px-8"
          >
            <div className="card-rounded bg-white/90 shadow-2xl border border-brand/10 p-10 w-full max-w-md flex flex-col items-center text-center gap-6">
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  rotate: [-5, 5, -5],
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-[32px] bg-brand/10 p-3 shadow-inner"
              >
                <img
                  src={loadingHeadImage}
                  alt="Companion head"
                  className="w-full h-full object-cover rounded-[26px]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              <div className="space-y-2">
                <div className="text-[10px] font-black text-brand-dark uppercase tracking-[0.3em]">
                  GPS Sync
                </div>
                <h3 className="text-2xl font-display font-bold text-text-main">
                  Locating your route...
                </h3>
                <p className="text-sm text-text-muted font-medium leading-relaxed">
                  Requesting live GPS...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLocationFailure && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="absolute left-1/2 top-6 z-[70] w-full max-w-md -translate-x-1/2 px-5"
          >
            <div className="rounded-[30px] bg-white/95 p-5 text-left shadow-2xl border border-amber-100 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    y: [0, -4, 0],
                    rotate: [-3, 3, -3],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-16 w-16 shrink-0 rounded-[24px] bg-amber-50 p-2 shadow-inner"
                >
                  <img
                    src={loadingHeadImage}
                    alt="Companion head"
                    className="h-full w-full rounded-[18px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
                    GPS not connected
                  </p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-text-muted">
                    {errorMessage ?? 'Using the route anchor while live GPS retries.'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold leading-relaxed text-text-muted/80">
                    {diagnostics.attempts.at(-1)
                      ? `${diagnostics.attempts.at(-1)?.kind}: ${
                          diagnostics.attempts.at(-1)?.message ?? diagnostics.attempts.at(-1)?.status
                        }`
                      : `${diagnostics.protocol}//${diagnostics.hostname}`}
                  </p>
                </div>
                <button
                  onClick={retryLocation}
                  className="rounded-full bg-text-main px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white"
                >
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fragmentToast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="pointer-events-none absolute left-1/2 top-[34%] z-[75] w-full max-w-sm -translate-x-1/2 px-5"
          >
            <div className="rounded-[26px] border border-amber-100 bg-white/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Award size={23} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
                    Fragment collected
                  </p>
                  <p className="mt-1 text-sm font-black text-text-main">
                    {fragmentToast.name} memory fragment{' '}
                    {Math.min(
                      collectedFragmentIds.includes(fragmentToast.id)
                        ? collectedFragmentIds.length
                        : collectedFragmentIds.length + 1,
                      requiredFragmentCount,
                    )}
                    /
                    {requiredFragmentCount}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {runState.discoveryOverlayOpen && activeLandmark && activeLandmark.routeId === activeRoute.id && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-5 pointer-events-auto"
          >
            <motion.div
              layout
              className="card-rounded bg-white shadow-[0_30px_60px_rgba(0,0,0,0.2)] border-2 border-brand/20 overflow-hidden flex flex-col"
            >
              {!runState.expandedHistoricalCardOpen ? (
                <div onClick={expandHistoricalCard} className="p-6 flex items-center gap-6 cursor-pointer group">
                  <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-brand rounded-full animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark">
                        Landmark Nearby
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-main group-hover:text-brand-dark transition-colors">
                      {activeLandmark?.title ?? 'Discovery Overlay Ready'}
                    </h3>
                    {activeLandmark?.subtitle && (
                      <p className="mt-1 text-xs font-bold text-text-muted">
                        {activeLandmark.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-text-muted opacity-40 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} />
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                  <div className="relative h-48 md:h-56">
                    <motion.div
                      drag={activeLandmark && activeLandmark.gallery.length > 1 ? 'x' : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={handleGalleryDragEnd}
                      animate={{ x: `-${activeImageIndex * 100}%` }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      className="h-full flex"
                    >
                      {(activeLandmark?.gallery ?? []).map((image, index) => (
                        <div key={`${image}-${index}`} className="min-w-full h-full">
                          <img
                            src={image}
                            className="w-full h-full object-cover"
                            alt={activeLandmark?.title ?? 'Landmark'}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <button
                      onClick={handleCloseDiscovery}
                      className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/30 hover:bg-black/40 transition-colors"
                    >
                      <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-6">
                      <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.4em]">
                        {activeLandmark?.type === 'campus-landmark'
                          ? 'Campus Landmark'
                          : 'Historical Landmark'}
                      </div>
                      <h3 className="text-white text-3xl font-display font-bold">
                        {activeLandmark.title}
                      </h3>
                      {activeLandmark?.subtitle && (
                        <p className="mt-1 text-sm font-bold text-white/80">
                          {activeLandmark.subtitle}
                        </p>
                      )}
                    </div>
                    {(activeLandmark?.gallery.length ?? 0) > 1 && (
                      <div className="absolute bottom-4 right-6 flex items-center gap-2">
                        {activeLandmark?.gallery.map((image, index) => (
                          <button
                            key={`${image}-dot`}
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                              activeImageIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/50'
                            }`}
                            aria-label={`View landmark image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-sm text-text-muted leading-relaxed italic font-medium opacity-90">
                      {`"${activeLandmark.description}"`}
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={handleCloseDiscovery}
                        className="flex-1 btn-primary py-4 text-[10px] font-black tracking-[0.3em] shadow-xl uppercase"
                      >
                        Capture Moment
                      </button>
                      <button
                        onClick={handleAudioToggle}
                        className="w-14 h-14 rounded-2xl border-2 border-brand/10 flex items-center justify-center text-brand-dark bg-surface shadow-sm hover:bg-white transition-all"
                      >
                        {isAudioPlaying ? <PauseCircle size={24} /> : <Volume2 size={24} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Tracker;
