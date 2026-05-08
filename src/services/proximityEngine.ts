import { useEffect, useMemo, useState } from 'react';
import { LandmarkEntry } from '../data/landmarks';
import { GeoPoint, CulturalRoute } from '../domain/routes';
import { LocationSource } from './useLocationService';

export interface LandmarkDistance {
  landmark: LandmarkEntry;
  distanceMeters: number;
  isWithinRadius: boolean;
}

interface ProximityEngineOptions {
  coords: GeoPoint;
  route: CulturalRoute;
  source: LocationSource;
  enabled: boolean;
}

const metersBetween = (start: GeoPoint, end: GeoPoint) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;

  const latDiff = toRadians(end.latitude - start.latitude);
  const lonDiff = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
};

export const useProximityTriggerEngine = ({
  coords,
  route,
  source,
  enabled,
}: ProximityEngineOptions) => {
  const [triggeredLandmarkIds, setTriggeredLandmarkIds] = useState<string[]>([]);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);

  useEffect(() => {
    setTriggeredLandmarkIds([]);
    setActiveLandmarkId(null);
  }, [route.id]);

  const landmarkDistances = useMemo<LandmarkDistance[]>(
    () =>
      route.landmarks
        .map((landmark) => {
          const distanceMeters = metersBetween(coords, {
            latitude: landmark.lat,
            longitude: landmark.lng,
          });

          return {
            landmark,
            distanceMeters,
            isWithinRadius: distanceMeters <= landmark.triggerRadius,
          };
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters),
    [coords.latitude, coords.longitude, route.landmarks],
  );

  const nearbyLandmarks = useMemo(
    () => landmarkDistances.filter((entry) => entry.isWithinRadius),
    [landmarkDistances],
  );

  useEffect(() => {
    if (!enabled || source === 'fallback') {
      return;
    }

    const nextTrigger = nearbyLandmarks.find(
      (entry) => !triggeredLandmarkIds.includes(entry.landmark.id),
    );

    if (!nextTrigger) {
      return;
    }

    setTriggeredLandmarkIds((prev) => [...prev, nextTrigger.landmark.id]);
    setActiveLandmarkId(nextTrigger.landmark.id);
  }, [enabled, nearbyLandmarks, source, triggeredLandmarkIds]);

  const activeLandmark =
    route.landmarks.find((landmark) => landmark.id === activeLandmarkId) ?? null;
  const closestLandmark = landmarkDistances[0] ?? null;

  return {
    activeLandmark,
    activeLandmarkId,
    nearbyLandmarks,
    closestLandmark,
    triggeredLandmarkIds,
    canTrigger: source !== 'fallback' && nearbyLandmarks.length > 0,
    hasTriggered: triggeredLandmarkIds.length > 0,
  };
};
