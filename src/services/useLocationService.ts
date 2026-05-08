import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GeoPoint } from '../domain/routes';

export type LocationStatus =
  | 'idle'
  | 'controlled'
  | 'checking-permission'
  | 'requesting'
  | 'watching'
  | 'success'
  | 'denied'
  | 'timeout'
  | 'unavailable'
  | 'insecure-context'
  | 'error';

export type LocationPermissionState = PermissionState | 'unsupported' | 'unknown';
export type LocationSource = 'gps' | 'fallback' | 'controlled';

export interface LocationAttemptLog {
  kind: string;
  status: 'started' | 'success' | 'error' | 'waiting';
  message?: string;
  code?: number;
  accuracy?: number;
  timestamp: string;
}

export interface LocationDiagnostics {
  secureContext: boolean;
  protocol: string;
  hostname: string;
  hasGeolocation: boolean;
  userAgent: string;
  attempts: LocationAttemptLog[];
}

interface LocationServiceOptions {
  fallbackCoords: GeoPoint;
  controlledCoords?: GeoPoint | null;
  watch?: boolean;
}

interface LocationSnapshot {
  permissionState: LocationPermissionState;
  locationStatus: LocationStatus;
  currentCoords: GeoPoint;
  lastKnownCoords: GeoPoint | null;
  source: LocationSource;
  isFallbackActive: boolean;
  isRecoveringGps: boolean;
  errorMessage: string | null;
  diagnostics: LocationDiagnostics;
  retryLocation: () => void;
}

const classifyGeoError = (error: GeolocationPositionError): LocationStatus => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'denied';
  }

  if (error.code === error.TIMEOUT) {
    return 'timeout';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'unavailable';
  }

  return 'error';
};

const toCoords = (position: GeolocationPosition): GeoPoint => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
});

export const useLocationService = ({
  fallbackCoords,
  controlledCoords = null,
  watch = true,
}: LocationServiceOptions): LocationSnapshot => {
  const [permissionState, setPermissionState] =
    useState<LocationPermissionState>('unknown');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [currentCoords, setCurrentCoords] = useState<GeoPoint>(
    controlledCoords ?? fallbackCoords,
  );
  const [lastKnownCoords, setLastKnownCoords] = useState<GeoPoint | null>(null);
  const [source, setSource] = useState<LocationSource>(
    controlledCoords ? 'controlled' : 'fallback',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<LocationAttemptLog[]>([]);
  const [requestNonce, setRequestNonce] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const preciseWatchIdRef = useRef<number | null>(null);
  const lastKnownCoordsRef = useRef<GeoPoint | null>(null);

  const fallbackLatitude = fallbackCoords.latitude;
  const fallbackLongitude = fallbackCoords.longitude;
  const controlledLatitude = controlledCoords?.latitude ?? null;
  const controlledLongitude = controlledCoords?.longitude ?? null;

  useEffect(() => {
    lastKnownCoordsRef.current = lastKnownCoords;
  }, [lastKnownCoords]);

  const pushAttempt = useCallback((attempt: Omit<LocationAttemptLog, 'timestamp'>) => {
    setAttempts((prev) => [
      ...prev.slice(-9),
      {
        ...attempt,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const retryLocation = useCallback(() => {
    setAttempts([]);
    setRequestNonce((prev) => prev + 1);
  }, []);

  const activateFallback = useCallback(
    (status: LocationStatus, message: string | null) => {
      setCurrentCoords({ latitude: fallbackLatitude, longitude: fallbackLongitude });
      setSource('fallback');
      setLocationStatus(status);
      setErrorMessage(message);
    },
    [fallbackLatitude, fallbackLongitude],
  );

  const applyGpsPosition = useCallback((position: GeolocationPosition) => {
    const nextCoords = toCoords(position);
    setCurrentCoords(nextCoords);
    setLastKnownCoords(nextCoords);
    setSource('gps');
    setLocationStatus('success');
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (controlledCoords) {
      setCurrentCoords(controlledCoords);
      setSource('controlled');
      setLocationStatus('controlled');
      setErrorMessage(null);
      return;
    }

    if (source === 'controlled') {
      setCurrentCoords({ latitude: fallbackLatitude, longitude: fallbackLongitude });
      setSource('fallback');
      setLocationStatus('idle');
    }
  }, [
    controlledCoords,
    controlledLatitude,
    controlledLongitude,
    fallbackLatitude,
    fallbackLongitude,
    source,
  ]);

  useEffect(() => {
    if (controlledCoords) {
      return;
    }

    const secureContext =
      typeof window === 'undefined'
        ? true
        : window.isSecureContext ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';
    const hasGeolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator;

    if (!secureContext) {
      setPermissionState('unknown');
      activateFallback('insecure-context', 'Location requires HTTPS or localhost.');
      return;
    }

    if (!hasGeolocation) {
      setPermissionState('unsupported');
      activateFallback('unavailable', 'Geolocation is not supported on this device.');
      return;
    }

    let cancelled = false;

    const clearWatches = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (preciseWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(preciseWatchIdRef.current);
        preciseWatchIdRef.current = null;
      }
    };

    const requestPermissionAndLocation = async () => {
      setLocationStatus('checking-permission');
      setErrorMessage(null);

      try {
        if (!('permissions' in navigator) || !navigator.permissions?.query) {
          setPermissionState('unknown');
        } else {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (cancelled) {
            return;
          }
          setPermissionState(status.state);
          status.onchange = () => setPermissionState(status.state);
        }
      } catch {
        setPermissionState('unknown');
      }

      if (cancelled) {
        return;
      }

      setLocationStatus('requesting');

      const requestPosition = (
        kind: string,
        options: PositionOptions,
        onError?: (error: GeolocationPositionError) => void,
      ) => {
        pushAttempt({ kind, status: 'started' });
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) {
              return;
            }

            pushAttempt({
              kind,
              status: 'success',
              accuracy: position.coords.accuracy,
            });
            applyGpsPosition(position);
          },
          (error) => {
            if (cancelled) {
              return;
            }

            pushAttempt({
              kind,
              status: 'error',
              message: error.message,
              code: error.code,
            });
            onError?.(error);
          },
          options,
        );
      };

      requestPosition(
        'cached-position',
        {
          enableHighAccuracy: false,
          maximumAge: 60_000,
          timeout: 1_500,
        },
        () => {
          // Let later requests and watchers continue quietly.
        },
      );

      requestPosition(
        'initial-position',
        {
          enableHighAccuracy: false,
          maximumAge: 5_000,
          timeout: 6_000,
        },
        (error) => {
          if (watch) {
            setLocationStatus('watching');
            if (!lastKnownCoordsRef.current) {
              activateFallback(
                classifyGeoError(error),
                error.message || 'Location request timed out.',
              );
            }
            return;
          }

          activateFallback(classifyGeoError(error), error.message || 'Unable to get location.');
        },
      );

      if (!watch) {
        return;
      }

      setLocationStatus('watching');

      const onWatchSuccess = (position: GeolocationPosition) => {
        if (cancelled) {
          return;
        }

        pushAttempt({
          kind: 'watch-position',
          status: 'success',
          accuracy: position.coords.accuracy,
        });
        applyGpsPosition(position);
      };

      const onWatchError = (error: GeolocationPositionError) => {
        if (cancelled) {
          return;
        }

        pushAttempt({
          kind: 'watch-position',
          status: 'error',
          message: error.message,
          code: error.code,
        });

        const nextStatus = classifyGeoError(error);
        setLocationStatus(nextStatus === 'timeout' ? 'watching' : nextStatus);
        setErrorMessage(error.message || 'Live GPS is still retrying.');

        if (lastKnownCoordsRef.current) {
          setCurrentCoords(lastKnownCoordsRef.current);
          setSource('gps');
          return;
        }

        setCurrentCoords({ latitude: fallbackLatitude, longitude: fallbackLongitude });
        setSource('fallback');
      };

      watchIdRef.current = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
        enableHighAccuracy: false,
        maximumAge: 10_000,
        timeout: 12_000,
      });

      preciseWatchIdRef.current = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20_000,
      });
    };

    void requestPermissionAndLocation();

    return () => {
      cancelled = true;
      clearWatches();
    };
  }, [
    activateFallback,
    applyGpsPosition,
    controlledCoords,
    fallbackLatitude,
    fallbackLongitude,
    pushAttempt,
    requestNonce,
    watch,
  ]);

  const diagnostics = useMemo<LocationDiagnostics>(
    () => ({
      secureContext:
        typeof window === 'undefined'
          ? true
          : window.isSecureContext ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1',
      protocol: typeof window === 'undefined' ? 'https:' : window.location.protocol,
      hostname: typeof window === 'undefined' ? 'server' : window.location.hostname,
      hasGeolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
      userAgent: typeof navigator === 'undefined' ? 'server' : navigator.userAgent,
      attempts,
    }),
    [attempts],
  );

  const isRecoveringGps =
    permissionState === 'granted' &&
    source === 'fallback' &&
    (locationStatus === 'watching' ||
      locationStatus === 'requesting' ||
      locationStatus === 'timeout' ||
      locationStatus === 'unavailable' ||
      locationStatus === 'error');

  return useMemo(
    () => ({
      permissionState,
      locationStatus,
      currentCoords,
      lastKnownCoords,
      source,
      isFallbackActive: source === 'fallback',
      isRecoveringGps,
      errorMessage,
      diagnostics,
      retryLocation,
    }),
    [
      currentCoords,
      diagnostics,
      errorMessage,
      isRecoveringGps,
      lastKnownCoords,
      locationStatus,
      permissionState,
      retryLocation,
      source,
    ],
  );
};
